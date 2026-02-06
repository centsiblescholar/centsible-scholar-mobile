---
phase: 01-architecture-foundation
plan: 01
subsystem: auth
tags: [role-detection, user-metadata, conditional-tabs, expo-router, react-context]

# Dependency graph
requires: []
provides:
  - "userRole ('parent' | 'student' | null) exposed via useAuth() hook"
  - "signOutWithError helper for invalid role handling"
  - "Role-aware routing in app/index.tsx"
  - "Conditional tab visibility (Earnings hidden from students)"
affects:
  - "02-student-experience (student routing, welcome screen)"
  - "03-student-dashboard (role-gated data fetching)"
  - "05-app-store-prep (role in analytics/entitlements)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "extractRole(user) helper for user_metadata.user_type validation"
    - "href: null pattern for conditional Expo Router tab visibility"
    - "signOutWithError pattern for data integrity issues"

key-files:
  created: []
  modified:
    - "src/contexts/AuthContext.tsx"
    - "app/index.tsx"
    - "app/(tabs)/_layout.tsx"
    - "src/hooks/useSubscriptionStatus.ts"

key-decisions:
  - "Role sourced from user_metadata.user_type (set at signup, trusted)"
  - "Invalid/missing role triggers sign-out with Alert, not silent fallback"
  - "Both parent and student route to /(tabs)/dashboard for now (Phase 2 adds student welcome)"
  - "Only Earnings tab hidden from students; other tabs visible to all roles"

patterns-established:
  - "extractRole: centralized role extraction from Supabase user metadata"
  - "href: null: Expo Router conditional tab hiding without screen duplication"
  - "signOutWithError: reusable auth error pattern for data integrity issues"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 1 Plan 1: Role Detection and Routing Summary

**Role detection from user_metadata.user_type in AuthContext with conditional tab visibility hiding Earnings from students via Expo Router href: null**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T02:17:31Z
- **Completed:** 2026-02-06T02:19:48Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- AuthContext exposes `userRole` derived from `user_metadata.user_type` on every auth state change
- Invalid/missing role triggers automatic sign-out with descriptive error alert
- Root index routing is role-aware, showing spinner during sign-out-in-progress to prevent flash
- Earnings tab hidden from student users via `href: null` in tab layout
- Parent experience completely unchanged (all 6 tabs visible)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add role detection to AuthContext** - `b817268` (feat)
2. **Task 2: Role-based routing and conditional tab visibility** - `27c82e8` (feat)
3. **Deviation fix: useSubscriptionStatus type cast** - `3c5a99e` (fix)

## Files Created/Modified
- `src/contexts/AuthContext.tsx` - Added UserRole type, extractRole helper, userRole state, signOutWithError, role validation on init and auth state change
- `app/index.tsx` - Added userRole consumption, spinner for null-role state, role-aware redirect logic
- `app/(tabs)/_layout.tsx` - Added useAuth import, conditional `href: null` on Earnings tab for student role
- `src/hooks/useSubscriptionStatus.ts` - Fixed type cast on fallback query return (deviation from parallel plan 01-02)

## Decisions Made
- **Role source:** `user_metadata.user_type` read directly from Supabase auth user object. No additional database query needed.
- **Invalid role = sign out:** Treating missing/invalid role as data integrity issue rather than defaulting to a role. Prevents unauthorized access.
- **Same destination for both roles:** Both parent and student go to `/(tabs)/dashboard`. Phase 2 will add student-specific welcome/onboarding.
- **useCallback for signOutWithError:** Wrapped in useCallback to maintain stable reference for useEffect dependency array.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed type cast in useSubscriptionStatus fallback query**
- **Found during:** Overall verification (post Task 2)
- **Issue:** The parallel plan 01-02 added IAP columns to `SubscriptionStatus` interface but the fallback query return at line 60 used a simple `as` cast instead of `as unknown as`, causing TS2322/TS2739 errors
- **Fix:** Changed `return anyRecord as SubscriptionStatus | null` to `return anyRecord as unknown as SubscriptionStatus | null` to match the pattern already used on line 65
- **Files modified:** `src/hooks/useSubscriptionStatus.ts`
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** `3c5a99e`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was a one-character change to align cast patterns in code modified by parallel plan. No scope creep.

## Issues Encountered
None -- plan executed smoothly. The type error was from a parallel plan's work, not from this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Role infrastructure is in place for Phase 2 student experience work
- `useAuth()` hook now returns `userRole` for any component to consume
- Tab visibility pattern established for adding more role-conditional UI
- Student routing destination (dashboard) ready to be changed to welcome screen in Phase 2

---
*Phase: 01-architecture-foundation*
*Completed: 2026-02-05*
