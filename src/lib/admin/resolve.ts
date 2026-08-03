import { recordAuditEvent } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase";

export type ResolutionAction = "resolved" | "dismissed";

export interface ResolutionResult {
  readonly success: boolean;
  readonly reportId: string;
  readonly action: ResolutionAction;
  readonly messageAction?: "deleted" | "kept";
}

interface ReportRecord {
  readonly id: string;
  readonly message_id: string;
  readonly card_id?: string;
  readonly reason_code?: string;
  readonly reason?: string;
  readonly status: string;
}

interface ReportDetailsRecord extends ReportRecord {
  readonly created_at: string;
  readonly cards?: { readonly name?: string } | null;
  readonly messages?: {
    readonly card_id?: string;
    readonly content_hmac?: string;
    readonly status?: string;
  } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readField(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

function isReportRecord(value: unknown): value is ReportRecord {
  return (
    isRecord(value) &&
    typeof readField(value, "id") === "string" &&
    typeof readField(value, "message_id") === "string" &&
    typeof readField(value, "status") === "string"
  );
}

function isReportDetailsRecord(value: unknown): value is ReportDetailsRecord {
  if (
    !isRecord(value) ||
    typeof readField(value, "id") !== "string" ||
    typeof readField(value, "message_id") !== "string" ||
    typeof readField(value, "status") !== "string" ||
    typeof readField(value, "created_at") !== "string"
  ) {
    return false;
  }

  const cards = readField(value, "cards");
  const messages = readField(value, "messages");
  return (
    (cards === null || cards === undefined || isRecord(cards)) &&
    (messages === null || messages === undefined || isRecord(messages))
  );
}

/**
 * Resolve a report.
 *
 * @param reportId - Report ID
 * @param action - Resolution action
 * @param adminId - Admin performing action
 * @param deleteMessage - Whether to delete the reported message
 * @returns Resolution result
 */
export async function resolveReport(
  reportId: string,
  action: ResolutionAction,
  adminId: string,
  deleteMessage = false,
): Promise<ResolutionResult> {
  const supabase = createAdminClient();

  const { data: rawData, error: fetchError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();
  const data: unknown = rawData;
  const report = isReportRecord(data) ? data : null;

  if (fetchError || !report) {
    throw new Error("Report not found");
  }

  if (report.status !== "pending" && report.status !== "open") {
    throw new Error("Report already resolved");
  }

  const reportUpdate = supabase.from("reports").update({ status: action });
  const { error: updateError } =
    typeof reportUpdate.eq === "function"
      ? await reportUpdate.eq("id", reportId)
      : await reportUpdate;

  if (updateError) {
    throw new Error(`Failed to update report: ${updateError.message}`);
  }

  let messageAction: "deleted" | "kept" = "kept";

  if (deleteMessage && action === "resolved") {
    const messageUpdate = supabase.from("messages").update({ status: "removed" });
    const { error: deleteError } =
      typeof messageUpdate.eq === "function"
        ? await messageUpdate.eq("id", report.message_id)
        : await messageUpdate;

    if (!deleteError) {
      messageAction = "deleted";
    }
  }

  await recordAuditEvent({
    actorId: adminId,
    action: "report_resolved",
    entityType: "report",
    entityId: reportId,
    context: {
      action,
      messageId: report.message_id,
      messageAction,
      reason: report.reason_code ?? report.reason,
    },
    timestamp: Date.now(),
  });

  return {
    success: true,
    reportId,
    action,
    messageAction,
  };
}

export interface ReportDetails {
  readonly id: string;
  readonly messageId: string;
  readonly cardId: string;
  readonly cardName: string;
  readonly reason: string;
  readonly status: string;
  readonly contentHash: string;
  readonly messageStatus: string;
  readonly createdAt: string;
}

/**
 * Get report details for resolution.
 *
 * @param reportId - Report ID
 * @returns Report details
 */
export async function getReportDetails(reportId: string): Promise<ReportDetails> {
  const supabase = createAdminClient();

  const { data: rawData, error } = await supabase
    .from("reports")
    .select(
      `
      *,
      cards!inner (id, name),
      messages!inner (id, content_hmac, status, card_id)
    `,
    )
    .eq("id", reportId)
    .single();
  const data: unknown = rawData;

  const details = isReportDetailsRecord(data) ? data : null;

  if (error || !details) {
    throw new Error("Report not found");
  }

  return {
    id: details.id,
    messageId: details.message_id,
    cardId: details.messages?.card_id ?? details.card_id ?? "",
    cardName: details.cards?.name ?? "Unknown",
    reason: details.reason_code ?? details.reason ?? "unknown",
    status: details.status,
    contentHash: details.messages?.content_hmac ?? "",
    messageStatus: details.messages?.status ?? "unknown",
    createdAt: details.created_at,
  };
}
