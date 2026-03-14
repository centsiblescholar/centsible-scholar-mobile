import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useStudent } from '../src/contexts/StudentContext';
import { useStudentGrades } from '../src/hooks/useStudentGrades';
import { useBehaviorBonus } from '../src/hooks/useBehaviorBonus';
import { useEducationBonus } from '../src/hooks/useEducationBonus';
import { useBudgetItems, BudgetItem } from '../src/hooks/useBudgetItems';
import { calculateAllocation } from '../src/shared/calculations';
import { useTheme, type ThemeColors } from '@/theme';

type Timeframe = 'weekly' | 'monthly';

const QUICK_ADD_CATEGORIES = [
  { label: 'Food', icon: 'fast-food-outline' as const, amount: 10 },
  { label: 'Entertainment', icon: 'film-outline' as const, amount: 15 },
  { label: 'Transport', icon: 'bus-outline' as const, amount: 5 },
  { label: 'Clothes', icon: 'shirt-outline' as const, amount: 20 },
  { label: 'Hobbies', icon: 'color-palette-outline' as const, amount: 10 },
  { label: 'Other', icon: 'ellipsis-horizontal-outline' as const, amount: 5 },
];

export default function BudgetPlannerScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectedStudent, isParentView } = useStudent();

  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;

  // Earnings data (to calculate available spending)
  const { totalReward, isLoading: gradesLoading, refetch: refetchGrades } = useStudentGrades(targetUserId);
  const { bonusAmount: educationBonusAmount, refetch: refetchEducation } = useEducationBonus(targetUserId, totalReward);
  const { bonusAmount: behaviorBonusAmount, refetch: refetchBehavior } = useBehaviorBonus(targetUserId, totalReward);

  // Budget items
  const {
    items, hasUnsavedChanges, totalBudgeted,
    addItem, removeItem, saveBudget, resetToSaved,
    isLoading: budgetLoading, isSaving, refetch: refetchBudget,
  } = useBudgetItems(targetUserId);

  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [customCategory, setCustomCategory] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const totalEarnings = totalReward + educationBonusAmount + behaviorBonusAmount;
  const allocation = calculateAllocation(totalEarnings);
  const availableSpending = timeframe === 'weekly'
    ? allocation.discretionary
    : allocation.discretionary * 4;

  const remaining = availableSpending - totalBudgeted;
  const percentUsed = availableSpending > 0 ? (totalBudgeted / availableSpending) * 100 : 0;
  const budgetStatus = remaining < 0 ? 'over' : percentUsed > 90 ? 'warning' : 'good';

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGrades(), refetchEducation(), refetchBehavior(), refetchBudget()]);
    setRefreshing(false);
  }, [refetchGrades, refetchEducation, refetchBehavior, refetchBudget]);

  const handleQuickAdd = (category: string, amount: number) => {
    addItem(category, amount, false);
  };

  const handleAddCustom = () => {
    if (!customCategory.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    addItem(customCategory.trim(), amount, false);
    setCustomCategory('');
    setCustomAmount('');
  };

  const handleSave = async () => {
    try {
      await saveBudget();
      Alert.alert('Saved', 'Your budget has been saved!');
    } catch {
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    }
  };

  const isLoading = gradesLoading || budgetLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading budget...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Spending Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Available to Spend</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(availableSpending)}</Text>
          <Text style={styles.summarySubtext}>
            50% of {formatCurrency(totalEarnings)} total earnings ({timeframe})
          </Text>

          {/* Weekly / Monthly Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, timeframe === 'weekly' && styles.toggleActive]}
              onPress={() => setTimeframe('weekly')}
            >
              <Text style={[styles.toggleText, timeframe === 'weekly' && styles.toggleActiveText]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, timeframe === 'monthly' && styles.toggleActive]}
              onPress={() => setTimeframe('monthly')}
            >
              <Text style={[styles.toggleText, timeframe === 'monthly' && styles.toggleActiveText]}>
                Monthly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Status Bar */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Budget Used</Text>
            <Text
              style={[
                styles.statusPercent,
                budgetStatus === 'over' && { color: colors.error },
                budgetStatus === 'warning' && { color: '#F59E0B' },
                budgetStatus === 'good' && { color: colors.success },
              ]}
            >
              {Math.min(percentUsed, 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(percentUsed, 100)}%` },
                budgetStatus === 'over' && { backgroundColor: colors.error },
                budgetStatus === 'warning' && { backgroundColor: '#F59E0B' },
                budgetStatus === 'good' && { backgroundColor: colors.success },
              ]}
            />
          </View>
          <View style={styles.statusFooter}>
            <Text style={styles.statusFooterText}>
              {formatCurrency(totalBudgeted)} budgeted
            </Text>
            <Text
              style={[
                styles.statusRemaining,
                remaining < 0 && { color: colors.error },
              ]}
            >
              {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`} remaining
            </Text>
          </View>
          {budgetStatus === 'over' && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.error} />
              <Text style={styles.warningText}>
                You've budgeted more than your available spending!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Add Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={styles.quickAddButton}
                onPress={() => handleQuickAdd(cat.label, cat.amount)}
              >
                <Ionicons name={cat.icon} size={22} color={colors.primary} />
                <Text style={styles.quickAddLabel}>{cat.label}</Text>
                <Text style={styles.quickAddAmount}>${cat.amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Item Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Custom Item</Text>
          <View style={styles.customForm}>
            <TextInput
              style={styles.categoryInput}
              placeholder="Category name"
              placeholderTextColor={colors.textTertiary}
              value={customCategory}
              onChangeText={setCustomCategory}
            />
            <View style={styles.amountRow}>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={handleAddCustom}>
                <Ionicons name="add" size={20} color={colors.textInverse} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Budget Items List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Budget</Text>
            <Text style={styles.itemCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
          </View>
          {items.length === 0 ? (
            <View style={styles.emptyBudget}>
              <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No budget items yet</Text>
              <Text style={styles.emptySubtext}>Use quick add or add a custom item above</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item) => (
                <BudgetItemRow
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  colors={colors}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Save Button */}
      {hasUnsavedChanges && (
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToSaved}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function BudgetItemRow({
  item,
  onRemove,
  colors,
}: {
  item: BudgetItem;
  onRemove: (id: string) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={rowStyles(colors).row}>
      <View style={rowStyles(colors).info}>
        <Text style={rowStyles(colors).category}>{item.category}</Text>
        {item.isRecurring && (
          <View style={rowStyles(colors).recurringBadge}>
            <Ionicons name="refresh-outline" size={10} color={colors.primary} />
            <Text style={rowStyles(colors).recurringText}>Recurring</Text>
          </View>
        )}
      </View>
      <Text style={rowStyles(colors).amount}>${item.amount.toFixed(2)}</Text>
      <TouchableOpacity
        style={rowStyles(colors).removeButton}
        onPress={() => onRemove(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.card,
      borderRadius: 10,
      marginBottom: 8,
    },
    info: { flex: 1 },
    category: { fontSize: 15, fontWeight: '500', color: colors.text },
    recurringBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 2,
    },
    recurringText: { fontSize: 11, color: colors.primary },
    amount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginRight: 12,
    },
    removeButton: { padding: 4 },
  });

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    contentContainer: { padding: 16 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },

    // Summary Card
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    summaryAmount: {
      fontSize: 40,
      fontWeight: '700',
      color: colors.success,
      marginVertical: 4,
    },
    summarySubtext: { fontSize: 13, color: colors.textTertiary },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      padding: 3,
      marginTop: 16,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
    },
    toggleActive: { backgroundColor: colors.card },
    toggleText: { fontSize: 14, fontWeight: '500', color: colors.textTertiary },
    toggleActiveText: { color: colors.primary, fontWeight: '600' },

    // Status
    statusCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusLabel: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    statusPercent: { fontSize: 16, fontWeight: '700' },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: { height: '100%', borderRadius: 4 },
    statusFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    statusFooterText: { fontSize: 12, color: colors.textTertiary },
    statusRemaining: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    warningText: { fontSize: 13, color: colors.error, flex: 1 },

    // Section
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    itemCount: { fontSize: 13, color: colors.textTertiary },

    // Quick Add
    quickAddGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    quickAddButton: {
      width: '31%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickAddLabel: { fontSize: 13, fontWeight: '500', color: colors.text },
    quickAddAmount: { fontSize: 12, color: colors.textTertiary },

    // Custom Form
    customForm: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      gap: 10,
    },
    categoryInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colors.text,
    },
    amountRow: { flexDirection: 'row', gap: 10 },
    amountInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
    },
    currencySymbol: { fontSize: 16, color: colors.textSecondary, marginRight: 4 },
    amountInput: { flex: 1, padding: 12, paddingLeft: 0, fontSize: 15, color: colors.text },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      borderRadius: 10,
      justifyContent: 'center',
    },
    addButtonText: { fontSize: 15, fontWeight: '600', color: colors.textInverse },

    // Empty State
    emptyBudget: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 32,
      alignItems: 'center',
      gap: 8,
    },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
    emptySubtext: { fontSize: 13, color: colors.textTertiary },

    // Items List
    itemsList: {},

    // Save
    saveContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    resetButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    resetButtonText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
    saveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.success,
      paddingVertical: 14,
      borderRadius: 12,
    },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  });
