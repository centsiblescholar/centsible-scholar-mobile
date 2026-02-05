# Architecture Patterns: v1.0 Feature Integration

**Domain:** React Native/Expo mobile app with Supabase backend
**Researched:** 2026-02-05
**Focus:** How v1.0 features integrate with existing Expo/Supabase architecture

---

## Current Architecture Snapshot

### Provider Stack (Root Layout)

```
QueryClientProvider (TanStack React Query)
  AuthProvider (user, session, loading)
    StudentProvider (selectedStudent, students, isParentView)
      Stack Navigator
        index.tsx -- auth gate: redirect to (tabs) or (auth)
        (auth) group -- login, signup
        (tabs) group -- dashboard, grades, behavior, learn, earnings, settings
        standalone screens -- edit-profile, term-tracking, family-meetings, etc.
```

### Key Architectural Facts

| Component | Location | Purpose |
|-----------|----------|---------|
| AuthContext | `src/contexts/AuthContext.tsx` | Holds Supabase `user` and `session`, listens to `onAuthStateChange` |
| StudentContext | `src/contexts/StudentContext.tsx` | Parent multi-student selector, `isParentView` flag |
| Supabase Client | `src/integrations/supabase/client.ts` | AsyncStorage sessions, `detectSessionInUrl: false` |
| Auth helpers | Same file as client | `signInWithEmail`, `signUpWithEmail`, `signOut`, `ensureParentProfile` |
| useUserProfile | `src/hooks/useUserProfile.ts` | Determines `isStudent`/`isParent` by checking profile tables |
| useSubscriptionStatus | `src/hooks/useSubscriptionStatus.ts` | Reads `user_subscriptions` table, exposes `isActive`, `subscriptionType` |
| URL Scheme | `app.json` | `"scheme": "centsiblescholar"` already configured |
| Associated Domains | `app.json` | `"associatedDomains": ["applinks:centsiblescholar.com"]` already configured |
| EAS Build | `eas.json` | Development, preview, and production profiles exist |
| New Arch | `app.json` | `"newArchEnabled": true` (React Native 0.81.5) |

### Role Detection Today

- `useUserProfile()` returns `isStudent` and `isParent` by checking `student_profiles` then `parent_profiles` tables
- `StudentContext` returns `isParentView` based on whether the user has students in `parent_student_relationships`
- Both roles currently see the same 6 tabs; parent-specific features are button links in Settings
- All data hooks use a `targetUserId` pattern: parent passes `selectedStudent.user_id`, student passes own `user.id`

### Existing Subscription Infrastructure

- `user_subscriptions` table stores Stripe-based subscription data (status, type, period dates)
- `useSubscriptionStatus()` hook exposes `isActive`, `subscriptionType` (single/midsize/large), `status`
- DB functions exist: `has_active_subscription()`, `has_premium_subscription()`, `validate_student_limit()`, `get_max_students_allowed()`
- Currently no subscription gate blocks access to any mobile features
- Settings links to web app (`https://centsiblescholar.com/settings`) for subscription management

---

## 1. Password Reset Flow

### Integration Points

| Existing Component | How It Integrates | Changes Needed |
|-------------------|-------------------|----------------|
| Supabase Client | `supabase.auth.resetPasswordForEmail()` already available | Add helper function |
| AuthContext | `onAuthStateChange` catches `PASSWORD_RECOVERY` event | Add event handler |
| `app.json` scheme | `centsiblescholar://` already registered | None |
| `(auth)` route group | Add password reset screens here | New screens |

### Architecture

```
Password Reset Flow:

1. User taps "Forgot Password" on login screen
   |
   v
2. app/(auth)/forgot-password.tsx (NEW)
   |-- collects email
   |-- calls supabase.auth.resetPasswordForEmail(email, {
   |     redirectTo: 'centsiblescholar://reset-password'
   |   })
   |-- shows "Check your email" confirmation
   |
3. User clicks link in email --> opens app via deep link
   |
   v
4. Deep link handling (TWO approaches, pick one):

   APPROACH A: AuthContext onAuthStateChange (RECOMMENDED)
   -------------------------------------------------------
   AuthContext already listens to onAuthStateChange.
   When event === 'PASSWORD_RECOVERY', the session contains
   access/refresh tokens. Set a flag or navigate to reset screen.

   APPROACH B: URL parsing with Linking
   -------------------------------------
   Use expo-linking to capture the redirect URL, extract tokens,
   call supabase.auth.setSession() manually.
```

**Recommendation: Approach A** because the app already has `onAuthStateChange` wired up, and Supabase automatically handles the token exchange when the app opens via deep link. The `PASSWORD_RECOVERY` event fires automatically.

### New Components

```
app/(auth)/forgot-password.tsx          -- Email input + request reset
app/(auth)/reset-password.tsx           -- New password input form

src/integrations/supabase/client.ts     -- MODIFY: add resetPasswordForEmail helper
src/contexts/AuthContext.tsx             -- MODIFY: handle PASSWORD_RECOVERY event,
                                           expose passwordRecoveryPending flag
```

### Data Flow

```
supabase.auth.resetPasswordForEmail(email, { redirectTo: 'centsiblescholar://reset-password' })
  |
  v
Supabase sends email with magic link pointing to:
  https://[project].supabase.co/auth/v1/verify?type=recovery&token=...&redirect_to=centsiblescholar://reset-password
  |
  v
User taps link --> browser opens --> Supabase verifies token -->
  redirects to centsiblescholar://reset-password#access_token=...&refresh_token=...
  |
  v
App opens via custom URL scheme
  |
  v
Supabase JS client processes the URL fragment automatically
  |
  v
onAuthStateChange fires with event = 'PASSWORD_RECOVERY'
  |
  v
AuthContext sets passwordRecoveryPending = true
  |
  v
app/index.tsx (or a useEffect in root) detects flag --> navigates to (auth)/reset-password
  |
  v
User enters new password --> supabase.auth.updateUser({ password: newPassword })
  |
  v
AuthContext clears flag --> normal auth redirect to (tabs)/dashboard
```

### Critical Configuration

The redirect URL `centsiblescholar://reset-password` must be added to Supabase project settings under **Authentication > Redirect URLs**. The scheme `centsiblescholar` is already in `app.json`.

For production, also configure **Universal Links** (iOS) and **App Links** (Android) so the deep link works without browser intermediary. The `associatedDomains` is already configured in `app.json`.

### Platform Considerations

- **Expo Go**: Deep linking with custom schemes works in Expo Go. No dev build required.
- **Supabase config**: `detectSessionInUrl: false` is set in the Supabase client. This means the client does NOT auto-parse URL tokens. You need to either change this to `true` or manually call `setSession()` from the URL parameters.
- **Android**: Custom scheme works out of the box with Expo Router.
- **iOS**: Custom scheme works out of the box with Expo Router. Universal links need apple-app-site-association file on the domain.

### Build Order

1. Add `resetPasswordForEmail` helper to Supabase client
2. Create `app/(auth)/forgot-password.tsx` screen
3. Add "Forgot Password" link to login screen
4. Handle `PASSWORD_RECOVERY` event in AuthContext
5. Create `app/(auth)/reset-password.tsx` screen
6. Add redirect URL to Supabase dashboard
7. Test deep link flow on device

---

## 2. Student Routing (Role-Based Navigation)

### Integration Points

| Existing Component | How It Integrates | Changes Needed |
|-------------------|-------------------|----------------|
| useUserProfile | Already determines `isStudent`/`isParent` | Feed into role logic |
| StudentContext | Already provides `isParentView` | Merge into unified RoleContext |
| (tabs) layout | Currently shows same tabs for all roles | Conditional tab visibility |
| app/index.tsx | Currently redirects all auth users to (tabs)/dashboard | Route based on role |

### Architecture: Conditional Tabs in Single Layout

Do NOT create separate `(parent-tabs)` and `(student-tabs)` route groups. That would duplicate shared screens, complicate deep linking, and break the existing hook patterns. Instead, use a single `(tabs)` group with conditional tab visibility.

```
src/contexts/RoleContext.tsx (NEW -- replaces StudentContext, absorbs useUserProfile logic)
  Provides:
    role: 'parent' | 'student' | null
    isParent: boolean
    isStudent: boolean
    selectedStudent: StudentInfo | null      (for parent multi-student selector)
    setSelectedStudent: (student) => void
    students: StudentInfo[]                  (for parent)
    studentProfile: StudentProfile | null    (for student's own profile)
    isLoading: boolean
```

**Tab visibility by role:**

```
Parent sees:     Dashboard  Grades  Behavior  Earnings  Settings
Student sees:    Dashboard  Grades  Behavior  Learn     Settings
```

Key differences:
- Parents do NOT see Learn tab (QOD is the student's daily challenge)
- Students do NOT see Earnings tab (that shows parent-view financial analytics)
- Both keep Dashboard, Grades, Behavior, Settings

Implementation in `app/(tabs)/_layout.tsx`:
```
<Tabs.Screen name="learn" options={{ href: isParent ? null : '/(tabs)/learn' }} />
<Tabs.Screen name="earnings" options={{ href: isStudent ? null : '/(tabs)/earnings' }} />
```

Setting `href: null` hides the tab entirely from navigation. The screen file still exists but is unreachable.

### Updated Provider Stack

```
QueryClientProvider
  AuthProvider (user, session, loading, passwordRecoveryPending)
    RoleContext (role, isParent, isStudent, selectedStudent, students)
      SubscriptionGateProvider (isSubscribed, tier, isLoading)
        Stack Navigator
```

`RoleContext` replaces both `StudentContext` and the `useUserProfile` hook for role detection. The underlying queries are the same, but consolidated into one provider that resolves role on initial load.

### Data Flow for Role Detection

```
Supabase Auth (user.id, user.email)
  |
  v
AuthContext (user, session, loading)
  |
  v
RoleContext initialization:
  1. Query parent_profiles by user_id
  2. If found --> role = 'parent', query parent_student_relationships for students[]
  3. If not found --> query student_profiles by user_id or email
  4. If found --> role = 'student', set studentProfile
  5. Fallback --> role = 'parent' (matches current signup behavior: all signups are parent)
  |
  v
app/index.tsx reads RoleContext:
  - Not auth'd --> (auth)/login
  - Auth'd, parent, no subscription --> /paywall (when IAP is implemented)
  - Auth'd, parent, subscribed --> (tabs)/dashboard
  - Auth'd, student --> (tabs)/dashboard (students ride on parent's subscription)
  |
  v
(tabs)/_layout.tsx reads role, conditionally shows/hides tabs
  |
  v
Individual screens use RoleContext for targetUserId logic
```

### Build Order

1. Create `RoleContext` combining AuthContext lookups + StudentContext state
2. Replace `StudentProvider` with `RoleContext` in root layout
3. Modify `app/(tabs)/_layout.tsx` to conditionally show/hide tabs using `href: null`
4. Update `app/index.tsx` to route based on role
5. Refactor Dashboard and other screens to use `useRole()` instead of separate `useStudent()` + `useUserProfile()`
6. Add student-specific adaptations (e.g., Dashboard without student selector for student role)

---

## 3. IAP Integration

### Integration Points

| Existing Component | How It Integrates | Changes Needed |
|-------------------|-------------------|----------------|
| useSubscriptionStatus | Reads `user_subscriptions` table | Add IAP source support |
| Supabase Edge Functions | `create-student` pattern exists | Add `validate-iap-receipt` |
| user_subscriptions table | Has `stripe_customer_id`, `stripe_subscription_id` columns | Add `iap_source`, `iap_product_id` columns |
| Settings screen | Links to web for subscription management | Add in-app paywall |
| EAS Build config | Development + production profiles exist | Required for IAP native modules |

### Critical Constraint: Expo Go vs Dev Build

**IAP requires a native dev build.** It cannot run in Expo Go. This is the single biggest architectural constraint for v1.0.

Current state:
- App runs in Expo Go during development
- `eas.json` has dev/preview/production build profiles
- `app.json` has `"newArchEnabled": true`

**Impact:** All IAP code must be behind a conditional check or isolated so that the rest of the app continues working in Expo Go during development. Only IAP-specific features require the dev build.

### Recommended Library: RevenueCat (`react-native-purchases`)

| Library | Server Validation | Expo Go Mode | Complexity | Recommendation |
|---------|-------------------|--------------|------------|----------------|
| expo-iap | Manual (you build edge function) | No mock mode | High | Not recommended |
| react-native-iap | Manual (you build edge function) | No mock mode | High | Not recommended |
| react-native-purchases (RevenueCat) | Built-in (RevenueCat servers) | Preview API mock mode | Low | **RECOMMENDED** |

**Why RevenueCat:**
1. **Server-side receipt validation built-in** -- no need to build and maintain Apple/Google validation edge functions
2. **Preview API Mode** -- detects Expo Go and provides mock responses, so the paywall UI can be developed and tested without a dev build
3. **Webhook integration** -- RevenueCat sends webhooks to your Supabase edge function when subscription state changes
4. **Cross-platform** -- handles both Apple and Google subscriptions with one API
5. **Existing Supabase integration** -- well-documented pattern for syncing to `user_subscriptions`

**Tradeoff:** RevenueCat takes ~1-2% of revenue on their paid plans. Free tier supports up to $2.5K monthly revenue, which is likely sufficient for initial launch.

### Architecture

```
Mobile App                    RevenueCat                   Supabase
----------                    ----------                   --------

app/paywall.tsx (NEW)
  |-- Shows plan cards
  |-- reads: useIAPSubscription().products
  |
  v
useIAPSubscription.purchase()
  |-- calls RevenueCat SDK
  |-- Purchases.purchasePackage()
  |                              |
  |                              v
  |                         Validates receipt
  |                         with Apple/Google
  |                              |
  |                              v
  |                         Sends webhook ---------> supabase/functions/revenuecat-webhook/
  |                                                    |-- receives subscription event
  |                                                    |-- upserts user_subscriptions row
  |                                                    |-- returns 200
  |
  v
Purchase completes on device
  |
  v
useSubscriptionStatus refetches --> isActive = true
  |
  v
Redirect to (tabs)/dashboard
```

### New Components

```
app/paywall.tsx                              -- Plan selection + purchase UI
src/hooks/useIAPSubscription.ts              -- Wraps RevenueCat SDK
src/hooks/useSubscriptionStatus.ts           -- MODIFY: handle both Stripe + IAP sources
supabase/functions/revenuecat-webhook/       -- NEW edge function for webhook events
```

### Database Changes

```sql
-- Add columns to user_subscriptions for IAP tracking
ALTER TABLE user_subscriptions ADD COLUMN iap_source TEXT;          -- 'apple' | 'google' | null (Stripe)
ALTER TABLE user_subscriptions ADD COLUMN iap_product_id TEXT;      -- RevenueCat product ID
ALTER TABLE user_subscriptions ADD COLUMN revenuecat_customer_id TEXT; -- RevenueCat customer ID
```

### RevenueCat Webhook Edge Function

```
supabase/functions/revenuecat-webhook/index.ts

Receives POST from RevenueCat with events:
  - INITIAL_PURCHASE
  - RENEWAL
  - CANCELLATION
  - EXPIRATION
  - BILLING_ISSUE

For each event:
  1. Extract app_user_id (= Supabase user_id, set during RevenueCat SDK init)
  2. Call RevenueCat GET /subscribers API for canonical subscription state
  3. Upsert user_subscriptions row with:
     - status mapped from RevenueCat entitlement
     - iap_source: 'apple' or 'google'
     - current_period_start, current_period_end from RevenueCat
  4. Return 200 to prevent retries
```

### useSubscriptionStatus Modifications

```
Current: queries user_subscriptions WHERE user_id = auth.uid()
Needed:  same query, but interpret both Stripe AND IAP records

The hook already returns isActive based on status field.
No change needed to the query -- the edge function writes the same
status values ('active', 'trialing', 'canceled', etc.) regardless
of whether the source is Stripe or IAP.

Add: subscriptionSource field ('stripe' | 'apple' | 'google')
Add: manageSubscriptionUrl logic:
  - If Stripe: link to web app settings
  - If Apple: link to Settings > Subscriptions (Linking.openURL('https://apps.apple.com/account/subscriptions'))
  - If Google: link to Play Store subscriptions
```

### Build Order

1. Set up RevenueCat account, create products matching existing Stripe tiers
2. Install `react-native-purchases` with Expo config plugin
3. Create `useIAPSubscription` hook with RevenueCat SDK
4. Create static paywall screen (works in Expo Go via Preview API Mode)
5. Create `revenuecat-webhook` Supabase edge function
6. Add IAP columns to `user_subscriptions` table
7. Create EAS development build for IAP testing
8. Wire paywall to actual purchase flow (dev build required)
9. Modify `useSubscriptionStatus` to include source and management URL logic
10. Test full purchase + webhook + subscription gate flow

---

## 4. Subscription Gates

### Integration Points

| Existing Component | How It Integrates | Changes Needed |
|-------------------|-------------------|----------------|
| useSubscriptionStatus | Already exposes `isActive` | Used by gate provider |
| app/index.tsx | Auth gate already exists | Add subscription check |
| DB functions | `has_active_subscription()`, `has_premium_subscription()` exist | Used by RLS policies |

### Architecture: Two-Tier Gating

**Tier 1: Navigation-Level Gate (hard gate)**
Unauthenticated or unsubscribed users cannot access `(tabs)` at all.

```
app/index.tsx decision tree:

  loading? --> show spinner
  not authenticated? --> redirect to (auth)/login
  is student? --> redirect to (tabs)/dashboard (students ride on parent subscription)
  is parent, no subscription? --> redirect to /paywall
  is parent, active subscription? --> redirect to (tabs)/dashboard
```

**Tier 2: Feature-Level Gate (soft gate)**
Premium-only features show an upgrade prompt within the app.

```
src/components/SubscriptionGate.tsx (NEW)

Usage:
  <SubscriptionGate requiredTier="midsize" fallback={<UpgradePrompt />}>
    <PremiumFeatureComponent />
  </SubscriptionGate>

Implementation:
  - Reads useSubscriptionStatus()
  - Compares subscriptionType against requiredTier
  - If insufficient: renders fallback (upgrade prompt or locked indicator)
  - If sufficient: renders children
```

**Tier mapping:**
```
single:  1 student, basic features
midsize: up to 3 students, premium features
large:   up to 6 students, all features
```

These tiers already exist in the `user_subscriptions` table and the `get_max_students_allowed()` DB function.

### SubscriptionGateProvider

```
src/contexts/SubscriptionGateContext.tsx (NEW)

Provides:
  isSubscribed: boolean           -- has any active subscription
  subscriptionTier: string        -- 'single' | 'midsize' | 'large' | 'none'
  canAddStudent: boolean          -- based on tier limits
  maxStudents: number             -- from get_max_students_allowed()
  showPaywall: () => void         -- programmatic navigation to /paywall
  isLoading: boolean
```

This wraps `useSubscriptionStatus` and adds convenience methods. It does NOT replace the hook -- the hook is still used directly in the Settings screen to show subscription details.

### Build Order

1. Create `SubscriptionGateContext` provider
2. Add to provider stack in root layout
3. Add subscription check to `app/index.tsx` redirect logic
4. Create `SubscriptionGate` wrapper component
5. Create `UpgradePrompt` component for soft gates
6. Apply gates to student management (enforce student limits)

---

## 5. Data Export

### Integration Points

| Existing Component | How It Integrates | Changes Needed |
|-------------------|-------------------|----------------|
| Existing data hooks | All grade, behavior, bonus data already queryable | Used to assemble export data |
| shared/calculations | Allocation, grade rewards already computed | Used in report generation |
| expo-sharing | Not installed, but part of Expo SDK | Install and use |
| expo-print | Not installed, but part of Expo SDK | Install for PDF generation |
| expo-file-system | Not installed, but part of Expo SDK | Install for temp file writes |

### Architecture: Client-Side Generation (Expo Go Compatible)

Server-side PDF generation is more powerful but requires edge function complexity. For v1.0, client-side generation works in Expo Go and covers the core use cases.

```
User taps "Export" on Settings or dedicated screen
  |
  v
Select: report type + format (PDF / CSV)
  |
  v
useDataExport hook
  |-- assembles data from existing hooks/queries
  |-- for PDF: generates HTML template --> expo-print.printToFileAsync() --> file URI
  |-- for CSV: generates CSV string --> expo-file-system.writeAsStringAsync() --> file URI
  |
  v
expo-sharing.shareAsync(fileUri)
  |-- opens native share sheet
  |-- user can save to Files, email, AirDrop, etc.
```

### New Components

```
app/export-report.tsx (NEW stack screen, accessed from Settings)
  |-- Report type selector (Term Report, Progress Snapshot, Annual Summary)
  |-- Format selector (PDF, CSV)
  |-- Date range picker
  |-- Generate button
  |-- Loading state
  |-- Share action

src/hooks/useDataExport.ts (NEW)
  |-- assembleReportData(type, dateRange, studentUserId): ReportData
  |-- generatePdf(data): Promise<string> (file URI)
  |-- generateCsv(data): Promise<string> (file URI)
  |-- share(fileUri): Promise<void>

src/utils/reportTemplates.ts (NEW)
  |-- termReportHtml(data): string  -- HTML template for term report
  |-- progressReportHtml(data): string
  |-- gradesCsv(grades): string
  |-- behaviorCsv(assessments): string
  |-- earningsCsv(earnings): string
```

### Report Types

| Report | Content | Format |
|--------|---------|--------|
| Term Report | Grades + behavior + bonuses + allocation for a term period | PDF |
| Progress Snapshot | Current standing: GPA, behavior avg, total earnings | PDF |
| Grade Export | All grades with subjects, dates, rewards | CSV |
| Behavior Export | All assessments with category scores | CSV |
| Earnings Summary | Earnings breakdown by source (grades, education bonus, behavior bonus) | CSV |

### Dependencies to Install

```bash
npx expo install expo-print expo-sharing expo-file-system
```

All three are Expo SDK packages that work in Expo Go -- no dev build required.

### Build Order

1. Install expo-print, expo-sharing, expo-file-system
2. Create CSV generation utilities (simplest format first)
3. Create `useDataExport` hook
4. Build export screen with format/type selectors
5. Add HTML templates for PDF reports
6. Wire PDF generation with expo-print
7. Add "Export" button to Settings screen

---

## 6. Asset Pipeline (App Icon, Splash Screen, Store Assets)

### Integration Points

| Existing Component | Current State | Changes Needed |
|-------------------|---------------|----------------|
| `assets/icon.png` | Exists (placeholder or current icon) | Replace with final design |
| `assets/splash-icon.png` | Exists | Replace with final design |
| `assets/adaptive-icon.png` | Exists (Android adaptive icon foreground) | Replace with final design |
| `assets/favicon.png` | Exists (web) | Replace |
| `app.json` splash config | `backgroundColor: "#4F46E5"`, `resizeMode: "contain"` | Verify with final assets |
| `store-assets/` directory | Exists with README files but empty `.gitkeep` placeholder dirs | Populate with screenshots, graphics |

### Architecture: Build-Time vs Runtime Assets

**Build-time assets** (bundled into the binary, cannot change without app update):
- App icon (all sizes generated by EAS from single source)
- Splash screen image and background color
- Adaptive icon foreground (Android)
- App Store/Play Store listing graphics

**Runtime assets** (loaded from network, can change without app update):
- None currently needed for v1.0

### Asset Specifications

**App Icon:**
```
Source: 1024x1024 PNG (no transparency for iOS, transparency OK for Android)
Locations:
  assets/icon.png           -- iOS app icon (1024x1024)
  assets/adaptive-icon.png  -- Android adaptive icon foreground (1024x1024, safe zone ~66%)
  assets/favicon.png        -- Web favicon (48x48)

EAS Build automatically generates all required sizes from these source images.
```

**Splash Screen:**
```
Source: PNG image (recommended 1284x2778 for full coverage)
Location: assets/splash-icon.png
Config in app.json:
  splash.image: "./assets/splash-icon.png"
  splash.resizeMode: "contain"
  splash.backgroundColor: "#4F46E5"

For SDK 54+, can also use expo-splash-screen for animated splash.
```

**Store Screenshots:**
```
store-assets/
  ios/
    screenshots/
      6.7-inch/    -- iPhone 15 Pro Max (1290x2796)
      6.5-inch/    -- iPhone 14 Plus (1284x2778)
      5.5-inch/    -- iPhone 8 Plus (1242x2208)
      12.9-inch/   -- iPad Pro (2048x2732) (if supportsTablet: true)
    graphics/
      app-preview.png  -- App Store promotional image
  google-play/
    screenshots/
      phone/       -- Minimum 2, max 8 (min 320px, max 3840px per side)
      tablet/      -- 7-inch and 10-inch if tablet support
    graphics/
      feature-graphic.png  -- 1024x500 (required for Play Store)
      hi-res-icon.png      -- 512x512
```

### EAS Submit Configuration

The current `eas.json` submit config has placeholder values:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "rcisrael2@gmail.com",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",  // NEEDS UPDATING
      "appleTeamId": "YOUR_APPLE_TEAM_ID"            // NEEDS UPDATING
    },
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",  // NEEDS CREATING
      "track": "internal"
    }
  }
}
```

These must be populated with real values before submission.

### Build Order

1. Design final app icon (1024x1024 source)
2. Design splash screen image
3. Replace placeholder assets in `assets/` directory
4. Generate store screenshots (can use Simulator + screenshot framing tool)
5. Create Play Store feature graphic (1024x500)
6. Update `eas.json` with real Apple/Google credentials
7. Test splash screen appearance across device sizes
8. Verify adaptive icon safe zone on Android

---

## Cross-Cutting Architectural Concerns

### Expo Go vs Development Build Matrix

| Feature | Works in Expo Go? | Requires Dev Build? | Notes |
|---------|-------------------|---------------------|-------|
| Password Reset | YES | No | Deep linking with custom scheme works in Expo Go |
| Role-Based Navigation | YES | No | Pure JS routing logic |
| IAP Purchase Flow | NO | YES | Native StoreKit/Play Billing |
| IAP Paywall UI | PARTIAL | No | RevenueCat Preview API Mode provides mock data in Expo Go |
| Subscription Gates | YES | No | Pure JS logic reading Supabase data |
| Data Export (CSV) | YES | No | expo-file-system + expo-sharing work in Expo Go |
| Data Export (PDF) | YES | No | expo-print works in Expo Go |
| App Icon/Splash | N/A | Build-time only | Assets bundled during EAS Build |

**Recommendation:** Build everything except IAP purchase flow first (all works in Expo Go), then transition to dev build for IAP testing.

### Development Build Transition Strategy

When ready for IAP:
1. Run `npx expo install expo-dev-client`
2. Run `eas build --profile development --platform ios` (and android)
3. Install the dev build on device/simulator
4. Continue using same codebase, just running in dev client instead of Expo Go
5. IAP testing requires physical device (not simulator) for production purchases, but sandbox testing works on simulator with test accounts

### Provider Stack (Final v1.0)

```
QueryClientProvider (TanStack React Query, staleTime: 5min)
  AuthProvider (user, session, loading, passwordRecoveryPending)
    RoleContext (role, isParent, isStudent, selectedStudent, students)
      SubscriptionGateProvider (isSubscribed, tier, canAddStudent, showPaywall)
        Stack Navigator
          index.tsx          -- auth + subscription gate
          (auth) group       -- login, signup, forgot-password, reset-password
          (tabs) group       -- role-conditional tabs
          paywall             -- IAP purchase screen
          export-report       -- data export screen
          edit-profile        -- modal
          ... other screens
```

### State Management Strategy

| State Type | Tool | Examples |
|-----------|------|----------|
| Server data | TanStack React Query | Grades, assessments, subscriptions, profiles |
| Auth state | React Context (AuthProvider) | User, session, loading |
| Role state | React Context (RoleContext) | Role, selected student |
| Subscription gate | React Context (SubscriptionGateProvider) | Tier, limits |
| IAP purchase state | Custom hook (useIAPSubscription) | Products, purchasing flag |
| Form state | react-hook-form + zod | Profile edit, password reset |
| No global store needed | -- | Zustand is in package.json but unused; no need to add it |

### New Dependencies Summary

```bash
# Already installed (no action)
# expo-router, @supabase/supabase-js, @tanstack/react-query, expo-notifications

# Install for v1.0 features:
npx expo install expo-print expo-sharing expo-file-system   # Data export
npm install react-native-purchases                           # RevenueCat IAP

# Dev dependencies (no new ones needed)
```

### File Structure for New Components

```
app/
  (auth)/
    forgot-password.tsx     -- NEW: email input for password reset
    reset-password.tsx      -- NEW: new password form
  (tabs)/
    _layout.tsx             -- MODIFY: role-conditional tab visibility
  paywall.tsx               -- NEW: subscription purchase screen
  export-report.tsx         -- NEW: data export screen

src/
  contexts/
    AuthContext.tsx          -- MODIFY: add PASSWORD_RECOVERY handling
    RoleContext.tsx          -- NEW: replaces StudentContext + useUserProfile role detection
    SubscriptionGateContext.tsx -- NEW: subscription state + gate logic
  hooks/
    useIAPSubscription.ts   -- NEW: RevenueCat SDK wrapper
    useDataExport.ts        -- NEW: data assembly + file generation
    useSubscriptionStatus.ts -- MODIFY: add IAP source support
  components/
    SubscriptionGate.tsx    -- NEW: wrapper component for feature-level gating
    UpgradePrompt.tsx       -- NEW: upgrade CTA for gated features
  utils/
    reportTemplates.ts      -- NEW: HTML templates for PDF generation

supabase/
  functions/
    revenuecat-webhook/     -- NEW: webhook handler for subscription sync
```

### Suggested Build Order Across All Features

Based on dependency analysis:

```
Phase 1: Auth Foundation (Expo Go compatible)
  1. Password reset flow (forgot-password, reset-password, deep link handling)
  2. RoleContext (replaces StudentContext)
  3. Role-based tab visibility

Phase 2: Subscription Infrastructure (Expo Go compatible for UI, dev build for testing)
  4. SubscriptionGateProvider
  5. Paywall screen (static UI, RevenueCat Preview API Mode)
  6. Subscription gate logic in app/index.tsx
  7. SubscriptionGate component for feature-level gating

Phase 3: IAP Wiring (Requires dev build)
  8. RevenueCat account setup + product configuration
  9. useIAPSubscription hook
  10. revenuecat-webhook edge function
  11. EAS dev build for IAP testing
  12. Full purchase flow testing

Phase 4: Data Export (Expo Go compatible)
  13. Install expo-print, expo-sharing, expo-file-system
  14. CSV export for grades, behavior, earnings
  15. PDF generation with HTML templates
  16. Export screen UI

Phase 5: Store Preparation (Build-time)
  17. Final app icon and splash screen assets
  18. Store screenshots
  19. EAS submit configuration
  20. App Store / Play Store metadata
```

**Rationale for ordering:**
- Password reset and role routing are foundational and have zero dependency on native modules
- Subscription gates need RoleContext to distinguish parent/student (students skip paywall)
- IAP is isolated to Phase 3 because it requires dev build transition
- Data export is independent of IAP and can be built in parallel
- Store assets are last because they depend on final UI being ready for screenshots

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Route Groups Per Role
**What:** Creating `(parent-tabs)/` and `(student-tabs)/` directories with duplicated screens
**Why bad:** Duplicates screens, breaks deep links, doubles maintenance cost
**Instead:** Single `(tabs)` group with `href: null` to conditionally hide tabs

### Anti-Pattern 2: Scattering Subscription Checks
**What:** Adding `if (!isSubscribed) return <Paywall />` in every screen component
**Why bad:** Inconsistent behavior, easy to miss screens, hard to test
**Instead:** Gate at navigation level in `app/index.tsx` + `SubscriptionGate` wrapper for premium features

### Anti-Pattern 3: Client-Side Receipt Validation
**What:** Validating Apple/Google purchase receipts on the mobile client
**Why bad:** Receipts can be spoofed, client cannot securely verify with Apple/Google servers
**Instead:** Server-side validation via RevenueCat (built-in) or Supabase edge function

### Anti-Pattern 4: Mixing Expo Go and Native Module Code
**What:** Importing native IAP modules unconditionally, crashing Expo Go
**Why bad:** Breaks development workflow for all non-IAP work
**Instead:** Conditional imports, RevenueCat's Preview API Mode, or isolate IAP code behind feature flags

### Anti-Pattern 5: Hardcoding Deep Link URLs
**What:** Hardcoding `https://[project-ref].supabase.co/auth/v1/verify...` in the app
**Why bad:** Breaks if project ref changes, hard to test
**Instead:** Use environment variable for Supabase URL, construct redirect URL dynamically using the app scheme from `app.json`

---

## Sources

- [Expo In-App Purchases Guide](https://docs.expo.dev/guides/in-app-purchases/) -- HIGH confidence
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) -- HIGH confidence
- [RevenueCat Expo Installation](https://www.revenuecat.com/docs/getting-started/installation/expo) -- HIGH confidence
- [RevenueCat Webhooks](https://www.revenuecat.com/docs/integrations/webhooks) -- HIGH confidence
- [Expo Router Navigation Layouts](https://docs.expo.dev/router/basics/layout/) -- HIGH confidence
- [Expo Router Custom Tabs](https://docs.expo.dev/router/advanced/custom-tabs/) -- HIGH confidence
- [Expo Go vs Development Builds](https://expo.dev/blog/expo-go-vs-development-builds) -- HIGH confidence
- [Expo Sharing SDK](https://docs.expo.dev/versions/latest/sdk/sharing/) -- HIGH confidence
- [Expo FileSystem SDK](https://docs.expo.dev/versions/latest/sdk/filesystem/) -- HIGH confidence
- [Supabase Password Reset in React Native (Discussion)](https://github.com/orgs/supabase/discussions/12324) -- MEDIUM confidence
- [RevenueCat Supabase Community Discussion](https://community.revenuecat.com/third-party-integrations-53/integrating-revenuecat-financial-data-to-activate-functionality-in-supabase-backend-4187) -- MEDIUM confidence
