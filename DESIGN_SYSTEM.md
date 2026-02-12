# Centsible Scholar Mobile - Design System

Single source of truth for colors, typography, spacing, and reusable UI components.

## Theme Structure

All theme tokens live in `src/theme/`:

| File | Purpose |
|---|---|
| `colors.ts` | `lightTheme` and `darkTheme` objects with all color tokens |
| `typography.ts` | Font sizes, weights, line heights, `getFontFamily()` |
| `spacing.ts` | 8pt grid spacing tokens, layout constants, border radii, shadows, sizing |
| `commonStyles.ts` | `createCommonStyles(colors)` factory for card, button, input, list, badge, container, modal, stat, emptyState shared styles |
| `ThemeContext.tsx` | `ThemeProvider` and `useTheme()` hook for reactive theme access |
| `index.ts` | Barrel exports for everything |

## Usage

### Accessing Theme Colors

```tsx
import { useTheme } from '@/theme';

function MyScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
  });
}
```

### Using Common Styles

```tsx
import { useTheme, createCommonStyles } from '@/theme';

function MyScreen() {
  const { colors } = useTheme();
  const common = createCommonStyles(colors);

  return (
    <View style={common.cardStyles.card}>
      <Text style={common.cardStyles.cardTitle}>Card Title</Text>
    </View>
  );
}
```

### Spacing and Sizing

```tsx
import { spacing, sizing, layout, borderRadius } from '@/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],           // 16px
    gap: spacing[3],               // 12px
  },
  button: {
    minHeight: sizing.touchTarget, // 44px
    borderRadius: borderRadius.md, // 8px
  },
  screen: {
    paddingHorizontal: layout.screenPaddingHorizontal, // 16px
  },
});
```

### Typography

```tsx
import { textStyles, typography } from '@/theme';

const styles = StyleSheet.create({
  heading: { ...textStyles.h2 },
  body: { ...textStyles.body },
  caption: { ...textStyles.caption },
});
```

## UI Components

### SkeletonCard / SkeletonList / DashboardSkeleton

Shimmer loading placeholders using `moti/skeleton`.

```tsx
import { SkeletonCard, SkeletonList, DashboardSkeleton } from '@/components/ui/SkeletonCard';

// Single card skeleton
<SkeletonCard height={80} lines={2} />

// List of skeleton cards
<SkeletonList count={5} cardHeight={80} />

// Dashboard-specific skeleton layout
<DashboardSkeleton />
```

**Props (SkeletonCard):** `height?` (default 120), `width?`, `radius?` (default 12), `lines?`
**Props (SkeletonList):** `count?` (default 3), `cardHeight?` (default 120)

### EmptyState

Centered empty state with icon, title, description, and optional action.

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon="school-outline"
  title="No Students Yet"
  description="Add a student to get started with tracking."
  actionLabel="Add Student"
  onAction={() => router.push('/add-student')}
/>
```

**Props:** `icon` (Ionicons name), `title`, `description?`, `actionLabel?`, `onAction?`

### ErrorState

Inline error display with retry button. Place where content would normally render.

```tsx
import { ErrorState } from '@/components/ui/ErrorState';

<ErrorState
  message="Failed to load grades. Please check your connection."
  onRetry={() => refetch()}
/>
```

**Props:** `message`, `onRetry?`

### LoadingOverlay

Modal overlay for long-running operations. Supports spinner or progress bar.

```tsx
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

// Spinner mode
<LoadingOverlay visible={isExporting} message="Exporting data..." />

// Progress bar mode
<LoadingOverlay visible={isExporting} message="Exporting..." progress={65} />
```

**Props:** `visible`, `message?`, `progress?` (0-100, shows progress bar instead of spinner)

## Color Token Reference

| Token | Light | Dark |
|---|---|---|
| `background` | `#ffffff` | `#111827` (gray-900) |
| `backgroundSecondary` | `#f9fafb` (gray-50) | `#1f2937` (gray-800) |
| `text` | `#111827` (gray-900) | `#f9fafb` (gray-50) |
| `textSecondary` | `#4b5563` (gray-600) | `#d1d5db` (gray-300) |
| `textTertiary` | `#9ca3af` (gray-400) | `#6b7280` (gray-500) |
| `primary` | `#4f46e5` (indigo-600) | `#818cf8` (indigo-400) |
| `primaryLight` | `#eef2ff` (indigo-50) | `#312e81` (indigo-900) |
| `secondary` | `#22c55e` (green-500) | `#4ade80` (green-400) |
| `accent` | `#0ea5e9` (scholar-500) | `#38bdf8` (scholar-400) |
| `border` | `#e5e7eb` (gray-200) | `#374151` (gray-700) |
| `card` | `#ffffff` | `#1f2937` (gray-800) |
| `success` | `#10b981` | `#34d399` |
| `warning` | `#f59e0b` | `#fbbf24` |
| `error` | `#ef4444` | `#f87171` |
| `info` | `#3b82f6` | `#60a5fa` |
| `tabActive` | `#4f46e5` (indigo-600) | `#818cf8` (indigo-400) |
| `tabInactive` | `#9ca3af` (gray-400) | `#6b7280` (gray-500) |

## Dos and Don'ts

**DO:**
- Use `useTheme().colors` for all color values
- Use `spacing` tokens for margins and padding (8pt grid)
- Use `sizing.touchTarget` (44pt) for minimum touch targets
- Use the `createStyles(colors: ThemeColors)` factory pattern for StyleSheet
- Use `createCommonStyles(colors)` for shared card/button/input styles
- Use `textStyles` for consistent typography (`h1`, `h2`, `h3`, `body`, `caption`, etc.)

**DON'T:**
- Hardcode hex color values (`#4F46E5`) in StyleSheet or inline styles
- Import `colors` directly from `@/theme` (deprecated static export, will be removed)
- Use inline styles for colors (ESLint `no-color-literals` will warn)
- Use raw numbers for spacing (use `spacing[4]` instead of `16`)

## Dark Mode

The theme system supports three modes:

1. **System** (default): Follows device light/dark setting via `useColorScheme()`
2. **Light**: Forces light theme regardless of system setting
3. **Dark**: Forces dark theme regardless of system setting

User preference is persisted in AsyncStorage under the key `theme-mode`.

```tsx
const { mode, setMode, isDark } = useTheme();

// Toggle dark mode
setMode(isDark ? 'light' : 'dark');

// Follow system
setMode('system');
```

## ESLint Enforcement

Two rules guard against hardcoded styles:

- `react-native/no-color-literals` -- warns on hex/rgb values in StyleSheet
- `react-native/no-inline-styles` -- warns on inline style objects

Currently set to `warn` during the migration period. Will be changed to `error` after Phase 6 migration is complete.
