# Project Research Summary

**Project:** Centsible Scholar Mobile - v1.0 App Store Launch
**Domain:** React Native/Expo mobile app for family financial education
**Researched:** 2026-02-05
**Confidence:** HIGH

## Executive Summary

This is a React Native app built on Expo SDK 54 with Supabase backend, preparing for its first App Store and Google Play submission. The app teaches financial literacy to students (grades 1-12) through grade-based rewards, behavioral assessments, and educational content, managed by parent accounts. The project needs to add seven critical features before launch: in-app purchase subscriptions, password reset flow, independent student dashboard with role-based routing, subscription gates enforcing premium features, data export/deletion (Apple requirement), UI polish across all screens, and App Store assets/metadata.

The recommended approach prioritizes architectural decisions first (unified subscription schema supporting both Stripe and IAP, role-based routing separating parent and student experiences), then builds in phases that maximize use of Expo Go during development before transitioning to EAS development builds only when IAP testing requires it. RevenueCat is the clear choice for IAP implementation, eliminating 2-4 weeks of server-side receipt validation work and providing Expo Go preview mode. Password reset should use OTP-based flow (6-digit code) instead of deep links to avoid weeks of debugging platform-specific linking issues. The student routing architecture uses conditional tab visibility within a single route group rather than duplicating screens across separate groups.

Key risks include: Apple rejection for Stripe payment references (Guideline 3.1.1 - all must be removed), account deletion missing (Guideline 5.1.1 - mandatory for App Store), subscription state desync between web (Stripe) and mobile (IAP) platforms, students seeing parent UI due to missing role detection, and COPPA compliance for children's data. These are all preventable through proper architecture and feature gating before submission. The roadmap should front-load architectural decisions, build non-IAP features first in Expo Go, then transition to development builds for IAP testing in the final phase.

## Key Findings

### Recommended Stack

All v1.0 features integrate with the existing stack (React Native 0.81.5, Expo SDK 54, Supabase, TanStack Query, Expo Router 6). Only four new packages are needed: `react-native-purchases` v9.7.6 (RevenueCat SDK for IAP), `react-native-purchases-ui` (paywall UI components), `expo-file-system` v19.0.21 (data export), and `expo-sharing` v14.0.8 (share sheet). The project should NOT add `react-native-iap` or `expo-iap` (require custom receipt validation), NativeWind or Tamagui (unnecessary - theme system already comprehensive), or any CSV generation library (manual formatting is sufficient for simple tabular data).

**Core technologies for v1.0 features:**
- **RevenueCat (`react-native-purchases`)** - IAP subscription management with server-side receipt validation built-in, eliminating need for custom edge functions. Free up to $2.5K monthly revenue. Provides Preview API Mode in Expo Go for UI development before dev build is required. Handles cross-platform subscription sync via webhooks.
- **Existing Supabase SDK** - Password reset via `resetPasswordForEmail()` with OTP-based flow (recommended over deep links). Account deletion via new `delete-account` edge function using `service_role` key.
- **Expo Router file-based routing** - Role-based navigation using conditional tab visibility (`href: null`) within single `(tabs)` group. No additional routing library needed.
- **expo-file-system + expo-sharing** - Client-side data export (CSV/JSON) and native share sheet. Both work in Expo Go. Note: SDK 54 introduced new object-oriented FileSystem API; use `File` and `Paths` instead of legacy `readAsStringAsync`.

**Critical version notes:**
- `react-native-iap` is currently v14.x (not v15.x as sometimes referenced)
- `expo-file-system` SDK 54 has breaking API changes - use new `File(Paths.cache, 'filename')` pattern
- RevenueCat v9.7.6 published Feb 3, 2026 - actively maintained

### Expected Features

v1.0 must deliver eight table-stakes features (rejection or unusable product without them) and two strong differentiators. Defer budgeting, analytics reports, and dark mode to post-launch.

**Must have (table stakes):**
- **AUTH-04: Password reset flow** - Forgot password link on login screen. OTP-based recommended (6-digit code via email) to avoid deep link complexity. Two screens: email input, code + new password entry. Supabase SDK already supports this via `type: 'otp'` parameter.
- **DASH-03: Independent student dashboard** - Students have real auth accounts and sign in independently. Role detection determines parent vs student routing. Student dashboard shows personalized stats (GPA, earnings, streak, behavior score), today's tasks (QOD, assessment), and achievement badges. Separate tab bar with 5 tabs: Dashboard, Grades, Behavior, Learn, Settings.
- **SUB-01: IAP subscription flow** - Native in-app purchase via Apple/Google. Three tiers: Standard (1 student), Premium (3 students), Family (5 students). Paywall shows plan comparison, monthly/annual toggle, 7-day free trial, Restore Purchases button, Terms/Privacy links (all required by Apple Guideline 3.1.2).
- **SUB-02: Subscription gates** - Free tier allows 1 student, basic grade view, daily QOD. Premium unlocks grade entry, behavior analytics, earnings calculation, savings goals, reports, additional students. Two-tier gating: navigation-level (paywall blocks app entry) and feature-level (upgrade prompt for locked features).
- **SUB-03: Restore Purchases** - Required by Apple. Settings screen includes "Restore Purchases" button calling `Purchases.restorePurchases()`. Also "Manage Subscription" linking to platform-native settings.
- **DATA-01: Account deletion + data export** - Apple Guideline 5.1.1 mandate. Settings has "Delete Account" flow with warning, confirmation, Supabase edge function cascade delete. Also "Download My Data" exporting JSON with all user tables (profiles, students, grades, assessments, subscriptions).
- **STYLE-01/02: UI polish** - No placeholder text, consistent theme application, loading/error/empty states on every screen, keyboard handling, safe area compliance, accessibility (44pt touch targets), responsive design (iPhone SE to Pro Max).
- **STORE-01/02: App Store assets** - App icon (1024x1024), splash screen, screenshots (1290x2796 for iPhone, 2048x2732 for iPad), privacy policy URL, support URL, age rating, review notes with demo credentials.

**Should have (competitive differentiators):**
- **DASH-04: Combined daily assessment** - Single "morning check-in" flow merging QOD answer and behavior self-assessment. Swipeable card interface with progress indicator and celebration animation. Reduces friction vs competitors requiring separate actions.
- **QOD-04: Parent QOD progress view** - Family-wide education dashboard showing total XP, average correct percentage, active streaks, today's completion status. Per-student cards with individual stats.

**Defer (v2+):**
- Budget planner (BUDGET-01/02)
- Analytics reports (REPORT-01)
- Printable reports (REPORT-03)
- Financial education hub content expansion (FINED-01)
- Dark mode (theme system supports it but doubles QA surface)
- iPad-optimized layouts (phone-first design scales up via supportsTablet: true)

### Architecture Approach

The app uses a layered provider architecture with clear separation of concerns. AuthContext handles Supabase auth sessions, a new RoleContext (replacing StudentContext) detects parent vs student via table queries and manages multi-student selection, SubscriptionGateProvider wraps subscription status checking and exposes entitlement logic, and TanStack Query manages all server state. File-based Expo Router with route groups handles navigation; conditional tab visibility via `href: null` shows/hides tabs per role without duplicating screens. All features except IAP purchase execution work in Expo Go; development builds required only for real StoreKit/Play Billing integration.

**Major components:**
1. **RoleContext (new)** - Consolidates role detection (queries `parent_profiles` then `student_profiles`), exposes `role: 'parent' | 'student'`, manages `selectedStudent` for parents and `studentProfile` for students. Replaces current `StudentContext` which assumes parent-only users.
2. **SubscriptionGateProvider (new)** - Wraps `useSubscriptionStatus`, provides `isSubscribed`, `subscriptionTier`, `canAddStudent`, `maxStudents`, `showPaywall()` method. Implements two-tier gating: navigation-level in `app/index.tsx` redirects and feature-level via `<SubscriptionGate>` wrapper component.
3. **IAP integration via RevenueCat** - `useIAPSubscription` hook wraps RevenueCat SDK, `revenuecat-webhook` Supabase edge function syncs subscription events to `user_subscriptions` table (extended with `iap_source`, `iap_product_id`, `revenuecat_customer_id` columns). Works alongside existing Stripe subscriptions for web - unified entitlement table serves both platforms.
4. **Password reset via OTP** - Two screens in `(auth)` group: `forgot-password.tsx` calls `supabase.auth.resetPasswordForEmail(..., { type: 'otp' })`, user receives 6-digit code by email, `reset-password.tsx` accepts code + new password, calls `supabase.auth.verifyOtp()`. Avoids deep linking complexity entirely.
5. **Data export via client-side generation** - `useDataExport` hook assembles data from existing React Query hooks, generates CSV strings manually for tabular data (grades, assessments, earnings) or HTML templates for PDF via `expo-print.printToFileAsync()`, shares via `expo-sharing.shareAsync()`. All works in Expo Go.

**Key architectural decisions:**
- Use single `(tabs)` route group with conditional tab visibility, NOT separate `(parent-tabs)` and `(student-tabs)` groups (avoids screen duplication and deep link fragmentation)
- Extend `user_subscriptions` table to support dual billing sources (Stripe for web, IAP for mobile) with unified entitlement logic
- OTP-based password reset over deep links (eliminates AASA file, Universal Links, custom scheme handling complexity)
- Client-side data export over server-side PDF generation (simpler, works in Expo Go, sufficient for v1.0 compliance)
- RevenueCat Preview API Mode allows paywall UI development in Expo Go; only transition to dev build when ready for real purchase testing

### Critical Pitfalls

20 pitfalls documented across critical, moderate, and minor severity. Top 5 highest-impact pitfalls that must be addressed before corresponding implementation phases:

1. **Stripe-only subscription schema blocks IAP integration** - Current `user_subscriptions` table has `stripe_customer_id` and `stripe_subscription_id` columns. Adding IAP requires extending schema with `payment_source` enum ('stripe' | 'apple' | 'google'), `iap_product_id`, `iap_original_transaction_id`, or creating unified `entitlements` abstraction. `useSubscriptionStatus` hook currently reads `stripe_customer_id` directly and must be refactored to check entitlement status regardless of source. RevenueCat provides webhook integration pattern. This architectural decision gates all IAP work.

2. **No role-based routing - students see parent UI** - Current `app/index.tsx` redirects ALL authenticated users to `/(tabs)/dashboard` with no role check. Students see parent dashboard with "Manage Students," grade approval, subscription management. `StudentContext` assumes parent and calls `useParentStudents()` which returns empty for student users. Must check `user.user_metadata.user_type` in root redirect and use conditional tab visibility or separate layouts. Add RLS policies preventing students from accessing parent-only data even if client routing bypassed.

3. **Password reset deep links fail silently in React Native** - Supabase email contains magic link. In RN this requires: custom URL scheme (`centsiblescholar://`) in Supabase allow list, handling app killed vs background state, Expo Go adds `/--/` path breaking production behavior, Universal Links need AASA file on domain. Multiple failure points. SOLUTION: Use OTP-based reset instead (`type: 'otp'` parameter) - user receives 6-digit code, enters in app with new password. Avoids all deep linking complexity. Multiple developers documented switching from deep links to OTP for this exact reason.

4. **Apple rejects Stripe payment references (Guideline 3.1.1)** - Digital goods must use IAP. Any UI text, link, or flow directing to "manage subscription on website" triggers rejection. Current `useSubscriptionStatus` and settings wired to Stripe. Must remove ALL Stripe/external payment references from mobile UI. "Manage Subscription" must open iOS system settings (`Linking.openURL('https://apps.apple.com/account/subscriptions')`). For web subscribers: show "Active subscription" without clickable link to payment page.

5. **Account deletion via web link gets rejected** - Apple Guideline 5.1.1(v) requires in-app deletion since 2022. Must build native flow: confirmation dialog, data download offer, Supabase edge function cascade delete (child records → parent records → auth user via `supabase.auth.admin.deleteUser()`). For parent accounts: ask whether to delete associated students or unlink. Sign out after deletion. Web redirect not acceptable.

**Additional critical pitfalls:**
- Kids Category decision cascades through entire app (if chosen: no analytics SDKs, no external links without parental gates). RECOMMENDATION: Do NOT use Kids Category. Position as parenting/family tool, age rating 12+, target audience parents (18+).
- Subscription state desync between web (Stripe) and mobile (IAP) - need unified entitlement layer, RevenueCat's `appUserID` set to Supabase `user.id` links subscriptions cross-platform
- IAP receipt validation race condition with RLS - edge function should return validated subscription record directly, use `setQueryData` to optimistically update cache, add polling mechanism (check every 2s for 10s)
- Expo Go cannot test IAP, push notifications, or deep links - switch to EAS development builds at START of IAP phase, budget 2-3 days for first successful build
- EAS environment variables missing in production - `.env` not included in builds. Set EAS secrets: `eas secret:create --name EXPO_PUBLIC_SUPABASE_URL`

## Implications for Roadmap

Based on research, suggested phase structure optimizes for dependency order, Expo Go compatibility, and pitfall avoidance:

### Phase 1: Architecture Foundation
**Rationale:** Architectural decisions gate all feature work. Schema extensions, role detection, and subscription abstraction must be resolved before writing implementation code. This phase has no UI but unblocks all downstream work.

**Delivers:**
- Extended `user_subscriptions` table schema with `payment_source`, `iap_product_id`, `revenuecat_customer_id` columns
- Database migration for dual billing source support
- `RoleContext` replacing `StudentContext` with unified role detection (queries parent_profiles → student_profiles)
- Root redirect logic in `app/index.tsx` checking `user_type`
- Refactored `useSubscriptionStatus` to abstract over payment source

**Addresses:**
- Pitfall 1 (Stripe schema blocks IAP)
- Pitfall 4 (no role-based routing)

**Avoids:** Weeks of rework if IAP or student routing implemented against wrong schema

**Research needs:** SKIP - architecture patterns well-documented, schema extension straightforward

---

### Phase 2: Password Reset + Role-Based UI
**Rationale:** Both are Expo Go compatible, build on Phase 1's RoleContext, and are standalone features with no IAP dependency. Password reset is high user-facing value (users get locked out). Student routing is foundational for student-specific features.

**Delivers:**
- `app/(auth)/forgot-password.tsx` - email input, sends OTP code
- `app/(auth)/reset-password.tsx` - code + new password entry
- Supabase `resetPasswordForEmail(..., { type: 'otp' })` and `verifyOtp()` integration
- Conditional tab visibility in `app/(tabs)/_layout.tsx` using `href: null`
- Parent sees: Dashboard, Grades, Behavior, Earnings, Settings
- Student sees: Dashboard, Grades, Behavior, Learn, Settings
- Parent-initiated student password reset in parent dashboard

**Addresses:**
- AUTH-04 (password reset flow - table stakes)
- DASH-03 (independent student dashboard - table stakes)
- Pitfall 3 (password reset deep links - OTP approach avoids this)
- Pitfall 10 (student vs parent password reset)

**Uses:**
- RoleContext from Phase 1
- Existing Supabase SDK, no new packages
- Expo Router conditional routing

**Research needs:** SKIP - Supabase auth patterns well-documented, Expo Router tab visibility is standard pattern

---

### Phase 3: Subscription Infrastructure (UI Only)
**Rationale:** Build all subscription UI and logic in Expo Go before transitioning to dev builds. RevenueCat Preview API Mode provides mock data for paywall development. SubscriptionGateProvider built now, wired to real IAP in Phase 4.

**Delivers:**
- `SubscriptionGateContext` provider with `isSubscribed`, `tier`, `canAddStudent`, `showPaywall()`
- `app/paywall.tsx` - plan cards, monthly/annual toggle, feature comparison, free trial disclosure, Restore Purchases button, Terms/Privacy links
- `<SubscriptionGate>` wrapper component for feature-level gating
- `<UpgradePrompt>` component for locked features
- Subscription check in `app/index.tsx` (mocked for now, real in Phase 4)
- Static RevenueCat SDK integration (Preview API Mode active in Expo Go)

**Addresses:**
- SUB-02 (subscription gates - table stakes)
- SUB-03 (restore purchases - table stakes)
- Pitfall 7 (gate placement strategy - implement free vs premium split)
- Pitfall 14 (paywall disclosures - build compliance from start)

**Uses:**
- Phase 1's refactored `useSubscriptionStatus`
- `react-native-purchases` SDK (install now, Preview Mode in Expo Go)

**Research needs:** SKIP - RevenueCat Expo integration well-documented, paywall compliance requirements clear from Apple guidelines

---

### Phase 4: IAP Wiring + EAS Build Transition
**Rationale:** This is the only phase requiring EAS development builds. Isolated to minimize dev build dependency. All UI from Phase 3 already built. This phase connects paywall to real StoreKit/Play Billing.

**Delivers:**
- RevenueCat account setup, product configuration matching existing Stripe tiers
- `useIAPSubscription` hook wrapping RevenueCat `Purchases.purchasePackage()`
- `supabase/functions/revenuecat-webhook/` edge function for subscription sync
- EAS development build configuration and first successful builds (iOS + Android)
- Sandbox IAP testing with test accounts
- Real purchase → receipt validation → entitlement unlock flow
- Cross-platform subscription sync (web Stripe ↔ mobile IAP)

**Addresses:**
- SUB-01 (IAP subscription flow - table stakes)
- Pitfall 2 (remove Stripe references from mobile UI)
- Pitfall 8 (receipt validation race condition - design purchase flow with retry/polling)
- Pitfall 9 (Expo Go cannot test IAP - transition to dev builds)
- Pitfall 12 (subscription state desync - RevenueCat appUserID = Supabase user.id)
- Pitfall 13 (EAS env vars - set as secrets)
- Pitfall 15 (New Architecture compatibility - verify react-native-purchases supports it)

**Uses:**
- Phase 1's unified subscription schema
- Phase 3's paywall UI and gate logic

**Research needs:** MEDIUM - RevenueCat webhook integration with Supabase edge functions is well-documented but needs testing. EAS build configuration may have project-specific issues. Budget time for sandbox testing and debugging.

---

### Phase 5: Data Export + Deletion
**Rationale:** Independent of IAP, works in Expo Go. Apple requirement for submission. Can be built in parallel with earlier phases if resources available.

**Delivers:**
- `app/export-report.tsx` - report type selector (Term Report, Progress Snapshot, Grades/Behavior/Earnings CSV), date range picker, format selector (PDF/CSV)
- `useDataExport` hook assembling data from existing React Query hooks
- CSV generation utilities for grades, behavior assessments, earnings
- PDF generation with HTML templates via `expo-print.printToFileAsync()`
- Native share sheet via `expo-sharing.shareAsync()`
- `supabase/functions/delete-account/` edge function with cascade deletion
- "Delete Account" flow in settings: warning screen, "Download My Data" prompt, confirmation, deletion + sign out
- Comprehensive data export covering all user tables (parent_profiles, student_profiles, grades, assessments, subscriptions, settings, etc.)

**Addresses:**
- DATA-01 (account deletion + export - table stakes, Apple requirement)
- Pitfall 5 (account deletion required for App Store)
- Pitfall 11 (data export completeness - map all user tables)

**Uses:**
- `expo-file-system`, `expo-sharing`, `expo-print` (new SDK 54 FileSystem API: `File(Paths.cache, 'filename')`)

**Research needs:** SKIP - Expo SDK APIs well-documented, data export patterns straightforward

---

### Phase 6: UI Polish + Student Features
**Rationale:** After core infrastructure complete, apply consistent styling and build differentiator features. This phase finalizes the app for screenshot capture.

**Delivers:**
- Audit all screens for theme consistency (no hardcoded colors, use theme tokens)
- Shared component library: `Button`, `Card`, `Input`, `Badge`, `Modal`, `StatusIndicator`
- Loading/error/empty states on every data-fetching screen
- Keyboard handling (`KeyboardAvoidingView`), safe area compliance
- Accessibility: 44pt touch targets, contrast ratios
- DASH-04: Combined daily assessment flow (swipeable cards for QOD + behavior, progress indicator, celebration animation)
- QOD-04: Parent QOD progress view (family stats, per-student cards)

**Addresses:**
- STYLE-01/02 (UI polish - table stakes for App Store review)
- DASH-04 (daily assessment - differentiator)
- QOD-04 (parent QOD progress - differentiator)

**Uses:**
- Existing theme system (`src/theme/`)
- Existing data hooks

**Research needs:** SKIP - UI polish is standard React Native work, no novel patterns

---

### Phase 7: App Store Preparation
**Rationale:** Final phase before submission. Depends on Phase 6 UI being complete for screenshots. Asset creation and metadata writing.

**Delivers:**
- Final app icon (1024x1024 PNG no transparency for iOS, transparency OK for Android adaptive icon)
- Splash screen image and configuration
- Store screenshots (1290x2796 iPhone, 2048x2732 iPad if supported)
- Google Play feature graphic (1024x500)
- App Store metadata: name, subtitle, description, keywords, age rating, privacy policy URL, support URL
- Review notes explaining dual user types (parent/student), test account credentials (parent + student)
- Privacy Nutrition Labels: name, email, grades/assessments (user content), no tracking
- COPPA section in privacy policy (parent creates student accounts = verifiable parental consent)
- Production EAS builds (`eas build --profile production --platform all`)
- Submission via `eas submit` or manual App Store Connect / Play Console

**Addresses:**
- STORE-01/02 (App Store assets - table stakes)
- Pitfall 6 (Kids Category - decision: do NOT use, position as parenting tool, age 12+)
- Pitfall 16 (demo account with rich data)
- Pitfall 17 (finance disclaimer - clarify simulated/educational in review notes)

**Uses:**
- EAS build and submit configuration
- Updated `eas.json` with real Apple/Google credentials (replace placeholders)

**Research needs:** SKIP - Expo asset requirements well-documented, submission process standard

---

### Phase Ordering Rationale

- **Phase 1 first:** Architectural decisions (schema, role detection) gate all downstream work. Schema migrations must happen before any IAP or student routing code written. Zero UI work but highest leverage.
- **Phase 2 early:** Password reset and student routing are Expo Go compatible, build on Phase 1 foundation, high user value, no IAP dependency. Gets student experience functional early for testing.
- **Phase 3 before 4:** Build subscription UI in Expo Go using RevenueCat Preview Mode. Paywall, gates, upgrade prompts all testable without dev build. Only connect to real IAP in Phase 4.
- **Phase 4 isolated:** EAS development builds required only for this phase. By isolating IAP wiring, team continues using Expo Go for all other development. Budget extra time here for EAS build debugging and sandbox testing.
- **Phase 5 parallel-ready:** Data export/deletion is independent and Expo Go compatible. Can run parallel to Phases 3-4 if resources available. Must complete before submission.
- **Phase 6 after core features:** UI polish comes after features functional. Provides stable foundation for screenshot capture.
- **Phase 7 final:** App Store assets and metadata require final UI. Submission preparation is last step.

**Expo Go vs Dev Build strategy:**
- Phases 1, 2, 3, 5, 6: Expo Go development (fast iteration)
- Phase 4: Transition to EAS development builds (IAP testing requirement)
- Phase 7: Production builds for submission

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 7. Phase 5 and Phase 6 can start after Phase 3 completes if parallel work desired.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (IAP Wiring):** RevenueCat webhook integration with Supabase edge functions is conceptually straightforward but may have implementation gotchas. Subscription state sync logic across Stripe/IAP requires testing. EAS build configuration for New Architecture + IAP libraries may surface compatibility issues. Budget time for sandbox testing and cross-platform validation.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Architecture):** Database schema extensions, React context patterns, role-based routing all well-documented
- **Phase 2 (Password Reset + Routing):** Supabase auth OTP flow documented, Expo Router conditional tabs standard
- **Phase 3 (Subscription UI):** RevenueCat Expo integration officially documented, paywall compliance requirements clear from Apple guidelines
- **Phase 5 (Data Export):** Expo SDK APIs (print, sharing, filesystem) well-documented, CSV/PDF generation straightforward
- **Phase 6 (UI Polish):** Standard React Native styling work, no novel patterns
- **Phase 7 (App Store Prep):** Expo asset guidelines clear, submission process documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against npm registry, official Expo/Supabase docs, and RevenueCat documentation. Version numbers confirmed current as of Feb 2026. SDK 54 FileSystem API breaking change noted. RevenueCat free tier and Preview Mode confirmed. |
| Features | HIGH | Table stakes features verified against Apple App Store Review Guidelines (3.1.1, 3.1.2, 5.1.1) and Google Play policies. Feature prioritization based on mandatory vs differentiator analysis. Defer recommendations aligned with MVP principles. |
| Architecture | HIGH | Integration patterns verified in Expo Router docs, RevenueCat Expo guide, Supabase auth documentation. RoleContext pattern standard React. Conditional tab visibility documented Expo Router feature. OTP-based password reset recommended by multiple community sources who migrated from deep links. |
| Pitfalls | HIGH for critical pitfalls, MEDIUM for moderate | Critical pitfalls 1-6 verified via codebase inspection (useSubscriptionStatus.ts, app/index.tsx, StudentContext.tsx), Apple guidelines, and Expo documentation. Deep link issues extensively documented in Supabase GitHub discussions and community blogs. Moderate pitfalls based on community experience and regulatory requirements (GDPR/CCPA/COPPA). |

**Overall confidence:** HIGH

Research synthesized from official documentation (Expo, Supabase, Apple, RevenueCat), verified community sources (LogRocket comparison, COPPA compliance guides, App Store rejection analysis), and direct codebase inspection (TypeScript types, existing hooks, context providers, routing structure). All package versions and capabilities verified as of Feb 2026. Phase suggestions based on dependency analysis and Expo Go compatibility matrix.

### Gaps to Address

While confidence is high, some areas need validation during implementation:

- **RevenueCat webhook → Supabase edge function integration:** Pattern is documented but project-specific implementation (exact payload mapping, error handling, subscription status translation from RevenueCat to Supabase schema) needs testing. Build into Phase 4 with time for iteration.

- **EAS build configuration with New Architecture enabled:** The project has `newArchEnabled: true`. RevenueCat SDK claims New Architecture support but specific compatibility with Expo SDK 54 + React Native 0.81.5 + RevenueCat v9.7.6 combination should be verified in first dev build. Phase 4 should budget extra time for potential build issues.

- **Cross-platform subscription entitlement sync:** Unified entitlement approach (user subscribes on web via Stripe, sees premium access on mobile, and vice versa) requires careful webhook ordering and cache invalidation. Design decision in Phase 1, implementation in Phase 4, testing critical.

- **COPPA compliance for student data:** Legal gray area because parents create student accounts (verifiable parental consent model) but students have independent auth credentials. Privacy policy should explicitly document parent consent mechanism. Consider legal review before submission, especially if marketing mentions students under 13.

- **Apple-app-site-association file for Universal Links:** Current app.json declares `associatedDomains: ["applinks:centsiblescholar.com"]` but AASA file on domain may not exist. If using OTP-based password reset (recommended), Universal Links not needed for v1.0. If adding deep linking later, verify AASA file is correctly hosted at `https://centsiblescholar.com/.well-known/apple-app-site-association`.

- **Student limit enforcement:** Database has `get_max_students_allowed()` function and `validate_student_limit()` RLS policy. Verify these are correctly wired to subscription gates in Phase 3-4. Prevent parent from creating students beyond tier limit via UI gate AND server-side RLS policy.

## Sources

### Primary (HIGH confidence)
- [Expo In-App Purchases Guide](https://docs.expo.dev/guides/in-app-purchases/) - Official Expo recommendation for IAP libraries, RevenueCat as primary option
- [RevenueCat Expo Installation](https://www.revenuecat.com/docs/getting-started/installation/expo) - SDK setup, Preview API Mode documentation, Expo Go compatibility
- [RevenueCat Pricing](https://www.revenuecat.com/pricing/) - Free tier $2.5K MTR confirmed
- [RevenueCat Webhooks](https://www.revenuecat.com/docs/integrations/webhooks) - Webhook event types and integration pattern
- [Expo + RevenueCat Tutorial](https://expo.dev/blog/expo-revenuecat-in-app-purchase-tutorial) - Official Expo blog
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) - Guideline 3.1.1 (IAP requirement), 3.1.2 (subscription disclosures), 5.1.1 (account deletion requirement)
- [Apple Account Deletion Requirement](https://developer.apple.com/support/offering-account-deletion-in-your-app/) - Guideline 5.1.1(v) enforcement since 2022
- [Supabase Password Reset](https://supabase.com/docs/guides/auth/passwords) - resetPasswordForEmail flow, OTP type parameter
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) - Deep link configuration, known issues
- [Expo Router Layouts](https://docs.expo.dev/router/basics/layout/) - Route group configuration
- [Expo Router Custom Tabs](https://docs.expo.dev/router/advanced/custom-tabs/) - Conditional tab visibility via href: null
- [Expo FileSystem SDK 54](https://docs.expo.dev/versions/latest/sdk/filesystem/) - New object-oriented API, breaking changes
- [Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) - Share sheet integration
- [Expo Print](https://docs.expo.dev/versions/latest/sdk/print/) - PDF generation
- [Expo Go vs Development Builds](https://expo.dev/blog/expo-go-vs-development-builds) - Capability comparison, when to transition
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/) - EAS secrets configuration
- [Expo Splash Screen and App Icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) - Asset specifications
- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) - Required sizes and formats

### Secondary (MEDIUM confidence)
- [Why I Ditched Deep Linking for Token-Based Password Reset in Supabase](https://dev.to/tanmay_kaushik_/why-i-ditched-deep-linking-for-a-token-based-password-reset-in-supabase-3e69) - Community experience OTP vs deep links
- [LogRocket: Best React Native IAP Libraries](https://blog.logrocket.com/best-react-native-in-app-subscription-libraries/) - RevenueCat vs react-native-iap comparison
- [Galaxies.dev: Role-Based Navigation in Expo Router](https://galaxies.dev/react-native-role-based-navigation) - Conditional routing patterns
- [COPPA Compliance 2025 Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/) - Children's privacy requirements
- [Apple Guideline 3.1.2 Explained](https://www.angularcorp.com/en/insights/apple-guideline-3-1-2-subscription-rejection-missing-links/) - Paywall disclosure requirements
- [App Store Review Guidelines Checklist](https://nextnative.dev/blog/app-store-review-guidelines) - Common rejection reasons
- [Supabase User Self-Deletion](https://blog.mansueli.com/supabase-user-self-deletion-empower-users-with-edge-functions) - Edge function pattern for account deletion
- [RevenueCat Community: Supabase Integration](https://community.revenuecat.com/third-party-integrations-53/integrating-revenuecat-financial-data-to-activate-functionality-in-supabase-backend-4187) - Webhook integration discussion

### Tertiary (LOW confidence, validation needed)
- [Supabase Discussion #33633: Deep Link Inconsistency](https://github.com/orgs/supabase/discussions/33633) - Edge case behaviors
- [Supabase JS Issue #843](https://github.com/supabase/supabase-js/issues/843) - URL fragment parsing issue (may be resolved in current version)

### Codebase Analysis (HIGH confidence)
- `/Users/robertisrael/Documents/GitHub/centsible-scholar-mobile/` - Mobile app codebase
- `/Users/robertisrael/Documents/GitHub/centsible-scholar-premium/` - Web app reference
- `src/hooks/useSubscriptionStatus.ts` - Stripe-specific subscription logic confirmed
- `src/integrations/supabase/types.ts` - `user_subscriptions` schema with Stripe columns confirmed
- `app/index.tsx` - No role-based routing confirmed (lines 17-21 only check user existence)
- `src/contexts/StudentContext.tsx` - Assumes parent user type, calls `useParentStudents()`
- `app.json` - Verified: `newArchEnabled: true`, `scheme: "centsiblescholar"`, `associatedDomains: ["applinks:centsiblescholar.com"]`
- `eas.json` - Placeholder values for ascAppId, appleTeamId confirmed

---
*Research completed: 2026-02-05*
*Ready for roadmap: yes*
