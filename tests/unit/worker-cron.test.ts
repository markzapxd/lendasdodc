import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWorkerMetrics: vi.fn(),
  processAllQueues: vi.fn(),
  processDeadLetterQueue: vi.fn(),
}));

vi.mock("@/lib/worker/publisher", () => ({
  processAllQueues: mocks.processAllQueues,
}));

vi.mock("@/lib/worker/dead-letter", () => ({
  processDeadLetterQueue: mocks.processDeadLetterQueue,
}));

vi.mock("@/lib/worker/monitor", () => ({
  getWorkerMetrics: mocks.getWorkerMetrics,
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
  for (const [name, value] of Object.entries(environment)) {
    vi.stubEnv(name, value);
  }
  mocks.processAllQueues.mockResolvedValue(0);
  mocks.processDeadLetterQueue.mockResolvedValue([]);
  mocks.getWorkerMetrics.mockResolvedValue({
    queues: {},
    deadLetterSize: 0,
    lastRunAt: null,
    processedToday: 0,
  });
});

describe("Worker Cron Endpoint", () => {
  it("rejects requests without the cron secret", async () => {
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/cron/worker/route");

    const response = await POST(
      new NextRequest("http://localhost/api/cron/worker", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(mocks.processAllQueues).not.toHaveBeenCalled();
  });

  it("processes queues and returns monitoring data", async () => {
    mocks.processAllQueues.mockResolvedValue(3);
    mocks.processDeadLetterQueue.mockResolvedValue([
      { operation: "publish_message", payload: "{}", error: "failed", timestamp: Date.now() },
    ]);
    mocks.getWorkerMetrics.mockResolvedValue({
      queues: {},
      deadLetterSize: 0,
      lastRunAt: null,
      processedToday: 3,
    });

    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/cron/worker/route");
    const response = await POST(
      new NextRequest("http://localhost/api/cron/worker", {
        method: "POST",
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.processDeadLetterQueue).toHaveBeenCalledWith(10);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      processed: 3,
      dlqProcessed: 1,
      metrics: { processedToday: 3 },
    });
  });

  it("returns a health response with metrics", async () => {
    const { GET } = await import("@/app/api/cron/worker/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok", metrics: { queues: {} } });
  });
});
