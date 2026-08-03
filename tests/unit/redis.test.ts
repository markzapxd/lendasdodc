import type { Redis } from "@upstash/redis";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { QueueItem } from "../../src/lib/redis/queue";

vi.mock("@upstash/redis", () => {
  class MockRedis {
    eval = vi.fn();
    set = vi.fn();
    zcard = vi.fn();
  }

  return { Redis: MockRedis };
});

let getRedis: typeof import("../../src/lib/redis/index").getRedis;
let acquireLock: typeof import("../../src/lib/redis/lock").acquireLock;
let releaseLock: typeof import("../../src/lib/redis/lock").releaseLock;
let withLock: typeof import("../../src/lib/redis/lock").withLock;
let checkRateLimit: typeof import("../../src/lib/redis/rate-limit").checkRateLimit;
let rateLimits: typeof import("../../src/lib/redis/rate-limit").RATE_LIMITS;
let completeQueueItem: typeof import("../../src/lib/redis/queue").completeQueueItem;
let dequeueSubmissions: typeof import("../../src/lib/redis/queue").dequeueSubmissions;
let enqueueSubmission: typeof import("../../src/lib/redis/queue").enqueueSubmission;
let getQueueStats: typeof import("../../src/lib/redis/queue").getQueueStats;
let redis: Redis;

const queueItem: QueueItem = {
  id: "item-1",
  cardId: "card-1",
  contentHash: "content-hash",
  sessionId: "session-1",
  receiptHash: "receipt-hash",
  enqueuedAt: 1_700_000_000_000,
};

beforeAll(async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.example.com");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test-value");
  vi.stubEnv("SUPABASE_ANON_KEY", "server-anon-test-value");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "redis-test-value");
  vi.stubEnv("QSTASH_TOKEN", "qstash-test-value");
  vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "current-signing-test-value");
  vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "next-signing-test-value");
  vi.stubEnv("ADMIN_SESSION_SECRET", "admin-session-secret-with-at-least-32-chars");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "turnstile-test-value");
  vi.stubEnv("CRON_SECRET", "cron-test-value");

  ({ getRedis } = await import("../../src/lib/redis/index"));
  ({ acquireLock, releaseLock, withLock } = await import("../../src/lib/redis/lock"));
  ({ checkRateLimit, RATE_LIMITS: rateLimits } = await import("../../src/lib/redis/rate-limit"));
  ({ completeQueueItem, dequeueSubmissions, enqueueSubmission, getQueueStats } = await import(
    "../../src/lib/redis/queue"
  ));
  redis = getRedis();
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("Redis helpers", () => {
  describe("connection", () => {
    it("returns the same Redis client for repeated calls", () => {
      expect(getRedis()).toBe(redis);
      expect(getRedis()).toBe(redis);
    });
  });

  describe("rate limiter", () => {
    it("atomically evaluates a sliding-window request", async () => {
      vi.mocked(redis.eval).mockResolvedValue([1, 4]);

      const result = await checkRateLimit("test-ip", rateLimits.submission);

      expect(result).toMatchObject({ allowed: true, remaining: 1 });
      expect(redis.eval).toHaveBeenCalledOnce();
      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain("ZREMRANGEBYSCORE");
      expect(vi.mocked(redis.eval).mock.calls[0]?.[1]).toEqual(["rl:submit:test-ip"]);
    });

    it("reports a rejected request when the atomic count exceeds the limit", async () => {
      vi.mocked(redis.eval).mockResolvedValue([0, 6]);

      const result = await checkRateLimit("test-ip", rateLimits.submission);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("queue", () => {
    it("uses one atomic script for idempotent enqueue", async () => {
      vi.mocked(redis.eval).mockResolvedValue(1);

      await expect(enqueueSubmission(queueItem)).resolves.toBe(true);

      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain('"NX"');
      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain("ZADD");
      expect(vi.mocked(redis.eval).mock.calls[0]?.[1]).toEqual([
        "idem:item-1",
        "queue:pending:card-1",
      ]);
    });

    it("returns false when the atomic enqueue script finds a duplicate", async () => {
      vi.mocked(redis.eval).mockResolvedValue(0);

      await expect(enqueueSubmission(queueItem)).resolves.toBe(false);
    });

    it("moves the oldest items atomically into processing", async () => {
      vi.mocked(redis.eval).mockResolvedValue([JSON.stringify(queueItem)]);

      await expect(dequeueSubmissions("card-1", 2)).resolves.toEqual([queueItem]);

      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain("ZRANGE");
      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain("ZREM");
      expect(vi.mocked(redis.eval).mock.calls[0]?.[1]).toEqual([
        "queue:pending:card-1",
        "queue:processing:card-1",
      ]);
    });

    it("does not move an item twice when completion races", async () => {
      vi.mocked(redis.eval).mockResolvedValue(0);

      await expect(completeQueueItem("card-1", queueItem, "published")).resolves.toBeUndefined();

      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain("ZREM");
      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain("if removed == 1");
    });

    it("returns counts for every queue state", async () => {
      vi.mocked(redis.zcard)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(0);

      await expect(getQueueStats("card-1")).resolves.toEqual({
        pending: 2,
        processing: 1,
        published: 8,
        failed: 0,
      });
    });
  });

  describe("distributed lock", () => {
    it("retries acquisition and releases only with its token", async () => {
      vi.mocked(redis.set).mockResolvedValueOnce(null).mockResolvedValueOnce("OK");
      vi.mocked(redis.eval).mockResolvedValue(1);

      const token = await acquireLock("queue-worker", {
        retryAttempts: 2,
        retryDelayMs: 0,
        ttlMs: 5_000,
      });
      const released = await releaseLock("queue-worker", token ?? "");

      expect(token).toBeTruthy();
      expect(released).toBe(true);
      expect(redis.set).toHaveBeenCalledTimes(2);
      expect(vi.mocked(redis.eval).mock.calls[0]?.[0]).toContain('redis.call("del"');
      expect(vi.mocked(redis.eval).mock.calls[0]?.[1]).toEqual(["lock:queue-worker"]);
    });

    it("releases the lock after the protected function resolves", async () => {
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(redis.eval).mockResolvedValue(1);

      await expect(
        withLock("queue-worker", async () => "published", { ttlMs: 5_000 }),
      ).resolves.toBe("published");

      expect(redis.set).toHaveBeenCalledOnce();
      expect(redis.eval).toHaveBeenCalledOnce();
    });
  });
});
