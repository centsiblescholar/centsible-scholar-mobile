# Phase 4: Subscription UI + Gates - Research

**Researched:** 2026-02-06
**Domain:** Subscription gating, paywall UI, mock IAP flow in Expo Go
**Confidence:** HIGH

## Summary

Phase 4 implements subscription enforcement and paywall UI with a mock purchase flow, all running in Expo Go (no native dev build). The core challenge is integrating a subscription gate into the existing Expo Router navigation flow, building a polished paywall screen with three plan tiers, and creating a mock purchase system that writes to the existing `user_subscriptions` Supabase table. This phase requires NO new libraries -- it uses only what is already installed.

The existing codebase provides strong foundations: `useSubscriptionStatus` hook already queries the `user_subscriptions` table and returns `isActive` (true/false/null), `tier`, and display-formatted fields. The `app/index.tsx` root redirect is the single gatekeeper location. The `user_subscriptions` table already has all needed columns (status, subscription_type, current_period_start, current_period_end). The mock purchase flow simply inserts/updates a row in this table via Supabase, which the existing hook will pick up on refetch.

**Primary recommendation:** Use `Stack.Protected` guard pattern (Expo Router SDK 53+) for subscription gating, with paywall as both a modal screen and a stack screen in Expo Router. Mock purchases write directly to Supabase `user_subscriptions` table -- no mock libraries or fake stores needed.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | ~6.0.15 | Navigation, modal presentation, Stack.Protected guards | Already the project's router; has built-in guard pattern |
| @tanstack/react-query | ^5.90.11 | Data fetching, cache invalidation for subscription status | Already used for all data hooks |
| @supabase/supabase-js | (installed) | Direct table insert/update for mock purchase flow | Already the project's backend client |
| react-native (core) | 0.81.5 | Modal, Alert, ActivityIndicator, ScrollView, Switch, Linking | Core framework, no additions needed |
| @expo/vector-icons (Ionicons) | (installed) | Icons for paywall cards, status badges, close button | Already used throughout the app |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-constants | (installed) | App version display in settings | Already in settings screen |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct Supabase insert for mock | AsyncStorage mock | AsyncStorage would not persist across devices or test subscription inheritance; Supabase gives real end-to-end testing |
| Stack.Protected pattern | Manual Redirect in index.tsx | Stack.Protected is declarative and handles deep links; manual redirect is the current pattern and also works fine |
| Custom paywall component | RevenueCat PaywallView | RevenueCat requires native build (Phase 5); custom is required for Expo Go |

**Installation:**
```bash
# No new packages needed. Phase 4 uses only existing dependencies.
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  _layout.tsx              # Add paywall + manage-subscription Stack.Screen entries
  index.tsx                # Add subscription check before redirect (or use Stack.Protected)
  paywall.tsx              # Paywall screen (used as both modal and stack)
  manage-subscription.tsx  # Mock subscription management screen
src/
  hooks/
    useSubscriptionStatus.ts  # EXISTING - extend with studentParentSubscription lookup
    useSubscriptionGate.ts    # NEW - combines auth + subscription check for gating
    useMockPurchase.ts        # NEW - mock purchase mutation (Supabase insert)
  constants/
    subscriptionPlans.ts      # NEW - plan definitions, pricing, features, limits
  components/
    subscription/
      PlanCard.tsx            # Vertical plan card component
      BillingToggle.tsx       # Monthly/annual toggle with savings badge
      SubscriptionCard.tsx    # Settings subscription status card
      UpgradeModal.tsx        # "Upgrade to add more students" modal
```

### Pattern 1: Subscription Gate via Root Redirect (Current Pattern Extension)
**What:** Extend the existing `app/index.tsx` redirect logic to check subscription status before routing to dashboard.
**When to use:** This is the primary gate -- happens on every app launch.
**Why this over Stack.Protected:** The existing app already uses `Redirect` in `app/index.tsx` and this pattern is well-understood. Stack.Protected would require restructuring the root layout. Extending the existing pattern is lower risk.
**Example:**
```typescript
// app/index.tsx -- extended with subscription gate
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useSubscriptionStatus } from '../src/hooks/useSubscriptionStatus';
import { useStudentProfile } from '../src/hooks/useStudentProfile';

export default function Index() {
  const { user, loading, userRole } = useAuth();
  const { isActive, isLoading: subLoading, error: subError } = useSubscriptionStatus();
  const { hasCompletedOnboarding, isLoading: profileLoading } = useStudentProfile();

  if (loading || subLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!userRole) {
    return <LoadingSpinner />; // role extraction in progress
  }

  // Subscription gate for parents
  if (userRole === 'parent') {
    if (subError) {
      return <SubscriptionErrorScreen onRetry={refetch} />;
    }
    if (isActive !== true) {
      // isActive is null (no subscription) or false (expired)
      return <Redirect href="/paywall" />;
    }
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // Student: check parent's subscription via relationship
  if (userRole === 'student') {
    // ... student subscription inheritance check
  }
}
```

### Pattern 2: Paywall as Modal + Stack Screen
**What:** Register paywall as a screen in the root Stack with both `presentation: 'modal'` for gating and a separate route for Settings access.
**When to use:** Paywall needs to be accessible from two contexts.
**Example:**
```typescript
// app/_layout.tsx
<Stack>
  {/* existing screens */}
  <Stack.Screen
    name="paywall"
    options={{
      presentation: 'modal',
      headerShown: false,
      gestureEnabled: false, // prevent swipe dismiss when gating
    }}
  />
  <Stack.Screen
    name="manage-subscription"
    options={{
      title: 'Manage Subscription',
    }}
  />
</Stack>
```

### Pattern 3: Mock Purchase via Supabase Direct Insert
**What:** Mock purchase flow writes a real subscription row to Supabase, making the entire subscription pipeline work end-to-end.
**When to use:** Phase 4 mock flow -- replaced with RevenueCat in Phase 5.
**Example:**
```typescript
// src/hooks/useMockPurchase.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionKeys } from './useSubscriptionStatus';

interface MockPurchaseInput {
  plan: 'single' | 'midsize' | 'large';
  billingInterval: 'month' | 'year';
}

export function useMockPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MockPurchaseInput) => {
      // Simulate purchase delay (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Upsert subscription record
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user!.id,
          status: 'trialing',
          subscription_type: input.plan,
          current_period_start: now.toISOString(),
          current_period_end: trialEnd.toISOString(),
          platform: 'apple', // mock as IAP
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate subscription cache so gate re-evaluates
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}
```

### Pattern 4: Student Subscription Inheritance
**What:** Students inherit subscription access from their parent. The student login flow looks up the parent's subscription via `parent_student_relationships`.
**When to use:** When a student user logs in, check their parent's subscription.
**Example:**
```typescript
// Fetch parent's subscription status for a student
async function fetchParentSubscriptionForStudent(studentUserId: string) {
  // Step 1: Find parent via relationship
  const { data: relationship } = await supabase
    .from('parent_student_relationships')
    .select('parent_user_id')
    .eq('student_user_id', studentUserId)
    .limit(1)
    .maybeSingle();

  if (!relationship) return null;

  // Step 2: Check parent's subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', relationship.parent_user_id)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  return subscription;
}
```

### Pattern 5: Subscription Plan Data Constants
**What:** Centralized plan definitions used by paywall, settings, and student limit enforcement.
**When to use:** Everywhere that needs plan info.
**Example:**
```typescript
// src/constants/subscriptionPlans.ts
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
  return (plan.monthlyPrice * 12) - plan.annualPrice;
}

export function getAnnualSavingsPercent(plan: SubscriptionPlan): number {
  return Math.round(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100);
}
```

### Anti-Patterns to Avoid
- **Using AsyncStorage for subscription state:** Subscription status MUST come from Supabase, not local storage. Local-only state cannot be inherited by students, cannot be verified on other devices, and will diverge from the database.
- **Checking subscription on every screen:** Do NOT add subscription checks inside individual tab screens. The single gatekeeper in `app/index.tsx` handles this. Adding scattered checks creates race conditions and inconsistent UX.
- **Hard-coding subscription check inside useAuth:** Subscription status is a separate concern from authentication. Keep `useSubscriptionStatus` separate from `AuthContext` to maintain single responsibility.
- **Showing paywall to students:** Students inherit their parent's subscription. Never show a paywall to a student user -- show an error screen directing them to contact their parent instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subscription status query | Custom fetch function | Existing `useSubscriptionStatus` hook | Already handles active/trialing/canceled states, null vs false distinction, display formatting |
| Student list counting | New query for student count | Existing `useStudentManagement.activeCount` | Already tracks active students, filters inactive |
| Plan name formatting | Inline switch statements | Existing `formatSubscriptionType()` in useSubscriptionStatus | Already maps 'single'->'Standard', 'midsize'->'Premium', 'large'->'Family' |
| Navigation gating | Custom navigation interceptor | Expo Router `Redirect` in index.tsx | Already the pattern used for auth; adding subscription check is 5 lines |
| Loading spinners | Custom animation | React Native `ActivityIndicator` | Already used throughout app with consistent `#4F46E5` color |
| Confirmation dialogs | Custom modal component | React Native `Alert.alert()` | Already used for sign out, delete account, student management |
| Cache invalidation | Manual state management | TanStack React Query `invalidateQueries` | Already handles subscription refetch pattern |

**Key insight:** Phase 4 is primarily a UI phase with minimal new infrastructure. The subscription data layer already exists from Phase 1. The main work is building screens and wiring them into the existing navigation flow.

## Common Pitfalls

### Pitfall 1: Subscription Check Race Condition with Auth Loading
**What goes wrong:** The subscription query fires before the auth user is available, returning null (no subscription) and triggering the paywall flash before the real subscription loads.
**Why it happens:** `useSubscriptionStatus` depends on `user.id` but the auth session might not be restored yet on cold start.
**How to avoid:** Gate on BOTH `loading` (auth) AND `subLoading` (subscription) before making redirect decisions. Show a loading spinner until both resolve.
**Warning signs:** Brief paywall flash on app launch for subscribed users.

### Pitfall 2: Upsert Conflict Column Mismatch
**What goes wrong:** Supabase `upsert` with `onConflict: 'user_id'` fails if `user_id` doesn't have a UNIQUE constraint on the `user_subscriptions` table.
**Why it happens:** The table uses an auto-increment `id` as primary key, and `user_id` may not have a unique index.
**How to avoid:** Check if `user_id` has a unique constraint. If not, use a two-step pattern: query first, then insert or update. Alternatively, add a unique constraint via migration.
**Warning signs:** "duplicate key" errors or "no unique or exclusion constraint" errors from Supabase.

### Pitfall 3: Student Subscription Inheritance Query N+1
**What goes wrong:** Checking a student's parent subscription requires two queries (find parent, then check subscription). If done naively on every render, this creates excessive database calls.
**Why it happens:** The student flow requires a join through `parent_student_relationships` to get to `user_subscriptions`.
**How to avoid:** Use TanStack React Query with a combined query key and appropriate `staleTime` (5 minutes). The two-step query happens once per session, not per render.
**Warning signs:** Excessive Supabase requests in network tab, slow initial load for student users.

### Pitfall 4: Modal Dismiss Bypasses Gate
**What goes wrong:** User dismisses the paywall modal (swipe down or X button) and lands on the dashboard without a subscription.
**Why it happens:** Modal `presentation: 'modal'` allows swipe-to-dismiss by default. If the paywall is shown as a modal from `index.tsx` redirect, dismissing it may navigate to the underlying screen.
**How to avoid:** Two approaches: (1) Set `gestureEnabled: false` on the modal screen to prevent swipe dismiss, and use the X button to navigate back to `index.tsx` which re-evaluates the gate. (2) Use `router.replace('/paywall')` instead of `router.push` so there's no underlying screen to return to.
**Warning signs:** Users can access the app after closing the paywall without purchasing.

### Pitfall 5: Settings Subscription Section for Unsubscribed Users
**What goes wrong:** The Settings screen shows "Manage Subscription" linking to `https://centsiblescholar.com/settings` (Stripe web portal) which is wrong for mobile IAP users and doesn't exist for unsubscribed users.
**Why it happens:** The existing Settings screen was built before subscription gating and assumes all users have Stripe subscriptions.
**How to avoid:** Replace the web URL link with navigation to the in-app `manage-subscription` screen. Conditionally show different content: subscribed users see plan details + manage button; unsubscribed users see a "Subscribe" CTA that navigates to paywall.
**Warning signs:** Users tapping "Manage Subscription" and getting a broken web link or an empty portal.

### Pitfall 6: isActive null vs false Confusion
**What goes wrong:** Code treats `isActive === null` (no subscription record) the same as `isActive === false` (expired subscription) or vice versa, leading to incorrect gate behavior.
**Why it happens:** The existing hook intentionally returns `null` for "no subscription record" vs `false` for "has record but not active." Both should trigger the gate, but error handling may differ.
**How to avoid:** Gate check should be `isActive !== true` (catches both null and false). Only differentiate null vs false for display purposes (e.g., "Subscribe" vs "Resubscribe" copy on paywall).
**Warning signs:** Users with expired subscriptions seeing "no subscription" messaging, or vice versa.

## Code Examples

### Billing Toggle Component
```typescript
// src/components/subscription/BillingToggle.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BillingToggleProps {
  billingInterval: 'month' | 'year';
  onToggle: (interval: 'month' | 'year') => void;
  savingsPercent: number; // e.g., 17 for "Save 17%"
}

export function BillingToggle({ billingInterval, onToggle, savingsPercent }: BillingToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.option, billingInterval === 'month' && styles.optionActive]}
          onPress={() => onToggle('month')}
        >
          <Text style={[styles.optionText, billingInterval === 'month' && styles.optionTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, billingInterval === 'year' && styles.optionActive]}
          onPress={() => onToggle('year')}
        >
          <Text style={[styles.optionText, billingInterval === 'year' && styles.optionTextActive]}>
            Annual
          </Text>
          {savingsPercent > 0 && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save {savingsPercent}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### Plan Card Component
```typescript
// src/components/subscription/PlanCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SubscriptionPlan } from '../../constants/subscriptionPlans';

interface PlanCardProps {
  plan: SubscriptionPlan;
  billingInterval: 'month' | 'year';
  onSelect: () => void;
  isCurrentPlan?: boolean;
}

export function PlanCard({ plan, billingInterval, onSelect, isCurrentPlan }: PlanCardProps) {
  const price = billingInterval === 'month' ? plan.monthlyPrice : plan.annualPrice;
  const period = billingInterval === 'month' ? '/mo' : '/yr';

  return (
    <View style={[styles.card, plan.badge && styles.cardHighlighted]}>
      {plan.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      )}
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.description}>{plan.description}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>${price.toFixed(2)}</Text>
        <Text style={styles.period}>{period}</Text>
      </View>
      <Text style={styles.studentLimit}>
        {plan.studentLimit === 1 ? '1 student' : `Up to ${plan.studentLimit} students`}
      </Text>
      <Text style={styles.featureCount}>{plan.features.length} features included</Text>
      <TouchableOpacity
        style={[styles.selectButton, isCurrentPlan && styles.currentButton]}
        onPress={onSelect}
        disabled={isCurrentPlan}
      >
        <Text style={[styles.selectButtonText, isCurrentPlan && styles.currentButtonText]}>
          {isCurrentPlan ? 'Current Plan' : 'Start Free Trial'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Student Limit Enforcement in Student Management
```typescript
// Integration point in student-management.tsx handleAddStudent
import { useSubscriptionStatus } from '../src/hooks/useSubscriptionStatus';
import { getStudentLimit, SUBSCRIPTION_PLANS } from '../src/constants/subscriptionPlans';

// Inside the component:
const { tier } = useSubscriptionStatus();
const { activeCount } = useStudentManagement();
const studentLimit = getStudentLimit(tier);

const handleAddStudent = () => {
  if (activeCount >= studentLimit) {
    Alert.alert(
      'Student Limit Reached',
      `Your ${formatSubscriptionType(tier)} plan allows ${studentLimit} student${studentLimit !== 1 ? 's' : ''}. Upgrade your plan to add more students.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade Plan',
          onPress: () => router.push('/paywall'),
        },
      ]
    );
    return;
  }
  // ... existing add student flow
};
```

### Mock Restore Purchases
```typescript
// Mock restore purchases function
async function mockRestorePurchases(userId: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Check if user has any subscription record
  const { data } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  return !!data; // true if found, false if not
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual redirects in layout | `Stack.Protected` guard pattern | Expo Router SDK 53 (2025) | Declarative route protection, handles deep links automatically |
| `Redirect` component in index.tsx | Both work, `Redirect` is still valid | SDK 53+ | `Stack.Protected` is newer but more complex; manual redirect is simpler for this use case |
| Linking.openURL for subscription management | In-app subscription management screen | Phase 4 | Replace web links with native mock screens |
| Stripe-only subscription model | Platform-agnostic (Stripe + Apple + Google) | Phase 1 migration | `useSubscriptionStatus` already supports platform field |

**Deprecated/outdated:**
- `handleManageSubscription` in settings.tsx currently links to `https://centsiblescholar.com/settings` -- this MUST be replaced with in-app navigation for Phase 4
- The success criteria mention "platform-native subscription management screen" but Phase 4 uses a mock screen; the actual `Linking.openURL` to App Store subscription management is Phase 5

## Open Questions

1. **Upsert unique constraint on user_id**
   - What we know: The `user_subscriptions` table has `id` (auto-increment) as primary key. `user_id` references auth.users.
   - What's unclear: Whether `user_id` has a UNIQUE constraint. If not, `upsert` with `onConflict: 'user_id'` will fail.
   - Recommendation: Check the table DDL. If no unique constraint, either add one via migration OR use a two-step query-then-insert/update pattern. The two-step pattern is safer and avoids migration dependency.

2. **Subscription history/transaction list (Claude's Discretion)**
   - What we know: The user left this to our discretion.
   - Recommendation: DEFER to Phase 5. Mock purchase creates a single subscription record. Transaction history adds complexity without testing value. Phase 5 (RevenueCat) will provide real transaction history via their SDK.

3. **Mock data structure for testing different states (Claude's Discretion)**
   - Recommendation: Build a dev-only "Subscription Debug" section at the bottom of the manage-subscription screen. It should have buttons like "Set to Active", "Set to Trialing", "Set to Canceled", "Delete Subscription" that directly modify the Supabase row. This enables testing all gate states without re-running mock purchase. Only show this in `__DEV__` mode.

4. **Web-to-mobile subscription inheritance**
   - What we know: Some users may have Stripe subscriptions from the web app. The gate should recognize those as valid.
   - What's unclear: Whether web Stripe subscriptions are already in `user_subscriptions` for the same `user_id`.
   - Recommendation: The existing `useSubscriptionStatus` hook already queries by `user_id` regardless of `platform`. This works -- Stripe and IAP subscriptions both use the same table. No special handling needed.

## Sources

### Primary (HIGH confidence)
- Expo Router v6 official docs: modals, authentication, protected routes -- fetched from docs.expo.dev
- Existing codebase: `useSubscriptionStatus.ts`, `app/index.tsx`, `app/_layout.tsx`, `app/(tabs)/settings.tsx`, `useStudentManagement.ts`, `useParentStudents.ts`
- Web app reference: `PricingSection.tsx`, `useStripePrices.tsx` (plan names, pricing, features)
- Supabase migration: `20260205_add_iap_subscription_columns.sql` (table schema)
- Supabase types: `src/integrations/supabase/types.ts` (user_subscriptions, parent_student_relationships)

### Secondary (MEDIUM confidence)
- Expo Router blog: Stack.Protected pattern for auth/role-based routing
- RevenueCat docs: Expo Go mock mode for development (validates that mock approach is standard)
- Paywall design best practices: multiple sources agree on vertical cards, billing toggle, savings badge, trial disclosure, trust signals

### Tertiary (LOW confidence)
- Exact RevenueCat Expo Go mock behavior (not relevant to Phase 4 since we build custom mock, but validates the mock-first approach)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed; all tools already installed and in use
- Architecture: HIGH - extends existing patterns (Redirect in index.tsx, TanStack React Query hooks, Supabase client, Expo Router Stack screens)
- Pitfalls: HIGH - identified from reading actual codebase (isActive null/false, modal dismiss, Settings web link, upsert conflict)
- Paywall UI: MEDIUM - design patterns from web app reference + best practices research; exact implementation is custom
- Pricing data: HIGH - extracted directly from web app's `useStripePrices.tsx` (9.99/12.99/15.99 monthly; 99.99/129.99/159.99 annual)
- Student inheritance: HIGH - relationship table structure confirmed from both web and mobile codebases

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable -- no external library changes expected; all internal)
