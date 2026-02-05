# Codebase Concerns

**Analysis Date:** 2026-02-05

## Tech Debt

**RLS-Triggered SELECT Failures in Student Creation:**
- Issue: Student creation via `create-student` edge function relies on INSERT triggering parent_profiles creation. However, subsequent SELECT queries may fail if RLS policies require relationship records that don't exist yet. While edge functions bypass RLS, clients using `.insert().select().single()` can fail.
- Files: `src/integrations/supabase/client.ts` (signUpWithEmail), `app/(auth)/signup.tsx` (signup flow)
- Impact: Race condition where signup succeeds but data retrieval fails, leaving incomplete records. Fallback `ensureParentProfile()` exists but only handles parent_profiles, not other cascading failures.
- Fix approach: Separate INSERT from SELECT in client code. Ensure edge function returns complete student object rather than relying on subsequent client queries.

**Duplicate Query Logic Across Multiple Hooks:**
- Issue: `fetchPendingGrades()` and `fetchReviewedGrades()` in `useGradeApproval.ts` repeat the same parent_student_relationships → student_profiles lookup pattern. This pattern appears identically in `useStudentManagement.ts` and `useParentStudents.ts`.
- Files: `src/hooks/useGradeApproval.ts` (lines 40-98), `src/hooks/useStudentManagement.ts` (lines 44-75), `src/hooks/useParentStudents.ts` (lines 21-53)
- Impact: High maintenance burden. Changes to relationship logic must be applied in 3+ places. Inconsistent behavior risk if one location diverges.
- Fix approach: Extract parent-student relationship fetching into a shared utility: `src/shared/utils/relationshipQueries.ts`. Reuse across all hooks.

**Broad Error Handling Without Error Recovery:**
- Issue: Throughout codebase, errors are logged to console but not reported to user or stored for debugging. No distinction between network errors, auth errors, and data errors.
- Files: All hooks in `src/hooks/` (79 console.error calls), `src/contexts/AuthContext.tsx`, `src/integrations/supabase/client.ts`
- Impact: Users see blank states without understanding why (network failure? Auth failure? No data?). Server errors are invisible to monitoring.
- Fix approach: Implement error categorization enum. Create centralized error handler that routes to user-facing toast/alert. Consider Sentry or similar for backend error tracking.

## Known Bugs

**Password Toggle Does Not Apply to Confirm Password Field:**
- Symptoms: When user toggles password visibility in signup form, only the main password field reveals text; confirm password field remains hidden regardless of toggle state.
- Files: `app/(auth)/signup.tsx` (lines 149-172)
- Trigger: Fill password field, click "Show", then fill confirm password field. Confirm field remains masked while password field is visible.
- Workaround: Users must toggle password hidden, fill both fields, then toggle visible. Confirm field will still be masked but both inputs filled correctly.

**Selected Student Context Not Preserved Across Navigation:**
- Symptoms: When navigating between tabs, `selectedStudent` in StudentContext may reset if student list refetch occurs during navigation.
- Files: `src/contexts/StudentContext.tsx` (lines 22-26), `src/hooks/useParentStudents.ts` (auto-select behavior)
- Trigger: Navigate from dashboard to grades tab while students are being refetched. The useEffect in StudentContext can overwrite the selected student.
- Impact: Parent navigating between tabs with multiple students sees the view jump to first student.

**Multiple Queries Fetch Same Data for Same Student:**
- Symptoms: When viewing a student's grades, behavior bonuses, and assessments on same screen, three separate queries fetch overlapping student relationship data.
- Files: `src/hooks/useStudentGrades.ts`, `src/hooks/useBehaviorBonus.ts`, and components that call both
- Trigger: Open dashboard showing earnings + behavior bonus simultaneously.
- Impact: Unnecessary network calls, slower load times, cache thrashing in React Query.

## Security Considerations

**Hardcoded Supabase URL in Client Code:**
- Risk: EXPO_PUBLIC_SUPABASE_URL is correct pattern for Expo (public), but the anon key in EXPO_PUBLIC_SUPABASE_ANON_KEY allows unauthenticated read access to any table not protected by RLS.
- Files: `src/integrations/supabase/client.ts` (lines 6-7), `.env.example`
- Current mitigation: RLS policies should restrict access. Edge functions bypass client auth for sensitive operations.
- Recommendations: Verify all tables have appropriate RLS policies. Do not expose sensitive queries to unauthenticated anon key. Document RLS policy assumptions in code.

**Student Creation Delegates to Edge Function Without Validation:**
- Risk: `createStudent()` in `useStudentManagement.ts` calls edge function with user input (email, grade level, password) without client-side validation. Edge function must validate and sanitize.
- Files: `src/hooks/useStudentManagement.ts` (lines 111-142), edge function not in repo
- Current mitigation: Edge function is server-side, can validate. Client shows error if edge function fails.
- Recommendations: Add client-side validation for email format, password strength, grade level enum. Test edge function error responses.

**Console Logging Exposes User IDs and Timestamps:**
- Risk: Console.error() calls output user IDs, timestamps, and error details. In production apps with error tracking, this could expose PII.
- Files: Throughout codebase (79 console.error calls)
- Current mitigation: Error logs are only visible to user, not sent to server (unless error tracking added).
- Recommendations: In production, log only error type/code, not full error object. Use error categorization to avoid leaking details.

**Missing Input Validation on Student Grade Submission:**
- Risk: `submitGrade()` in `useStudentGrades.ts` accepts grade and subject without validating against allowed values.
- Files: `src/hooks/useStudentGrades.ts` (lines 74-90)
- Current mitigation: Database check should reject invalid grades via type checking.
- Recommendations: Add Zod schema for StudentGrade before submission. Validate grade is A-F, subject is in allowed list.

## Performance Bottlenecks

**N+1 Query Pattern in Grade Approval:**
- Problem: `fetchPendingGrades()` first queries parent_student_relationships (1 query), then student_profiles (1 query), then student_grades (1 query). Each is sequential, not parallelized.
- Files: `src/hooks/useGradeApproval.ts` (lines 40-98)
- Cause: Supabase RLS requires first fetching relationship to verify access, then can fetch related data. But queries are awaited sequentially.
- Improvement path: Parallelize with Promise.all(). Alternatively, move to edge function that can bypass RLS and perform joins server-side.

**React Query Stale Time Too Short for Grade Data:**
- Problem: Student grades use 2-minute stale time (`useStudentGrades.ts` line 105) but grades rarely change. This causes 5-30 refetches per session unnecessarily.
- Files: `src/hooks/useStudentGrades.ts` (line 105), `useGradeApproval.ts` (line 245)
- Cause: Conservative stale time to ensure fresh data, but doesn't account for user behavior.
- Improvement path: Increase stale time to 30 minutes for grades. Implement manual refetch button for "Refresh Now". Use mutation onSuccess to invalidate only affected queries.

**Large Notification List Stored in AsyncStorage:**
- Problem: `getScheduledNotifications()` in `notifications.ts` parses entire JSON every call. With many scheduled notifications, this grows expensive.
- Files: `src/services/notifications.ts` (lines 337-344)
- Cause: No indexing, no pagination. All scheduled notifications live in single AsyncStorage value.
- Improvement path: Limit stored notifications to active ones (next 7 days). Archive old notifications to separate key. Consider local SQLite for complex queries.

**No Pagination on Grade History:**
- Problem: `fetchReviewedGrades()` limits to 50 but queries last 30 days unfiltered. As app grows, this becomes slow.
- Files: `src/hooks/useGradeApproval.ts` (lines 100-161, limit 50)
- Cause: No cursor-based pagination, no infinite scroll pattern.
- Improvement path: Implement cursor-based pagination. Add "Load More" button. Cache pagination cursors in React Query.

## Fragile Areas

**StudentContext Auto-Selection Logic:**
- Files: `src/contexts/StudentContext.tsx` (lines 22-26)
- Why fragile: The useEffect has a race condition. If `students` updates while user is changing selectedStudent manually, the effect may override the user's choice.
- Safe modification: Add guard to prevent override if user recently selected a different student. Track selection timestamp or add explicit "use auto-select" mode.
- Test coverage: No tests for StudentContext. Need unit tests for: auto-select on first load, preserving manual selection, clearing on logout.

**GradeApproval Student Name Mapping:**
- Files: `src/hooks/useGradeApproval.ts` (lines 91-97, 155-160)
- Why fragile: `new Map(students.map(...))` followed by `.get()` with fallback to 'Unknown'. If a grade exists for a student that no longer exists or is inactive, will silently show 'Unknown'. This hides data consistency issues.
- Safe modification: Log when mapping fails. Add telemetry to track 'Unknown' grades. Make returned PendingGrade interface require student_id in addition to name for debugging.
- Test coverage: No tests for orphaned grades. Need test cases: student deactivated, student deleted, student never existed.

**Behavior Bonus Calculation Silent Zeros:**
- Files: `src/hooks/useBehaviorBonus.ts` (lines 87-92)
- Why fragile: If no assessments exist, returns average score of 0 without distinguishing between "no data" and "zero score". UI cannot show "no assessments yet" message.
- Safe modification: Return `assessmentCount` and check in UI. Add `hasData` boolean field.
- Test coverage: No tests for edge cases: 0 assessments, 1 assessment, negative scores, missing score fields.

**Hard-Coded Password Validation in Signup:**
- Files: `app/(auth)/signup.tsx` (line 37)
- Why fragile: Password minimum of 8 characters is hard-coded. If backend policy changes (e.g., to 12), signup will accept invalid passwords that backend rejects.
- Safe modification: Move to schema. Call `getCurrentUser()` and fetch `auth.config.password_min_length` from Supabase. Or move to edge function.
- Test coverage: No tests for edge cases: 7-character password (should fail), 8-character password (should pass), special characters, Unicode.

## Scaling Limits

**AsyncStorage for Notification Persistence:**
- Current capacity: AsyncStorage typically ~10MB on mobile, but JSON parsing grows expensive above 1000 records.
- Limit: App will become laggy if > 100 scheduled notifications active.
- Scaling path: Replace with SQLite (expo-sqlite). Implement archival job that removes old notifications. Add pagination.

**Single QueryClient for All Data:**
- Current capacity: QueryClient stores cache for all queries (students, grades, bonuses, assessments, etc.). With 20+ active queries, cache eviction becomes unpredictable.
- Limit: Unclear cache invalidation strategy when parent has 10+ students.
- Scaling path: Partition QueryClient cache by student. Use nested query keys: `['student', studentId, 'grades']` instead of `['studentGrades', studentId]`.

**Linear Scan for Parent-Student Relationships:**
- Current capacity: `parent_student_relationships` table is queried in every hook. With 100+ students per parent, this becomes slow.
- Limit: Parent dashboard with 50+ students will show slow load and refetch delays.
- Scaling path: Add database index on (parent_user_id, is_active). Implement caching strategy in app: fetch once per session, invalidate on create/deactivate student.

## Dependencies at Risk

**expo-crypto (Imported but Broken in Expo Go):**
- Risk: Project memory indicates `expo-crypto` does not work in Expo Go (the development runtime). If crypto operations are needed, they will fail.
- Impact: If any feature requires hashing, encryption, or signing, it will fail in development.
- Migration plan: Do not use `expo-crypto`. Use pure JS libraries like tweetnacl-js or libsodium.js. Or upgrade to native dev build.
- Current usage: Search codebase for `expo-crypto` imports - likely none, but verify.

**TanStack React Query Pin to ^5.90.11:**
- Risk: Major version 5 is relatively new. Pin to ^5.90 allows minor updates but no major version bumps. If v6 is released with breaking changes, app will not auto-update.
- Impact: Long-term maintenance burden. Manual migration needed when v6 released.
- Migration plan: Monitor TanStack React Query releases. Plan for v6 upgrade when features stabilize (likely 6-12 months).

**Supabase JavaScript SDK 2.86.0 Dependency:**
- Risk: SDK version is pinned to ^2.86.0. Auth API changes between minor versions could break signup/login.
- Impact: If Supabase releases 2.87+ with auth changes, app may experience login failures.
- Migration plan: Test Supabase updates in staging before deploying. Pin to exact version if stability is critical.

## Missing Critical Features

**No Error Boundary for Crashes:**
- Problem: React Native app has no ErrorBoundary component. If any screen crashes, entire app becomes unusable.
- Blocks: Any production deployment. App will lose users on crash.
- Recommendation: Implement ErrorBoundary wrapper. Add fallback UI. Log errors to crash tracking (Sentry).

**No Session Timeout / Auto-Logout:**
- Problem: Auth session persisted indefinitely via AsyncStorage. If device is stolen, attacker has permanent access.
- Blocks: Cannot safely use on shared devices. Parents concerned about security.
- Recommendation: Implement session timeout (e.g., logout after 30 min inactivity). Add biometric re-auth for sensitive actions.

**No Conflict Resolution for Concurrent Grade Updates:**
- Problem: If parent approves grade on phone and simultaneously on web, last write wins. No conflict detection.
- Blocks: Multi-device usage breaks grade approval workflow.
- Recommendation: Add `updated_at` timestamps. Compare before update. Show conflict UI if stale.

## Test Coverage Gaps

**AuthContext Has No Tests:**
- What's not tested: Session initialization, auth state change listener, logout flow, error handling when getSession() fails.
- Files: `src/contexts/AuthContext.tsx`
- Risk: Auth failures may not be detected until production. No way to verify session persistence works correctly.
- Priority: High - Auth is critical path.

**useStudentManagement Has No Tests:**
- What's not tested: Student creation validation, edge function error handling, RLS failures, relationship creation.
- Files: `src/hooks/useStudentManagement.ts`
- Risk: Student management features may fail silently. Can't reproduce RLS edge case during development.
- Priority: High - Student management is feature gate.

**Signup Form Has No Tests:**
- What's not tested: Form validation (password length, email format), password mismatch error, already-registered error, network failure handling.
- Files: `app/(auth)/signup.tsx`
- Risk: Users may not receive helpful error messages on signup failure. Password toggle bug will persist.
- Priority: High - Signup is entry point.

**Grade Approval Has No Integration Tests:**
- What's not tested: Full flow - parent approves grade, student sees updated status, history shows approval. Multi-student approval workflow.
- Files: `src/hooks/useGradeApproval.ts`, `app/grade-approval.tsx` (not provided)
- Risk: Grade workflow may be broken without detection. Approval status may not persist.
- Priority: High - Grade approval is core feature.

**Notification Scheduling Has No Tests:**
- What's not tested: Schedule time calculations, duplicate prevention, notification permission requests, AsyncStorage persistence.
- Files: `src/services/notifications.ts`
- Risk: Notifications may not trigger at scheduled time. Scheduled list may corrupt over time.
- Priority: Medium - Non-critical feature but user-facing.

---

*Concerns audit: 2026-02-05*
