import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis";

const IDEMPOTENCY_TTL = 86_400;

export async function checkIdempotency(key: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(`idem:${key}`);
  return exists === 1;
}

export async function storeIdempotency(key: string, value: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`idem:${key}`, value, { ex: IDEMPOTENCY_TTL });
}

export function generateIdempotencyKey(
  cardId: string,
  content: string,
  sessionToken: string,
): string {
  return createHash("sha256").update(`${cardId}:${content}:${sessionToken}`).digest("hex");
}
