import { getRedis } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase";
import { processSubmissions } from "./publisher";

const SCHEDULER_KEY = "scheduler:last_run";
const SCHEDULER_INTERVAL_MS = 60 * 1000;

/**
 * Check if scheduler should run.
 * Uses Redis to prevent concurrent runs.
 *
 * @returns Whether scheduler should execute
 */
export async function shouldRun(): Promise<boolean> {
  const redis = getRedis();
  const lastRun = await redis.get(SCHEDULER_KEY);

  if (!lastRun) {
    return true;
  }

  const lastRunTime = Number(lastRun);
  return Date.now() - lastRunTime >= SCHEDULER_INTERVAL_MS;
}

/** Mark scheduler as having run. */
export async function markRun(): Promise<void> {
  const redis = getRedis();
  await redis.set(SCHEDULER_KEY, Date.now().toString());
}

/** Run the scheduler for all active cards. */
export async function runScheduler(): Promise<{
  readonly processed: number;
  readonly cards: number;
  readonly duration: number;
}> {
  const start = Date.now();

  if (!(await shouldRun())) {
    return { processed: 0, cards: 0, duration: 0 };
  }

  const supabase = createAdminClient();
  const { data: cards } = await supabase.from("cards").select("id").eq("status", "active");

  if (!cards || cards.length === 0) {
    await markRun();
    return { processed: 0, cards: 0, duration: Date.now() - start };
  }

  let totalProcessed = 0;
  for (const card of cards) {
    if (typeof card.id === "string") {
      totalProcessed += await processSubmissions(card.id);
    }
  }

  await markRun();

  return {
    processed: totalProcessed,
    cards: cards.length,
    duration: Date.now() - start,
  };
}
