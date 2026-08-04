import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCards = vi.hoisted(() => {
  const cards = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "A Mulher-Maravilha",
      slug: "a-mulher-maravilha",
      description: "Mensagens para alguém.",
      image_url: null,
      image_alt: null,
      status: "active",
      message_count: 3,
      last_activity_at: null,
      created_at: "2026-08-04T10:00:00.000Z",
      updated_at: "2026-08-04T10:00:00.000Z",
    },
  ];
  const select = vi.fn(() => ({
    order: vi.fn(() => Promise.resolve({ data: cards, error: null })),
  }));
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: cards[0], error: null })),
    })),
  }));
  const update = vi.fn(() => ({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: cards[0], error: null })),
      })),
    })),
  }));
  const from = vi.fn(() => ({ select, insert, update }));
  const schema = vi.fn(() => ({ from }));
  const createAdminClient = vi.fn(() => ({ schema }));
  const recordCardAuditEvent = vi.fn(() => Promise.resolve());

  return { cards, select, insert, update, from, schema, createAdminClient, recordCardAuditEvent };
});

const mockAuth = vi.hoisted(() => ({ requireAdmin: vi.fn() }));

vi.mock("@/lib/supabase", () => ({ createAdminClient: mockCards.createAdminClient }));
vi.mock("@/lib/admin/card-audit", () => ({
  recordCardAuditEvent: mockCards.recordCardAuditEvent,
}));
vi.mock("@/lib/moderation/admin-auth", () => mockAuth);

describe("card administration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.requireAdmin.mockResolvedValue({ adminId: "admin-1", csrfRequired: false });
  });

  it("lists every card status for authenticated administrators", async () => {
    const { getCards } = await import("@/lib/admin/cards");

    await expect(getCards()).resolves.toHaveLength(1);
    expect(mockCards.schema).toHaveBeenCalledWith("api");
    expect(mockCards.select).toHaveBeenCalledWith(
      "id, name, slug, description, image_url, image_alt, status, message_count, last_activity_at, created_at, updated_at",
    );
  });

  it("creates a card with only writable Card fields and records the actor", async () => {
    const { createCard } = await import("@/lib/admin/cards");

    await createCard(
      {
        name: "A Mulher-Maravilha",
        slug: "a-mulher-maravilha",
        description: "Mensagens para alguém.",
        image_url: null,
        image_alt: null,
      },
      "admin-1",
    );

    expect(mockCards.insert).toHaveBeenCalledWith({
      name: "A Mulher-Maravilha",
      slug: "a-mulher-maravilha",
      description: "Mensagens para alguém.",
      image_url: null,
      image_alt: null,
      status: "active",
    });
    expect(mockCards.recordCardAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "card.create", adminId: "admin-1" }),
    );
  });

  it("uses archive and restore statuses without deleting a card", async () => {
    const { setCardStatus } = await import("@/lib/admin/cards");

    await setCardStatus("00000000-0000-4000-8000-000000000001", "archived", "admin-1");
    await setCardStatus("00000000-0000-4000-8000-000000000001", "active", "admin-1");

    expect(mockCards.update).toHaveBeenNthCalledWith(1, { status: "archived" });
    expect(mockCards.update).toHaveBeenNthCalledWith(2, { status: "active" });
    expect(mockCards.recordCardAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "card.archive" }),
    );
    expect(mockCards.recordCardAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "card.restore" }),
    );
  });

  it("rejects cookie mutations when the shared CSRF guard denies them", async () => {
    mockAuth.requireAdmin.mockRejectedValue(new Error("Forbidden"));
    const { POST } = await import("@/app/api/admin/cards/route");

    const response = await POST(
      new Request("http://localhost/api/admin/cards", {
        method: "POST",
        headers: { cookie: "_ldc_admin_session=session" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockCards.insert).not.toHaveBeenCalled();
  });
});
