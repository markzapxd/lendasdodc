/**
 * Image validation result.
 */
export interface ImageValidation {
  valid: boolean;
  error?: string;
  metadata?: ImageMetadata;
}

/**
 * Image metadata after processing.
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: "jpeg" | "png" | "webp";
  size: number;
  hasAlpha: boolean;
}

/**
 * Image upload result.
 */
export interface ImageUploadResult {
  /** Public URL for serving */
  publicUrl: string;
  /** Storage path */
  storagePath: string;
  /** Image metadata */
  metadata: ImageMetadata;
}

/**
 * Image configuration.
 */
export const IMAGE_CONFIG = {
  /** Maximum file size (4 MiB) */
  maxFileSize: 4 * 1024 * 1024,
  /** Allowed MIME types */
  allowedMimes: ["image/jpeg", "image/png", "image/webp"] as const,
  /** Target dimensions for cover images */
  coverDimensions: {
    width: 1200,
    height: 630,
  },
  /** Quality for JPEG/WebP */
  quality: 85,
  /** Storage buckets */
  buckets: {
    staging: "card-images-staging",
    production: "card-images",
  },
} as const;
