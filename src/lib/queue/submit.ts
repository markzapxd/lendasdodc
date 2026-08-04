import { createHash, createHmac } from "node:crypto";
import { asCardId, asQueueItemId } from "@/lib/ids";
import {
  checkGlobalPanic,
  checkRateLimit,
  enqueueSubmission,
  RATE_LIMITS,
} from "@/lib/redis";
import { createAnonClient } from "@/lib/supabase";
import { checkIdempotency, storeIdempotency } from "./dedup";
import { generateReceipt } from "./receipt";
import type {
  QueueSubmission,
  SubmissionError,
  SubmissionRequest,
  SubmissionResult,
} from "./types";

const CONTENT_MAX_LENGTH = 500;
const { CONTENT_HMAC_SECRET = "", SESSION_HMAC_SECRET = "" } = process.env;

export async function handleSubmit(request: SubmissionRequest): Promise<SubmissionResult> {
  const validation = validateSubmission(request);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const globalPanic = await checkGlobalPanic(RATE_LIMITS.globalPanic);
  if (!globalPanic.allowed) {
    return {
      success: false,
      error: {
        code: "GLOBAL_LOCKOUT",
        message: `O sistema está temporariamente trancado devido ao alto volume de tráfego. Tente novamente em ${Math.ceil(globalPanic.lockoutRemainingSeconds / 60)} minutos.`,
      },
    };
  }

  const ipRateLimit = await checkRateLimit(request.ip, RATE_LIMITS.ipSubmission);
  if (!ipRateLimit.allowed) {
    return {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many submissions from this IP. Please try again later.",
      },
    };
  }

  const rateLimit = await checkRateLimit(request.sessionToken, RATE_LIMITS.submission);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many submissions. Please try again later.",
      },
    };
  }

  const isDuplicate = await checkIdempotency(request.idempotencyKey);
  if (isDuplicate) {
    return {
      success: false,
      error: {
        code: "DUPLICATE",
        message: "This submission has already been processed.",
      },
    };
  }

  const supabase = createAnonClient();
  const { data: card, error: cardError } = await supabase
    .schema("api")
    .from("cards")
    .select("id")
    .eq("id", request.cardId)
    .eq("status", "active")
    .single();

  if (cardError || !card) {
    return {
      success: false,
      error: {
        code: "CARD_NOT_FOUND",
        message: "Card not found or inactive.",
      },
    };
  }

  const enqueuedAt = Date.now();
  const contentHmac = createHmac("sha256", CONTENT_HMAC_SECRET)
    .update(request.content)
    .digest("hex");
  const contentHash = createHash("sha256").update(request.content).digest("hex");
  const sessionHmac = createHmac("sha256", SESSION_HMAC_SECRET)
    .update(request.sessionToken)
    .digest("hex");
  const queueItemWithoutReceipt: QueueSubmission = {
    id: asQueueItemId(`q_${enqueuedAt}_${Math.random().toString(36).slice(2)}`),
    cardId: asCardId(request.cardId),
    contentHmac,
    contentHash,
    sessionHmac,
    idempotencyKey: request.idempotencyKey,
    receiptHash: "",
    enqueuedAt,
  };

  const receipt = generateReceipt(queueItemWithoutReceipt);
  const queueItem: QueueSubmission = {
    ...queueItemWithoutReceipt,
    receiptHash: receipt.receiptHmac,
  };

  await storeIdempotency(request.idempotencyKey, queueItem.id);

  const enqueued = await enqueueSubmission({
    id: queueItem.id,
    cardId: queueItem.cardId,
    contentHash: queueItem.contentHash,
    sessionId: queueItem.sessionHmac,
    receiptHash: queueItem.receiptHash,
    enqueuedAt: queueItem.enqueuedAt,
  });
  if (!enqueued) {
    return {
      success: false,
      error: {
        code: "DUPLICATE",
        message: "This submission has already been processed.",
      },
    };
  }

  return { success: true, receipt };
}

function validateSubmission(
  request: SubmissionRequest,
): { readonly valid: true } | { readonly valid: false; readonly error: SubmissionError } {
  if (!request.cardId || typeof request.cardId !== "string") {
    return {
      valid: false,
      error: { code: "INVALID_INPUT", message: "Card ID is required." },
    };
  }

  if (!request.content || typeof request.content !== "string") {
    return {
      valid: false,
      error: { code: "INVALID_INPUT", message: "Content is required." },
    };
  }

  if (request.content.length > CONTENT_MAX_LENGTH) {
    return {
      valid: false,
      error: {
        code: "CONTENT_TOO_LONG",
        message: `Content must be ${CONTENT_MAX_LENGTH} characters or less.`,
      },
    };
  }

  if (!request.sessionToken || typeof request.sessionToken !== "string") {
    return {
      valid: false,
      error: { code: "INVALID_INPUT", message: "Session token is required." },
    };
  }

  if (!request.idempotencyKey || typeof request.idempotencyKey !== "string") {
    return {
      valid: false,
      error: { code: "INVALID_INPUT", message: "Idempotency key is required." },
    };
  }

  if (!request.ip || typeof request.ip !== "string") {
    return {
      valid: false,
      error: { code: "INVALID_INPUT", message: "IP address is required." },
    };
  }

  return { valid: true };
}
