import type { ModerationAction } from "@/lib/moderation";
import { getModerationQueue, moderateMessage } from "@/lib/moderation";
import { requireAdmin } from "@/lib/moderation/admin-auth";

const moderationActions = new Set<ModerationAction>(["approve", "reject", "delete", "flag"]);

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return Response.json({ error: message }, { status });
}

function parseLimit(value: string | null): number {
  if (value === null) return 50;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Invalid limit");
  }
  return limit;
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const messages = await getModerationQueue(
      url.searchParams.get("status") ?? "pending",
      parseLimit(url.searchParams.get("limit")),
    );
    return Response.json({ messages });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const { adminId } = await requireAdmin(request, true);
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) throw new Error("Invalid request body");

    const messageId =
      "messageId" in body && typeof body.messageId === "string" ? body.messageId : "";
    const action = "action" in body && typeof body.action === "string" ? body.action : "";
    const reason = "reason" in body && typeof body.reason === "string" ? body.reason : undefined;

    if (!messageId || !moderationActions.has(action as ModerationAction)) {
      return Response.json({ error: "messageId and a valid action are required" }, { status: 400 });
    }

    const result = await moderateMessage(messageId, action as ModerationAction, adminId, reason);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
