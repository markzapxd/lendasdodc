import { beforeEach, describe, expect, it, vi } from "vitest";
import { asCardId, asQueueItemId } from "@/lib/ids";

vi.mock("@/lib/redis", () => ({
  checkGlobalPanic: vi.fn().mockResolvedValue({ allowed: true, lockoutRemainingSeconds: 0 }),
  checkRateLimit: vi.fn(),
  enqueueSubmission: vi.fn(),
  getRedis: vi.fn(),
  RATE_LIMITS: {
    globalPanic: { windowMs: 600000, maxRequests: 100, lockoutSeconds: 3600, keyPrefix: "rl:panic" },
    ipSubmission: { windowMs: 60000, maxRequests: 5, keyPrefix: "rl:submit_ip" },
    submission: { windowMs: 60000, maxRequests: 5, keyPrefix: "rl:submit" },
  },
}));

vi.mock("@/lib/supabase", () => ({
  createAnonClient: vi.fn(),
}));

vi.mock("@/lib/queue/dedup", () => ({
  checkIdempotency: vi.fn(),
  storeIdempotency: vi.fn(),
  generateIdempotencyKey: vi.fn(),
}));

describe("Queue Contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleSubmit", () => {
    it("rejects empty content", async () => {
      const { handleSubmit } = await import("@/lib/queue/submit");

      const result = await handleSubmit({
        cardId: "card-1",
        content: "",
        sessionToken: "session-1",
        idempotencyKey: "idem-1",
        ip: "127.0.0.1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });

    it("rejects content exceeding the maximum length", async () => {
      const { handleSubmit } = await import("@/lib/queue/submit");

      const result = await handleSubmit({
        cardId: "card-1",
        content: "x".repeat(501),
        sessionToken: "session-1",
        idempotencyKey: "idem-1",
        ip: "127.0.0.1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("CONTENT_TOO_LONG");
      }
    });

    it("rejects submissions during a global panic lockout", async () => {
      const { handleSubmit } = await import("@/lib/queue/submit");
      const { checkGlobalPanic } = await import("@/lib/redis");

      (checkGlobalPanic as any).mockResolvedValueOnce({
        allowed: false,
        lockoutRemainingSeconds: 3600,
      });

      const result = await handleSubmit({
        cardId: "card-1",
        content: "Test message",
        sessionToken: "session-1",
        idempotencyKey: "idem-panic",
        ip: "127.0.0.1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GLOBAL_LOCKOUT");
      }
    });

    it("rejects duplicate idempotency keys", async () => {
      const { handleSubmit } = await import("@/lib/queue/submit");
      const { checkIdempotency } = await import("@/lib/queue/dedup");
      const { checkRateLimit } = await import("@/lib/redis");

      (checkRateLimit as any).mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 60000,
      });
      (checkIdempotency as any).mockResolvedValue(true);

      const result = await handleSubmit({
        cardId: "card-1",
        content: "Test message",
        sessionToken: "session-1",
        idempotencyKey: "idem-duplicate",
        ip: "127.0.0.1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("DUPLICATE");
      }
    });
  });

  describe("generateReceipt", () => {
    it("generates and verifies an HMAC receipt", async () => {
      const { generateReceipt, verifyReceipt } = await import("@/lib/queue/receipt");
      const queuedAt = Date.now();
      const item = {
        id: asQueueItemId("q_test"),
        cardId: asCardId("card-1"),
        contentHmac: "test-hmac",
        contentHash: "test-hash",
        sessionHmac: "session-hmac",
        idempotencyKey: "idem-1",
        receiptHash: "",
        enqueuedAt: queuedAt,
      } as const;

      const receipt = generateReceipt(item);

      expect(receipt.receiptId).toMatch(/^rcpt_/);
      expect(receipt.receiptHmac).toMatch(/^[0-9a-f]{64}$/);
      expect(receipt.queuedAt).toBe(queuedAt);
      expect(receipt.estimatedPublishAt).toBe(queuedAt + 60 * 60 * 1000);
      expect(
        verifyReceipt(receipt.receiptId, item.contentHash, receipt.queuedAt, receipt.receiptHmac),
      ).toBe(true);
      expect(
        verifyReceipt(receipt.receiptId, "different-hash", receipt.queuedAt, receipt.receiptHmac),
      ).toBe(false);
    });
  });
});
