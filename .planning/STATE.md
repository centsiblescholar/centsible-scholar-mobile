# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Parents and students can do everything on mobile that they can on the web app -- same features, same data, native mobile experience.
**Current focus:** Phase 5 - IAP Wiring

## Current Position

Phase: 5 of 7 (IAP Wiring)
Plan: 2 of 4 (RevenueCat Webhook)
Status: In progress
Last activity: 2026-02-06 -- Completed 05-02-PLAN.md

Progress: [█████████████████████████░░░░░] 87% (13/15 plans completed - Phases 1-4 complete, 05-01 and 05-02 done)

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 3.2min
- Total execution time: 42min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 2 | 5min | 2.5min |
| 02-auth-student-routing | 3 | 11min | 3.7min |
| 03-student-daily-experience | 3 | 11min | 3.7min |
| 04-subscription-ui-gates | 3 | 13min | 4.3min |
| 05-iap-wiring | 2/4 | 2min | 1min |

**Recent Trend:**
- Last 5 plans: 04-01 (3min), 04-02 (5min*), 04-03 (5min*), 05-01, 05-02 (2min)
- Trend: accelerating

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
- [03-01]: XP/streak updates in useQuestionOfTheDay are fire-and-forget (try/catch, non-blocking)
- [03-01]: levelSystem.ts ported verbatim from web app (10 levels with titles and thresholds)
- [03-02]: State-driven wizard (single screen, not multi-screen navigation) to prevent back-button issues
- [03-02]: Smart step-skipping based on hasAnsweredToday and todayAssessment on mount
- [03-02]: All 10 behavior categories with Slider components (1-5 scale, defaults to 3)
- [03-02]: Progress bar shows 50% after QOD, 100% after behavior (hidden on celebration/completed)
- [03-02]: Post-completion re-entry shows read-only completed view (not celebration)
- [03-02]: Intermediate celebration for correct QOD answers handled inside QODStep (1.5s delay)
- [03-02]: Daily tab placed between Dashboard and Grades in tab order
- [03-03]: useParentQODStats uses TanStack React Query with time range in queryKey
- [03-03]: Role-conditional Learn tab: parent sees progress dashboard, student sees existing QOD screen
- [03-03]: Accuracy color coding: green >90%, yellow 75-90%, red <75%
- [03-02]: Dashboard task cards disabled when both QOD and behavior are complete
- [03-03]: Student cards NOT tappable -- deep navigation deferred to Phase 6 polish
- [04-01]: Two-step query-then-insert/update for mock purchase (not upsert) to avoid unique constraint issues
- [04-01]: Student gate query uses 5-min staleTime to prevent N+1 inheritance queries
- [04-01]: Mock purchase uses platform: 'apple' to simulate IAP path for Phase 5
- [04-01]: Supabase insert/update data cast as any for pre-migration compat (same pattern as Phases 2-3)
- [04-02]: BillingToggle and PlanCard as local function components in paywall.tsx (not separate files)
- [04-02]: gestureEnabled: false on paywall modal -- X button is intentional dismiss path
- [04-02]: as any cast on Redirect href for /paywall (Expo Router types lag behind file creation)
- [04-03]: Settings subscription section hidden for students (isParent guard)
- [04-03]: Button text: "Manage Subscription" when active, "Subscribe Now" when inactive
- [04-03]: Student limit enforced at both modal open and handleAddStudent (defense in depth)
- [04-03]: Dev debug tools (__DEV__) for testing subscription states
- [05-02]: Mirror stripe-webhook patterns for RevenueCat webhook (structured logging, idempotency, two-step query-then-upsert, HTTP 200 on errors)
- [05-02]: Platform filter IN (apple, google) on status-change updates protects Stripe subscriptions
- [05-02]: PRODUCT_CHANGE reuses handleSubscriptionActive for upgrade/downgrade re-mapping

### Pending Todos

- Apply SQL migration to Supabase: supabase/migrations/20260205_add_iap_subscription_columns.sql
- Apply SQL migration to Supabase: supabase/migrations/20260205_add_student_onboarding_column.sql
- After migrations, regenerate Supabase types and remove type casts in useSubscriptionStatus.ts, useStudentProfile.ts, and celebration.tsx
- Apply SQL migration for streak_count, longest_streak, total_xp, last_qod_date on student_profiles and xp_transactions table
- Deploy revenuecat-webhook edge function: `supabase functions deploy revenuecat-webhook`
- Set webhook secret: `supabase secrets set REVENUECAT_WEBHOOK_AUTH_KEY=<key>`
- Configure webhook URL and auth header in RevenueCat dashboard

### Blockers/Concerns

- RevenueCat webhook + Supabase edge function integration needs testing (Phase 5)
- EAS build with New Architecture enabled may surface compatibility issues (Phase 5)
- SQL migrations must be applied before IAP features, onboarding gate, and XP/streak features work in production

## Session Continuity

Last session: 2026-02-06
Stopped at: Completed 05-02-PLAN.md (RevenueCat Webhook)
Resume file: None
