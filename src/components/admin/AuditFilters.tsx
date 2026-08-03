"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const actionOptions = [
  ["admin.login", "Login admin"],
  ["admin.logout", "Logout admin"],
  ["admin.password_change", "Troca de senha"],
  ["admin.totp_rotate", "Troca de TOTP"],
  ["card.create", "Card criado"],
  ["card.update", "Card atualizado"],
  ["card.archive", "Card arquivado"],
  ["card.restore", "Card restaurado"],
  ["card.delete", "Card excluído"],
  ["message.remove", "Mensagem removida"],
  ["message.restore", "Mensagem restaurada"],
  ["report.resolve", "Relatório resolvido"],
  ["report.dismiss", "Relatório dispensado"],
  ["settings.update", "Configuração atualizada"],
] as const;

const entityOptions = [
  ["admin_user", "Administrador"],
  ["admin_users", "Administradores"],
  ["card", "Card"],
  ["message", "Mensagem"],
  ["report", "Relatório"],
  ["settings", "Configuração"],
] as const;

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `/audit?${query}` : "/audit");
  };

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Input
        id="audit-actor"
        label="Administrador"
        type="search"
        placeholder="ID do administrador"
        value={searchParams.get("actorId") ?? ""}
        onChange={(event) => handleChange("actorId", event.target.value)}
      />

      <div className="grid gap-2">
        <label className="text-sm font-medium text-text-primary" htmlFor="audit-action">
          Ação
        </label>
        <Select
          value={searchParams.get("action") ?? "all"}
          onValueChange={(value) => handleChange("action", value)}
        >
          <SelectTrigger id="audit-action">
            <SelectValue placeholder="Todas as ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actionOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-text-primary" htmlFor="audit-entity">
          Entidade
        </label>
        <Select
          value={searchParams.get("entityType") ?? "all"}
          onValueChange={(value) => handleChange("entityType", value)}
        >
          <SelectTrigger id="audit-entity">
            <SelectValue placeholder="Todas as entidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as entidades</SelectItem>
            {entityOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input
        id="audit-start-date"
        label="De"
        type="text"
        inputMode="numeric"
        placeholder="AAAA-MM-DD"
        value={searchParams.get("startDate") ?? ""}
        onChange={(event) => handleChange("startDate", event.target.value)}
      />

      <Input
        id="audit-end-date"
        label="Até"
        type="text"
        inputMode="numeric"
        placeholder="AAAA-MM-DD"
        value={searchParams.get("endDate") ?? ""}
        onChange={(event) => handleChange("endDate", event.target.value)}
      />
    </div>
  );
}
