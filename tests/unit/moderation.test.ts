import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "1",
            message_id: "1",
            card_id: "1",
            reason_code: "spam",
            detail_hash: "",
            status: "pending",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
};

vi.mock("@/lib/supabase", () => ({
  createAdminClient: vi.fn().mockReturnValue(supabaseMock),
}));

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockReturnValue({
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
  recordSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("moderation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits a report", async () => {
    const { submitReport } = await import("@/lib/moderation/reports");

    const report = await submitReport(
      { messageId: "1", cardId: "1", reason: "spam" },
      "session-hmac",
    );

    expect(report).toMatchObject({
      id: "1",
      messageId: "1",
      cardId: "1",
      reason: "spam",
      status: "pending",
    });
  });

  it("moderates a message and records the action", async () => {
    supabaseMock.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "message-1", card_id: "card-1" },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const { moderateMessage } = await import("@/lib/moderation/moderate");

    await expect(moderateMessage("message-1", "approve", "admin-1")).resolves.toMatchObject({
      action: "approve",
      messageId: "message-1",
      moderatedBy: "admin-1",
    });
  });
});
