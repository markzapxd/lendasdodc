import { NextRequest } from "next/server";
import { generateSync } from "otplib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionSingle = vi.fn();
const sessionSelect = vi.fn(() => ({ single: sessionSingle }));
const sessionInsert = vi.fn(() => ({ select: sessionSelect }));
const sessionDelete = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
const sessionFrom = vi.fn(() => ({
  insert: sessionInsert,
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        gt: vi.fn(() => ({ single: sessionSingle })),
        single: sessionSingle,
      })),
      gt: vi.fn(() => ({ single: sessionSingle })),
      single: sessionSingle,
    })),
  })),
  delete: sessionDelete,
}));
const adminClient = { schema: vi.fn(() => ({ from: sessionFrom })) };

vi.stubEnv("ADMIN_SESSION_SECRET", "admin-session-secret-with-at-least-32-chars");

vi.mock("@/lib/supabase", () => ({
  createAdminClient: vi.fn(() => adminClient),
}));

vi.mock("@/lib/redis", () => ({
  checkRateLimit: vi.fn(),
  RATE_LIMITS: { admin: { maxRequests: 5, windowMs: 900_000, keyPrefix: "rl:admin" } },
}));

describe("admin authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionSingle.mockResolvedValue({ data: null, error: null });
  });

  describe("password", () => {
    it("hashes a password and verifies only the matching value", async () => {
      const { hashPassword, verifyPassword } = await import("@/lib/auth/password");

      const hash = await hashPassword("Test@12345678");

      expect(hash).not.toBe("Test@12345678");
      expect(await verifyPassword("Test@12345678", hash)).toBe(true);
      expect(await verifyPassword("wrong", hash)).toBe(false);
    });

    it("rejects weak passwords and accepts the required character classes", async () => {
      const { validatePasswordStrength } = await import("@/lib/auth/password");

      expect(validatePasswordStrength("weak").valid).toBe(false);
      expect(validatePasswordStrength("Strong@Pass123").valid).toBe(true);
    });
  });

  describe("TOTP", () => {
    it("generates a secret and verifies a current token", async () => {
      const { generateTOTPSecret, verifyTOTP } = await import("@/lib/auth/totp");
      const { secret, uri } = generateTOTPSecret();
      const token = generateSync({ secret });

      expect(secret).toMatch(/^[A-Z2-7]+$/);
      expect(uri).toContain("otpauth://totp/");
      expect(verifyTOTP(secret, token)).toBe(true);
      expect(verifyTOTP(secret, "000000")).toBe(false);
    });

    it("generates the requested number of recovery codes", async () => {
      const { generateBackupCodes } = await import("@/lib/auth/totp");

      const codes = generateBackupCodes(3);

      expect(codes).toHaveLength(3);
      expect(codes.every((code) => /^[A-Z0-9]{8}$/.test(code))).toBe(true);
    });
  });

  describe("cookie and database sessions", () => {
    it("extracts only the admin session cookie", async () => {
      const { getTokenFromCookie } = await import("@/lib/auth/session");

      expect(getTokenFromCookie("other=value; _ldc_admin_session=token-value")).toBe("token-value");
      expect(getTokenFromCookie("other=value")).toBeNull();
      expect(getTokenFromCookie(null)).toBeNull();
    });

    it("creates a session using the private admin session columns", async () => {
      const { createAdminSession } = await import("@/lib/auth/session");
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 28_800_000).toISOString();
      sessionSingle.mockResolvedValueOnce({
        data: {
          id: "session-1",
          admin_id: "admin-1",
          session_token_hash: "hash",
          created_at: createdAt,
          expires_at: expiresAt,
        },
        error: null,
      });

      const result = await createAdminSession("admin-1");

      expect(result.token).toMatch(/^[0-9a-f]{64}$/);
      expect(result.csrfToken).toMatch(/^[0-9a-f]{64}$/);
      expect(result.session.adminUserId).toBe("admin-1");
      expect(sessionFrom).toHaveBeenCalledWith("admin_sessions");
      expect(sessionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          admin_id: "admin-1",
          csrf_token_hash: expect.any(String),
          status: "active",
        }),
      );
    });

    it("validates an unexpired session and rejects missing records", async () => {
      const { validateAdminSession } = await import("@/lib/auth/session");
      sessionSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(validateAdminSession("missing-token")).resolves.toBeNull();
      expect(sessionFrom).toHaveBeenCalledWith("admin_sessions");
    });
  });

  describe("routes", () => {
    it("rejects a rate-limited login before querying credentials", async () => {
      const { checkRateLimit } = await import("@/lib/redis");
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60_000,
      });
      const { POST } = await import("@/app/api/admin/login/route");

      const request = new NextRequest("http://localhost/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: "admin", password: "password", totpCode: "123456" }),
        headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.1" },
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({
        error: "Too many login attempts. Please try again later.",
      });
      expect(sessionFrom).not.toHaveBeenCalledWith("admin_users");
    });

    it("clears the cookie when logout has no valid session", async () => {
      const { POST } = await import("@/app/api/admin/logout/route");
      const request = new NextRequest("http://localhost/api/admin/logout", {
        method: "POST",
        headers: { cookie: "_ldc_admin_session=missing-token" },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.cookies.get("_ldc_admin_session")?.value).toBe("");
    });
  });
});
