import { redirect } from "next/navigation";
import { ReportList } from "@/components/admin/ReportList";
import { StatsCard } from "@/components/admin/StatsCard";
import { getReportStats, getReports, isAdminAuthenticated } from "@/lib/admin/reports";

interface ReportsPageProps {
  readonly searchParams: Promise<{
    readonly status?: string | string[];
    readonly cardId?: string | string[];
    readonly reason?: string | string[];
    readonly sort?: string | string[];
    readonly page?: string | string[];
  }>;
}

function getSearchParam(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/login");
  }

  const params = await searchParams;
  const pageValue = Number(getSearchParam(params.page));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const status = getSearchParam(params.status);
  const cardId = getSearchParam(params.cardId);
  const reason = getSearchParam(params.reason);
  const sortValue = getSearchParam(params.sort);
  const sort: "newest" | "oldest" = sortValue === "oldest" ? "oldest" : "newest";
  const reportFilters = {
    sort,
    page,
    ...(status ? { status } : {}),
    ...(cardId ? { cardId } : {}),
    ...(reason ? { reason } : {}),
  };

  const [reportsResult, stats] = await Promise.all([getReports(reportFilters), getReportStats()]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Gerenciamento de Relatórios</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard title="Pendentes" value={stats.pending} description="Aguardando revisão" />
        <StatsCard title="Resolvidos" value={stats.resolved} description="Ação tomada" />
        <StatsCard title="Dispensados" value={stats.dismissed} description="Sem ação necessária" />
      </div>

      <ReportList
        reports={reportsResult.reports}
        currentPage={reportsResult.page}
        totalPages={reportsResult.totalPages}
        total={reportsResult.total}
      />
    </div>
  );
}
