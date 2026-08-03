import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const redis = {
    expire: vi.fn(),
    get: vi.fn(),
    incrby: vi.fn(),
    keys: vi.fn(),
    llen: vi.fn(),
    lpush: vi.fn(),
    ltrim: vi.fn(),
    rpop: vi.fn(),
    rpush: vi.fn(),
    zcard: vi.fn(),
  };
  const messageInsert = vi.fn();
  const reportUpdate = vi.fn();
  const reportEq = vi.fn();
  const from = vi.fn((table: string) => {
    if (table === "messages") {
      return { insert: messageInsert };
    }

    return { update: reportUpdate };
  });

  return {
    createAdminClient: vi.fn(() => ({ from })),
    from,
    getRedis: vi.fn(() => redis),
    messageInsert,
    recordAuditEvent: vi.fn(),
    redis,
    reportEq,
    reportUpdate,
  };
});

vi.mock("@/lib/redis", () => ({
  getRedis: mocks.getRedis,
}));

vi.mock("@/lib/supabase", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mocks.recordAuditEvent,
}));

const environment = {
  SUPABASE_URL: "https://supabase.example.com",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-value",
  SUPABASE_ANON_KEY: "server-anon-test-value",
  UPSTASH_REDIS_REST_URL: "https://redis.example.com",
  UPSTASH_REDIS_REST_TOKEN: "redis-test-value",
  QSTASH_TOKEN: "qstash-test-value",
  QSTASH_CURRENT_SIGNING_KEY: "current-signing-test-value",
  QSTASH_NEXT_SIGNING_KEY: "next-signing-test-value",
  ADMIN_SESSION_SECRET: "admin-session-secret-with-at-least-32-chars",
  TURNSTILE_SECRET_KEY: "turnstile-test-value",
  CRON_SECRET: "cron-test-secret",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redis.rpop.mockReset();
  mocks.redis.keys.mockResolvedValue([]);
  mocks.redis.zcard.mockResolvedValue(0);
  mocks.redis.llen.mockResolvedValue(0);
  mocks.redis.get.mockResolvedValue(null);
  mocks.redis.rpop.mockResolvedValue(null);
  mocks.redis.rpush.mockResolvedValue(1);
  mocks.redis.lpush.mockResolvedValue(1);
  mocks.redis.ltrim.mockResolvedValue("OK");
  mocks.redis.incrby.mockResolvedValue(1);
  mocks.redis.expire.mockResolvedValue(1);
  mocks.messageInsert.mockResolvedValue({ error: null });
  mocks.reportUpdate.mockReturnValue({ eq: mocks.reportEq });
  mocks.reportEq.mockResolvedValue({ error: null });
  mocks.recordAuditEvent.mockResolvedValue(undefined);

  for (const [name, value] of Object.entries(environment)) {
    vi.stubEnv(name, value);
  }
});

describe("Worker Monitoring", () => {
  it("returns queue metrics grouped by card and status", async () => {
    const queueSizes: Record<string, number> = {
      "queue:pending:card-1": 2,
      "queue:processing:card-1": 1,
      "queue:published:card-1": 8,
      "queue:failed:card-1": 3,
    };
    mocks.redis.keys.mockResolvedValue([...Object.keys(queueSizes)]);
    mocks.redis.zcard.mockImplementation((key: string) => Promise.resolve(queueSizes[key] ?? 0));
    mocks.redis.llen.mockResolvedValue(4);
    mocks.redis.get.mockImplementation((key: string) => {
      if (key === "scheduler:last_run") {
        return Promise.resolve("1700000000000");
      }

      return Promise.resolve(key.startsWith("worker:processed:") ? "12" : null);
    });

    const { getWorkerMetrics } = await import("@/lib/worker/monitor");

    await expect(getWorkerMetrics()).resolves.toEqual({
      queues: {
        "card-1": { pending: 2, processing: 1, published: 8, failed: 3 },
      },
      deadLetterSize: 4,
      lastRunAt: 1_700_000_000_000,
      processedToday: 12,
    });
  });

  it("records processed work for seven days", async () => {
    const { recordProcessing } = await import("@/lib/worker/monitor");

    await recordProcessing(5);

    expect(mocks.redis.incrby).toHaveBeenCalledWith(
      expect.stringMatching(/^worker:processed:\d{4}-\d{2}-\d{2}$/),
      5,
    );
    expect(mocks.redis.expire).toHaveBeenCalledWith(
      expect.stringMatching(/^worker:processed:\d{4}-\d{2}-\d{2}$/),
      604800,
    );
  });
});

describe("Dead Letter Queue", () => {
  it("processes an empty queue", async () => {
    const { processDeadLetterQueue } = await import("@/lib/worker/dead-letter");

    await expect(processDeadLetterQueue()).resolves.toEqual([]);
  });

  it("retries message publication", async () => {
    const entry = {
      operation: "publish_message",
      payload: JSON.stringify({ cardId: "card-1", contentHmac: "content-hash" }),
      error: "initial failure",
      timestamp: 1_700_000_000_000,
    };
    mocks.redis.rpop.mockResolvedValueOnce(JSON.stringify(entry)).mockResolvedValueOnce(null);

    const { processDeadLetterQueue } = await import("@/lib/worker/dead-letter");

    await expect(processDeadLetterQueue(1)).resolves.toEqual([entry]);
    expect(mocks.messageInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        card_id: "card-1",
        content_hmac: "content-hash",
        status: "published",
      }),
    );
    expect(mocks.redis.rpush).not.toHaveBeenCalled();
  });

  it("requeues entries when retry fails", async () => {
    const entry = {
      operation: "unknown_operation",
      payload: "{}",
      error: "initial failure",
      timestamp: 1_700_000_000_000,
    };
    const encodedEntry = JSON.stringify(entry);
    mocks.redis.rpop.mockResolvedValueOnce(encodedEntry).mockResolvedValueOnce(null);

    const { processDeadLetterQueue } = await import("@/lib/worker/dead-letter");

    await expect(processDeadLetterQueue(1)).resolves.toEqual([entry]);
    expect(mocks.redis.rpush).toHaveBeenCalledWith("dlq:operations", encodedEntry);
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "system_error", entityType: "dead_letter" }),
    );
  });

  it("adds entries and trims the queue", async () => {
    const { addToDeadLetterQueue } = await import("@/lib/worker/dead-letter");
    const error = new Error("publish failed");

    await addToDeadLetterQueue("publish_message", { cardId: "card-1" }, error);

    expect(mocks.redis.lpush).toHaveBeenCalledWith(
      "dlq:operations",
      expect.stringContaining('"operation":"publish_message"'),
    );
    expect(mocks.redis.ltrim).toHaveBeenCalledWith("dlq:operations", 0, 999);
  });
});
