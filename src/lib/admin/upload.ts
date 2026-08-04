import type { ImageMetadata, ImageUploadResult } from "@/lib/images";
import { moveToProduction, optimizeImage, uploadToStaging, validateImage } from "@/lib/images";

export class ImageUploadValidationError extends Error {
  readonly code = "IMAGE_UPLOAD_VALIDATION";

  constructor(message: string) {
    super(message);
    this.name = "ImageUploadValidationError";
  }
}

export async function processImageUpload(
  buffer: Buffer,
  contentType: string,
  cardId: string,
): Promise<ImageUploadResult> {
  const validation = await validateImage(buffer, contentType);
  if (!validation.valid) {
    throw new ImageUploadValidationError(validation.error ?? "Invalid image");
  }

  const metadata: ImageMetadata | undefined = validation.metadata;
  if (!metadata) {
    throw new ImageUploadValidationError("Invalid image metadata");
  }

  const optimizedBuffer = await optimizeImage(buffer, metadata);
  const stagedImage = await uploadToStaging(optimizedBuffer, cardId, metadata);
  const publicUrl = await moveToProduction(stagedImage.storagePath);

  return { ...stagedImage, publicUrl };
}
