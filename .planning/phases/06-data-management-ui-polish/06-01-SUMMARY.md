---
phase: "06"
plan: "01"
subsystem: "design-system"
tags: ["theme", "dark-mode", "ui-components", "eslint", "skeleton", "empty-state", "error-state"]
dependency-graph:
  requires: ["01-01"]
  provides: ["ThemeProvider", "useTheme", "createCommonStyles", "SkeletonCard", "EmptyState", "ErrorState", "LoadingOverlay", "ESLint-no-color-literals"]
  affects: ["06-02", "06-03", "06-04", "06-05", "06-06"]
tech-stack:
  added: ["moti", "expo-linear-gradient", "expo-file-system", "expo-sharing", "eslint-plugin-react-native"]
  patterns: ["ThemeContext provider pattern", "createCommonStyles factory", "useTheme hook for reactive colors"]
key-files:
  created:
    - "src/theme/ThemeContext.tsx"
    - "src/components/ui/SkeletonCard.tsx"
    - "src/components/ui/EmptyState.tsx"
    - "src/components/ui/ErrorState.tsx"
    - "src/components/ui/LoadingOverlay.tsx"
    - "eslint.config.js"
    - "DESIGN_SYSTEM.md"
  modified:
    - "src/theme/colors.ts"
    - "src/theme/commonStyles.ts"
    - "src/theme/index.ts"
    - "package.json"
decisions:
  - id: "06-01-01"
    description: "ThemeColors type uses structural string mapping (not literal types) so both lightTheme and darkTheme satisfy it"
  - id: "06-01-02"
    description: "Static commonStyles exports kept alongside factory for backward compatibility during migration"
  - id: "06-01-03"
    description: "ESLint rules set to warn (not error) during migration -- change to error after Phase 6 complete"
  - id: "06-01-04"
    description: "moti/skeleton Expo variant used (auto-provides LinearGradient) -- no fallback needed"
  - id: "06-01-05"
    description: "expo-file-system and expo-sharing installed ahead of Plans 02/03 to avoid duplicate installs"
metrics:
  duration: "5min"
  completed: "2026-02-12"
---

# Phase 6 Plan 1: Design System Foundation Summary

ThemeContext with useTheme hook, createCommonStyles factory, 4 reusable UI state components, ESLint enforcement, and DESIGN_SYSTEM.md documentation.

## What Was Built

### ThemeContext + useTheme Hook (`src/theme/ThemeContext.tsx`)
- `ThemeProvider` wraps app, detects system color scheme via `useColorScheme()`
- `useTheme()` returns `{ colors, isDark, mode, setMode }` for reactive theme access
- Theme mode persisted in AsyncStorage under `theme-mode` key
- Supports `light`, `dark`, and `system` modes
- `ThemeColors` type changed from literal types to structural string mapping so both light and dark themes satisfy it

### Factory commonStyles (`src/theme/commonStyles.ts`)
- `createCommonStyles(themeColors)` factory generates all common style objects (card, button, input, list, badge, container, modal, stat, emptyState) using provided theme colors
- Static exports preserved for backward compatibility: `cardStyles`, `buttonStyles`, etc. still work as before
- New code pattern: `const common = createCommonStyles(colors)` using colors from `useTheme()`

### UI State Components (`src/components/ui/`)
- **SkeletonCard**: Shimmer loading placeholder using `moti/skeleton`, configurable height/width/radius/lines
- **SkeletonList**: Renders N SkeletonCards with spacing gaps
- **DashboardSkeleton**: Pre-built skeleton matching dashboard layout (hero + metrics + sections)
- **EmptyState**: Centered display with Ionicons icon, title, description, optional action button
- **ErrorState**: Inline error with alert-circle icon, message, "Try Again" retry button
- **LoadingOverlay**: Modal overlay with spinner or progress bar mode (0-100)
- All components use `useTheme().colors` for theme-aware styling

### ESLint Config (`eslint.config.js`)
- Flat config format with `eslint-plugin-react-native`
- `react-native/no-color-literals: warn` -- catches hardcoded hex/rgb in StyleSheet
- `react-native/no-inline-styles: warn` -- catches inline style objects
- Scoped to `**/*.ts` and `**/*.tsx`, excludes `node_modules` and `supabase/functions`

### Design System Documentation (`DESIGN_SYSTEM.md`)
- Theme structure overview (colors, typography, spacing, commonStyles, ThemeContext)
- Usage examples for useTheme, createCommonStyles, spacing, typography
- UI component documentation with props and code examples
- Color token reference table (light and dark values)
- Dos and Don'ts guide
- Dark mode explanation
- ESLint enforcement notes

## Decisions Made

1. **ThemeColors structural type**: Changed from `typeof lightTheme` (literal types) to `{ [K in keyof typeof lightTheme]: string }` so both lightTheme and darkTheme satisfy the type constraint
2. **Backward-compatible static exports**: `createCommonStyles(staticColors)` generates static exports so existing `import { cardStyles }` still works
3. **ESLint warn not error**: 660+ existing violations make error impractical; warn during migration, error after
4. **moti/skeleton Expo variant**: Auto-provides LinearGradient, no fallback needed for current Expo 54 setup
5. **Pre-install dependencies**: expo-file-system and expo-sharing installed now for Plans 02/03

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `npx tsc --noEmit`: PASS (no type errors)
- ThemeContext exports ThemeProvider and useTheme: CONFIRMED
- createCommonStyles factory + backward-compat static exports: CONFIRMED
- All 4 UI components exist with named exports: CONFIRMED
- ESLint config parses and loads rules: CONFIRMED
- DESIGN_SYSTEM.md exists with all required sections: CONFIRMED
- Backward-compatible `import { colors } from '@/theme'` still works: CONFIRMED (via tsc)

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | ThemeContext + useTheme + factory commonStyles | `7443984` | ThemeContext.tsx, colors.ts, commonStyles.ts, index.ts, package.json |
| 2 | UI state components + ESLint + DESIGN_SYSTEM.md | `5d759ff` | SkeletonCard.tsx, EmptyState.tsx, ErrorState.tsx, LoadingOverlay.tsx, eslint.config.js, DESIGN_SYSTEM.md |

## Next Phase Readiness

Plan 06-01 provides the foundation for all remaining Phase 6 plans:
- Plans 02-06 can now use `useTheme()` for reactive theme colors
- Plans 02-06 can use SkeletonCard/EmptyState/ErrorState/LoadingOverlay for consistent loading/error UX
- `createCommonStyles(colors)` enables dark-mode-ready screens as they are migrated
- ESLint warns catch new hardcoded colors going forward
