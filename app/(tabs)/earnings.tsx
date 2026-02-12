import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useStudentGrades } from '../../src/hooks/useStudentGrades';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { useEducationBonus } from '../../src/hooks/useEducationBonus';
import { useBehaviorBonus } from '../../src/hooks/useBehaviorBonus';
import { useSavingsGoals } from '../../src/hooks/useSavingsGoals';
import { calculateAllocation } from '../../src/shared/calculations';
import { useTheme, type ThemeColors, indigo, tints } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const screenWidth = Dimensions.get('window').width;

export default function EarningsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectedStudent, isParentView } = useStudent();
  const [refreshing, setRefreshing] = useState(false);

  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const profileId = isParentView ? selectedStudent?.id : undefined;
  const baseRewardAmount = selectedStudent?.base_reward_amount || 0;

  const { gradeEntries, totalReward, isLoading: gradesLoading, error: gradesError, refetch: refetchGrades } = useStudentGrades(targetUserId, profileId);
  const { assessments, isLoading: behaviorLoading, refetch: refetchBehavior } = useBehaviorAssessments(targetUserId);
  const { bonusAmount: educationBonusAmount, accuracyPercentage, isLoading: educationLoading, refetch: refetchEducation } = useEducationBonus(targetUserId, baseRewardAmount);
  const { bonusAmount: behaviorBonusAmount, averageScore, isLoading: behaviorBonusLoading, refetch: refetchBehaviorBonus } = useBehaviorBonus(targetUserId, baseRewardAmount);
  const { goals, addGoal, addToGoal, deleteGoal, totalSaved, totalTarget, isLoading: goalsLoading, refetch: refetchGoals } = useSavingsGoals(targetUserId);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [addFundsModalVisible, setAddFundsModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGrades(), refetchBehavior(), refetchEducation(), refetchBehaviorBonus(), refetchGoals()]);
    setRefreshing(false);
  }, [refetchGrades, refetchBehavior, refetchEducation, refetchBehaviorBonus, refetchGoals]);

  const isLoading = gradesLoading || behaviorLoading || educationLoading || behaviorBonusLoading || goalsLoading;

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) { Alert.alert('Error', 'Please enter a goal name'); return; }
    const amount = parseFloat(newGoalAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Please enter a valid target amount'); return; }
    try { await addGoal(newGoalName.trim(), amount); setGoalModalVisible(false); setNewGoalName(''); setNewGoalAmount(''); } catch { Alert.alert('Error', 'Failed to create goal'); }
  };

  const handleAddFunds = async () => {
    if (!selectedGoalId) return;
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    try { await addToGoal(selectedGoalId, amount); setAddFundsModalVisible(false); setAddFundsAmount(''); setSelectedGoalId(null); } catch { Alert.alert('Error', 'Failed to add funds'); }
  };

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goalId) },
    ]);
  };

  const totalBonuses = educationBonusAmount + behaviorBonusAmount;
  const totalEarnings = totalReward + totalBonuses;
  const allocation = calculateAllocation(totalEarnings);
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

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
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings Summary</Text>
        <Text style={styles.headerSubtitle}>{selectedStudent?.name || 'Student'}'s Financial Overview</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalEarnings)}</Text>
        <View style={styles.totalBreakdown}>
          <View style={styles.breakdownItem}><Text style={styles.breakdownLabel}>Grades</Text><Text style={styles.breakdownValue}>{formatCurrency(totalReward)}</Text></View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}><Text style={styles.breakdownLabel}>Bonuses</Text><Text style={[styles.breakdownValue, { color: colors.success }]}>+{formatCurrency(totalBonuses)}</Text></View>
        </View>
      </View>

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
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <TouchableOpacity style={styles.addGoalButton} onPress={() => setGoalModalVisible(true)}><Text style={styles.addGoalButtonText}>+ Add Goal</Text></TouchableOpacity>
        </View>
        {goals.length === 0 ? (
          <EmptyState icon="flag-outline" title="No Savings Goals Yet" description="Set a goal to save for something special!" />
        ) : (
          <View style={styles.goalsContainer}>
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const isComplete = goal.currentAmount >= goal.targetAmount;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}><View style={[styles.goalIndicator, { backgroundColor: goal.color }]} />
                    <View style={styles.goalInfo}><Text style={styles.goalName}>{goal.name}</Text><Text style={styles.goalProgress}>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</Text></View>
                    <TouchableOpacity onPress={() => handleDeleteGoal(goal.id, goal.name)} style={styles.goalDeleteButton}><Text style={styles.goalDeleteText}>x</Text></TouchableOpacity>
                  </View>
                  <View style={styles.goalProgressBarBg}><View style={[styles.goalProgressBar, { width: `${Math.min(progress, 100)}%`, backgroundColor: isComplete ? colors.success : goal.color }]} /></View>
                  <View style={styles.goalFooter}>
                    <Text style={[styles.goalPercentage, isComplete && { color: colors.success }]}>{isComplete ? 'Complete!' : `${progress.toFixed(0)}%`}</Text>
                    {!isComplete && (<TouchableOpacity style={styles.addFundsButton} onPress={() => { setSelectedGoalId(goal.id); setAddFundsModalVisible(true); }}><Text style={styles.addFundsButtonText}>Add Funds</Text></TouchableOpacity>)}
                  </View>
                </View>
              );
            })}
            {goals.length > 0 && (<View style={styles.goalsSummary}><Text style={styles.goalsSummaryText}>Total Saved: {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}</Text></View>)}
          </View>
        )}
      </View>

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

      <Modal visible={goalModalVisible} transparent animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Savings Goal</Text>
          <View style={styles.inputGroup}><Text style={styles.inputLabel}>Goal Name</Text><TextInput style={styles.input} placeholder="e.g., New Video Game, Bike" placeholderTextColor={colors.textTertiary} value={newGoalName} onChangeText={setNewGoalName} /></View>
          <View style={styles.inputGroup}><Text style={styles.inputLabel}>Target Amount</Text><View style={styles.currencyInputContainer}><Text style={styles.currencySymbol}>$</Text><TextInput style={styles.currencyInput} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={newGoalAmount} onChangeText={setNewGoalAmount} keyboardType="decimal-pad" /></View></View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setGoalModalVisible(false); setNewGoalName(''); setNewGoalAmount(''); }}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleAddGoal}><Text style={styles.modalSubmitText}>Create Goal</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={addFundsModalVisible} transparent animationType="slide" onRequestClose={() => setAddFundsModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Funds to Goal</Text>
          <View style={styles.inputGroup}><Text style={styles.inputLabel}>Amount to Add</Text><View style={styles.currencyInputContainer}><Text style={styles.currencySymbol}>$</Text><TextInput style={styles.currencyInput} placeholder="0.00" placeholderTextColor={colors.textTertiary} value={addFundsAmount} onChangeText={setAddFundsAmount} keyboardType="decimal-pad" /></View></View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setAddFundsModalVisible(false); setAddFundsAmount(''); setSelectedGoalId(null); }}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleAddFunds}><Text style={styles.modalSubmitText}>Add Funds</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
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
  tipCard: { backgroundColor: tints.amber, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tipEmoji: { fontSize: 24 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 4 },
  tipText: { fontSize: 14, color: '#B45309', lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addGoalButton: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  addGoalButtonText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  goalsContainer: { gap: 12 },
  goalCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 16, fontWeight: '600', color: colors.text },
  goalProgress: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  goalDeleteButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  goalDeleteText: { fontSize: 20, color: colors.textTertiary, fontWeight: '300' },
  goalProgressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  goalProgressBar: { height: '100%', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  goalPercentage: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  addFundsButton: { backgroundColor: colors.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, minHeight: 44, justifyContent: 'center' },
  addFundsButtonText: { fontSize: 12, fontWeight: '500', color: colors.text },
  goalsSummary: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: 12, alignItems: 'center' },
  goalsSummaryText: { fontSize: 14, fontWeight: '500', color: colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
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
});
