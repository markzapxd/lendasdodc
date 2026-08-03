import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockReturnValue({
    pipeline: vi.fn().mockReturnValue({
      zremrangebyscore: vi.fn(),
      zadd: vi.fn(),
      zcard: vi.fn(),
      expire: vi.fn(),
      exec: vi.fn().mockResolvedValue([null, null, 0, null]),
    }),
    zrange: vi.fn().mockResolvedValue([]),
    zrangebyscore: vi.fn().mockResolvedValue([]),
    del: vi.fn(),
  }),
}));

describe("abuse scoring", () => {
  it("records an abuse event below the block threshold", async () => {
    const { recordAbuseEvent } = await import("@/lib/abuse");

    const score = await recordAbuseEvent({
      type: "submission",
      sessionHmac: "test-hmac",
      timestamp: Date.now(),
    });

    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.blocked).toBe(false);
  });

  it("reports the current score for a session", async () => {
    const { getAbuseScore } = await import("@/lib/abuse");

    const score = await getAbuseScore("high-abuse-hmac");

    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.blocked).toBe(false);
  });
});
