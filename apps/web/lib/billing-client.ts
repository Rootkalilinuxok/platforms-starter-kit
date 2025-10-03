'use client';

import type { CheckoutResponse, SubscriptionOverview, SubscriptionSummary } from './billing';

const API_BASE_URL = process.env.NEXT_PUBLIC_BILLING_API_URL || 'http://localhost:4000';

async function clientRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Billing API error (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export async function clientCreateCheckout(
  input: {
    planId: string;
    priceId: string;
    userId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    allowPromotionCodes?: boolean;
  },
  idempotencyKey?: string,
): Promise<CheckoutResponse> {
  return clientRequest<CheckoutResponse>(`/billing/checkout`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function clientConfirmSubscription(
  userId: string,
  sessionId: string,
  idempotencyKey?: string,
): Promise<SubscriptionSummary> {
  return clientRequest<SubscriptionSummary>(`/billing/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ userId, sessionId }),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function clientFetchOverview(userId: string): Promise<SubscriptionOverview> {
  return clientRequest<SubscriptionOverview>(`/billing/overview/${userId}`, {
    method: 'GET',
  });
}
