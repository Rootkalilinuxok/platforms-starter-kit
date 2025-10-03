interface StatItem {
  value: string;
  label: string;
}

interface StatsGridProps {
  items: StatItem[];
}

export function StatsGrid({items}: StatsGridProps) {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border/60 bg-background/80 px-6 py-5 shadow-sm backdrop-blur"
        >
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
