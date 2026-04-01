/**
 * MintKit Subscription & Permission Logic
 */

export type Plan = 'free' | 'basic' | 'premium';

// ─── Permission helpers ────────────────────────────────────────────────────

export function canDownload(plan: Plan): boolean {
  return plan === 'basic' || plan === 'premium';
}

export function canCopy(plan: Plan): boolean {
  return plan === 'basic' || plan === 'premium';
}

export function canPriorityGeneration(plan: Plan): boolean {
  return plan === 'premium';
}

/**
 * Whether a user on `currentPlan` can upgrade to `targetPlan`.
 * Only allow upgrades (higher tier), not downgrades.
 */
export function canUpgradeTo(currentPlan: Plan, targetPlan: Plan): boolean {
  const tiers: Record<Plan, number> = { free: 0, basic: 1, premium: 2 };
  return tiers[targetPlan] > tiers[currentPlan];
}

export function getMonthlyLimit(plan: Plan): number {
  if (plan === 'premium') return Infinity;
  if (plan === 'basic') return 30;
  return 1; // free: 1 per day
}

export function getDailyLimit(plan: Plan): number {
  return 1; // all plans: 1 per day
}

export function isOverDailyLimit(plan: Plan, todayCount: number): boolean {
  return todayCount >= getDailyLimit(plan);
}

export function isOverMonthlyLimit(plan: Plan, monthlyCount: number): boolean {
  return monthlyCount >= getMonthlyLimit(plan);
}

export function getPlanLabel(plan: Plan): string {
  if (plan === 'free') return 'Free';
  if (plan === 'basic') return 'Basic';
  return 'Premium';
}

export function getPlanColor(plan: Plan): string {
  if (plan === 'free') return 'bg-gray-100 text-gray-600 border-gray-200';
  if (plan === 'basic') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

// ─── Plan info for pricing page ─────────────────────────────────────────────

export interface PlanInfo {
  id: Plan;
  name: string;
  price: number | null; // null = free
  priceLabel: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    priceLabel: '$0',
    description: 'Try it out with limited generation',
    features: [
      '1 generation per day',
      'Preview product ideas',
      'View generated content',
      '❌ No PDF download',
      '❌ No content copy',
      '❌ No priority generation',
    ],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.9,
    priceLabel: '$9.9',
    description: 'Perfect for casual creators',
    features: [
      '30 generations per month',
      'Download PDF',
      'Copy content to clipboard',
      'Full product templates',
      'Email support',
      '❌ No priority generation',
    ],
    highlighted: false,
    cta: 'Upgrade to Basic',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.9,
    priceLabel: '$19.9',
    description: 'For serious digital product creators',
    features: [
      'Unlimited generations',
      'Download PDF',
      'Copy content to clipboard',
      'Priority generation queue',
      'All templates unlocked',
      'Priority email support',
    ],
    highlighted: true,
    cta: 'Upgrade to Premium',
  },
];

// ─── Session / user plan helpers ─────────────────────────────────────────────

export interface UserPlanInfo {
  plan: Plan;
  todayCount: number;
  monthlyCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  canDownload: boolean;
  canCopy: boolean;
  canPriority: boolean;
  isOverDailyLimit: boolean;
  isOverMonthlyLimit: boolean;
}

export function buildUserPlanInfo(
  plan: Plan,
  todayCount: number,
  monthlyCount: number
): UserPlanInfo {
  return {
    plan,
    todayCount,
    monthlyCount,
    dailyLimit: getDailyLimit(plan),
    monthlyLimit: getMonthlyLimit(plan),
    canDownload: canDownload(plan),
    canCopy: canCopy(plan),
    canPriority: canPriorityGeneration(plan),
    isOverDailyLimit: isOverDailyLimit(plan, todayCount),
    isOverMonthlyLimit: isOverMonthlyLimit(plan, monthlyCount),
  };
}
