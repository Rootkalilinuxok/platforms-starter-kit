import {LucideIcon} from 'lucide-react';
import {ReactNode} from 'react';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  footer?: ReactNode;
}

export function FeatureCard({icon: Icon, title, description, footer}: FeatureCardProps) {
  return (
    <Card className="h-full border-border/60 shadow-none transition hover:border-primary/40 hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" strokeWidth={1.6} />
        </span>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>
        {footer ? <div className="text-sm text-muted-foreground">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
