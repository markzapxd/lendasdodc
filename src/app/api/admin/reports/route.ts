import type { ReportStatus } from "@/lib/moderation";
import { getReportsForReview, resolveReport } from "@/lib/moderation";
import { requireAdmin } from "@/lib/moderation/admin-auth";

const reportStatuses = new Set<ReportStatus>(["pending", "reviewed", "resolved", "dismissed"]);

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return Response.json({ error: message }, { status });
}

function parseLimit(value: string | null): number {
  if (value === null) return 50;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Invalid limit");
  return limit;
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";
    if (!reportStatuses.has(status as ReportStatus)) {
      return Response.json({ error: "Invalid report status" }, { status: 400 });
    }

    const reports = await getReportsForReview(
      status as ReportStatus,
      parseLimit(url.searchParams.get("limit")),
    );
    return Response.json({ reports });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const { adminId } = await requireAdmin(request, true);
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) throw new Error("Invalid request body");

    const reportId = "reportId" in body && typeof body.reportId === "string" ? body.reportId : "";
    const status = "status" in body && typeof body.status === "string" ? body.status : "";
    if (!reportId || (status !== "resolved" && status !== "dismissed")) {
      return Response.json(
        { error: "reportId and a resolvable status are required" },
        { status: 400 },
      );
    }

    await resolveReport(reportId, status, adminId);
    return Response.json({ reportId, status });
  } catch (error) {
    return errorResponse(error);
  }
}
