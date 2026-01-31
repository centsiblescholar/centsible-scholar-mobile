# Centsible Scholar Mobile - Comprehensive Forensic To-Do List

## Executive Summary

This document provides a complete forensic analysis of what is required to make the mobile app function like CS-Premium for iOS App Store submission. The app is approximately **60% functional** with significant database integration issues that need resolution.

---

## CRITICAL BLOCKERS (Must Fix Before App Works)

### 1. Database Query ID Mismatches

**Problem:** The app confuses three different ID types throughout the codebase:
- `user_id` - The authenticated user's Supabase auth ID
- `student_id` - A reference to the student_profiles.id (profile record)
- `student_user_id` - A reference to a student's own auth user ID (if they have one)

**Affected Hooks:**

| Hook | Issue | Severity |
|------|-------|----------|
| `useBehaviorAssessments.ts` | Queries by `user_id` then falls back to `student_id` - ambiguous | CRITICAL |
| `useBehaviorBonus.ts` | Same ambiguous fallback pattern | CRITICAL |
| `useStudentGrades.ts` | Queries `student_user_id` then falls back to `dashboard_grades.student_id` | HIGH |
| `useEducationBonus.ts` | Queries `question_of_day_results.user_id` - only works for students with auth accounts | HIGH |
| `useGradeApproval.ts` | Queries `student_profiles.user_id = parentId` which is semantically wrong | HIGH |

**Root Cause:** The `student_profiles` table uses `user_id` to store the PARENT's user ID (the owner), not the student's. But hooks pass `selectedStudent.id` (profile record ID) to queries expecting auth user IDs.

**To Fix:**
- [ ] Audit each hook to determine correct query pattern
- [ ] For parent viewing student data: Use `student_profiles.id` to find student, then use appropriate column
- [ ] For student viewing own data: Use `auth.user.id` directly
- [ ] Consider using `parent_student_relationships` table for parent-student linking
- [ ] Document the correct ID semantics in code comments

---

### 2. Database Trigger/Policy Error - "parent_user_id is ambiguous"

**Problem:** Creating a new student from the mobile app fails with PostgreSQL error: `column reference "parent_user_id" is ambiguous`

**Location:** Database-side (Supabase) - likely in an RLS policy or trigger on `student_profiles` table

**Impact:** Cannot create new students from mobile app

**To Fix (in Supabase, NOT in app code):**
- [ ] Run diagnostic query to find problematic policy/trigger:
  ```sql
  SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'student_profiles';
  SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'student_profiles';
  ```
- [ ] Qualify ambiguous `parent_user_id` reference with table name (e.g., `student_profiles.parent_user_id` or `NEW.parent_user_id`)

---

### 3. Behavior Assessment Tables Have Inconsistent Schema

**Problem:** The `behavior_assessments` table has THREE ID columns that serve overlapping purposes:
- `user_id` (required) - Who created the record
- `student_id` (nullable) - FK to users table
- `student_user_id` (nullable) - Another user reference

**Related Views:**
- `behavior_assessments_complete` - Adds `parent_user_id`
- `behavior_assessments_pending` - Adds `parent_user_id`
- `behavior_assessments_archived_*` - Only has `user_id` (loses student association!)

**To Fix:**
- [ ] Document which ID column should be used for which purpose
- [ ] Update hooks to use the correct column consistently
- [ ] Consider if archived tables need student_id added for historical queries

---

## HIGH PRIORITY (Feature Parity Issues)

### 4. Incomplete UI Screens

These screens have hooks created but incomplete or basic UI:

| Screen | File | Status | Missing |
|--------|------|--------|---------|
| Term Tracking | `app/term-tracking.tsx` | Framework only | Full UI implementation, charts |
| Family Meetings | `app/family-meetings.tsx` | Framework only | Full scheduling UI, calendar integration |
| Student Management | `app/student-management.tsx` | Framework only | Full CRUD forms, validation |
| Grade Approval | `app/grade-approval.tsx` | Framework only | Approval workflow UI, bulk actions |
| Edit Profile | `app/edit-profile.tsx` | Basic | Form validation, error handling |

**To Fix:**
- [ ] Complete Term Tracking screen with progress charts and term history
- [ ] Complete Family Meetings screen with date picker, recurring meetings
- [ ] Complete Student Management with add/edit/delete forms
- [ ] Complete Grade Approval with pending list, approve/reject actions
- [ ] Add form validation to Edit Profile

---

### 5. Missing Analytics/Charts

**Problem:** CS-Premium has rich analytics; mobile app has basic charts only in some screens.

**Current State:**
- Earnings tab: Has pie charts for income sources and allocation ✅
- Grades tab: Has grade distribution pie chart ✅
- Behavior tab: Has basic trend line chart ✅
- Dashboard: No charts ❌
- Term Tracking: No GPA history chart ❌

**To Fix:**
- [ ] Add earnings trend chart to dashboard
- [ ] Add GPA history line chart to term tracking
- [ ] Add behavior score trend to dashboard
- [ ] Add grade comparison charts (current vs previous term)

---

### 6. Savings Goals - Local Storage Only

**Problem:** `useSavingsGoals.ts` uses AsyncStorage instead of Supabase. Data doesn't sync across devices or persist server-side.

**Impact:**
- User loses savings goals if they reinstall app
- Data not visible in CS-Premium web app
- No backup/restore capability

**To Fix:**
- [ ] Create `savings_goals` table in Supabase (or verify it exists)
- [ ] Update `useSavingsGoals.ts` to use Supabase instead of AsyncStorage
- [ ] Add migration to move existing local data to server

---

### 7. Family Meetings - Local Storage Only

**Problem:** `useFamilyMeetings.ts` uses AsyncStorage instead of Supabase.

**Database Tables Available:** `family_meetings`, `family_meeting_assessments` exist in types.ts

**To Fix:**
- [ ] Update `useFamilyMeetings.ts` to use Supabase `family_meetings` table
- [ ] Implement meeting assessments with `family_meeting_assessments` table
- [ ] Add real-time sync for family meeting updates

---

### 8. Question of the Day - Limited Functionality

**Current Issues:**
- QOD only works for users with student auth accounts
- Streak count tries to read from `student_profiles.streak_count` which may not exist
- No sync with web app QOD progress

**To Fix:**
- [ ] Verify `question_of_day_results` table accepts student profile IDs (not just auth user IDs)
- [ ] Add streak tracking that works without `streak_count` column
- [ ] Ensure QOD progress syncs with CS-Premium

---

## MEDIUM PRIORITY (Polish & UX)

### 9. Error Handling Improvements

**Current Gaps:**
- Network errors show generic messages
- No retry UI for failed requests
- No offline mode or cached data display
- Session expiration not handled gracefully

**To Fix:**
- [ ] Add React Query error boundaries
- [ ] Implement retry buttons on error states
- [ ] Add offline detection and cached data display
- [ ] Handle 401 errors with re-authentication flow

---

### 10. Form Validation

**Missing Validation:**
- Grade submission: No validation that base_amount > 0
- Student creation: No email format validation
- Profile edit: No grade level validation (should be 1-12 or K)
- Term setup: No term length range validation

**To Fix:**
- [ ] Add Zod schemas for all form inputs (zod is already installed)
- [ ] Display validation errors inline
- [ ] Prevent form submission with invalid data

---

### 11. Loading States & Skeletons

**Current State:** Most screens show a spinner while loading

**Improvement:** Add skeleton loading screens for better UX

**To Fix:**
- [ ] Create skeleton components for cards, lists, charts
- [ ] Replace spinners with skeletons on main screens
- [ ] Add pull-to-refresh on all data screens (some have it, some don't)

---

### 12. Push Notification Integration

**Current State:**
- `useNotifications.ts` and `src/services/notifications.ts` are implemented
- Local notifications work
- Push token is retrieved but not sent to server

**Missing:**
- Server-side push notification sending
- Notification preferences sync with backend
- Badge count management

**To Fix:**
- [ ] Send push token to Supabase when obtained
- [ ] Create Supabase Edge Function or backend to send push notifications
- [ ] Implement notification preferences table
- [ ] Add badge count for pending items

---

## LOW PRIORITY (Nice to Have)

### 13. Data Export

**Not Implemented:** CS-Premium may have CSV/PDF export for reports

**To Fix:**
- [ ] Add CSV export for grades history
- [ ] Add PDF export for term reports
- [ ] Consider react-native-share for sharing exports

---

### 14. Biometric Authentication

**Not Implemented:** Could enhance security/convenience

**To Fix:**
- [ ] Add expo-local-authentication
- [ ] Implement Face ID / Touch ID for app unlock
- [ ] Store biometric preference in settings

---

### 15. Dark Mode

**Not Implemented:** App is light mode only

**To Fix:**
- [ ] Create dark theme color palette
- [ ] Use React context for theme state
- [ ] Persist theme preference
- [ ] Use expo-appearance for system theme detection

---

### 16. Accessibility

**Partial:** Basic accessibility exists but not comprehensive

**To Fix:**
- [ ] Add accessibilityLabel to all interactive elements
- [ ] Ensure color contrast meets WCAG guidelines
- [ ] Test with VoiceOver
- [ ] Add accessibilityHint for complex interactions

---

## iOS APP STORE SUBMISSION REQUIREMENTS

### 17. EAS Configuration (Required)

**Status:** Placeholders need to be filled in `eas.json`

**To Fix:**
- [ ] Get Apple Developer Team ID from developer.apple.com
- [ ] Create App in App Store Connect, get ASC App ID
- [ ] Update `eas.json`:
  ```json
  "appleTeamId": "ACTUAL_TEAM_ID",
  "ascAppId": "ACTUAL_ASC_APP_ID"
  ```

---

### 18. App Store Assets (Required)

**To Prepare:**
- [ ] App icon 1024x1024 PNG (no transparency, no rounded corners)
- [ ] Screenshots for iPhone 6.7" (required)
- [ ] Screenshots for iPhone 6.5" (required)
- [ ] Screenshots for iPhone 5.5" (required if supporting older devices)
- [ ] iPad screenshots (if supporting iPad)
- [ ] App Preview video (optional but recommended)

---

### 19. App Store Metadata (Required)

**To Prepare:**
- [ ] App name (30 characters max)
- [ ] Subtitle (30 characters max)
- [ ] Description (4000 characters max)
- [ ] Keywords (100 characters max, comma separated)
- [ ] Support URL (must be accessible)
- [ ] Privacy Policy URL (must be accessible)
- [ ] Marketing URL (optional)

---

### 20. Demo Account for Review

**Required by Apple:**
- [ ] Create demo account: `appreview@centsiblescholar.com`
- [ ] Pre-populate with sample data (grades, behavior, etc.)
- [ ] Document credentials in App Store Connect

---

### 21. Website Requirements

**Apple requires these pages to be accessible:**
- [ ] Privacy Policy page at `/privacy`
- [ ] Terms of Service page at `/terms`
- [ ] Account deletion page at `/settings/delete-account`
- [ ] Help/Support page at `/help`

---

## TESTING REQUIREMENTS

### 22. Pre-Submission Testing

**To Complete:**
- [ ] Test on physical iPhone device (not just simulator)
- [ ] Test all user flows end-to-end
- [ ] Test with poor network conditions
- [ ] Test push notifications on device
- [ ] Test deep linking from web
- [ ] Test account deletion flow
- [ ] Test subscription status display
- [ ] Verify all Supabase queries work with production data

---

## DEPENDENCY UPDATES

### 23. Package Updates (Recommended)

The following packages have newer versions available:
```
expo@54.0.25 → ~54.0.32
expo-linking@8.0.9 → ~8.0.11
expo-router@6.0.15 → ~6.0.22
expo-status-bar@3.0.8 → ~3.0.9
react-native-svg@15.15.1 → 15.12.1 (downgrade recommended)
react-native-worklets@0.5.0 → 0.5.1
```

**To Fix:**
- [ ] Run `npx expo install --fix` to update to compatible versions
- [ ] Test thoroughly after updates

---

## SUMMARY

### Critical (App Won't Work Without These)
1. Fix database ID mismatches in all hooks
2. Fix or document Supabase trigger/policy for student creation
3. Clarify behavior_assessments ID column semantics

### High Priority (Feature Parity)
4. Complete incomplete UI screens (5 screens)
5. Add missing analytics charts
6. Migrate savings goals to Supabase
7. Migrate family meetings to Supabase
8. Fix QOD for non-auth students

### Medium Priority (Polish)
9-12. Error handling, validation, loading states, push notifications

### Low Priority (Nice to Have)
13-16. Export, biometrics, dark mode, accessibility

### App Store Requirements
17-23. EAS config, assets, metadata, demo account, website, testing

---

## Estimated Effort

| Category | Items | Estimated Hours |
|----------|-------|-----------------|
| Critical Blockers | 3 | 16-24 hours |
| High Priority | 5 | 40-60 hours |
| Medium Priority | 4 | 20-30 hours |
| Low Priority | 4 | 16-24 hours |
| App Store Prep | 7 | 8-16 hours |
| **Total** | **23** | **100-154 hours** |

---

*Generated: January 30, 2026*
*Repository: centsible-scholar-mobile*
