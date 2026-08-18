import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_CONFIG, validateAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

export interface AuditFilters {
  readonly actorId?: string;
  readonly action?: string;
  readonly entityType?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AuditEntry {
  readonly id: string;
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly context: Record<string, unknown>;
  readonly createdAt: string;
}

export interface AuditResult {
  readonly entries: readonly AuditEntry[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

const auditLogRowSchema = z.object({
  id: z.string(),
  admin_id: z.string().nullable(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().nullable(),
  old_values: z.unknown().nullable(),
  new_values: z.unknown().nullable(),
  metadata: z.unknown(),
  created_at: z.string(),
});

const sensitiveContextKey =
  /(^|[_-])(ip|email|token|secret|password|authorization|cookie|csrf|hash)([_-]|$)|user.?agent/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value === null || typeof value === "boolean") return value;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "[unavailable]";
  }

  if (typeof value === "string") {
    return value.length > 256 ? `${value.slice(0, 256)}...` : value;
  }

  if (depth >= 3) return "[nested data redacted]";

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }

  if (isRecord(value)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value).slice(0, 50)) {
      sanitized[key] = sensitiveContextKey.test(key)
        ? "[redacted]"
        : sanitizeValue(nestedValue, depth + 1);
    }
    return sanitized;
  }

  return "[unavailable]";
}

function sanitizeContext(value: unknown): Record<string, unknown> {
  const sanitized = sanitizeValue(value, 0);
  return isRecord(sanitized) ? sanitized : { value: sanitized };
}

function buildContext(row: z.infer<typeof auditLogRowSchema>): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  if (isRecord(row.metadata)) Object.assign(context, row.metadata);
  if (row.old_values !== null) Object.assign(context, { oldValues: row.old_values });
  if (row.new_values !== null) Object.assign(context, { newValues: row.new_values });
  return sanitizeContext(context);
}

async function requireAdminPageAccess(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.cookieName)?.value;
  const session = token ? await validateAdminSession(token) : null;

  if (!session) redirect("/morango");
}

function normalizePage(value: number | undefined): number {
  return value && Number.isInteger(value) && value > 0 ? value : 1;
}

function normalizeLimit(value: number | undefined): number {
  return value && Number.isInteger(value) && value > 0 ? Math.min(value, 10_000) : 50;
}

/** Get audit log entries with filters and pagination. */
export async function getAuditLog(filters: AuditFilters = {}): Promise<AuditResult> {
  await requireAdminPageAccess();

  const page = normalizePage(filters.page);
  const limit = normalizeLimit(filters.limit);
  const offset = (page - 1) * limit;
  let query = createAdminClient()
    .schema("private")
    .from("audit_log")
    .select(
      "id, admin_id, action, resource_type, resource_id, old_values, new_values, metadata, created_at",
      { count: "exact" },
    );

  if (filters.actorId) query = query.eq("admin_id", filters.actorId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("resource_type", filters.entityType);
  if (filters.startDate) query = query.gte("created_at", filters.startDate);
  if (filters.endDate) query = query.lte("created_at", filters.endDate);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch audit log: ${error.message}`, { cause: error });
  }

  const entries = (data ?? []).map((value) => {
    const row = auditLogRowSchema.parse(value);
    return {
      id: row.id,
      actorId: row.admin_id ?? "system",
      action: row.action,
      entityType: row.resource_type,
      entityId: row.resource_id ?? "system",
      context: buildContext(row),
      createdAt: row.created_at,
    } satisfies AuditEntry;
  });
  const total = count ?? 0;

  return {
    entries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

function csvCell(value: string): string {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

/** Export the filtered audit log as a sanitized CSV document. */
export async function exportAuditLogCSV(filters: AuditFilters = {}): Promise<string> {
  const result = await getAuditLog({ ...filters, page: 1, limit: 10_000 });
  const headers = ["ID", "Actor", "Action", "Entity Type", "Entity ID", "Context", "Date"];
  const rows = result.entries.map((entry) => [
    entry.id,
    entry.actorId,
    entry.action,
    entry.entityType,
    entry.entityId,
    JSON.stringify(entry.context) ?? "{}",
    entry.createdAt,
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}
