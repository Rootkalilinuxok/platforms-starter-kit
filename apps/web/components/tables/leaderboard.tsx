interface Leader {
  name: string;
  coverage: string;
  automation: number;
  countries: number;
}

export function Leaderboard({leaders}: {leaders: Leader[]}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-3">Provider</th>
            <th className="px-5 py-3">Coverage</th>
            <th className="px-5 py-3">Automation</th>
            <th className="px-5 py-3">Countries</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {leaders.map((leader) => (
            <tr key={leader.name} className="bg-background/80">
              <td className="px-5 py-4 font-semibold">{leader.name}</td>
              <td className="px-5 py-4 text-muted-foreground">{leader.coverage}</td>
              <td className="px-5 py-4">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  {leader.automation}%
                </span>
              </td>
              <td className="px-5 py-4">{leader.countries}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
