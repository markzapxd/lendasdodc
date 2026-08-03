import { createAdminClient } from "@/lib/supabase";
import type { AuditEvent, SecurityEvent } from "./types";

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Record an audit event.
 *
 * Audit persistence is deliberately non-blocking for the operation that
 * produced the event.
 */
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_log").insert({
      actor_id: event.actorId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      context_json: event.context,
    });

    if (error) {
      console.error("Failed to record audit event:", error);
    }
  } catch (error) {
    console.error("Failed to record audit event:", asError(error));
  }
}

/**
 * Record a security event.
 *
 * Security persistence is deliberately non-blocking for the operation that
 * produced the event.
 */
export async function recordSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("security_events").insert({
      event_type: event.type,
      severity: event.severity,
      context_json: event.context,
    });

    if (error) {
      console.error("Failed to record security event:", error);
    }
  } catch (error) {
    console.error("Failed to record security event:", asError(error));
  }
}

/**
 * Record an admin login attempt.
 */
export async function recordLoginAttempt(
  adminId: string,
  success: boolean,
  ip: string,
  userAgent: string,
): Promise<void> {
  const action = success ? "admin_login_success" : "admin_login_failed";
  const timestamp = Date.now();

  await recordAuditEvent({
    actorId: adminId,
    action,
    entityType: "admin_user",
    entityId: adminId,
    context: { ip, userAgent },
    timestamp,
  });

  await recordSecurityEvent({
    type: action,
    severity: success ? "info" : "warning",
    context: { adminId, ip, userAgent },
    timestamp,
  });
}

/**
 * Record a message moderation action.
 */
export async function recordModerationAction(
  adminId: string,
  messageId: string,
  action: "message_approved" | "message_rejected" | "message_deleted",
  reason?: string,
): Promise<void> {
  await recordAuditEvent({
    actorId: adminId,
    action,
    entityType: "message",
    entityId: messageId,
    context: { reason },
    timestamp: Date.now(),
  });
}

export type { AuditAction, AuditEvent, SecurityEvent, SecuritySeverity } from "./types";
