import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '@/lib/rbac';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
