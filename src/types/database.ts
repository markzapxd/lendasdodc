/**
 * Database types for Lendas do DC.
 *
 * Generated from supabase/migrations/*.sql and kept separate from the
 * Supabase CLI artifact in database.generated.ts.
 */

import type { AdminId, CardId, MessageId, QueueItemId, ReportId, SessionId } from "@/lib/ids";

export type { CardId, QueueItemId } from "@/lib/ids";

export type AdminUserId = AdminId;
export type AdminSessionId = SessionId;

export type CardStatus = "active" | "archived" | "hidden" | "deleted";
export type MessageStatus = "published" | "removed";
export type QueueStatus = "pending" | "processing" | "published" | "rejected" | "expired";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ReportReason =
  | "assedio"
  | "odio"
  | "dados_pessoais"
  | "spam"
  | "sexual"
  | "ameaca"
  | "informacao_falsa"
  | "outro";
export type AdminSessionStatus = "active" | "revoked" | "expired";
export type SecurityEventSeverity = "info" | "warning" | "error" | "critical";

export interface Card {
  readonly id: CardId;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly image_url: string | null;
  readonly image_alt: string | null;
  readonly status: CardStatus;
  readonly message_count: number;
  readonly last_activity_at: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export interface CardSlugAlias {
  readonly id: string;
  readonly card_id: CardId;
  readonly old_slug: string;
  readonly created_at: Date;
}

export interface Message {
  readonly id: MessageId;
  readonly card_id: CardId;
  readonly content: string | null;
  readonly nickname: string | null;
  readonly status: MessageStatus;
  readonly published_at: Date;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export interface PlatformState {
  readonly id: string;
  readonly configured_interval_ms: number;
  readonly emergency_mode: boolean;
  readonly degraded_mode: boolean;
  readonly last_published_at: Date | null;
  readonly updated_at: Date;
}

export interface QueueItem {
  readonly id: QueueItemId;
  readonly session_hmac: string;
  readonly session_key_version: number;
  readonly content_hash: string;
  readonly content_preview: string | null;
  readonly card_id: CardId;
  readonly nickname: string | null;
  readonly enqueue_seq: number;
  readonly status: QueueStatus;
  readonly status_version: number;
  readonly idempotency_key: string;
  readonly receipt_hash: string;
  readonly created_at: Date;
  readonly expires_at: Date;
  readonly processing_started_at: Date | null;
  readonly published_message_id: MessageId | null;
  readonly rejection_reason: string | null;
  readonly ip_tag_hmac: string | null;
  readonly content_hmac: string;
}

export interface Report {
  readonly id: ReportId;
  readonly message_id: MessageId;
  readonly reporter_session_hmac: string;
  readonly reporter_ip_tag_hmac: string | null;
  readonly reason: ReportReason;
  readonly details: string | null;
  readonly status: ReportStatus;
  readonly status_version: number;
  readonly resolved_by: AdminUserId | null;
  readonly resolved_at: Date | null;
  readonly resolution_reason: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export interface AdminUser {
  readonly id: AdminUserId;
  readonly username: string;
  readonly password_hash: string;
  readonly totp_encrypted_seed: string;
  readonly totp_key_version: number;
  readonly totp_last_used_step: number | null;
  readonly recovery_codes_hash: readonly string[];
  readonly is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export interface AdminSession {
  readonly id: AdminSessionId;
  readonly admin_id: AdminUserId;
  readonly session_token_hash: string;
  readonly csrf_token_hash: string;
  readonly password_assured_at: Date;
  readonly totp_assured_at: Date | null;
  readonly status: AdminSessionStatus;
  readonly created_at: Date;
  readonly last_activity_at: Date;
  readonly expires_at: Date;
  readonly ip_tag_hmac: string | null;
  readonly user_agent: string | null;
}

export interface AbuseBucket {
  readonly id: string;
  readonly bucket_key: string;
  readonly bucket_type: "session" | "ip_tag" | "content";
  readonly count: number;
  readonly window_start: Date;
  readonly blocked_until: Date | null;
  readonly key_version: number;
}

export interface SecurityEvent {
  readonly id: string;
  readonly event_type: string;
  readonly severity: SecurityEventSeverity;
  readonly admin_id: AdminUserId | null;
  readonly session_id: AdminSessionId | null;
  readonly ip_tag_hmac: string | null;
  readonly metadata: Record<string, unknown>;
  readonly created_at: Date;
}

export interface AuditLog {
  readonly id: string;
  readonly admin_id: AdminUserId | null;
  readonly session_id: AdminSessionId | null;
  readonly action: string;
  readonly resource_type: string;
  readonly resource_id: string | null;
  readonly old_values: Record<string, unknown> | null;
  readonly new_values: Record<string, unknown> | null;
  readonly metadata: Record<string, unknown>;
  readonly created_at: Date;
}

export interface Database {
  readonly api: {
    readonly cards: Card;
    readonly messages: Message;
    readonly card_slug_aliases: CardSlugAlias;
    readonly platform_state: PlatformState;
  };
  readonly private: {
    readonly queue_items: QueueItem;
    readonly reports: Report;
    readonly admin_users: AdminUser;
    readonly admin_sessions: AdminSession;
    readonly abuse_buckets: AbuseBucket;
    readonly security_events: SecurityEvent;
    readonly audit_log: AuditLog;
    readonly idempotency_keys: unknown;
    readonly processed_deliveries: unknown;
    readonly dispatch_outbox: unknown;
    readonly publication_gate: unknown;
    readonly alert_outbox: unknown;
    readonly retention_ledger: unknown;
    readonly totp_steps: unknown;
    readonly recovery_codes_used: unknown;
    readonly migration_ledger: unknown;
  };
}
