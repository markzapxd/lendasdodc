import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue("PONG"),
    lpush: vi.fn(),
    ltrim: vi.fn(),
    lrange: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("@/lib/supabase", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));

describe("recovery", () => {
  it("retries a temporary failure", async () => {
    const { withRetry } = await import("@/lib/recovery");
    let attempts = 0;

    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("Temporary failure");
        }
        return "success";
      },
      { maxAttempts: 3, baseDelayMs: 0 },
    );

    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("throws after the maximum attempts", async () => {
    const { withRetry } = await import("@/lib/recovery");

    await expect(
      withRetry(
        async () => {
          throw new Error("Permanent failure");
        },
        { maxAttempts: 2, baseDelayMs: 0 },
      ),
    ).rejects.toThrow("Permanent failure");
  });
});
