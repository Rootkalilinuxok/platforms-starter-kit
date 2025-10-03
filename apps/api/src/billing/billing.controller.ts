import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ConfirmSubscriptionDto } from './dto/confirm-subscription.dto';
import { Request } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  async createCheckout(
    @Body() body: CreateCheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const result = await this.billingService.createCheckoutSession(body, idempotencyKey);
    return result;
  }

  @Post('subscribe')
  async confirmSubscription(
    @Body() body: ConfirmSubscriptionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const result = await this.billingService.confirmSubscription(body, idempotencyKey);
    return result;
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature?: string,
  ) {
    const rawBody = (request as any).rawBody as Buffer | undefined;
    const payload = rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
    await this.billingService.handleWebhook(signature, payload);
    return { received: true };
  }

  @Get('overview/:userId')
  async getOverview(@Param('userId') userId: string) {
    return this.billingService.listSubscriptionOverview(userId);
  }
}
