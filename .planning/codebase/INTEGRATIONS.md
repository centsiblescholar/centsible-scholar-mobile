# External Integrations

**Analysis Date:** 2026-02-05

## APIs & External Services

**Supabase (Backend-as-a-Service):**
- Supabase Project - Complete backend service (see separate sections below)
  - SDK: @supabase/supabase-js 2.86.0
  - Auth: Environment variables (public keys, not secrets)

## Data Storage

**Primary Database:**
- PostgreSQL (via Supabase)
  - Client: @supabase/supabase-js (REST API)
  - Row-Level Security (RLS) enabled for all tables
  - Connection: `EXPO_PUBLIC_SUPABASE_URL` environment variable
  - Main tables: `parent_profiles`, `student_profiles`, `parent_student_relationships`, `student_grades`, `family_meetings`, `grade_approvals`, `behavioral_assessments`, `education_bonuses`, `savings_goals`, `question_of_day`, `term_tracking`
  - Database schema auto-generated to TypeScript via `src/integrations/supabase/types.ts` (76KB generated types)

**Session Persistence:**
- AsyncStorage (@react-native-async-storage/async-storage 2.2.0)
  - Stores Supabase auth sessions locally
  - Persists scheduled notifications list
  - Persists notification token
  - Configured in `src/integrations/supabase/client.ts` with `persistSession: true`

**Local Cache:**
- TanStack React Query - In-memory query caching
  - 5-minute staleTime for student/parent queries
  - Cache invalidation on mutations (create/update/delete operations)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (PostgreSQL row-level security backed)
  - Implementation: Email/password authentication
  - User types: "parent" (primary users) and "student" (created by parents)
  - Session management via `src/contexts/AuthContext.tsx`
  - Session persistence with AsyncStorage for offline capability

**Auth Flow:**
- Parents sign up via `signUpWithEmail()` with metadata (`user_type: 'parent'`, `first_name`, `last_name`)
- Database trigger `handle_new_user` auto-creates `parent_profiles` record
- Students created via Supabase edge function `create-student` with real auth accounts
- Auth state listener via `onAuthStateChange()` in AuthContext

**Configuration:**
- `src/integrations/supabase/client.ts` - Supabase client initialization
  - `autoRefreshToken: true` - Automatic token refresh
  - `persistSession: true` - Session persistence in AsyncStorage
  - `detectSessionInUrl: false` - Disable for mobile (no deep linking refresh)

## Notifications

**Push Notifications:**
- Expo Notifications (expo-notifications 0.32.16)
  - EAS-managed push token via `Constants.expoConfig?.extra?.eas?.projectId`
  - Token caching in AsyncStorage via `PUSH_TOKEN` key
  - Fallback for non-physical devices (logs message instead)

**Local Notifications:**
- Expo Notifications - Scheduled notifications stored in AsyncStorage
  - Types: `meeting_reminder`, `low_behavior_score`, `pending_grade`, `grade_approved`, `grade_rejected`, `term_ending`, `daily_qod`
  - Android notification channels configured for category-specific delivery
  - Configuration: `src/services/notifications.ts` (419 lines)
  - Hook wrapper: `src/hooks/useNotifications.ts` for React integration

**Notification Management:**
- Service: `src/services/notifications.ts`
  - `requestNotificationPermissions()` - Platform-specific permission handling
  - `getExpoPushToken()` - Retrieve EAS-managed token
  - `scheduleNotification()` - Local notification scheduling
  - `sendLowBehaviorScoreAlert()`, `sendPendingGradeNotification()`, `sendGradeResultNotification()` - Feature-specific notifications
  - `scheduleMeetingReminder()`, `scheduleDailyQODReminder()`, `scheduleTermEndingReminder()` - Scheduled reminders
  - `cancelNotification()`, `cancelNotificationsByType()`, `cancelAllNotifications()` - Cancellation

## Monitoring & Observability

**Error Tracking:**
- None detected - Error logging via console.error()

**Logs:**
- Console logging only
  - Auth events logged in AuthContext
  - Notification initialization logged in useNotifications hook
  - Service errors logged in notifications service and query hooks

**Client-Side Debugging:**
- React Query DevTools available via TanStack React Query (not configured in this project)

## CI/CD & Deployment

**Hosting:**
- Expo Application Services (EAS) - Cloud builds and distribution
  - EAS project ID: "4cef17e0-0133-41ca-952d-78ecc20791a3"
  - Runtime version policy: "appVersion"

**Build & Distribution:**
- EAS Build - Managed cloud builds
- Expo Go - Development runtime (app runs in Expo Go without native compilation)
- Native builds available via EAS for production distribution

**Supabase Edge Functions:**
- `create-student` - Invoked via `supabase.functions.invoke('create-student', {...})`
  - Input: name, email, gradeLevel, password, baseRewardAmount, reportingFrequency
  - Output: Partial student object with success flag
  - Called from: `src/hooks/useStudentManagement.ts` line 115

## Data API

**Supabase REST API:**
- All database operations via `@supabase/supabase-js` client
- Pattern: `.from('table_name').select()/insert()/update()/delete()`
- Example: `src/hooks/useStudentManagement.ts` demonstrates typical patterns:
  - Multi-table selects via joins
  - Filtering with `.eq()`, `.in()`
  - Ordering with `.order()`
  - Single result with `.single()`, many with default
  - RLS policy enforcement via `onAuthStateChange()`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

**Internal Event Handlers:**
- Notification response handlers in `src/hooks/useNotifications.ts` (lines 117-145)
  - Not yet wired to navigation (TODO comments present)

## Environment Configuration

**Required Environment Variables:**
```
EXPO_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key-hash]
```

**Secrets Location:**
- `.env` file (local, not version controlled)
- Reference in `.env.example` (contains placeholders only)

**Public vs. Private Keys:**
- Public keys used (EXPO_PUBLIC_ prefix) - appropriate for client-side Supabase usage
- No secrets in client-side code (auth secrets only in Supabase backend)

## Data Sync & Offline

**Session Sync:**
- AsyncStorage persists auth session
- `autoRefreshToken: true` handles token refresh when online
- Query cache retained across app restarts

**Data Freshness:**
- Query staleTime: 5 minutes for student/parent queries
- Manual refetch available via `refetch()` in React Query hooks
- No real-time subscriptions detected (polling-based approach)

## Special Considerations

**RLS Policy Gotcha:**
- Supabase `.insert().select().single()` triggers both INSERT and SELECT checks
- SELECT RLS fails if relationship record doesn't exist yet
- Solution in codebase: `src/hooks/useStudentManagement.ts` uses edge function for student creation to avoid this
- Fallback pattern: `ensureParentProfile()` in `src/integrations/supabase/client.ts` uses separate INSERT then SELECT

**Crypto Constraint:**
- expo-crypto does NOT work in Expo Go (requires native dev build)
- Codebase uses pure JS alternatives (react-native-url-polyfill for URL handling)

---

*Integration audit: 2026-02-05*
