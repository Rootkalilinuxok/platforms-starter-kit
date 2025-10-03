'use client';

import type { ReactNode } from 'react';
import { useRBAC } from '@/hooks/use-rbac';
import type { PlanName } from '@/lib/rbac';

interface RequirePlanProps {
  allowed: PlanName | PlanName[];
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  children: ReactNode;
}

export function RequirePlan({
  allowed,
  fallback = null,
  loadingFallback = null,
  children
}: RequirePlanProps) {
  const { status, hasPlan } = useRBAC();

  if (status === 'loading') {
    return <>{loadingFallback}</>;
  }

  if (!hasPlan(allowed)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
