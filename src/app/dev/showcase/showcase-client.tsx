"use client";

import * as React from "react";
import { Cluster, Container, Stack } from "@/components/system";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";
import { ControlsShowcase } from "./showcase-controls";
import { FeedbackShowcase } from "./showcase-feedback";
import { FoundationsShowcase } from "./showcase-foundations";
import { LayoutShowcase } from "./showcase-layout";

export function ShowcaseClient() {
  const [selectValue, setSelectValue] = React.useState("mural");
  const [retrying, setRetrying] = React.useState(false);
  function retry() {
    setRetrying(true);
    window.setTimeout(() => setRetrying(false), 600);
  }
  return (
    <ToastProvider>
      <main id="conteudo" className="min-h-dvh bg-surface">
        <Container className="py-12 sm:py-16">
          <Stack gap={12}>
            <header className="grid max-w-3xl gap-6">
              <Cluster gap={2}>
                <Badge variant="outline" size="sm">
                  DEV / 06
                </Badge>
                <span className="text-sm text-text-secondary">Sistema de primitivas</span>
              </Cluster>
              <div className="grid gap-4">
              </div>
            </header>
            <FoundationsShowcase />
            <ControlsShowcase selectValue={selectValue} onSelectChange={setSelectValue} />
            <FeedbackShowcase onRetry={retry} retrying={retrying} />
            <LayoutShowcase />
            <footer className="border-t border-border pt-6 text-sm text-text-secondary">
              Lendas do DC · showcase de desenvolvimento · teclado e leitor de tela em primeiro
              lugar.
            </footer>
          </Stack>
        </Container>
      </main>
    </ToastProvider>
  );
}
