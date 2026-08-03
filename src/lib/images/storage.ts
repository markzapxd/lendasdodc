import "server-only";

import { createAdminClient } from "@/lib/supabase";
import type { ImageMetadata, ImageUploadResult } from "./types";
import { IMAGE_CONFIG } from "./types";

/**
 * Upload image to staging bucket.
 *
 * The caller must pass validated and optimized bytes. Staging remains private
 * until the derivative is explicitly moved to the public production bucket.
 */
export async function uploadToStaging(
  buffer: Buffer,
  cardId: string,
  metadata: ImageMetadata,
): Promise<ImageUploadResult> {
  const supabase = createAdminClient();
  const timestamp = Date.now();
  const storagePath = `cards/${cardId}/${timestamp}.${metadata.format}`;

  const { error } = await supabase.storage
    .from(IMAGE_CONFIG.buckets.staging)
    .upload(storagePath, buffer, {
      contentType: `image/${metadata.format}`,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Failed to upload to staging: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(IMAGE_CONFIG.buckets.staging)
    .getPublicUrl(storagePath);

  return {
    publicUrl: urlData.publicUrl,
    storagePath,
    metadata,
  };
}

/**
 * Move image from staging to production.
 *
 * @param stagingPath - Path in staging bucket
 * @returns Production URL
 */
export async function moveToProduction(stagingPath: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(IMAGE_CONFIG.buckets.staging)
    .download(stagingPath);

  if (downloadError || !fileData) {
    throw new Error(
      `Failed to download from staging: ${downloadError?.message ?? "Unknown error"}`,
    );
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const productionPath = stagingPath.replace(/^cards\//, "");

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_CONFIG.buckets.production)
    .upload(productionPath, buffer, {
      contentType: fileData.type,
      cacheControl: "31536000",
    });

  if (uploadError) {
    throw new Error(`Failed to upload to production: ${uploadError.message}`);
  }

  await supabase.storage.from(IMAGE_CONFIG.buckets.staging).remove([stagingPath]);

  const { data: urlData } = supabase.storage
    .from(IMAGE_CONFIG.buckets.production)
    .getPublicUrl(productionPath);

  return urlData.publicUrl;
}

/**
 * Delete image from production.
 *
 * @param storagePath - Storage path in production bucket
 */
export async function deleteFromProduction(storagePath: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(IMAGE_CONFIG.buckets.production)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete from production: ${error.message}`);
  }
}

/**
 * Get public URL for an image.
 *
 * @param storagePath - Storage path in production bucket
 * @returns Public URL
 */
export function getPublicUrl(storagePath: string): string {
  const supabase = createAdminClient();

  const { data } = supabase.storage.from(IMAGE_CONFIG.buckets.production).getPublicUrl(storagePath);

  return data.publicUrl;
}
