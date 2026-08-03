import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import { getTokenFromCookie, validateAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

export interface ReportFilters {
  readonly status?: string;
  readonly cardId?: string;
  readonly reason?: string;
  readonly sort?: "newest" | "oldest";
  readonly page?: number;
  readonly limit?: number;
}

export interface ReportWithDetails {
  readonly id: string;
  readonly messageId: string;
  readonly cardId: string;
  readonly cardName: string;
  readonly reason: string;
  readonly status: string;
  readonly contentHash: string;
  readonly createdAt: string;
}

export interface ReportsResult {
  readonly reports: ReportWithDetails[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

const reportRowSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  reason: z.string(),
  status: z.string(),
  created_at: z.coerce.date(),
});

const messageRowSchema = z.object({
  id: z.string(),
  card_id: z.string(),
  content_hmac: z.string().optional(),
});

const cardRowSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const reportReasonCodes: Record<string, string> = {
  spam: "spam",
  abuse: "odio",
  inappropriate: "sexual",
  other: "outro",
} as const;

const reportStatusLabels: Record<string, string> = {
  open: "pending",
  reviewing: "reviewed",
  resolved: "resolved",
  dismissed: "dismissed",
} as const;

async function getMessageIdsForCard(cardId: string): Promise<readonly string[]> {
  const { data, error } = await createAdminClient()
    .schema("api")
    .from("messages")
    .select("id")
    .eq("card_id", cardId);

  if (error) {
    throw new Error(`Failed to fetch messages for card: ${error.message}`);
  }

  return z
    .object({ id: z.string() })
    .array()
    .parse(data ?? [])
    .map((message) => message.id);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = getTokenFromCookie(cookieStore.toString());
  if (!token) {
    return false;
  }

  return (await validateAdminSession(token)) !== null;
}

export async function getReports(filters: ReportFilters = {}): Promise<ReportsResult> {
  const requestedPage = filters.page ?? 1;
  const requestedLimit = filters.limit ?? 20;
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
  const offset = (page - 1) * limit;

  let query = createAdminClient()
    .schema("private")
    .from("reports")
    .select("id, message_id, reason, status, created_at", { count: "exact" });

  if (filters.status === "pending") {
    query = query.in("status", ["open", "reviewing"]);
  } else if (filters.status === "reviewed") {
    query = query.eq("status", "reviewing");
  } else if (filters.status === "resolved" || filters.status === "dismissed") {
    query = query.eq("status", filters.status);
  }

  const reasonCode = filters.reason ? reportReasonCodes[filters.reason] : undefined;
  if (reasonCode) {
    query = query.eq("reason", reasonCode);
  }

  if (filters.cardId) {
    const messageIds = await getMessageIdsForCard(filters.cardId);
    if (messageIds.length === 0) {
      return { reports: [], total: 0, page, limit, totalPages: 0 };
    }
    query = query.in("message_id", messageIds);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: filters.sort === "oldest" })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  const reportRows = reportRowSchema.array().parse(data ?? []);
  if (reportRows.length === 0) {
    return {
      reports: [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  const messageIds = reportRows.map((report) => report.message_id);
  const { data: messageData, error: messageError } = await createAdminClient()
    .schema("api")
    .from("messages")
    .select("id, card_id, content_hmac")
    .in("id", messageIds);

  if (messageError) {
    throw new Error(`Failed to fetch reported messages: ${messageError.message}`);
  }

  const messages = messageRowSchema.array().parse(messageData ?? []);
  const cardIds = [...new Set(messages.map((message) => message.card_id))];
  const { data: cardData, error: cardError } = await createAdminClient()
    .schema("api")
    .from("cards")
    .select("id, name")
    .in("id", cardIds);

  if (cardError) {
    throw new Error(`Failed to fetch reported cards: ${cardError.message}`);
  }

  const cards = cardRowSchema.array().parse(cardData ?? []);
  const messageById = new Map(messages.map((message) => [message.id, message]));
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const reports = reportRows.flatMap((report) => {
    const message = messageById.get(report.message_id);
    if (!message) {
      return [];
    }

    return [
      {
        id: report.id,
        messageId: report.message_id,
        cardId: message.card_id,
        cardName: cardById.get(message.card_id)?.name ?? "Desconhecido",
        reason: report.reason,
        status: reportStatusLabels[report.status] ?? report.status,
        contentHash: message.content_hmac ?? "",
        createdAt: report.created_at.toISOString(),
      },
    ];
  });

  return {
    reports,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getReportStats() {
  const supabase = createAdminClient().schema("private");
  const [{ count: pending }, { count: resolved }, { count: dismissed }] = await Promise.all([
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "dismissed"),
  ]);

  return {
    pending: pending ?? 0,
    resolved: resolved ?? 0,
    dismissed: dismissed ?? 0,
  };
}
