import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QueueItem } from "@/lib/redis";

const mocks = vi.hoisted(() => {
  const messageInsert = vi.fn();
  const cardsQuery = vi.fn();
  const schema = vi.fn(() => ({ from }));
  const from = vi.fn((table: string) =>
    table === "messages" ? { insert: messageInsert } : { select: cardsQuery },
  );
  const redis = {
    get: vi.fn(),
    set: vi.fn(),
  };

  return {
    cardsQuery,
    completeQueueItem: vi.fn(),
    createAdminClient: vi.fn(() => ({ schema, from })),
    dequeueSubmissions: vi.fn(),
    getRedis: vi.fn(() => redis),
    messageInsert,
    recordAuditEvent: vi.fn(),
  };
});

vi.mock("@/lib/redis", () => ({
  completeQueueItem: mocks.completeQueueItem,
  dequeueSubmissions: mocks.dequeueSubmissions,
  getRedis: mocks.getRedis,
}));

vi.mock("@/lib/supabase", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mocks.recordAuditEvent,
}));

const queueItem: QueueItem = {
  id: "item-1",
  cardId: "card-1",
  contentHash: "content-hash",
  sessionId: "session-1",
  receiptHash: "receipt-hash",
  enqueuedAt: 1_700_000_000_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.dequeueSubmissions.mockResolvedValue([]);
  mocks.completeQueueItem.mockResolvedValue(undefined);
  mocks.recordAuditEvent.mockResolvedValue(undefined);
  mocks.messageInsert.mockResolvedValue({ error: null });
  mocks.cardsQuery.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  });
  const redis = mocks.getRedis();
  vi.mocked(redis.get).mockResolvedValue(null);
  vi.mocked(redis.set).mockResolvedValue("OK");
});

describe("Publisher Worker", () => {
  it("processes an empty queue", async () => {
    const { processSubmissions } = await import("@/lib/worker/publisher");

    await expect(processSubmissions("card-1")).resolves.toBe(0);
    expect(mocks.dequeueSubmissions).toHaveBeenCalledWith("card-1", 10);
  });

  it("publishes dequeued items and completes them", async () => {
    mocks.dequeueSubmissions.mockResolvedValue([queueItem]);
    const { processSubmissions } = await import("@/lib/worker/publisher");

    await expect(processSubmissions("card-1", 1)).resolves.toBe(1);

    expect(mocks.messageInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        card_id: "card-1",
        status: "published",
      }),
    );
    expect(mocks.completeQueueItem).toHaveBeenCalledWith("card-1", queueItem, "published");
  });

  it("marks failed publications and records an audit event", async () => {
    mocks.dequeueSubmissions.mockResolvedValue([queueItem]);
    mocks.messageInsert.mockResolvedValue({ error: { message: "insert failed" } });
    const { processSubmissions } = await import("@/lib/worker/publisher");

    await expect(processSubmissions("card-1")).resolves.toBe(0);

    expect(mocks.completeQueueItem).toHaveBeenCalledWith("card-1", queueItem, "failed");
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "system_error", entityId: "item-1" }),
    );
  });
});

describe("Scheduler", () => {
  it("runs when no last run is recorded", async () => {
    const { shouldRun } = await import("@/lib/worker/scheduler");

    await expect(shouldRun()).resolves.toBe(true);
  });

  it("marks an empty active-card run", async () => {
    const { runScheduler } = await import("@/lib/worker/scheduler");

    await expect(runScheduler()).resolves.toMatchObject({ processed: 0, cards: 0 });
    const redis = mocks.getRedis();
    expect(redis.set).toHaveBeenCalledWith("scheduler:last_run", expect.any(String));
  });
});

describe("Cron endpoint", () => {
  it("rejects requests without the cron secret", async () => {
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
    for (const [name, value] of Object.entries(environment)) {
      vi.stubEnv(name, value);
    }
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/cron/publish/route");

    const response = await POST(new NextRequest("http://localhost/api/cron/publish"));

    expect(response.status).toBe(401);
  });
});
