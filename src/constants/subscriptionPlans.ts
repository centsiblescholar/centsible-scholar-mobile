import { Platform } from 'react-native';

export interface ProductIds {
  monthly: string;
  annual: string;
}

export interface SubscriptionPlan {
  id: 'single' | 'midsize' | 'large';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  studentLimit: number;
  features: string[];
  badge?: string;
  appleProductId: ProductIds;
  googleProductId: ProductIds;
  rcPackageId: ProductIds;
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
    appleProductId: {
      monthly: 'com.centsiblescholar.single.monthly',
      annual: 'com.centsiblescholar.single.annual',
    },
    googleProductId: {
      monthly: 'com.centsiblescholar.single.monthly',
      annual: 'com.centsiblescholar.single.annual',
    },
    rcPackageId: {
      monthly: '$rc_monthly',
      annual: '$rc_annual',
    },
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
    appleProductId: {
      monthly: 'com.centsiblescholar.midsize.monthly',
      annual: 'com.centsiblescholar.midsize.annual',
    },
    googleProductId: {
      monthly: 'com.centsiblescholar.midsize.monthly',
      annual: 'com.centsiblescholar.midsize.annual',
    },
    rcPackageId: {
      monthly: '$rc_monthly',
      annual: '$rc_annual',
    },
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
    appleProductId: {
      monthly: 'com.centsiblescholar.large.monthly',
      annual: 'com.centsiblescholar.large.annual',
    },
    googleProductId: {
      monthly: 'com.centsiblescholar.large.monthly',
      annual: 'com.centsiblescholar.large.annual',
    },
    rcPackageId: {
      monthly: '$rc_monthly',
      annual: '$rc_annual',
    },
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

export function getProductIdForPlatform(
  planId: SubscriptionPlan['id'],
  billingInterval: 'monthly' | 'annual',
  platform?: 'ios' | 'android'
): string {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const os = platform ?? (Platform.OS === 'ios' ? 'ios' : 'android');
  const productIds = os === 'ios' ? plan.appleProductId : plan.googleProductId;
  return productIds[billingInterval];
}
