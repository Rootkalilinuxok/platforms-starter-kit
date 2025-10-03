import 'server-only';

const API_BASE_URL = process.env.NEXT_PUBLIC_BILLING_API_URL || 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Billing API request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

export interface SubscriptionOverview {
  subscriptions: Array<{
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    hostedInvoiceUrl?: string | null;
    invoicePdf?: string | null;
  }>;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string | null;
  subscriptionId: string;
}

export interface SubscriptionSummary {
  id: string;
  status: string;
  planId: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export async function getSubscriptionOverview(userId: string): Promise<SubscriptionOverview> {
  return request<SubscriptionOverview>(`/billing/overview/${userId}`);
}
