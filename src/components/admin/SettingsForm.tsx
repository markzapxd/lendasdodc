"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

export interface SettingsFormValues {
  readonly configured_interval_ms: number;
  readonly emergency_mode: boolean;
  readonly degraded_mode: boolean;
}

interface SettingsFormProps {
  readonly settings: SettingsFormValues;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [interval, setInterval] = useState(String(settings.configured_interval_ms));
  const [emergencyMode, setEmergencyMode] = useState(settings.emergency_mode);
  const [degradedMode, setDegradedMode] = useState(settings.degraded_mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const csrfCookie = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("_ldc_admin_csrf="));
    const csrfToken = csrfCookie?.slice("_ldc_admin_csrf=".length);

    if (!csrfToken) {
      setError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({
          configured_interval_ms: Number(interval),
          emergency_mode: emergencyMode,
          degraded_mode: degradedMode,
        }),
      });

      if (!response.ok) {
        const payload: unknown = await response.json();
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Não foi possível salvar as configurações.";
        throw new Error(message);
      }

      setSuccess(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Erro ao salvar configurações.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-6">
      <div className="rounded-md border border-border bg-surface-elevated p-6">
        <label className="grid gap-2" htmlFor="configured-interval-ms">
          <span className="text-sm font-medium text-text-primary">Intervalo configurado (ms)</span>
          <input
            id="configured-interval-ms"
            className="min-h-11 rounded-md border border-border bg-charcoal-900 px-3 text-base text-text-primary outline-none focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            type="number"
            min="1"
            step="1"
            value={interval}
            onChange={(event) => setInterval(event.target.value)}
            required
          />
          <span className="text-sm text-text-secondary">
            Deve ser um número inteiro positivo usado pela configuração de publicação.
          </span>
        </label>
      </div>

      <fieldset className="grid gap-4 rounded-md border border-border bg-surface-elevated p-6">
        <legend className="px-1 text-sm font-medium text-text-primary">Estados operacionais</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm text-text-primary">
          <input
            className="size-5 accent-red-500"
            type="checkbox"
            checked={emergencyMode}
            onChange={(event) => setEmergencyMode(event.target.checked)}
          />
          <span>
            <span className="block font-medium">Modo de emergência</span>
            <span className="block text-text-secondary">Bloqueia novas publicações.</span>
          </span>
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-text-primary">
          <input
            className="size-5 accent-red-500"
            type="checkbox"
            checked={degradedMode}
            onChange={(event) => setDegradedMode(event.target.checked)}
          />
          <span>
            <span className="block font-medium">Modo degradado</span>
            <span className="block text-text-secondary">
              Estado operacional permitido pela plataforma.
            </span>
          </span>
        </label>
      </fieldset>

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-400" role="status" aria-live="polite">
          Configurações salvas.
        </p>
      ) : null}

      <Button type="submit" loading={loading} className="w-fit">
        {loading ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
