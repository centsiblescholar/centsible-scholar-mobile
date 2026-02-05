# Domain Pitfalls

**Domain:** Kids financial education mobile app -- adding IAP, password reset, student routing, subscription gates, data export, and App Store submission
**Researched:** 2026-02-05
**Context:** Existing Expo 54 / Supabase app preparing for first App Store + Google Play submission. Shared backend with web app that uses Stripe. Students have real Supabase auth accounts created by parents.

---

## Critical Pitfalls

Mistakes that cause App Store rejection, legal exposure, or architectural rewrites.

### Pitfall 1: Existing Stripe-Only Subscription Schema Blocks IAP Integration

**What goes wrong:** The `user_subscriptions` table has `stripe_customer_id` and `stripe_subscription_id` columns baked into its schema. The `useSubscriptionStatus` hook reads `stripe_customer_id` directly. When IAP subscriptions are added, there is no column for Apple receipt data, Google Play purchase tokens, or a `payment_source` discriminator. Developers either: (a) shoehorn IAP data into Stripe columns (creating data integrity confusion), or (b) create a separate table (fragmenting subscription queries and breaking the existing hook).

**Why it happens:** The web app was built first with Stripe-only subscriptions. The mobile app copied the same schema and hooks. Nobody planned for dual billing sources from the beginning.

**Consequences:** If not addressed architecturally, every subscription query throughout the app needs conditional logic ("is this a Stripe sub or an IAP sub?"), the `useSubscriptionStatus` hook breaks for IAP users, and cross-platform entitlement checks (user subscribes on web, opens mobile) require fragile join logic across disparate data shapes.

**Prevention:**
- Extend `user_subscriptions` table with: `payment_source` enum ('stripe' | 'apple' | 'google'), `iap_product_id`, `iap_original_transaction_id`, `iap_receipt_data` (or similar)
- Alternatively, create a unified `entitlements` table that abstracts over payment source -- subscriptions write to it, and the app reads from it
- Refactor `useSubscriptionStatus` to check entitlement status regardless of payment source
- Consider RevenueCat as a subscription management layer that unifies Apple/Google/Stripe into one API (reduces custom server-side code significantly at cost of vendor dependency and ~1% revenue share)

**Detection:** The hook references `stripe_customer_id` -- search for all Stripe-specific references in subscription code and flag each one as needing abstraction.

**Which phase:** Architecture decision needed before IAP implementation begins. This is a prerequisite.

**Confidence:** HIGH -- verified by direct codebase inspection of `useSubscriptionStatus.ts` (lines referencing `stripe_customer_id`) and `user_subscriptions` schema in `types.ts`.

---

### Pitfall 2: Apple Rejects Apps That Reference External Payment for Digital Content (Guideline 3.1.1)

**What goes wrong:** The existing `useSubscriptionStatus` hook and settings screen are wired to Stripe. If any UI text, link, or flow directs users to "manage subscription on our website" or shows Stripe-related payment info, Apple will reject under Guideline 3.1.1: digital goods must be unlocked via IAP. Even a "Subscribed via web" label that includes a link to the website can trigger rejection.

**Why it happens:** The web app legitimately uses Stripe. Developers copy web-oriented subscription management patterns to mobile without realizing Apple's rules differ.

**Consequences:** Immediate App Store rejection. Every resubmission resets the review queue (typically 24-48 hours). Multiple rejections for the same guideline can trigger extended review times.

**Prevention:**
- Remove ALL references to Stripe, external payment, or website subscription management from the mobile app UI
- "Manage Subscription" button must open iOS system subscription settings: `Linking.openURL('https://apps.apple.com/account/subscriptions')`
- For users who subscribed via web/Stripe: show "Your subscription is managed through the web. Visit centsiblescholar.com to manage it" only as text (no clickable link to payment page) -- even this is borderline; safer to just show "Active subscription" without source details
- On Android, link to Play Store subscription management: `Linking.openURL('https://play.google.com/store/account/subscriptions')`
- Server-side receipt validation via Supabase edge function -- never validate receipts only on the client

**Detection:** Search codebase for "stripe", "website", "web" near subscription-related code. Search UI strings for payment/billing references.

**Which phase:** Must be resolved during IAP implementation, before first submission.

**Confidence:** HIGH -- Apple Guideline 3.1.1 is well-documented and consistently enforced. Sources: [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [RevenueCat Guide to App Store Rejections](https://www.revenuecat.com/blog/growth/the-ultimate-guide-to-app-store-rejections/).

---

### Pitfall 3: Password Reset Deep Links Fail Silently in React Native

**What goes wrong:** Supabase `resetPasswordForEmail()` sends an email containing a link with a token. In a web app, the user clicks the link, the browser opens the redirect URL, and the token is exchanged for a session. In React Native, this flow breaks in multiple ways:

1. The redirect URL must use a custom URL scheme (e.g., `centsiblescholar://`) or universal link to open the app
2. The `scheme` in `app.json` is set to `centsiblescholar` but the Supabase dashboard redirect URLs must include `centsiblescholar://**` in the allow list
3. If the app is not installed, the link opens in a browser with no fallback
4. Expo Go adds `/--/` to the URL path, which differs from production builds -- testing in Expo Go gives false confidence
5. `onAuthStateChange` may not fire if the app was killed and relaunched via deep link -- the token extraction must happen in the linking handler, not just the auth listener
6. Universal links require an `apple-app-site-association` file on the server and `associatedDomains` in the app config -- the current `app.json` declares `applinks:centsiblescholar.com` but the AASA file on the server may not exist or may have the wrong team/bundle ID

**Why it happens:** Password reset is a "works on web, breaks on mobile" flow. Supabase documentation is web-first. The deep linking configuration has 3+ separate systems that must align (Supabase redirect allow list, app URL scheme, platform-specific config, auth state handling).

**Consequences:** Users request password reset, receive email, click link, and nothing happens (or they land on a broken web page). This is a support nightmare and a potential App Store rejection if the reviewer tests password reset.

**Prevention:**
- **Recommended approach:** Use OTP/code-based password reset instead of deep links. User enters email, receives a 6-digit code, enters code + new password in app. This avoids ALL deep linking complexity. Supabase supports this via `resetPasswordForEmail()` with `type: 'otp'` parameter. Multiple developers have documented switching from deep links to OTP-based reset specifically because deep linking was unreliable. Source: [Why I Ditched Deep Linking for Token-Based Password Reset in Supabase](https://dev.to/tanmay_kaushik_/why-i-ditched-deep-linking-for-a-token-based-password-reset-in-supabase-3e69)
- **If deep links are required:** Configure redirect URL in Supabase dashboard, set up URL scheme handling via `expo-linking`, extract token from URL in app's root linking handler, call `supabase.auth.verifyOtp()` or `supabase.auth.setSession()` with the extracted token, test on physical device with production build (not Expo Go)
- For the AASA file: either host it correctly at `https://centsiblescholar.com/.well-known/apple-app-site-association` with correct team ID, or remove `associatedDomains` from `app.json` if not needed for launch

**Detection:** Test password reset flow on a physical device with a production/preview build. If the email link does not open the app and pre-fill the token, the deep link chain is broken.

**Which phase:** Password reset implementation phase. Decide OTP vs deep link approach before writing any code.

**Confidence:** HIGH -- Supabase deep link issues with React Native are extensively documented. Sources: [Supabase Native Mobile Deep Linking Docs](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [Supabase Discussion #33633](https://github.com/orgs/supabase/discussions/33633), [Supabase JS Issue #843](https://github.com/supabase/supabase-js/issues/843).

---

### Pitfall 4: Student Login Routes to Parent Dashboard (No Role-Based Routing)

**What goes wrong:** The current `app/index.tsx` redirects ALL authenticated users to `/(tabs)/dashboard`. There is no role check. When a student logs in, they see the parent dashboard -- which includes "Manage Students," grade approval workflows, subscription management, and other parent-only features. Worse, the `StudentContext` assumes the logged-in user is a parent and calls `useParentStudents()` to load children. For a student user, this query returns nothing (they have no children), so the app shows empty/broken state.

**Why it happens:** The app was built parent-first. The `user_type` metadata exists in Supabase auth (`'parent'` is set during signup), but there is no corresponding routing logic that checks `user_type` and redirects students to a different experience.

**Consequences:**
- Students see parent-only features (confusing, potentially insecure)
- Student context loads no data (empty dashboard)
- Students can potentially access student management and grade approval screens that should be parent-only
- If student accidentally modifies something via parent-only screens, data integrity issues

**Prevention:**
- Check `user.user_metadata.user_type` in the root redirect (`app/index.tsx`) and route to different tab groups:
  - Parents: `/(parent-tabs)/dashboard`
  - Students: `/(student-tabs)/dashboard`
- Use Expo Router's `Stack.Protected` (SDK 53+) or `Tabs.Protected` to conditionally show/hide tabs based on role. Source: [Expo Router Protected Routes](https://docs.expo.dev/router/advanced/protected/)
- Create separate tab layouts: `app/(parent-tabs)/_layout.tsx` and `app/(student-tabs)/_layout.tsx` with role-appropriate screens
- The `StudentContext` needs two modes: parent mode (loads children via `useParentStudents`) and student mode (loads the student's own profile)
- Add RLS policies on Supabase tables to prevent students from accessing parent-only data, even if client routing is bypassed

**Detection:** Log in with a student account. If you see "Manage Students" or "Grade Approval" in the navigation, role-based routing is not implemented.

**Which phase:** Student routing phase. This is foundational -- must be done before building any student-specific screens.

**Confidence:** HIGH -- verified by codebase inspection. `app/index.tsx` has no role check (line 17-21: only checks `user` existence, not type). `StudentContext` always calls `useParentStudents()` which queries by `parent_user_id`.

---

### Pitfall 5: Account Deletion via Web Link Gets Rejected by Apple

**What goes wrong:** Apple Guideline 5.1.1(v) requires in-app account deletion for any app that offers account creation. The current implementation (if it exists) likely opens a web URL for deletion. Apple has been increasingly strict about this -- a web redirect is not acceptable. The deletion must happen within the app's native UI, must explain what data will be deleted, and must actually delete the data (not just deactivate the account).

**Why it happens:** Account deletion is complex because it involves: auth user deletion (requires `service_role` key), cascading data deletion across 10+ tables, subscription cancellation, and child account handling. Developers defer it and add a web link as a placeholder.

**Consequences:** App Store rejection. This is one of the most common rejection reasons for apps with user accounts.

**Prevention:**
- Build native in-app deletion flow: confirmation dialog explaining consequences, option to download data first, then actual deletion
- Use Supabase edge function for deletion (the client cannot use `service_role` key) -- the edge function must: cancel active subscriptions, delete all child data (student profiles, grades, behaviors, etc.), delete parent profile, delete the auth user via `supabase.auth.admin.deleteUser()`
- Handle the cascading deletion order correctly: child records first, then parent records, then auth user (foreign key constraints)
- For parent accounts: explicitly ask whether to also delete associated student accounts or just unlink them
- Sign the user out after successful deletion

**Detection:** Look for a "Delete Account" button in settings. If it opens a URL or does not exist, this pitfall applies.

**Which phase:** Data export/deletion phase. Must be complete before App Store submission.

**Confidence:** HIGH -- Apple's requirement has been in effect since 2022. Source: [Apple Developer - Account Deletion Requirement](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

---

### Pitfall 6: Kids Category vs. Non-Kids Category Decision Cascades Through Entire App

**What goes wrong:** If the app is placed in Apple's Kids Category, it triggers: no third-party analytics, no advertising SDKs, no external links without parental gates, no data collection from children without enhanced parental consent. However, if the app markets to children (grades 1-12) but is NOT in Kids Category, Apple may reject for inconsistency under Guideline 1.3. The current `app.json` sets no category, and the app collects PII from student accounts (name, email, grade level, behavioral data).

**Why it happens:** The Kids Category decision seems like a marketing choice but actually drives technical requirements across privacy, data handling, SDK usage, and feature design.

**Consequences:** Choosing wrong means either: (a) massive technical restrictions that may require removing features, or (b) App Store rejection for marketing/category mismatch.

**Prevention:**
- **Recommended for Centsible Scholar:** Do NOT use Kids Category. Position as a parenting/family management tool. Target audience is parents (18+). Students access under parental supervision
- Set age rating to 12+ (not 4+) to acknowledge data collection and financial concepts
- Marketing should emphasize "family" and "parents" rather than "kids" and "children"
- Ensure all student account creation flows through authenticated parent accounts (already the case)
- Store parental consent timestamp when parent creates student account
- Privacy policy must include a Children's Privacy section regardless of category choice
- Google Play: set target audience to 13+ to avoid Families Policy. Source: [COPPA Compliance 2025 Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

**Detection:** Review app store listing for words like "kids," "children," "ages 6-12." If present, and app is not in Kids Category, there is a mismatch risk.

**Which phase:** Must be decided during planning before any store metadata is written.

**Confidence:** HIGH -- Apple's Kids Category requirements and COPPA are well-documented and consistently enforced. Source: [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

---

## Moderate Pitfalls

Mistakes that cause delays, rework, or user-facing bugs.

### Pitfall 7: Subscription Gate Placement -- Too Early Locks Out Evaluation, Too Late Loses Conversions

**What goes wrong:** Developers either gate too aggressively (paywall immediately after signup, before user understands value) or too loosely (all features free, no incentive to subscribe). For a family education app, the wrong gate placement causes: parents abandon during free trial because they never saw premium value, or parents use all features for free and never subscribe.

**Why it happens:** The app currently has `useSubscriptionStatus` but no gate enforcement anywhere in the UI. When subscription gates are added, the decision of WHICH features to gate behind the paywall is often made ad-hoc without a deliberate strategy.

**Consequences:** Poor conversion rates, user frustration, or App Store rejection under Guideline 3.1.2 ("subscriptions must provide ongoing value" -- if premium features are trivial, Apple may reject).

**Prevention:**
- Define a clear free vs. premium feature split BEFORE implementation:
  - **Free tier (evaluation):** 1 student, basic grade tracking, daily question of the day, basic earnings view
  - **Premium:** Multiple students, behavioral assessments, savings goals, detailed analytics/charts, data export, family meetings
- Gate at the feature level, not the app level -- show locked features with a preview and "Unlock with Premium" prompt
- Include a free trial (Apple requires minimum 3 days for auto-renewable; 7 days is standard and expected)
- Paywall must display: price, billing period, auto-renewal disclosure, trial length, cancellation instructions, "Restore Purchases" button, and links to Terms of Use and Privacy Policy
- Apple Guideline 3.1.2 requires "ongoing value" -- the subscription must provide continuously updating content or features, not a one-time unlock. Grade tracking and daily questions satisfy this.

**Detection:** Map every screen in the app to "free" or "premium." If the mapping does not exist, gate placement has not been decided.

**Which phase:** Planning phase (decision) and subscription gate implementation phase (enforcement).

**Confidence:** HIGH for Apple requirements. MEDIUM for optimal gate placement (domain-specific, requires user testing).

---

### Pitfall 8: IAP Receipt Validation Race Condition with Supabase RLS

**What goes wrong:** After IAP purchase, the app sends the receipt to a Supabase edge function for server-side validation. The edge function validates with Apple/Google, updates `user_subscriptions`, and returns success. The client then queries subscription status via `useSubscriptionStatus`. If the client query happens before the edge function write commits (or RLS policy evaluates against stale data), the user sees "no subscription" even though they just paid. This is the same INSERT-then-SELECT RLS race condition documented in the project's MEMORY.md.

**Why it happens:** Supabase's `.insert().select().single()` triggers both INSERT and SELECT RLS policies. If the SELECT policy depends on a record that was just written, timing issues occur.

**Consequences:** User pays but features remain locked. Support tickets. Potential refund requests.

**Prevention:**
- Edge function should return the validated subscription record directly in its response (not rely on the client re-querying)
- Use React Query `setQueryData` to optimistically update subscription cache immediately after edge function returns success
- Add retry logic with exponential backoff for subscription status checks
- Consider a brief polling mechanism: after purchase, check status every 2 seconds for 10 seconds before showing error
- Separate the INSERT from the SELECT in the edge function if using Supabase client internally

**Detection:** Purchase a subscription in sandbox and immediately check if features unlock. If there is any delay or "still locked" flash, this race condition exists.

**Which phase:** IAP implementation phase. Design the purchase-to-entitlement flow to handle this from day one.

**Confidence:** HIGH -- this exact pattern is documented in the project's MEMORY.md as a known issue.

---

### Pitfall 9: Expo Go Cannot Test IAP, Push Notifications, or Deep Links

**What goes wrong:** The development team uses Expo Go for daily development. IAP libraries (`react-native-iap`, `expo-iap`, RevenueCat SDK) require native modules that are not included in Expo Go. Push notification tokens require native APNs/FCM configuration. Deep links behave differently in Expo Go (adds `/--/` to URL paths). If the team develops these features using Expo Go, they will get false test results or complete inability to test.

**Why it happens:** Expo Go is convenient for rapid iteration. The project has been using it throughout development. Switching to EAS development builds adds build time and complexity.

**Consequences:** Features appear to work in development but crash or behave differently in production builds. IAP cannot be tested at all until a native build is created. The first EAS build often fails due to accumulated configuration issues.

**Prevention:**
- Switch to EAS development builds at the START of the IAP phase, not after IAP code is written
- Run `npx expo install expo-dev-client` and create a development build
- Use `eas build --profile development` to create the build -- EAS handles it remotely, no local Xcode/Android Studio required. Source: [Expo: Switch from Expo Go to Dev Build](https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build/)
- Set environment variables as EAS secrets: `eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "..."`
- Budget 2-3 days for the first successful EAS build (credential setup, provisioning profiles, build debugging)
- The project already has `"newArchEnabled": true` -- verify all native dependencies support New Architecture before building
- Keep Expo Go available for non-native feature development; use EAS builds for IAP/push/deep link testing

**Detection:** Try to import `react-native-iap` or call `getExpoPushToken()` in Expo Go. If it crashes or returns mock data, you need a development build.

**Which phase:** EAS build setup, before IAP implementation.

**Confidence:** HIGH -- Expo documentation explicitly states IAP requires development builds. Source: [Expo In-App Purchases Guide](https://docs.expo.dev/guides/in-app-purchases/).

---

### Pitfall 10: Password Reset for Student Accounts -- Parent vs Student Reset Flow

**What goes wrong:** The app has two user types, both with Supabase auth accounts. Password reset needs to handle both, but the flows differ:
- **Parents** reset their own password (standard flow)
- **Students** may be minors who do not manage their own email. The student's email was entered by the parent during account creation. If the student forgets their password, WHO resets it? If the student uses password reset, the email goes to whatever address was entered -- which the student may not have access to.

Additionally, if the password reset email is sent to a student's email and the student is under 13, this could be a COPPA touchpoint (sending emails to children's addresses with links to modify account credentials).

**Why it happens:** The password reset flow is designed for a single-user-type system. Adding a second user type (students, potentially minors) without modifying the flow creates edge cases.

**Consequences:** Students cannot reset their passwords without parent help, but the app has no mechanism for parent-initiated student password reset. Support tickets. Frustrated families.

**Prevention:**
- Add a "Reset Student Password" feature in the parent dashboard -- parent authenticates, selects student, enters new password for student
- Implement this via Supabase edge function using `supabase.auth.admin.updateUserById()` (requires `service_role` key, so must be server-side)
- The standard "Forgot Password" flow on the login screen should work for parents (who control their own email)
- For students: either (a) do not show "Forgot Password" option and instead show "Ask your parent to reset your password", or (b) show "Forgot Password" with a note that the reset email will be sent to the email on file (which the parent set)
- Consider whether students should even have access to password reset independently, given COPPA implications

**Detection:** Try the password reset flow as a student user. Check who receives the email and whether the student can complete the flow independently.

**Which phase:** Password reset implementation phase. Must design for both user types.

**Confidence:** HIGH -- verified by codebase inspection. Student profiles have `email` field and real auth accounts. No parent-initiated password reset mechanism exists.

---

### Pitfall 11: Data Export Must Include All User Data Across Multiple Tables

**What goes wrong:** GDPR Article 20 (data portability) and CCPA require that users can export their personal data in a machine-readable format. For Centsible Scholar, a parent's data spans 10+ tables: `parent_profiles`, `student_profiles`, `student_grades`, `behavioral_assessments`, `education_bonuses`, `savings_goals`, `family_meetings`, `user_subscriptions`, `student_settings`, and more. Missing any table means incomplete export and potential compliance violation.

**Why it happens:** Developers build export for the obvious tables (profiles, grades) but miss related data (settings, audit logs, subscription history, notification preferences). The schema is wide and joins are complex.

**Consequences:** Incomplete data export. Regulatory complaint. Also, Apple now recommends (not yet requires) that apps with account deletion also offer data export/download.

**Prevention:**
- Create a comprehensive data export Supabase edge function that:
  1. Queries ALL tables where `user_id = requesting_user_id` or where data relates to the user's students
  2. Formats as JSON (machine-readable) with clear structure
  3. Includes student data for all children associated with the parent
  4. Returns as a downloadable file or sends via email
- Maintain a "data map" document listing every table and column that contains user data -- update this whenever the schema changes
- Tables to include: `parent_profiles`, `student_profiles`, `parent_student_relationships`, `student_grades`, `behavioral_assessments`, `education_bonuses`, `savings_goals`, `family_meetings`, `student_settings`, `user_subscriptions`, `user_tour_progress`
- Test export with a data-rich account to verify completeness
- The export should NOT include: auth credentials, hashed passwords, internal IDs that are meaningless to the user, or admin audit logs

**Detection:** Request a data export. Compare the export against the database schema. If any user-facing table is missing, the export is incomplete.

**Which phase:** Data export/deletion phase.

**Confidence:** MEDIUM -- GDPR/CCPA requirements are clear, but the exact tables and format are project-specific. The table list above is based on codebase inspection of `types.ts`.

---

### Pitfall 12: Subscription State Desync Between Web (Stripe) and Mobile (IAP)

**What goes wrong:** A user subscribes via Stripe on the web. They open the mobile app and expect premium access. But the mobile app only checks IAP receipts, not Stripe status. Conversely, a user subscribes via IAP on mobile, opens the web app, and Stripe shows no subscription. Without a unified entitlement system, users on different platforms see different subscription states.

**Why it happens:** Stripe and Apple/Google IAP are completely separate payment systems with no built-in cross-platform awareness. Each has its own webhook system, receipt format, and status lifecycle.

**Consequences:** Users pay but do not get access on one platform. Double-subscription if user subscribes on both platforms. Support tickets. Refund requests.

**Prevention:**
- Design a unified entitlement layer in Supabase: the `user_subscriptions` table (or a new `entitlements` table) is the single source of truth
- Both Stripe webhooks (web) and IAP receipt validation (mobile) write to the same table
- The `useSubscriptionStatus` hook checks entitlement status, not payment source
- On the mobile paywall: before showing purchase options, check if user already has an active subscription from any source. If yes, show "You have an active subscription" instead of purchase buttons
- On the web paywall: similarly check for IAP-sourced subscriptions
- RevenueCat handles this natively with their "subscriber" concept that spans platforms. If using RevenueCat, set the `appUserID` to the Supabase `user.id` to link subscriptions across platforms. Source: [RevenueCat Expo Integration](https://www.revenuecat.com/docs/getting-started/installation/expo)
- For webhook integration with Supabase: RevenueCat can send webhooks to a Supabase edge function that updates the entitlement table. Source: [RevenueCat Webhooks](https://www.revenuecat.com/docs/integrations/webhooks)

**Detection:** Subscribe on web via Stripe. Open mobile app. If premium features are locked, desync exists.

**Which phase:** IAP architecture phase. The unified entitlement design must be decided before implementing either payment path.

**Confidence:** HIGH for the problem. MEDIUM for the RevenueCat solution (based on their documentation, not firsthand verification with this specific Supabase schema).

---

### Pitfall 13: EAS Environment Variables Missing in Production Builds

**What goes wrong:** Expo Go reads from `.env` files locally. EAS builds do NOT include `.env` files. The `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables will be `undefined` in production builds unless configured as EAS secrets. The Supabase client will be initialized with `undefined` URL, causing silent failures or crashes on every network request.

**Why it happens:** Environment variable handling differs between local development (Expo Go) and EAS builds. The `.env` file works locally but is not included in the build artifact.

**Consequences:** App builds and installs successfully but shows blank screens, auth fails silently, or crashes on first Supabase request. This is extremely confusing because the build itself succeeds.

**Prevention:**
- Set EAS secrets: `eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"` and `eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"`
- Add a runtime check at app startup: if `supabaseUrl` is falsy, show an error screen instead of silently failing
- Test connectivity in the first EAS preview build before building any features
- Consider converting `app.json` to `app.config.js` for more flexible env var handling

**Detection:** Build with EAS, install on device. If the login screen shows but login fails with a network error, environment variables are missing.

**Which phase:** EAS build setup. Must be the first thing configured.

**Confidence:** HIGH -- this is a well-documented Expo pitfall. Source: [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/).

---

### Pitfall 14: App Store Paywall Missing Required Disclosures (Guideline 3.1.2)

**What goes wrong:** Apple requires that auto-renewable subscription paywalls display ALL of the following on the same screen, visible without scrolling: (1) exact price, (2) billing period, (3) that it auto-renews until canceled, (4) trial length (if applicable), (5) how to cancel. Missing any one of these causes rejection. Additionally, the paywall must include: (6) "Restore Purchases" button, (7) link to Terms of Use, (8) link to Privacy Policy.

**Why it happens:** Developers design attractive paywalls focused on value proposition and call-to-action, then forget the legally required fine print.

**Consequences:** App Store rejection under Guideline 3.1.2. Source: [Apple Guideline 3.1.2 Explained](https://www.angularcorp.com/en/insights/apple-guideline-3-1-2-subscription-rejection-missing-links/).

**Prevention:**
- Design paywall with compliance checklist: price, period, auto-renewal notice, trial length, cancel instructions, Restore Purchases, Terms link, Privacy link
- Use Apple's recommended subscription terms text as a template
- "Restore Purchases" must actually work -- test by purchasing on one device, then restoring on another (or after reinstall)
- Free trial minimum is 3 days; standard is 7 days
- Terms and Privacy links must be functional and load on mobile (not just desktop)

**Detection:** Screenshot the paywall and check each of the 8 items against the list above.

**Which phase:** IAP implementation phase. Build compliance into the paywall design from the start.

**Confidence:** HIGH -- multiple documented rejection cases for this exact issue.

---

### Pitfall 15: New Architecture Compatibility with Native IAP Libraries

**What goes wrong:** The app has `"newArchEnabled": true` in `app.json` (React Native New Architecture with Fabric + TurboModules). Not all third-party native libraries support New Architecture. Adding `react-native-iap` or RevenueCat SDK may fail to compile with cryptic C++ errors, or crash at runtime with "TurboModule not found" errors.

**Why it happens:** New Architecture migration is ongoing in the React Native ecosystem. Libraries that work on Old Architecture may not have been updated.

**Consequences:** Build failures, runtime crashes, or the need to disable New Architecture (which is safe but loses performance benefits).

**Prevention:**
- Before adding any native IAP library, check its README and GitHub issues for New Architecture support status
- `expo-iap` (Expo's official IAP module) is more likely to support New Architecture than community alternatives, since Expo maintains New Architecture compatibility
- `react-native-purchases` (RevenueCat) has New Architecture support as of recent versions -- verify current version compatibility
- If compilation fails, try: (a) updating the library to latest, (b) checking if a New Architecture-compatible fork exists, (c) disabling New Architecture as fallback (`"newArchEnabled": false`)
- Test an EAS build with the IAP library added but before writing IAP code -- catch compilation errors early

**Detection:** Run `eas build --profile development` after adding the IAP dependency. If it fails with C++ or TurboModule errors, there is a compatibility issue.

**Which phase:** EAS build setup, when adding IAP dependency.

**Confidence:** MEDIUM -- New Architecture support varies by library and version. Check at implementation time.

---

## Minor Pitfalls

Mistakes that cause annoyance, polish issues, or minor rework.

### Pitfall 16: App Store Review Demo Account Has Stale or Missing Data

**What goes wrong:** Apple reviewers test with provided demo credentials. If the account has no data (no students, no grades, no earnings), reviewers cannot evaluate features and reject for "insufficient functionality" (Guideline 2.1). If the subscription has expired between submissions, premium features are locked during review.

**Prevention:**
- Create a dedicated review account: `appreview@centsiblescholar.com` with stable password
- Pre-populate: 2+ students, 30+ days of grades, behavior assessments, savings goals, QOD responses
- Ensure subscription is always active (set far-future expiration or refresh before each submission)
- Provide BOTH parent and student demo credentials in review notes
- Include clear instructions in review notes explaining the two user types and what to expect on each

**Which phase:** Pre-submission.

---

### Pitfall 17: Simulated Financial System Confuses Apple Reviewer

**What goes wrong:** The app has "earnings," "savings goals," "taxes," and "retirement" allocations. Apple reviewers may interpret this as a real financial/banking app and require regulatory compliance disclosures per Guideline 5.1.1(ix).

**Prevention:**
- In review notes: "This is a SIMULATED educational system. No real money is exchanged. 'Earnings' are virtual rewards based on academic performance, designed to teach financial literacy."
- Add in-app disclaimer visible in settings or onboarding
- Use Education category, not Finance category
- Consider labeling amounts as "CS Dollars" or "Scholar Bucks" instead of "$" in the UI

**Which phase:** Pre-submission review notes and UI polish.

---

### Pitfall 18: Babel Config Missing Reanimated Plugin Breaks EAS Builds

**What goes wrong:** `react-native-reanimated` (v4.1.1 in project) requires its Babel plugin listed as the LAST item in `babel.config.js`. In Expo Go this is handled automatically. In EAS builds, if the plugin order is wrong or missing, the app crashes on launch.

**Prevention:**
- Verify `babel.config.js` includes `'react-native-reanimated/plugin'` as the final plugin
- Test animations in the first EAS development build
- If app crashes immediately on launch in EAS build but works in Expo Go, check Babel config first

**Which phase:** EAS build setup.

---

### Pitfall 19: `eas.json` Placeholder Values Block First Submission

**What goes wrong:** The `eas.json` may contain placeholders like `"ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"` and `"appleTeamId": "YOUR_APPLE_TEAM_ID"`. Submitting with these values produces confusing authentication errors.

**Prevention:**
- Replace ALL placeholder values before first build attempt
- Run a preview build first to validate the pipeline
- Keep EAS CLI updated: `npm install -g eas-cli@latest`

**Which phase:** EAS build setup.

---

### Pitfall 20: Google Play Requires APK Upload Before IAP Products Are Visible

**What goes wrong:** On Google Play, configured IAP products only become visible to the app after an APK has been uploaded to at least an internal testing track, AND the version code matches. If you try to test IAP before uploading a build, `getProducts()` returns empty arrays.

**Prevention:**
- Upload an initial build to Google Play internal testing track before testing IAP
- Ensure the `versionCode` in `app.json` matches the uploaded build
- Note: App Store Connect product propagation can also take hours after creation -- do not panic if products do not appear immediately. Source: [RevenueCat Community - Offerings Are Empty](https://community.revenuecat.com/sdks-51/expo-react-native-offerings-are-empty-how-to-develop-with-internal-distribution-build-2730)

**Which phase:** IAP implementation (Android-specific testing).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Planning/Architecture** | Pitfall 1 (schema), Pitfall 6 (Kids Category), Pitfall 7 (gate placement), Pitfall 12 (entitlement design) | Make architectural decisions before writing code. Document the free vs premium split. Choose IAP library. |
| **EAS Build Setup** | Pitfall 9 (Expo Go limitations), Pitfall 13 (env vars), Pitfall 15 (New Arch), Pitfall 18 (Reanimated), Pitfall 19 (placeholders) | Budget 2-3 days. Do a trial build before feature work. |
| **IAP Implementation** | Pitfall 2 (Stripe references), Pitfall 8 (receipt race condition), Pitfall 14 (paywall disclosures), Pitfall 20 (Google Play APK requirement) | Remove all Stripe UI references. Design purchase flow for race conditions. Build paywall with compliance checklist. |
| **Password Reset** | Pitfall 3 (deep link failures), Pitfall 10 (student vs parent reset) | Use OTP-based reset (avoids deep linking entirely). Add parent-initiated student password reset. |
| **Student Routing** | Pitfall 4 (no role check) | Add `user_type` check to root redirect. Create separate tab layouts. Use `Stack.Protected`/`Tabs.Protected`. |
| **Data Export/Deletion** | Pitfall 5 (account deletion), Pitfall 11 (export completeness) | Native in-app deletion via edge function. Comprehensive export covering all tables. |
| **Pre-Submission** | Pitfall 16 (demo account), Pitfall 17 (finance disclaimer), Pitfall 6 (age rating) | Prepare review notes, demo accounts, and store metadata well before submission day. |

---

## Top 5 Highest-Impact Pitfalls (Address First)

1. **Pitfall 1 -- Stripe Schema Blocks IAP** -- Architectural decision that gates all IAP work
2. **Pitfall 4 -- No Role-Based Routing** -- Students see parent UI, foundational routing issue
3. **Pitfall 3 -- Password Reset Deep Links Fail** -- Choose OTP approach early to avoid weeks of deep link debugging
4. **Pitfall 2 -- Apple Rejects Stripe References** -- Every Stripe mention must be removed before submission
5. **Pitfall 5 -- Account Deletion Required** -- Common rejection reason, needs edge function implementation

---

## Sources

### Official Documentation (HIGH confidence)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Expo In-App Purchases Guide](https://docs.expo.dev/guides/in-app-purchases/)
- [Expo: Switch from Expo Go to Dev Build](https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build/)
- [Expo Router Protected Routes](https://docs.expo.dev/router/advanced/protected/)
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Apple: Account Deletion Requirement](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [RevenueCat Expo Installation](https://www.revenuecat.com/docs/getting-started/installation/expo)

### Community Sources (MEDIUM confidence)
- [Why I Ditched Deep Linking for Token-Based Password Reset in Supabase](https://dev.to/tanmay_kaushik_/why-i-ditched-deep-linking-for-a-token-based-password-reset-in-supabase-3e69)
- [Apple Guideline 3.1.2 Explained](https://www.angularcorp.com/en/insights/apple-guideline-3-1-2-subscription-rejection-missing-links/)
- [COPPA Compliance 2025 Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [Supabase Discussion #33633: Deep Link Inconsistency](https://github.com/orgs/supabase/discussions/33633)
- [RevenueCat Community: Offerings Are Empty](https://community.revenuecat.com/sdks-51/expo-react-native-offerings-are-empty-how-to-develop-with-internal-distribution-build-2730)
- [App Store Review Guidelines Checklist (2025)](https://nextnative.dev/blog/app-store-review-guidelines)

### Codebase Analysis (HIGH confidence)
- `src/hooks/useSubscriptionStatus.ts` -- Stripe-specific subscription logic
- `src/integrations/supabase/types.ts` -- `user_subscriptions` table schema with Stripe columns
- `app/index.tsx` -- No role-based routing (lines 17-21)
- `src/contexts/StudentContext.tsx` -- Assumes parent user type
- `src/contexts/AuthContext.tsx` -- No user type differentiation
- `app.json` -- `newArchEnabled: true`, `scheme: centsiblescholar`, `associatedDomains`

---

*Research completed: 2026-02-05*
