interface ComparisonRow {
  category: string;
  aurora: string;
  legacy: string;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
}

export function ComparisonTable({rows}: ComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <table className="min-w-full divide-y divide-border/60 text-left">
        <thead className="bg-muted/40 text-sm uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-6 py-4">Capability</th>
            <th className="px-6 py-4">Aurora</th>
            <th className="px-6 py-4">Legacy stack</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-sm">
          {rows.map((row) => (
            <tr key={row.category} className="bg-background/70">
              <td className="px-6 py-4 font-medium text-foreground">{row.category}</td>
              <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{row.aurora}</td>
              <td className="px-6 py-4 text-muted-foreground">{row.legacy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
