import { Cluster, Container, Grid, Stack } from "@/components/system";
import { Badge } from "@/components/ui/badge";
import { Section } from "./showcase-shared";

function LayoutShowcase() {
  return (
    <Section title="Primitivas de layout / Layout primitives">
      <Grid columns={2}>
        <div className="border border-border p-4">
          <Stack gap={2}>
            <strong>Stack</strong>
            <span className="text-sm text-text-secondary">Fluxo vertical em múltiplos de 4px.</span>
          </Stack>
        </div>
        <div className="border border-border p-4">
          <Cluster gap={2}>
            <Badge variant="outline">Cluster</Badge>
            <span className="text-sm text-text-secondary">Agrupamento com wrap.</span>
          </Cluster>
        </div>
        <div className="border border-border p-4">
          <Grid columns={2}>
            <div className="h-8 bg-charcoal-600" />
            <div className="h-8 bg-red-500" />
          </Grid>
        </div>
        <div className="border border-border p-4">
          <Container className="border border-dashed border-border p-4 text-sm text-text-secondary">
            Container centralizado
          </Container>
        </div>
      </Grid>
    </Section>
  );
}

export { LayoutShowcase };
