---
phase: 05-iap-wiring
verified: 2026-02-06T18:30:00Z
status: gaps_found
score: 0/4 success criteria verified
gaps:
  - truth: "User can select a subscription plan on the paywall and complete a real purchase through Apple StoreKit or Google Play Billing"
    status: failed
    reason: "RevenueCat SDK will fail to initialize with placeholder API keys; cannot make real purchases"
    artifacts:
      - path: "src/constants/revenuecatConfig.ts"
        issue: "API keys are placeholders ('appl_REPLACE_WITH_REAL_KEY', 'goog_REPLACE_WITH_REAL_KEY')"
      - path: "RevenueCat Dashboard"
        issue: "No evidence of product configuration or offerings setup"
    missing:
      - "Real RevenueCat iOS API key (appl_...)"
      - "Real RevenueCat Android API key (goog_...)"
      - "RevenueCat dashboard: 6 products matching com.centsiblescholar.{tier}.{interval}"
      - "RevenueCat dashboard: 'default' offering with 6 packages"
      - "RevenueCat dashboard: 'premium' entitlement assigned to all products"
  
  - truth: "After purchase completes, the app immediately unlocks premium features without requiring a restart or manual refresh"
    status: failed
    reason: "Webhook not deployed to Supabase; purchase polling will timeout waiting for non-existent webhook confirmation"
    artifacts:
      - path: "supabase/functions/revenuecat-webhook/index.ts"
        issue: "Edge function exists but not deployed (no deployment evidence)"
      - path: "Supabase secrets"
        issue: "REVENUECAT_WEBHOOK_AUTH_KEY not configured"
    missing:
      - "Deploy webhook: supabase functions deploy revenuecat-webhook"
      - "Set secret: supabase secrets set REVENUECAT_WEBHOOK_AUTH_KEY=<key>"
      - "RevenueCat webhook URL configured pointing to deployed function"
      - "RevenueCat webhook Authorization header set to Bearer <key>"
  
  - truth: "Subscription status syncs to Supabase via RevenueCat webhook so the web app recognizes the mobile subscription"
    status: failed
    reason: "Webhook deployment incomplete (same as above)"
    artifacts:
      - path: "supabase/functions/revenuecat-webhook/index.ts"
        issue: "Code exists but not deployed and not wired to RevenueCat"
    missing:
      - "Same deployment steps as previous gap"
  
  - truth: "EAS development builds compile and run successfully on both iOS and Android"
    status: failed
    reason: "No evidence of actual build creation or validation; only configuration exists"
    artifacts:
      - path: "eas.json"
        issue: "Contains placeholder values for App Store Connect and Apple Team ID"
      - path: "Build validation"
        issue: "No expo prebuild test performed; no actual EAS build attempted"
    missing:
      - "Run: npx expo prebuild --no-install --clean (validate native generation)"
      - "Run: eas build --profile development:device --platform ios (test build)"
      - "Run: eas build --profile development:device --platform android (test build)"
      - "Fill in ascAppId and appleTeamId in eas.json submit config"
      - "Create google-service-account.json for Android submission"
---

# Phase 05: IAP Wiring Verification Report

**Phase Goal:** Users can purchase subscriptions through Apple App Store or Google Play with real money, completing the monetization flow

**Verified:** 2026-02-06T18:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can select a subscription plan on the paywall and complete a real purchase through Apple StoreKit or Google Play Billing | ✗ FAILED | RevenueCat SDK configured with placeholder API keys; will crash on initialize |
| 2 | After purchase completes, the app immediately unlocks premium features without requiring a restart or manual refresh | ✗ FAILED | Webhook code exists but not deployed; polling will timeout |
| 3 | Subscription status syncs to Supabase via RevenueCat webhook so the web app recognizes the mobile subscription | ✗ FAILED | Webhook not deployed or wired to RevenueCat dashboard |
| 4 | EAS development builds compile and run successfully on both iOS and Android | ✗ FAILED | Config exists but no actual builds created or validated |

**Score:** 0/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/constants/revenuecatConfig.ts` | RevenueCat API keys, entitlement ID, polling config | ⚠️ PARTIAL | EXISTS (20 lines) + SUBSTANTIVE (exports, config object) but contains PLACEHOLDER keys |
| `src/constants/subscriptionPlans.ts` | Product ID fields on subscription plans | ✓ VERIFIED | EXISTS (143 lines) + SUBSTANTIVE (appleProductId, googleProductId, rcPackageId on all plans) + WIRED (used in useRevenueCatPurchase) |
| `src/providers/RevenueCatProvider.tsx` | SDK init and user identification | ✓ VERIFIED | EXISTS (47 lines) + SUBSTANTIVE (Purchases.configure, logIn/logOut) + WIRED (imported in app/_layout.tsx) |
| `app/_layout.tsx` | RevenueCatProvider in tree | ✓ VERIFIED | EXISTS + RevenueCatProvider wraps app tree inside AuthProvider |
| `src/hooks/useRevenueCatPurchase.ts` | Real purchase hook with polling | ✓ VERIFIED | EXISTS (173 lines) + SUBSTANTIVE (purchasePackage, pollForWebhookConfirmation) + WIRED (imported in paywall.tsx, manage-subscription.tsx) |
| `app/paywall.tsx` | Wired to real purchases | ✓ VERIFIED | EXISTS (565 lines) + uses useRevenueCatPurchase (not useMockPurchase) + has web subscriber guard (platform === 'stripe') |
| `app/manage-subscription.tsx` | Wired to real purchases | ✓ VERIFIED | EXISTS + uses useRevenueCatPurchase + PURCHASE_PENDING handling |
| `supabase/functions/revenuecat-webhook/index.ts` | Webhook handler | ⚠️ ORPHANED | EXISTS (417 lines) + SUBSTANTIVE (all event types, idempotency, 200 returns) but NOT DEPLOYED |
| `supabase/config.toml` | JWT disabled for webhook | ✓ VERIFIED | EXISTS + verify_jwt = false for revenuecat-webhook |
| `eas.json` | Build profiles | ⚠️ PARTIAL | EXISTS + has development:device profile but contains PLACEHOLDERS and UNVALIDATED |
| `app.json` | RevenueCat plugin | ✓ VERIFIED | EXISTS + newArchEnabled: true + no react-native-purchases plugin (correct - autolinking) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| RevenueCatProvider | revenuecatConfig | import getRevenueCatApiKey | ✓ WIRED | Found: getRevenueCatApiKey used in Purchases.configure |
| RevenueCatProvider | AuthContext | useAuth for user identification | ✓ WIRED | Found: useAuth().user triggers logIn/logOut |
| app/_layout.tsx | RevenueCatProvider | wraps children | ✓ WIRED | Found: <RevenueCatProvider> in tree |
| useRevenueCatPurchase | react-native-purchases | Purchases.purchasePackage | ✓ WIRED | Found: purchasePackage call line 109 |
| useRevenueCatPurchase | user_subscriptions | polling for webhook confirmation | ✓ WIRED | Found: pollForWebhookConfirmation queries user_subscriptions |
| paywall.tsx | useRevenueCatPurchase | import | ✓ WIRED | Found: line 20 imports, line 40 uses |
| paywall.tsx | useSubscriptionStatus | platform check | ✓ WIRED | Found: platform === 'stripe' guard line 386 |
| webhook | user_subscriptions | upsert subscription data | ✓ WIRED | Found: 6 references to user_subscriptions in webhook |
| webhook | webhook_events | idempotency check | ✓ WIRED | Found: checkIdempotency and recordProcessedEvent |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| SUB-01: User can subscribe via Apple IAP / Google Play Billing | ✗ BLOCKED | RevenueCat API keys are placeholders; dashboard not configured; webhook not deployed |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/constants/revenuecatConfig.ts | 5 | Placeholder API key: 'appl_REPLACE_WITH_REAL_KEY' | 🛑 Blocker | SDK will crash on initialize in any build |
| src/constants/revenuecatConfig.ts | 6 | Placeholder API key: 'goog_REPLACE_WITH_REAL_KEY' | 🛑 Blocker | SDK will crash on initialize in any build |
| eas.json | 44 | Placeholder: 'YOUR_APP_STORE_CONNECT_APP_ID' | ⚠️ Warning | Blocks submission but not local development builds |
| eas.json | 45 | Placeholder: 'YOUR_APPLE_TEAM_ID' | ⚠️ Warning | Blocks submission but not local development builds |

### Human Verification Required

None at this stage - automated checks found blocking gaps that must be resolved before human testing is possible.

### Gaps Summary

**Phase 05 implemented all code artifacts but completed zero external service setup.**

The phase delivered:
- ✓ RevenueCat SDK integration (provider, purchase hook, polling logic)
- ✓ Webhook handler code (event processing, idempotency, error handling)
- ✓ EAS build configuration (profiles for dev/preview/production)
- ✓ UI wiring (paywall and manage-subscription use real purchases)

**However, none of the four success criteria can be achieved because:**

1. **No RevenueCat dashboard configuration** - Products, offerings, and entitlements don't exist
2. **No RevenueCat API keys** - Placeholder values will cause SDK to crash immediately
3. **No webhook deployment** - Edge function exists but isn't deployed or wired to RevenueCat
4. **No build validation** - EAS config exists but no actual builds attempted

**This is a textbook example of task completion ≠ goal achievement:**
- Tasks: "Create RevenueCatProvider ✓", "Create webhook handler ✓", "Update EAS config ✓"
- Goal: "Users can purchase subscriptions through Apple/Google" ✗

**All gaps are external service setup (not code):**
- RevenueCat dashboard: Create project, products, offerings, entitlements
- RevenueCat secrets: Replace placeholder API keys with real keys
- Supabase deployment: Deploy webhook function and configure secrets
- RevenueCat webhook: Configure URL and auth header
- EAS builds: Actually run builds to validate configuration

**The code is ready. The plumbing is incomplete.**

---

_Verified: 2026-02-06T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
