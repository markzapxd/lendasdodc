import { beforeEach, describe, expect, it, vi } from "vitest";

const { sharpMock } = vi.hoisted(() => ({
  sharpMock: vi.fn(),
}));

vi.mock("sharp", () => ({ default: sharpMock }));

import { optimizeImage } from "@/lib/images/optimize";
import { validateImage } from "@/lib/images/validate";

function configureSharp(metadata: Record<string, unknown> = {}) {
  const chain = {
    metadata: vi.fn().mockResolvedValue({
      width: 1200,
      height: 630,
      format: "jpeg",
      hasAlpha: false,
      ...metadata,
    }),
    resize: vi.fn(),
    toFormat: vi.fn(),
    webp: vi.fn(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("optimized")),
  };

  chain.resize.mockReturnValue(chain);
  chain.toFormat.mockReturnValue(chain);
  chain.webp.mockReturnValue(chain);
  sharpMock.mockReturnValue(chain);
  return chain;
}

describe("Image Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateImage", () => {
    it("accepts valid JPEG", async () => {
      configureSharp();

      const result = await validateImage(Buffer.from("test-image"), "image/jpeg");

      expect(result).toEqual({
        valid: true,
        metadata: {
          width: 1200,
          height: 630,
          format: "jpeg",
          size: 10,
          hasAlpha: false,
        },
      });
    });

    it("rejects invalid MIME type", async () => {
      const result = await validateImage(Buffer.from("test"), "image/gif");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid MIME type");
      expect(sharpMock).not.toHaveBeenCalled();
    });

    it("rejects oversized files", async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024);
      const result = await validateImage(largeBuffer, "image/jpeg");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("File too large");
      expect(sharpMock).not.toHaveBeenCalled();
    });

    it("rejects dimensions below the minimum", async () => {
      configureSharp({ width: 99, height: 630 });

      const result = await validateImage(Buffer.from("test-image"), "image/jpeg");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Image too small");
    });

    it("rejects a mismatched declared MIME type", async () => {
      configureSharp({ format: "png" });

      const result = await validateImage(Buffer.from("test-image"), "image/jpeg");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("does not match MIME type");
    });
  });

  describe("optimizeImage", () => {
    it("optimizes image to cover dimensions", async () => {
      const chain = configureSharp();

      const optimized = await optimizeImage(Buffer.from("test"), {
        width: 1200,
        height: 630,
        format: "jpeg",
        size: 1000,
        hasAlpha: false,
      });

      expect(optimized).toEqual(Buffer.from("optimized"));
      expect(chain.resize).toHaveBeenCalledWith(1200, 630, {
        fit: "cover",
        position: "centre",
      });
      expect(chain.toFormat).toHaveBeenCalledWith("jpeg", {
        quality: 85,
        mozjpeg: true,
      });
    });
  });
});
