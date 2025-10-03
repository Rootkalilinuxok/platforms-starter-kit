import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingModule } from './billing/billing.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { StripeModule } from './common/stripe/stripe.module';
import { IdempotencyModule } from './common/idempotency/idempotency.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StripeModule,
    IdempotencyModule,
    BillingModule,
  ],
})
export class AppModule {}
