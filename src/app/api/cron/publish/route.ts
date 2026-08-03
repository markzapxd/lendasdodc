import { type NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";
import { runScheduler } from "@/lib/worker/scheduler";

/** Cron endpoint for processing the publication queue. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScheduler();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/** Health check endpoint for the cron job. */
export function GET(): NextResponse {
  return NextResponse.json({ status: "ok", timestamp: Date.now() });
}
