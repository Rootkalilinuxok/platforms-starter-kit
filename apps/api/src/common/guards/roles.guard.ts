import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAnyRole, normalizeRoles, type RoleName } from '@/lib/rbac';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { roles?: RoleName[] } }>();
    const userRoles = normalizeRoles(request.user?.roles);

    if (!userRoles.length || !hasAnyRole(userRoles, requiredRoles)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
