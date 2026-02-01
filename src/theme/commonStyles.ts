/**
 * Common Style Patterns
 * Reusable style objects for consistent UI across the app
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, tints } from './colors';
import { textStyles } from './typography';
import { spacing, layout, borderRadius, shadows } from './spacing';

// Card styles
export const cardStyles = StyleSheet.create({
  // Standard card
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: layout.cardPadding,
    ...shadows.md,
  },

  // Card with border instead of shadow
  cardOutline: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // Compact card
  cardCompact: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    ...shadows.sm,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  // Card title
  cardTitle: {
    ...textStyles.h3,
    color: colors.text,
  },

  // Card description
  cardDescription: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

// Button styles
export const buttonStyles = StyleSheet.create({
  // Primary button
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: layout.buttonPaddingHorizontal,
    paddingVertical: layout.buttonPaddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.buttonGap,
  },

  buttonPrimaryText: {
    ...textStyles.button,
    color: colors.textInverse,
  },

  // Secondary button
  buttonSecondary: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: layout.buttonPaddingHorizontal,
    paddingVertical: layout.buttonPaddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.buttonGap,
  },

  buttonSecondaryText: {
    ...textStyles.button,
    color: colors.primary,
  },

  // Outline button
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: layout.buttonPaddingHorizontal,
    paddingVertical: layout.buttonPaddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.buttonGap,
  },

  buttonOutlineText: {
    ...textStyles.button,
    color: colors.text,
  },

  // Ghost button (no background)
  buttonGhost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.buttonGap,
  },

  buttonGhostText: {
    ...textStyles.button,
    color: colors.primary,
  },

  // Destructive button
  buttonDestructive: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: layout.buttonPaddingHorizontal,
    paddingVertical: layout.buttonPaddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.buttonGap,
  },

  buttonDestructiveText: {
    ...textStyles.button,
    color: colors.textInverse,
  },

  // Disabled state
  buttonDisabled: {
    opacity: 0.5,
  },

  // Small button
  buttonSmall: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },

  buttonSmallText: {
    ...textStyles.buttonSmall,
  },
});

// Input styles
export const inputStyles = StyleSheet.create({
  // Container
  inputContainer: {
    marginBottom: spacing[4],
  },

  // Label
  inputLabel: {
    ...textStyles.label,
    color: colors.text,
    marginBottom: spacing[2],
  },

  // Input field
  input: {
    backgroundColor: colors.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: layout.inputPaddingHorizontal,
    paddingVertical: layout.inputPaddingVertical,
    ...textStyles.body,
    color: colors.text,
  },

  // Focused state
  inputFocused: {
    borderColor: colors.inputFocus,
    borderWidth: 2,
  },

  // Error state
  inputError: {
    borderColor: colors.error,
  },

  // Helper text
  inputHelper: {
    ...textStyles.caption,
    color: colors.textTertiary,
    marginTop: spacing[1],
  },

  // Error text
  inputErrorText: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing[1],
  },

  // Textarea
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

// List styles
export const listStyles = StyleSheet.create({
  // List container
  list: {
    gap: layout.itemGap,
  },

  // List item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    gap: spacing[3],
  },

  // List item with border
  listItemBordered: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },

  // List item content
  listItemContent: {
    flex: 1,
  },

  // List item title
  listItemTitle: {
    ...textStyles.body,
    color: colors.text,
  },

  // List item subtitle
  listItemSubtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing[0.5],
  },

  // List item trailing content
  listItemTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
});

// Badge styles
export const badgeStyles = StyleSheet.create({
  // Base badge
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },

  badgeText: {
    ...textStyles.caption,
    fontWeight: '600',
  },

  // Variants
  badgePrimary: {
    backgroundColor: colors.primaryLight,
  },
  badgePrimaryText: {
    color: colors.primary,
  },

  badgeSuccess: {
    backgroundColor: tints.green,
  },
  badgeSuccessText: {
    color: colors.success,
  },

  badgeWarning: {
    backgroundColor: tints.amber,
  },
  badgeWarningText: {
    color: colors.warning,
  },

  badgeError: {
    backgroundColor: tints.red,
  },
  badgeErrorText: {
    color: colors.error,
  },

  badgeInfo: {
    backgroundColor: tints.blue,
  },
  badgeInfoText: {
    color: colors.info,
  },
});

// Screen/Container styles
export const containerStyles = StyleSheet.create({
  // Full screen container
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },

  // Scrollable content
  scrollContent: {
    padding: layout.screenPaddingHorizontal,
    paddingBottom: spacing[10],
  },

  // Centered content
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.screenPaddingHorizontal,
  },

  // Section container
  section: {
    marginBottom: layout.sectionMarginBottom,
  },

  // Section title
  sectionTitle: {
    ...textStyles.overline,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },

  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Space between row
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Flex grow
  flex1: {
    flex: 1,
  },
});

// Modal styles
export const modalStyles = StyleSheet.create({
  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal content
  content: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: layout.modalPadding,
    width: '90%',
    maxWidth: 400,
    ...shadows.xl,
  },

  // Modal header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  // Modal title
  title: {
    ...textStyles.h3,
    color: colors.text,
  },

  // Modal body
  body: {
    marginBottom: spacing[6],
  },

  // Modal footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[3],
  },

  // Bottom sheet style
  bottomSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: layout.modalPadding,
    paddingTop: spacing[2],
  },

  // Bottom sheet handle
  bottomSheetHandle: {
    width: layout.bottomSheetHandleWidth,
    height: layout.bottomSheetHandle,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
});

// Stats/Metric styles
export const statStyles = StyleSheet.create({
  // Stat container
  stat: {
    alignItems: 'center',
    padding: spacing[3],
  },

  // Stat value
  statValue: {
    ...textStyles.metricLarge,
    color: colors.text,
  },

  // Stat label
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },

  // Stat row
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  // Stat divider
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});

// Empty state styles
export const emptyStateStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },

  icon: {
    marginBottom: spacing[4],
  },

  title: {
    ...textStyles.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[2],
  },

  description: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
});
