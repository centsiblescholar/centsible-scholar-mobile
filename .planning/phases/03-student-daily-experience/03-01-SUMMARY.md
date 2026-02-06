---
phase: 03-student-daily-experience
plan: 01
subsystem: api
tags: [xp, streak, level-system, supabase, react-hooks]

# Dependency graph
requires:
  - phase: 02-auth-student-routing
    provides: useQuestionOfTheDay hook, useStudentProfile hook, student auth flow
provides:
  - XP level calculation utility (10 levels with titles and thresholds)
  - Streak/XP DB operations (getStreakData, updateStreakData, awardXP)
  - Enhanced QOD hook with XP/streak side-effects after answer submission
  - StudentProfile interface with XP/streak fields
affects: [03-02 (QOD celebration screen uses xpEarned/totalXP), 03-03 (parent dashboard reads streak/XP data)]

# Tech tracking
tech-stack:
  added: [react-native-confetti-cannon]
  patterns: [fire-and-forget side-effects in hooks, pre-migration type casting for untyped columns]

key-files:
  created:
    - src/utils/levelSystem.ts
    - src/utils/questionOfTheDayApi.ts
  modified:
    - src/hooks/useQuestionOfTheDay.ts
    - src/hooks/useStudentProfile.ts

key-decisions:
  - "Query by user_id (not profile row id) for all streak/XP operations -- matches mobile auth pattern"
  - "Email fallback on getStreakData matching useStudentProfile fetch pattern"
  - "Cast xp_transactions as any for pre-migration compat (table not in generated types yet)"
  - "Fire-and-forget XP/streak updates -- errors logged but never block QOD save"

patterns-established:
  - "XP/streak side-effects: try/catch wrapping non-critical DB operations after primary save"
  - "Pre-migration column access: cast Supabase data as Record<string, unknown> then access fields"

# Metrics
duration: 6min
completed: 2026-02-06
---

# Phase 3 Plan 1: XP/Streak Utilities and Enhanced QOD Hook Summary

**XP level system with 10 tiers, streak/XP DB utilities querying by user_id, and QOD hook awarding XP after every answer submission**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-06T05:43:11Z
- **Completed:** 2026-02-06T05:49:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Ported level system verbatim from web app (10 levels, Centsible Starter to Centsible Scholar Supreme)
- Ported streak/XP utilities with mobile-compatible user_id queries and email fallback
- QOD hook now awards 10 base XP + 5 correct bonus + milestone bonuses (7/30/100 day streaks)
- All streak/XP operations are fire-and-forget (non-blocking)

## Task Commits

Each task was committed atomically:

1. **Task 1: Port level system and streak/XP utilities** - `d03e76c` (feat)
2. **Task 2: Enhance QOD hook with XP/streak side-effects** - `0a6efc0` (feat)

## Files Created/Modified
- `src/utils/levelSystem.ts` - XP level calculation with 10 levels, titles, thresholds, progress tracking
- `src/utils/questionOfTheDayApi.ts` - Streak calculation, streak/XP DB operations with user_id queries
- `src/hooks/useQuestionOfTheDay.ts` - Enhanced with XP/streak updates after answer submission
- `src/hooks/useStudentProfile.ts` - StudentProfile interface extended with optional XP/streak fields

## Decisions Made
- Query by `user_id` instead of profile `id` for all streak/XP operations (mobile hooks pass `user.id`, not profile row ID)
- Added email fallback on `getStreakData` matching existing `useStudentProfile` fetch pattern
- Cast `xp_transactions` table reference as `any` since it's not in generated Supabase types yet (pre-migration)
- XP/streak failures are caught and logged but never block QOD answer saving

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cast xp_transactions as any for pre-migration compat**
- **Found during:** Task 1 (creating questionOfTheDayApi.ts)
- **Issue:** `xp_transactions` table not in Supabase generated types -- TypeScript error on `.from('xp_transactions')`
- **Fix:** Cast supabase client as `any` before `.from()` call, matching pattern used elsewhere for pre-migration columns
- **Files modified:** src/utils/questionOfTheDayApi.ts
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** d03e76c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for TypeScript compilation. Same pre-migration pattern used throughout codebase.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- XP/streak utilities ready for Plan 02 (QOD celebration screen) to use `xpEarned` and `totalXP` from hook
- Level system ready for Plan 03 (parent dashboard) to display level info
- Pending: SQL migration for streak_count, longest_streak, total_xp, last_qod_date columns on student_profiles, and xp_transactions table

---
*Phase: 03-student-daily-experience*
*Completed: 2026-02-06*
