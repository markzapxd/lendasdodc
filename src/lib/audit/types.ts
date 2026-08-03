/**
 * Audit event action types.
 */
export type AuditAction =
  | "admin_created"
  | "admin_updated"
  | "admin_deleted"
  | "admin_login_success"
  | "admin_login_failed"
  | "message_approved"
  | "message_rejected"
  | "message_deleted"
  | "card_created"
  | "card_updated"
  | "card_deleted"
  | "report_created"
  | "report_reviewed"
  | "report_resolved"
  | "system_error"
  | "security_event";

/**
 * Audit event for logging.
 */
export interface AuditEvent {
  /** Actor performing the action */
  readonly actorId: string;
  /** Action performed */
  readonly action: AuditAction;
  /** Entity type affected */
  readonly entityType: string;
  /** Entity ID affected */
  readonly entityId: string;
  /** Additional context */
  readonly context: Record<string, unknown>;
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Security event severity levels.
 */
export type SecuritySeverity = "info" | "warning" | "error" | "critical";

/**
 * Security event for logging.
 */
export interface SecurityEvent {
  /** Event type */
  readonly type: string;
  /** Severity level */
  readonly severity: SecuritySeverity;
  /** Context */
  readonly context: Record<string, unknown>;
  /** Timestamp */
  readonly timestamp: number;
}
