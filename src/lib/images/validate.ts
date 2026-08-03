import sharp from "sharp";
import type { ImageMetadata, ImageValidation } from "./types";
import { IMAGE_CONFIG } from "./types";

type AllowedMime = (typeof IMAGE_CONFIG.allowedMimes)[number];

const formatForMime: Record<AllowedMime, ImageMetadata["format"]> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Validate an image buffer.
 *
 * @param buffer - Image buffer to validate
 * @param contentType - MIME type from request
 * @returns Validation result
 */
export async function validateImage(buffer: Buffer, contentType: string): Promise<ImageValidation> {
  const allowedMime = IMAGE_CONFIG.allowedMimes.find((mime) => mime === contentType);
  if (!allowedMime) {
    return {
      valid: false,
      error: `Invalid MIME type: ${contentType}. Allowed: ${IMAGE_CONFIG.allowedMimes.join(", ")}`,
    };
  }

  if (buffer.length > IMAGE_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File too large: ${buffer.length} bytes. Max: ${IMAGE_CONFIG.maxFileSize} bytes`,
    };
  }

  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: "Could not read image dimensions",
      };
    }

    if (metadata.width < 100 || metadata.height < 100) {
      return {
        valid: false,
        error: `Image too small: ${metadata.width}x${metadata.height}. Minimum: 100x100`,
      };
    }

    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio < 1.0 || aspectRatio > 2.5) {
      return {
        valid: false,
        error: `Invalid aspect ratio: ${aspectRatio.toFixed(2)}. Expected: 1.0-2.5`,
      };
    }

    const format = formatForMime[allowedMime];
    if (metadata.format !== format) {
      return {
        valid: false,
        error: `Image format does not match MIME type: expected ${format}, detected ${metadata.format}`,
      };
    }

    const imageMetadata: ImageMetadata = {
      width: metadata.width,
      height: metadata.height,
      format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha ?? false,
    };

    return { valid: true, metadata: imageMetadata };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate image: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
