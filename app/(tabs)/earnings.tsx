import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions,
  TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useStudentGrades } from '../../src/hooks/useStudentGrades';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { useEducationBonus } from '../../src/hooks/useEducationBonus';
import { useBehaviorBonus } from '../../src/hooks/useBehaviorBonus';
import { useSavingsGoals, GOAL_EMOJIS } from '../../src/hooks/useSavingsGoals';
import { useExternalSavings } from '../../src/hooks/useExternalSavings';
import { calculateAllocation } from '../../src/shared/calculations';
import { useTheme, type ThemeColors, indigo, tints } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const screenWidth = Dimensions.get('window').width;

export default function EarningsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectedStudent, isParentView } = useStudent();
  const [refreshing, setRefreshing] = useState(false);

  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const studentProfileId = isParentView ? selectedStudent?.id : undefined;

  const { gradeEntries, totalReward, isLoading: gradesLoading, error: gradesError, refetch: refetchGrades } = useStudentGrades(targetUserId);
  const { assessments, isLoading: behaviorLoading, refetch: refetchBehavior } = useBehaviorAssessments(targetUserId);
  const { bonusAmount: educationBonusAmount, accuracyPercentage, isLoading: educationLoading, refetch: refetchEducation } = useEducationBonus(targetUserId, totalReward);
  const { bonusAmount: behaviorBonusAmount, averageScore, isLoading: behaviorBonusLoading, refetch: refetchBehaviorBonus } = useBehaviorBonus(targetUserId, totalReward);
  const {
    goals, completedGoals, addGoal, addToGoal, completeGoal, deleteGoal,
    allocateSavings, moveFunds, totalSaved, totalTarget,
    isLoading: goalsLoading, refetch: refetchGoals, refetchCompleted,
  } = useSavingsGoals(targetUserId);
  const {
    externalSavings, updateExternalSavings, isLoading: extSavingsLoading, refetch: refetchExtSavings,
  } = useExternalSavings(targetUserId);

  // Modal states
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [addFundsModalVisible, setAddFundsModalVisible] = useState(false);
  const [allocateModalVisible, setAllocateModalVisible] = useState(false);
  const [moveFundsModalVisible, setMoveFundsModalVisible] = useState(false);
  const [editExternalVisible, setEditExternalVisible] = useState(false);
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);

  // Form states
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalEmoji, setNewGoalEmoji] = useState('🎯');
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [allocateAmount, setAllocateAmount] = useState('');
  const [moveFromGoalId, setMoveFromGoalId] = useState<string | null>(null);
  const [moveToGoalId, setMoveToGoalId] = useState<string | null>(null);
  const [moveAmount, setMoveAmount] = useState('');
  const [externalAmount, setExternalAmount] = useState('');

  // Loading states
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isSavingExternal, setIsSavingExternal] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGrades(), refetchBehavior(), refetchEducation(),
      refetchBehaviorBonus(), refetchGoals(), refetchCompleted(), refetchExtSavings(),
    ]);
    setRefreshing(false);
  }, [refetchGrades, refetchBehavior, refetchEducation, refetchBehaviorBonus, refetchGoals, refetchCompleted, refetchExtSavings]);

  const isLoading = gradesLoading || behaviorLoading || educationLoading || behaviorBonusLoading || goalsLoading || extSavingsLoading;

  // --- Handlers ---
  const handleAddGoal = async () => {
    if (!newGoalName.trim()) { Alert.alert('Error', 'Please enter a goal name'); return; }
    const amount = parseFloat(newGoalAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Please enter a valid target amount'); return; }
    setIsAddingGoal(true);
    try {
      await addGoal(newGoalName.trim(), amount, newGoalEmoji);
      setGoalModalVisible(false);
      setNewGoalName('');
      setNewGoalAmount('');
      setNewGoalEmoji('🎯');
    } catch { Alert.alert('Error', 'Failed to create goal'); }
    finally { setIsAddingGoal(false); }
  };

  const handleAddFunds = async () => {
    if (!selectedGoalId) return;
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    setIsAddingFunds(true);
    try {
      await addToGoal(selectedGoalId, amount);
      setAddFundsModalVisible(false);
      setAddFundsAmount('');
      setSelectedGoalId(null);
    } catch { Alert.alert('Error', 'Failed to add funds'); }
    finally { setIsAddingFunds(false); }
  };

  const handleCompleteGoal = (goalId: string, goalName: string) => {
    Alert.alert('Complete Goal', `Mark "${goalName}" as complete?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        try { await completeGoal(goalId); } catch { Alert.alert('Error', 'Failed to complete goal'); }
      }},
    ]);
  };

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goalId) },
    ]);
  };

  const handleAllocateSavings = async () => {
    const amount = parseFloat(allocateAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    const activeGoalIds = goals.filter(g => g.currentAmount < g.targetAmount).map(g => g.id);
    if (activeGoalIds.length === 0) { Alert.alert('Error', 'No active goals to allocate to'); return; }
    setIsAllocating(true);
    try {
      await allocateSavings(amount, activeGoalIds);
      setAllocateModalVisible(false);
      setAllocateAmount('');
    } catch { Alert.alert('Error', 'Failed to allocate savings'); }
    finally { setIsAllocating(false); }
  };

  const handleMoveFunds = async () => {
    if (!moveFromGoalId || !moveToGoalId) { Alert.alert('Error', 'Please select both goals'); return; }
    if (moveFromGoalId === moveToGoalId) { Alert.alert('Error', 'Cannot move funds to the same goal'); return; }
    const amount = parseFloat(moveAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    setIsMoving(true);
    try {
      await moveFunds(moveFromGoalId, moveToGoalId, amount);
      setMoveFundsModalVisible(false);
      setMoveFromGoalId(null);
      setMoveToGoalId(null);
      setMoveAmount('');
    } catch { Alert.alert('Error', 'Failed to move funds'); }
    finally { setIsMoving(false); }
  };

  const handleSaveExternal = async () => {
    const amount = parseFloat(externalAmount);
    if (isNaN(amount) || amount < 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    setIsSavingExternal(true);
    try {
      await updateExternalSavings(amount);
      setEditExternalVisible(false);
      setExternalAmount('');
    } catch { Alert.alert('Error', 'Failed to update external savings'); }
    finally { setIsSavingExternal(false); }
  };

  // --- Computed values ---
  const totalBonuses = educationBonusAmount + behaviorBonusAmount;
  const totalEarnings = totalReward + totalBonuses;
  const allocation = calculateAllocation(totalEarnings);
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const unallocatedSavings = Math.max(0, allocation.savings - totalSaved);

  const allocationChartData = [
    { name: 'Taxes', amount: allocation.taxQualified.taxes, color: colors.error, legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Retirement', amount: allocation.taxQualified.retirement, color: '#8B5CF6', legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Savings', amount: allocation.savings, color: colors.info, legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Spending', amount: allocation.discretionary, color: colors.success, legendFontColor: colors.text, legendFontSize: 12 },
  ];
  const incomeChartData = [
    { name: 'Grades', amount: totalReward, color: colors.primary, legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Behavior', amount: behaviorBonusAmount, color: colors.warning, legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Education', amount: educationBonusAmount, color: '#06B6D4', legendFontColor: colors.text, legendFontSize: 12 },
  ].filter(item => item.amount > 0);

  if (isLoading && !refreshing) {
    return <View style={styles.loadingContainer}><SkeletonList count={4} cardHeight={100} /></View>;
  }

  if (gradesError) {
    return <View style={styles.container}><ErrorState message={gradesError.message || 'Failed to load earnings'} onRetry={() => refetchGrades()} /></View>;
  }

  if (totalEarnings === 0 && goals.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <EmptyState icon="wallet-outline" title="No Earnings Yet" description="Earnings will appear once grades are entered." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings Summary</Text>
          <Text style={styles.headerSubtitle}>{selectedStudent?.name || 'Student'}'s Financial Overview</Text>
        </View>
      </SafeAreaView>
      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalEarnings)}</Text>
        <View style={styles.totalBreakdown}>
          <View style={styles.breakdownItem}><Text style={styles.breakdownLabel}>Grades</Text><Text style={styles.breakdownValue}>{formatCurrency(totalReward)}</Text></View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}><Text style={styles.breakdownLabel}>Bonuses</Text><Text style={[styles.breakdownValue, { color: colors.success }]}>+{formatCurrency(totalBonuses)}</Text></View>
        </View>
      </View>

      {/* Income Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Income Sources</Text>
        <View style={styles.card}>
          {incomeChartData.length > 0 ? (
            <PieChart data={incomeChartData} width={screenWidth - 64} height={180} chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }} accessor="amount" backgroundColor="transparent" paddingLeft="15" absolute />
          ) : (<Text style={styles.noDataText}>No earnings yet</Text>)}
          <View style={styles.incomeDetails}>
            <View style={styles.incomeRow}><View style={styles.incomeIndicator}><View style={[styles.indicatorDot, { backgroundColor: colors.primary }]} /><Text style={styles.incomeLabel}>Grade Rewards</Text></View><Text style={styles.incomeAmount}>{formatCurrency(totalReward)}</Text></View>
            <Text style={styles.incomeSubtext}>{gradeEntries.length} grade{gradeEntries.length !== 1 ? 's' : ''} submitted</Text>
            <View style={[styles.incomeRow, { marginTop: 12 }]}><View style={styles.incomeIndicator}><View style={[styles.indicatorDot, { backgroundColor: colors.warning }]} /><Text style={styles.incomeLabel}>Behavior Bonus</Text></View><Text style={styles.incomeAmount}>{formatCurrency(behaviorBonusAmount)}</Text></View>
            <Text style={styles.incomeSubtext}>{assessments.length > 0 ? `${averageScore.toFixed(2)} avg score` : 'No assessments yet'}</Text>
            <View style={[styles.incomeRow, { marginTop: 12 }]}><View style={styles.incomeIndicator}><View style={[styles.indicatorDot, { backgroundColor: '#06B6D4' }]} /><Text style={styles.incomeLabel}>Education Bonus</Text></View><Text style={styles.incomeAmount}>{formatCurrency(educationBonusAmount)}</Text></View>
            <Text style={styles.incomeSubtext}>{accuracyPercentage}% QOD accuracy</Text>
          </View>
        </View>
      </View>

      {/* Paycheck Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paycheck Breakdown</Text>
        <View style={styles.card}>
          {totalEarnings > 0 ? (
            <PieChart data={allocationChartData} width={screenWidth - 64} height={180} chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }} accessor="amount" backgroundColor="transparent" paddingLeft="15" absolute />
          ) : (<Text style={styles.noDataText}>No earnings to allocate</Text>)}
          <View style={styles.allocationDetails}>
            {[{ label: 'Taxes', pct: '15%', amount: allocation.taxQualified.taxes, dotColor: colors.error },
              { label: 'Retirement (529)', pct: '10%', amount: allocation.taxQualified.retirement, dotColor: '#8B5CF6' },
              { label: 'Savings', pct: '25%', amount: allocation.savings, dotColor: colors.info },
              { label: 'Discretionary', pct: '50%', amount: allocation.discretionary, dotColor: colors.success },
            ].map((item) => (
              <View key={item.label} style={styles.allocationRow}>
                <View style={styles.allocationLeft}><View style={[styles.indicatorDot, { backgroundColor: item.dotColor }]} /><View><Text style={styles.allocationLabel}>{item.label}</Text><Text style={styles.allocationPercent}>{item.pct}</Text></View></View>
                <Text style={[styles.allocationAmount, item.label === 'Discretionary' && { color: colors.success }]}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Budget Planner CTA */}
          {allocation.discretionary > 0 && (
            <TouchableOpacity
              style={styles.budgetPlannerCta}
              onPress={() => router.push('/budget-planner')}
            >
              <View style={styles.budgetPlannerCtaLeft}>
                <Ionicons name="calculator-outline" size={20} color={colors.success} />
                <View>
                  <Text style={styles.budgetPlannerCtaTitle}>Plan Your Spending</Text>
                  <Text style={styles.budgetPlannerCtaSubtext}>
                    Budget your {formatCurrency(allocation.discretionary)} discretionary
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* External Savings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>External Savings</Text>
        <View style={styles.externalCard}>
          <View style={styles.externalHeader}>
            <View>
              <Text style={styles.externalLabel}>Outside Money</Text>
              <Text style={styles.externalSubtext}>Birthday gifts, allowances, etc.</Text>
            </View>
            <Text style={styles.externalAmount}>{formatCurrency(externalSavings)}</Text>
          </View>
          {isParentView && (
            <TouchableOpacity
              style={styles.editExternalButton}
              onPress={() => { setExternalAmount(externalSavings.toFixed(2)); setEditExternalVisible(true); }}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={styles.editExternalText}>Update Amount</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Savings Goals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <TouchableOpacity style={styles.addGoalButton} onPress={() => setGoalModalVisible(true)}>
            <Text style={styles.addGoalButtonText}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Unallocated savings info */}
        {unallocatedSavings > 0 && goals.length > 0 && (
          <View style={styles.unallocatedBanner}>
            <View style={styles.unallocatedLeft}>
              <Ionicons name="wallet-outline" size={16} color={colors.info} />
              <Text style={styles.unallocatedText}>
                {formatCurrency(unallocatedSavings)} unallocated savings
              </Text>
            </View>
            <TouchableOpacity
              style={styles.allocateButton}
              onPress={() => { setAllocateAmount(unallocatedSavings.toFixed(2)); setAllocateModalVisible(true); }}
            >
              <Text style={styles.allocateButtonText}>Allocate</Text>
            </TouchableOpacity>
          </View>
        )}

        {goals.length === 0 ? (
          <EmptyState icon="flag-outline" title="No Savings Goals Yet" description="Set a goal to save for something special!" />
        ) : (
          <View style={styles.goalsContainer}>
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const isComplete = goal.currentAmount >= goal.targetAmount;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalProgress}>
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteGoal(goal.id, goal.name)} style={styles.goalDeleteButton}>
                      <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.goalProgressBarBg}>
                    <View style={[styles.goalProgressBar, { width: `${Math.min(progress, 100)}%`, backgroundColor: isComplete ? colors.success : goal.color }]} />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={[styles.goalPercentage, isComplete && { color: colors.success }]}>
                      {isComplete ? 'Goal Reached!' : `${progress.toFixed(0)}%`}
                    </Text>
                    <View style={styles.goalActions}>
                      {isComplete ? (
                        <TouchableOpacity
                          style={styles.completeGoalButton}
                          onPress={() => handleCompleteGoal(goal.id, goal.name)}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                          <Text style={styles.completeGoalText}>Complete</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.addFundsButton}
                          onPress={() => { setSelectedGoalId(goal.id); setAddFundsModalVisible(true); }}
                        >
                          <Text style={styles.addFundsButtonText}>Add Funds</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Goal action buttons */}
            {goals.length > 1 && (
              <TouchableOpacity
                style={styles.moveFundsLink}
                onPress={() => setMoveFundsModalVisible(true)}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary} />
                <Text style={styles.moveFundsLinkText}>Move Funds Between Goals</Text>
              </TouchableOpacity>
            )}

            {goals.length > 0 && (
              <View style={styles.goalsSummary}>
                <Text style={styles.goalsSummaryText}>
                  Total Saved: {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.completedSection}>
            <TouchableOpacity
              style={styles.completedToggle}
              onPress={() => setShowCompletedGoals(!showCompletedGoals)}
            >
              <Text style={styles.completedToggleText}>
                Completed Goals ({completedGoals.length})
              </Text>
              <Ionicons
                name={showCompletedGoals ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
            {showCompletedGoals && (
              <View style={styles.completedList}>
                {completedGoals.map((goal) => (
                  <View key={goal.id} style={styles.completedGoalRow}>
                    <Text style={styles.completedGoalEmoji}>{goal.emoji}</Text>
                    <View style={styles.completedGoalInfo}>
                      <Text style={styles.completedGoalName}>{goal.name}</Text>
                      <Text style={styles.completedGoalAmount}>{formatCurrency(goal.targetAmount)}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Financial Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Build Good Habits Early</Text>
            <Text style={styles.tipText}>By saving 25% of your earnings now, you're building wealth habits that will serve you for life!</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* New Goal Modal with Emoji Picker */}
      <Modal visible={goalModalVisible} transparent animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalOverlay} onPress={() => setGoalModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New Savings Goal</Text>

            {/* Emoji Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Choose an Icon</Text>
              <View style={styles.selectedEmojiRow}>
                <Text style={styles.selectedEmoji}>{newGoalEmoji}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
                <View style={styles.emojiGrid}>
                  {Object.entries(GOAL_EMOJIS).map(([category, emojis]) => (
                    <View key={category} style={styles.emojiCategory}>
                      <Text style={styles.emojiCategoryLabel}>{category}</Text>
                      <View style={styles.emojiRow}>
                        {emojis.map((emoji) => (
                          <TouchableOpacity
                            key={emoji}
                            style={[styles.emojiButton, newGoalEmoji === emoji && styles.emojiButtonSelected]}
                            onPress={() => setNewGoalEmoji(emoji)}
                          >
                            <Text style={styles.emojiText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput style={styles.input} placeholder="e.g., New Video Game, Bike" placeholderTextColor={colors.textTertiary} value={newGoalName} onChangeText={setNewGoalName} maxLength={100} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.currencyInput} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={newGoalAmount} onChangeText={setNewGoalAmount} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setGoalModalVisible(false); setNewGoalName(''); setNewGoalAmount(''); setNewGoalEmoji('🎯'); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitButton, isAddingGoal && { opacity: 0.7 }]} onPress={handleAddGoal} disabled={isAddingGoal}>
                {isAddingGoal ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalSubmitText}>Create Goal</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Funds Modal */}
      <Modal visible={addFundsModalVisible} transparent animationType="slide" onRequestClose={() => setAddFundsModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddFundsModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add Funds to Goal</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount to Add</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.currencyInput} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={addFundsAmount} onChangeText={setAddFundsAmount} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setAddFundsModalVisible(false); setAddFundsAmount(''); setSelectedGoalId(null); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitButton, isAddingFunds && { opacity: 0.7 }]} onPress={handleAddFunds} disabled={isAddingFunds}>
                {isAddingFunds ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalSubmitText}>Add Funds</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Allocate Savings Modal */}
      <Modal visible={allocateModalVisible} transparent animationType="slide" onRequestClose={() => setAllocateModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalOverlay} onPress={() => setAllocateModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Allocate Savings</Text>
            <Text style={styles.modalDescription}>
              Split evenly across all active goals ({goals.filter(g => g.currentAmount < g.targetAmount).length} goals)
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Amount to Allocate</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.currencyInput} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={allocateAmount} onChangeText={setAllocateAmount} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setAllocateModalVisible(false); setAllocateAmount(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitButton, isAllocating && { opacity: 0.7 }]} onPress={handleAllocateSavings} disabled={isAllocating}>
                {isAllocating ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalSubmitText}>Allocate</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Move Funds Modal */}
      <Modal visible={moveFundsModalVisible} transparent animationType="slide" onRequestClose={() => setMoveFundsModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalOverlay} onPress={() => setMoveFundsModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Move Funds</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>From Goal</Text>
              <View style={styles.goalPickerContainer}>
                {goals.filter(g => g.currentAmount > 0).map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalPickerItem, moveFromGoalId === goal.id && styles.goalPickerSelected]}
                    onPress={() => setMoveFromGoalId(goal.id)}
                  >
                    <Text style={styles.goalPickerEmoji}>{goal.emoji}</Text>
                    <Text style={[styles.goalPickerName, moveFromGoalId === goal.id && { color: colors.primary }]} numberOfLines={1}>{goal.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>To Goal</Text>
              <View style={styles.goalPickerContainer}>
                {goals.filter(g => g.id !== moveFromGoalId).map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalPickerItem, moveToGoalId === goal.id && styles.goalPickerSelected]}
                    onPress={() => setMoveToGoalId(goal.id)}
                  >
                    <Text style={styles.goalPickerEmoji}>{goal.emoji}</Text>
                    <Text style={[styles.goalPickerName, moveToGoalId === goal.id && { color: colors.primary }]} numberOfLines={1}>{goal.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.currencyInput} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={moveAmount} onChangeText={setMoveAmount} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setMoveFundsModalVisible(false); setMoveFromGoalId(null); setMoveToGoalId(null); setMoveAmount(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitButton, isMoving && { opacity: 0.7 }]} onPress={handleMoveFunds} disabled={isMoving}>
                {isMoving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalSubmitText}>Move</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit External Savings Modal */}
      <Modal visible={editExternalVisible} transparent animationType="slide" onRequestClose={() => setEditExternalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditExternalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Update External Savings</Text>
            <Text style={styles.modalDescription}>Track money from outside the app (birthday gifts, allowances, etc.)</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total External Savings</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput style={styles.currencyInput} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={externalAmount} onChangeText={setExternalAmount} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setEditExternalVisible(false); setExternalAmount(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitButton, isSavingExternal && { opacity: 0.7 }]} onPress={handleSaveExternal} disabled={isSavingExternal}>
                {isSavingExternal ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalSubmitText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary, padding: 16 },
  header: { backgroundColor: colors.primary, padding: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textInverse },
  headerSubtitle: { fontSize: 14, color: indigo[200], marginTop: 4 },
  totalCard: { margin: 16, backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  totalLabel: { fontSize: 14, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600' },
  totalValue: { fontSize: 48, fontWeight: 'bold', color: colors.text, marginTop: 8 },
  totalBreakdown: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border, width: '100%' },
  breakdownItem: { flex: 1, alignItems: 'center' },
  breakdownDivider: { width: 1, backgroundColor: colors.border },
  breakdownLabel: { fontSize: 12, color: colors.textSecondary },
  breakdownValue: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 4 },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  noDataText: { textAlign: 'center', color: colors.textTertiary, fontSize: 14, paddingVertical: 40 },
  incomeDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  incomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  incomeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  indicatorDot: { width: 12, height: 12, borderRadius: 6 },
  incomeLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  incomeAmount: { fontSize: 16, fontWeight: '600', color: colors.text },
  incomeSubtext: { fontSize: 12, color: colors.textTertiary, marginLeft: 20, marginTop: 2 },
  allocationDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 16 },
  allocationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allocationLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  allocationLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  allocationPercent: { fontSize: 12, color: colors.textTertiary },
  allocationAmount: { fontSize: 16, fontWeight: '600', color: colors.text },

  // Budget Planner CTA
  budgetPlannerCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border,
  },
  budgetPlannerCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetPlannerCtaTitle: { fontSize: 15, fontWeight: '600', color: colors.success },
  budgetPlannerCtaSubtext: { fontSize: 12, color: colors.textTertiary },

  // External Savings
  externalCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  externalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  externalLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  externalSubtext: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  externalAmount: { fontSize: 24, fontWeight: '700', color: colors.primary },
  editExternalButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
    justifyContent: 'center',
  },
  editExternalText: { fontSize: 14, fontWeight: '500', color: colors.primary },

  // Savings Goals
  tipCard: { backgroundColor: tints.amber, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tipEmoji: { fontSize: 24 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 4 },
  tipText: { fontSize: 14, color: '#B45309', lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addGoalButton: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  addGoalButtonText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  // Unallocated savings
  unallocatedBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  unallocatedLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unallocatedText: { fontSize: 13, fontWeight: '500', color: '#1E40AF' },
  allocateButton: { backgroundColor: colors.info, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  allocateButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  goalsContainer: { gap: 12 },
  goalCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalEmoji: { fontSize: 28, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 16, fontWeight: '600', color: colors.text },
  goalProgress: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  goalDeleteButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  goalProgressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  goalProgressBar: { height: '100%', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  goalPercentage: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  goalActions: { flexDirection: 'row', gap: 8 },
  addFundsButton: { backgroundColor: colors.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, minHeight: 44, justifyContent: 'center' },
  addFundsButtonText: { fontSize: 12, fontWeight: '500', color: colors.text },
  completeGoalButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, minHeight: 44, justifyContent: 'center',
  },
  completeGoalText: { fontSize: 12, fontWeight: '600', color: colors.success },

  moveFundsLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8,
  },
  moveFundsLinkText: { fontSize: 13, fontWeight: '500', color: colors.primary },

  goalsSummary: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: 12, alignItems: 'center' },
  goalsSummaryText: { fontSize: 14, fontWeight: '500', color: colors.text },

  // Completed Goals
  completedSection: { marginTop: 12 },
  completedToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 4,
  },
  completedToggleText: { fontSize: 14, fontWeight: '500', color: colors.textTertiary },
  completedList: { gap: 8, marginTop: 4 },
  completedGoalRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10, padding: 12, gap: 10,
    opacity: 0.7,
  },
  completedGoalEmoji: { fontSize: 20 },
  completedGoalInfo: { flex: 1 },
  completedGoalName: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  completedGoalAmount: { fontSize: 12, color: colors.textTertiary },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  modalDescription: { fontSize: 13, color: colors.textTertiary, marginBottom: 16, lineHeight: 18 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.borderDark, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
  currencyInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.borderDark, borderRadius: 8, paddingHorizontal: 12 },
  currencySymbol: { fontSize: 16, color: colors.textSecondary, marginRight: 4 },
  currencyInput: { flex: 1, padding: 12, paddingLeft: 0, fontSize: 16, color: colors.text },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelButton: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.borderDark, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  modalCancelText: { fontSize: 16, color: colors.textSecondary },
  modalSubmitButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  modalSubmitText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },

  // Emoji Picker
  selectedEmojiRow: { alignItems: 'center', marginBottom: 10 },
  selectedEmoji: { fontSize: 40 },
  emojiScroll: { maxHeight: 120 },
  emojiGrid: { flexDirection: 'row', gap: 16, paddingVertical: 4 },
  emojiCategory: { gap: 4 },
  emojiCategoryLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase' },
  emojiRow: { flexDirection: 'row', gap: 4 },
  emojiButton: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary },
  emojiButtonSelected: { backgroundColor: colors.primaryLight, borderWidth: 2, borderColor: colors.primary },
  emojiText: { fontSize: 20 },

  // Goal Picker (Move Funds)
  goalPickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalPickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSecondary,
  },
  goalPickerSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  goalPickerEmoji: { fontSize: 16 },
  goalPickerName: { fontSize: 13, fontWeight: '500', color: colors.text, maxWidth: 100 },
});
