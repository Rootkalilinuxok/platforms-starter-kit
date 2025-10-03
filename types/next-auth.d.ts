import 'next-auth';
import 'next-auth/jwt';
import type { PlanName, RoleName } from '@/lib/rbac';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: PlanName;
      roles: RoleName[];
    };
  }

  interface User {
    id: string;
    plan?: PlanName;
    roles?: RoleName[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    plan?: PlanName;
    roles?: RoleName[];
    profileId?: string | null;
  }
}
