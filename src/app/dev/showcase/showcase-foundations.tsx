import { Cluster, Grid, Stack } from "@/components/system";
import { Section } from "./showcase-shared";

const colors = [
  "black",
  "charcoal-900",
  "charcoal-800",
  "charcoal-700",
  "charcoal-600",
  "charcoal-500",
  "charcoal-300",
  "charcoal-100",
  "red-500",
  "red-900",
  "green-500",
  "amber-500",
] as const;
const colorClasses = {
  black: "bg-black",
  "charcoal-900": "bg-charcoal-900",
  "charcoal-800": "bg-charcoal-800",
  "charcoal-700": "bg-charcoal-700",
  "charcoal-600": "bg-charcoal-600",
  "charcoal-500": "bg-charcoal-500",
  "charcoal-300": "bg-charcoal-300",
  "charcoal-100": "bg-charcoal-100",
  "red-500": "bg-red-500",
  "red-900": "bg-red-900",
  "green-500": "bg-green-500",
  "amber-500": "bg-amber-500",
} as const;
const spacingClasses = {
  1: "size-1",
  2: "size-2",
  3: "size-3",
  4: "size-4",
  6: "size-6",
  8: "size-8",
  12: "size-12",
} as const;

function FoundationsShowcase() {
  return (
    <>
      <Section title="Cores / Colors">
        <Grid columns={2} className="sm:grid-cols-3 lg:grid-cols-6">
          {colors.map((color) => (
            <div key={color} className="grid gap-2">
              <div className={`h-16 rounded-md border border-border ${colorClasses[color]}`} />
              <span className="font-mono text-xs text-text-secondary">{color}</span>
            </div>
          ))}
        </Grid>
      </Section>
      <Section title="Tipografia / Typography">
        <Stack gap={4}>
          <p className="text-4xl font-bold">Abertura editorial</p>
          <p className="text-3xl font-bold">Título de página</p>
          <p className="text-2xl font-semibold">Título de seção</p>
          <p className="text-xl font-semibold">Título de cartão</p>
          <p className="text-lg">Mensagem destacada em português</p>
          <p className="text-base">Corpo padrão com acentos: ação, coração, público e você.</p>
          <p className="text-sm text-text-secondary">Ajuda, navegação secundária e contexto.</p>
          <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">Metadado curto</p>
        </Stack>
      </Section>
      <Section title="Espaçamento / Spacing">
        <Cluster gap={6} align="end">
          {([1, 2, 3, 4, 6, 8, 12] as const).map((step) => (
            <div key={step} className="grid justify-items-center gap-2">
              <div className={`${spacingClasses[step]} bg-red-500`} />
              <span className="font-mono text-xs text-text-secondary">{step * 4}px</span>
            </div>
          ))}
        </Cluster>
      </Section>
    </>
  );
}

export { FoundationsShowcase };
