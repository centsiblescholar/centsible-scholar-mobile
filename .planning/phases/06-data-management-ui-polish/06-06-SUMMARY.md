---
phase: 06-data-management-ui-polish
plan: 06
subsystem: ui
tags: [react-native, theming, useTheme, skeleton-loading, error-state, empty-state, dark-mode]

# Dependency graph
requires:
  - phase: 06-01
    provides: "ThemeContext, useTheme hook, color tokens, SkeletonCard/EmptyState/ErrorState components"
  - phase: 06-02
    provides: "data-export.tsx screen to migrate"
  - phase: 06-03
    provides: "delete-account.tsx screen to migrate"
provides:
  - "All 9 modal/secondary screens using useTheme() for dark-mode-ready colors"
  - "Skeleton loading states on all 6 data-fetching modal screens"
  - "ErrorState with retry on all 6 data-fetching modal screens"
  - "Complete app-wide theme migration (combined with Plans 04/05)"
affects: [07-testing-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "createStyles(colors) factory + useMemo for screen-level styles"
    - "Sub-components receive colors/styles as props (not useTheme)"
    - "color + alpha string concatenation for tinted backgrounds (e.g., colors.error + '22')"
    - "Skeleton -> Error -> Empty -> Content ordering for all data-fetching screens"

key-files:
  created: []
  modified:
    - app/paywall.tsx
    - app/edit-profile.tsx
    - app/manage-subscription.tsx
    - app/student-management.tsx
    - app/grade-approval.tsx
    - app/term-tracking.tsx
    - app/family-meetings.tsx
    - app/data-export.tsx
    - app/delete-account.tsx

key-decisions:
  - "Paywall uses 3 style factories (toggle, card, main) due to sub-component complexity"
  - "grade-approval.tsx converted from static colors import to useTheme() while keeping non-color static imports (spacing, textStyles, etc.)"
  - "manage-subscription.tsx added loading/error guards that were previously missing"
  - "Screens with inline empty states (student-management, grade-approval, term-tracking, family-meetings) kept their custom context-specific empty states rather than replacing with generic EmptyState component"

patterns-established:
  - "All app screens now follow useTheme() pattern -- entire app is dark-mode-ready"
  - "All data-fetching screens follow: skeleton -> error -> empty -> content ordering"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 06 Plan 06: Modal/Secondary Screen Theme Migration Summary

**All 9 modal screens migrated to useTheme() with createStyles factory pattern, plus skeleton loading and ErrorState with retry on all 6 data-fetching modal screens**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T16:29:49Z
- **Completed:** 2026-02-12T16:36:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Migrated all 9 modal/secondary screens from hardcoded hex colors to useTheme() with createStyles(colors) factory pattern
- Added SkeletonList loading states to all 6 data-fetching modal screens (replacing ActivityIndicator spinners)
- Added ErrorState with retry buttons to all 6 data-fetching modal screens
- Combined with Plans 04 and 05, the entire app is now dark-mode-ready through ThemeContext

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate modal and secondary screens to useTheme** - `5398099` (feat)
2. **Task 2: Add skeleton/empty/error states to data-fetching modal screens** - `9080e8e` (feat)

## Files Created/Modified
- `app/paywall.tsx` - 3 style factories (toggle, card, main), 30+ hex values replaced with theme tokens
- `app/edit-profile.tsx` - createStyles factory, SkeletonList loading, ErrorState with retry
- `app/manage-subscription.tsx` - createStyles factory, SkeletonList loading, ErrorState with retry, debug colors semantic
- `app/student-management.tsx` - createStyles factory, SkeletonList loading, ErrorState with retry, sub-components themed
- `app/grade-approval.tsx` - Converted static colors import to useTheme(), SkeletonList loading, ErrorState for pending/reviewed errors
- `app/term-tracking.tsx` - createStyles factory, SkeletonList loading, ErrorState for config/snapshot errors, chart theme tokens
- `app/family-meetings.tsx` - createStyles factory, SkeletonList loading, ErrorState with retry, all sub-components themed
- `app/data-export.tsx` - Dual style factories (main + summary), Switch colors themed
- `app/delete-account.tsx` - createStyles factory, destructive colors via colors.error throughout

## Decisions Made
- **Paywall 3 factories:** paywall.tsx uses createToggleStyles, createCardStyles, and createStyles due to BillingToggle and PlanCard sub-components each needing distinct style sets
- **grade-approval static imports kept:** spacing, textStyles, borderRadius, shadows, grades, tints, layout, sizing are non-color design tokens that remain static imports -- only colors converted to useTheme()
- **manage-subscription loading guard added:** This screen previously had no isLoading guard at all; added SkeletonList + ErrorState as a deviation (Rule 2 - missing critical UX)
- **Custom empty states preserved:** Screens like student-management and grade-approval have context-specific empty states (e.g., "No Students Yet" with "Add Student" button, "All Caught Up!" for pending grades) that are more helpful than a generic EmptyState component, so they were kept as-is

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added loading/error guards to manage-subscription.tsx**
- **Found during:** Task 2 (Adding skeleton/error states)
- **Issue:** manage-subscription.tsx had no isLoading guard -- it rendered content immediately even while subscription data was fetching
- **Fix:** Added SkeletonList loading state and ErrorState with retry, plus loadingContainer style
- **Files modified:** app/manage-subscription.tsx
- **Verification:** TypeScript compiles, loading/error states render correctly
- **Committed in:** 9080e8e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for consistent UX. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All screens in the app now use useTheme() for colors -- the entire app is dark-mode-ready
- All data-fetching screens follow consistent skeleton -> error -> empty -> content pattern
- Phase 6 (Data Management + UI Polish) is now complete
- Ready for Phase 7 (Testing & Deployment)

---
*Phase: 06-data-management-ui-polish*
*Completed: 2026-02-12*
