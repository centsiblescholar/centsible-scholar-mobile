# Feature Landscape: v1.0 App Store Launch Features

**Domain:** Mobile financial literacy app for families (React Native / Expo)
**Researched:** 2026-02-05
**Focus:** Launch-critical features for Apple App Store and Google Play submission
**Confidence:** MEDIUM-HIGH (verified against official docs, web app reference, and current ecosystem)

---

## Table Stakes

Features that must ship for App Store launch. Missing any of these means rejection or unusable product.

### AUTH-04: Password Reset / Forgot Password Flow

| Attribute | Detail |
|-----------|--------|
| Why Expected | Users forget passwords. App Store reviewers test this. Without it, locked-out users are lost forever. |
| Complexity | Medium (deep linking is the hard part, not the UI) |
| Dependencies | Supabase auth (`resetPasswordForEmail`), deep linking via `expo-linking`, URL scheme already configured (`centsiblescholar://`) |

**Expected UX Flow (verified against [Supabase docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)):**

1. User taps "Forgot Password?" on login screen
2. Email input screen appears -- user enters email, taps "Send Reset Link"
3. App calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })` where `redirectTo` uses `Linking.createURL('reset-password')`
4. Supabase sends email with magic link containing access/refresh tokens
5. User taps link in email -- deep link opens app at reset-password screen
6. App extracts tokens from URL via `Linking.useURL()`, calls `supabase.auth.setSession()` to establish session
7. User enters new password, app calls `supabase.auth.updateUser({ password: newPassword })`
8. Success confirmation, redirect to dashboard

**Known Complications (verified via [GitHub discussions](https://github.com/supabase/supabase-js/issues/843) and [Supabase deep linking docs](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)):**

- Supabase sends tokens as URL fragments (`#access_token=...`), but React Native `Linking` only parses query parameters (`?`). Must manually parse the fragment.
- Deep links may not work consistently when app is in background vs killed state. Need to handle both `Linking.useURL()` (cold start) and `Linking.addEventListener` (warm resume).
- iOS Universal Links require `associatedDomains` config (already present in app.json: `applinks:centsiblescholar.com`) plus an `apple-app-site-association` file on the domain.
- For development/testing, custom scheme (`centsiblescholar://`) works in Expo Go; Universal Links require a production build.
- The `PASSWORD_RECOVERY` event fires on `onAuthStateChange` when the reset link is clicked -- can use this as an alternative to URL parsing.

**What NOT to build:**
- SMS-based reset (adds complexity, not standard for this app type)
- Security questions (outdated pattern)
- Admin manual reset UI (web-only concern, Recovery.tsx in web app is for admin use)

---

### DASH-03: Independent Student Dashboard

| Attribute | Detail |
|-----------|--------|
| Why Expected | Students have real auth accounts and can sign in independently. They need to see their own data, not the parent view. |
| Complexity | Medium (data hooks exist; work is UI + routing differentiation) |
| Dependencies | Role detection (needs `useUnifiedUserRole` hook ported from web app), existing data hooks, Expo Router layout groups |

**Expected UX Behavior (informed by [web app reference](file:///Users/robertisrael/Documents/GitHub/centsible-scholar-premium/src/pages/DashboardStudent.tsx) and [role-based navigation patterns](https://galaxies.dev/react-native-role-based-navigation)):**

1. Student signs in with email/password (login screen is shared)
2. App detects role by checking `student_profiles` table for the user's ID (web app pattern: check student first, then parent)
3. Router directs student to `(student-tabs)` layout group instead of `(tabs)` (parent layout)
4. Student dashboard shows:
   - Personalized welcome with name and avatar/emoji
   - 4 stat cards: Current GPA, Total Earnings, Day Streak, Behavior Score
   - "Today's Tasks" section: QOD prompt (if not answered today), behavior self-assessment button
   - Quick action buttons: Enter Grades, View Earnings, Savings Goals
   - Achievement badges: Honor Roll, Streak Master, Top Performer
5. Student-specific tab bar with 4-5 tabs: Dashboard, Grades, Earnings, Learn, Settings

**Role-Based Navigation Architecture:**

The web app uses `useUnifiedUserRole()` which queries `student_profiles` then `parent_profiles` to determine role. For mobile with Expo Router:

- Option A: Single `(tabs)` group with conditional rendering per role -- simpler but messier
- Option B: Separate `(tabs)` and `(student-tabs)` layout groups -- cleaner separation, recommended

**Recommendation:** Option B. Separate layout groups. The `_layout.tsx` root checks role after auth and routes to appropriate group. This matches the Expo Router pattern for role-based navigation and keeps parent/student code cleanly separated.

**Student Tab Structure:**
| Tab | Screen | Purpose |
|-----|--------|---------|
| Dashboard | Home view with stats, today's tasks, achievements | Landing screen |
| Grades | Grade list, GPA chart, grade entry form | Academic tracking |
| Earnings | Earnings summary, allocation breakdown, savings goals | Financial overview |
| Learn | Daily QOD, financial education content | Education hub |
| Settings | Profile view, notification preferences, sign out | Account management |

---

### SUB-01: In-App Purchase Subscription Flow

| Attribute | Detail |
|-----------|--------|
| Why Expected | Revenue model. Cannot monetize without IAP. Apple/Google mandate their billing systems for digital goods. |
| Complexity | HIGH (requires EAS build, native library, server-side validation, product configuration in App Store Connect and Google Play Console) |
| Dependencies | EAS build infrastructure (cannot use Expo Go), IAP library, Supabase edge function for receipt validation, `user_subscriptions` table (exists) |

**Library Recommendation: RevenueCat (`react-native-purchases`)**

After evaluating the options (verified via [Expo IAP docs](https://docs.expo.dev/guides/in-app-purchases/), [LogRocket comparison](https://blog.logrocket.com/best-react-native-in-app-subscription-libraries/)):

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **RevenueCat** (`react-native-purchases`) | Free up to $10K MTR; handles receipt validation server-side; analytics dashboard; subscription status tracking; Expo compatible with config plugin | Vendor dependency; costs money at scale (1-2.5% after $10K) | **RECOMMENDED** |
| **expo-iap** | Tighter Expo integration; Expo Module; OpenIAP compliant | Newer, less mature ecosystem; no built-in analytics; you handle receipt validation | Good alternative |
| **react-native-iap** | Free; most weekly downloads; flexible | No receipt validation -- must build your own backend; more development work | Not recommended for small team |

**Why RevenueCat:** For a small team launching v1.0, the biggest risk is building and maintaining server-side receipt validation, handling edge cases (refunds, grace periods, upgrades/downgrades, family sharing), and debugging purchase issues. RevenueCat handles all of this for free until $10K monthly revenue. The cost at scale (1-2.5%) is worth the engineering time saved.

**Expected UX Flow:**

1. **Paywall Screen:** Shown after signup or when non-subscriber accesses gated feature
   - Three tier cards: Standard ($X/mo), Premium ($X/mo), Family ($X/mo)
   - Monthly/Annual toggle (annual shows savings percentage)
   - Feature comparison list per tier
   - "Start Free Trial" CTA (7-day trial recommended)
   - "Restore Purchases" link at bottom
   - Terms of Service and Privacy Policy links (required by Apple)

2. **Purchase Flow:**
   - User selects plan, taps subscribe
   - Native iOS/Android payment sheet appears (Apple Pay, Google Pay, or card on file)
   - On success: RevenueCat webhook fires, Supabase edge function updates `user_subscriptions`
   - App checks entitlement status, unlocks features, navigates to dashboard

3. **Restore Purchases:**
   - Settings screen has "Restore Purchases" button (required by Apple)
   - Calls `Purchases.restorePurchases()`
   - Verifies active subscription, updates local state

**Subscription Tiers (matching web app, verified from PricingSection.tsx):**

| Tier | Web Name | Students | Key Features |
|------|----------|----------|-------------|
| Standard | `single` | 1 | All core features for one student |
| Premium | `midsize` | Up to 3 | Family dashboard, individual student dashboards, advanced analytics |
| Family | `large` | Up to 5 | Everything in Premium, best per-student value, early access |

**Product ID Convention:** `com.centsiblescholar.app.standard.monthly`, `com.centsiblescholar.app.premium.annual`, etc.

---

### SUB-02: Subscription Gates (Freemium vs Premium)

| Attribute | Detail |
|-----------|--------|
| Why Expected | Must restrict features for non-subscribers. Without gates, there is no reason to subscribe. |
| Complexity | Medium |
| Dependencies | SUB-01, `useSubscriptionStatus` hook (exists but needs enhancement for RevenueCat entitlements) |

**Recommended Gate Strategy:**

Free features (available to all, no subscription required):
- Parent signup and profile creation
- Create 1 student account
- Student sign-in and basic dashboard view
- Daily QOD (question of the day) -- keeps engagement even for free users
- View current GPA (read-only)
- Basic behavior assessment

Premium features (require active subscription):
- Grade entry and full grade management
- Behavior analytics with trend charts
- Earnings calculation and allocation breakdown
- Savings goals
- Budget planner
- Reports and data export
- Family meetings
- Additional student accounts (based on tier)
- Full student dashboard with all features

**Gate Implementation Pattern:**

```
// Soft gate: show content but prompt to subscribe on interaction
<FeatureGate feature="grade_entry" fallback={<SubscribePrompt />}>
  <GradeEntryForm />
</FeatureGate>

// Hard gate: redirect to paywall
if (!isSubscribed) {
  router.push('/subscribe');
  return;
}
```

**Important:** Apple Review guideline 3.1.1 requires that paywall screens clearly communicate what users get. Do not hide pricing or show misleading free tier descriptions.

---

### SUB-03: Subscription Restore and Management

| Attribute | Detail |
|-----------|--------|
| Why Expected | Apple REQUIRES a "Restore Purchases" button. Users switching devices need to recover subscriptions. |
| Complexity | Low (if using RevenueCat, it is a single API call) |
| Dependencies | SUB-01 |

**Expected Behavior:**
- "Restore Purchases" button visible in Settings screen and on paywall screen
- Tapping it calls `Purchases.restorePurchases()` (RevenueCat) or equivalent
- Shows loading spinner, then success/failure alert
- "Manage Subscription" button links to platform-native subscription management:
  - iOS: `itms-apps://apps.apple.com/account/subscriptions`
  - Android: `https://play.google.com/store/account/subscriptions`

---

### STORE-01: App Store Metadata

| Attribute | Detail |
|-----------|--------|
| Why Expected | Cannot submit to App Store or Play Store without required metadata. Incomplete metadata = rejection. |
| Complexity | Medium (content creation, not code) |
| Dependencies | Final app UI (for screenshots), marketing copy, privacy policy URL, support URL |

**Apple App Store Requirements (verified via [Apple docs](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) and [Expo docs](https://docs.expo.dev/guides/store-assets/)):**

| Asset | Specification |
|-------|---------------|
| App Name | Max 30 characters |
| Subtitle | Max 30 characters |
| Description | Max 4000 characters |
| Keywords | Max 100 characters, comma-separated |
| Screenshots (iPhone) | 2-10 images, 1290x2796 or 1320x2868 pixels, JPG/PNG (no alpha) |
| Screenshots (iPad) | 2-10 images, 2048x2732 or 2064x2752 pixels (if iPad supported) |
| App Icon | 1024x1024 PNG (square, no rounded corners, no transparency) |
| Privacy Policy URL | Required, must be publicly accessible |
| Support URL | Required |
| Age Rating | Questionnaire-based (updated 2025 with 13+, 16+, 18+ ratings) |
| App Review Notes | Describe test accounts, explain child account system |

**Google Play Store Requirements:**

| Asset | Specification |
|-------|---------------|
| App Title | Max 30 characters |
| Short Description | Max 80 characters |
| Full Description | Max 4000 characters |
| Screenshots | 2-8 images, 16:9 or 9:16 aspect ratio, 320-3840px per side, PNG/JPEG |
| Feature Graphic | 1 required, 1024x500 pixels |
| App Icon | 512x512 PNG with alpha, max 1024 KB |
| Privacy Policy URL | Required |
| Content Rating | IARC questionnaire |
| Data Safety Section | Detailed data collection disclosure |

**EAS Metadata:** Expo supports `store.config.json` for automating App Store metadata submission via [EAS Metadata](https://docs.expo.dev/deploy/app-stores-metadata/). Currently only supports Apple App Store.

---

### STORE-02: App Icon, Splash Screen, Launch Assets

| Attribute | Detail |
|-----------|--------|
| Why Expected | Visual identity. Unprofessional icons get rejected. First impression in app store listing. |
| Complexity | Low (design work, not code) |
| Dependencies | Design files, app.json configuration |

**Current State:** app.json already references `./assets/icon.png`, `./assets/splash-icon.png`, `./assets/adaptive-icon.png`. Need to verify these are production-quality at correct dimensions.

**Requirements (verified via [Expo splash screen docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)):**

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| App Icon (universal) | 1024x1024 | PNG, no transparency | Square, fills entire area, no rounded corners |
| Splash Icon | 1024x1024 | PNG, transparent bg OK | Centered on splash background color |
| iOS Icon | 1024x1024 | PNG, no alpha | System generates all sizes from this |
| Android Adaptive Icon (foreground) | 1024x1024 | PNG with transparency | Safe zone: center 66% |
| Android Adaptive Icon (background) | Solid color or image | Via app.json `backgroundColor` | Currently set to `#4F46E5` |
| Favicon (web) | 48x48 | PNG | Low priority |

**2025 iOS Update:** iOS 26 introduces Liquid Glass icon treatment. Icons should be designed as layered content. For SDK 54+, Expo supports `.icon` directories via Icon Composer for light/dark/tinted variants.

---

### STYLE-01 & STYLE-02: UI Polish

| Attribute | Detail |
|-----------|--------|
| Why Expected | App Store reviewers reject apps with placeholder text, inconsistent styling, or broken layouts. Users expect polished mobile UX. |
| Complexity | Medium-High (auditing every screen, applying consistent design system) |
| Dependencies | Existing theme system (`src/theme/`), all screen components |

**Current State:**
- Theme system exists with colors, typography, spacing files
- Color scheme: Indigo primary (#4F46E5), Financial green secondary, Scholar blue accent
- Light and dark theme defined (dark theme not yet active)
- Some screens use raw StyleSheet with hardcoded colors (not theme tokens)

**What "Polish" Means for App Store Review:**

1. **No placeholder text** -- every string must be final copy, no "Lorem ipsum" or "Coming soon"
2. **Consistent styling** -- all screens use same colors, fonts, spacing, border radii
3. **Loading states** -- every data-fetching screen shows a loading spinner, not a blank screen
4. **Error states** -- network errors show retry button, not a crash
5. **Empty states** -- "No grades yet" with illustration, not a blank list
6. **Keyboard handling** -- `KeyboardAvoidingView` on all forms, `keyboardShouldPersistTaps="handled"` on ScrollViews
7. **Safe area** -- content respects notch/Dynamic Island on iOS and navigation bar on Android
8. **Accessibility** -- minimum touch target 44x44pt, contrast ratios meet WCAG AA
9. **Responsive** -- works on small phones (iPhone SE) through large phones (iPhone 16 Pro Max)

---

### DATA-01: Account Deletion (Privacy Compliance)

| Attribute | Detail |
|-----------|--------|
| Why Expected | **Apple requires in-app account deletion** per [Guideline 5.1.1](https://developer.apple.com/support/offering-account-deletion-in-your-app/). GDPR/CCPA require data deletion on request. Rejection guaranteed without it. |
| Complexity | Medium |
| Dependencies | Settings screen, Supabase admin API or edge function for account deletion |

**Apple's Requirement (verified via [Apple developer docs](https://developer.apple.com/support/offering-account-deletion-in-your-app/)):**
- Account deletion must be easy to find in the app (Settings is standard location)
- Must actually delete the account and data, not just deactivate
- Cannot require users to call, email, or go through a support flow (unless highly regulated industry -- education apps are NOT exempt)
- If app uses Sign in with Apple, must revoke tokens via REST API (not currently applicable but note for future)

**Expected UX Flow:**

1. User navigates to Settings > Account > Delete Account
2. Warning screen explains what will be deleted (profile, students, grades, behavior data, subscription)
3. Confirmation prompt: "Type DELETE to confirm"
4. App calls Supabase edge function that:
   - Cancels active subscription (via RevenueCat API if applicable)
   - Deletes user data from all tables (grades, behavior_assessments, student_profiles, parent_profiles, etc.)
   - Deletes Supabase auth account
5. User is signed out and returned to login screen
6. Confirmation email sent (optional but good practice)

**GDPR/CCPA Data Export:**
- Users can request a copy of their data (required by GDPR Article 20)
- Implement as "Download My Data" button in Settings
- Generates JSON with all user data, delivered via share sheet
- Simpler than web app's full data management suite -- no backup/restore/validation needed

---

### Privacy Policy and Legal Pages

| Attribute | Detail |
|-----------|--------|
| Why Expected | Apple and Google both require a privacy policy URL. Apps targeting children have additional disclosure requirements. |
| Complexity | Low (content, not code) |
| Dependencies | Legal review, hosted privacy policy page |

**Required Legal Documents:**
- Privacy Policy (must be publicly accessible URL, linked in app and store listing)
- Terms of Service (linked in app settings and subscription flow)
- Both must cover: data collected, how it is used, third-party sharing, children's data handling, deletion rights

**COPPA Considerations (verified via [COPPA guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)):**

This app collects data from children (students may be under 13). Key requirements:
- **Verifiable parental consent (VPC)** before collecting child data -- the parent creates the student account, which serves as consent
- **Data minimization** -- collect only what is needed for the educational function
- **No behavioral advertising** to children
- **No cross-service tracking** of children
- **Parental access** to child data (parent can view all student data)
- **Parental deletion** of child data (parent can deactivate/delete student accounts)

**Risk Assessment:** Since parents create student accounts (students do not self-register), and parents have full visibility and control over student data, the COPPA exposure is manageable. The parent account creation flow effectively serves as verifiable parental consent. However, the privacy policy must explicitly state this.

**Apple Privacy Nutrition Labels:**
- Must declare all data types collected in App Store Connect
- Categories: Name, Email, User Content (grades, assessments), Usage Data
- Linked to identity: Yes (account-based)
- Used for tracking: No (no third-party advertising)

---

## Differentiators

Features that set the product apart from competitors. Not required for App Store submission but valuable for user retention and competitive positioning.

### DASH-04: Student Daily Assessment Flow (Combined QOD + Behavior)

| Attribute | Detail |
|-----------|--------|
| Value Proposition | Single "morning check-in" flow that combines QOD answer and behavior self-assessment. Competitors require separate actions. Reduces friction and increases daily engagement. |
| Complexity | Medium |
| Dependencies | DASH-03 (student dashboard), `useQuestionOfTheDay` (exists), `useBehaviorAssessments` (exists) |

**Expected UX Flow (modeled on [web DailyAssessment.tsx](file:///Users/robertisrael/Documents/GitHub/centsible-scholar-premium/src/pages/DailyAssessment.tsx)):**

1. Student opens app, sees "Start Today's Check-in" card on dashboard
2. Step 1: Daily financial question (multiple choice, immediate feedback)
3. Step 2: Behavior self-assessment (10 categories, 1-5 scale, with slider or star rating)
4. Completion screen: shows streak update, XP earned, today's score summary
5. Dashboard updates to show "Completed" status for today

**Mobile-Specific Design:**
- Swipeable card flow (not scroll-down form like web app)
- Each behavior category on its own card with large tap targets for 1-5 rating
- Progress indicator showing steps remaining
- Haptic feedback on answer selection
- Celebration animation on completion (confetti or similar)

---

### QOD-04: Parent QOD Progress View

| Attribute | Detail |
|-----------|--------|
| Value Proposition | Parents see family-wide financial education progress. Which students are maintaining streaks? Who needs encouragement? |
| Complexity | Low |
| Dependencies | `useParentQODStats` pattern from web app, multi-student data hooks |

**Expected Content (modeled on [web QODProgress.tsx](file:///Users/robertisrael/Documents/GitHub/centsible-scholar-premium/src/pages/QODProgress.tsx)):**

- Family summary cards: Total Family XP, Average Correct %, Active Streaks, Answered Today
- Per-student cards showing: Name, % correct (all time), current streak, today's status (answered/not), level/XP

---

## Anti-Features

Features to explicitly NOT build for v1.0. Common mistakes in this domain.

### Things That Should Not Ship in v1.0

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real money transfers or debit card integration | Compliance nightmare (COPPA, state money transmitter licenses, PCI). The "paycheck" is educational, not real money. | Keep as educational simulation. Allocation breakdown teaches concepts without real money movement. |
| Social features or leaderboards between families | Privacy risk for minors. No child-to-child comparison across families. | Family-internal only. Sibling comparison within a family is acceptable. |
| AI-generated financial advice | Liability risk. AI recommendations about money for children is legally fraught. | Curated educational content from question bank. |
| Full data management suite (backup/restore/validation/integrations) | Web-only admin complexity. Mobile users need simple export and deletion. | "Download My Data" and "Delete Account" buttons in Settings. |
| Stripe payment flow on mobile | Prohibited by Apple App Store guideline 3.1.1. Digital goods must use IAP. | Apple IAP and Google Play Billing only. Existing web Stripe subscriptions can be read (status check) but not created on mobile. |
| Coaching marketplace | Web-only feature. Not relevant for mobile consumer app. | Omit entirely. |
| Complex onboarding wizard | High drop-off risk on mobile. Users want to get started fast. | Minimal onboarding: signup > select plan > create first student > dashboard. |
| Offline-first architecture | Adds massive complexity. App is server-dependent (Supabase). | Online-only with graceful error handling. Show cached data when available via React Query stale cache. |
| Dark mode at launch | Theme system supports it but doubles QA surface. Ship light mode, add dark mode in update. | Light mode only for v1.0. Dark theme colors already defined in theme system for future use. |
| iPad-specific layout | Increases screenshot requirements and QA surface. | Support iPad display via `supportsTablet: true` (already set) but do not optimize layouts. Phone-first design that scales up. |

---

## Feature Dependencies

```
AUTH-04 (Password Reset)
  --> Supabase auth (exists)
  --> Deep linking: expo-linking + URL scheme (configured)
  --> apple-app-site-association file on centsiblescholar.com domain
  --> No feature dependencies (standalone)

DASH-03 (Student Dashboard)
  --> useUnifiedUserRole hook (needs to be ported from web app)
  --> Expo Router layout groups: (student-tabs) separate from (tabs)
  --> All existing data hooks (useStudentGrades, useBehaviorAssessments, etc.)
  --> No dependency on subscription (students access via parent's subscription)

DASH-04 (Student Daily Assessment)
  --> DASH-03 (student dashboard as entry point)
  --> useQuestionOfTheDay hook (exists)
  --> useBehaviorAssessments hook (exists)

QOD-04 (Parent QOD Progress)
  --> useParentQODStats hook (needs creation, modeled on web app)
  --> Multi-student data queries
  --> Parent dashboard navigation

SUB-01 (IAP Subscription)
  --> EAS build setup (replaces Expo Go for development)
  --> RevenueCat library + config plugin
  --> RevenueCat dashboard configuration
  --> App Store Connect / Google Play Console product setup
  --> Supabase edge function or RevenueCat webhook for subscription status sync
  --> user_subscriptions table (exists, may need schema update for IAP fields)

SUB-02 (Subscription Gate)
  --> SUB-01 (active subscription checking)
  --> useSubscriptionStatus hook (exists, needs RevenueCat entitlement integration)
  --> FeatureGate wrapper component (new)

SUB-03 (Subscription Restore)
  --> SUB-01

DATA-01 (Account Deletion + Data Export)
  --> Settings screen (exists)
  --> Supabase edge function for cascading data deletion
  --> JSON generation for data export
  --> expo-sharing for share sheet delivery

STORE-01 (App Store Metadata)
  --> Final screenshots (requires polished UI: STYLE-01, STYLE-02)
  --> Marketing copy
  --> Privacy policy URL
  --> Support URL

STORE-02 (App Icon + Splash)
  --> Design assets at correct dimensions
  --> app.json configuration (partially done)

STYLE-01/02 (UI Polish)
  --> Theme system audit (exists at src/theme/)
  --> All screens reviewed for consistency
  --> Loading/error/empty states on every screen
```

---

## MVP Recommendation

For v1.0 App Store submission, prioritize in this order:

### Must Complete Before Submission

1. **AUTH-04** (Password Reset) -- App Store reviewers test auth recovery. Low-medium effort, high rejection risk if missing.
2. **DASH-03** (Student Dashboard) -- Core product promise. Students need their own experience. Medium effort.
3. **SUB-01** (IAP Subscription) -- Revenue model. Highest effort but cannot launch paid app without it.
4. **SUB-02** (Subscription Gate) -- Enforces business model. Medium effort after SUB-01.
5. **SUB-03** (Subscription Restore) -- Apple requirement. Low effort after SUB-01.
6. **DATA-01** (Account Deletion) -- Apple guideline 5.1.1. Will be rejected without it.
7. **STYLE-01/02** (UI Polish) -- No placeholder text, consistent styling. Medium-high effort across all screens.
8. **STORE-01/02** (Assets + Metadata) -- Screenshots, icon, descriptions. Cannot submit without them.

### Should Ship With v1.0 (Strong Differentiators)

9. **DASH-04** (Student Daily Assessment) -- Engagement driver. Combined QOD+behavior flow.
10. **QOD-04** (Parent QOD Progress) -- Parent engagement. Family-wide education stats.

### Defer to Post-Launch Update

- Budget planner (BUDGET-01, BUDGET-02)
- Analytics reports (REPORT-01)
- Printable reports (REPORT-03)
- Data export CSV/JSON (REPORT-02)
- Financial education hub (FINED-01)
- Resources page (RESOURCE-01)
- Dark mode

---

## App Store Review Checklist

Based on research of [common rejection reasons](https://nextnative.dev/blog/app-store-review-guidelines) and [Apple guidelines](https://developer.apple.com/app-store/review/guidelines/):

### Will Cause Rejection If Missing

- [ ] Account deletion in-app (Guideline 5.1.1)
- [ ] Working "Restore Purchases" button (Guideline 3.1.1)
- [ ] Privacy policy URL in app and store listing (Guideline 5.1.1)
- [ ] IAP for all digital goods/features (Guideline 3.1.1 -- cannot use external payment)
- [ ] No crashes on any screen (Guideline 2.1)
- [ ] No placeholder text or "coming soon" features (Guideline 2.1)
- [ ] Screenshots match actual app UI (Guideline 2.3)
- [ ] Terms of use visible before purchase (Guideline 3.1.2)
- [ ] Subscription clearly shows price, duration, and renewal terms

### Important for Smooth Review

- [ ] Test account credentials provided in App Review Notes (parent account + student account)
- [ ] Explain child account system in review notes (parents create student accounts)
- [ ] Age rating questionnaire completed accurately
- [ ] Privacy Nutrition Labels match actual data collection
- [ ] `usesNonExemptEncryption: false` declared (already in app.json)
- [ ] App functions on latest iOS/Android versions
- [ ] No excessive permission requests (current: notifications only)
- [ ] Support URL is live and responsive

### COPPA-Specific (Since App Involves Children)

- [ ] Privacy policy explicitly addresses children's data
- [ ] Parental consent mechanism documented (parent creates student accounts)
- [ ] No third-party tracking SDKs that collect child PII
- [ ] No behavioral advertising to child users
- [ ] Data minimization: collect only educational-function data
- [ ] Parent can access, review, and delete child data

---

## Sources

### HIGH Confidence (Official Documentation)
- [Supabase resetPasswordForEmail API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Expo In-App Purchases Guide](https://docs.expo.dev/guides/in-app-purchases/)
- [Expo Splash Screen and App Icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Expo Store Assets Guide](https://docs.expo.dev/guides/store-assets/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Account Deletion Requirement](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [Apple App Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)

### MEDIUM Confidence (Verified Community Sources)
- [RevenueCat Expo Installation](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [LogRocket: Best React Native IAP Libraries](https://blog.logrocket.com/best-react-native-in-app-subscription-libraries/)
- [Galaxies.dev: Role-Based Navigation in Expo Router](https://galaxies.dev/react-native-role-based-navigation)
- [App Store Review Guidelines Checklist (nextnative.dev)](https://nextnative.dev/blog/app-store-review-guidelines)
- [COPPA Compliance Guide 2025](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

### LOW Confidence (Single Source, Needs Validation)
- [Supabase deep link fragment parsing issue (GitHub)](https://github.com/supabase/supabase-js/issues/843) -- documented but unclear if resolved in latest version
- [EAS Metadata for Play Store](https://docs.expo.dev/deploy/app-stores-metadata/) -- currently Apple only; Play Store support may be added

### Codebase References
- Web app: `/Users/robertisrael/Documents/GitHub/centsible-scholar-premium/`
- Mobile app: `/Users/robertisrael/Documents/GitHub/centsible-scholar-mobile/`
- Subscription tiers from `PricingSection.tsx`: Standard (1 student), Premium (3 students), Family (5 students)
- Role detection from `useUnifiedUserRole.tsx`: checks student_profiles first, then parent_profiles
- Data management from `DataManagement.tsx`: 5-tab system (Export, Backup, Cleanup, Validation, Integrations) -- mobile should be simplified to 2 actions (export + delete)

---

*Research complete: 2026-02-05*
