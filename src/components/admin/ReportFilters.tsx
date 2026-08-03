"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusValues = ["all", "pending", "reviewed", "resolved", "dismissed"] as const;
const reasonValues = ["all", "spam", "abuse", "inappropriate", "other"] as const;
const sortValues = ["newest", "oldest"] as const;

function getAllowedValue<T extends readonly string[]>(value: string | null, values: T): string {
  return value && values.some((option) => option === value) ? value : (values[0] ?? "");
}

export function ReportFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cardId, setCardId] = useState(searchParams.get("cardId") ?? "");

  function navigate(params: URLSearchParams) {
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleChange(key: "status" | "reason" | "sort", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || (key === "sort" && value === "newest")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    navigate(params);
  }

  function applyCardFilter() {
    const params = new URLSearchParams(searchParams.toString());
    const normalizedCardId = cardId.trim();
    if (normalizedCardId) {
      params.set("cardId", normalizedCardId);
    } else {
      params.delete("cardId");
    }
    navigate(params);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[10rem_10rem_10rem_minmax(12rem,1fr)_auto]">
      <Select
        value={getAllowedValue(searchParams.get("status"), statusValues)}
        onValueChange={(value) => handleChange("status", value)}
      >
        <SelectTrigger aria-label="Filtrar por status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="reviewed">Em revisão</SelectItem>
          <SelectItem value="resolved">Resolvido</SelectItem>
          <SelectItem value="dismissed">Dispensado</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={getAllowedValue(searchParams.get("reason"), reasonValues)}
        onValueChange={(value) => handleChange("reason", value)}
      >
        <SelectTrigger aria-label="Filtrar por motivo">
          <SelectValue placeholder="Motivo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os motivos</SelectItem>
          <SelectItem value="spam">Spam</SelectItem>
          <SelectItem value="abuse">Abuso</SelectItem>
          <SelectItem value="inappropriate">Inapropriado</SelectItem>
          <SelectItem value="other">Outro</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={getAllowedValue(searchParams.get("sort"), sortValues)}
        onValueChange={(value) => handleChange("sort", value)}
      >
        <SelectTrigger aria-label="Ordenar relatórios">
          <SelectValue placeholder="Ordenação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Mais recentes</SelectItem>
          <SelectItem value="oldest">Mais antigos</SelectItem>
        </SelectContent>
      </Select>

      <Input
        label="ID do card"
        placeholder="ID do card"
        value={cardId}
        onChange={(event) => setCardId(event.currentTarget.value)}
      />
      <Button type="button" variant="outline" size="sm" onClick={applyCardFilter}>
        Aplicar
      </Button>
    </div>
  );
}
