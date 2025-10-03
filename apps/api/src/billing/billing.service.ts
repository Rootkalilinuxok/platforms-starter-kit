import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StripeService } from '../common/stripe/stripe.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ConfirmSubscriptionDto } from './dto/confirm-subscription.dto';
import Stripe from 'stripe';

interface CheckoutResponse {
  sessionId: string;
  url: string | null;
  subscriptionId: string;
}

interface SubscriptionSummary {
  id: string;
  status: string;
  planId: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async createCheckoutSession(
    dto: CreateCheckoutDto,
    idempotencyKey: string | undefined,
  ): Promise<CheckoutResponse> {
    if (idempotencyKey) {
      const cached = await this.idempotency.getCachedResponse<CheckoutResponse>(idempotencyKey);
      if (cached) {
        return cached.body;
      }
    }

    const stripeCustomerId = await this.ensureStripeCustomer(dto.userId, dto.customerEmail);
    const subscriptionRecord = await this.prisma.subscription.upsert({
      where: { userId_planId: { userId: dto.userId, planId: dto.planId } },
      create: {
        userId: dto.userId,
        planId: dto.planId,
        status: 'pending',
        stripeCustomerId,
        metadata: dto.metadata,
      },
      update: {
        planId: dto.planId,
        status: 'pending',
        stripeCustomerId,
        metadata: dto.metadata,
      },
    });

    const session = await this.stripe.client.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: stripeCustomerId,
        success_url: dto.successUrl,
        cancel_url: dto.cancelUrl,
        line_items: [
          {
            price: dto.priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            ...dto.metadata,
            userId: dto.userId,
            planId: dto.planId,
            subscriptionId: subscriptionRecord.id,
          },
        },
        allow_promotion_codes: dto.allowPromotionCodes,
        metadata: {
          userId: dto.userId,
          planId: dto.planId,
          subscriptionId: subscriptionRecord.id,
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    const response: CheckoutResponse = {
      sessionId: session.id,
      url: session.url,
      subscriptionId: subscriptionRecord.id,
    };

    if (idempotencyKey) {
      await this.idempotency.persistResponse(idempotencyKey, 'POST', '/billing/checkout', {
        status: 200,
        body: response,
      });
    }

    return response;
  }

  async confirmSubscription(
    dto: ConfirmSubscriptionDto,
    idempotencyKey: string | undefined,
  ): Promise<SubscriptionSummary> {
    if (idempotencyKey) {
      const cached = await this.idempotency.getCachedResponse<SubscriptionSummary>(idempotencyKey);
      if (cached) {
        return cached.body;
      }
    }

    const session = await this.stripe.client.checkout.sessions.retrieve(dto.sessionId, {
      expand: ['subscription', 'subscription.latest_invoice'],
    });

    if (!session.subscription) {
      throw new Error('Checkout session does not contain a subscription');
    }

    const subscription = session.subscription as Stripe.Subscription;

    const planId =
      (session.metadata?.planId as string | undefined) ??
      (subscription.metadata?.planId as string | undefined) ??
      dto.metadata?.planId ??
      dto.userId;

    const record = await this.prisma.subscription.upsert({
      where: { userId_planId: { userId: dto.userId, planId } },
      create: {
        userId: dto.userId,
        planId,
        status: subscription.status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        metadata: {
          ...subscription.metadata,
          ...dto.metadata,
        },
      },
      update: {
        status: subscription.status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        metadata: {
          ...subscription.metadata,
          ...dto.metadata,
        },
      },
    });

    const invoice = session.latest_invoice as Stripe.Invoice | null;
    if (invoice) {
      await this.upsertPaymentFromInvoice(invoice, record.id, dto.userId);
    }

    const summary: SubscriptionSummary = {
      id: record.id,
      status: record.status,
      planId: record.planId,
      currentPeriodEnd: record.currentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    };

    if (idempotencyKey) {
      await this.idempotency.persistResponse(idempotencyKey, 'POST', '/billing/subscribe', {
        status: 200,
        body: summary,
      });
    }

    return summary;
  }

  async handleWebhook(signature: string | undefined, payload: Buffer): Promise<void> {
    if (!signature) {
      throw new Error('Missing Stripe-Signature header');
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.client.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${(error as Error).message}`);
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncSubscriptionFromStripe(subscription);
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await this.syncInvoice(invoice);
        }
        break;
      }
      default:
        break;
    }
  }

  async listSubscriptionOverview(userId: string): Promise<{
    subscriptions: SubscriptionSummary[];
    payments: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
      hostedInvoiceUrl?: string | null;
      invoicePdf?: string | null;
    }[];
  }> {
    const [subscriptions, payments] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        status: subscription.status,
        planId: subscription.planId,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
        hostedInvoiceUrl: payment.hostedInvoiceUrl,
        invoicePdf: payment.invoicePdf,
      })),
    };
  }

  private async ensureStripeCustomer(userId: string, email: string): Promise<string> {
    const existing = await this.prisma.subscription.findFirst({
      where: {
        userId,
        stripeCustomerId: { not: null },
      },
    });
    if (existing?.stripeCustomerId) {
      return existing.stripeCustomerId;
    }

    const customer = await this.stripe.client.customers.create({
      email,
      metadata: { userId },
    });

    return customer.id;
  }

  private async syncSubscriptionFromStripe(subscription: Stripe.Subscription): Promise<void> {
    const planId =
      (subscription.metadata?.planId as string | undefined) ??
      subscription.items.data[0]?.price?.id ??
      'unknown';
    await this.prisma.subscription.upsert({
      where: {
        userId_planId: {
          userId: subscription.metadata.userId ?? (subscription.customer as string),
          planId,
        },
      },
      create: {
        userId: subscription.metadata.userId ?? (subscription.customer as string),
        planId,
        status: subscription.status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        metadata: subscription.metadata,
      },
      update: {
        status: subscription.status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        metadata: subscription.metadata,
      },
    });
  }

  private async syncInvoice(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string | undefined;
    const subscriptionRecord = subscriptionId
      ? await this.prisma.subscription.findFirst({
          where: {
            stripeSubscriptionId: subscriptionId,
          },
        })
      : null;

    await this.upsertPaymentFromInvoice(invoice, subscriptionRecord?.id ?? null, invoice.metadata?.userId);
  }

  private async upsertPaymentFromInvoice(
    invoice: Stripe.Invoice,
    subscriptionId: string | null,
    userId?: string | null,
  ): Promise<void> {
    const amount = invoice.amount_paid ?? invoice.amount_due ?? 0;
    const metadata = invoice.metadata ?? undefined;
    await this.prisma.payment.upsert({
      where: {
        stripeInvoiceId: invoice.id,
      },
      create: {
        subscriptionId: subscriptionId ?? undefined,
        userId: userId ?? metadata?.userId ?? (invoice.customer as string),
        stripeInvoiceId: invoice.id,
        stripePaymentIntent: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : undefined,
        amount,
        currency: invoice.currency ?? 'usd',
        status: invoice.status ?? 'unknown',
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
        invoicePdf: invoice.invoice_pdf ?? undefined,
        metadata,
      },
      update: {
        subscriptionId: subscriptionId ?? undefined,
        userId: userId ?? metadata?.userId ?? (invoice.customer as string),
        stripePaymentIntent: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : undefined,
        amount,
        currency: invoice.currency ?? 'usd',
        status: invoice.status ?? 'unknown',
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
        invoicePdf: invoice.invoice_pdf ?? undefined,
        metadata,
      },
    });
  }
}
