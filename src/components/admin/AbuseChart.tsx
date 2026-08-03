import type { AbuseBucket } from "@/lib/admin/security";

interface AbuseChartProps {
  readonly buckets: readonly AbuseBucket[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AbuseChart({ buckets }: AbuseChartProps) {
  const visibleBuckets = buckets.slice(0, 8);
  const maximum = Math.max(...visibleBuckets.map((bucket) => bucket.count), 1);

  return (
    <figure
      className="rounded-md border border-border bg-surface-elevated p-6"
      aria-labelledby="abuse-chart-title"
    >
      <figcaption id="abuse-chart-title" className="mb-6">
        <h2 className="text-lg font-medium text-text-primary">Atividade de abuso</h2>
        <p className="mt-1 text-sm text-text-secondary">Buckets com maior volume de eventos.</p>
      </figcaption>

      {visibleBuckets.length === 0 ? (
        <p className="py-8 text-center text-text-secondary">Nenhum bucket de abuso registrado.</p>
      ) : (
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8"
          aria-label="Volume por tipo de abuso"
        >
          {visibleBuckets.map((bucket) => {
            const height = Math.max((bucket.count / maximum) * 100, 8);
            return (
              <li key={`${bucket.eventType}-${bucket.windowStart}`} className="min-w-0">
                <div className="flex h-40 items-end border-b border-border px-2" aria-hidden="true">
                  <div
                    className="w-full bg-red-500"
                    style={{ height: `${height}%` }}
                    title={`${bucket.count} eventos`}
                  />
                </div>
                <p
                  className="mt-2 truncate text-xs font-medium text-text-primary"
                  title={bucket.eventType}
                >
                  {bucket.eventType}
                </p>
                <p className="text-xs text-text-secondary">{bucket.count} eventos</p>
                <time className="text-xs text-text-secondary" dateTime={bucket.windowStart}>
                  {formatDate(bucket.windowStart)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
