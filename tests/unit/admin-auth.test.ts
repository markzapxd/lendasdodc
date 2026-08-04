import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("ADMIN_SESSION_SECRET", "admin-session-secret-with-at-least-32-chars");

const authMock = vi.hoisted(() => ({
  getTokenFromCookie: vi.fn(),
  validateAdminSession: vi.fn(),
}));
const supabaseMock = vi.hoisted(() => {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const schema = vi.fn(() => ({ from }));
  const createAdminClient = vi.fn(() => ({ schema }));

  return { createAdminClient, schema, select, eq, single };
});

vi.mock("@/lib/auth", () => authMock);
vi.mock("@/lib/supabase", () => ({
  createAdminClient: supabaseMock.createAdminClient,
}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: { ADMIN_SESSION_SECRET: "admin-session-secret-with-at-least-32-chars" },
}));

const session = {
  id: "session-1",
  adminUserId: "admin-1",
  tokenHash: "hash",
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date(),
};

function csrfHash(token: string): string {
  return createHmac("sha256", "admin-session-secret-with-at-least-32-chars")
    .update(token)
    .digest("hex");
}

describe("admin mutation authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.validateAdminSession.mockResolvedValue(session);
    authMock.getTokenFromCookie.mockReturnValue("cookie-token");
  });

  it("rejects cookie mutations without a CSRF token", async () => {
    const { requireAdmin } = await import("@/lib/moderation/admin-auth");

    await expect(
      requireAdmin(
        new Request("http://localhost", { headers: { cookie: "session=cookie-token" } }),
        true,
      ),
    ).rejects.toThrow("Forbidden");
    expect(supabaseMock.single).not.toHaveBeenCalled();
  });

  it("validates cookie mutation CSRF against the private session row", async () => {
    supabaseMock.single.mockResolvedValue({
      data: { csrf_token_hash: csrfHash("csrf-token") },
      error: null,
    });
    const { requireAdmin } = await import("@/lib/moderation/admin-auth");

    await expect(
      requireAdmin(
        new Request("http://localhost", {
          headers: { cookie: "session=cookie-token", "x-csrf-token": "csrf-token" },
        }),
        true,
      ),
    ).resolves.toEqual({ adminId: "admin-1", csrfRequired: true });
    expect(supabaseMock.schema).toHaveBeenCalledWith("private");
    expect(supabaseMock.select).toHaveBeenCalledWith("csrf_token_hash");
  });

  it("allows explicit bearer mutations without cookie CSRF", async () => {
    authMock.getTokenFromCookie.mockReturnValue(null);
    const { requireAdmin } = await import("@/lib/moderation/admin-auth");

    await expect(
      requireAdmin(
        new Request("http://localhost", { headers: { authorization: "Bearer api-token" } }),
        true,
      ),
    ).resolves.toEqual({ adminId: "admin-1", csrfRequired: false });
    expect(supabaseMock.single).not.toHaveBeenCalled();
  });

  it("does not let a bearer header bypass CSRF when a cookie is present", async () => {
    const { requireAdmin } = await import("@/lib/moderation/admin-auth");

    await expect(
      requireAdmin(
        new Request("http://localhost", {
          headers: { authorization: "Bearer api-token", cookie: "session=cookie-token" },
        }),
        true,
      ),
    ).rejects.toThrow("Forbidden");
  });
});
