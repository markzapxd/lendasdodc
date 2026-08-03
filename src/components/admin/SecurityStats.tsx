import { StatsCard } from "./StatsCard";

export interface SecurityStatsProps {
  readonly stats: {
    readonly eventsToday: number;
    readonly failedLogins: number;
    readonly activeAbuseBuckets: number;
    readonly pendingReports: number;
    readonly criticalAlerts: number;
  };
}

export function SecurityStats({ stats }: SecurityStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatsCard
        title="Eventos hoje"
        value={stats.eventsToday}
        description="Eventos de segurança"
      />
      <StatsCard title="Logins falhos" value={stats.failedLogins} description="Tentativas hoje" />
      <StatsCard
        title="Abusos ativos"
        value={stats.activeAbuseBuckets}
        description="Buckets ativos"
      />
      <StatsCard title="Relatórios" value={stats.pendingReports} description="Pendentes" />
      <StatsCard title="Críticos" value={stats.criticalAlerts} description="Alertas hoje" />
    </div>
  );
}
