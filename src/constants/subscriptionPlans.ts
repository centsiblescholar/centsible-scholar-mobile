export interface SubscriptionPlan {
  id: 'single' | 'midsize' | 'large';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  studentLimit: number;
  features: string[];
  badge?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'single',
    name: 'Standard',
    description: 'Perfect for one child',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    studentLimit: 1,
    features: [
      'One student account',
      'Complete allocation tracking',
      'Daily behavior assessments',
      'Comprehensive grade tracking',
      'Financial literacy education',
      'Email support',
    ],
  },
  {
    id: 'midsize',
    name: 'Premium',
    description: 'Best for 2-3 children',
    monthlyPrice: 12.99,
    annualPrice: 129.99,
    studentLimit: 3,
    badge: 'Most Popular',
    features: [
      'Up to 3 student accounts',
      'Family dashboard view',
      'Individual student dashboards',
      'All Standard features',
      'Advanced analytics & reports',
      'Priority email support',
    ],
  },
  {
    id: 'large',
    name: 'Family',
    description: 'Perfect for large families',
    monthlyPrice: 15.99,
    annualPrice: 159.99,
    studentLimit: 5,
    features: [
      'Up to 5 student accounts',
      'Everything in Premium',
      'Best per-student value',
      'Advanced family analytics',
      'Priority email support',
      'Early access to new features',
    ],
  },
];

export const STUDENT_LIMITS: Record<string, number> = {
  single: 1,
  midsize: 3,
  large: 5,
};

export function getStudentLimit(subscriptionType: string | null): number {
  if (!subscriptionType) return 0;
  return STUDENT_LIMITS[subscriptionType] ?? 0;
}

export function getAnnualSavings(plan: SubscriptionPlan): number {
  return plan.monthlyPrice * 12 - plan.annualPrice;
}

export function getAnnualSavingsPercent(plan: SubscriptionPlan): number {
  return Math.round(
    ((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100
  );
}
