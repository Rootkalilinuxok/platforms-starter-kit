'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  DEFAULT_PLAN,
  DEFAULT_ROLE,
  hasAnyRole,
  hasRequiredPlan,
  normalizeRoles,
  plansForRoles,
  type PlanName,
  type RoleName
} from '@/lib/rbac';

export interface AccessCheck {
  plans?: PlanName | PlanName[];
  roles?: RoleName | RoleName[];
}

export function useRBAC() {
  const { data: session, status } = useSession();

  const userPlan = (session?.user?.plan ?? DEFAULT_PLAN) as PlanName;
  const userRoles = normalizeRoles(session?.user?.roles ?? [DEFAULT_ROLE]);

  const availablePlans = useMemo(() => plansForRoles(userRoles), [userRoles]);

  function hasPlan(required?: PlanName | PlanName[]) {
    if (!required) return true;
    return hasRequiredPlan(userPlan, required);
  }

  function hasRole(required?: RoleName | RoleName[]) {
    if (!required) return true;
    return hasAnyRole(userRoles, required);
  }

  function canAccess(check?: AccessCheck) {
    if (!check) return true;
    return hasPlan(check.plans) && hasRole(check.roles);
  }

  return {
    status,
    session,
    plan: userPlan,
    roles: userRoles,
    availablePlans,
    hasPlan,
    hasRole,
    canAccess
  } as const;
}
