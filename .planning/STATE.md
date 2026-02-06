# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Parents and students can do everything on mobile that they can on the web app -- same features, same data, native mobile experience.
**Current focus:** Phase 3 - Student Daily Experience (Complete)

## Current Position

Phase: 3 of 7 (Student Daily Experience)
Plan: 3 of 3 (Phase 3 complete)
Status: Phase complete
Last activity: 2026-02-06 -- Completed 03-02-PLAN.md (Wave 2, final plan in Phase 3)

Progress: [████████████████░░░░] 80% (8/10 plans completed)

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 3.5min
- Total execution time: 27min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 2 | 5min | 2.5min |
| 02-auth-student-routing | 3 | 11min | 3.7min |
| 03-student-daily-experience | 3 | 11min | 3.7min |

**Recent Trend:**
- Last 5 plans: 02-02 (4min), 02-03 (3min), 03-01 (6min*), 03-03 (6min*), 03-02 (5min)
- *03-01 and 03-03 executed in parallel (6min wall clock for both)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: OTP-based password reset over deep links -- avoids platform-specific linking complexity
- [Roadmap]: RevenueCat for IAP -- eliminates server-side receipt validation work
- [Roadmap]: Single (tabs) group with conditional visibility -- avoids screen duplication
- [Roadmap]: Extend user_subscriptions for dual billing (Stripe + IAP)
- [Roadmap]: Do NOT use Kids Category -- position as parenting tool, age 12+
- [01-01]: Role sourced from user_metadata.user_type (trusted, no extra DB query)
- [01-01]: Invalid/missing role = sign out with error alert (not silent fallback)
- [01-01]: href: null pattern for conditional Expo Router tab visibility
- [01-02]: Extend user_subscriptions (not separate iap_subscriptions table) for single-query simplicity
- [01-02]: Default platform to 'stripe' so existing rows need zero data migration
- [01-02]: isActive returns null (not false) when no subscription record exists
- [01-02]: Keep backward-compat status returning 'inactive' to prevent Settings crash
- [01-02]: Map 'large' subscription type to 'Family' for App Store naming
- [02-01]: Combined OTP verification + password reset on single screen for fewer navigation steps
- [02-01]: verifyOtp creates session, then updateUser sets password -- user lands on dashboard logged in
- [02-01]: textContentType='oneTimeCode' on password fields to prevent iOS autofill overlay (consistent with Phase 1)
- [02-02]: Cast Supabase data as unknown then StudentProfile for pre-migration compat (safeOnboardingStatus handles null)
- [02-02]: Student and parent dashboard views in same file as separate function components
- [02-02]: _layout.tsx confirmed correct from Phase 1 -- no changes needed for student tab visibility
- [02-02]: useQuestionOfTheDay reused for dashboard hasAnsweredToday and streakCount
- [02-03]: ProgressDots duplicated per-screen to avoid cross-file deps for simple UI element
- [02-03]: Celebration DB update uses email fallback if user_id match fails (mirrors fetch pattern)
- [02-03]: Supabase update payload cast as any for pre-migration compat (same pattern as 02-02)
- [02-03]: Removed 'as any' cast on /(onboarding) redirect now that route files exist
- [03-01]: Query by user_id (not profile row id) for all streak/XP operations -- matches mobile auth pattern
- [03-01]: Email fallback on getStreakData matching useStudentProfile fetch pattern
- [03-01]: Cast xp_transactions as any for pre-migration compat (table not in generated types yet)
- [03-01]: Fire-and-forget XP/streak updates -- errors logged but never block QOD save
- [03-02]: State-driven wizard steps (WizardStep type) instead of multi-screen navigation
- [03-02]: Default behavior scores to 3 (not 0) for friendlier starting point
- [03-02]: Post-completion re-entry shows read-only completed view, not celebration again
- [03-02]: Dashboard task cards disabled when both QOD and behavior are complete
- [03-03]: Role-conditional rendering in learn.tsx -- parent sees dashboard, student sees existing QOD
- [03-03]: Student cards NOT tappable -- deep navigation deferred to Phase 6 polish
- [03-03]: useParentQODStats uses @tanstack/react-query with timeRange in query key

### Pending Todos

- Apply SQL migration to Supabase: supabase/migrations/20260205_add_iap_subscription_columns.sql
- Apply SQL migration to Supabase: supabase/migrations/20260205_add_student_onboarding_column.sql
- After migrations, regenerate Supabase types and remove type casts in useSubscriptionStatus.ts, useStudentProfile.ts, and celebration.tsx
- Apply SQL migration for streak_count, longest_streak, total_xp, last_qod_date on student_profiles and xp_transactions table

### Blockers/Concerns

- RevenueCat webhook + Supabase edge function integration needs testing (Phase 5)
- EAS build with New Architecture enabled may surface compatibility issues (Phase 5)
- SQL migrations must be applied before IAP features, onboarding gate, and XP/streak features work in production

## Session Continuity

Last session: 2026-02-06
Stopped at: Completed 03-02-PLAN.md -- Phase 3 fully complete
Resume file: None
