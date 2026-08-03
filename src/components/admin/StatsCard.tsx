interface StatsCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly description: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <section className="rounded-md border border-border bg-surface-elevated p-4">
      <div className="mb-1 text-sm text-text-secondary">{title}</div>
      <div className="mb-1 text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary">{description}</div>
    </section>
  );
}
