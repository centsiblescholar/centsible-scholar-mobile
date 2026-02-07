# Phase 5: IAP Wiring - Research

**Researched:** 2026-02-06
**Domain:** RevenueCat IAP integration, EAS builds, webhook-to-Supabase sync
**Confidence:** HIGH

## Summary

Phase 5 replaces the Phase 4 mock purchase system with real in-app purchases via RevenueCat. The integration involves four domains: (1) RevenueCat SDK initialization and purchase flow in the mobile app, (2) a Supabase Edge Function webhook handler that receives RevenueCat events and syncs subscription state to the `user_subscriptions` table, (3) EAS build configuration for development/preview/production builds with New Architecture enabled, and (4) a polling mechanism that waits for webhook confirmation before unlocking features.

The existing codebase provides strong foundations: `useSubscriptionStatus` already reads from `user_subscriptions`, `useSubscriptionGate` handles both parent and student flows, the paywall UI is fully built, and the `user_subscriptions` table already has IAP columns (`platform`, `iap_product_id`, `iap_original_transaction_id`, `revenucat_customer_id`). The web app's `stripe-webhook` edge function provides a proven pattern for idempotent webhook processing with the existing `webhook_events` table.

The key architectural decision from CONTEXT.md is that Supabase remains the source of truth. RevenueCat handles purchases and sends webhooks; the app polls Supabase (not RevenueCat) to confirm subscription status. This means the purchase hook replaces `useMockPurchase` but the downstream reading hooks (`useSubscriptionStatus`, `useSubscriptionGate`) remain unchanged.

**Primary recommendation:** Install `react-native-purchases`, configure it with Supabase user IDs via `Purchases.logIn()`, create a `revenuecat-webhook` Supabase Edge Function mirroring the existing `stripe-webhook` patterns, and use a 2-second polling interval with 60-second timeout to wait for webhook confirmation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-purchases | ^9.7.6 | RevenueCat SDK for iOS/Android IAP | Official RevenueCat SDK; handles StoreKit + Play Billing; built-in Expo Go preview mode |
| expo-dev-client | (latest for SDK 54) | Development build client for native module testing | Required to test real IAP; Expo Go cannot run native purchase code |
| Supabase Edge Function (Deno) | N/A | Webhook handler for RevenueCat events | Mirrors existing stripe-webhook pattern; same infra as web app |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.90.11 | Polling for webhook confirmation, cache invalidation | Poll `user_subscriptions` after purchase until webhook updates it |
| @supabase/supabase-js | ^2.86.0 | Database reads for subscription status | Unchanged from Phase 4; source of truth for subscription state |
| expo (EAS CLI) | ~54.0.25 | Building native dev/preview/production builds | `eas build` with profile configuration |

### Not Needed
| Library | Why Not |
|---------|---------|
| react-native-purchases-ui | Project already has a custom paywall from Phase 4; RevenueCat's paywall UI is unnecessary |
| expo-iap | Lower-level than RevenueCat; no webhook/backend infrastructure; CONTEXT.md specifies RevenueCat |
| react-native-iap | Same as above; RevenueCat wraps this with better infrastructure |

**Installation:**
```bash
npx expo install react-native-purchases expo-dev-client
```

Note: `react-native-purchases-ui` is NOT needed since the custom paywall already exists.

## Architecture Patterns

### Recommended Project Structure
```
app/
  _layout.tsx              # Add RevenueCat SDK initialization
  paywall.tsx              # Replace useMockPurchase with useRevenueCatPurchase
src/
  hooks/
    useRevenueCatPurchase.ts  # NEW - replaces useMockPurchase (same interface)
    usePurchasePolling.ts     # NEW - polls Supabase for webhook confirmation
    useSubscriptionStatus.ts  # UNCHANGED - reads from Supabase
    useSubscriptionGate.ts    # UNCHANGED - reads from Supabase
    useMockPurchase.ts        # KEEP for __DEV__ fallback (optional)
  providers/
    RevenueCatProvider.tsx    # NEW - SDK init, user identification, listener
  constants/
    subscriptionPlans.ts      # ADD productId fields for Apple/Google product IDs
    revenuecatConfig.ts       # NEW - API keys, entitlement IDs, polling config
supabase/
  functions/
    revenuecat-webhook/
      index.ts                # NEW - webhook handler (mirrors stripe-webhook)
  config.toml                 # NEW - disable JWT verification for webhook endpoint
eas.json                      # UPDATE - ensure development profile has device build
```

### Pattern 1: RevenueCat SDK Initialization via Provider
**What:** Initialize RevenueCat once at app startup, identify users when they log in, and listen for subscription changes.
**When to use:** Always -- this is the foundation of the integration.
**Example:**
```typescript
// src/providers/RevenueCatProvider.tsx
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { useAuth } from '../contexts/AuthContext';

const REVENUECAT_API_KEYS = {
  ios: 'appl_YOUR_IOS_API_KEY',     // from RevenueCat dashboard
  android: 'goog_YOUR_ANDROID_KEY', // from RevenueCat dashboard
};

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isConfigured = useRef(false);

  // Configure SDK once on mount
  useEffect(() => {
    if (isConfigured.current) return;

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEYS.ios
      : REVENUECAT_API_KEYS.android;

    Purchases.configure({ apiKey });
    isConfigured.current = true;
  }, []);

  // Identify user when auth state changes
  useEffect(() => {
    if (!isConfigured.current) return;

    if (user) {
      // Use Supabase user ID as RevenueCat app_user_id
      Purchases.logIn(user.id);
    } else {
      Purchases.logOut();
    }
  }, [user?.id]);

  return <>{children}</>;
}
```

### Pattern 2: Purchase Flow with Webhook Polling
**What:** After RevenueCat purchase succeeds, poll Supabase until the webhook updates the subscription record. Do NOT optimistically unlock features.
**When to use:** This is the core purchase flow that replaces `useMockPurchase`.
**Example:**
```typescript
// src/hooks/useRevenueCatPurchase.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Purchases from 'react-native-purchases';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionKeys } from './useSubscriptionStatus';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

export interface PurchaseInput {
  plan: 'single' | 'midsize' | 'large';
  billingInterval: 'month' | 'year';
}

async function pollForWebhookConfirmation(userId: string): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('status, platform')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .in('platform', ['apple', 'google'])
      .maybeSingle();

    if (data) return true;

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return false; // Timeout
}

export function useRevenueCatPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: PurchaseInput) => {
      if (!user) throw new Error('User must be authenticated');

      // 1. Get offerings from RevenueCat
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) throw new Error('No offerings available');

      // 2. Find the correct package
      const packageId = getPackageIdentifier(input.plan, input.billingInterval);
      const pkg = offerings.current.availablePackages.find(
        p => p.identifier === packageId
      );
      if (!pkg) throw new Error(`Package not found: ${packageId}`);

      // 3. Make the purchase via RevenueCat
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        // Purchase succeeded on store side
      } catch (error: any) {
        if (error.userCancelled) {
          throw new Error('Purchase cancelled');
        }
        throw error;
      }

      // 4. Poll Supabase for webhook confirmation
      const confirmed = await pollForWebhookConfirmation(user.id);
      if (!confirmed) {
        throw new Error('PURCHASE_PENDING');
      }

      return { confirmed: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });

  return {
    purchase: mutation.mutateAsync,
    isPurchasing: mutation.isPending,
    purchaseError: mutation.error,
  };
}
```

### Pattern 3: Webhook Handler Mirroring Stripe Webhook
**What:** A Supabase Edge Function that receives RevenueCat webhook events and updates `user_subscriptions`, using the same idempotency and error handling patterns as the existing `stripe-webhook`.
**When to use:** This runs server-side, triggered by RevenueCat.
**Key patterns from existing stripe-webhook to mirror:**
1. Idempotency via `webhook_events` table (check before processing, record after)
2. Authorization header verification (RevenueCat sends a configurable Bearer token)
3. Two-step subscription update: query existing record first, then insert or update
4. Return 200 for non-transient errors to prevent infinite retries
5. Structured logging with `[REVENUECAT-WEBHOOK]` prefix

**Example:**
```typescript
// supabase/functions/revenuecat-webhook/index.ts
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const WEBHOOK_AUTH_KEY = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY')!;

serve(async (request) => {
  const startTime = Date.now();

  // 1. Verify authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${WEBHOOK_AUTH_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Parse payload
  const payload = await request.json();
  const event = payload.event;
  const eventId = event.id;
  const eventType = event.type;

  // 3. Initialize Supabase admin client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  // 4. Idempotency check (same pattern as stripe-webhook)
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ received: true, already_processed: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  // 5. Process event by type
  try {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
        await handleSubscriptionActive(supabaseAdmin, event);
        break;
      case 'CANCELLATION':
        await handleCancellation(supabaseAdmin, event);
        break;
      case 'EXPIRATION':
        await handleExpiration(supabaseAdmin, event);
        break;
      case 'BILLING_ISSUE':
        await handleBillingIssue(supabaseAdmin, event);
        break;
      case 'TEST':
        // Log only
        break;
      default:
        // Unknown event type -- log but don't fail
        break;
    }

    // 6. Record for idempotency (same pattern as stripe-webhook)
    await supabaseAdmin.from('webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      processing_time_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Return 200 to prevent retries for non-transient errors
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### Pattern 4: Product ID Mapping in subscriptionPlans.ts
**What:** Add Apple/Google product identifiers and RevenueCat package identifiers to the existing plan constants.
**When to use:** Maps between app-side plan selection and store products.
**Example:**
```typescript
// src/constants/subscriptionPlans.ts (additions)
export interface SubscriptionPlan {
  id: 'single' | 'midsize' | 'large';
  name: string;
  // ... existing fields ...
  // NEW: product IDs for app stores
  appleProductIds: {
    monthly: string;
    annual: string;
  };
  googleProductIds: {
    monthly: string;
    annual: string;
  };
  // NEW: RevenueCat package identifiers
  rcPackageIds: {
    monthly: string;
    annual: string;
  };
}
```

### Pattern 5: Restore Purchases via RevenueCat
**What:** Replace the mock restore with RevenueCat's `restorePurchases()`, then poll Supabase for confirmation.
**When to use:** "Restore Purchases" button on paywall.
**Example:**
```typescript
async function handleRestore() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    // After restore, RevenueCat sends webhook if there's an active entitlement
    // Poll Supabase to confirm
    const confirmed = await pollForWebhookConfirmation(user.id);
    if (confirmed) {
      Alert.alert('Restored!', 'Your subscription has been restored.');
      router.replace('/');
    } else {
      Alert.alert('No Purchases Found', 'No active subscription was found.');
    }
  } catch (error) {
    Alert.alert('Error', 'Unable to restore purchases. Please try again.');
  }
}
```

### Anti-Patterns to Avoid
- **Checking RevenueCat entitlements directly for gating:** CONTEXT.md explicitly says Supabase is the source of truth. Never call `Purchases.getCustomerInfo()` to gate features. Always read from `user_subscriptions` table.
- **Optimistic unlocking after purchase:** Do NOT unlock features after `purchasePackage()` succeeds. Wait for the webhook to update Supabase. The purchase might be in a pending state (e.g., family approval, bank authorization).
- **Calling `Purchases.configure()` multiple times:** Configure once at app start. Use `logIn()`/`logOut()` for user identification changes.
- **Using anonymous RevenueCat IDs:** Always pass the Supabase `user.id` to `Purchases.logIn()` so webhook events can be mapped back to the correct user.
- **Configuring with `appUserID` in `configure()`:** Use `configure({ apiKey })` without `appUserID`, then call `logIn()` after auth. This handles the case where the user is not authenticated when the app starts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Store receipt validation | Custom receipt verification | RevenueCat handles validation | Apple/Google receipt formats change frequently; RevenueCat abstracts this |
| Subscription status sync | Direct StoreKit/Play Billing queries | RevenueCat webhooks | RevenueCat normalizes events across stores into a single format |
| Idempotent webhook processing | Custom deduplication logic | Existing `webhook_events` table pattern | Already proven in stripe-webhook; same table and pattern works |
| Product price fetching | Manual StoreKit/Play Billing API | `Purchases.getOfferings()` | RevenueCat returns localized prices in user's currency |
| Subscription lifecycle management | Custom renewal/cancellation tracking | RevenueCat event types | RevenueCat sends typed events (RENEWAL, CANCELLATION, EXPIRATION, etc.) |
| Build configuration for IAP | Manual Xcode/Gradle configuration | EAS build profiles with `expo-dev-client` | EAS handles native project generation and signing |

**Key insight:** RevenueCat abstracts the two most complex parts of IAP: store-specific billing APIs and cross-platform subscription lifecycle management. The app-side code only needs to call `purchasePackage()` and the server-side code only needs to handle webhook events.

## Common Pitfalls

### Pitfall 1: Testing Purchases in Expo Go
**What goes wrong:** Developer tries to test real purchases in Expo Go, which cannot run native IAP code.
**Why it happens:** Expo Go does not include the native modules required for StoreKit or Play Billing. `react-native-purchases` automatically falls into "Preview API Mode" in Expo Go, which mocks all native calls.
**How to avoid:** Always test real purchases in an EAS development build (built with `developmentClient: true`). Expo Go is only suitable for UI development.
**Warning signs:** `Purchases.getOfferings()` returns empty packages, purchases silently succeed without store prompts.

### Pitfall 2: Webhook Not Updating Supabase (User Locked Out)
**What goes wrong:** Purchase succeeds on Apple/Google side but the webhook never fires or fails to update Supabase, leaving the user stuck on the paywall.
**Why it happens:** Network issues, webhook misconfiguration, edge function errors, or the edge function returning non-200 status (triggering RevenueCat retries with 5/10/20/40/80 minute delays).
**How to avoid:** (1) Always return HTTP 200 from the edge function even for processing errors. (2) Implement a 60-second polling timeout with a user-friendly "Purchase pending, check back later" message. (3) On timeout, invalidate the subscription cache so the next app foreground will re-check.
**Warning signs:** Users reporting "I paid but can't access the app."

### Pitfall 3: RevenueCat `app_user_id` Mismatch
**What goes wrong:** Webhook sends `app_user_id` but it doesn't match the Supabase `user_id`, so the edge function cannot find the user record to update.
**Why it happens:** If `Purchases.logIn()` is not called with the Supabase `user.id`, RevenueCat generates an anonymous ID (prefixed `$RCAnonymousID:`), which the webhook will send as `app_user_id`.
**How to avoid:** Always call `Purchases.logIn(user.id)` immediately after Supabase auth confirms the user. Verify in RevenueCat dashboard that customers show Supabase UUIDs, not anonymous IDs.
**Warning signs:** Webhook events contain `$RCAnonymousID:` prefix in `app_user_id`.

### Pitfall 4: Duplicate Subscription Records
**What goes wrong:** Multiple webhook events (e.g., INITIAL_PURCHASE followed by RENEWAL) create duplicate rows in `user_subscriptions` instead of updating the existing row.
**Why it happens:** The webhook handler uses insert instead of the two-step query-then-upsert pattern.
**How to avoid:** Mirror the stripe-webhook pattern: query existing record by `user_id` first, then update if exists or insert if new. The existing `useMockPurchase` and `stripe-webhook` both use this pattern.
**Warning signs:** Multiple rows per user in `user_subscriptions`, subscription gate behaving inconsistently.

### Pitfall 5: EAS Development Build Missing Simulator Flag
**What goes wrong:** `eas build --profile development` produces a build that won't install on the iOS simulator.
**Why it happens:** The development profile in `eas.json` has `"simulator": true` but this only builds for simulator. Real device testing requires `"simulator": false` and signing with a development provisioning profile. You need separate configurations.
**How to avoid:** Keep the existing `"simulator": true` for development profile (used during regular development), and use the `preview` profile (which has `"simulator": false`) for physical device IAP testing. IAP ONLY works on physical devices.
**Warning signs:** "App not available for this device" when trying to install on physical device.

### Pitfall 6: Edge Function JWT Verification Blocking Webhooks
**What goes wrong:** RevenueCat webhook calls to the Supabase Edge Function are rejected with 401 because the function requires JWT authentication by default.
**Why it happens:** Supabase Edge Functions require a valid JWT in the Authorization header by default. RevenueCat sends its own authorization header (Bearer token), not a Supabase JWT.
**How to avoid:** Create a `supabase/config.toml` with `[functions.revenuecat-webhook]` and `verify_jwt = false`. Then implement custom authorization header validation in the function itself.
**Warning signs:** RevenueCat dashboard shows webhook failures with 401 status.

### Pitfall 7: Web Subscriber Purchasing Mobile IAP
**What goes wrong:** A user with an existing Stripe subscription from the web app purchases a mobile IAP, resulting in double billing.
**Why it happens:** The paywall doesn't check for existing web subscriptions before showing purchase options.
**How to avoid:** Before showing the paywall, check `useSubscriptionStatus().platform`. If `platform === 'stripe'` and status is active/trialing, show "Already subscribed via web" message instead of purchase buttons. The existing `useSubscriptionStatus` hook already returns the `platform` field.
**Warning signs:** Users with both Stripe and IAP subscriptions in `user_subscriptions`.

## Code Examples

### RevenueCat Event to Supabase Subscription Mapping
```typescript
// supabase/functions/revenuecat-webhook/index.ts
// Maps RevenueCat event types to user_subscriptions updates

function mapProductToSubscriptionType(productId: string): string {
  // Map Apple/Google product IDs to subscription types
  const mapping: Record<string, string> = {
    'com.centsiblescholar.single.monthly': 'single',
    'com.centsiblescholar.single.annual': 'single',
    'com.centsiblescholar.midsize.monthly': 'midsize',
    'com.centsiblescholar.midsize.annual': 'midsize',
    'com.centsiblescholar.large.monthly': 'large',
    'com.centsiblescholar.large.annual': 'large',
  };
  return mapping[productId] || 'single';
}

function mapStoreToPlatform(store: string): 'apple' | 'google' {
  return store === 'PLAY_STORE' ? 'google' : 'apple';
}

async function handleSubscriptionActive(supabaseAdmin: any, event: any) {
  const userId = event.app_user_id;
  const productId = event.product_id;
  const subscriptionType = mapProductToSubscriptionType(productId);
  const platform = mapStoreToPlatform(event.store);

  const subscriptionData = {
    user_id: userId,
    status: event.period_type === 'TRIAL' ? 'trialing' : 'active',
    subscription_type: subscriptionType,
    platform,
    iap_product_id: productId,
    iap_original_transaction_id: event.original_transaction_id,
    revenucat_customer_id: event.app_user_id,
    current_period_start: event.purchased_at_ms
      ? new Date(event.purchased_at_ms).toISOString()
      : null,
    current_period_end: event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  // Two-step pattern (mirrors stripe-webhook)
  const { data: existing } = await supabaseAdmin
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('user_subscriptions')
      .update(subscriptionData)
      .eq('user_id', userId);
  } else {
    await supabaseAdmin
      .from('user_subscriptions')
      .insert(subscriptionData);
  }
}

async function handleCancellation(supabaseAdmin: any, event: any) {
  const userId = event.app_user_id;
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('platform', ['apple', 'google']);
}

async function handleExpiration(supabaseAdmin: any, event: any) {
  const userId = event.app_user_id;
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('platform', ['apple', 'google']);
}

async function handleBillingIssue(supabaseAdmin: any, event: any) {
  const userId = event.app_user_id;
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('platform', ['apple', 'google']);
}
```

### Supabase config.toml for Webhook Endpoint
```toml
# supabase/config.toml
# Disable JWT verification for webhook endpoint (external callers)
[functions.revenuecat-webhook]
verify_jwt = false
```

### EAS Build Profiles (Updated eas.json)
```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "development:device": {
      "extends": "development",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```
Note: A `development:device` profile is recommended for physical device development builds (needed for IAP sandbox testing). The existing `development` profile targets simulator only.

### RevenueCat Configuration Constants
```typescript
// src/constants/revenuecatConfig.ts
import { Platform } from 'react-native';

export const REVENUECAT_CONFIG = {
  apiKeys: {
    ios: 'appl_REPLACE_WITH_REAL_KEY',
    android: 'goog_REPLACE_WITH_REAL_KEY',
  },
  entitlementId: 'premium',  // configured in RevenueCat dashboard
  // Polling configuration for webhook wait
  polling: {
    intervalMs: 2000,  // 2 seconds between polls
    timeoutMs: 60000,  // 60 seconds total timeout
  },
} as const;

export function getRevenueCatApiKey(): string {
  return Platform.OS === 'ios'
    ? REVENUECAT_CONFIG.apiKeys.ios
    : REVENUECAT_CONFIG.apiKeys.android;
}
```

### Product ID Convention
```
Apple App Store / Google Play product IDs:
  com.centsiblescholar.single.monthly
  com.centsiblescholar.single.annual
  com.centsiblescholar.midsize.monthly
  com.centsiblescholar.midsize.annual
  com.centsiblescholar.large.monthly
  com.centsiblescholar.large.annual

RevenueCat offering: "default"
RevenueCat entitlement: "premium" (shared across all plan tiers)
```

## RevenueCat Webhook Event Reference

### Events to Handle (Mapped to Stripe Equivalents)

| RevenueCat Event | Stripe Equivalent | Supabase Action |
|------------------|-------------------|-----------------|
| `INITIAL_PURCHASE` | `checkout.session.completed` | Insert/update subscription as 'active' or 'trialing' |
| `RENEWAL` | `invoice.paid` | Update subscription as 'active', extend period |
| `CANCELLATION` | `customer.subscription.updated` (cancel) | Update status to 'canceled' |
| `EXPIRATION` | `customer.subscription.deleted` | Update status to 'expired' |
| `BILLING_ISSUE` | `invoice.payment_failed` | Update status to 'past_due' |
| `UNCANCELLATION` | N/A | Update status back to 'active' |
| `PRODUCT_CHANGE` | N/A | Update subscription_type |

### Events to Log But Not Act On
| Event | Reason |
|-------|--------|
| `TEST` | Dashboard testing only |
| `SUBSCRIPTION_PAUSED` | Not used for this app |
| `TRANSFER` | Edge case; log for debugging |
| `TEMPORARY_ENTITLEMENT_GRANT` | Store validation issue; don't persist |

### Webhook Payload Key Fields
```
event.app_user_id          -> maps to user_subscriptions.user_id (Supabase UUID)
event.product_id           -> maps to user_subscriptions.iap_product_id
event.original_transaction_id -> maps to user_subscriptions.iap_original_transaction_id
event.store                -> maps to user_subscriptions.platform ('APP_STORE'->'apple', 'PLAY_STORE'->'google')
event.period_type          -> 'TRIAL' means trialing, 'NORMAL' means active
event.purchased_at_ms      -> maps to user_subscriptions.current_period_start
event.expiration_at_ms     -> maps to user_subscriptions.current_period_end
event.id                   -> used for idempotency check in webhook_events table
event.environment          -> 'SANDBOX' or 'PRODUCTION' (filter sandbox in production)
event.cancel_reason        -> 'UNSUBSCRIBE', 'BILLING_ERROR', 'CUSTOMER_SUPPORT', etc.
```

### Webhook Retry Behavior
- RevenueCat retries failed webhooks up to 5 times
- Delays: 5, 10, 20, 40, and 80 minutes between retries
- After 5 failures, notifications stop
- Edge function MUST return HTTP 200 even for processing errors to prevent unwanted retries
- Manual retry available via RevenueCat dashboard

## EAS Build Configuration

### Build Profile Purposes
| Profile | Purpose | IAP Testing | Distribution |
|---------|---------|-------------|--------------|
| `development` | Daily development on simulator | No (mock only) | Internal |
| `development:device` | Physical device dev builds | Yes (sandbox) | Internal |
| `preview` | TestFlight / internal testing | Yes (sandbox) | Internal |
| `production` | App Store / Play Store release | Yes (real purchases) | Store |

### IAP Testing Requirements
1. **Physical device required:** StoreKit sandbox does NOT work on iOS Simulator
2. **Apple Sandbox Account:** Configure in App Store Connect > Users and Access > Sandbox Testers
3. **Google Play test track:** Upload to internal testing track, add tester accounts
4. **RevenueCat sandbox:** Set API key to the test environment during development; switch to production for release

### New Architecture
The project already has `"newArchEnabled": true` in `app.json`. Expo SDK 54 runs ~83% of projects on New Architecture. This is correct and should remain enabled. No additional configuration needed for EAS builds.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo-in-app-purchases` | `react-native-purchases` (RevenueCat) | 2023+ | RevenueCat is the de facto standard for managed IAP |
| Manual StoreKit / Play Billing | RevenueCat SDK abstracts both | Ongoing | Single API for both platforms |
| Optimistic unlock after purchase | Poll backend for confirmation | Industry best practice | Prevents desync between payment provider and app database |
| React Native Old Architecture | New Architecture (Fabric) | SDK 54 (2025) | Mandatory in SDK 55+; already enabled in this project |
| `expo-dev-client` as separate install | Bundled with expo SDK 54 | 2025 | May not need explicit install; verify during implementation |

**Deprecated/outdated:**
- `expo-in-app-purchases`: Deprecated in favor of community solutions like `react-native-purchases`
- `Purchases.identify()`: Replaced by `Purchases.logIn()` in RevenueCat SDK 4+
- `react-native-purchases` < 8.0: Major API changes in v8/v9; use v9.x

## Open Questions

1. **RevenueCat Dashboard Product Configuration**
   - What we know: Products must be configured in RevenueCat dashboard with offerings and entitlements before SDK can fetch them
   - What's unclear: Exact product IDs may differ from convention once configured in App Store Connect / Google Play Console
   - Recommendation: Use the convention `com.centsiblescholar.{tier}.{interval}` and adjust during implementation if store requires different format

2. **RevenueCat API Keys**
   - What we know: Need separate iOS and Android API keys from RevenueCat dashboard
   - What's unclear: Whether the developer has created a RevenueCat project yet
   - Recommendation: Plan should include a task for RevenueCat dashboard setup (project creation, product configuration, webhook URL setup, API key retrieval)

3. **Webhook Auth Key Storage**
   - What we know: RevenueCat sends a configurable Bearer token in the Authorization header
   - What's unclear: Best approach for storing this in Supabase -- `supabase secrets set` is the standard for edge function secrets
   - Recommendation: Use `supabase secrets set REVENUECAT_WEBHOOK_AUTH_KEY=your_key` matching how STRIPE_WEBHOOK_SIGNING_SECRET is stored

4. **Expo Go Fallback Behavior**
   - What we know: react-native-purchases auto-detects Expo Go and enters Preview API Mode with mock responses
   - What's unclear: Whether the existing mock purchase system should be kept as a `__DEV__` fallback or if Preview API Mode is sufficient
   - Recommendation: Keep `useMockPurchase` but only use it when `__DEV__` is true AND native modules are unavailable (Expo Go). In development builds, use the real RevenueCat flow with sandbox accounts.

5. **Supabase Edge Function Deployment Location**
   - What we know: The web app's edge functions live in `centsible-scholar-premium/supabase/functions/`. The mobile repo has no edge functions yet.
   - What's unclear: Whether the mobile webhook function should be deployed to the same Supabase project (shared backend) or a separate one
   - Recommendation: Deploy to the same Supabase project since both apps share the same `user_subscriptions` table. The function can live in this mobile repo for code organization but deploy to the shared Supabase instance.

## Sources

### Primary (HIGH confidence)
- RevenueCat Expo installation docs: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat webhook event types and fields: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
- RevenueCat webhook sample events: https://www.revenuecat.com/docs/integrations/webhooks/sample-events
- RevenueCat webhook event flows: https://www.revenuecat.com/docs/integrations/webhooks/event-flows
- RevenueCat SDK quickstart: https://www.revenuecat.com/docs/getting-started/quickstart
- RevenueCat displaying products: https://www.revenuecat.com/docs/getting-started/displaying-products
- RevenueCat making purchases: https://www.revenuecat.com/docs/getting-started/making-purchases
- RevenueCat identifying customers: https://www.revenuecat.com/docs/customers/identifying-customers
- RevenueCat configuring SDK: https://www.revenuecat.com/docs/getting-started/configuring-sdk
- Supabase Edge Functions configuration: https://supabase.com/docs/guides/functions/function-configuration
- Expo in-app purchases guide: https://docs.expo.dev/guides/in-app-purchases/
- EAS build configuration: https://docs.expo.dev/build/eas-json/
- Existing codebase: `stripe-webhook/index.ts`, `useMockPurchase.ts`, `useSubscriptionStatus.ts`, `useSubscriptionGate.ts`, `subscriptionPlans.ts`, `eas.json`, `app.json`

### Secondary (MEDIUM confidence)
- react-native-purchases npm: v9.7.6 latest (published 2025-02-03) -- https://github.com/RevenueCat/react-native-purchases/releases
- RevenueCat Expo blog tutorial: https://www.revenuecat.com/blog/engineering/expo-in-app-purchase-tutorial/
- Expo + RevenueCat blog: https://expo.dev/blog/expo-revenuecat-in-app-purchase-tutorial
- Supabase webhook authentication discussion: https://github.com/orgs/supabase/discussions/14115

### Tertiary (LOW confidence)
- RevenueCat community: Expo Go preview mode behavior, IAP simulator limitations -- https://community.revenuecat.com/
- React Native New Architecture status: ~83% adoption in SDK 54 EAS builds -- from web search results

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - RevenueCat is the documented standard for Expo IAP; official docs verified
- Architecture patterns: HIGH - webhook handler pattern directly mirrors existing proven stripe-webhook code
- Webhook event mapping: HIGH - verified from official RevenueCat event types/fields documentation with sample payloads
- EAS build configuration: HIGH - existing eas.json already has correct profile structure; minor additions needed
- Polling mechanism: MEDIUM - standard pattern but exact timing (2s interval, 60s timeout) is a recommendation, not verified from a specific source
- Product ID convention: LOW - convention is standard but actual IDs depend on App Store Connect / Play Console configuration

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (RevenueCat SDK is mature and stable; webhook format is versioned at 1.0)
