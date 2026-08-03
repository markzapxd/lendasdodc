import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";

const securitySeverities = ["info", "warning", "error", "critical"] as const;

type SecuritySeverity = (typeof securitySeverities)[number];

export interface SecurityStats {
  /** Total security events today */
  readonly eventsToday: number;
  /** Failed login attempts today */
  readonly failedLogins: number;
  /** Active abuse buckets */
  readonly activeAbuseBuckets: number;
  /** Reports pending review */
  readonly pendingReports: number;
  /** Critical alerts */
  readonly criticalAlerts: number;
}

export interface ThreatEvent {
  readonly id: string;
  readonly type: string;
  readonly severity: string;
  readonly context: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface AbuseBucket {
  readonly bucketKey: string;
  readonly eventType: string;
  readonly count: number;
  readonly windowStart: string;
}

export interface SecurityTimelinePoint {
  readonly hour: string;
  readonly count: number;
  readonly severity: SecuritySeverity;
}

const securityEventRowSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  severity: z.enum(securitySeverities),
  metadata: z.unknown().nullable(),
  created_at: z.coerce.date(),
});

const abuseBucketRowSchema = z.object({
  bucket_key: z.string(),
  bucket_type: z.string().nullable().optional(),
  event_type: z.string().nullable().optional(),
  count: z.number().int().nonnegative(),
  window_start: z.coerce.date(),
});

const timelineEventRowSchema = z.object({
  created_at: z.coerce.date(),
  severity: z.enum(securitySeverities),
});

const sensitiveContextKey =
  /(^|[_-])(ip|email|token|secret|password|authorization|cookie|csrf|session|hmac|hash)([_-]|$)|user.?agent/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value === null || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "[indisponível]";
  }

  if (typeof value === "string") {
    return value.length > 160 ? `${value.slice(0, 160)}...` : value;
  }

  if (depth >= 2) {
    return "[dados aninhados redigidos]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }

  if (isRecord(value)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value).slice(0, 20)) {
      sanitized[key] = sensitiveContextKey.test(key)
        ? "[redigido]"
        : sanitizeValue(nestedValue, depth + 1);
    }
    return sanitized;
  }

  return "[indisponível]";
}

function sanitizeContext(value: unknown): Readonly<Record<string, unknown>> {
  const sanitized = sanitizeValue(value, 0);
  return isRecord(sanitized) ? sanitized : { valor: sanitized };
}

function throwQueryError(resource: string, error: { readonly message: string } | null): void {
  if (error) {
    throw new Error(`Falha ao consultar ${resource}: ${error.message}`, { cause: error });
  }
}

/**
 * Get security statistics.
 *
 * @returns Security stats
 */
export async function getSecurityStats(): Promise<SecurityStats> {
  const supabase = createAdminClient().schema("private");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  const activeBucketStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [eventsResult, failedLoginsResult, activeBucketsResult, reportsResult, criticalResult] =
    await Promise.all([
      supabase
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
      supabase
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "admin_login_failed")
        .gte("created_at", todayStart),
      supabase
        .from("abuse_buckets")
        .select("id", { count: "exact", head: true })
        .gte("window_start", activeBucketStart),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "reviewing"]),
      supabase
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .eq("severity", "critical")
        .gte("created_at", todayStart),
    ]);

  throwQueryError("eventos de segurança", eventsResult.error);
  throwQueryError("logins falhos", failedLoginsResult.error);
  throwQueryError("bloqueios de abuso", activeBucketsResult.error);
  throwQueryError("relatórios pendentes", reportsResult.error);
  throwQueryError("alertas críticos", criticalResult.error);

  return {
    eventsToday: eventsResult.count ?? 0,
    failedLogins: failedLoginsResult.count ?? 0,
    activeAbuseBuckets: activeBucketsResult.count ?? 0,
    pendingReports: reportsResult.count ?? 0,
    criticalAlerts: criticalResult.count ?? 0,
  };
}

/**
 * Get recent threat events.
 *
 * @param limit - Max events to return
 * @returns Threat events
 */
export async function getRecentThreats(limit = 20): Promise<ThreatEvent[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20;
  const { data, error } = await createAdminClient()
    .schema("private")
    .from("security_events")
    .select("id, event_type, severity, metadata, created_at")
    .in("severity", ["warning", "error", "critical"])
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Falha ao consultar ameaças: ${error.message}`, { cause: error });
  }

  return (data ?? []).map((value) => {
    const event = securityEventRowSchema.parse(value);
    return {
      id: event.id,
      type: event.event_type,
      severity: event.severity,
      context: sanitizeContext(event.metadata),
      createdAt: event.created_at.toISOString(),
    } satisfies ThreatEvent;
  });
}

/**
 * Get abuse bucket statistics.
 *
 * @returns Abuse buckets
 */
export async function getAbuseBuckets(): Promise<AbuseBucket[]> {
  const { data, error } = await createAdminClient()
    .schema("private")
    .from("abuse_buckets")
    .select("bucket_key, bucket_type, count, window_start")
    .order("count", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Falha ao consultar bloqueios de abuso: ${error.message}`, { cause: error });
  }

  return (data ?? []).map((value) => {
    const bucket = abuseBucketRowSchema.parse(value);
    return {
      bucketKey: "[redigido]",
      eventType: bucket.bucket_type ?? bucket.event_type ?? "desconhecido",
      count: bucket.count,
      windowStart: bucket.window_start.toISOString(),
    } satisfies AbuseBucket;
  });
}

/**
 * Get security events timeline.
 *
 * @param hours - Number of hours to look back
 * @returns Timeline data
 */
export async function getSecurityTimeline(hours = 24): Promise<SecurityTimelinePoint[]> {
  const safeHours = Number.isFinite(hours) && hours > 0 ? Math.min(hours, 168) : 24;
  const startDate = new Date(Date.now() - safeHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await createAdminClient()
    .schema("private")
    .from("security_events")
    .select("created_at, severity")
    .gte("created_at", startDate)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Falha ao consultar a linha do tempo: ${error.message}`, { cause: error });
  }

  const grouped: Record<string, Record<SecuritySeverity, number>> = {};
  for (const value of data ?? []) {
    const event = timelineEventRowSchema.parse(value);
    const hour = event.created_at.toISOString().substring(0, 13);
    let counts = grouped[hour];
    if (!counts) {
      counts = { info: 0, warning: 0, error: 0, critical: 0 };
      grouped[hour] = counts;
    }
    counts[event.severity] += 1;
  }

  return Object.entries(grouped).flatMap(([hour, counts]) =>
    securitySeverities.map((severity) => ({
      hour,
      count: counts[severity],
      severity,
    })),
  );
}
