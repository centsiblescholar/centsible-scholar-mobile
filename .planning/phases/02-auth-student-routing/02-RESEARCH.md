# Phase 2: Auth + Student Routing - Research

**Researched:** 2026-02-05
**Domain:** Supabase OTP password recovery, Expo Router role-based routing, student dashboard UI, onboarding tutorial
**Confidence:** HIGH

## Summary

This phase has three main pillars: (1) OTP-based password reset, (2) student-specific routing and dashboard, and (3) first-time student onboarding tutorial. Research confirms that all three are well-supported by the existing stack with no new major dependencies needed.

For password reset, Supabase natively supports a 6-digit OTP recovery flow: call `resetPasswordForEmail()` to send the code, `verifyOtp({ type: 'recovery' })` to verify it, then `updateUser({ password })` to set the new password. This requires modifying the Supabase Dashboard "Reset Password" email template to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. No deep links or redirect URLs are needed.

For student routing, the project already has `userRole` from `AuthContext` (sourced from `user_metadata.user_type`) and the `href: null` pattern for conditional tab visibility (Phase 1). The student tab bar needs: Dashboard, Grades, Behavior, Learn, Settings (5 tabs). Parent-only items (Earnings tab, management screens) are hidden. The new `Tabs.Protected` API (available in SDK 53+, this project uses SDK 54) is an option but the existing `href: null` pattern already works and was established in Phase 1 -- stick with it for consistency.

For the student dashboard and onboarding, no new libraries are needed. Horizontal scrollable cards use built-in `FlatList` with `horizontal`, `pagingEnabled`, and `snapToInterval`. The onboarding tutorial is a custom multi-step flow (not a third-party library) since the requirements are specific: required completion, database flag tracking, and profile/settings-first flow.

**Primary recommendation:** Use Supabase's native OTP recovery flow (3 API calls), extend the existing `href: null` tab pattern for student tabs, build the student dashboard and onboarding tutorial with built-in React Native components (FlatList for cards, custom stepper for tutorial). Add `has_completed_onboarding` column to `student_profiles` via Supabase migration.

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.86.0 | OTP password reset flow (resetPasswordForEmail, verifyOtp, updateUser) | Already installed; native OTP support |
| `expo-router` | ~6.0.15 | Role-based tab routing, auth screen navigation | Already installed; href:null pattern established in Phase 1 |
| `@tanstack/react-query` | ^5.90.11 | Student dashboard data fetching (grades, behavior, earnings, streak) | Already installed; hooks pattern established |
| `react-native` (FlatList) | 0.81.5 | Horizontal scrollable metric cards with snap | Built-in; no carousel library needed |
| `react-native-reanimated` | ~4.1.1 | Smooth animations for tutorial transitions and card indicators | Already installed |
| `@expo/vector-icons` (Ionicons) | ^15.0.3 | Dashboard and tutorial icons | Already installed |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^4.1.13 | Password reset form validation (email, OTP code, new password) | Email format validation, password strength |
| `react-hook-form` | ^7.67.0 | Form state management for password reset screens | Multi-screen form with validation |
| `@react-native-async-storage/async-storage` | 2.2.0 | Cache onboarding completion status locally for fast checks | Supplement to DB flag, instant UI decision |
| `zustand` | ^5.0.9 | Available for onboarding step state if needed | Complex multi-step tutorial state |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in FlatList for cards | react-native-snap-carousel | FlatList with snapToInterval is sufficient; snap-carousel is unmaintained |
| Custom onboarding stepper | react-native-copilot or react-native-app-onboard | Third-party adds dependency for a simple multi-step flow; custom is more flexible for required completion + DB flag |
| `href: null` for tab hiding | `Tabs.Protected` (SDK 53+) | Protected is newer/cleaner but Phase 1 already established href:null -- switching mid-project adds risk for no gain |

**Installation:**
```bash
# No new packages needed -- all dependencies are already installed
```

## Architecture Patterns

### Recommended Project Structure

New files to create:
```
app/
  (auth)/
    forgot-password.tsx      # Step 1: Email input
    verify-reset-code.tsx    # Step 2: 6-digit OTP input
    reset-password.tsx       # Step 3: New password input
  (tabs)/
    dashboard.tsx            # MODIFY: Branch on userRole for parent vs student view
src/
  components/
    student/
      StudentDashboard.tsx           # Student-specific dashboard content
      MetricCard.tsx                 # Reusable horizontal metric card
      MetricCardsCarousel.tsx        # FlatList-based horizontal card carousel
      TodaysTasks.tsx                # Action-first "What to do today" section
      RewardRateCard.tsx             # Shows parent-set reward structure
      AllocationBreakdown.tsx        # Financial transparency section
    onboarding/
      OnboardingScreen.tsx           # Main onboarding flow controller
      OnboardingStep.tsx             # Individual step component
      CelebrationScreen.tsx          # Final "You're all set!" screen
  hooks/
    usePasswordReset.ts              # Encapsulates 3-step reset flow
    useStudentDashboardData.ts       # Aggregates all student data for dashboard
    useOnboardingStatus.ts           # Checks has_completed_onboarding flag
  services/
    passwordReset.ts                 # Supabase auth calls for reset flow
```

### Pattern 1: Three-Step OTP Password Reset Flow

**What:** Supabase OTP recovery using resetPasswordForEmail + verifyOtp + updateUser
**When to use:** Password reset without deep links (mobile-first approach)

**Flow:**
1. User taps "Forgot Password?" on login screen
2. Screen 1 (forgot-password.tsx): Enter email, call `resetPasswordForEmail(email)` -- sends 6-digit OTP
3. Screen 2 (verify-reset-code.tsx): Enter 6-digit code, call `verifyOtp({ email, token, type: 'recovery' })` -- establishes authenticated session
4. Screen 3 (reset-password.tsx): Enter new password + confirm, call `updateUser({ password })` -- updates password
5. Sign out and redirect to login with success message

**Critical prerequisite:** Modify the Supabase Dashboard "Reset Password" email template to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. Without this, no 6-digit code is sent.

```typescript
// Source: Supabase official docs - auth-resetpasswordforemail, auth-verifyotp, auth-updateuser

// Step 1: Request OTP
const { error } = await supabase.auth.resetPasswordForEmail(email);

// Step 2: Verify OTP (type: 'recovery' is key)
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token: otpCode,   // 6-digit code from email
  type: 'recovery',
});
// Success: user is now authenticated with a session

// Step 3: Update password (requires authenticated session from step 2)
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});

// Step 4: Sign out and redirect
await supabase.auth.signOut();
```

### Pattern 2: Role-Based Dashboard Branching

**What:** Single dashboard route that renders different content based on userRole
**When to use:** Parent and student share the same tab but see different UI

```typescript
// Source: Existing codebase pattern from app/(tabs)/dashboard.tsx + AuthContext
export default function DashboardScreen() {
  const { userRole } = useAuth();

  if (userRole === 'student') {
    return <StudentDashboard />;
  }

  // Existing parent dashboard code
  return <ParentDashboard />;
}
```

### Pattern 3: Conditional Tab Visibility (Extend Phase 1)

**What:** Use `href: null` to hide parent-only tabs from students
**When to use:** Student tab bar should show 5 tabs, parent should show 6

```typescript
// Source: Existing Phase 1 pattern in app/(tabs)/_layout.tsx
<Tabs.Screen
  name="earnings"
  options={{
    title: 'Earnings',
    href: userRole === 'student' ? null : '/(tabs)/earnings',
    // ...
  }}
/>
```

No change to this pattern needed -- it already hides Earnings from students. Student tab bar will naturally show: Dashboard, Grades, Behavior, Learn, Settings (5 tabs).

### Pattern 4: Onboarding Gate with Database Flag

**What:** Check `has_completed_onboarding` on student login; gate access until complete
**When to use:** First-time student experience before accessing the app

```typescript
// In app/index.tsx routing logic
if (userRole === 'student') {
  const { hasCompletedOnboarding, isLoading } = useOnboardingStatus();

  if (isLoading) return <LoadingSpinner />;
  if (!hasCompletedOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
```

### Pattern 5: Horizontal Snap Cards (Instagram Stories Style)

**What:** FlatList with horizontal scrolling, snap-to-item, and page indicators
**When to use:** Student dashboard metric cards (GPA, earnings, streak, behavior)

```typescript
// Source: React Native FlatList docs
<FlatList
  data={metrics}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  snapToAlignment="center"
  decelerationRate="fast"
  onMomentumScrollEnd={(e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / CARD_WIDTH
    );
    setActiveIndex(index);
  }}
  renderItem={({ item }) => (
    <View style={{ width: CARD_WIDTH }}>
      <MetricCard
        title={item.title}
        value={item.value}
        context={item.context}
        icon={item.icon}
      />
    </View>
  )}
/>
```

### Anti-Patterns to Avoid

- **Separate tab groups for parent vs student:** The project uses a single `(tabs)` group with conditional visibility (Phase 1 decision). Do NOT create `(parent-tabs)` and `(student-tabs)` groups -- this causes screen duplication.
- **Deep link-based password reset on mobile:** OTP is the explicit roadmap decision. Do not use `redirectTo` with `resetPasswordForEmail` for mobile.
- **Fetching all student data in the dashboard component:** Extract data aggregation into `useStudentDashboardData` hook to keep the component clean.
- **Skipping onboarding check on every navigation:** Check once at login/app-open via `app/index.tsx`, not on every tab switch. Cache the result.
- **Custom carousel library for 4 cards:** FlatList with snap props handles this natively. Adding react-native-snap-carousel (unmaintained) or similar is unnecessary complexity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTP email delivery | Custom email sender or edge function | Supabase `resetPasswordForEmail()` + email template `{{ .Token }}` | Supabase handles rate limiting, expiry (1 hour default), and email delivery |
| OTP verification + session | Custom token validation | `supabase.auth.verifyOtp({ type: 'recovery' })` | Supabase validates token, creates authenticated session, handles expiry |
| Password update for authenticated user | Direct database password update | `supabase.auth.updateUser({ password })` | Supabase handles hashing, validation, session refresh |
| Horizontal snap scroll | Custom gesture handler or carousel library | React Native `FlatList` with `pagingEnabled` + `snapToInterval` | Built-in, performant, no extra dependency |
| Form validation (email, password) | Custom regex validators | `zod` schemas (already installed) | Consistent with existing validation patterns, composable |
| User role detection | Database query for role | `user.user_metadata.user_type` via AuthContext | Phase 1 decision: role from JWT metadata, no extra query |

**Key insight:** The entire password reset flow is 3 Supabase API calls + 1 email template change. No edge functions, no custom token storage, no deep links.

## Common Pitfalls

### Pitfall 1: Forgetting to Modify the Supabase Email Template

**What goes wrong:** `resetPasswordForEmail()` is called, email is sent, but it contains a clickable link instead of a 6-digit code. The user clicks the link, which opens in a browser -- not the app.
**Why it happens:** Supabase's default "Reset Password" email template uses `{{ .ConfirmationURL }}` (a link), not `{{ .Token }}` (a 6-digit code).
**How to avoid:** Before writing any code, go to Supabase Dashboard > Authentication > Email Templates > "Reset Password" and change the template to use `{{ .Token }}`. Example: "Your password reset code is: {{ .Token }}"
**Warning signs:** Users report "I got a link instead of a code" or "the link opened in Safari"

### Pitfall 2: verifyOtp Creates a Session (Auth State Change)

**What goes wrong:** After `verifyOtp({ type: 'recovery' })` succeeds, the user is now authenticated. The `onAuthStateChange` listener fires `SIGNED_IN`, which may redirect the user away from the reset-password screen before they can set a new password.
**Why it happens:** `verifyOtp` with type `recovery` establishes a full session. The app's auth routing in `app/index.tsx` may redirect to dashboard.
**How to avoid:** Either (a) handle the `PASSWORD_RECOVERY` event type in `onAuthStateChange` and suppress redirect, or (b) use a flag/state to indicate "in password reset flow" that prevents routing. The password reset screens should be in `(auth)` group which is accessible regardless of auth state.
**Warning signs:** User enters OTP code successfully but gets redirected to dashboard before entering new password.

### Pitfall 3: Student Profile Lookup by Email vs user_id

**What goes wrong:** Student logs in with their own Supabase auth account. Their `user.id` may not match the `user_id` in `student_profiles` because the student was created via the `create-student` edge function which may assign a different UUID.
**Why it happens:** The `create-student` edge function creates the student auth account separately. The `student_profiles.user_id` should be the student's auth user ID, but there may be cases where the email is the more reliable lookup.
**How to avoid:** The existing `useStudentProfile` hook already handles this with a fallback: first tries `user_id`, then falls back to `email` lookup. Keep this dual-lookup pattern for all student data queries.
**Warning signs:** Student logs in successfully but sees empty dashboard (no grades, no behavior data).

### Pitfall 4: Onboarding Gate Causes Flash of Dashboard

**What goes wrong:** Student logs in, briefly sees the dashboard, then gets redirected to onboarding.
**Why it happens:** The `has_completed_onboarding` check is async (database query), so there's a loading period where the default route renders.
**How to avoid:** Check onboarding status in `app/index.tsx` BEFORE redirecting to dashboard. Show a loading spinner during the check. Cache the onboarding status in AsyncStorage for instant subsequent checks.
**Warning signs:** Brief flash of dashboard content before onboarding appears.

### Pitfall 5: OTP Expiry and Rate Limiting

**What goes wrong:** User requests a code, takes too long to enter it, and the code expires. Or user spams "resend" and gets rate-limited.
**Why it happens:** Supabase OTP defaults: 1 hour expiry, 60-second rate limit between sends.
**How to avoid:** Show a countdown timer for resend (60 seconds). Display clear messaging about code expiry. On the verify screen, show a "Resend Code" button that is disabled for 60 seconds after the last send. Handle the `otp_expired` error gracefully with a message like "Code expired. Please request a new one."
**Warning signs:** Users report "code doesn't work" after waiting too long.

### Pitfall 6: Student Dashboard Data Dependencies

**What goes wrong:** Dashboard tries to render before all data hooks have loaded, causing partial/blank states.
**Why it happens:** Multiple independent hooks (grades, behavior, QOD, streak) load at different speeds.
**How to avoid:** Create a `useStudentDashboardData` hook that aggregates all data and exposes a single `isLoading` boolean. Show a unified loading state until all critical data is ready. Non-critical data (like streak) can load progressively.
**Warning signs:** Some metric cards show data while others show "--" for extended periods.

### Pitfall 7: Onboarding Database Migration

**What goes wrong:** `has_completed_onboarding` column doesn't exist in `student_profiles`, causing runtime errors when querying it.
**Why it happens:** Forgot to run/create the Supabase migration before deploying the feature.
**How to avoid:** Create the migration as the FIRST task. The column should default to `false` so existing students will see the onboarding on their next login. The migration is: `ALTER TABLE student_profiles ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false;`
**Warning signs:** Supabase query errors mentioning "column does not exist".

## Code Examples

### Password Reset Service

```typescript
// Source: Supabase docs - resetPasswordForEmail, verifyOtp, updateUser
// File: src/services/passwordReset.ts

import { supabase } from '../integrations/supabase/client';

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function verifyResetCode(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'recovery',
  });
  if (error) throw error;
  return data;
}

export async function setNewPassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function completePasswordReset() {
  await supabase.auth.signOut();
}
```

### Onboarding Status Hook

```typescript
// File: src/hooks/useOnboardingStatus.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export const onboardingKeys = {
  status: (userId: string) => ['onboarding', 'status', userId] as const,
};

async function fetchOnboardingStatus(userId: string, email?: string): Promise<boolean> {
  // Try by user_id first, then email (same pattern as useStudentProfile)
  let { data } = await supabase
    .from('student_profiles')
    .select('has_completed_onboarding')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data && email) {
    const result = await supabase
      .from('student_profiles')
      .select('has_completed_onboarding')
      .eq('email', email)
      .maybeSingle();
    data = result.data;
  }

  return data?.has_completed_onboarding ?? false;
}

export function useOnboardingStatus() {
  const { user, userRole } = useAuth();
  const isStudent = userRole === 'student';

  const { data: hasCompleted = false, isLoading } = useQuery({
    queryKey: onboardingKeys.status(user?.id || ''),
    queryFn: () => fetchOnboardingStatus(user!.id, user?.email),
    enabled: !!user && isStudent,
    staleTime: Infinity, // Only changes on explicit completion
  });

  return {
    hasCompletedOnboarding: !isStudent || hasCompleted,
    isLoading: isStudent ? isLoading : false,
  };
}
```

### Horizontal Metric Card Component

```typescript
// File: src/components/student/MetricCard.tsx

import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 48; // 24px padding each side
const CARD_MARGIN = 8;

interface MetricCardProps {
  title: string;
  value: string;
  context: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export function MetricCard({ title, value, context, icon, color }: MetricCardProps) {
  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <View style={styles.header}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.context}>{context}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: CARD_MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  context: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
```

### Student Tab Configuration

```typescript
// File: app/(tabs)/_layout.tsx -- showing the student tab visibility pattern
// Students see: Dashboard, Grades, Behavior, Learn, Settings (5 tabs)
// Parents see: Dashboard, Grades, Behavior, Learn, Earnings, Settings (6 tabs)

<Tabs.Screen
  name="earnings"
  options={{
    title: 'Earnings',
    href: userRole === 'student' ? null : '/(tabs)/earnings',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="wallet-outline" size={size} color={color} />
    ),
  }}
/>
// Note: All other tabs are visible to both roles. No other tabs need href:null.
```

### Auth Route Layout with Password Reset Screens

```typescript
// File: app/(auth)/_layout.tsx -- extended with password reset screens
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#4F46E5' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="verify-reset-code" options={{ title: 'Verify Code' }} />
      <Stack.Screen name="reset-password" options={{ title: 'New Password' }} />
    </Stack>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `{{ .ConfirmationURL }}` deep link for password reset | `{{ .Token }}` OTP code for mobile | Always available; mobile best practice | No deep link configuration needed |
| Conditional rendering in each screen | `href: null` / `Tabs.Protected` for tab visibility | expo-router v3+ / SDK 53+ | Declarative tab hiding at layout level |
| Custom carousel libraries (react-native-snap-carousel) | Built-in FlatList with `pagingEnabled` + `snapToInterval` | RN 0.60+ | No third-party dependency for horizontal snap scroll |
| `useReduce`/Context for multi-step forms | `react-hook-form` with resolver-per-step | react-hook-form v7+ | Less boilerplate for multi-screen forms |

**Deprecated/outdated:**
- `react-native-snap-carousel`: Unmaintained since 2023, use FlatList snap props instead
- `{{ .ConfirmationURL }}` for mobile password reset: Works but requires deep link setup; `{{ .Token }}` is simpler for mobile
- Separate tab groups per role: Explicitly rejected in Phase 1 roadmap decisions

## Open Questions

1. **Student profile `user_id` consistency**
   - What we know: Students are created via `create-student` edge function. The `useStudentProfile` hook has a dual-lookup (user_id then email). The codebase already handles this.
   - What's unclear: Whether ALL student data tables (behavior_assessments, student_grades, question_of_day_results) consistently use the same `user_id` or if some use the student's auth user ID and others use a generated UUID.
   - Recommendation: The existing hooks already handle this with `student_user_id` fields. Verify during implementation that the student dashboard data hooks work correctly when a student is logged in directly (not parent viewing).

2. **Onboarding screen as modal vs route**
   - What we know: Onboarding must be required (not skippable) and gate access to the app.
   - What's unclear: Whether to implement as a full-screen modal overlay on the existing layout or as a dedicated route (e.g., `/onboarding`).
   - Recommendation: Use a dedicated route `/onboarding` registered in the root Stack layout. This is cleaner than a modal because it replaces the navigation entirely (no back button to dashboard). The `app/index.tsx` redirect handles gating.

3. **Password recovery event in onAuthStateChange**
   - What we know: `verifyOtp({ type: 'recovery' })` creates an authenticated session. The existing `onAuthStateChange` handler in AuthContext will fire `SIGNED_IN`.
   - What's unclear: Whether the event type is `SIGNED_IN` or `PASSWORD_RECOVERY` (Supabase docs mention both for different flows).
   - Recommendation: Test during implementation. If it fires `SIGNED_IN`, the password reset screens in `(auth)` group need to handle being "authenticated but in reset flow" -- possibly by checking navigation state or a flag.

4. **Existing parent dashboard behavior when student logs in**
   - What we know: The current dashboard.tsx uses `useStudent()` context which calls `useParentStudents()`. When a student logs in, `useParentStudents` will find no students (no parent-student relationship for the student's own ID).
   - What's unclear: Whether `isParentView` correctly evaluates to `false` for students and whether all data hooks work with the student's own auth user ID.
   - Recommendation: The StudentDashboard component should use its own hooks, not the parent's StudentContext. The branching in dashboard.tsx (Pattern 2 above) should happen before any parent-specific hooks are called.

## Sources

### Primary (HIGH confidence)
- [Supabase resetPasswordForEmail docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) - OTP flow API
- [Supabase verifyOtp docs](https://supabase.com/docs/reference/javascript/auth-verifyotp) - Recovery type verification
- [Supabase updateUser docs](https://supabase.com/docs/reference/javascript/auth-updateuser) - Password update API
- [Supabase email templates docs](https://supabase.com/docs/guides/auth/auth-email-templates) - {{ .Token }} variable for OTP
- [Supabase auth.resend docs](https://supabase.com/docs/reference/javascript/auth-resend) - Resend NOT supported for recovery; must call resetPasswordForEmail again
- [Expo Router protected routes docs](https://docs.expo.dev/router/advanced/protected/) - Tabs.Protected, guard prop (SDK 53+)
- [Expo Router authentication docs](https://docs.expo.dev/router/advanced/authentication/) - Stack.Protected pattern
- Existing codebase: AuthContext.tsx, (tabs)/_layout.tsx, useStudentProfile.ts, useUserProfile.ts, StudentContext.tsx

### Secondary (MEDIUM confidence)
- [Supabase Discussion #12324](https://github.com/orgs/supabase/discussions/12324) - React Native password reset with OTP, verified approach
- [Supabase Discussion #30402](https://github.com/orgs/supabase/discussions/30402) - 3-stage mobile OTP recovery flow
- [Supabase passwordless email docs](https://supabase.com/docs/guides/auth/auth-email-passwordless) - OTP email configuration (60s rate limit, 1h expiry)

### Tertiary (LOW confidence)
- [WebSearch: React Native horizontal scrollable cards](https://dev.to/chriscode/step-by-step-guide-implementing-snap-horizontal-scroll-in-react-native-3mhe) - FlatList snap pattern (verified with RN docs)
- [WebSearch: React Native onboarding libraries](https://vocal.media/01/react-native-app-onboarding-walkthroughs-and-tooltips-2026) - Surveyed options, decided custom is better for this use case

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, APIs verified against official docs
- Architecture: HIGH - Patterns derived from existing codebase (Phase 1) and official Supabase/Expo docs
- Pitfalls: HIGH - Most pitfalls identified from official docs and community discussions with verified solutions
- Password reset flow: HIGH - 3-call pattern verified against Supabase official docs and community discussions
- Student dashboard UI: MEDIUM - FlatList snap props verified; specific visual layout is design implementation
- Onboarding tutorial: MEDIUM - Flow architecture is solid but exact step count/interactions are implementation decisions

**Research date:** 2026-02-05
**Valid until:** 2026-03-07 (30 days -- stable libraries, no major version changes expected)
