import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsString()
  @IsNotEmpty()
  priceId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEmail()
  customerEmail!: string;

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;

  @IsOptional()
  metadata?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  allowPromotionCodes?: boolean;
}
