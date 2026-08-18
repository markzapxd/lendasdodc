import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { isAdminAuthenticated } from "@/lib/admin/reports";
import { getSettings } from "@/lib/admin/settings";

export default async function SettingsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/morango");
  }

  const settings = await getSettings();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Configurações da plataforma</h1>
        <p className="mt-2 max-w-[65ch] text-sm text-text-secondary">
          Ajuste o intervalo de publicação e os estados operacionais permitidos.
        </p>
      </div>
      <SettingsForm
        settings={{
          configured_interval_ms: settings.configured_interval_ms,
          emergency_mode: settings.emergency_mode,
          degraded_mode: settings.degraded_mode,
        }}
      />
    </div>
  );
}
