/**
 * Abuse event types for scoring.
 */
export type AbuseEventType =
  | "submission"
  | "report"
  | "rate_limit_hit"
  | "duplicate_submission"
  | "invalid_input";

/**
 * Abuse event for scoring.
 */
export interface AbuseEvent {
  readonly type: AbuseEventType;
  readonly sessionHmac: string;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Abuse score result.
 */
export interface AbuseScore {
  /** Current abuse score (0-100) */
  readonly score: number;
  /** Whether request should be blocked */
  readonly blocked: boolean;
  /** Reason for blocking (if applicable) */
  readonly reason?: string;
  /** Time until score resets (ms) */
  readonly resetsIn: number;
}

/**
 * Abuse threshold configuration.
 */
export const ABUSE_THRESHOLDS = {
  /** Score at which requests are blocked */
  blockThreshold: 80,
  /** Score increment per event type */
  increments: {
    submission: 1,
    report: 2,
    rate_limit_hit: 10,
    duplicate_submission: 5,
    invalid_input: 3,
  },
  /** Window for abuse scoring (1 hour) */
  windowMs: 60 * 60 * 1000,
} as const;
