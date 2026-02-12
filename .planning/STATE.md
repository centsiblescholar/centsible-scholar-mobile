# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Parents and students can do everything on mobile that they can on the web app -- same features, same data, native mobile experience.
**Current focus:** Phase 7 - App Store Preparation

## Current Position

Phase: 7 of 7 (App Store Preparation)
Plan: 0 of TBD (Phase 7 not planned yet)
Status: Ready to plan Phase 7
Last activity: 2026-02-12 -- Completed Phase 6 (all 6 plans)

Progress: [██████████████████████████████████████████] 100% (21/21 plans completed - Phase 6 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: 4.0min
- Total execution time: 83min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 2 | 5min | 2.5min |
| 02-auth-student-routing | 3 | 11min | 3.7min |
| 03-student-daily-experience | 3 | 11min | 3.7min |
| 04-subscription-ui-gates | 3 | 13min | 4.3min |
| 05-iap-wiring | 4 | 9min | 2.3min |
| 06-data-management-ui-polish | 6 | 33min | 5.5min |

**Recent Trend:**
- Last 5 plans: 06-02 (4min), 06-03 (3min), 06-05 (5min), 06-04 (10min), 06-06 (6min)
- Trend: consistent fast execution

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
- [05-01]: RevenueCat configured without appUserID; user identification via logIn() after auth
- [05-01]: Product IDs use com.centsiblescholar.{tier}.{interval} convention
- [05-01]: RC package IDs use standard $rc_monthly and $rc_annual identifiers
- [05-01]: Provider placed inside AuthProvider, outside StudentProvider in layout tree
- [05-01]: Excluded supabase/functions from tsconfig to prevent Deno type errors
- [05-02]: Mirror stripe-webhook patterns for RevenueCat webhook (structured logging, idempotency, two-step query-then-upsert, HTTP 200 on errors)
- [05-02]: Platform filter IN (apple, google) on status-change updates protects Stripe subscriptions
- [05-02]: PRODUCT_CHANGE reuses handleSubscriptionActive for upgrade/downgrade re-mapping
- [05-03]: pollForWebhookConfirmation polls Supabase at 2s intervals with 60s timeout (from REVENUECAT_CONFIG)
- [05-03]: PURCHASE_PENDING is a special error the UI handles differently from other errors
- [05-03]: Cancelled purchases silently caught -- no alert shown to user
- [05-03]: Web subscriber guard only triggers when isActive === true AND platform === 'stripe'
- [05-03]: Restore uses same polling pattern as purchase for consistency
- [05-04]: react-native-purchases v9.7.6 does not export Expo config plugin -- autolinked via native ios/android dirs
- [05-04]: development:device extends development profile with simulator: false for physical device IAP testing
- [06-01]: ThemeColors type uses structural string mapping (not literal types) so both lightTheme and darkTheme satisfy it
- [06-01]: Static commonStyles exports kept alongside factory for backward compatibility during migration
- [06-01]: ESLint rules set to warn (not error) during migration -- change to error after Phase 6 complete
- [06-01]: moti/skeleton Expo variant used (auto-provides LinearGradient) -- no fallback needed
- [06-01]: expo-file-system and expo-sharing installed ahead of Plans 02/03 to avoid duplicate installs
- [06-02]: fflate over JSZip for server-side ZIP creation in Deno (lighter, synchronous API)
- [06-02]: New expo-file-system File API for both JSON (UTF8) and ZIP (base64) writing
- [06-02]: Summary fetched on mount via actual export call (reuses same edge function)
- [06-02]: Privacy section placed between Notifications and App sections in Settings
- [06-03]: auth.admin.deleteUser for cascade (not manual table deletes) -- foreign key CASCADE handles all public table cleanup
- [06-03]: Two-step confirmation (warning + type DELETE) satisfies Apple deletion UX requirements
- [06-03]: Subscription check on both server (edge function) and client (hook) for defense in depth
- [06-03]: Students hidden from Delete Account option via isParent guard in Settings
- [06-05]: createStyles factory + useMemo pattern for all screen-level styles in auth/onboarding/daily
- [06-05]: ProgressDots receive colors as prop (not useTheme) since they are local function components
- [06-05]: BehaviorStep SCORE_COLORS converted to getScoreColors(colors) function from theme tokens
- [06-05]: placeholderTextColor added to all TextInput components for full theme compliance
- [06-04]: ThemeProvider placed inside RevenueCatProvider, outside StudentProvider in layout tree
- [06-04]: RootNavigator extracted as nested component so Stack screenOptions can call useTheme()
- [06-04]: Data visualization colors (chart/score colors) kept as hardcoded hex -- not UI chrome
- [06-04]: ScoreRow in behavior receives colors as prop (local function component, not useTheme)
- [06-04]: Dashboard parent view shows EmptyState when no student selected (not just loading)
- [06-06]: Paywall uses 3 style factories (toggle, card, main) for sub-component complexity
- [06-06]: grade-approval keeps static non-color imports (spacing, textStyles) alongside useTheme() for colors only
- [06-06]: manage-subscription added missing loading/error guards (had none previously)
- [06-06]: Custom context-specific empty states preserved over generic EmptyState component where more helpful

### Pending Todos

**Waiting on Apple/Google approval:**
- Replace RevenueCat API key placeholders in src/constants/revenuecatConfig.ts with real keys from RevenueCat Dashboard
- Configure RevenueCat Dashboard: project, products, offerings, entitlements (see 05-01-SUMMARY.md User Setup Required)
- Deploy revenuecat-webhook edge function: `supabase functions deploy revenuecat-webhook`
- Set webhook secret: `supabase secrets set REVENUECAT_WEBHOOK_AUTH_KEY=<key>`
- Configure webhook URL and auth header in RevenueCat dashboard
- Fill in ascAppId and appleTeamId in eas.json submit configuration
- Create google-service-account.json for Android submission

**Not blocked (can do now):**
- Create migration for xp_transactions table (columns exist, but no migration file for documentation)
- Deploy export-user-data edge function: `supabase functions deploy export-user-data`
- Deploy delete-account edge function: `supabase functions deploy delete-account`

### Blockers/Concerns

- RevenueCat webhook + Supabase edge function integration needs end-to-end testing
- EAS build with New Architecture enabled may surface compatibility issues at build time
- SQL migrations must be applied before IAP features, onboarding gate, and XP/streak features work in production
- EAS submit credentials (Apple Team ID, App Store Connect ID) still need configuration

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 06-06-PLAN.md (Modal/Secondary Screen Theme Migration) -- Phase 6 complete
Resume file: None
