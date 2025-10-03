export const PLANS = [
  'guest',
  'user_free',
  'premium_base',
  'premium_pro',
  'platinum',
  'partner_consulente',
  'admin'
] as const;

export const ROLES = [
  'guest',
  'user_free',
  'premium_base',
  'premium_pro',
  'platinum',
  'partner_consulente',
  'admin'
] as const;

export type PlanName = (typeof PLANS)[number];
export type RoleName = (typeof ROLES)[number];

export const DEFAULT_PLAN: PlanName = 'user_free';
export const DEFAULT_ROLE: RoleName = 'user_free';

const PLAN_PRIORITY: Record<PlanName, number> = {
  guest: 0,
  user_free: 1,
  premium_base: 2,
  premium_pro: 3,
  platinum: 4,
  partner_consulente: 5,
  admin: 6
};

export function sortByPlanPriority(planA: PlanName, planB: PlanName) {
  return PLAN_PRIORITY[planA] - PLAN_PRIORITY[planB];
}

export function hasRequiredPlan(
  userPlan: PlanName,
  required: PlanName | PlanName[]
) {
  const requiredPlans = Array.isArray(required) ? required : [required];
  return requiredPlans.some((plan) => PLAN_PRIORITY[userPlan] >= PLAN_PRIORITY[plan]);
}

export function hasAnyRole(userRoles: RoleName[], required: RoleName | RoleName[]) {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((role) => userRoles.includes(role));
}

export const ROLE_PLAN_MATRIX: Record<RoleName, PlanName[]> = {
  guest: ['guest'],
  user_free: ['guest', 'user_free'],
  premium_base: ['guest', 'user_free', 'premium_base'],
  premium_pro: ['guest', 'user_free', 'premium_base', 'premium_pro'],
  platinum: ['guest', 'user_free', 'premium_base', 'premium_pro', 'platinum'],
  partner_consulente: [
    'guest',
    'user_free',
    'premium_base',
    'premium_pro',
    'platinum',
    'partner_consulente'
  ],
  admin: [...PLANS]
};

export function plansForRoles(roles: RoleName[]): PlanName[] {
  const aggregates = new Set<PlanName>();
  roles.forEach((role) => {
    ROLE_PLAN_MATRIX[role]?.forEach((plan) => aggregates.add(plan));
  });

  return Array.from(aggregates).sort(sortByPlanPriority);
}

export function normalizeRoles(roles?: RoleName[] | null): RoleName[] {
  if (!roles?.length) {
    return [DEFAULT_ROLE];
  }

  return Array.from(new Set(roles.filter((role): role is RoleName => ROLES.includes(role)))).sort(
    (a, b) => PLAN_PRIORITY[a] - PLAN_PRIORITY[b]
  );
}

export function derivePlanFromRoles(roles: RoleName[], fallback: PlanName = DEFAULT_PLAN) {
  const plans = plansForRoles(roles);
  if (!plans.length) return fallback;
  return plans.reduce((highest, current) =>
    PLAN_PRIORITY[current] > PLAN_PRIORITY[highest] ? current : highest
  , plans[0]);
}
