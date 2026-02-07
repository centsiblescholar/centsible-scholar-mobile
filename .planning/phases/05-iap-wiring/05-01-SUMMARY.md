---
phase: 05-iap-wiring
plan: 01
subsystem: payments
tags: [revenuecat, iap, react-native-purchases, expo-dev-client, subscription]

requires:
  - phase: 04-subscription-ui-gates
    provides: subscription plans constants, paywall UI, subscription gates
provides:
  - RevenueCat SDK installed (react-native-purchases v9.7.6)
  - RevenueCat configuration constants (API keys, entitlement ID, polling config)
  - Subscription plans with Apple/Google product IDs and RC package IDs
  - RevenueCatProvider component with SDK init and user identification
  - Provider wired into app layout tree
affects: [05-02 purchase hook, 05-03 webhook handler, 05-04 EAS builds]

tech-stack:
  added: [react-native-purchases v9.7.6, expo-dev-client v6.0.20]
  patterns: [RevenueCat SDK singleton init via useRef, user identification via Purchases.logIn/logOut]

key-files:
  created:
    - src/constants/revenuecatConfig.ts
    - src/providers/RevenueCatProvider.tsx
  modified:
    - src/constants/subscriptionPlans.ts
    - app/_layout.tsx
    - tsconfig.json
    - package.json

key-decisions:
  - "RevenueCat configured without appUserID; user identification via logIn() after auth"
  - "Product IDs use com.centsiblescholar.{tier}.{interval} convention"
  - "RC package IDs use standard $rc_monthly and $rc_annual identifiers"
  - "Provider placed inside AuthProvider, outside StudentProvider in layout tree"
  - "Excluded supabase/functions from tsconfig to prevent Deno type errors"

patterns-established:
  - "RevenueCat SDK init once via useRef guard in provider component"
  - "User sync: logIn(supabase_user_id) on auth, logOut() on sign-out, wrapped in try/catch"
  - "Platform-specific product ID lookup via getProductIdForPlatform() helper"

duration: 3min
completed: 2026-02-06
---

# Phase 5 Plan 1: RevenueCat SDK Foundation Summary

**RevenueCat SDK v9.7.6 installed with provider component, product ID mappings on all 3 subscription tiers, and app layout wiring**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T00:53:06Z
- **Completed:** 2026-02-07T00:56:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed RevenueCat SDK (react-native-purchases v9.7.6) and expo-dev-client
- Created configuration constants with API key placeholders, entitlement ID, and polling settings
- Added Apple/Google product IDs and RevenueCat package IDs to all 3 subscription plans
- Built RevenueCatProvider with singleton SDK init and Supabase user identification
- Wired provider into app layout: QueryClient > Auth > RevenueCat > Student > Stack

## Task Commits

Each task was committed atomically:

1. **Task 1: Install RevenueCat SDK and create configuration constants** - `6c0d455` (feat)
2. **Task 2: Create RevenueCatProvider and wire into app layout** - `4e3dd6d` (feat)

## Files Created/Modified
- `src/constants/revenuecatConfig.ts` - RevenueCat API keys, entitlement ID, polling config, getRevenueCatApiKey()
- `src/constants/subscriptionPlans.ts` - Added appleProductId, googleProductId, rcPackageId to all plans; getProductIdForPlatform() helper
- `src/providers/RevenueCatProvider.tsx` - SDK init (once), user logIn/logOut sync on auth changes
- `app/_layout.tsx` - RevenueCatProvider wrapping app tree inside AuthProvider
- `tsconfig.json` - Excluded supabase/functions from TypeScript compilation
- `package.json` - Added react-native-purchases and expo-dev-client dependencies

## Decisions Made
- RevenueCat configured without `appUserID` in `configure()` -- user identification happens via `Purchases.logIn()` after auth is available, handling the case where user is not authenticated at app start
- Product IDs follow `com.centsiblescholar.{tier}.{interval}` convention matching the plan from CONTEXT.md
- RC package IDs use RevenueCat's standard `$rc_monthly` and `$rc_annual` identifiers (not custom per-tier packages)
- Provider tree order: QueryClient > Auth > RevenueCat > Student > Stack -- RevenueCat needs auth context but subscription gates don't need RevenueCat directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded supabase/functions from tsconfig**
- **Found during:** Task 2 (type-check verification)
- **Issue:** Pre-existing `supabase/functions/revenuecat-webhook/index.ts` (Deno file) was picked up by `**/*.ts` glob in tsconfig, causing TypeScript errors for Deno-specific imports
- **Fix:** Added `"exclude": ["supabase/functions/**"]` to tsconfig.json
- **Files modified:** tsconfig.json
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** `4e3dd6d` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for TypeScript compilation with pre-existing Deno edge function files. No scope creep.

## Issues Encountered
None beyond the tsconfig deviation noted above.

## User Setup Required

**External services require manual configuration before IAP purchases can work.**

The following must be configured in the RevenueCat Dashboard before plans 05-02 through 05-04:

1. **RevenueCat API Keys** - Replace placeholder values in `src/constants/revenuecatConfig.ts`:
   - `appl_REPLACE_WITH_REAL_KEY` with iOS public API key from RevenueCat Dashboard
   - `goog_REPLACE_WITH_REAL_KEY` with Android public API key from RevenueCat Dashboard

2. **RevenueCat Dashboard Configuration:**
   - Create RevenueCat project linked to App Store Connect and Google Play Console
   - Create 6 products matching `com.centsiblescholar.{single|midsize|large}.{monthly|annual}`
   - Create 'default' offering with 6 packages mapping to the products
   - Create 'premium' entitlement assigned to all 6 products

## Next Phase Readiness
- RevenueCat SDK foundation is complete and ready for purchase hook implementation (05-02)
- Webhook handler (05-03) can proceed independently
- EAS build configuration (05-04) can proceed independently
- API keys must be replaced before real purchase testing in development builds

---
*Phase: 05-iap-wiring*
*Completed: 2026-02-06*
