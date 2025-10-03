import { Suspense } from 'react';

import { getSubscriptionOverview } from '@/lib/billing';
import type { SubscriptionOverview } from '@/lib/billing';
import { SubscriptionClient, type SubscriptionPlan } from './subscription-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEFAULT_USER_ID = 'demo-user';
const DEFAULT_EMAIL = 'demo@azienda.it';

const plans: SubscriptionPlan[] = [
  {
    id: 'startup',
    name: 'Startup',
    description: 'Per team che lanciano il loro primo prodotto digitale.',
    priceMonthly: '€0 / mese',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTUP ?? '',
    limits: {
      documents: 3,
      simulatorsPro: false,
      aiCredits: 30,
    },
    perks: ['Gestione domini personalizzati', 'Onboarding guidato', 'Community e knowledge base'],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Funzionalità avanzate per piattaforme in rapida crescita.',
    priceMonthly: '€49 / mese',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH ?? '',
    highlight: true,
    limits: {
      documents: 25,
      simulatorsPro: true,
      aiCredits: 250,
    },
    perks: [
      'Limiti documenti aumentati',
      'Simulatori pro e scenari avanzati',
      'Notifiche email e Slack',
      'Integrazione webhook personalizzata',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Scalabilità e sicurezza per aziende multi-team.',
    priceMonthly: '€149 / mese',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? '',
    limits: {
      documents: 100,
      simulatorsPro: true,
      aiCredits: 1000,
    },
    perks: [
      'Account manager dedicato',
      'SLA e supporto prioritario',
      'Esportazioni avanzate e audit log',
      'Single Sign-On (SAML/OIDC)',
    ],
  },
];

async function loadOverview(userId: string): Promise<SubscriptionOverview | null> {
  try {
    return await getSubscriptionOverview(userId);
  } catch (error) {
    console.error('Impossibile recuperare il riepilogo abbonamenti', error);
    return null;
  }
}

export default async function AbbonamentoPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const overview = await loadOverview(DEFAULT_USER_ID);

  return (
    <main className="container mx-auto max-w-6xl space-y-10 pb-16 pt-10">
      <Suspense fallback={<SkeletonState />}>
        <SubscriptionClient
          plans={plans}
          initialOverview={overview}
          defaultUserId={DEFAULT_USER_ID}
          defaultEmail={DEFAULT_EMAIL}
          publishableKey={publishableKey}
        />
      </Suspense>
    </main>
  );
}

function SkeletonState() {
  return (
    <div className="grid gap-6">
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3).keys()].map((key) => (
          <Card key={key} className="animate-pulse">
            <CardHeader>
              <CardTitle className="h-4 w-32 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
