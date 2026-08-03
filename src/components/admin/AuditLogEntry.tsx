import { Badge, type BadgeVariant } from "@/components/ui/badge";

export interface AuditEntry {
  readonly id: string;
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly context: Record<string, unknown>;
  readonly createdAt: string;
}

interface AuditLogEntryProps {
  readonly entry: AuditEntry;
}

const actionColors = {
  "admin.login": "default",
  "admin.logout": "secondary",
  "admin.password_change": "secondary",
  "admin.totp_rotate": "secondary",
  "admin.recovery_use": "destructive",
  "admin.break_glass": "destructive",
  "card.create": "default",
  "card.update": "secondary",
  "card.archive": "destructive",
  "card.restore": "default",
  "card.delete": "destructive",
  "message.remove": "destructive",
  "message.restore": "default",
  "report.create": "secondary",
  "report.resolve": "default",
  "report.dismiss": "secondary",
  "settings.update": "secondary",
  "emergency.toggle": "destructive",
  "interval.change": "secondary",
  "block.create": "destructive",
  "block.remove": "default",
} satisfies Record<string, BadgeVariant>;

function getActionColor(action: string): BadgeVariant {
  return Object.entries(actionColors).find(([key]) => key === action)?.[1] ?? "secondary";
}

export function AuditLogEntry({ entry }: AuditLogEntryProps) {
  const contextKeys = Object.keys(entry.context);

  return (
    <li className="rounded-md border border-border bg-surface-elevated p-4 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
      <article className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getActionColor(entry.action)}>{entry.action}</Badge>
            <span className="break-all text-sm text-text-secondary">
              {entry.entityType}/{entry.entityId}
            </span>
          </div>

          <p className="mt-2 break-all text-sm text-text-secondary">
            Administrador: {entry.actorId}
          </p>

          {contextKeys.length > 0 ? (
            <details className="mt-3 rounded-sm bg-charcoal-800/60 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                Ver contexto sanitizado
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-text-secondary">
                {JSON.stringify(entry.context, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>

        <time
          dateTime={entry.createdAt}
          className="text-xs text-text-secondary lg:text-right"
          suppressHydrationWarning
        >
          {new Date(entry.createdAt).toLocaleString("pt-BR")}
        </time>
      </article>
    </li>
  );
}
