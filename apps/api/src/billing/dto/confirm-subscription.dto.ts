import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  metadata?: Record<string, string>;
}
