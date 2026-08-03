import { beforeEach, describe, expect, it, vi } from "vitest";

const reportSingle = vi.fn();
const reportUpdateEq = vi.fn();
const messageUpdateEq = vi.fn();
const auditEvent = vi.fn();

const reportTable = {
  select: vi.fn(() => ({
    eq: vi.fn(() => ({ single: reportSingle })),
  })),
  update: vi.fn(() => ({ eq: reportUpdateEq })),
};

const messageTable = {
  update: vi.fn(() => ({ eq: messageUpdateEq })),
};

vi.mock("@/lib/supabase", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => (table === "reports" ? reportTable : messageTable)),
  })),
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: auditEvent,
}));

describe("report resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportSingle.mockResolvedValue({
      data: {
        id: "1",
        message_id: "msg-1",
        card_id: "card-1",
        reason_code: "spam",
        status: "pending",
      },
      error: null,
    });
    reportUpdateEq.mockResolvedValue({ error: null });
    messageUpdateEq.mockResolvedValue({ error: null });
    auditEvent.mockResolvedValue(undefined);
  });

  it("resolves a pending report and keeps its message by default", async () => {
    const { resolveReport } = await import("@/lib/admin/resolve");

    const result = await resolveReport("1", "resolved", "admin-1");

    expect(result).toEqual({
      success: true,
      reportId: "1",
      action: "resolved",
      messageAction: "kept",
    });
    expect(reportTable.update).toHaveBeenCalledWith({ status: "resolved" });
    expect(auditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-1",
        action: "report_resolved",
        entityId: "1",
      }),
    );
  });

  it("dismisses a pending report without deleting its message", async () => {
    const { resolveReport } = await import("@/lib/admin/resolve");

    const result = await resolveReport("1", "dismissed", "admin-1");

    expect(result.action).toBe("dismissed");
    expect(result.messageAction).toBe("kept");
    expect(messageTable.update).not.toHaveBeenCalled();
  });

  it("marks the reported message removed when a resolved report requests deletion", async () => {
    const { resolveReport } = await import("@/lib/admin/resolve");

    const result = await resolveReport("1", "resolved", "admin-1", true);

    expect(result.messageAction).toBe("deleted");
    expect(messageTable.update).toHaveBeenCalledWith({ status: "removed" });
  });
});
