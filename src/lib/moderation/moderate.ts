import { recordAuditEvent } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase";
import type { ModerationAction, ModerationResult } from "./types";

function auditAction(
  action: ModerationAction,
): "message_approved" | "message_rejected" | "message_deleted" {
  return action === "approve"
    ? "message_approved"
    : action === "delete"
      ? "message_deleted"
      : "message_rejected";
}

/**
 * Moderate a message.
 *
 * @param messageId - Message to moderate
 * @param action - Moderation action
 * @param adminId - Admin performing action
 * @param reason - Reason for action
 * @returns Moderation result
 */
export async function moderateMessage(
  messageId: string,
  action: ModerationAction,
  adminId: string,
  reason?: string,
): Promise<ModerationResult> {
  const supabase = createAdminClient();

  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, card_id")
    .eq("id", messageId)
    .single();

  if (fetchError || !message) {
    throw new Error("Message not found");
  }

  let newStatus: string;
  switch (action) {
    case "approve":
      newStatus = "published";
      break;
    case "reject":
      newStatus = "rejected";
      break;
    case "delete":
      newStatus = "deleted";
      break;
    case "flag":
      newStatus = "flagged";
      break;
  }

  const { error: updateError } = await supabase
    .from("messages")
    .update({ status: newStatus })
    .eq("id", messageId);

  if (updateError) {
    throw new Error(`Failed to moderate message: ${updateError.message}`);
  }

  await recordAuditEvent({
    actorId: adminId,
    action: auditAction(action),
    entityType: "message",
    entityId: messageId,
    context: { reason, cardId: message.card_id },
    timestamp: Date.now(),
  });

  return {
    action,
    messageId,
    ...(reason === undefined ? {} : { reason }),
    moderatedBy: adminId,
    moderatedAt: Date.now(),
  };
}

/**
 * Get messages for moderation queue.
 *
 * @param status - Filter by status
 * @param limit - Max messages to return
 * @returns Messages for moderation
 */
export async function getModerationQueue(status = "pending", limit = 50) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*, cards!inner (id, name)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch moderation queue: ${error.message}`);
  }

  return data;
}
