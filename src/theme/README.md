# Centsible Scholar Mobile Theme System

This theme system provides a centralized design system that matches the web application's Tailwind-based styling.

## Quick Start

```typescript
import { theme } from '../src/theme';
// or import specific modules:
import { colors, spacing, textStyles, borderRadius, shadows } from '../src/theme';
```

## Color System

### Brand Colors

| Scale | Scholar Blue | Financial Green | Indigo (Legacy) |
|-------|-------------|-----------------|-----------------|
| 500 (Primary) | `#0ea5e9` | `#22c55e` | `#6366f1` |
| 600 | `#0284c7` | `#16a34a` | `#4f46e5` |

```typescript
import { scholar, financial, indigo, gray } from '../src/theme';

// Use color scales
backgroundColor: scholar[500]  // Primary scholar blue
color: gray[600]               // Secondary text
```

### Theme Colors

```typescript
import { colors } from '../src/theme';

// Semantic colors
colors.primary      // #4F46E5 (indigo-600)
colors.secondary    // #22c55e (financial green)
colors.accent       // #0ea5e9 (scholar blue)

// Text colors
colors.text         // Primary text
colors.textSecondary
colors.textTertiary

// Backgrounds
colors.background
colors.backgroundSecondary
colors.card

// Status colors
colors.success
colors.warning
colors.error
colors.info
```

### Grade Colors

```typescript
import { grades } from '../src/theme';

const gradeColor = grades['A'];  // #10b981 (green)
const gradeColor = grades['B'];  // #3b82f6 (blue)
const gradeColor = grades['F'];  // #ef4444 (red)
```

## Typography

### Text Styles (Pre-defined)

```typescript
import { textStyles } from '../src/theme';

const styles = StyleSheet.create({
  title: {
    ...textStyles.h1,     // 30px bold
    color: colors.text,
  },
  subtitle: {
    ...textStyles.h3,     // 20px semibold
    color: colors.textSecondary,
  },
  body: {
    ...textStyles.body,   // 16px regular
  },
  caption: {
    ...textStyles.caption, // 12px
  },
  label: {
    ...textStyles.label,   // 14px medium
  },
  metric: {
    ...textStyles.metric,  // 24px bold (for numbers)
  },
});
```

### Available Text Styles

| Style | Size | Weight | Use Case |
|-------|------|--------|----------|
| `display` | 36px | bold | Hero text |
| `h1` | 30px | bold | Page titles |
| `h2` | 24px | bold | Section titles |
| `h3` | 20px | semibold | Card titles |
| `h4` | 18px | semibold | Subsection titles |
| `body` | 16px | normal | Default text |
| `bodySmall` | 14px | normal | Secondary text |
| `caption` | 12px | normal | Labels, hints |
| `label` | 14px | medium | Form labels |
| `button` | 16px | semibold | Button text |
| `overline` | 12px | semibold | Uppercase labels |
| `metric` | 24px | bold | Numbers, values |
| `metricLarge` | 30px | bold | Large numbers |

## Spacing

### Spacing Scale

```typescript
import { spacing } from '../src/theme';

// Based on 4px unit
spacing[1]  // 4px
spacing[2]  // 8px
spacing[3]  // 12px
spacing[4]  // 16px
spacing[6]  // 24px
spacing[8]  // 32px
```

### Layout Helpers

```typescript
import { layout } from '../src/theme';

layout.screenPaddingHorizontal  // 16px
layout.cardPadding              // 16px
layout.sectionGap               // 24px
layout.itemGap                  // 12px
```

## Border Radius

```typescript
import { borderRadius } from '../src/theme';

borderRadius.sm    // 4px - small elements
borderRadius.md    // 8px - inputs, buttons
borderRadius.lg    // 12px - cards
borderRadius.xl    // 16px - modals
borderRadius['2xl'] // 24px - bottom sheets
borderRadius.full  // 9999px - pills, avatars
```

## Shadows

```typescript
import { shadows } from '../src/theme';

const styles = StyleSheet.create({
  card: {
    ...shadows.md,  // Standard card shadow
  },
  elevated: {
    ...shadows.lg,  // More prominent
  },
  modal: {
    ...shadows.xl,  // Modal/overlay shadow
  },
});
```

## Common Styles

Pre-built style objects for common patterns:

```typescript
import {
  cardStyles,
  buttonStyles,
  inputStyles,
  listStyles,
  containerStyles,
  modalStyles,
} from '../src/theme/commonStyles';

// Use directly
<View style={cardStyles.card}>
  <Text style={cardStyles.cardTitle}>Title</Text>
</View>

// Or spread into your styles
const styles = StyleSheet.create({
  myCard: {
    ...cardStyles.card,
    marginTop: spacing[4],
  },
});
```

## Migration Example

### Before (Hardcoded)

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
  },
});
```

### After (Theme-based)

```typescript
import { colors, spacing, borderRadius, shadows, textStyles } from '../src/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  title: {
    ...textStyles.h2,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.md,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
});
```

## File Structure

```
src/theme/
├── index.ts          # Main export file
├── colors.ts         # Color palette & themes
├── typography.ts     # Font sizes, weights, text styles
├── spacing.ts        # Spacing, sizing, shadows, radius
├── commonStyles.ts   # Pre-built component styles
└── README.md         # This file
```

## Dark Mode (Future)

The theme system includes dark mode colors ready for implementation:

```typescript
import { lightTheme, darkTheme } from '../src/theme';

// Use with React context for dynamic theming
const colors = isDarkMode ? darkTheme : lightTheme;
```
