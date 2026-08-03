import { recordAuditEvent, recordSecurityEvent } from "@/lib/audit";
import { getRedis } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase";
import type { ReportDetails, ReportReason, ReportStatus, ReportSubmissionRequest } from "./types";

const REPORT_RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 3,
  keyPrefix: "rl:report",
} as const;

const reportReasons: Record<ReportReason, string> = {
  spam: "spam",
  abuse: "odio",
  inappropriate: "sexual",
  other: "outro",
};

const reportStatuses: Record<ReportStatus, string> = {
  pending: "open",
  reviewed: "reviewing",
  resolved: "resolved",
  dismissed: "dismissed",
};

function toPublicReason(reason: unknown): ReportReason {
  switch (reason) {
    case "spam":
      return "spam";
    case "odio":
      return "abuse";
    case "sexual":
      return "inappropriate";
    default:
      return "other";
  }
}

function toPublicStatus(status: unknown): ReportStatus {
  switch (status) {
    case "open":
    case "pending":
      return "pending";
    case "reviewing":
    case "reviewed":
      return "reviewed";
    case "resolved":
      return "resolved";
    case "dismissed":
      return "dismissed";
    default:
      return "pending";
  }
}

function isSelfReport(data: unknown, sessionHmac: string): boolean {
  if (typeof data !== "object" || data === null || !("session_hmac" in data)) {
    return false;
  }

  return data.session_hmac === sessionHmac;
}

/**
 * Submit a report.
 *
 * @param request - Report submission request
 * @param sessionHmac - Reporter's session HMAC
 * @returns Report details
 */
export async function submitReport(
  request: ReportSubmissionRequest,
  sessionHmac: string,
): Promise<ReportDetails> {
  const supabase = createAdminClient();
  const redis = getRedis();

  const rateKey = `${REPORT_RATE_LIMIT.keyPrefix}:${sessionHmac}`;
  const count = await redis.incr(rateKey);

  if (count === 1) {
    await redis.expire(rateKey, Math.ceil(REPORT_RATE_LIMIT.windowMs / 1000));
  }

  if (count > REPORT_RATE_LIMIT.maxRequests) {
    throw new Error("Too many reports. Please try again later.");
  }

  const { data: existing } = await supabase
    .from("reports")
    .select("id, status")
    .eq("message_id", request.messageId)
    .single();

  if (
    existing &&
    (typeof existing.status !== "string" ||
      ["open", "reviewing", "pending", "reviewed"].includes(existing.status))
  ) {
    throw new Error("This message has already been reported");
  }

  const { data: author } = await supabase
    .from("queue_items")
    .select("session_hmac")
    .eq("published_message_id", request.messageId)
    .single();

  if (isSelfReport(author, sessionHmac)) {
    throw new Error("You cannot report your own message");
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      message_id: request.messageId,
      reporter_session_hmac: sessionHmac,
      reason: reportReasons[request.reason],
      ...(request.details === undefined ? {} : { details: request.details }),
      status: "open",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to submit report: ${error?.message ?? "Unknown error"}`);
  }

  const reportData = data as {
    id: string;
    message_id?: string;
    card_id?: string;
    reason?: string;
    reason_code?: string;
    status?: string;
    created_at: string | Date;
  };

  await recordSecurityEvent({
    type: "report_submitted",
    severity: "info",
    context: {
      reportId: reportData.id,
      messageId: request.messageId,
      reason: request.reason,
      sessionHmac,
    },
    timestamp: Date.now(),
  });

  return {
    id: reportData.id,
    messageId: reportData.message_id ?? request.messageId,
    cardId: reportData.card_id ?? request.cardId,
    reason: toPublicReason(reportData.reason ?? reportData.reason_code ?? request.reason),
    status: toPublicStatus(reportData.status),
    createdAt: new Date(reportData.created_at),
  };
}

/**
 * Get reports for review.
 *
 * @param status - Filter by status
 * @param limit - Max reports to return
 * @returns Reports for review
 */
export async function getReportsForReview(status: ReportStatus = "pending", limit = 50) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*, cards!inner (id, name), messages!inner (id, content_hmac, status)")
    .eq("status", reportStatuses[status])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return data;
}

/**
 * Resolve a report.
 *
 * @param reportId - Report ID
 * @param status - New status
 * @param adminId - Admin performing action
 */
export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed",
  adminId: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: reportStatuses[status],
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Failed to resolve report: ${error.message}`);
  }

  await recordAuditEvent({
    actorId: adminId,
    action: "report_resolved",
    entityType: "report",
    entityId: reportId,
    context: { status },
    timestamp: Date.now(),
  });
}
