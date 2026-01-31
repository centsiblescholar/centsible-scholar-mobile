import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
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

const screenWidth = Dimensions.get('window').width;

export default function EarningsScreen() {
  const { user } = useAuth();
  const { selectedStudent, isParentView } = useStudent();
  const [refreshing, setRefreshing] = useState(false);

  const targetUserId = isParentView ? selectedStudent?.id : user?.id;
  const baseRewardAmount = selectedStudent?.base_reward_amount || 0;

  const {
    gradeEntries,
    totalReward,
    isLoading: gradesLoading,
    refetch: refetchGrades,
  } = useStudentGrades(targetUserId);

  const {
    assessments,
    isLoading: behaviorLoading,
    refetch: refetchBehavior,
  } = useBehaviorAssessments(targetUserId);

  const {
    bonusAmount: educationBonusAmount,
    accuracyPercentage,
    isLoading: educationLoading,
    refetch: refetchEducation,
  } = useEducationBonus(targetUserId, baseRewardAmount);

  const {
    bonusAmount: behaviorBonusAmount,
    averageScore,
    isLoading: behaviorBonusLoading,
    refetch: refetchBehaviorBonus,
  } = useBehaviorBonus(targetUserId, baseRewardAmount);

  const {
    goals,
    addGoal,
    addToGoal,
    deleteGoal,
    totalSaved,
    totalTarget,
    isLoading: goalsLoading,
    refetch: refetchGoals,
  } = useSavingsGoals(targetUserId);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [addFundsModalVisible, setAddFundsModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGrades(),
      refetchBehavior(),
      refetchEducation(),
      refetchBehaviorBonus(),
      refetchGoals(),
    ]);
    setRefreshing(false);
  }, [refetchGrades, refetchBehavior, refetchEducation, refetchBehaviorBonus, refetchGoals]);

  const isLoading = gradesLoading || behaviorLoading || educationLoading || behaviorBonusLoading || goalsLoading;

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }
    const amount = parseFloat(newGoalAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    try {
      await addGoal(newGoalName.trim(), amount);
      setGoalModalVisible(false);
      setNewGoalName('');
      setNewGoalAmount('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const handleAddFunds = async () => {
    if (!selectedGoalId) return;

    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addToGoal(selectedGoalId, amount);
      setAddFundsModalVisible(false);
      setAddFundsAmount('');
      setSelectedGoalId(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add funds');
    }
  };

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(goalId),
        },
      ]
    );
  };

  // Calculate totals
  const totalBonuses = educationBonusAmount + behaviorBonusAmount;
  const totalEarnings = totalReward + totalBonuses;
  const allocation = calculateAllocation(totalEarnings);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  // Pie chart data for allocation
  const allocationChartData = [
    {
      name: 'Taxes',
      amount: allocation.taxQualified.taxes,
      color: '#EF4444',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Retirement',
      amount: allocation.taxQualified.retirement,
      color: '#8B5CF6',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Savings',
      amount: allocation.savings,
      color: '#3B82F6',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Spending',
      amount: allocation.discretionary,
      color: '#10B981',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
  ];

  // Pie chart data for income sources
  const incomeChartData = [
    {
      name: 'Grades',
      amount: totalReward,
      color: '#4F46E5',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Behavior',
      amount: behaviorBonusAmount,
      color: '#F59E0B',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Education',
      amount: educationBonusAmount,
      color: '#06B6D4',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
  ].filter(item => item.amount > 0);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings Summary</Text>
        <Text style={styles.headerSubtitle}>
          {selectedStudent?.name || 'Student'}'s Financial Overview
        </Text>
      </View>

      {/* Total Earnings Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalEarnings)}</Text>
        <View style={styles.totalBreakdown}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Grades</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(totalReward)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Bonuses</Text>
            <Text style={[styles.breakdownValue, styles.bonusValue]}>
              +{formatCurrency(totalBonuses)}
            </Text>
          </View>
        </View>
      </View>

      {/* Income Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Income Sources</Text>
        <View style={styles.card}>
          {incomeChartData.length > 0 ? (
            <PieChart
              data={incomeChartData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No earnings yet</Text>
          )}

          <View style={styles.incomeDetails}>
            <View style={styles.incomeRow}>
              <View style={styles.incomeIndicator}>
                <View style={[styles.indicatorDot, { backgroundColor: '#4F46E5' }]} />
                <Text style={styles.incomeLabel}>Grade Rewards</Text>
              </View>
              <Text style={styles.incomeAmount}>{formatCurrency(totalReward)}</Text>
            </View>
            <Text style={styles.incomeSubtext}>
              {gradeEntries.length} grade{gradeEntries.length !== 1 ? 's' : ''} submitted
            </Text>

            <View style={[styles.incomeRow, { marginTop: 12 }]}>
              <View style={styles.incomeIndicator}>
                <View style={[styles.indicatorDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.incomeLabel}>Behavior Bonus</Text>
              </View>
              <Text style={styles.incomeAmount}>{formatCurrency(behaviorBonusAmount)}</Text>
            </View>
            <Text style={styles.incomeSubtext}>
              {assessments.length > 0 ? `${averageScore.toFixed(2)} avg score` : 'No assessments yet'}
            </Text>

            <View style={[styles.incomeRow, { marginTop: 12 }]}>
              <View style={styles.incomeIndicator}>
                <View style={[styles.indicatorDot, { backgroundColor: '#06B6D4' }]} />
                <Text style={styles.incomeLabel}>Education Bonus</Text>
              </View>
              <Text style={styles.incomeAmount}>{formatCurrency(educationBonusAmount)}</Text>
            </View>
            <Text style={styles.incomeSubtext}>
              {accuracyPercentage}% QOD accuracy
            </Text>
          </View>
        </View>
      </View>

      {/* Paycheck Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paycheck Breakdown</Text>
        <View style={styles.card}>
          {totalEarnings > 0 ? (
            <PieChart
              data={allocationChartData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No earnings to allocate</Text>
          )}

          <View style={styles.allocationDetails}>
            <View style={styles.allocationRow}>
              <View style={styles.allocationLeft}>
                <View style={[styles.indicatorDot, { backgroundColor: '#EF4444' }]} />
                <View>
                  <Text style={styles.allocationLabel}>Taxes</Text>
                  <Text style={styles.allocationPercent}>15%</Text>
                </View>
              </View>
              <Text style={styles.allocationAmount}>
                {formatCurrency(allocation.taxQualified.taxes)}
              </Text>
            </View>

            <View style={styles.allocationRow}>
              <View style={styles.allocationLeft}>
                <View style={[styles.indicatorDot, { backgroundColor: '#8B5CF6' }]} />
                <View>
                  <Text style={styles.allocationLabel}>Retirement (529)</Text>
                  <Text style={styles.allocationPercent}>10%</Text>
                </View>
              </View>
              <Text style={styles.allocationAmount}>
                {formatCurrency(allocation.taxQualified.retirement)}
              </Text>
            </View>

            <View style={styles.allocationRow}>
              <View style={styles.allocationLeft}>
                <View style={[styles.indicatorDot, { backgroundColor: '#3B82F6' }]} />
                <View>
                  <Text style={styles.allocationLabel}>Savings</Text>
                  <Text style={styles.allocationPercent}>25%</Text>
                </View>
              </View>
              <Text style={styles.allocationAmount}>
                {formatCurrency(allocation.savings)}
              </Text>
            </View>

            <View style={styles.allocationRow}>
              <View style={styles.allocationLeft}>
                <View style={[styles.indicatorDot, { backgroundColor: '#10B981' }]} />
                <View>
                  <Text style={styles.allocationLabel}>Discretionary</Text>
                  <Text style={styles.allocationPercent}>50%</Text>
                </View>
              </View>
              <Text style={[styles.allocationAmount, styles.discretionaryAmount]}>
                {formatCurrency(allocation.discretionary)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Savings Goals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <TouchableOpacity
            style={styles.addGoalButton}
            onPress={() => setGoalModalVisible(true)}
          >
            <Text style={styles.addGoalButtonText}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyGoalsCard}>
            <Text style={styles.emptyGoalsEmoji}>🎯</Text>
            <Text style={styles.emptyGoalsTitle}>No Savings Goals Yet</Text>
            <Text style={styles.emptyGoalsDescription}>
              Set a goal to save for something special!
            </Text>
          </View>
        ) : (
          <View style={styles.goalsContainer}>
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0
                ? (goal.currentAmount / goal.targetAmount) * 100
                : 0;
              const isComplete = goal.currentAmount >= goal.targetAmount;

              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIndicator, { backgroundColor: goal.color }]} />
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalProgress}>
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal.id, goal.name)}
                      style={styles.goalDeleteButton}
                    >
                      <Text style={styles.goalDeleteText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.goalProgressBarBg}>
                    <View
                      style={[
                        styles.goalProgressBar,
                        {
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: isComplete ? '#10B981' : goal.color,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.goalFooter}>
                    <Text style={[styles.goalPercentage, isComplete && styles.goalComplete]}>
                      {isComplete ? '🎉 Complete!' : `${progress.toFixed(0)}%`}
                    </Text>
                    {!isComplete && (
                      <TouchableOpacity
                        style={styles.addFundsButton}
                        onPress={() => {
                          setSelectedGoalId(goal.id);
                          setAddFundsModalVisible(true);
                        }}
                      >
                        <Text style={styles.addFundsButtonText}>Add Funds</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {goals.length > 0 && (
              <View style={styles.goalsSummary}>
                <Text style={styles.goalsSummaryText}>
                  Total Saved: {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}
                </Text>
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
            <Text style={styles.tipText}>
              By saving 25% of your earnings now, you're building wealth habits that will serve you for life!
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* Add Goal Modal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Savings Goal</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., New Video Game, Bike"
                value={newGoalName}
                onChangeText={setNewGoalName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="0.00"
                  value={newGoalAmount}
                  onChangeText={setNewGoalAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setGoalModalVisible(false);
                  setNewGoalName('');
                  setNewGoalAmount('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleAddGoal}
              >
                <Text style={styles.modalSubmitText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        visible={addFundsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFundsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Funds to Goal</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount to Add</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="0.00"
                  value={addFundsAmount}
                  onChangeText={setAddFundsAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setAddFundsModalVisible(false);
                  setAddFundsAmount('');
                  setSelectedGoalId(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleAddFunds}
              >
                <Text style={styles.modalSubmitText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  totalCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  totalBreakdown: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  bonusValue: {
    color: '#10B981',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noDataText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 40,
  },
  incomeDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  incomeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  incomeSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 20,
    marginTop: 2,
  },
  allocationDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allocationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  allocationPercent: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  allocationAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  discretionaryAmount: {
    color: '#10B981',
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addGoalButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addGoalButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyGoalsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyGoalsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptyGoalsDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  goalProgress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  goalDeleteButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalDeleteText: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  goalProgressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  goalPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  goalComplete: {
    color: '#10B981',
  },
  addFundsButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addFundsButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  goalsSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  goalsSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSubmitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
