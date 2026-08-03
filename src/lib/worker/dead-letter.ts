import { recordAuditEvent } from "@/lib/audit";
import { getRedis } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase";

const DEAD_LETTER_KEY = "dlq:operations";

export interface DeadLetterEntry {
  readonly operation: string;
  readonly payload: string;
  readonly error: string;
  readonly stack?: string;
  readonly timestamp: number;
}

interface RawDeadLetterEntry {
  operation?: unknown;
  payload?: unknown;
  error?: unknown;
  stack?: unknown;
  timestamp?: unknown;
}

function parseDeadLetterEntry(raw: string): DeadLetterEntry {
  const value: unknown = JSON.parse(raw);

  if (typeof value !== "object" || value === null) {
    throw new Error("Dead letter entry must be an object");
  }

  const entry = value as RawDeadLetterEntry;
  if (
    typeof entry.operation !== "string" ||
    typeof entry.payload !== "string" ||
    typeof entry.error !== "string" ||
    typeof entry.timestamp !== "number" ||
    !Number.isFinite(entry.timestamp) ||
    (entry.stack !== undefined && typeof entry.stack !== "string")
  ) {
    throw new Error("Dead letter entry has an invalid shape");
  }

  return {
    operation: entry.operation,
    payload: entry.payload,
    error: entry.error,
    ...(typeof entry.stack === "string" ? { stack: entry.stack } : {}),
    timestamp: entry.timestamp,
  };
}

async function recordRetryFailure(entry: DeadLetterEntry, error: unknown): Promise<void> {
  const retryError = error instanceof Error ? error.message : "Unknown";
  await recordAuditEvent({
    actorId: "system",
    action: "system_error",
    entityType: "dead_letter",
    entityId: entry.operation,
    context: {
      originalError: entry.error,
      retryError,
    },
    timestamp: Date.now(),
  });
}

async function retryOperation(entry: DeadLetterEntry): Promise<void> {
  const payload: unknown = JSON.parse(entry.payload);
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Dead letter payload must be an object");
  }

  const values = payload as Record<string, unknown>;
  const supabase = createAdminClient();
  const requiredString = (key: string): string => {
    const value = values[key];
    if (typeof value !== "string") {
      throw new Error(`Dead letter payload is missing ${key}`);
    }
    return value;
  };

  switch (entry.operation) {
    case "publish_message": {
      const { error } = await supabase.from("messages").insert({
        card_id: requiredString("cardId"),
        content_hmac: requiredString("contentHmac"),
        status: "published",
        published_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }
      return;
    }

    case "process_report": {
      const { error } = await supabase
        .from("reports")
        .update({ status: "reviewed" })
        .eq("id", requiredString("reportId"));

      if (error) {
        throw new Error(error.message);
      }
      return;
    }

    default:
      throw new Error(`Unknown operation: ${entry.operation}`);
  }
}

export async function processDeadLetterQueue(limit = 10): Promise<DeadLetterEntry[]> {
  const redis = getRedis();
  const entries: DeadLetterEntry[] = [];

  for (let index = 0; index < limit; index += 1) {
    const raw = await redis.rpop<string>(DEAD_LETTER_KEY);
    if (!raw) {
      break;
    }

    let entry: DeadLetterEntry;
    try {
      entry = parseDeadLetterEntry(raw);
    } catch (error) {
      await redis.rpush(DEAD_LETTER_KEY, raw);
      console.error("Invalid DLQ entry:", error);
      continue;
    }

    entries.push(entry);

    try {
      await retryOperation(entry);
    } catch (error) {
      await redis.rpush(DEAD_LETTER_KEY, raw);
      console.error("DLQ retry failed:", error);
      await recordRetryFailure(entry, error);
    }
  }

  return entries;
}

export async function addToDeadLetterQueue(
  operation: string,
  payload: unknown,
  error: Error,
): Promise<void> {
  const redis = getRedis();
  const entry: DeadLetterEntry = {
    operation,
    payload: JSON.stringify(payload) ?? "null",
    error: error.message,
    ...(error.stack ? { stack: error.stack } : {}),
    timestamp: Date.now(),
  };

  await redis.lpush(DEAD_LETTER_KEY, JSON.stringify(entry));
  await redis.ltrim(DEAD_LETTER_KEY, 0, 999);
}

export async function getDeadLetterQueueSize(): Promise<number> {
  const redis = getRedis();
  return await redis.llen(DEAD_LETTER_KEY);
}
