/**
 * Alert severity levels.
 */
export type AlertSeverity = "info" | "warning" | "error" | "critical";

/**
 * Alert for system issues.
 */
export interface Alert {
  /** Alert type */
  readonly type: string;
  /** Severity level */
  readonly severity: AlertSeverity;
  /** Alert message */
  readonly message: string;
  /** Additional context */
  readonly context: Record<string, unknown>;
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Alert configuration.
 */
export const ALERT_CONFIG = {
  /** Alert deduplication window (5 minutes) */
  deduplicationWindowMs: 5 * 60 * 1000,
  /** Maximum alerts per window */
  maxAlertsPerWindow: 10,
} as const;
