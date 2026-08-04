import { StatsCard } from "@/components/admin/StatsCard";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Mensagens Pendentes" value="--" description="Aguardando moderação" />
        <StatsCard title="Relatórios Ativos" value="--" description="Requerem atenção" />
        <StatsCard title="Mensagens Hoje" value="--" description="Publicadas nas últimas 24h" />
        <StatsCard title="Total de Cards" value="--" description="" />
      </div>

      <section
        aria-labelledby="recent-activity-title"
        className="rounded-md border border-border bg-surface-elevated p-6"
      >
        <h2 id="recent-activity-title" className="mb-4 text-lg font-medium text-text-primary">
          Atividade Recente
        </h2>
        <p className="text-text-secondary">Nenhuma atividade recente para exibir.</p>
      </section>
    </div>
  );
}
