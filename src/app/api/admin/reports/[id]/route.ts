import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getReportDetails, resolveReport } from "@/lib/admin/resolve";
import { getTokenFromCookie, validateAdminSession } from "@/lib/auth/session";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

const resolutionRequestSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  deleteMessage: z.boolean().default(false),
});

/**
 * GET /api/admin/reports/[id]
 * Get report details.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const token = getTokenFromCookie(request.headers.get("cookie"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await validateAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const report = await getReportDetails(id);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 404 },
    );
  }
}

/**
 * PATCH /api/admin/reports/[id]
 * Resolve a report.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const token = getTokenFromCookie(request.headers.get("cookie"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await validateAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    throw error;
  }

  const parsedBody = resolutionRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid status. Must be "resolved" or "dismissed".' },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const result = await resolveReport(
      id,
      parsedBody.data.status,
      session.adminUserId,
      parsedBody.data.deleteMessage,
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
