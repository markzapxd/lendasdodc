import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => {
  const single = vi.fn();
  const update = vi.fn().mockResolvedValue({ error: null });
  const select = vi.fn(() => ({ single }));
  const from = vi.fn(() => ({ select, update }));
  const schema = vi.fn(() => ({ from }));
  const createAdminClient = vi.fn(() => ({ schema }));

  return { createAdminClient, from, schema, select, single, update };
});
const authMock = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));
const auditMock = vi.hoisted(() => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createAdminClient: supabaseMock.createAdminClient,
}));
vi.mock("@/lib/moderation/admin-auth", () => authMock);
vi.mock("@/lib/audit", () => auditMock);
vi.mock("server-only", () => ({}));

const validPlatformState = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  configured_interval_ms: 5000,
  emergency_mode: false,
  degraded_mode: false,
  last_published_at: null,
  updated_at: "2026-08-04T12:00:00.000Z",
};

describe("platform settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses the singleton platform state shape", async () => {
    const { parsePlatformState } = await import("@/lib/admin/settings");

    expect(parsePlatformState(validPlatformState)).toEqual({
      ...validPlatformState,
      updated_at: new Date(validPlatformState.updated_at),
    });
  });

  it("rejects missing or malformed platform state", async () => {
    const { parsePlatformState } = await import("@/lib/admin/settings");

    expect(() => parsePlatformState(null)).toThrow();
    expect(() => parsePlatformState({ ...validPlatformState, emergency_mode: "false" })).toThrow();
    expect(() => parsePlatformState({ ...validPlatformState, updated_at: "not-a-date" })).toThrow();
  });

  it("rejects a missing singleton row from the database", async () => {
    supabaseMock.single.mockResolvedValue({ data: null, error: null });
    const { getSettings } = await import("@/lib/admin/settings");

    await expect(getSettings()).rejects.toThrow("singleton row is missing");
  });

  it("rejects invalid or unsupported settings updates", async () => {
    const { parsePlatformSettingsUpdate } = await import("@/lib/admin/settings");

    expect(() => parsePlatformSettingsUpdate({ configured_interval_ms: 5000.5 })).toThrow();
    expect(() => parsePlatformSettingsUpdate({ configured_interval_ms: 0 })).toThrow();
    expect(() => parsePlatformSettingsUpdate({ configured_interval_ms: -1 })).toThrow();
    expect(() => parsePlatformSettingsUpdate({ emergency_mode: "false" })).toThrow();
    expect(() => parsePlatformSettingsUpdate({ maintenance_mode: true })).toThrow();
  });

  it("reads one parsed singleton row from the api schema", async () => {
    supabaseMock.single.mockResolvedValue({ data: validPlatformState, error: null });
    const { getSettings } = await import("@/lib/admin/settings");

    await expect(getSettings()).resolves.toMatchObject({
      id: validPlatformState.id,
      configured_interval_ms: 5000,
      emergency_mode: false,
      degraded_mode: false,
      last_published_at: null,
    });
    expect(supabaseMock.schema).toHaveBeenCalledWith("api");
    expect(supabaseMock.select).toHaveBeenCalledWith(
      "id, configured_interval_ms, emergency_mode, degraded_mode, last_published_at, updated_at",
    );
    expect(supabaseMock.single).toHaveBeenCalledOnce();
  });

  it("updates only supported singleton settings columns", async () => {
    const { updateSettings } = await import("@/lib/admin/settings");

    await updateSettings({ configured_interval_ms: 10_000, emergency_mode: true });

    expect(supabaseMock.update).toHaveBeenCalledWith({
      configured_interval_ms: 10_000,
      emergency_mode: true,
    });
  });

  describe("settings mutation route", () => {
    it("rejects invalid input before updating the singleton", async () => {
      authMock.requireAdmin.mockResolvedValue({ adminId: "admin-1", csrfRequired: true });
      const { PATCH } = await import("@/app/api/admin/settings/route");

      const response = await PATCH(
        new Request("http://localhost/api/admin/settings", {
          method: "PATCH",
          body: JSON.stringify({ configured_interval_ms: 0 }),
          headers: { "content-type": "application/json" },
        }),
      );

      expect(response.status).toBe(400);
      expect(supabaseMock.update).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated mutations", async () => {
      authMock.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
      const { PATCH } = await import("@/app/api/admin/settings/route");

      const response = await PATCH(
        new Request("http://localhost/api/admin/settings", { method: "PATCH" }),
      );

      expect(response.status).toBe(401);
      expect(supabaseMock.update).not.toHaveBeenCalled();
    });

    it("rejects cookie mutations without a valid CSRF token", async () => {
      authMock.requireAdmin.mockRejectedValue(new Error("Forbidden"));
      const { PATCH } = await import("@/app/api/admin/settings/route");

      const response = await PATCH(
        new Request("http://localhost/api/admin/settings", {
          method: "PATCH",
          body: JSON.stringify({ emergency_mode: true }),
          headers: { "content-type": "application/json" },
        }),
      );

      expect(response.status).toBe(403);
      expect(supabaseMock.update).not.toHaveBeenCalled();
    });

    it("updates supported values and records the actor and change", async () => {
      authMock.requireAdmin.mockResolvedValue({ adminId: "admin-1", csrfRequired: true });
      supabaseMock.single.mockResolvedValue({ data: validPlatformState, error: null });
      auditMock.recordAuditEvent.mockResolvedValue(undefined);
      const { PATCH } = await import("@/app/api/admin/settings/route");

      const response = await PATCH(
        new Request("http://localhost/api/admin/settings", {
          method: "PATCH",
          body: JSON.stringify({ configured_interval_ms: 10_000, emergency_mode: true }),
          headers: { "content-type": "application/json" },
        }),
      );

      expect(response.status).toBe(200);
      expect(supabaseMock.update).toHaveBeenCalledWith({
        configured_interval_ms: 10_000,
        emergency_mode: true,
      });
      expect(auditMock.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: "admin-1",
          action: "settings.update",
          entityType: "platform_state",
          entityId: validPlatformState.id,
          oldValues: {
            configured_interval_ms: 5000,
            emergency_mode: false,
            degraded_mode: false,
          },
          newValues: {
            configured_interval_ms: 10_000,
            emergency_mode: true,
            degraded_mode: false,
          },
        }),
      );
    });
  });
});
