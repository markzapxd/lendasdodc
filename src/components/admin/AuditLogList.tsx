"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuditFilters } from "@/components/admin/AuditFilters";
import { type AuditEntry, AuditLogEntry } from "@/components/admin/AuditLogEntry";
import { Button } from "@/components/ui/button";

interface AuditLogListProps {
  readonly entries: readonly AuditEntry[];
  readonly currentPage: number;
  readonly totalPages: number;
  readonly total: number;
  readonly exportCsv: string;
}

export function AuditLogList({
  entries,
  currentPage,
  totalPages,
  total,
  exportCsv,
}: AuditLogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/audit?${params.toString()}`);
  };

  const handleExport = () => {
    const blob = new Blob([exportCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      <section
        aria-label="Filtros do log de auditoria"
        className="rounded-md border border-border bg-surface-elevated p-4 sm:p-6"
      >
        <AuditFilters />
      </section>

      <section aria-label="Resultados do log de auditoria">
        <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary" role="status" aria-live="polite">
            {total} entrada(s) encontrada(s)
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleExport}>
            Exportar CSV
          </Button>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-md border border-border bg-surface-elevated p-8 text-center">
            <p className="text-text-primary">Nenhuma entrada encontrada</p>
            <p className="mt-2 text-sm text-text-secondary">
              Ajuste os filtros para consultar outro período ou administrador.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3" aria-label="Entradas do log de auditoria">
            {entries.map((entry) => (
              <AuditLogEntry key={entry.id} entry={entry} />
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
            aria-label="Paginação"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Anterior
            </Button>

            <span className="text-sm text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Próxima
            </Button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
