import type { ReportReason, ReportSubmissionRequest } from "@/lib/moderation";
import { submitReport } from "@/lib/moderation";
import { validateSession } from "@/lib/session";

const reportReasons = new Set<ReportReason>(["spam", "abuse", "inappropriate", "other"]);

function cookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) return valueParts.join("=") || null;
  }
  return null;
}

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message.includes("Too many reports")
    ? 429
    : message.includes("already been reported") || message.includes("own message")
      ? 409
      : 500;
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const sessionToken = cookieValue(request.headers.get("cookie"), "_ldc_session");
    const session = sessionToken ? await validateSession(sessionToken) : null;
    const sessionHmac = session?.sessionHmac ?? request.headers.get("x-session-hmac");
    if (!sessionHmac)
      return Response.json({ error: "Anonymous session required" }, { status: 401 });

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const messageId =
      "messageId" in body && typeof body.messageId === "string" ? body.messageId : "";
    const cardId = "cardId" in body && typeof body.cardId === "string" ? body.cardId : "";
    const reason = "reason" in body && typeof body.reason === "string" ? body.reason : "";
    const details =
      "details" in body && typeof body.details === "string" ? body.details : undefined;

    if (!messageId || !cardId || !reportReasons.has(reason as ReportReason)) {
      return Response.json(
        { error: "messageId, cardId, and a valid reason are required" },
        { status: 400 },
      );
    }
    if (details !== undefined && details.length > 500) {
      return Response.json({ error: "details must be 500 characters or fewer" }, { status: 400 });
    }

    const reportRequest: ReportSubmissionRequest = {
      messageId,
      cardId,
      reason: reason as ReportReason,
      ...(details === undefined ? {} : { details }),
    };
    const report = await submitReport(reportRequest, sessionHmac);
    return Response.json(report, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
