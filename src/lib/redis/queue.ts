import { z } from "zod";
import { getRedis } from "./index";

export type QueueItem = {
  readonly id: string;
  readonly cardId: string;
  readonly contentHash: string;
  readonly sessionId: string;
  readonly receiptHash: string;
  readonly enqueuedAt: number;
};

export type QueueStats = {
  readonly pending: number;
  readonly processing: number;
  readonly published: number;
  readonly failed: number;
};

const queueItemSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  contentHash: z.string(),
  sessionId: z.string(),
  receiptHash: z.string(),
  enqueuedAt: z.number(),
});

const ENQUEUE_SCRIPT = `
  local idempotency_key = KEYS[1]
  local pending_key = KEYS[2]

  if redis.call("SET", idempotency_key, "1", "EX", ARGV[3], "NX") == false then
    return 0
  end

  redis.call("ZADD", pending_key, ARGV[1], ARGV[2])
  return 1
`;

const DEQUEUE_SCRIPT = `
  local pending_key = KEYS[1]
  local processing_key = KEYS[2]
  local limit = tonumber(ARGV[1])
  local processing_score = tonumber(ARGV[2])
  local moved = {}

  if limit <= 0 then
    return moved
  end

  local members = redis.call("ZRANGE", pending_key, 0, limit - 1)
  for _, member in ipairs(members) do
    if redis.call("ZREM", pending_key, member) == 1 then
      redis.call("ZADD", processing_key, processing_score, member)
      table.insert(moved, member)
    end
  end

  return moved
`;

const COMPLETE_SCRIPT = `
  local removed = redis.call("ZREM", KEYS[1], ARGV[1])
  if removed == 1 then
    redis.call("ZADD", KEYS[2], ARGV[2], ARGV[1])
  end
  return removed
`;

export async function enqueueSubmission(item: QueueItem): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.eval<string[], number>(
    ENQUEUE_SCRIPT,
    [`idem:${item.id}`, `queue:pending:${item.cardId}`],
    [String(item.enqueuedAt), JSON.stringify(item), "86400"],
  );

  return result === 1;
}

export async function dequeueSubmissions(cardId: string, limit: number): Promise<QueueItem[]> {
  const redis = getRedis();
  const members = await redis.eval<string[], readonly string[]>(
    DEQUEUE_SCRIPT,
    [`queue:pending:${cardId}`, `queue:processing:${cardId}`],
    [String(limit), String(Date.now())],
  );

  return members.map((member) => queueItemSchema.parse(JSON.parse(member) as unknown));
}

export async function completeQueueItem(
  cardId: string,
  item: QueueItem,
  status: "published" | "failed",
): Promise<void> {
  const redis = getRedis();
  const targetKey = `queue:${status}:${cardId}`;
  await redis.eval<string[], number>(
    COMPLETE_SCRIPT,
    [`queue:processing:${cardId}`, targetKey],
    [JSON.stringify(item), String(Date.now())],
  );
}

export async function getQueueStats(cardId: string): Promise<QueueStats> {
  const redis = getRedis();
  const [pending, processing, published, failed] = await Promise.all([
    redis.zcard(`queue:pending:${cardId}`),
    redis.zcard(`queue:processing:${cardId}`),
    redis.zcard(`queue:published:${cardId}`),
    redis.zcard(`queue:failed:${cardId}`),
  ]);

  return { pending, processing, published, failed };
}
