---
phase: 02-auth-student-routing
plan: 02
subsystem: ui
tags: [react-native, expo-router, dashboard, student-view, horizontal-scroll, flatlist, onboarding-gate]

# Dependency graph
requires:
  - phase: 01-architecture-foundation
    provides: Role-based routing (userRole), conditional tab visibility (href:null), AuthContext, StudentContext
provides:
  - Student-specific dashboard with horizontal scrollable metric cards
  - Role-aware dashboard routing (parent vs student views)
  - Onboarding gate for students (has_completed_onboarding flag)
  - SQL migration for student_profiles.has_completed_onboarding column
  - useStudentProfile returns hasCompletedOnboarding
affects: [02-03-onboarding-flow, student-daily-flow, future-student-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-conditional component rendering: extract student/parent views as separate components with shared styles"
    - "Horizontal metric FlatList with snapToInterval + page indicator dots"
    - "Pre-migration type safety via unknown cast + null-coalescing fallback (safeOnboardingStatus)"

key-files:
  created:
    - supabase/migrations/20260205_add_student_onboarding_column.sql
  modified:
    - src/hooks/useStudentProfile.ts
    - app/index.tsx
    - app/(tabs)/dashboard.tsx

key-decisions:
  - "Cast Supabase data as unknown then StudentProfile for pre-migration compat (safeOnboardingStatus handles null)"
  - "Onboarding route uses 'as any' cast since /(onboarding) route created in Plan 02-03"
  - "Student dashboard extracted as StudentDashboardView, parent code extracted as ParentDashboardView (both in same file)"
  - "_layout.tsx confirmed correct -- no changes needed (Earnings already hidden via href:null)"
  - "useQuestionOfTheDay reused for hasAnsweredToday and streakCount on student dashboard"

patterns-established:
  - "Role-split dashboard: check userRole at top, return separate component for each role"
  - "Metric card carousel: FlatList horizontal + snapToInterval + page dots pattern"

# Metrics
duration: 4min
completed: 2026-02-06
---

# Phase 02 Plan 02: Student Dashboard + Role-Based Routing Summary

**Student dashboard with horizontal scrollable metric cards (GPA, Earnings, Streak, Behavior), action-first Today's Tasks section, full reward transparency, and onboarding routing gate**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-06T04:05:28Z
- **Completed:** 2026-02-06T04:10:15Z
- **Tasks:** 2
- **Files modified:** 4 (3 code files + 1 SQL migration)

## Accomplishments
- Student signs in and sees personalized dashboard with "Hey, {name}!" greeting and encouraging copy
- "What You Need To Do Today" section at top shows QOD and behavior check-in status with colored dots
- Horizontal scrollable metric cards (GPA, Earnings, Streak, Behavior) with page indicator dots
- Full financial transparency: base reward amount, earned bonuses, and allocation breakdown visible
- Onboarding gate in app/index.tsx redirects students to /(onboarding) if has_completed_onboarding is false
- Parent dashboard completely unchanged (extracted to ParentDashboardView, identical code path)
- Tab bar verified: students see 5 tabs (Dashboard, Grades, Behavior, Learn, Settings), parents see 6

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration + useStudentProfile update + routing gate** - `4406bdd` (feat)
2. **Task 2: Student dashboard view with horizontal metric cards + tab bar updates** - `02e6b18` (feat)

## Files Created/Modified
- `supabase/migrations/20260205_add_student_onboarding_column.sql` - Adds has_completed_onboarding boolean column to student_profiles
- `src/hooks/useStudentProfile.ts` - Added has_completed_onboarding to interface, safeOnboardingStatus helper, hasCompletedOnboarding return
- `app/index.tsx` - Student onboarding gate: checks has_completed_onboarding, redirects to /(onboarding) or /(tabs)/dashboard
- `app/(tabs)/dashboard.tsx` - Role-aware dashboard with StudentDashboardView (metric cards, tasks, rewards) and ParentDashboardView (unchanged)

## Decisions Made
- Used `as unknown as StudentProfile` cast for Supabase data since migration may not be applied yet; `safeOnboardingStatus` handles null/undefined safely
- Onboarding redirect uses `'/(onboarding)' as any` since the route is created in Plan 02-03; Expo Router typed routes would reject the nonexistent path
- Extracted both student and parent views as separate function components within the same file to keep related code together while maintaining clean separation
- Confirmed _layout.tsx needs no changes -- Earnings tab already hidden from students via `href: null` from Phase 1, resulting in correct 5-tab student experience

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript error: Supabase types missing has_completed_onboarding**
- **Found during:** Task 1 (useStudentProfile update)
- **Issue:** Generated Supabase types don't include has_completed_onboarding (migration not yet applied to DB), causing type mismatch
- **Fix:** Added `as unknown as StudentProfile` cast in fetchStudentProfile, with safeOnboardingStatus providing null-safe fallback
- **Files modified:** src/hooks/useStudentProfile.ts
- **Verification:** npx tsc --noEmit passes
- **Committed in:** 4406bdd

**2. [Rule 3 - Blocking] TypeScript error: /(onboarding) route not in typed routes**
- **Found during:** Task 1 (index.tsx routing gate)
- **Issue:** Expo Router typed routes reject `/(onboarding)` because the route files don't exist yet (Plan 02-03 creates them)
- **Fix:** Cast href as `'/(onboarding)' as any` with explanatory comment
- **Files modified:** app/index.tsx
- **Verification:** npx tsc --noEmit passes
- **Committed in:** 4406bdd

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were expected pre-migration/pre-route type mismatches. No scope creep.

## Issues Encountered
None beyond the type-level fixes documented above.

## User Setup Required
- Apply SQL migration to Supabase: `supabase/migrations/20260205_add_student_onboarding_column.sql`
- After migration, regenerate Supabase types to remove type casts in useStudentProfile.ts

## Next Phase Readiness
- Student onboarding flow (Plan 02-03) can now build the /(onboarding) route that the gate redirects to
- Student dashboard is ready to receive live data once students complete onboarding
- All hooks (useStudentGrades, useBehaviorAssessments, useEducationBonus, useBehaviorBonus) already work with student user.id

---
*Phase: 02-auth-student-routing*
*Completed: 2026-02-06*
