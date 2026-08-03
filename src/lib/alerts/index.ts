import { getRedis } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase";
import type { Alert } from "./types";
import { ALERT_CONFIG } from "./types";

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Send an alert through the durable outbox.
 */
export async function sendAlert(alert: Alert): Promise<void> {
  try {
    const redis = getRedis();
    const dedupeKey = `alert:dedupe:${alert.type}`;
    const count = await redis.incr(dedupeKey);

    if (count === 1) {
      await redis.expire(dedupeKey, Math.ceil(ALERT_CONFIG.deduplicationWindowMs / 1000));
    }

    if (count > ALERT_CONFIG.maxAlertsPerWindow) {
      return;
    }

    const { error } = await createAdminClient().from("alert_outbox").insert({
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      context_json: alert.context,
    });

    if (error) {
      console.error("Failed to send alert:", error);
    }
  } catch (error) {
    console.error("Failed to send alert:", asError(error));
  }
}

/**
 * Send a critical alert without deduplication.
 */
export async function sendCriticalAlert(alert: Alert): Promise<void> {
  try {
    const { error } = await createAdminClient().from("alert_outbox").insert({
      alert_type: alert.type,
      severity: "critical",
      message: alert.message,
      context_json: alert.context,
    });

    if (error) {
      console.error("Failed to send critical alert:", error);
    }
  } catch (error) {
    console.error("Failed to send critical alert:", asError(error));
  }
}

/**
 * Alert when an abuse threshold is hit.
 */
export async function alertAbuseThreshold(sessionHmac: string, score: number): Promise<void> {
  await sendAlert({
    type: "abuse_threshold",
    severity: "warning",
    message: `Abuse threshold exceeded: score ${score}`,
    context: { sessionHmac, score },
    timestamp: Date.now(),
  });
}

/**
 * Alert on a system error.
 */
export async function alertSystemError(
  error: Error,
  context: Record<string, unknown>,
): Promise<void> {
  await sendCriticalAlert({
    type: "system_error",
    severity: "critical",
    message: error.message,
    context: { ...context, stack: error.stack },
    timestamp: Date.now(),
  });
}

/**
 * Alert on an admin login failure.
 */
export async function alertLoginFailure(email: string, ip: string): Promise<void> {
  await sendAlert({
    type: "login_failure",
    severity: "warning",
    message: `Failed login attempt for ${email}`,
    context: { email, ip },
    timestamp: Date.now(),
  });
}

export type { Alert, AlertSeverity } from "./types";
export { ALERT_CONFIG } from "./types";
