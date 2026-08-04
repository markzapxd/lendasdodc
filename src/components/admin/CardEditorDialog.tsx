"use client";

import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Card } from "@/types/database";

const editorInputSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(100, "Use no máximo 100 caracteres."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  description: z.string().trim().max(500, "Use no máximo 500 caracteres."),
  image_url: z.string().trim().url("Informe uma URL válida ou deixe em branco.").or(z.literal("")),
  image_alt: z.string().trim().max(200, "Use no máximo 200 caracteres."),
});

export type CardEditorInput = {
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly image_url: string | null;
  readonly image_alt: string | null;
};

interface CardEditorDialogProps {
  readonly card: Card | null;
  readonly open: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (input: CardEditorInput) => Promise<void>;
}

const emptyInput: CardEditorInput = {
  name: "",
  slug: "",
  description: null,
  image_url: null,
  image_alt: null,
};

export function CardEditorDialog({
  card,
  open,
  loading,
  error,
  onOpenChange,
  onSave,
}: CardEditorDialogProps) {
  const [form, setForm] = useState<CardEditorInput>(emptyInput);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      card
        ? {
            name: card.name,
            slug: card.slug,
            description: card.description,
            image_url: card.image_url,
            image_alt: card.image_alt,
          }
        : emptyInput,
    );
    setValidationError(null);
  }, [card]);

  function setField(field: keyof CardEditorInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = editorInputSchema.safeParse({
      name: form.name,
      slug: form.slug,
      description: form.description ?? "",
      image_url: form.image_url ?? "",
      image_alt: form.image_alt ?? "",
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Confira os campos do card.");
      return;
    }

    setValidationError(null);
    await onSave({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      image_url: parsed.data.image_url || null,
      image_alt: parsed.data.image_alt || null,
    });
  }

  const formError = validationError ?? error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card ? "Editar card" : "Criar card"}</DialogTitle>
          <DialogDescription>
            {card
              ? "Atualize os dados publicados deste mural."
              : "Cadastre um novo mural sem incluir campos de controle ou métricas."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            maxLength={100}
            required
          />
          <Input
            label="Slug"
            description="Use letras minúsculas, números e hífens."
            value={form.slug}
            onChange={(event) => setField("slug", event.target.value)}
            maxLength={100}
            required
          />
          <Textarea
            label="Descrição"
            description="Opcional. Até 500 caracteres."
            value={form.description ?? ""}
            onChange={(event) => setField("description", event.target.value)}
            maxLength={500}
            showCount
            rows={4}
          />
          <Input
            label="URL da imagem"
            description="Opcional. O processamento de upload é gerenciado separadamente."
            value={form.image_url ?? ""}
            onChange={(event) => setField("image_url", event.target.value)}
            type="text"
          />
          <Input
            label="Texto alternativo da imagem"
            value={form.image_alt ?? ""}
            onChange={(event) => setField("image_alt", event.target.value)}
            maxLength={200}
          />

          {formError ? (
            <p className="text-sm text-red-500" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {card ? "Salvar alterações" : "Criar card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
