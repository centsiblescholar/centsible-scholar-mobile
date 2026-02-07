---
phase: 05-iap-wiring
plan: 04
subsystem: infra
tags: [eas, build-profiles, expo, react-native-purchases, native-builds]

# Dependency graph
requires:
  - phase: 05-01
    provides: RevenueCat SDK installed, react-native-purchases in node_modules
provides:
  - EAS build profiles for development (simulator + device), preview, and production
  - development:device profile for physical device IAP sandbox testing
  - Validated native project generation via expo prebuild
affects: [06-polish, 07-submission]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EAS build profiles: development (sim), development:device (physical), preview (TestFlight), production (App Store)"
    - "react-native-purchases autolinked via native ios/android dirs, no Expo config plugin needed"

key-files:
  created: []
  modified:
    - eas.json
    - app.json

key-decisions:
  - "react-native-purchases v9.7.6 does not export an Expo config plugin -- native module is autolinked by CocoaPods/Gradle during EAS build"
  - "development:device extends development profile with simulator: false for physical device IAP sandbox testing"

patterns-established:
  - "Autolinking validation: run expo prebuild --no-install --clean to verify native modules resolve"

# Metrics
duration: 4min
completed: 2026-02-06
---

# Phase 5 Plan 4: EAS Build Config Summary

**EAS build profiles configured with development:device for IAP sandbox testing; react-native-purchases autolinked (no config plugin needed)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-07T00:58:29Z
- **Completed:** 2026-02-07T01:02:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `development:device` EAS build profile for physical device IAP sandbox testing
- Validated that `react-native-purchases` is autolinked (does not need Expo config plugin)
- Verified Expo config resolution, TypeScript compilation, and native prebuild all pass
- EAS CLI successfully reads project configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Update EAS build profiles and app.json plugin configuration** - `09edbfe` (feat)
2. **Task 1 fix: Remove invalid react-native-purchases plugin entry** - `b630f0f` (fix)
3. **Task 2: Validate build configuration with EAS CLI** - no file changes (validation only)

## Files Created/Modified
- `eas.json` - Added development:device profile extending development with simulator: false
- `app.json` - Plugin entry attempted then removed (react-native-purchases autolinks without it)

## Decisions Made
- **react-native-purchases does not export Expo config plugin:** The package (v9.7.6) has no `app.plugin.js` file. Adding it to the plugins array causes a PluginError. Native module linking is handled automatically by CocoaPods/Gradle autolinking during EAS build, since the package includes `ios/` and `android/` native directories.
- **development:device extends development:** Uses the `extends` key to inherit `developmentClient: true` and `distribution: internal`, only overriding `simulator: false` for physical device builds required for IAP sandbox testing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] react-native-purchases plugin entry causes PluginError**
- **Found during:** Task 2 (Validate build configuration)
- **Issue:** Plan specified adding `"react-native-purchases"` to app.json plugins array. Running `npx expo config --type public` threw `PluginError: Unable to resolve a valid config plugin for react-native-purchases` because the package has no `app.plugin.js` and its main export is not a valid config plugin.
- **Fix:** Removed `"react-native-purchases"` from the plugins array. The native module is autolinked by CocoaPods (iOS) and Gradle (Android) during EAS build via the package's native ios/ and android/ directories.
- **Files modified:** app.json
- **Verification:** `npx expo config --type public` resolves successfully; `npx expo prebuild --no-install --clean` succeeds
- **Committed in:** `b630f0f`

**2. [Rule 3 - Blocking] Uncommitted 05-03 paywall wiring changes**
- **Found during:** Task 2 (TypeScript validation)
- **Issue:** The 05-03 plan created `useRevenueCatPurchase` hook but left paywall.tsx UI wiring uncommitted, causing TypeScript errors (references to `useMockPurchase` import replaced but `setIsRestoring` and `supabase` still referenced)
- **Fix:** Committed the paywall.tsx changes as a 05-03 fixup commit
- **Files modified:** app/paywall.tsx
- **Verification:** `npx tsc --noEmit` passes after commit
- **Committed in:** `330055a` (attributed to 05-03, not 05-04)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Bug fix was essential -- the plan's plugin approach was incorrect for this package version. Blocking fix was pre-existing from concurrent 05-03 execution.

## Issues Encountered
- `npx eas-cli build:list --limit 0` fails with "must be between 1 and 50" -- used `--limit 1` instead for validation
- `expo-modules-autolinking resolve` does not list react-native-purchases because it uses React Native community autolinking (not Expo modules autolinking), which resolves at pod install / gradle sync time during actual build

## User Setup Required

Before running actual EAS builds:
- Fill in `ascAppId` (App Store Connect App ID) in eas.json submit configuration
- Fill in `appleTeamId` (Apple Developer Team ID) in eas.json submit configuration
- Create `google-service-account.json` for Android submission
- Run `eas login` if not already authenticated

## Next Phase Readiness
- EAS build configuration is validated and ready for actual builds
- All 4 Phase 5 plans complete -- Phase 5 (IAP Wiring) is finished
- Next: Phase 6 (Polish) or Phase 7 (Submission) when ready

---
*Phase: 05-iap-wiring*
*Completed: 2026-02-06*
