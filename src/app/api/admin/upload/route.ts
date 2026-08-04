import { z } from "zod";
import { ImageUploadValidationError, processImageUpload } from "@/lib/admin/upload";
import { recordAuditEvent } from "@/lib/audit";
import { IMAGE_CONFIG } from "@/lib/images";
import { requireAdmin } from "@/lib/moderation/admin-auth";

const uploadFormSchema = z
  .object({
    file: z.instanceof(File),
    cardId: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .regex(/^[a-zA-Z0-9_-]+$/),
  })
  .strict();

type UploadForm = z.infer<typeof uploadFormSchema>;

function errorResponse(error: unknown): Response {
  if (error instanceof ImageUploadValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof Error && error.message === "Unauthorized") {
    return Response.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return Response.json({ error: error.message }, { status: 403 });
  }

  return Response.json({ error: "Internal server error" }, { status: 500 });
}

function hasOversizedBody(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  if (contentLength === null) return false;

  const parsedLength = Number(contentLength);
  return Number.isSafeInteger(parsedLength) && parsedLength > IMAGE_CONFIG.maxFileSize;
}

async function parseUploadForm(request: Request): Promise<UploadForm | Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const formValues = Object.fromEntries(formData.entries());
  if (!Object.hasOwn(formValues, "file") || !Object.hasOwn(formValues, "cardId")) {
    return Response.json({ error: "Missing file or cardId" }, { status: 400 });
  }

  const parsedForm = uploadFormSchema.safeParse(formValues);
  if (!parsedForm.success) {
    return Response.json({ error: "Invalid file or cardId" }, { status: 400 });
  }

  return parsedForm.data;
}

export async function POST(request: Request): Promise<Response> {
  let adminId: string;
  try {
    ({ adminId } = await requireAdmin(request, true));
  } catch (error) {
    return errorResponse(error);
  }

  if (hasOversizedBody(request)) {
    return Response.json({ error: "File too large" }, { status: 400 });
  }

  const parsedUpload = await parseUploadForm(request);
  if (parsedUpload instanceof Response) {
    return parsedUpload;
  }

  if (parsedUpload.file.size > IMAGE_CONFIG.maxFileSize) {
    return Response.json({ error: "File too large" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await parsedUpload.file.arrayBuffer());
    const result = await processImageUpload(buffer, parsedUpload.file.type, parsedUpload.cardId);

    await recordAuditEvent({
      actorId: adminId,
      action: "card_updated",
      entityType: "card",
      entityId: parsedUpload.cardId,
      context: { action: "image_upload", storagePath: result.storagePath },
      timestamp: Date.now(),
    });

    return Response.json({ success: true, url: result.publicUrl, metadata: result.metadata });
  } catch (error) {
    return errorResponse(error);
  }
}
