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
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary" role="status" aria-live="polite">
            {cards.length} {cards.length === 1 ? "card cadastrado" : "cards cadastrados"}
          </p>
          {error ? (
            <p className="mt-2 text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Novo card
        </Button>
      </div>

      <section aria-label="Filtros de cards" className="grid gap-2 sm:max-w-xs">
        <label htmlFor="card-status-filter" className="text-sm font-medium text-text-primary">
          Filtrar por status
        </label>
        <select
          id="card-status-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as CardStatus | "all")}
          className="min-h-11 rounded-md border bg-charcoal-900 px-3 text-base text-text-primary outline-none focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {(Object.keys(statusLabels) as Array<CardStatus | "all">).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </section>

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
          <div className="grid gap-4">
            {visibleCards.map((card) => (
              <article
                key={card.id}
                className="grid gap-4 border border-border bg-surface-elevated p-4 sm:p-6"
              >
                <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-text-primary">{card.name}</h2>
                      <Badge variant={statusVariants[card.status]}>
                        {statusLabels[card.status]}
                      </Badge>
                    </div>
                    <p className="font-mono text-sm text-text-secondary">/{card.slug}</p>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {card.message_count} {card.message_count === 1 ? "mensagem" : "mensagens"}
                  </p>
                </header>

                <p className="max-w-[68ch] text-text-secondary">
                  {card.description ?? "Sem descrição cadastrada."}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(card)}>
                    <PencilSimple className="size-4" aria-hidden="true" />
                    Editar
                  </Button>
                  {card.status === "active" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusCard(card)}
                    >
                      <Archive className="size-4" aria-hidden="true" />
                      Arquivar
                    </Button>
                  ) : card.status === "archived" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setStatusCard(card)}
                    >
                      <ArrowCounterClockwise className="size-4" aria-hidden="true" />
                      Restaurar
                    </Button>
                  ) : null}
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
