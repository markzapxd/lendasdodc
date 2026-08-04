import { requireAdmin } from "@/lib/moderation/admin-auth";

export async function GET(request: Request): Promise<Response> {
  try {
    const { adminId } = await requireAdmin(request);
    return Response.json({ user: { id: adminId, role: "admin" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
