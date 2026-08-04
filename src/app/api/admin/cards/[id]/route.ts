import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cardWriteSchema, setCardStatus, updateCard } from "@/lib/admin/cards";
import { requireAdmin } from "@/lib/moderation/admin-auth";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

const updateRequestSchema = z.object({
  action: z.literal("update"),
  card: cardWriteSchema,
});

const statusRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("restore") }),
]);

const patchRequestSchema = z.union([updateRequestSchema, statusRequestSchema]);
const cardIdSchema = z.string().uuid();

function errorResponse(error: unknown): Response {
  if (error instanceof SyntaxError) {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (error instanceof z.ZodError) {
    return Response.json(
      { error: "Ação ou dados do card inválidos.", issues: error.issues },
      { status: 400 },
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return Response.json(
    { error: status === 500 ? "Não foi possível atualizar o card." : message },
    { status },
  );
}

export async function PATCH(request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const { adminId } = await requireAdmin(request, true);
    const id = cardIdSchema.parse((await params).id);
    const requestBody = patchRequestSchema.parse(await request.json());

    if (requestBody.action === "update") {
      const card = await updateCard(id, requestBody.card, adminId);
      revalidatePath("/");
      revalidatePath(`/card/${card.slug}`);
      return Response.json({ card });
    }

    const status = requestBody.action === "archive" ? "archived" : "active";
    const card = await setCardStatus(id, status, adminId);
    revalidatePath("/");
    revalidatePath(`/card/${card.slug}`);
    return Response.json({ card });
  } catch (error) {
    return errorResponse(error);
  }
}
