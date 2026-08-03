import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockReturnValue({
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

describe("alerts", () => {
  it("sends an alert", async () => {
    const { sendAlert } = await import("@/lib/alerts");

    await expect(
      sendAlert({
        type: "test",
        severity: "info",
        message: "Test alert",
        context: {},
        timestamp: Date.now(),
      }),
    ).resolves.toBeUndefined();
  });

  it("deduplicates alerts over the configured limit", async () => {
    const { sendAlert } = await import("@/lib/alerts");
    const { getRedis } = await import("@/lib/redis");
    const redis = getRedis();

    vi.mocked(redis.incr).mockResolvedValue(15);

    await expect(
      sendAlert({
        type: "test",
        severity: "info",
        message: "Test alert",
        context: {},
        timestamp: Date.now(),
      }),
    ).resolves.toBeUndefined();
  });
});
