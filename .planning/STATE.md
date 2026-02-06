# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Parents and students can do everything on mobile that they can on the web app -- same features, same data, native mobile experience.
**Current focus:** Phase 2 - Auth + Student Routing (Complete)

## Current Position

Phase: 2 of 7 (Auth + Student Routing)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-06 -- Completed 02-03-PLAN.md (Student Onboarding Tutorial)

Progress: [██████████] 100% (5/5 plans completed)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 3.2min
- Total execution time: 16min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 2 | 5min | 2.5min |
| 02-auth-student-routing | 3 | 11min | 3.7min |

**Recent Trend:**
- Last 5 plans: 01-02 (3min), 02-01 (4min), 02-02 (4min), 02-03 (3min)
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

### Pending Todos

- Apply SQL migration to Supabase: supabase/migrations/20260205_add_iap_subscription_columns.sql
- Apply SQL migration to Supabase: supabase/migrations/20260205_add_student_onboarding_column.sql
- After migrations, regenerate Supabase types and remove type casts in useSubscriptionStatus.ts, useStudentProfile.ts, and celebration.tsx

### Blockers/Concerns

- RevenueCat webhook + Supabase edge function integration needs testing (Phase 5)
- EAS build with New Architecture enabled may surface compatibility issues (Phase 5)
- SQL migrations must be applied before IAP features and onboarding gate work in production

## Session Continuity

Last session: 2026-02-06
Stopped at: Completed 02-03-PLAN.md (Student Onboarding Tutorial) -- Phase 2 complete
Resume file: None
