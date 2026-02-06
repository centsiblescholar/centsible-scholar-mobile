---
phase: 04-subscription-ui-gates
plan: 03
subsystem: payments
tags: [settings, manage-subscription, student-limit, debug-tools, restore-purchases]

# Dependency graph
requires:
  - phase: 04-01
    provides: SUBSCRIPTION_PLANS constants, useSubscriptionStatus hook, useMockPurchase hook
  - phase: 04-02
    provides: Paywall screen registered in layout (for upgrade CTA navigation)
provides:
  - Overhauled Settings subscription section with status badge, in-app management, restore purchases
  - Manage-subscription screen with plan switching, cancel, and dev debug tools
  - Student limit enforcement in student-management with upgrade CTA
affects: [05-iap-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dev-only debug section gated by __DEV__ for subscription state testing"
    - "Student limit enforcement at both modal open and form submission"
    - "Status dot badge pattern for subscription status visualization"

key-files:
  created:
    - app/manage-subscription.tsx
  modified:
    - app/(tabs)/settings.tsx
    - app/student-management.tsx

key-decisions:
  - "Settings subscription section hidden for students (isParent guard)"
  - "Button text dynamically changes: 'Manage Subscription' when active, 'Subscribe Now' when inactive"
  - "Downgrade confirmation warns about student limit impact"
  - "Debug tools use direct Supabase updates + cache invalidation for immediate effect"
  - "Student limit checked at two points: modal open and handleAddStudent (defense in depth)"

patterns-established:
  - "In-app subscription management (no external web URLs for subscription)"
  - "Debug tools pattern for testing subscription states in development"

# Metrics
duration: 5min
completed: 2026-02-06
---

# Phase 4 Plan 03: Settings Subscription Overhaul, Manage Subscription, Student Limit Summary

**Settings subscription card with status badge and in-app management, manage-subscription screen with plan switching/cancel/debug tools, student limit enforcement with upgrade CTA**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 2

## Accomplishments
- Settings subscription section overhauled: status dot badge, feature count, dynamic button text, Restore Purchases with mock flow, hidden for students
- Manage-subscription screen shows current plan summary, billing toggle, plan switching with upgrade/downgrade confirmations, cancel with end-of-period warning
- Dev debug tools (visible only in __DEV__) allow setting subscription to Active/Trialing/Canceled or deleting the row
- Student limit enforcement blocks adding students beyond plan allowance with Alert and Upgrade Plan CTA

## Task Commits

Each task was committed atomically:

1. **Task 1: Overhaul Settings subscription section** - `93973fe` (feat)
2. **Task 2: Create manage-subscription screen and student limit enforcement** - `24537da` (feat)

## Files Created/Modified
- `app/(tabs)/settings.tsx` - Subscription section: status dot badge, feature count, Manage Subscription / Subscribe Now dynamic button, Restore Purchases button, hidden for students
- `app/manage-subscription.tsx` - Current plan summary, billing toggle, plan switching with confirmation dialogs, cancel subscription, __DEV__ debug tools
- `app/student-management.tsx` - Added getStudentLimit + useSubscriptionStatus imports, handleOpenAddModal with limit check, limit check in handleAddStudent

## Decisions Made
- Subscription section hidden for students (they inherit from parent, no management needed)
- Button shows "Subscribe Now" and navigates to paywall when inactive, "Manage Subscription" to manage-subscription screen when active
- Downgrade confirmation explicitly warns about student limit impact
- Debug tools directly modify Supabase rows and invalidate query cache for immediate effect
- Student limit enforced at two points (modal open and form submission) for defense in depth

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness
- All subscription UI and gates complete for Phase 4
- Phase 5 (IAP integration) can replace mock purchase with RevenueCat
- Debug tools will remain useful during Phase 5 development
- No blockers

---
*Phase: 04-subscription-ui-gates*
*Completed: 2026-02-06*
