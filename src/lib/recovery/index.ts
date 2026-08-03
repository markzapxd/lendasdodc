import { getRedis } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase";

/**
 * Retry configuration.
 */
interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Execute a function with exponential backoff retry.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === fullConfig.maxAttempts) {
        break;
      }

      const delay = Math.min(
        fullConfig.baseDelayMs * fullConfig.backoffMultiplier ** (attempt - 1),
        fullConfig.maxDelayMs,
      );

      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("Retry operation did not run");
}

/**
 * Add a failed operation to the dead letter queue.
 */
export async function addToDeadLetterQueue(
  operation: string,
  payload: unknown,
  error: Error,
): Promise<void> {
  const redis = getRedis();
  const entry = {
    operation,
    payload: JSON.stringify(payload),
    error: error.message,
    stack: error.stack,
    timestamp: Date.now(),
  };

  await redis.lpush("dlq:operations", JSON.stringify(entry));
  await redis.ltrim("dlq:operations", 0, 999);
}

/**
 * Process dead letter queue entries for manual review.
 */
export async function processDeadLetterQueue(limit = 10): Promise<Array<Record<string, unknown>>> {
  const redis = getRedis();
  const entries = await redis.lrange<string>("dlq:operations", 0, limit - 1);

  return entries.map((entry) => JSON.parse(entry));
}

/**
 * Check Redis and Supabase health.
 */
export async function checkSystemHealth(): Promise<{
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly checks: Record<string, boolean>;
}> {
  const checks = {
    redis: false,
    supabase: false,
  };

  try {
    await getRedis().ping();
    checks.redis = true;
  } catch {
    checks.redis = false;
  }

  try {
    const { error } = await createAdminClient().from("platform_state").select("key").limit(1);
    checks.supabase = error === null;
  } catch {
    checks.supabase = false;
  }

  const healthyChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.values(checks).length;
  const status =
    healthyChecks === totalChecks ? "healthy" : healthyChecks > 0 ? "degraded" : "unhealthy";

  return { status, checks };
}
