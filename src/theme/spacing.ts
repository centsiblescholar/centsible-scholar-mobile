/**
 * Centsible Scholar Spacing & Sizing System
 * Based on 4px base unit (matches Tailwind's default)
 */

// Base spacing unit
const BASE_UNIT = 4;

// Spacing scale (multipliers of base unit)
export const spacing = {
  0: 0,
  0.5: BASE_UNIT * 0.5,   // 2px
  1: BASE_UNIT * 1,       // 4px
  1.5: BASE_UNIT * 1.5,   // 6px
  2: BASE_UNIT * 2,       // 8px
  2.5: BASE_UNIT * 2.5,   // 10px
  3: BASE_UNIT * 3,       // 12px
  3.5: BASE_UNIT * 3.5,   // 14px
  4: BASE_UNIT * 4,       // 16px
  5: BASE_UNIT * 5,       // 20px
  6: BASE_UNIT * 6,       // 24px
  7: BASE_UNIT * 7,       // 28px
  8: BASE_UNIT * 8,       // 32px
  9: BASE_UNIT * 9,       // 36px
  10: BASE_UNIT * 10,     // 40px
  11: BASE_UNIT * 11,     // 44px
  12: BASE_UNIT * 12,     // 48px
  14: BASE_UNIT * 14,     // 56px
  16: BASE_UNIT * 16,     // 64px
  20: BASE_UNIT * 20,     // 80px
  24: BASE_UNIT * 24,     // 96px
} as const;

// Semantic spacing aliases
export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing[4],  // 16px
  screenPaddingVertical: spacing[4],    // 16px

  // Card spacing
  cardPadding: spacing[4],              // 16px
  cardPaddingLarge: spacing[6],         // 24px
  cardGap: spacing[4],                  // 16px between cards
  cardMarginBottom: spacing[4],         // 16px

  // Section spacing
  sectionGap: spacing[6],               // 24px between sections
  sectionMarginBottom: spacing[6],      // 24px

  // Component internal spacing
  itemGap: spacing[3],                  // 12px between list items
  itemGapSmall: spacing[2],             // 8px
  itemGapLarge: spacing[4],             // 16px

  // Button padding
  buttonPaddingHorizontal: spacing[4],  // 16px
  buttonPaddingVertical: spacing[3],    // 12px
  buttonGap: spacing[2],                // 8px between icon and text

  // Input padding
  inputPaddingHorizontal: spacing[4],   // 16px
  inputPaddingVertical: spacing[3],     // 12px

  // Modal
  modalPadding: spacing[6],             // 24px

  // Header
  headerHeight: spacing[14],            // 56px
  headerPadding: spacing[4],            // 16px

  // Tab bar
  tabBarHeight: spacing[16],            // 64px (includes safe area)
  tabBarPadding: spacing[2],            // 8px

  // Bottom sheet handle
  bottomSheetHandle: spacing[1],        // 4px height
  bottomSheetHandleWidth: spacing[10],  // 40px width
} as const;

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,      // Inputs, small buttons
  lg: 12,     // Cards, modals
  xl: 16,     // Large modals
  '2xl': 24,  // Bottom sheets
  full: 9999, // Pills, avatars
} as const;

// Shadows (iOS)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// Common sizing
export const sizing = {
  // Touch targets (minimum 44px for accessibility)
  touchTarget: 44,
  touchTargetSmall: 36,

  // Icons
  iconXs: 12,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,
  icon2xl: 48,

  // Avatars
  avatarXs: 24,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 48,
  avatarXl: 64,

  // Badges
  badgeSize: 20,
  badgeSizeSmall: 16,

  // Indicators
  dotSize: 8,
  dotSizeSmall: 6,

  // Progress
  progressHeight: 8,
  progressHeightSmall: 4,

  // Divider
  dividerHeight: 1,
} as const;
