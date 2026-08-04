import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cardWriteSchema, createCard, getCards } from "@/lib/admin/cards";
import { requireAdmin } from "@/lib/moderation/admin-auth";

function errorResponse(error: unknown): Response {
  console.error("[Cards API Error]:", error);

  if (error instanceof SyntaxError) {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (error instanceof z.ZodError) {
    return Response.json(
      { error: "Dados do card inválidos.", issues: error.issues },
      { status: 400 },
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return Response.json(
    {
      error:
        status === 500 && process.env.NODE_ENV !== "development"
          ? "Não foi possível salvar o card."
          : message,
    },
    { status },
  );
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    return Response.json({ cards: await getCards() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { adminId } = await requireAdmin(request, true);
    const body: unknown = await request.json();
    const input = cardWriteSchema.parse(body);
    const card = await createCard(input, adminId);
    revalidatePath("/");
    return Response.json({ card }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
