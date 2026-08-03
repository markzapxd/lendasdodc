import sharp from "sharp";
import type { ImageMetadata } from "./types";
import { IMAGE_CONFIG } from "./types";

/**
 * Optimize image for cover display.
 * Resizes to target dimensions and compresses.
 *
 * @param buffer - Original image buffer
 * @param metadata - Image metadata
 * @returns Optimized image buffer
 */
export async function optimizeImage(buffer: Buffer, metadata: ImageMetadata): Promise<Buffer> {
  const { width, height } = IMAGE_CONFIG.coverDimensions;

  return sharp(buffer)
    .resize(width, height, {
      fit: "cover",
      position: "centre",
    })
    .toFormat(metadata.format, {
      quality: IMAGE_CONFIG.quality,
      ...(metadata.hasAlpha ? {} : { mozjpeg: true }),
    })
    .toBuffer();
}

/**
 * Generate WebP variant for modern browsers.
 *
 * @param buffer - Original image buffer
 * @returns WebP buffer
 */
export async function generateWebP(buffer: Buffer): Promise<Buffer> {
  const { width, height } = IMAGE_CONFIG.coverDimensions;

  return sharp(buffer)
    .resize(width, height, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: IMAGE_CONFIG.quality })
    .toBuffer();
}
