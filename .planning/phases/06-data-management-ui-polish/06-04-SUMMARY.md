---
phase: 06-data-management-ui-polish
plan: 04
subsystem: ui
tags: [react-native, theming, skeleton-loading, empty-state, error-state, dark-mode, accessibility]

# Dependency graph
requires:
  - phase: 06-01
    provides: ThemeProvider, useTheme hook, color tokens, SkeletonCard, EmptyState, ErrorState components
  - phase: 06-05
    provides: Auth/onboarding/daily component theme migration patterns (createStyles factory)
provides:
  - ThemeProvider wired at app root enabling dark mode switching
  - All 4 layout files using theme tokens for headers and tab bars
  - All 7 tab screens using useTheme() for reactive colors
  - Skeleton loading states on every data-fetching tab screen
  - EmptyState components with contextual messaging on every tab screen
  - ErrorState with retry on every tab screen with data fetching
  - 44pt minimum touch targets on all interactive elements
affects: [06-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "createStyles(colors) factory + useMemo for screen-level theme-reactive styles"
    - "RootNavigator pattern: nested component inside ThemeProvider to access useTheme in root layout"
    - "Skeleton -> Error -> Empty -> Content ordering for all data-fetching screens"

key-files:
  created: []
  modified:
    - app/_layout.tsx
    - app/(tabs)/_layout.tsx
    - app/(tabs)/dashboard.tsx
    - app/(tabs)/grades.tsx
    - app/(tabs)/behavior.tsx
    - app/(tabs)/earnings.tsx
    - app/(tabs)/learn.tsx
    - app/(tabs)/daily.tsx
    - app/(tabs)/settings.tsx

key-decisions:
  - "ThemeProvider placed inside RevenueCatProvider, outside StudentProvider in layout tree"
  - "RootNavigator extracted as nested component so Stack screenOptions can use useTheme()"
  - "Data visualization colors (chart/score colors) kept as hardcoded hex -- not UI chrome"
  - "ScoreRow in behavior receives colors as prop (local function component, not useTheme)"
  - "Dashboard parent view shows EmptyState when no student selected (not just loading)"

patterns-established:
  - "createStyles(colors) + useMemo: All screen-level styles use factory pattern for theme reactivity"
  - "Loading/Error/Empty ordering: if (isLoading) skeleton; if (error) ErrorState; if (!data) EmptyState; return content"
  - "minHeight: 44 on all TouchableOpacity and interactive elements for accessibility"
  - "placeholderTextColor on all TextInput components for theme compliance"

# Metrics
duration: 10min
completed: 2026-02-12
---

# Phase 6 Plan 4: Layout & Tab Screen Theme Migration Summary

**ThemeProvider wired at app root with all 4 layouts and 7 tab screens using useTheme() tokens, plus skeleton/empty/error states on every data-fetching screen**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-12T16:17:52Z
- **Completed:** 2026-02-12T16:28:20Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- ThemeProvider integrated at app root enabling dark mode switching for entire app
- Tab bar, navigation headers, and all primary screens fully themed with reactive color tokens
- Every data-fetching tab screen follows consistent skeleton -> error -> empty -> content pattern
- Friendly contextual empty states guide users (not just "no data")
- Error states have retry buttons for self-service recovery
- 44pt minimum touch targets enforced on all interactive elements across all tab screens

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire ThemeProvider into app root + migrate all 4 layout files** - `37e9a6d` (feat)
2. **Task 2: Migrate all 7 tab screens to useTheme + add skeleton/empty/error states** - `0035d0f` (feat)

## Files Created/Modified
- `app/_layout.tsx` - ThemeProvider wrapping, RootNavigator pattern for themed Stack headers
- `app/(tabs)/_layout.tsx` - Tab bar using theme tokens for active/inactive/background colors
- `app/(tabs)/dashboard.tsx` - createStyles factory, DashboardSkeleton, EmptyState for parent
- `app/(tabs)/grades.tsx` - createStyles factory, SkeletonList, ErrorState, EmptyState
- `app/(tabs)/behavior.tsx` - createStyles factory, SkeletonList, ErrorState, EmptyState
- `app/(tabs)/earnings.tsx` - createStyles factory, SkeletonList, ErrorState, EmptyState
- `app/(tabs)/learn.tsx` - createStyles factory (parent + student), DashboardSkeleton, ErrorState, EmptyState
- `app/(tabs)/daily.tsx` - createStyles factory, SkeletonList for wizard initialization
- `app/(tabs)/settings.tsx` - createStyles factory, SkeletonList, ErrorState

## Decisions Made
- ThemeProvider placed inside RevenueCatProvider, outside StudentProvider -- needs to be inside AuthProvider since useColorScheme is system-level, but before StudentProvider so all student-facing screens get themed
- RootNavigator extracted as a nested component function because useTheme() cannot be called in RootLayout before ThemeProvider is mounted in the JSX tree
- Data visualization colors (chart data, score button colors, info card teal palette) kept as hardcoded hex values -- these are semantic data colors not UI chrome, and would not change between light/dark themes
- ScoreRow in behavior screen receives colors as prop rather than calling useTheme() directly, matching the pattern established in 06-05 for local function components
- Dashboard parent view shows EmptyState when no student is selected and students are done loading, giving parents a clear call to action

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 main screens are fully themed and polished with professional loading/error/empty states
- Ready for 06-06 (remaining screen theme migration if any, or final verification)
- Dark mode switching now works end-to-end through the entire app

---
*Phase: 06-data-management-ui-polish*
*Completed: 2026-02-12*
