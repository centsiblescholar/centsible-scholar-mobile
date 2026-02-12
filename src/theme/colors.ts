/**
 * Centsible Scholar Color System
 * Matches the web app's Tailwind-based design system
 */

// Scholar Blue - Primary brand color (matches web's scholar scale)
export const scholar = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9', // Primary
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
} as const;

// Financial Green - Secondary brand color (matches web's financial scale)
export const financial = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e', // Primary
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
} as const;

// Indigo - Current primary accent (legacy, transitioning to scholar)
export const indigo = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5', // Currently used as primary
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
} as const;

// Gray scale (matches Tailwind gray)
export const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const;

// Semantic colors
export const semantic = {
  success: '#10b981', // Green-500
  warning: '#f59e0b', // Amber-500
  error: '#ef4444',   // Red-500
  info: '#3b82f6',    // Blue-500
} as const;

// Grade colors (letter grades to colors)
export const grades = {
  'A+': '#10b981',
  'A': '#10b981',
  'A-': '#34d399',
  'B+': '#3b82f6',
  'B': '#3b82f6',
  'B-': '#60a5fa',
  'C+': '#f59e0b',
  'C': '#f59e0b',
  'C-': '#fbbf24',
  'D+': '#f97316',
  'D': '#f97316',
  'D-': '#fb923c',
  'F': '#ef4444',
} as const;

// Tinted backgrounds (for cards, badges, etc.)
export const tints = {
  indigo: '#eef2ff',
  green: '#f0fdf4',
  amber: '#fef3c7',
  blue: '#dbeafe',
  red: '#fee2e2',
  cyan: '#cffafe',
  purple: '#f3e8ff',
} as const;

// Light theme colors (default)
export const lightTheme = {
  // Backgrounds
  background: '#ffffff',
  backgroundSecondary: gray[50],
  backgroundTertiary: gray[100],

  // Text
  text: gray[900],
  textSecondary: gray[600],
  textTertiary: gray[400],
  textInverse: '#ffffff',

  // Primary actions
  primary: indigo[600], // Current: #4F46E5
  primaryLight: indigo[50],
  primaryDark: indigo[700],

  // Secondary (financial green)
  secondary: financial[500],
  secondaryLight: financial[50],
  secondaryDark: financial[600],

  // Accent (scholar blue)
  accent: scholar[500],
  accentLight: scholar[50],
  accentDark: scholar[600],

  // Borders
  border: gray[200],
  borderLight: gray[100],
  borderDark: gray[300],

  // Cards
  card: '#ffffff',
  cardBorder: gray[200],

  // Inputs
  input: gray[50],
  inputBorder: gray[300],
  inputFocus: indigo[500],

  // Status
  success: semantic.success,
  warning: semantic.warning,
  error: semantic.error,
  info: semantic.info,

  // Tab bar
  tabBar: '#ffffff',
  tabBarBorder: gray[200],
  tabActive: indigo[600],
  tabInactive: gray[400],
} as const;

// Dark theme colors (for future use)
export const darkTheme = {
  // Backgrounds
  background: gray[900],
  backgroundSecondary: gray[800],
  backgroundTertiary: gray[700],

  // Text
  text: gray[50],
  textSecondary: gray[300],
  textTertiary: gray[500],
  textInverse: gray[900],

  // Primary actions
  primary: indigo[400],
  primaryLight: indigo[900],
  primaryDark: indigo[300],

  // Secondary
  secondary: financial[400],
  secondaryLight: financial[900],
  secondaryDark: financial[300],

  // Accent
  accent: scholar[400],
  accentLight: scholar[900],
  accentDark: scholar[300],

  // Borders
  border: gray[700],
  borderLight: gray[800],
  borderDark: gray[600],

  // Cards
  card: gray[800],
  cardBorder: gray[700],

  // Inputs
  input: gray[800],
  inputBorder: gray[600],
  inputFocus: indigo[400],

  // Status (slightly adjusted for dark mode)
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',

  // Tab bar
  tabBar: gray[900],
  tabBarBorder: gray[800],
  tabActive: indigo[400],
  tabInactive: gray[500],
} as const;

// DEPRECATED: Use useTheme().colors instead. This static export will be removed after migration.
export const colors = lightTheme;

// Type exports -- uses { [K in keyof typeof lightTheme]: string } so both light and dark themes satisfy it
export type ThemeColors = { [K in keyof typeof lightTheme]: string };
export type GradeKey = keyof typeof grades;
