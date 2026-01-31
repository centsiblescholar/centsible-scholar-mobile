# Centsible Scholar Mobile - Session Context Handoff

**Date:** January 31, 2026
**Purpose:** Continue development work from previous session without losing context

---

## Project Overview

**Centsible Scholar Mobile** is a React Native/Expo mobile app that needs to achieve feature parity with **CS-Premium** (the web app) for iOS App Store submission.

**Current State:** ~60% functional with significant database integration issues

**Tech Stack:**
- Expo (v54.0.25)
- React Native
- TypeScript
- Supabase (PostgreSQL backend)
- TanStack React Query
- AsyncStorage (local data)

---

## Main Deliverable Created

**File:** `/FORENSIC_TODO_LIST.md`

This comprehensive forensic analysis documents all 23 to-do items needed for App Store readiness, organized by priority:

1. **Critical Blockers (3 items)** - Must fix before app works
2. **High Priority (5 items)** - Feature parity issues
3. **Medium Priority (4 items)** - Polish & UX
4. **Low Priority (4 items)** - Nice to have
5. **App Store Requirements (7 items)** - Submission checklist

---

## Critical Issue #1: Database ID Mismatches

The app confuses three different ID types throughout the codebase:

| ID Type | What It Is | Where Used |
|---------|-----------|------------|
| `user_id` | Authenticated user's Supabase auth ID | Auth context |
| `student_id` | Reference to `student_profiles.id` (profile record PK) | Most hooks |
| `student_user_id` | A student's own auth user ID (if they have one) | Some tables |

**Root Cause:** The `student_profiles` table uses `user_id` to store the **PARENT's** user ID (the owner), not the student's. But hooks pass `selectedStudent.id` (profile record ID) to queries expecting auth user IDs.

### Affected Hooks:

| Hook | File Path | Issue |
|------|-----------|-------|
| `useBehaviorAssessments.ts` | `src/hooks/` | Queries by `user_id` then falls back to `student_id` - ambiguous |
| `useBehaviorBonus.ts` | `src/hooks/` | Same ambiguous fallback pattern |
| `useStudentGrades.ts` | `src/hooks/` | Queries `student_user_id` then falls back to `dashboard_grades.student_id` |
| `useEducationBonus.ts` | `src/hooks/` | Queries `question_of_day_results.user_id` - only works for students with auth accounts |
| `useGradeApproval.ts` | `src/hooks/` | Queries `student_profiles.user_id = parentId` which is semantically wrong |

### Fix Pattern:
- For **parent viewing student data**: Use `student_profiles.id` to find student, then use appropriate column
- For **student viewing own data**: Use `auth.user.id` directly
- Consider using `parent_student_relationships` table for parent-student linking

---

## Critical Issue #2: Supabase RLS Policy Error

**Error:** `column reference "parent_user_id" is ambiguous`

**When:** Creating a new student from mobile app

**Location:** Database-side (Supabase) - likely in an RLS policy or trigger on `student_profiles` table

### Diagnostic Query to Run in Supabase:
```sql
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'student_profiles';

SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'student_profiles';
```

### Fix:
Qualify ambiguous `parent_user_id` reference with table name:
- `student_profiles.parent_user_id` instead of just `parent_user_id`
- Or `NEW.parent_user_id` in trigger context

---

## Critical Issue #3: Inconsistent behavior_assessments Schema

The `behavior_assessments` table has THREE ID columns serving overlapping purposes:
- `user_id` (required) - Who created the record
- `student_id` (nullable) - FK to users table
- `student_user_id` (nullable) - Another user reference

**Related Views:**
- `behavior_assessments_complete` - Adds `parent_user_id`
- `behavior_assessments_pending` - Adds `parent_user_id`
- `behavior_assessments_archived_*` - Only has `user_id` (loses student association!)

---

## High Priority Items (Feature Parity)

### 1. Incomplete UI Screens
| Screen | File | Status |
|--------|------|--------|
| Term Tracking | `app/term-tracking.tsx` | Framework only |
| Family Meetings | `app/family-meetings.tsx` | Framework only |
| Student Management | `app/student-management.tsx` | Framework only |
| Grade Approval | `app/grade-approval.tsx` | Framework only |
| Edit Profile | `app/edit-profile.tsx` | Basic |

### 2. Missing Analytics/Charts
- Dashboard: No charts ❌
- Term Tracking: No GPA history chart ❌

### 3. Savings Goals - Local Storage Only
**File:** `src/hooks/useSavingsGoals.ts`
- Uses AsyncStorage instead of Supabase
- Data doesn't sync across devices
- Need to create/verify `savings_goals` table in Supabase

### 4. Family Meetings - Local Storage Only
**File:** `src/hooks/useFamilyMeetings.ts`
- Uses AsyncStorage instead of Supabase
- Tables exist in types: `family_meetings`, `family_meeting_assessments`

### 5. Question of the Day Issues
**File:** `src/hooks/useQuestionOfTheDay.ts`
- Only works for users with student auth accounts
- Streak count tries to read from `student_profiles.streak_count` which may not exist

---

## Key Files Reference

### Hooks Directory (`src/hooks/`)
```
useBehaviorAssessments.ts  - Behavior assessment queries
useBehaviorBonus.ts        - Behavior bonus calculations
useEducationBonus.ts       - Education bonus (QOD) calculations
useFamilyMeetings.ts       - Family meetings (AsyncStorage)
useGradeApproval.ts        - Grade approval workflow
useNotifications.ts        - Push notification setup
useQuestionOfTheDay.ts     - Daily financial literacy questions
useSavingsGoals.ts         - Savings goals (AsyncStorage)
useStudentGrades.ts        - Student grade queries
useStudentManagement.ts    - CRUD for student profiles
useTermTracking.ts         - Academic term tracking
```

### App Routes (`app/`)
```
(tabs)/_layout.tsx         - Tab navigation layout
(tabs)/dashboard.tsx       - Main dashboard
(tabs)/grades.tsx          - Grades tab
(tabs)/behavior.tsx        - Behavior tab
(tabs)/earnings.tsx        - Earnings tab
(tabs)/learn.tsx           - Learning/QOD tab
(tabs)/settings.tsx        - Settings tab
edit-profile.tsx           - Profile editing
family-meetings.tsx        - Family meetings screen
grade-approval.tsx         - Grade approval screen
student-management.tsx     - Student management screen
term-tracking.tsx          - Term tracking screen
```

### Services (`src/services/`)
```
notifications.ts           - Push notification service
```

### Database Types
**File:** `src/integrations/supabase/types.ts`
Contains TypeScript types for all Supabase tables

---

## App Store Submission Checklist

1. **EAS Configuration** - Need Apple Team ID and ASC App ID in `eas.json`
2. **App Icon** - 1024x1024 PNG
3. **Screenshots** - Required for 6.7", 6.5", 5.5" iPhones
4. **Metadata** - App name, subtitle, description, keywords
5. **Demo Account** - `appreview@centsiblescholar.com` with sample data
6. **Website Pages** - Privacy policy, Terms of Service, Account deletion
7. **Testing** - Physical device, all user flows, push notifications

---

## Recommended Work Order

1. **Run Supabase diagnostic queries** to find the ambiguous RLS policy
2. **Fix the RLS policy** in Supabase dashboard
3. **Audit and fix ID mismatches** in hooks one by one
4. **Complete incomplete UI screens** (term tracking, family meetings, etc.)
5. **Migrate AsyncStorage hooks to Supabase** (savings goals, family meetings)
6. **Add missing charts/analytics**
7. **Polish items** (error handling, validation, loading states)
8. **App Store prep** (assets, metadata, demo account)

---

## Useful Supabase Tables

| Table | Purpose |
|-------|---------|
| `student_profiles` | Student records (owned by parent via `user_id`) |
| `dashboard_grades` | Grade entries |
| `behavior_assessments` | Behavior scores |
| `question_of_day_results` | QOD answer history |
| `family_meetings` | Meeting records |
| `family_meeting_assessments` | Meeting assessments |
| `parent_student_relationships` | Parent-student links |

---

## Session Notes

- The plan file exists at: `/Users/robertisrael/.claude/plans/precious-fluttering-yeti.md`
- The FORENSIC_TODO_LIST.md has the complete detailed breakdown
- Estimated total effort: 100-154 hours
- No code changes have been made yet - this was analysis/documentation only

---

*Generated: January 31, 2026*
