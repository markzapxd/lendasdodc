"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Report } from "./ReportList";

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  odio: "Abuso",
  abuse: "Abuso",
  sexual: "Inapropriado",
  inappropriate: "Inapropriado",
  outro: "Outro",
  other: "Outro",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  reviewed: "Em revisão",
  resolved: "Resolvido",
  dismissed: "Dispensado",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "destructive",
  reviewed: "secondary",
  resolved: "default",
  dismissed: "secondary",
};

export function ReportCard({ report }: { readonly report: Report }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleResolve(status: "resolved" | "dismissed") {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, status }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar este relatório.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro ao atualizar relatório.");
      setLoading(false);
    }
  }

  const statusVariant = statusVariants[report.status] ?? "default";
  const hashPreview = report.contentHash
    ? `${report.contentHash.substring(0, 50)}${report.contentHash.length > 50 ? "..." : ""}`
    : "Hash de conteúdo indisponível";

  return (
    <article className="grid gap-4 border border-border bg-surface-elevated p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant}>{statusLabels[report.status] ?? report.status}</Badge>
            <span className="text-sm text-text-secondary">
              {reasonLabels[report.reason] ?? report.reason}
            </span>
          </div>
          <p className="text-sm text-text-secondary">Card: {report.cardName}</p>
        </div>
        <time className="text-sm text-text-secondary" dateTime={report.createdAt}>
          {new Date(report.createdAt).toLocaleDateString("pt-BR")}
        </time>
      </header>

      <dl className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-text-primary">ID da mensagem</dt>
          <dd className="break-all font-mono">{report.messageId}</dd>
        </div>
        <div>
          <dt className="font-semibold text-text-primary">Hash do conteúdo</dt>
          <dd className="break-all font-mono">{hashPreview}</dd>
        </div>
      </dl>

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      {report.status === "pending" || report.status === "reviewed" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={loading}
            onClick={() => handleResolve("resolved")}
          >
            Resolver
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={loading}
            onClick={() => handleResolve("dismissed")}
          >
            Dispensar
          </Button>
        </div>
      ) : null}
    </article>
  );
}
