"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReportCard } from "./ReportCard";
import { ReportFilters } from "./ReportFilters";

export interface Report {
  readonly id: string;
  readonly messageId: string;
  readonly cardId: string;
  readonly cardName: string;
  readonly reason: string;
  readonly status: string;
  readonly contentHash: string;
  readonly createdAt: string;
}

interface ReportListProps {
  readonly reports: readonly Report[];
  readonly currentPage: number;
  readonly totalPages: number;
  readonly total: number;
}

export function ReportList({ reports, currentPage, totalPages, total }: ReportListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section aria-label="Lista de relatórios">
      <div className="mb-4 grid gap-4 border-b border-border pb-4 lg:flex lg:items-end lg:justify-between">
        <p className="text-sm text-text-secondary">
          {total} {total === 1 ? "relatório encontrado" : "relatórios encontrados"}
        </p>
        <ReportFilters />
      </div>

      {reports.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center">
          <h2 className="text-xl font-semibold text-text-primary">Nenhum relatório encontrado</h2>
          <p className="mt-2 text-text-secondary">Tente remover ou alterar os filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          className="mt-6 flex items-center justify-center gap-2"
          aria-label="Paginação de relatórios"
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
  );
}
