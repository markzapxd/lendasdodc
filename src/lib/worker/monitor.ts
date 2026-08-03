import { getRedis } from "@/lib/redis";

const QUEUE_STATUSES = ["pending", "processing", "published", "failed"] as const;
type QueueStatus = (typeof QUEUE_STATUSES)[number];

export interface WorkerMetrics {
  readonly queues: Record<
    string,
    {
      pending: number;
      processing: number;
      published: number;
      failed: number;
    }
  >;
  readonly deadLetterSize: number;
  readonly lastRunAt: number | null;
  readonly processedToday: number;
}

function isQueueStatus(value: string): value is QueueStatus {
  return (QUEUE_STATUSES as readonly string[]).includes(value);
}

function createQueueStats(): WorkerMetrics["queues"][string] {
  return { pending: 0, processing: 0, published: 0, failed: 0 };
}

export async function getWorkerMetrics(): Promise<WorkerMetrics> {
  const redis = getRedis();
  const queueKeys = await redis.keys("queue:*");
  const queues: WorkerMetrics["queues"] = {};

  for (const key of queueKeys) {
    const parts = key.split(":");
    const status = parts[1];
    const cardId = parts.slice(2).join(":");

    if (parts.length < 3 || !status || !cardId || !isQueueStatus(status)) {
      continue;
    }

    queues[cardId] ??= createQueueStats();
    queues[cardId][status] = await redis.zcard(key);
  }

  const deadLetterSize = await redis.llen("dlq:operations");
  const lastRun = await redis.get<string>("scheduler:last_run");
  const processedKey = `worker:processed:${new Date().toISOString().split("T")[0]}`;
  const processedToday = await redis.get<string>(processedKey);

  return {
    queues,
    deadLetterSize,
    lastRunAt: lastRun ? Number(lastRun) : null,
    processedToday: Number(processedToday ?? 0),
  };
}

export async function recordProcessing(count: number): Promise<void> {
  const redis = getRedis();
  const key = `worker:processed:${new Date().toISOString().split("T")[0]}`;

  await redis.incrby(key, count);
  await redis.expire(key, 86400 * 7);
}
