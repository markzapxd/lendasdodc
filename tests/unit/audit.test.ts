import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));

describe("audit logging", () => {
  it("records an audit event", async () => {
    const { recordAuditEvent } = await import("@/lib/audit");

    await expect(
      recordAuditEvent({
        actorId: "admin-1",
        action: "admin_login_success",
        entityType: "admin_user",
        entityId: "admin-1",
        context: { ip: "127.0.0.1" },
        timestamp: Date.now(),
      }),
    ).resolves.toBeUndefined();
  });

  it("records a security event", async () => {
    const { recordSecurityEvent } = await import("@/lib/audit");

    await expect(
      recordSecurityEvent({
        type: "admin_login_failed",
        severity: "warning",
        context: { email: "test@test.com" },
        timestamp: Date.now(),
      }),
    ).resolves.toBeUndefined();
  });
});
