export const COACHING_PRODUCT = {
  id: 'coaching' as const,
  name: 'One-on-One Coaching',
  description:
    'Professional coaching focused on your specific academic, behavioral, and financial goals.',
  price: 89,
  unit: 'session' as const,
  features: [
    '30-minute focused sessions',
    'Professional coaches',
    'Academic achievement strategies',
    'Financial literacy guidance',
    'Personalized action plans',
    'Convenient phone consultations',
  ],
  appleProductId: 'one_on_one_coaching',
};
