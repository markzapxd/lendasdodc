"use client";

import { Bell } from "@phosphor-icons/react";
import { Cluster, Grid, Stack } from "@/components/system";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Section } from "./showcase-shared";

type ControlsShowcaseProps = {
  readonly selectValue: string;
  readonly onSelectChange: (value: string) => void;
};

function ControlsShowcase({ selectValue, onSelectChange }: ControlsShowcaseProps) {
  return (
    <>
      <Section title="Botões / Buttons">
        <Stack gap={4}>
          <Cluster gap={3}>
            <Button aria-label="Primary default">Publicar mensagem</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="destructive">Destrutivo</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="link">Ver regras</Button>
          </Cluster>
          <Cluster gap={3}>
            <Button size="sm">Pequeno</Button>
            <Button size="lg">Grande</Button>
            <Button size="icon" aria-label="Abrir notificações">
              <Bell aria-hidden="true" />
            </Button>
            <Button loading>Publicando</Button>
            <Button disabled>Desativado</Button>
          </Cluster>
        </Stack>
      </Section>
      <Section title="Campos / Inputs">
        <Grid columns={2}>
          <Input
            label="Apelido opcional"
            placeholder="Como quer ser chamado?"
            description="Seu apelido não identifica você."
          />
          <Input label="E-mail" type="email" placeholder="voce@exemplo.com" />
          <Input label="Senha" type="password" placeholder="••••••••" />
          <Input label="Buscar no mural" type="search" placeholder="Digite uma palavra" />
          <Input
            label="Campo com erro"
            defaultValue="apelido inválido"
            error="Use até 24 caracteres e remova espaços no início."
          />
          <Input label="Campo desativado" defaultValue="Somente leitura" disabled />
        </Grid>
      </Section>
      <Section title="Textarea">
        <Grid columns={2}>
          <Textarea
            label="Sua mensagem"
            placeholder="Escreva com cuidado..."
            description="Não inclua dados pessoais de outras pessoas."
            showCount
            maxLength={160}
            autoResize
          />
          <Textarea
            label="Textarea com erro"
            defaultValue="Mensagem preservada mesmo quando há erro."
            error="A mensagem precisa ter pelo menos 10 caracteres."
          />
        </Grid>
      </Section>
      <Section title="Select">
        <Grid columns={2}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="categoria">
              Categoria do mural
            </label>
            <Select value={selectValue} onValueChange={onSelectChange}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Escolha uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mural">Mural geral</SelectItem>
                <SelectItem value="confissao">Confissão</SelectItem>
                <SelectItem value="aviso">Aviso</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-text-secondary">Selecionada: {selectValue}</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="categoria-erro">
              Categoria com erro
            </label>
            <Select disabled>
              <SelectTrigger id="categoria-erro" error="Selecione uma opção">
                <SelectValue placeholder="Indisponível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indisponivel">Indisponível</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Grid>
      </Section>
      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir diálogo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publicar sem identidade</DialogTitle>
              <DialogDescription>
                Revise o texto antes de colocar sua voz no mural.
              </DialogDescription>
            </DialogHeader>
            <p className="text-base">
              A publicação será anônima e poderá ser denunciada por outras pessoas.
            </p>
            <DialogFooter>
              <Button variant="ghost">Voltar</Button>
              <Button>Confirmar publicação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>
      <Section title="AlertDialog">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Apagar rascunho</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar este rascunho?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O texto salvo será removido deste dispositivo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-500 text-text-inverse hover:bg-red-600">
                Apagar rascunho
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>
    </>
  );
}

export { ControlsShowcase };
