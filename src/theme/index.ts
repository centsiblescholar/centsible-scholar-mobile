/**
 * Centsible Scholar Theme
 * Centralized design system for the mobile app
 *
 * Usage:
 * import { theme } from '@/theme';
 * // or
 * import { colors, spacing, textStyles } from '@/theme';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: theme.spacing[4],
 *   },
 *   title: {
 *     ...theme.textStyles.h2,
 *     color: theme.colors.text,
 *   },
 * });
 */

// Color exports
export {
  colors,
  lightTheme,
  darkTheme,
  scholar,
  financial,
  indigo,
  gray,
  semantic,
  grades,
  tints,
  type ThemeColors,
  type GradeKey,
} from './colors';

// Typography exports
export {
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
  getFontFamily,
} from './typography';

// Spacing exports
export {
  spacing,
  layout,
  borderRadius,
  shadows,
  sizing,
} from './spacing';

// Theme context (reactive theme with dark mode support)
export { ThemeProvider, useTheme, type ThemeMode } from './ThemeContext';

// Common styles factory
export { createCommonStyles } from './commonStyles';

// Combined theme object for convenience
import { colors as themeColors, grades as gradeColors, tints as tintColors } from './colors';
import { textStyles as typography, fontSize as fontSizes, fontWeight as fontWeights } from './typography';
import { spacing as spacingScale, layout as layoutScale, borderRadius as radii, shadows as shadowStyles, sizing as sizes } from './spacing';

export const theme = {
  colors: themeColors,
  grades: gradeColors,
  tints: tintColors,
  textStyles: typography,
  fontSize: fontSizes,
  fontWeight: fontWeights,
  spacing: spacingScale,
  layout: layoutScale,
  borderRadius: radii,
  shadows: shadowStyles,
  sizing: sizes,
} as const;

export type Theme = typeof theme;
