---
phase: 06-data-management-ui-polish
plan: 03
subsystem: auth
tags: [account-deletion, edge-function, cascade-delete, apple-compliance, supabase-admin]

# Dependency graph
requires:
  - phase: 06-02
    provides: Privacy section in Settings, edge function patterns (CORS, auth, admin client)
  - phase: 02-01
    provides: Auth context, signOut helper, login screen for redirect
  - phase: 04-03
    provides: useSubscriptionStatus hook, Settings screen with Account section
provides:
  - Server-side cascade account deletion (delete-account edge function)
  - Client-side useAccountDeletion hook with step-based flow
  - Two-step delete-account confirmation screen
  - Apple-compliant account deletion from Settings
affects: [07-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edge function cascade deletion: students first, then parent via auth.admin.deleteUser"
    - "Step-based hook state machine: warning > confirm > deleting"
    - "Subscription gate: block destructive action when active subscription exists"

key-files:
  created:
    - supabase/functions/delete-account/index.ts
    - src/hooks/useAccountDeletion.ts
    - app/delete-account.tsx
  modified:
    - app/(tabs)/settings.tsx
    - app/_layout.tsx

key-decisions:
  - "auth.admin.deleteUser for cascade (not manual table deletes) -- foreign key CASCADE handles all public table cleanup"
  - "Two-step confirmation (warning + type DELETE) satisfies Apple deletion UX requirements"
  - "Subscription check on both server (edge function) and client (hook) for defense in depth"
  - "Students hidden from Delete Account option via isParent guard in Settings"

patterns-established:
  - "Destructive action pattern: red header, warning step, typed confirmation, server validation"
  - "Edge function auth + role verification pattern: getUser(token) then user_metadata check"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 6 Plan 3: Account Deletion Summary

**Cascade account deletion via Supabase edge function with two-step in-app confirmation, subscription gate, and Apple-compliant Settings integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T16:09:00Z
- **Completed:** 2026-02-12T16:12:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Edge function cascade-deletes student auth users then parent auth user, with foreign key CASCADE handling all public table cleanup
- Two-step confirmation screen: warning with data list and student count, then type DELETE to confirm
- Active subscription blocks deletion with link to manage subscription
- Settings Delete Account row navigates to in-app screen (replaces external URL); hidden for students

## Task Commits

Each task was committed atomically:

1. **Task 1: Create delete-account Supabase edge function** - `ac73c3d` (feat)
2. **Task 2: Create useAccountDeletion hook, delete-account screen, and wire into Settings** - `6f1f4d6` (feat)

## Files Created/Modified
- `supabase/functions/delete-account/index.ts` - Edge function: auth, subscription check, cascade student + parent deletion
- `src/hooks/useAccountDeletion.ts` - Hook managing deletion step state, subscription check, edge function call, sign-out
- `app/delete-account.tsx` - Two-step deletion screen (warning with bullet list + confirmation with DELETE input)
- `app/(tabs)/settings.tsx` - Delete Account row now navigates to in-app screen, wrapped with isParent guard
- `app/_layout.tsx` - Stack.Screen for delete-account route with red destructive header

## Decisions Made
- Used auth.admin.deleteUser for cascade deletion rather than manual table deletes -- foreign key CASCADE in Supabase handles all public table cleanup automatically
- Two-step confirmation (warning + type DELETE) follows Apple's account deletion UX requirements
- Subscription check enforced on both client (hook prevents UI progression) and server (edge function returns 400) for defense in depth
- Students cannot see or access Delete Account (isParent guard in Settings, user_type check in edge function)
- signOut() wrapped in try/catch since session may already be invalidated after server-side auth user deletion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

- Deploy delete-account edge function: `supabase functions deploy delete-account`

## Next Phase Readiness
- Account deletion feature complete and ready for end-to-end testing
- Design system (Plan 04) can migrate delete-account screen colors to useTheme
- All Apple-required privacy features (data export + account deletion) now implemented

---
*Phase: 06-data-management-ui-polish*
*Completed: 2026-02-12*
