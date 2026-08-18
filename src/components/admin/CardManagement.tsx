"use client";

import { Archive, ArrowCounterClockwise, PencilSimple, Plus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/system/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Card, CardStatus } from "@/types/database";
import { CardEditorDialog, type CardEditorInput } from "./CardEditorDialog";

interface CardManagementProps {
  readonly initialCards: readonly Card[];
}

const statusLabels: Record<CardStatus | "all", string> = {
  all: "Todos os status",
  active: "Ativos",
  archived: "Arquivados",
  hidden: "Ocultos",
  deleted: "Excluídos",
};

const statusVariants: Record<CardStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  archived: "secondary",
  hidden: "outline",
  deleted: "destructive",
};

function getCsrfToken(): string | null {
  const prefix = "_ldc_admin_csrf=";
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return cookie?.slice(prefix.length) || null;
}

async function readError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = payload.error;
    if (typeof error === "string") return error;
  }
  return "Não foi possível concluir a ação.";
}

async function sendMutation(url: string, body: unknown, method: "PATCH" | "POST"): Promise<void> {
  const csrfToken = getCsrfToken();
  if (!csrfToken) throw new Error("Sessão sem proteção CSRF. Faça login novamente.");

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export function CardManagement({ initialCards }: CardManagementProps) {
  const router = useRouter();
  const cards = initialCards;
  const [filter, setFilter] = useState<CardStatus | "all">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [statusCard, setStatusCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleCards = filter === "all" ? cards : cards.filter((card) => card.status === filter);

  function openCreate() {
    setEditingCard(null);
    setError(null);
    setEditorOpen(true);
  }

  function openEdit(card: Card) {
    setEditingCard(card);
    setError(null);
    setEditorOpen(true);
  }

  async function handleSave(input: CardEditorInput) {
    setLoading(true);
    setError(null);
    try {
      if (editingCard) {
        await sendMutation(
          `/api/admin/cards/${editingCard.id}`,
          { action: "update", card: input },
          "PATCH",
        );
      } else {
        const csrfToken = getCsrfToken();
        if (!csrfToken) throw new Error("Sessão sem proteção CSRF. Faça login novamente.");
        const response = await fetch("/api/admin/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
          body: JSON.stringify(input),
        });
        if (!response.ok) throw new Error(await readError(response));
      }
      setEditorOpen(false);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Não foi possível salvar o card.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange() {
    if (!statusCard) return;
    setLoading(true);
    setError(null);
    const action = statusCard.status === "archived" ? "restore" : "archive";
    try {
      await sendMutation(`/api/admin/cards/${statusCard.id}`, { action }, "PATCH");
      setStatusCard(null);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Não foi possível atualizar o status.",
      );
      setStatusCard(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 select-none">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 border-b border-[#21122e] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Gerenciar Cards</h1>
          <p className="text-xs font-mono text-[#a595b8]/70" role="status" aria-live="polite">
            {cards.length} {cards.length === 1 ? "card cadastrado" : "cards cadastrados"}
          </p>
          {error ? (
            <p className="mt-2 text-xs font-semibold text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#ec195a] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(236,25,90,0.35)] transition-all hover:bg-[#d4144e]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Novo Card</span>
        </button>
      </div>

      {/* Filter Selector */}
      <section aria-label="Filtros de cards" className="grid gap-1.5 sm:max-w-xs">
        <label htmlFor="card-status-filter" className="text-xs font-mono text-[#a595b8]">
          Filtrar por status
        </label>
        <select
          id="card-status-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as CardStatus | "all")}
          className="rounded-xl border border-[#2b1742] bg-[#0b0512] px-3 py-2 text-xs text-white outline-none transition-colors focus:border-[#ec195a]/70"
        >
          {(Object.keys(statusLabels) as Array<CardStatus | "all">).map((status) => (
            <option key={status} value={status} className="bg-[#0b0512]">
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </section>

      {/* Cards List */}
      <section aria-label="Lista de cards">
        {visibleCards.length === 0 ? (
          <EmptyState
            title="Nenhum card encontrado"
            description={
              filter === "all"
                ? "Crie o primeiro mural para começar."
                : "Não há cards com este status."
            }
            {...(filter === "all" ? { action: { label: "Criar card", onClick: openCreate } } : {})}
          />
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCards.map((card) => (
              <article
                key={card.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[#2b1742]/60 bg-[#12081a]/60 p-5 shadow-lg transition-all hover:border-[#ec195a]/40 hover:bg-[#180a24]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-[#21122e] pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">{card.name}</h2>
                      <p className="font-mono text-xs text-[#ec195a]">@{card.slug}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        card.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : card.status === "archived"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {statusLabels[card.status]}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#a595b8]/80 leading-relaxed line-clamp-2">
                    {card.description ?? "Sem descrição cadastrada."}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#21122e] pt-3">
                  <span className="text-[11px] font-mono text-[#a595b8]/60">
                    {card.message_count} {card.message_count === 1 ? "msg" : "msgs"}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(card)}
                      className="flex items-center gap-1 rounded-lg border border-[#2b1742] bg-[#1a0e28] px-2.5 py-1.5 text-xs text-white transition-colors hover:border-[#ec195a]/60 hover:text-[#ec195a]"
                    >
                      <PencilSimple className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                    {card.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => setStatusCard(card)}
                        className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Arquivar</span>
                      </button>
                    ) : card.status === "archived" ? (
                      <button
                        type="button"
                        onClick={() => setStatusCard(card)}
                        className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-400 transition-colors hover:bg-amber-500/20"
                      >
                        <ArrowCounterClockwise className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Restaurar</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <CardEditorDialog
        card={editingCard}
        open={editorOpen}
        loading={loading}
        error={error}
        onOpenChange={setEditorOpen}
        onSave={handleSave}
      />

      <AlertDialog open={statusCard !== null} onOpenChange={(open) => !open && setStatusCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusCard?.status === "archived" ? "Restaurar card?" : "Arquivar card?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusCard?.status === "archived"
                ? `O mural “${statusCard.name}” voltará ao status ativo.`
                : `Arquivar “${statusCard?.name ?? "este card"}” remove o mural da experiência ativa sem apagar seus dados.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={loading}
              className={
                statusCard?.status === "archived"
                  ? undefined
                  : "bg-red-500 text-text-inverse hover:bg-red-600"
              }
            >
              {statusCard?.status === "archived" ? "Restaurar card" : "Arquivar card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
