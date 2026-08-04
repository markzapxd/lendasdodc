import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateImage: vi.fn(),
  optimizeImage: vi.fn(),
  uploadToStaging: vi.fn(),
  moveToProduction: vi.fn(),
  recordAuditEvent: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/images", () => ({
  IMAGE_CONFIG: { maxFileSize: 4 * 1024 * 1024 },
  validateImage: mocks.validateImage,
  optimizeImage: mocks.optimizeImage,
  uploadToStaging: mocks.uploadToStaging,
  moveToProduction: mocks.moveToProduction,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mocks.recordAuditEvent,
}));

vi.mock("@/lib/moderation/admin-auth", () => ({
  requireAdmin: mocks.requireAdmin,
}));

const metadata = {
  width: 1200,
  height: 630,
  format: "jpeg" as const,
  size: 1000,
  hasAlpha: false,
};

function createUploadRequest(file?: File, cardId?: string, cookie?: string): NextRequest {
  const formData = new FormData();
  if (file) formData.set("file", file);
  if (cardId) formData.set("cardId", cardId);

  return new NextRequest("http://localhost/api/admin/upload", {
    method: "POST",
    body: formData,
    ...(cookie ? { headers: { cookie } } : {}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.validateImage.mockResolvedValue({ valid: true, metadata });
  mocks.optimizeImage.mockResolvedValue(Buffer.from("optimized"));
  mocks.uploadToStaging.mockResolvedValue({
    publicUrl: "https://example.com/staging/image.jpg",
    storagePath: "cards/card-1/123456.jpg",
    metadata,
  });
  mocks.moveToProduction.mockResolvedValue("https://example.com/prod/image.jpg");
  mocks.recordAuditEvent.mockResolvedValue(undefined);
  mocks.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
});

describe("Upload Processing", () => {
  it("processes a valid image through staging and production", async () => {
    const { processImageUpload } = await import("@/lib/admin/upload");

    const result = await processImageUpload(Buffer.from("test"), "image/jpeg", "card-1");

    expect(result).toEqual({
      publicUrl: "https://example.com/prod/image.jpg",
      storagePath: "cards/card-1/123456.jpg",
      metadata,
    });
    expect(mocks.optimizeImage).toHaveBeenCalledWith(Buffer.from("test"), metadata);
    expect(mocks.uploadToStaging).toHaveBeenCalledWith(
      Buffer.from("optimized"),
      "card-1",
      metadata,
    );
    expect(mocks.moveToProduction).toHaveBeenCalledWith("cards/card-1/123456.jpg");
  });

  it("rejects an invalid image before optimization", async () => {
    mocks.validateImage.mockResolvedValue({ valid: false, error: "Invalid image format" });
    const { processImageUpload } = await import("@/lib/admin/upload");

    await expect(processImageUpload(Buffer.from("test"), "image/gif", "card-1")).rejects.toThrow(
      "Invalid image format",
    );
    expect(mocks.optimizeImage).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/upload", () => {
  it("rejects requests without an authenticated admin session", async () => {
    const { POST } = await import("@/app/api/admin/upload/route");
    const response = await POST(
      createUploadRequest(new File(["test"], "image.jpg", { type: "image/jpeg" }), "card-1"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mocks.requireAdmin).toHaveBeenCalledWith(expect.any(Request), true);
  });

  it("rejects files larger than 4 MiB before reading or processing them", async () => {
    mocks.requireAdmin.mockResolvedValue({ adminId: "admin-1", csrfRequired: true });
    const { POST } = await import("@/app/api/admin/upload/route");
    const oversizedFile = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    });

    const response = await POST(createUploadRequest(oversizedFile, "card-1", "session=token"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "File too large" });
    expect(mocks.validateImage).not.toHaveBeenCalled();
  });

  it("returns the production URL and records the image upload audit event", async () => {
    mocks.requireAdmin.mockResolvedValue({ adminId: "admin-1", csrfRequired: true });
    const { POST } = await import("@/app/api/admin/upload/route");
    const response = await POST(
      createUploadRequest(
        new File(["test"], "image.jpg", { type: "image/jpeg" }),
        "card-1",
        "session=token",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      url: "https://example.com/prod/image.jpg",
      metadata,
    });
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith({
      actorId: "admin-1",
      action: "card_updated",
      entityType: "card",
      entityId: "card-1",
      context: { action: "image_upload", storagePath: "cards/card-1/123456.jpg" },
      timestamp: expect.any(Number),
    });
  });

  it("rejects requests missing a file or card ID", async () => {
    mocks.requireAdmin.mockResolvedValue({ adminId: "admin-1", csrfRequired: true });
    const { POST } = await import("@/app/api/admin/upload/route");
    const response = await POST(createUploadRequest(undefined, "card-1", "session=token"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing file or cardId" });
  });
});
