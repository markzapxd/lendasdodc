import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  RATE_LIMITS: {
    submission: {
      maxRequests: 5,
      windowMs: 60_000,
    },
  },
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 5,
    resetAt: Date.now() + 60_000,
  }),
}));

describe("session management", () => {
  it("creates an anonymous session with cryptographic identifiers", async () => {
    const { createSession } = await import("@/lib/session");

    const session = createSession();

    expect(session.sessionId).toMatch(/^[0-9a-f]{64}$/);
    expect(session.sessionHmac).toMatch(/^[0-9a-f]{64}$/);
    expect(session.expiresAt).toBeGreaterThan(session.createdAt);
  });

  it("validates a session with the matching HMAC", async () => {
    const { createSession, validateSession } = await import("@/lib/session");

    const session = createSession();
    const validated = await validateSession(session.sessionId);

    expect(validated).not.toBeNull();
    expect(validated?.sessionHmac).toBe(session.sessionHmac);
  });

  it("rejects a malformed session cookie", async () => {
    const { validateSession } = await import("@/lib/session");

    const validated = await validateSession("invalid-session-id");

    expect(validated).toBeNull();
  });
});
