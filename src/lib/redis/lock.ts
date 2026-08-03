import { getRedis } from "./index";

export type LockOptions = {
  readonly ttlMs: number;
  readonly retryAttempts?: number;
  readonly retryDelayMs?: number;
};

const RELEASE_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  end
  return 0
`;

export async function acquireLock(lockKey: string, options: LockOptions): Promise<string | null> {
  const redis = getRedis();
  const token = `${Date.now()}-${crypto.randomUUID()}`;
  const key = `lock:${lockKey}`;
  const attempts = options.retryAttempts ?? 3;
  const delay = options.retryDelayMs ?? 100;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const acquired = await redis.set(key, token, { nx: true, px: options.ttlMs });
    if (acquired) {
      return token;
    }

    if (attempt < attempts - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

export async function releaseLock(lockKey: string, token: string): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.eval<string[], number>(RELEASE_SCRIPT, [`lock:${lockKey}`], [token]);
  return result === 1;
}

export async function withLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  options: LockOptions,
): Promise<T> {
  const token = await acquireLock(lockKey, options);
  if (!token) {
    throw new Error(`Failed to acquire lock: ${lockKey}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(lockKey, token);
  }
}
