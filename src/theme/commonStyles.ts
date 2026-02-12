/**
 * Common Style Patterns
 * Reusable style objects for consistent UI across the app
 *
 * New code should use: createCommonStyles(colors) from useTheme()
 * Static exports are kept for backward compatibility during migration.
 */

import { StyleSheet } from 'react-native';
import { colors as staticColors, tints, type ThemeColors } from './colors';
import { textStyles } from './typography';
import { spacing, layout, borderRadius, shadows } from './spacing';

/**
 * Factory function to create themed common styles.
 * Use with useTheme():
 *   const { colors } = useTheme();
 *   const common = createCommonStyles(colors);
 */
export function createCommonStyles(themeColors: ThemeColors) {
  const cardStyles = StyleSheet.create({
    card: {
      backgroundColor: themeColors.card,
      borderRadius: borderRadius.lg,
      padding: layout.cardPadding,
      ...shadows.md,
    },
    cardOutline: {
      backgroundColor: themeColors.card,
      borderRadius: borderRadius.lg,
      padding: layout.cardPadding,
      borderWidth: 1,
      borderColor: themeColors.cardBorder,
    },
    cardCompact: {
      backgroundColor: themeColors.card,
      borderRadius: borderRadius.md,
      padding: spacing[3],
      ...shadows.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    cardTitle: {
      ...textStyles.h3,
      color: themeColors.text,
    },
    cardDescription: {
      ...textStyles.bodySmall,
      color: themeColors.textSecondary,
      marginTop: spacing[1],
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: spacing[4],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
  });

  const buttonStyles = StyleSheet.create({
    buttonPrimary: {
      backgroundColor: themeColors.primary,
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
      color: themeColors.textInverse,
    },
    buttonSecondary: {
      backgroundColor: themeColors.primaryLight,
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
      color: themeColors.primary,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingHorizontal: layout.buttonPaddingHorizontal,
      paddingVertical: layout.buttonPaddingVertical,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: layout.buttonGap,
    },
    buttonOutlineText: {
      ...textStyles.button,
      color: themeColors.text,
    },
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
      color: themeColors.primary,
    },
    buttonDestructive: {
      backgroundColor: themeColors.error,
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
      color: themeColors.textInverse,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonSmall: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    buttonSmallText: {
      ...textStyles.buttonSmall,
    },
  });

  const inputStyles = StyleSheet.create({
    inputContainer: {
      marginBottom: spacing[4],
    },
    inputLabel: {
      ...textStyles.label,
      color: themeColors.text,
      marginBottom: spacing[2],
    },
    input: {
      backgroundColor: themeColors.input,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: themeColors.inputBorder,
      paddingHorizontal: layout.inputPaddingHorizontal,
      paddingVertical: layout.inputPaddingVertical,
      ...textStyles.body,
      color: themeColors.text,
    },
    inputFocused: {
      borderColor: themeColors.inputFocus,
      borderWidth: 2,
    },
    inputError: {
      borderColor: themeColors.error,
    },
    inputHelper: {
      ...textStyles.caption,
      color: themeColors.textTertiary,
      marginTop: spacing[1],
    },
    inputErrorText: {
      ...textStyles.caption,
      color: themeColors.error,
      marginTop: spacing[1],
    },
    textarea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
  });

  const listStyles = StyleSheet.create({
    list: {
      gap: layout.itemGap,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing[3],
      backgroundColor: themeColors.card,
      borderRadius: borderRadius.md,
      gap: spacing[3],
    },
    listItemBordered: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      gap: spacing[3],
    },
    listItemContent: {
      flex: 1,
    },
    listItemTitle: {
      ...textStyles.body,
      color: themeColors.text,
    },
    listItemSubtitle: {
      ...textStyles.bodySmall,
      color: themeColors.textSecondary,
      marginTop: spacing[0.5],
    },
    listItemTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
  });

  const badgeStyles = StyleSheet.create({
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
    badgePrimary: {
      backgroundColor: themeColors.primaryLight,
    },
    badgePrimaryText: {
      color: themeColors.primary,
    },
    badgeSuccess: {
      backgroundColor: tints.green,
    },
    badgeSuccessText: {
      color: themeColors.success,
    },
    badgeWarning: {
      backgroundColor: tints.amber,
    },
    badgeWarningText: {
      color: themeColors.warning,
    },
    badgeError: {
      backgroundColor: tints.red,
    },
    badgeErrorText: {
      color: themeColors.error,
    },
    badgeInfo: {
      backgroundColor: tints.blue,
    },
    badgeInfoText: {
      color: themeColors.info,
    },
  });

  const containerStyles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: themeColors.backgroundSecondary,
    },
    scrollContent: {
      padding: layout.screenPaddingHorizontal,
      paddingBottom: spacing[10],
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: layout.screenPaddingHorizontal,
    },
    section: {
      marginBottom: layout.sectionMarginBottom,
    },
    sectionTitle: {
      ...textStyles.overline,
      color: themeColors.textSecondary,
      marginBottom: spacing[3],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    flex1: {
      flex: 1,
    },
  });

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      backgroundColor: themeColors.card,
      borderRadius: borderRadius.xl,
      padding: layout.modalPadding,
      width: '90%',
      maxWidth: 400,
      ...shadows.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[4],
    },
    title: {
      ...textStyles.h3,
      color: themeColors.text,
    },
    body: {
      marginBottom: spacing[6],
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing[3],
    },
    bottomSheet: {
      backgroundColor: themeColors.card,
      borderTopLeftRadius: borderRadius['2xl'],
      borderTopRightRadius: borderRadius['2xl'],
      padding: layout.modalPadding,
      paddingTop: spacing[2],
    },
    bottomSheetHandle: {
      width: layout.bottomSheetHandleWidth,
      height: layout.bottomSheetHandle,
      backgroundColor: themeColors.border,
      borderRadius: borderRadius.full,
      alignSelf: 'center',
      marginBottom: spacing[4],
    },
  });

  const statStyles = StyleSheet.create({
    stat: {
      alignItems: 'center',
      padding: spacing[3],
    },
    statValue: {
      ...textStyles.metricLarge,
      color: themeColors.text,
    },
    statLabel: {
      ...textStyles.caption,
      color: themeColors.textSecondary,
      marginTop: spacing[1],
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statDivider: {
      width: 1,
      backgroundColor: themeColors.border,
    },
  });

  const emptyStateStyles = StyleSheet.create({
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
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: spacing[2],
    },
    description: {
      ...textStyles.body,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing[6],
    },
  });

  return {
    cardStyles,
    buttonStyles,
    inputStyles,
    listStyles,
    badgeStyles,
    containerStyles,
    modalStyles,
    statStyles,
    emptyStateStyles,
  };
}

// DEPRECATED: Static exports for backward compatibility during migration.
// Use createCommonStyles(colors) from useTheme() instead.
const _static = createCommonStyles(staticColors);

export const cardStyles = _static.cardStyles;
export const buttonStyles = _static.buttonStyles;
export const inputStyles = _static.inputStyles;
export const listStyles = _static.listStyles;
export const badgeStyles = _static.badgeStyles;
export const containerStyles = _static.containerStyles;
export const modalStyles = _static.modalStyles;
export const statStyles = _static.statStyles;
export const emptyStateStyles = _static.emptyStateStyles;
