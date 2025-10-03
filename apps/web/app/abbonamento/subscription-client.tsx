'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CalendarClock, Check, Loader2, Receipt, Shield, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SubscriptionOverview } from '@/lib/billing';
import {
  clientConfirmSubscription,
  clientCreateCheckout,
  clientFetchOverview,
} from '@/lib/billing-client';

export type PlanLimit = {
  documents: number;
  simulatorsPro: boolean;
  aiCredits: number;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  priceMonthly: string;
  priceId: string;
  highlight?: boolean;
  limits: PlanLimit;
  perks: string[];
};

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(date?: string) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

type SubscriptionClientProps = {
  plans: SubscriptionPlan[];
  initialOverview: SubscriptionOverview | null;
  defaultUserId: string;
  defaultEmail: string;
  publishableKey?: string;
};

export function SubscriptionClient({
  plans,
  initialOverview,
  defaultUserId,
  defaultEmail,
  publishableKey,
}: SubscriptionClientProps) {
  const [userId, setUserId] = useState(defaultUserId);
  const [email, setEmail] = useState(defaultEmail);
  const [selectedPlanId, setSelectedPlanId] = useState(
    initialOverview?.subscriptions[0]?.planId ?? plans[0]?.id ?? '',
  );
  const [overview, setOverview] = useState(initialOverview);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirming, startConfirmTransition] = useTransition();

  const searchParams = useSearchParams();

  const activeSubscription = overview?.subscriptions?.[0] ?? null;
  const activePlan = plans.find((plan) => plan.id === activeSubscription?.planId) ?? plans[0];
  const nextRenewal = activeSubscription?.currentPeriodEnd;

  const renewalMessage = useMemo(() => {
    if (!nextRenewal) return null;
    const endDate = new Date(nextRenewal);
    const diff = endDate.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) {
      return "L'abbonamento corrente è scaduto. Rinnova per continuare ad accedere alle funzionalità premium.";
    }
    if (days <= 14) {
      return `Il rinnovo automatico è previsto tra ${days} giorni (${formatDate(nextRenewal)}).`;
    }
    return null;
  }, [nextRenewal]);

  useEffect(() => {
    const successParam = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    if (successParam && sessionId && !isConfirming) {
      startConfirmTransition(async () => {
        try {
          setErrorMessage(null);
          const confirmation = await clientConfirmSubscription(userId, sessionId);
          setSuccessMessage('Abbonamento confermato con successo.');
          const latestOverview = await clientFetchOverview(userId);
          setOverview(latestOverview);
          setSelectedPlanId(confirmation.planId);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossibile confermare l'abbonamento, riprova più tardi.",
          );
        }
      });
    }
  }, [isConfirming, searchParams, startConfirmTransition, userId]);

  async function handlePlanSelection(planId: string) {
    setSelectedPlanId(planId);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleCheckout() {
    if (!publishableKey) {
      setErrorMessage('Chiave pubblicabile Stripe mancante. Configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    const plan = plans.find((item) => item.id === selectedPlanId);
    if (!plan) {
      setErrorMessage('Seleziona un piano valido prima di procedere.');
      return;
    }

    if (!plan.priceId) {
      setErrorMessage('Prezzo Stripe non configurato per questo piano.');
      return;
    }

    if (!userId || !email) {
      setErrorMessage('Inserisci un identificativo utente ed un indirizzo email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const existingPromise = stripeCache.get(publishableKey) ?? loadStripe(publishableKey);
      stripeCache.set(publishableKey, existingPromise);
      const stripe = await existingPromise;
      if (!stripe) {
        throw new Error('Impossibile inizializzare Stripe Checkout.');
      }

      const idempotencyKey = crypto.randomUUID();
      const checkout = await clientCreateCheckout(
        {
          planId: plan.id,
          priceId: plan.priceId,
          userId,
          customerEmail: email,
          successUrl: `${window.location.origin}/abbonamento?success=1`,
          cancelUrl: `${window.location.origin}/abbonamento?canceled=1`,
          metadata: {
            planId: plan.id,
            source: 'abbonamento-dashboard',
          },
        },
        idempotencyKey,
      );

      if (checkout.url) {
        window.location.href = checkout.url;
        return;
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: checkout.sessionId });
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Errore inatteso durante il reindirizzamento a Stripe.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshOverview() {
    setErrorMessage(null);
    try {
      const latestOverview = await clientFetchOverview(userId);
      setOverview(latestOverview);
      if (latestOverview.subscriptions[0]) {
        setSelectedPlanId(latestOverview.subscriptions[0].planId);
      }
      setSuccessMessage('Dati di fatturazione aggiornati.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Non è stato possibile aggiornare i dati di fatturazione.',
      );
    }
  }

  const gatingLimits = activePlan?.limits;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Gestione abbonamento</h1>
          <p className="text-muted-foreground">
            Scegli il piano più adatto e controlla ordini, fatture e limiti di utilizzo sincronizzati con Stripe.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const isActive = plan.id === activePlan?.id;
            return (
              <Card
                key={plan.id}
                className={
                  isSelected
                    ? 'border-primary shadow-md ring-2 ring-primary/30'
                    : plan.highlight
                      ? 'border-primary/40'
                      : undefined
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{plan.name}</span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <Check className="size-3" /> Attivo
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-semibold">{plan.priceMonthly}</p>
                  <ul className="space-y-2 text-sm">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-muted-foreground">
                        <Check className="size-4 text-emerald-500" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handlePlanSelection(plan.id)}
                  >
                    {isSelected ? 'Piano selezionato' : 'Seleziona piano'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Dati del titolare</CardTitle>
            <CardDescription>Queste informazioni verranno inviate a Stripe per il checkout.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="userId">ID utente</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="utente-123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tuo.nome@azienda.it"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button disabled={isLoading} onClick={handleCheckout} className="w-full sm:w-auto">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Reindirizzamento…
                </span>
              ) : (
                'Procedi con Stripe Checkout'
              )}
            </Button>
            <Button variant="outline" onClick={refreshOverview} className="w-full sm:w-auto">
              Aggiorna stato
            </Button>
            {isConfirming ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Conferma in corso…
              </span>
            ) : null}
          </CardFooter>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Limiti e gating</CardTitle>
            <CardDescription>
              Stato delle funzionalità disponibili con il piano <strong>{activePlan?.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
              <Shield className="mt-0.5 size-4 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Documenti attivi</p>
                <p className="text-muted-foreground">
                  Fino a {gatingLimits?.documents ?? 0} documenti pubblicati simultaneamente.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
              {gatingLimits?.simulatorsPro ? (
                <Check className="mt-0.5 size-4 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 size-4 text-destructive" />
              )}
              <div className="space-y-1">
                <p className="font-medium">Simulatori avanzati</p>
                <p className="text-muted-foreground">
                  {gatingLimits?.simulatorsPro
                    ? 'Accesso completo ai simulatori pro per scenari finanziari e di crescita.'
                    : 'Aggiorna al piano Pro per sbloccare i simulatori avanzati.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
              <Check className="mt-0.5 size-4 text-emerald-500" />
              <div className="space-y-1">
                <p className="font-medium">Crediti AI mensili</p>
                <p className="text-muted-foreground">
                  {gatingLimits?.aiCredits ?? 0} crediti di analisi intelligente rigenerati ogni ciclo di fatturazione.
                </p>
              </div>
            </div>
            {renewalMessage ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <CalendarClock className="mt-0.5 size-4" />
                <div className="space-y-1">
                  <p className="font-medium">Promemoria rinnovo</p>
                  <p>{renewalMessage}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Storico fatture</CardTitle>
            <CardDescription>Ordini e pagamenti sincronizzati tramite webhook Stripe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview?.payments?.length ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Data</th>
                      <th className="px-4 py-2 text-left font-medium">Importo</th>
                      <th className="px-4 py-2 text-left font-medium">Stato</th>
                      <th className="px-4 py-2 text-left font-medium">Documenti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.payments.map((payment) => (
                      <tr key={payment.id} className="border-t">
                        <td className="px-4 py-2">{formatDate(payment.createdAt)}</td>
                        <td className="px-4 py-2">
                          {formatCurrency(payment.amount, payment.currency.toUpperCase())}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              payment.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : payment.status === 'open'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <Receipt className="size-3" /> {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {payment.hostedInvoiceUrl ? (
                              <a
                                className="text-primary underline-offset-4 hover:underline"
                                href={payment.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Portale
                              </a>
                            ) : null}
                            {payment.invoicePdf ? (
                              <a
                                className="text-primary underline-offset-4 hover:underline"
                                href={payment.invoicePdf}
                                target="_blank"
                                rel="noreferrer"
                              >
                                PDF
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                <AlertCircle className="size-4" /> Nessuna fattura disponibile. Completa un checkout per iniziare.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Stato dell'abbonamento</CardTitle>
            <CardDescription>Monitoraggio in tempo reale dell'ultimo ciclo di fatturazione.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
              <Shield className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Piano corrente</p>
                <p className="text-muted-foreground">{activePlan?.name ?? 'Nessun piano attivo'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
              <CalendarClock className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Prossimo rinnovo</p>
                <p className="text-muted-foreground">{formatDate(nextRenewal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
              {activeSubscription?.cancelAtPeriodEnd ? (
                <AlertCircle className="size-5 text-amber-500" />
              ) : (
                <Check className="size-5 text-emerald-500" />
              )}
              <div>
                <p className="text-sm font-medium">Rinnovo automatico</p>
                <p className="text-muted-foreground">
                  {activeSubscription?.cancelAtPeriodEnd
                    ? "Il rinnovo automatico è disattivato: l'accesso terminerà al termine del periodo corrente."
                    : 'Il rinnovo automatico è attivo e verrà eseguito alla fine del ciclo di fatturazione.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <XCircle className="size-5" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          <Check className="size-5" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
