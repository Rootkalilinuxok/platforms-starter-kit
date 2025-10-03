import { Injectable, OnModuleInit } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe!: Stripe;

  onModuleInit(): void {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      appInfo: {
        name: 'Platform Starter Kit',
      },
    });
  }

  get client(): Stripe {
    return this.stripe;
  }
}
