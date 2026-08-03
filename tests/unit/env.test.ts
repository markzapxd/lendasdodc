import { afterEach, describe, expect, it, vi } from "vitest";

const validServerEnvironment = {
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
  CRON_SECRET: "cron-test-value",
  ALERT_WEBHOOK_URL: "https://alerts.example.com/webhook",
} as const;

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("environment contracts", () => {
  it("parses valid public environment variables", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://public-supabase.example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-test-value");

    const { publicEnv } = await import("../../src/lib/env/public");

    expect(publicEnv).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://public-supabase.example.com",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-test-value",
    });
  });

  it("parses valid server environment variables", async () => {
    for (const [name, value] of Object.entries(validServerEnvironment)) {
      vi.stubEnv(name, value);
    }

    const { serverEnv } = await import("../../src/lib/env/server");

    expect(serverEnv).toEqual(validServerEnvironment);
  });

  it("reports a missing required variable without exposing its value", async () => {
    for (const [name, value] of Object.entries(validServerEnvironment)) {
      vi.stubEnv(name, value);
    }
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const importResult = import("../../src/lib/env/server");

    await expect(importResult).rejects.toThrow(/UPSTASH_REDIS_REST_TOKEN/);
    await expect(importResult).rejects.not.toThrow("redis-test-value");
  });

  it("keeps server environment variables out of the public contract", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://public-supabase.example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-test-value");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "private-service-role-test-value");
    vi.stubEnv("ADMIN_SESSION_SECRET", "private-admin-session-secret-test-value");

    const { publicEnv } = await import("../../src/lib/env/public");

    expect(Object.keys(publicEnv)).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
    expect(publicEnv).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    expect(publicEnv).not.toHaveProperty("ADMIN_SESSION_SECRET");
  });
});

describe("branded IDs", () => {
  it("creates semantic IDs and validates UUID-shaped values", async () => {
    const { asAdminId, asCardId, asMessageId, asQueueItemId, asReportId, asSessionId, isValidId } =
      await import("../../src/lib/ids");
    const validId = "123e4567-e89b-12d3-a456-426614174000";

    expect(asCardId(validId)).toBe(validId);
    expect(asMessageId(validId)).toBe(validId);
    expect(asSessionId(validId)).toBe(validId);
    expect(asQueueItemId(validId)).toBe(validId);
    expect(asReportId(validId)).toBe(validId);
    expect(asAdminId(validId)).toBe(validId);
    expect(isValidId(validId)).toBe(true);
    expect(isValidId("not-a-uuid")).toBe(false);
  });
});
