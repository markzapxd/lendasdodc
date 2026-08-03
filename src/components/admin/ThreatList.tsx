import { Badge } from "@/components/ui/badge";
import type { ThreatEvent } from "@/lib/admin/security";

interface ThreatListProps {
  readonly threats: readonly ThreatEvent[];
}

function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" {
  switch (severity) {
    case "warning":
      return "secondary";
    case "error":
    case "critical":
      return "destructive";
    default:
      return "default";
  }
}

function formatContextValue(value: unknown): string {
  if (value === null) {
    return "nulo";
  }

  if (typeof value === "object") {
    return "dados estruturados";
  }

  return String(value);
}

function formatContext(context: Readonly<Record<string, unknown>>): string {
  const entries = Object.entries(context).slice(0, 3);
  return entries.length === 0
    ? "Sem contexto adicional"
    : entries.map(([key, value]) => `${key}: ${formatContextValue(value)}`).join(" | ");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function ThreatList({ threats }: ThreatListProps) {
  if (threats.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface-elevated p-8 text-center">
        <p className="text-text-secondary">Nenhuma ameaça recente.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Ameaças recentes">
      {threats.map((threat) => (
        <li
          key={threat.id}
          className="flex flex-col gap-3 rounded-md border border-border bg-surface-elevated p-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Badge variant={getSeverityVariant(threat.severity)}>{threat.severity}</Badge>
            <div className="min-w-0">
              <p className="break-words text-sm text-text-primary">{threat.type}</p>
              <p className="break-words text-xs text-text-secondary">
                {formatContext(threat.context)}
              </p>
            </div>
          </div>

          <time className="shrink-0 text-xs text-text-secondary" dateTime={threat.createdAt}>
            {formatDate(threat.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
