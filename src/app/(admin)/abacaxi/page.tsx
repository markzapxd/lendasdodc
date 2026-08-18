import { StatsCard } from "@/components/admin/StatsCard";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-xs font-mono text-[#a595b8]/70">Visão geral do sistema e métricas</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Mensagens Pendentes" value="0" description="Aguardando moderação" />
        <StatsCard title="Relatórios Ativos" value="0" description="Requerem atenção" />
        <StatsCard title="Mensagens Hoje" value="15" description="Publicadas nas últimas 24h" />
        <StatsCard title="Total de Cards" value="5" description="Perfis ativos na plataforma" />
      </div>

      <section
        aria-labelledby="recent-activity-title"
        className="rounded-2xl border border-[#2b1742]/60 bg-[#12081a]/60 p-6 shadow-lg"
      >
        <h2 id="recent-activity-title" className="mb-4 text-base font-bold text-white">
          Atividade Recente
        </h2>
        <p className="text-xs text-[#a595b8]/60">Nenhuma atividade suspeita recente para exibir.</p>
      </section>
    </div>
  );
}
