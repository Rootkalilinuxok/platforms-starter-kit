import { describe, expect, it, beforeEach, vi } from 'vitest';
import Stripe from 'stripe';
import { BillingService } from '../billing.service';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const webhookSecret = 'whsec_test_secret';

describe('BillingService webhook integration', () => {
  let prisma: {
    subscription: {
      upsert: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    payment: {
      upsert: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let idempotency: IdempotencyService;
  let billingService: BillingService;

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

    prisma = {
      subscription: {
        upsert: vi.fn().mockResolvedValue({
          id: 'sub_db',
          userId: 'user_123',
          planId: 'plan_pro',
          status: 'active',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          currentPeriodEnd: new Date('2025-01-01T00:00:00.000Z'),
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date('2024-12-01T00:00:00.000Z'),
          canceledAt: null,
          metadata: { planId: 'plan_pro' },
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [],
        }),
        findFirst: vi.fn().mockResolvedValue({
          id: 'sub_db',
          userId: 'user_123',
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      payment: {
        upsert: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn().mockImplementation(async (operations: any[]) => Promise.all(operations)),
    };

    idempotency = {
      getCachedResponse: vi.fn().mockResolvedValue(null),
      persistResponse: vi.fn().mockResolvedValue(undefined),
    } as unknown as IdempotencyService;

    const stripeClient = {
      webhooks: {
        constructEvent: (payload: Buffer, signature: string, secret: string) =>
          Stripe.webhooks.constructEvent(payload, signature, secret),
      },
    } as unknown as Stripe;

    billingService = new BillingService(prisma as unknown as PrismaService, { client: stripeClient } as any, idempotency);
  });

  it('persists subscription updates from webhook events', async () => {
    const eventPayload = {
      id: 'evt_subscription_updated',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: Math.floor(new Date('2024-12-01T00:00:00.000Z').getTime() / 1000),
          current_period_end: Math.floor(new Date('2025-01-01T00:00:00.000Z').getTime() / 1000),
          canceled_at: null,
          items: {
            data: [
              {
                price: {
                  id: 'price_123',
                },
              },
            ],
          },
          metadata: {
            userId: 'user_123',
            planId: 'plan_pro',
          },
        },
      },
    } satisfies Stripe.Event;

    const payloadBuffer = Buffer.from(JSON.stringify(eventPayload));
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: payloadBuffer,
      secret: webhookSecret,
    });

    await billingService.handleWebhook(signature, payloadBuffer);

    expect(prisma.subscription.upsert).toHaveBeenCalledTimes(1);
    const upsertArgs = prisma.subscription.upsert.mock.calls[0][0];
    expect(upsertArgs.create.planId).toBe('plan_pro');
    expect(upsertArgs.update.status).toBe('active');
  });

  it('records invoices from invoice webhook events', async () => {
    prisma.subscription.findFirst = vi.fn().mockResolvedValue({
      id: 'sub_db',
      userId: 'user_123',
    });

    const invoicePayload = {
      id: 'evt_invoice_paid',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_123',
          subscription: 'sub_123',
          amount_paid: 1999,
          currency: 'eur',
          status: 'paid',
          hosted_invoice_url: 'https://stripe.test/invoices/in_123',
          invoice_pdf: 'https://stripe.test/invoices/in_123.pdf',
          customer: 'cus_123',
          payment_intent: 'pi_123',
          metadata: {
            userId: 'user_123',
          },
        },
      },
    } satisfies Stripe.Event;

    const payloadBuffer = Buffer.from(JSON.stringify(invoicePayload));
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: payloadBuffer,
      secret: webhookSecret,
    });

    await billingService.handleWebhook(signature, payloadBuffer);

    expect(prisma.payment.upsert).toHaveBeenCalledTimes(1);
    const upsertArgs = prisma.payment.upsert.mock.calls[0][0];
    expect(upsertArgs.create.amount).toBe(1999);
    expect(upsertArgs.create.status).toBe('paid');
  });
});
