import type { CardId, QueueItemId } from "@/types/database";

/**
 * Queue item for anonymous message submission.
 * All content is hashed (HMAC) for privacy-preserving auditing.
 */
export interface QueueSubmission {
  readonly id: QueueItemId;
  readonly cardId: CardId;
  readonly contentHmac: string;
  readonly contentHash: string;
  readonly sessionHmac: string;
  readonly idempotencyKey: string;
  readonly receiptHash: string;
  readonly enqueuedAt: number;
}

/**
 * Receipt returned to submitter after successful enqueue.
 * Contains HMAC proof for later verification.
 */
export interface SubmissionReceipt {
  readonly receiptId: string;
  readonly receiptHmac: string;
  readonly queuedAt: number;
  readonly estimatedPublishAt: number;
}

/**
 * Submission request from anonymous user.
 */
export interface SubmissionRequest {
  readonly cardId: string;
  readonly content: string;
  readonly sessionToken: string;
  readonly idempotencyKey: string;
  readonly ip: string;
}

/**
 * Submission result (success or failure).
 */
export type SubmissionResult =
  | { readonly success: true; readonly receipt: SubmissionReceipt }
  | { readonly success: false; readonly error: SubmissionError };

export interface SubmissionError {
  readonly code:
    | "GLOBAL_LOCKOUT"
    | "RATE_LIMITED"
    | "DUPLICATE"
    | "CARD_NOT_FOUND"
    | "CONTENT_TOO_LONG"
    | "INVALID_INPUT";
  readonly message: string;
}
