"use client";

import { Envelope } from "@phosphor-icons/react";
import * as React from "react";
import { Cluster, EmptyState, ErrorState, Grid, Stack } from "@/components/system";
import { Avatar, AvatarFallback, AvatarImage, UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastIcon,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Section } from "./showcase-shared";

const toastKinds = ["default", "success", "warning", "error"] as const;
type ToastKind = (typeof toastKinds)[number];
type FeedbackShowcaseProps = { readonly onRetry: () => void; readonly retrying: boolean };

function FeedbackShowcase({ onRetry, retrying }: FeedbackShowcaseProps) {
  const [toastKind, setToastKind] = React.useState<ToastKind>("default");
  const [toastOpen, setToastOpen] = React.useState(false);
  function showToast(kind: ToastKind) {
    setToastKind(kind);
    setToastOpen(true);
  }
  return (
    <ToastProvider swipeDirection="right">
      <Section title="Toast">
        <Stack gap={4}>
          <Cluster gap={3}>
            {toastKinds.map((kind) => (
              <Button key={kind} variant="outline" onClick={() => showToast(kind)}>
                Aviso {kind}
              </Button>
            ))}
          </Cluster>
          <p className="text-sm text-text-secondary">
            O aviso não rouba foco e desaparece automaticamente.
          </p>
        </Stack>
        <Toast open={toastOpen} onOpenChange={setToastOpen} kind={toastKind} duration={4000}>
          <ToastIcon kind={toastKind} />
          <div className="grid gap-1">
            <ToastTitle>
              {toastKind === "success"
                ? "Publicado"
                : toastKind === "error"
                  ? "Não foi possível"
                  : toastKind === "warning"
                    ? "Atenção"
                    : "Mural atualizado"}
            </ToastTitle>
            <ToastDescription>Seu feedback foi processado com segurança.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </Section>
      <Section title="Avatar">
        <Cluster gap={6} align="end">
          <div className="grid justify-items-center gap-2">
            <UserAvatar name="Lenda" size="sm" />
            <span className="text-xs text-text-secondary">sm</span>
          </div>
          <div className="grid justify-items-center gap-2">
            <UserAvatar name="DC" size="default" />
            <span className="text-xs text-text-secondary">default</span>
          </div>
          <div className="grid justify-items-center gap-2">
            <UserAvatar name="Mural" size="lg" />
            <span className="text-xs text-text-secondary">lg</span>
          </div>
          <div className="grid justify-items-center gap-2">
            <Avatar className="size-16">
              <AvatarImage src="/avatar-missing.png" alt="Imagem de perfil" />
              <AvatarFallback>LM</AvatarFallback>
            </Avatar>
            <span className="text-xs text-text-secondary">fallback</span>
          </div>
        </Cluster>
      </Section>
      <Section title="Badge">
        <Cluster gap={3}>
          <Badge>Publicada</Badge>
          <Badge variant="secondary">Em análise</Badge>
          <Badge variant="destructive">Denunciada</Badge>
          <Badge variant="outline">Anônima</Badge>
        </Cluster>
      </Section>
      <Section title="Skeleton">
        <Grid columns={2}>
          <div aria-busy="true" className="grid gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <span className="text-sm text-text-secondary">Carregando mensagens...</span>
          </div>
          <Stack gap={3}>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </Stack>
        </Grid>
      </Section>
      <Section title="Progress">
        <Stack gap={4}>
          <Progress label="Publicação em andamento" value={62} />
          <Progress label="Publicação concluída" value={100} variant="success" />
          <Progress label="Sincronização em andamento" indeterminate variant="warning" />
        </Stack>
      </Section>
      <Section title="EmptyState">
        <EmptyState
          title="Nenhuma mensagem encontrada"
          description="Tente remover os filtros ou escreva a primeira mensagem deste mural."
          action={{ label: "Escrever mensagem" }}
          icon={Envelope}
          compact
        />
      </Section>
      <Section title="ErrorState">
        <ErrorState
          title="Mural temporariamente indisponível"
          description="Sua mensagem está segura. Tente novamente para continuar a leitura."
          retry={{ onClick: onRetry, loading: retrying }}
          details="ERR_MURAL_READ_001 · conexão não respondeu"
          severity="offline"
        />
      </Section>
    </ToastProvider>
  );
}

export { FeedbackShowcase };
