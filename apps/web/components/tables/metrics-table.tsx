interface Metric {
  label: string;
  unit: string;
}

interface MetricsTableProps {
  metrics: Metric[];
}

export function MetricsTable({metrics}: MetricsTableProps) {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-border/60 bg-background/70 px-5 py-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</dt>
          <dd className="mt-1 text-xl font-semibold text-foreground">{metric.unit}</dd>
        </div>
      ))}
    </dl>
  );
}
