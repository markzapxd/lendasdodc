import { type NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";
import { processDeadLetterQueue } from "@/lib/worker/dead-letter";
import { getWorkerMetrics } from "@/lib/worker/monitor";
import { processAllQueues } from "@/lib/worker/publisher";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const processed = await processAllQueues();
    const deadLetterEntries = await processDeadLetterQueue(10);
    const metrics = await getWorkerMetrics();

    return NextResponse.json({
      success: true,
      processed,
      dlqProcessed: deadLetterEntries.length,
      duration: Date.now() - startTime,
      metrics,
    });
  } catch (error) {
    console.error("Worker cron failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const metrics = await getWorkerMetrics();

    return NextResponse.json({ status: "ok", metrics, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ status: "error", error: "Failed to get metrics" }, { status: 500 });
  }
}
