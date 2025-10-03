import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PLANS, type PlanName } from '@/lib/rbac';

export class SignupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsIn(PLANS as readonly string[])
  plan!: PlanName;
}
