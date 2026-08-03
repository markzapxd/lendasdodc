import { AuditLogList } from "@/components/admin/AuditLogList";
import { type AuditFilters, exportAuditLogCSV, getAuditLog } from "@/lib/admin/audit";

interface AuditPageSearchParams {
  readonly actorId?: string | string[];
  readonly action?: string | string[];
  readonly entityType?: string | string[];
  readonly startDate?: string | string[];
  readonly endDate?: string | string[];
  readonly page?: string | string[];
}

interface AuditPageProps {
  readonly searchParams: Promise<AuditPageSearchParams>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const actorId = firstValue(params.actorId);
  const action = firstValue(params.action);
  const entityType = firstValue(params.entityType);
  const startDate = firstValue(params.startDate);
  const endDate = firstValue(params.endDate);
  const pageValue = firstValue(params.page);
  const parsedPage = pageValue ? Number(pageValue) : undefined;
  const filters: AuditFilters = {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(parsedPage ? { page: parsedPage } : {}),
  };

  const [result, exportCsv] = await Promise.all([getAuditLog(filters), exportAuditLogCSV(filters)]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Log de Auditoria</h1>
          <p className="mt-2 max-w-[65ch] text-sm text-text-secondary">
            Consulte as ações administrativas registradas no sistema.
          </p>
        </div>
      </div>

      <AuditLogList
        entries={result.entries}
        currentPage={result.page}
        totalPages={result.totalPages}
        total={result.total}
        exportCsv={exportCsv}
      />
    </div>
  );
}
