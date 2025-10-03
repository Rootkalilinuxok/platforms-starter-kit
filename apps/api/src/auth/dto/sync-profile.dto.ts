import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { PLANS, ROLES, type PlanName, type RoleName } from '@/lib/rbac';

class ProfileMetadataDto {
  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsString()
  locale?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  company?: string | null;
}

export class SyncProfileDto {
  @IsString()
  userId!: string;

  @IsEmail()
  email!: string;

  @IsIn(PLANS as readonly string[])
  plan!: PlanName;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ROLES as readonly string[], { each: true })
  roles!: RoleName[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileMetadataDto)
  profile?: ProfileMetadataDto | null;
}
