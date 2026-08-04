import "server-only";

import { createAdminClient } from "@/lib/supabase";

const CARD_AUDIT_ACTIONS = ["card.create", "card.update", "card.archive", "card.restore"] as const;

type CardAuditAction = (typeof CARD_AUDIT_ACTIONS)[number];

interface CardAuditEvent {
  readonly adminId: string;
  readonly action: CardAuditAction;
  readonly cardId: string;
  readonly oldValues?: Record<string, unknown>;
  readonly newValues?: Record<string, unknown>;
}

export async function recordCardAuditEvent(event: CardAuditEvent): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .schema("private")
      .from("audit_log")
      .insert({
        admin_id: event.adminId,
        action: event.action,
        resource_type: "card",
        resource_id: event.cardId,
        old_values: event.oldValues ?? null,
        new_values: event.newValues ?? null,
        metadata: {},
      });

    if (error) {
      console.error("Failed to record card audit event:", error);
    }
  } catch (error) {
    console.error("Failed to record card audit event:", error);
  }
}
