import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StripeModule } from '../common/stripe/stripe.module';
import { IdempotencyModule } from '../common/idempotency/idempotency.module';

@Module({
  imports: [PrismaModule, StripeModule, IdempotencyModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
