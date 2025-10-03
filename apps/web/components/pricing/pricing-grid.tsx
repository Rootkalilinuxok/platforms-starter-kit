import {CheckCircle2} from 'lucide-react';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

export interface PricingGridProps {
  plans: PricingPlan[];
}

export function PricingGrid({plans}: PricingGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={cn(
            'relative flex h-full flex-col border-border/60',
            plan.highlight && 'border-primary shadow-lg shadow-primary/25'
          )}
        >
          {plan.highlight ? (
            <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
              Most popular
            </span>
          ) : null}
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription className="text-base">{plan.description}</CardDescription>
            <div className="flex items-baseline gap-1 text-3xl font-semibold">
              {plan.price}
              {plan.period ? <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span> : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-6">
            <ul className="space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Start trial
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
