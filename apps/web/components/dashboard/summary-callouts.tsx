import {AlertCircle, CheckCircle2, Info} from 'lucide-react';

import {Card, CardContent} from '@/components/ui/card';

interface SummaryItem {
  title: string;
  body: string;
  tone: 'info' | 'success' | 'warning';
}

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle
};

const toneClasses: Record<SummaryItem['tone'], string> = {
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
};

export function SummaryCallouts({items}: {items: SummaryItem[]}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const Icon = iconMap[item.tone];
        return (
          <Card key={item.title} className="border-border/60">
            <CardContent className="flex flex-col gap-3 py-6">
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[item.tone]}`}>
                <Icon className="size-4" />
                {item.tone.toUpperCase()}
              </span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
