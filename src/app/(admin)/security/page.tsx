import { redirect } from "next/navigation";
import { AbuseChart } from "@/components/admin/AbuseChart";
import { SecurityStats } from "@/components/admin/SecurityStats";
import { ThreatList } from "@/components/admin/ThreatList";
import { isAdminAuthenticated } from "@/lib/admin/reports";
import { getAbuseBuckets, getRecentThreats, getSecurityStats } from "@/lib/admin/security";

export default async function SecurityPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/login");
  }

  const [stats, threats, abuseBuckets] = await Promise.all([
    getSecurityStats(),
    getRecentThreats(),
    getAbuseBuckets(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Dashboard de Segurança</h1>

      <SecurityStats stats={stats} />

      <section className="mt-8" aria-labelledby="recent-threats-title">
        <h2 id="recent-threats-title" className="mb-4 text-lg font-medium text-text-primary">
          Ameaças recentes
        </h2>
        <ThreatList threats={threats} />
      </section>

      <section className="mt-8" aria-labelledby="abuse-chart-title">
        <AbuseChart buckets={abuseBuckets} />
      </section>
    </div>
  );
}
