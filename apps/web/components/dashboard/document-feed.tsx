import {FileText, Inbox} from 'lucide-react';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';

export interface DocumentItem {
  id: string;
  name: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DocumentFeedProps {
  title: string;
  emptyLabel: string;
  items: DocumentItem[];
}

const statusMap: Record<DocumentItem['status'], string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Requires changes'
};

export function DocumentFeed({title, emptyLabel, items}: DocumentFeedProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-sm">Latest regulatory submissions across teams.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 px-6 py-10 text-center text-muted-foreground">
            <Inbox className="size-10" />
            <p>{emptyLabel}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-transparent px-4 py-3 hover:border-border/80">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Submitted {item.submittedAt}</p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {statusMap[item.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
