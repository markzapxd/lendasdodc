import { createHmac, timingSafeEqual } from "node:crypto";
import type { QueueSubmission, SubmissionReceipt } from "./types";

const { RECEIPT_HMAC_SECRET = "" } = process.env;
const RECEIPT_SECRET = RECEIPT_HMAC_SECRET;
const PUBLISH_ESTIMATE_MS = 60 * 60 * 1000;

/**
 * Generate a receipt for a queued submission.
 * The receipt contains an HMAC that can be used to verify
 * the submission was actually queued.
 */
export function generateReceipt(item: QueueSubmission): SubmissionReceipt {
  const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const receiptHmac = createHmac("sha256", RECEIPT_SECRET)
    .update(`${receiptId}:${item.contentHash}:${item.enqueuedAt}`)
    .digest("hex");

  return {
    receiptId,
    receiptHmac,
    queuedAt: item.enqueuedAt,
    estimatedPublishAt: item.enqueuedAt + PUBLISH_ESTIMATE_MS,
  };
}

/**
 * Verify a receipt HMAC.
 */
export function verifyReceipt(
  receiptId: string,
  contentHash: string,
  queuedAt: number,
  receiptHmac: string,
): boolean {
  const expectedHmac = createHmac("sha256", RECEIPT_SECRET)
    .update(`${receiptId}:${contentHash}:${queuedAt}`)
    .digest("hex");

  const providedBytes = Buffer.from(receiptHmac, "hex");
  const expectedBytes = Buffer.from(expectedHmac, "hex");
  return (
    providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes)
  );
}
