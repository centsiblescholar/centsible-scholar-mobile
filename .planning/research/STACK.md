# Technology Stack: v1.0 Feature Additions

**Project:** Centsible Scholar Mobile
**Researched:** 2026-02-05
**Context:** React Native 0.81.5 / Expo SDK 54 / Supabase JS 2.86 / Expo Router 6 / TanStack React Query 5
**Goal:** Identify libraries needed for IAP subscriptions, password reset, student dashboard routing, data export/deletion, UI polish, and App Store assets

---

## Existing Stack (Validated -- DO NOT change)

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Mobile framework |
| Expo | ~54.0.25 | Managed workflow, EAS builds |
| Expo Router | ~6.0.15 | File-based routing |
| @supabase/supabase-js | ^2.86.0 | Backend (auth, database, edge functions) |
| @tanstack/react-query | ^5.90.11 | Server state management |
| react-hook-form + zod | ^7.67.0 / ^4.1.13 | Form validation |
| zustand | ^5.0.9 | Client state management |
| react-native-reanimated | ~4.1.1 | Animations |
| react-native-gesture-handler | ~2.28.0 | Gesture handling |
| expo-linking | ~8.0.9 | Deep link handling |
| expo-notifications | ~0.32.16 | Push notifications |

---

## 1. In-App Purchases (SUB-01, SUB-02, SUB-03)

### Recommendation: RevenueCat (`react-native-purchases`) v9.7.x

**Confidence:** HIGH (verified via npm, RevenueCat docs, Expo official guidance)

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-purchases` | ^9.7.6 | RevenueCat SDK for Apple IAP + Google Play Billing |
| `react-native-purchases-ui` | latest | Pre-built paywall UI components (optional) |

**Why RevenueCat over raw `react-native-iap` or `expo-iap`:**

1. **Eliminates server-side receipt validation entirely.** RevenueCat handles receipt validation, subscription lifecycle management, and renewal tracking on their infrastructure. With `react-native-iap` or `expo-iap`, you must build and maintain your own receipt validation edge functions, Apple App Store Server Notifications v2 webhook handler, Google Real-Time Developer Notifications handler, and subscription state machine. This is 2-4 weeks of backend work that RevenueCat eliminates.

2. **Expo Go Preview Mode.** RevenueCat's SDK automatically detects Expo Go and enters "Preview API Mode" -- all native IAP calls are replaced with JavaScript-level mock APIs. Your app loads without errors, subscription UI renders correctly, and integration logic executes. Real purchases require a dev build, but UI development and flow testing work in Expo Go. Neither `react-native-iap` nor `expo-iap` offer this -- they crash in Expo Go.

3. **Free for this project's scale.** RevenueCat is free up to $2,500/month in tracked revenue (MTR), then 1% of revenue beyond that. For a v1.0 launch of an education app, you will be well under the free tier for months or years. There is no upfront cost.

4. **Cross-platform subscription sync.** The existing web app uses Stripe. RevenueCat can coexist: mobile subscriptions go through Apple/Google via RevenueCat, web subscriptions continue through Stripe. RevenueCat's webhook can sync subscription status to the existing `user_subscriptions` Supabase table.

5. **Active maintenance.** v9.7.6 was published Feb 3, 2026. Regular weekly releases. 50,000+ apps in production.

**Why NOT `react-native-iap` (v14.x, Nitro-based):**
- Requires building your own receipt validation backend (Supabase edge functions for Apple + Google)
- Requires implementing subscription state machine (renewals, grace periods, cancellations, billing retry)
- Requires handling App Store Server Notifications v2 and Google RTDN webhooks
- No Expo Go compatibility at all -- immediate crash
- The `^15.x` version referenced in prior research does not exist; current is 14.x
- Appropriate for teams with existing IAP backend infrastructure, not for a v1.0 launch

**Why NOT `expo-iap` (v3.4.8):**
- Lower adoption (332 GitHub stars vs RevenueCat's ecosystem)
- Same backend burden as `react-native-iap` -- no server-side receipt validation included
- Known Kotlin 2.0 compatibility issue with `expo-modules-core` that may require manual overrides
- Still requires dev builds, no Expo Go fallback
- Less battle-tested for production subscription management

**Integration with existing Supabase backend:**

RevenueCat webhooks notify your backend of subscription events. Create one Supabase edge function:

| Edge Function | Purpose |
|---------------|---------|
| `revenuecat-webhook` | Receives RevenueCat webhook events, updates `user_subscriptions` table |

This replaces the need for separate `validate-receipt` and `subscription-webhook` edge functions.

**App Store / Play Store configuration required:**
- Apple: Create subscription products in App Store Connect, configure Shared Secret
- Google: Create subscription products in Google Play Console, configure Service Account
- RevenueCat: Configure both stores in RevenueCat dashboard, set app_user_id to Supabase user UUID

**Installation:**
```bash
npx expo install react-native-purchases react-native-purchases-ui
```

**app.json plugin (auto-configured by expo install):**
```json
{
  "plugins": ["react-native-purchases"]
}
```

**Expo Go behavior:** Preview API Mode activates automatically. All SDK calls succeed with mock data. Paywall UI renders. No crashes. Real purchases require `eas build --profile development`.

---

## 2. Password Reset Flow (AUTH-04)

### Recommendation: No new packages -- use existing Supabase SDK + Expo Linking

**Confidence:** HIGH (verified via Supabase official docs)

| Package | Version | Purpose |
|---------|---------|---------|
| None needed | -- | Supabase JS SDK and expo-linking already installed |

**How it works:**

Supabase provides `resetPasswordForEmail()` and `updateUser()` in the already-installed `@supabase/supabase-js` SDK. The flow uses deep linking which is already configured:

- `app.json` already has `"scheme": "centsiblescholar"`
- `expo-linking` (v8.0.9) is already installed
- `associatedDomains` already configured for `applinks:centsiblescholar.com`

**Two-screen implementation:**

1. **Forgot Password screen** (`app/(auth)/forgot-password.tsx`):
   - User enters email
   - Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'centsiblescholar://reset-password' })`
   - Shows confirmation message

2. **Reset Password screen** (`app/(auth)/reset-password.tsx`):
   - Deep link opens this route with auth tokens in URL
   - Supabase's `onAuthStateChange` fires `PASSWORD_RECOVERY` event
   - User enters new password
   - Calls `supabase.auth.updateUser({ password: newPassword })`

**Required configuration (not code):**
- Add `centsiblescholar://reset-password` to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs
- For production: host `apple-app-site-association` at `https://centsiblescholar.com/.well-known/` for Universal Links
- For production: host `assetlinks.json` at `https://centsiblescholar.com/.well-known/` for Android App Links

**Expo Router deep link handling:**
Expo Router v6 (SDK 54) supports `+native-intent.tsx` for advanced URL processing, and protected routes for authentication guards. The deep link URL (`centsiblescholar://reset-password?token=...`) maps directly to a file-system route.

---

## 3. Student Dashboard Routing (DASH-03, DASH-04, QOD-04)

### Recommendation: No new packages -- use Expo Router route groups

**Confidence:** HIGH

| Package | Version | Purpose |
|---------|---------|---------|
| None needed | -- | Expo Router file-based routing handles this |

**How it works:**

The app already has `(auth)` and `(tabs)` route groups. Add a `(student)` route group:

```
app/
  (auth)/          -- existing login/signup
  (tabs)/          -- existing parent dashboard
  (student)/       -- NEW: student dashboard
    _layout.tsx    -- Student tab navigator
    dashboard.tsx  -- Student home
    assessment.tsx -- Daily question
    progress.tsx   -- Student's own progress
```

**Routing logic in `app/index.tsx`:**
- Check `user.user_metadata.user_type`
- `'parent'` -> redirect to `/(tabs)/dashboard`
- `'student'` -> redirect to `/(student)/dashboard`

No additional routing library needed. The existing `AuthContext` provides user metadata for routing decisions.

---

## 4. Data Export, Backup, and Deletion (DATA-01)

### Recommendation: `expo-file-system` (new API) + `expo-sharing`

**Confidence:** HIGH (verified via Expo SDK 54 docs)

| Package | Version | Purpose | Expo Go? |
|---------|---------|---------|----------|
| `expo-file-system` | ~19.0.21 | Write export files | Yes -- included in Expo Go |
| `expo-sharing` | ~14.0.8 | Native share sheet | Yes -- included in Expo Go |

**IMPORTANT -- SDK 54 API change:** Expo SDK 54 introduced a new object-oriented file system API as the default. The legacy function-based API (`readAsStringAsync`, `writeAsStringAsync`, `documentDirectory`) moved to `expo-file-system/legacy`. Use the new API:

```typescript
// NEW API (SDK 54 default)
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const csvFile = new File(Paths.cache, 'export.csv');
csvFile.create();
csvFile.write(csvContent);

await Sharing.shareAsync(csvFile.uri, { mimeType: 'text/csv' });
```

```typescript
// LEGACY API (still available but not default)
import * as FileSystem from 'expo-file-system/legacy';
```

**CSV/JSON generation:** No library needed. The data is simple tabular structures (grades, assessments, allocations). Build CSV strings manually, matching the web app's pattern.

**Why NOT `papaparse` or `react-papaparse`:**
- The export data is simple and predictable
- `react-papaparse` v4.4.0 was last published 2+ years ago
- Manual CSV generation is under 50 lines of code for this use case
- Can add later if export complexity grows

### Account Deletion (App Store Requirement)

**This is mandatory for App Store submission.** Apple requires that apps supporting account creation must also offer in-app account deletion (App Store Review Guideline 5.1.1(v), enforced since January 2022).

**Implementation:** Supabase edge function for user self-deletion.

| Edge Function | Purpose |
|---------------|---------|
| `delete-account` | Deletes user auth record + cascades to all user data |

The `deleteUser` method in Supabase requires the `SERVICE_ROLE` key and must run server-side (edge function), never on the client. The edge function should:
1. Verify the requesting user's JWT
2. Delete all user data from application tables (cascade via foreign keys)
3. Call `supabase.auth.admin.deleteUser(userId)`
4. Return success

**Data export before deletion:** Offer the CSV/JSON export flow as a "Download your data" step before the deletion confirmation screen.

**Installation:**
```bash
npx expo install expo-file-system expo-sharing
```

---

## 5. UI Polish (STYLE-01, STYLE-02)

### Recommendation: No new UI framework -- extend the existing custom theme system

**Confidence:** HIGH

| Package | Version | Purpose |
|---------|---------|---------|
| None needed | -- | Existing theme system in `src/theme/` is comprehensive |

**Why NOT add NativeWind or Tamagui:**

The app already has a well-structured custom theme system (`src/theme/`) with:
- Color system matching the web app's Tailwind palette (`colors.ts`)
- Typography scale (`typography.ts`)
- Spacing system based on 4px base unit (`spacing.ts`)
- Shadows, border radius, sizing constants
- Light and dark theme definitions
- Semantic layout aliases (cardPadding, screenPaddingHorizontal, etc.)

Adding NativeWind (Tailwind for RN) or Tamagui at this stage would:
- Require rewriting all existing StyleSheet-based components
- Add compilation complexity (both use build-time transforms)
- Not provide meaningful benefit -- the existing theme already mirrors Tailwind's scale
- Risk introducing styling inconsistencies during the rewrite

**What to do instead:**
1. Build a shared component library (`src/components/ui/`) with reusable primitives: `Button`, `Card`, `Input`, `Badge`, `Modal`, `StatusIndicator`
2. Apply the existing theme consistently across all screens
3. Match the web app's visual design using the already-mapped color and spacing tokens
4. The theme already has dark mode definitions (`darkTheme` in `colors.ts`) -- wire it up when ready

**If a UI framework is needed later (post-v1.0):**
NativeWind v4+ is the strongest choice for this project because the web app uses Tailwind, and NativeWind would allow near-identical class names. But this is a post-launch optimization, not a v1.0 requirement.

---

## 6. App Store Assets (STORE-01, STORE-02)

### Recommendation: No new packages -- use existing Expo configuration + EAS

**Confidence:** HIGH (verified via Expo SDK 54 docs)

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-splash-screen` | (already bundled) | Splash screen configuration |
| None additional | -- | `app.json` config handles icons |

**App Icon:**
- `app.json` already configured with `icon`, `ios.icon` paths, and Android `adaptiveIcon`
- SDK 54 supports iOS 26 Liquid Glass icons (`.icon` directory via Icon Composer app)
- Requirement: 1024x1024 square PNG, no transparency, no rounded corners
- Android adaptive icon: separate foreground (1024x1024) and background images
- EAS Build generates all required sizes from these source images

**Splash Screen:**
- `expo-splash-screen` is pre-installed in every Expo project
- Current config uses `backgroundColor: "#4F46E5"` and a splash icon
- SDK 54 supports splash icon configuration via the `expo-splash-screen` config plugin
- Requirement: 1024x1024 PNG with transparent background for the icon

**EAS Build and Submission:**
- Apple: Requires $99/year Apple Developer Program membership
- Google: Requires Google Play Console account ($25 one-time) + service account key for EAS Submit
- Use `eas build --platform all --profile production` for store builds
- Use `eas submit` for automated submission to both stores

---

## 7. Children's Privacy Compliance (Cross-cutting)

### Recommendation: Configuration and policy, not libraries

**Confidence:** MEDIUM (regulatory landscape is evolving)

**COPPA considerations for this app:**
- This app is parent-directed (parents create accounts, manage students)
- Students have their own auth accounts with emails set by parents
- Student data includes grades, behavioral assessments, and financial literacy scores
- Under COPPA, verifiable parental consent (VPC) is required before collecting personal information from children under 13

**What this means for the stack:**
- No new libraries needed, but the existing auth flow must ensure parent consent is captured
- The parent creates the student account (implicit consent model), but the consent should be explicitly logged
- Apple's App Store Accountability Acts (effective Jan 2026 in Texas, May 2026 in Utah) require app stores to obtain parental consent for minors -- Apple handles this via Family Sharing, but your app must be correctly categorized

**App Store privacy declarations needed:**
- Data collection disclosure in App Store Connect
- Privacy policy URL (already configured via web domain)
- Kids category consideration: If targeting under-13, additional restrictions apply (no third-party analytics, no advertising)

---

## Summary: All New Packages

| Package | Version | Purpose | Expo Go? | Feature |
|---------|---------|---------|----------|---------|
| `react-native-purchases` | ^9.7.6 | RevenueCat IAP SDK | Preview Mode (mock) | SUB-01/02/03 |
| `react-native-purchases-ui` | latest | Paywall UI components | Preview Mode (mock) | SUB-01 |
| `expo-file-system` | ~19.0.21 | File write (new API) | Yes | DATA-01 |
| `expo-sharing` | ~14.0.8 | Native share sheet | Yes | DATA-01 |

**Total new dependencies: 4 packages**

All other features (password reset, student dashboard routing, UI polish, App Store assets) use the existing stack.

---

## What NOT to Install

| Library | Why NOT |
|---------|---------|
| `react-native-iap` | Requires building your own receipt validation backend, webhook handlers, and subscription state machine. No Expo Go fallback. Appropriate for teams with existing IAP infrastructure, not v1.0 launch. |
| `expo-iap` | Same backend burden as react-native-iap. Lower adoption (332 stars). Known Kotlin 2.0 compatibility issues with expo-modules-core on SDK 54. |
| `expo-in-app-purchases` | Deprecated since Expo SDK 49. |
| `NativeWind` / `Tamagui` | App already has comprehensive custom theme system. Adding a framework now means rewriting all existing components for no user-facing benefit. Consider post-v1.0. |
| `papaparse` | Overkill for simple CSV export of tabular data. |
| `expo-crypto` | Does NOT work in Expo Go. Use `Date.now().toString(36) + Math.random().toString(36).substr(2)` for local IDs. |
| `jsPDF` | No native rendering pipeline in RN. Use `expo-print` if PDF generation is needed. |
| `expo-web-browser` | Not needed for password reset. Deep linking via expo-linking handles the redirect flow. |

---

## Supabase Backend Additions

### Edge Functions (New)

| Function | Purpose | Replaces |
|----------|---------|----------|
| `revenuecat-webhook` | Sync RevenueCat subscription events to `user_subscriptions` table | Manual receipt validation |
| `delete-account` | User self-deletion (App Store requirement) | N/A -- new requirement |

### Database Changes

| Change | Purpose |
|--------|---------|
| Update `user_subscriptions` table | Add `revenuecat_customer_id`, `platform` (ios/android/web) columns |
| Add cascade deletes | Ensure `DELETE` on `auth.users` cascades to all application tables |

Note: The existing `user_subscriptions` table with `stripe_customer_id` continues to work for web subscriptions. Mobile subscriptions coexist via RevenueCat's `revenuecat_customer_id`.

---

## Development Workflow Impact

**Expo Go remains viable for most development:**
- Password reset, student dashboard, data export, UI polish, and App Store assets all work in Expo Go
- RevenueCat enters Preview API Mode in Expo Go (subscription UI renders, mock purchases succeed)
- Only real IAP testing requires `eas build --profile development`

**Recommended development order:**
1. Build all non-IAP features in Expo Go first
2. Install RevenueCat and build subscription UI (testable in Expo Go via Preview Mode)
3. Create EAS development build for real IAP testing on device with sandbox accounts
4. Final production build via `eas build --profile production`

---

## Confidence Summary

| Feature Area | Recommendation | Confidence | Complexity |
|-------------|----------------|------------|------------|
| IAP Subscriptions | RevenueCat `react-native-purchases` | HIGH | MEDIUM -- RevenueCat handles the hard parts |
| Password Reset | Existing Supabase SDK + deep links | HIGH | MEDIUM -- deep link config, auth state handling |
| Student Dashboard | Expo Router route groups | HIGH | LOW -- file-based routing, conditional redirect |
| Data Export | `expo-file-system` + `expo-sharing` | HIGH | LOW -- port web formatters, use new SDK 54 API |
| Account Deletion | Supabase edge function | HIGH | MEDIUM -- edge function + cascade deletes + UI flow |
| UI Polish | Extend existing theme system | HIGH | MEDIUM -- build component library, apply consistently |
| App Store Assets | Existing Expo config + EAS | HIGH | LOW -- asset preparation, store configuration |
| COPPA Compliance | Policy/configuration | MEDIUM | LOW-MEDIUM -- consent logging, privacy declarations |

---

## Sources

- [Expo In-App Purchases Guide](https://docs.expo.dev/guides/in-app-purchases/) -- Official Expo recommendation
- [RevenueCat Expo Installation](https://www.revenuecat.com/docs/getting-started/installation/expo) -- SDK setup, Preview API Mode
- [RevenueCat Pricing](https://www.revenuecat.com/pricing/) -- Free up to $2.5k MTR, then 1%
- [RevenueCat Common Architecture](https://www.revenuecat.com/docs/guides/common-architecture) -- Webhook + backend sync pattern
- [Expo + RevenueCat Tutorial](https://expo.dev/blog/expo-revenuecat-in-app-purchase-tutorial) -- Official Expo blog
- [react-native-purchases Releases](https://github.com/RevenueCat/react-native-purchases/releases) -- v9.7.6 (Feb 3, 2026)
- [expo-iap GitHub](https://github.com/hyochan/expo-iap) -- v3.4.8 (Jan 27, 2026)
- [Supabase Password-Based Auth](https://supabase.com/docs/guides/auth/passwords) -- resetPasswordForEmail flow
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) -- Expo deep link setup
- [Expo FileSystem SDK 54](https://docs.expo.dev/versions/latest/sdk/filesystem/) -- New object-oriented API, v19.0.21
- [Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) -- v14.0.8, included in Expo Go
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) -- Breaking changes, new packages
- [Expo Splash Screen & App Icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) -- Asset requirements
- [Apple Account Deletion Requirement](https://developer.apple.com/support/offering-account-deletion-in-your-app/) -- Guideline 5.1.1(v)
- [Supabase User Self-Deletion](https://blog.mansueli.com/supabase-user-self-deletion-empower-users-with-edge-functions) -- Edge function pattern
- [COPPA Compliance 2025 Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

---

*Research completed: 2026-02-05*
*Verified against: Expo SDK 54.0.25, React Native 0.81.5, react-native-purchases v9.7.6, expo-iap v3.4.8*
*Previous STACK.md corrected: react-native-iap ^15.x does not exist (current is 14.x); RevenueCat free tier is $2.5k MTR not $2.5M; expo-file-system has new API in SDK 54*
