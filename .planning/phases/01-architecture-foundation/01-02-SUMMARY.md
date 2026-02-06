---
phase: 01-architecture-foundation
plan: 02
subsystem: payments
tags: [supabase, iap, revenucat, subscriptions, react-query, platform-agnostic]

# Dependency graph
requires:
  - phase: none
    provides: existing user_subscriptions table and useSubscriptionStatus hook
provides:
  - SQL migration extending user_subscriptions with IAP columns (platform, iap_product_id, iap_original_transaction_id, revenucat_customer_id)
  - Platform-agnostic useSubscriptionStatus hook returning isActive/tier/platform/periodEnd
  - SubscriptionStatus interface with Stripe and IAP fields
affects: [04-subscription-ui-gates, 05-iap-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Platform-agnostic subscription abstraction: callers never check Stripe vs IAP"
    - "Null-distinguished subscription state: isActive null = no subscription, false = inactive"
    - "Two-phase subscription query: active/trialing first, then fallback to most recent"

key-files:
  created:
    - supabase/migrations/20260205_add_iap_subscription_columns.sql
  modified:
    - src/hooks/useSubscriptionStatus.ts

key-decisions:
  - "Extend user_subscriptions table (not separate iap_subscriptions) for single-query simplicity"
  - "Default platform to 'stripe' so existing rows need zero data migration"
  - "isActive returns null (not false) when no subscription record exists"
  - "Keep backward-compat status field returning 'inactive' (not null) to prevent Settings crash"
  - "Map 'large' subscription type to 'Family' (not 'Enterprise') for App Store naming"

patterns-established:
  - "Platform-agnostic subscription API: { isActive, tier, status, periodEnd, platform }"
  - "Type casting for pre-migration compatibility: cast select('*') until types regenerated"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 1 Plan 2: Unified Subscription Schema + Platform-Agnostic Hook Summary

**SQL migration adding IAP columns to user_subscriptions plus refactored useSubscriptionStatus hook returning platform-agnostic isActive/tier/platform API**

## Performance

- **Duration:** 2m 42s
- **Started:** 2026-02-06T02:17:34Z
- **Completed:** 2026-02-06T02:20:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created SQL migration extending user_subscriptions with platform, iap_product_id, iap_original_transaction_id, and revenucat_customer_id columns
- Refactored useSubscriptionStatus hook to abstract Stripe vs IAP behind a unified API
- Established isActive null-state pattern distinguishing "no subscription" from "inactive subscription"
- Preserved full backward compatibility with Settings screen (subscriptionTypeDisplay, status, periodEndDate)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migration for IAP subscription columns** - `2f067b1` (feat)
2. **Task 2: Refactor useSubscriptionStatus to be platform-agnostic** - no new commit (changes already present from prior 01-01 execution which proactively updated this file)

## Files Created/Modified
- `supabase/migrations/20260205_add_iap_subscription_columns.sql` - ALTER TABLE adding 4 IAP columns with indexes and CHECK constraint
- `src/hooks/useSubscriptionStatus.ts` - Platform-agnostic subscription hook with SubscriptionStatus interface, two-phase query, and backward-compat fields

## Decisions Made
- **Extend existing table:** Added columns to user_subscriptions rather than creating separate iap_subscriptions table. One subscription per user means single-table queries are simpler.
- **Default 'stripe':** platform column defaults to 'stripe' so all existing rows automatically get the correct value with zero data migration needed.
- **Null vs false for isActive:** Returns null when no subscription record exists, distinguishing "never subscribed" from "subscription is inactive." This helps downstream gates (Phase 4) display appropriate messaging.
- **Backward-compat status field:** Kept `status` returning `'inactive'` (not `null`) as fallback, because Settings screen `getStatusText()` calls `status.charAt(0)` which would crash on null. The plan specified `null` but this was a plan oversight caught during execution.
- **'Family' not 'Enterprise':** Changed formatSubscriptionType mapping for 'large' tier from 'Enterprise' to 'Family' to match App Store tier naming from REQUIREMENTS.md.
- **Type casting:** Used `as unknown as SubscriptionStatus` for query returns since auto-generated types don't include IAP columns yet. This cast is removed after migration is applied and types regenerated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prevented Settings screen crash on null status**
- **Found during:** Task 2 (hook refactor analysis)
- **Issue:** Plan specified `status: subscription?.status || null` but Settings screen `getStatusText()` default branch calls `status.charAt(0)` which would throw TypeError on null
- **Fix:** Kept `status: subscription?.status || 'inactive'` as backward-compat fallback
- **Files modified:** src/hooks/useSubscriptionStatus.ts
- **Verification:** TypeScript compiles cleanly; Settings getStatusText() default branch works with 'inactive'
- **Committed in:** already in HEAD from prior execution

**2. [Rule 3 - Blocking] Added type cast for pre-migration Supabase types**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Auto-generated Supabase types don't include new IAP columns; `select('*')` return type doesn't match SubscriptionStatus interface
- **Fix:** Added `as unknown as SubscriptionStatus | null` casts with comments explaining they're temporary until migration + type regen
- **Files modified:** src/hooks/useSubscriptionStatus.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** already in HEAD from prior execution

---

**Total deviations:** 2 auto-fixed (1 bug prevention, 1 blocking type error)
**Impact on plan:** Both auto-fixes necessary for correctness and compilation. No scope creep.

## Issues Encountered
- Task 2 changes were already committed to git by a prior plan execution (01-01). The 01-01 plan proactively modified useSubscriptionStatus as part of its role-based routing work. No new commit was needed for Task 2 since the file already contained the exact required changes.

## User Setup Required

The SQL migration file was created but NOT applied to the database. Before IAP features work:
1. Apply the migration to Supabase (via CLI or Dashboard SQL editor): `supabase/migrations/20260205_add_iap_subscription_columns.sql`
2. Regenerate Supabase types: `npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts`
3. After type regen, remove the `as unknown as SubscriptionStatus` casts in useSubscriptionStatus.ts

## Next Phase Readiness
- Schema extension is ready for Phase 5 (IAP Wiring) to write IAP subscription records
- Platform-agnostic hook is ready for Phase 4 (Subscription UI + Gates) to check subscription status without caring about payment source
- Migration must be applied to production Supabase before IAP features are functional
- No blockers for subsequent phases

---
*Phase: 01-architecture-foundation*
*Completed: 2026-02-05*
