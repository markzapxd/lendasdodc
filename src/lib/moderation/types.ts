/**
 * Moderation action types.
 */
export type ModerationAction = "approve" | "reject" | "delete" | "flag";

/**
 * Message moderation result.
 */
export interface ModerationResult {
  action: ModerationAction;
  messageId: string;
  reason?: string;
  moderatedBy: string;
  moderatedAt: number;
}

/**
 * Report reason codes.
 */
export type ReportReason = "spam" | "abuse" | "inappropriate" | "other";

/**
 * Report submission request.
 */
export interface ReportSubmissionRequest {
  messageId: string;
  cardId: string;
  reason: ReportReason;
  details?: string;
}

/**
 * Report status.
 */
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

/**
 * Report with details.
 */
export interface ReportDetails {
  id: string;
  messageId: string;
  cardId: string;
  reason: ReportReason;
  status: ReportStatus;
  createdAt: Date;
}
