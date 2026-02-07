---
phase: 05-iap-wiring
plan: 03
subsystem: payments
tags: [revenuecat, iap, react-native-purchases, paywall, subscription, polling, restore]

# Dependency graph
requires:
  - phase: 05-iap-wiring
    provides: RevenueCat SDK, provider, product IDs, config constants (05-01); webhook edge function (05-02)
  - phase: 04-subscription-ui-gates
    provides: paywall UI, manage-subscription UI, useMockPurchase interface
provides:
  - useRevenueCatPurchase hook with real purchasePackage and Supabase polling
  - useRestorePurchases hook with real restorePurchases and Supabase polling
  - Paywall wired to real RevenueCat purchase flow
  - Manage-subscription wired to real RevenueCat plan switching
  - Web subscriber guard (platform === 'stripe') on paywall
affects: [05-04-PLAN, 06-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase polling for webhook confirmation (no optimistic unlocking)"
    - "PURCHASE_PENDING error for timeout with user-friendly message"
    - "Silent cancellation handling (no error alert on user dismiss)"
    - "Web subscriber guard checking platform === 'stripe' before showing purchase UI"

key-files:
  created:
    - src/hooks/useRevenueCatPurchase.ts
  modified:
    - app/paywall.tsx
    - app/manage-subscription.tsx

key-decisions:
  - "pollForWebhookConfirmation polls Supabase at 2s intervals with 60s timeout (from REVENUECAT_CONFIG)"
  - "PURCHASE_PENDING is a special error the UI handles differently from other errors"
  - "Cancelled purchases silently caught -- no alert shown to user"
  - "Web subscriber guard only triggers when isActive === true AND platform === 'stripe'"
  - "Restore uses same polling pattern as purchase for consistency"
  - "supabase import removed from paywall (no longer needed after mock replace)"

patterns-established:
  - "RevenueCat package lookup: first by rcPackageId, fallback to product.identifier"
  - "Purchase error classification: cancelled (silent), PURCHASE_PENDING (info), other (error)"
  - "Webhook confirmation polling shared between purchase and restore flows"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Phase 5 Plan 3: Real Purchase Flow Summary

**RevenueCat purchasePackage wired into paywall and manage-subscription with Supabase webhook polling confirmation, web subscriber guard, and graceful cancellation/pending handling**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T00:58:35Z
- **Completed:** 2026-02-07T01:01:38Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created useRevenueCatPurchase hook with real Purchases.purchasePackage() and Supabase polling for webhook confirmation
- Created useRestorePurchases hook with Purchases.restorePurchases() and same polling pattern
- Replaced useMockPurchase in both paywall and manage-subscription screens
- Added web subscriber guard that shows "Already Subscribed via Web" for Stripe platform users
- Implemented graceful error handling: silent cancellation, PURCHASE_PENDING info message, standard errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useRevenueCatPurchase hook with polling confirmation** - `ae49782` (feat)
2. **Task 2: Wire paywall and manage-subscription to real purchase flow** - `02fece7` (feat)

## Files Created/Modified
- `src/hooks/useRevenueCatPurchase.ts` - Purchase hook with purchasePackage, restore hook with restorePurchases, shared pollForWebhookConfirmation
- `app/paywall.tsx` - Wired to real RevenueCat purchases, web subscriber guard, real restore, PURCHASE_PENDING handling
- `app/manage-subscription.tsx` - Wired to real RevenueCat purchases, PURCHASE_PENDING handling for plan switches

## Decisions Made
- Purchase hook matches useMockPurchase interface ({ purchase, isPurchasing, purchaseError }) for minimal UI changes
- pollForWebhookConfirmation uses REVENUECAT_CONFIG.polling settings (2s interval, 60s timeout) for configurability
- Package lookup tries rcPackageId first, falls back to product.identifier matching -- handles various RevenueCat configurations
- Web guard only shows for active Stripe subscribers (isActive === true && platform === 'stripe') -- null/inactive/IAP all show purchase UI
- Restore hook returns generic "No active purchases found to restore" on polling timeout rather than PURCHASE_PENDING
- supabase import removed from paywall.tsx since mock Supabase queries are no longer needed

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None additional beyond 05-01 and 05-02 setup requirements (RevenueCat API keys, webhook deployment, dashboard configuration).

## Next Phase Readiness
- Real purchase flow is complete and ready for end-to-end testing with sandbox accounts
- EAS build configuration (05-04) is the remaining plan for this phase
- Testing requires: RevenueCat API keys configured, webhook deployed, EAS development build

---
*Phase: 05-iap-wiring*
*Completed: 2026-02-06*
