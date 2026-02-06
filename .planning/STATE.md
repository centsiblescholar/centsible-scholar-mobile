# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Parents and students can do everything on mobile that they can on the web app -- same features, same data, native mobile experience.
**Current focus:** Phase 2 - Auth + Student Routing (In progress)

## Current Position

Phase: 2 of 7 (Auth + Student Routing)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-05 -- Completed 02-01-PLAN.md (Password Reset Flow)

Progress: [██████░░░░] 60% (3/5 plans completed)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 3min
- Total execution time: 9min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 2 | 5min | 2.5min |
| 02-auth-student-routing | 1 | 4min | 4min |

**Recent Trend:**
- Last 5 plans: 01-01 (2min), 01-02 (3min), 02-01 (4min)
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

### Pending Todos

- Apply SQL migration to Supabase: supabase/migrations/20260205_add_iap_subscription_columns.sql
- After migration, regenerate Supabase types and remove type casts in useSubscriptionStatus.ts

### Blockers/Concerns

- RevenueCat webhook + Supabase edge function integration needs testing (Phase 5)
- EAS build with New Architecture enabled may surface compatibility issues (Phase 5)
- SQL migration must be applied before IAP features work (Phase 5 prerequisite)

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 02-01-PLAN.md (Password Reset Flow)
Resume file: None
