---
phase: 04-subscription-ui-gates
plan: 01
subsystem: payments
tags: [subscription, gate, mock-iap, tanstack-query, supabase]

# Dependency graph
requires:
  - phase: 01-architecture-foundation
    provides: useSubscriptionStatus hook, subscription query key factory, AuthContext with userRole
provides:
  - Centralized subscription plan constants (pricing, limits, features)
  - Subscription gate hook with parent self-check and student inheritance
  - Mock purchase mutation hook with two-step Supabase write pattern
affects: [04-02-PLAN (paywall screen), 04-03-PLAN (settings/manage subscription), 05-iap-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-step query-then-insert/update for Supabase writes without unique constraints"
    - "Student subscription inheritance via parent_student_relationships lookup"
    - "Unified gate status interface for role-agnostic consumption"

key-files:
  created:
    - src/constants/subscriptionPlans.ts
    - src/hooks/useSubscriptionGate.ts
    - src/hooks/useMockPurchase.ts
  modified: []

key-decisions:
  - "Two-step pattern (query then insert/update) instead of upsert to avoid unique constraint issues on user_subscriptions"
  - "Student gate query uses 5-minute staleTime to prevent N+1 inheritance queries"
  - "Mock purchase uses platform: 'apple' to simulate IAP path"

patterns-established:
  - "Subscription constants centralized in src/constants/subscriptionPlans.ts for all plan data"
  - "Gate hook returns unified GateStatus type consumed by root redirect and screens"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Phase 4 Plan 01: Subscription Plan Constants, Gate Hook, Mock Purchase Summary

**Centralized plan constants (3 tiers, pricing, limits), subscription gate hook with parent/student inheritance, and mock purchase mutation via Supabase two-step write**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T19:59:24Z
- **Completed:** 2026-02-06T20:02:24Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Subscription plan data centralized with correct pricing matching web app (9.99/12.99/15.99 monthly)
- Gate hook handles both parent (self-check via useSubscriptionStatus) and student (inheritance via parent_student_relationships) with unified interface
- Mock purchase writes real subscription row to Supabase with trialing status and 7-day trial, invalidates cache for immediate gate re-evaluation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscription plan constants** - `6870520` (feat)
2. **Task 2: Create subscription gate hook and mock purchase hook** - `d46c9a0` (feat)

## Files Created/Modified
- `src/constants/subscriptionPlans.ts` - Plan definitions (SubscriptionPlan interface, SUBSCRIPTION_PLANS array, STUDENT_LIMITS, utility functions)
- `src/hooks/useSubscriptionGate.ts` - Combined auth + subscription gate with student inheritance via parent_student_relationships
- `src/hooks/useMockPurchase.ts` - Mock purchase mutation with two-step insert/update and cache invalidation

## Decisions Made
- Two-step query-then-insert/update pattern for mock purchase instead of upsert, avoiding potential unique constraint issues on user_subscriptions table (per Research Pitfall 2)
- Student inheritance query keyed on `['subscriptionGate', 'studentInheritance', userId]` with 5-minute staleTime to prevent excessive DB calls
- Mock purchase simulates Apple IAP (`platform: 'apple'`) to test the IAP code path that Phase 5 will use with RevenueCat
- `as any` cast on Supabase insert/update data for pre-migration compatibility (same pattern as Phases 2-3)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three files provide the shared data layer for Plans 04-02 (paywall screen) and 04-03 (settings/manage subscription)
- Plans 02 and 03 can now execute in parallel as designed
- No blockers

---
*Phase: 04-subscription-ui-gates*
*Completed: 2026-02-06*
