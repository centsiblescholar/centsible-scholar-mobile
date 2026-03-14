import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addWeeks, format, parseISO } from 'date-fns';
import { useAuth } from '../src/contexts/AuthContext';
import { useStudent } from '../src/contexts/StudentContext';
import { useTermTracking, TermSnapshot } from '../src/hooks/useTermTracking';
import { usePaycheckCalculations } from '../src/hooks/usePaycheckCalculations';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useStudentGrades } from '../src/hooks/useStudentGrades';
import { useBehaviorBonus } from '../src/hooks/useBehaviorBonus';
import { useEducationBonus } from '../src/hooks/useEducationBonus';
import { usePendingGradeCount } from '../src/hooks/usePendingGradeCount';
import { useParentStudents } from '../src/hooks/useParentStudents';
import { calculateTotalAllocation } from '../src/shared/calculations/allocationCalculations';
import { computePayPeriods, getCurrentPayPeriod, type PayFrequency } from '../src/utils/payPeriods';
import { PayPeriodProgress } from '../src/components/term/PayPeriodProgress';
import { PendingPaycheckCard } from '../src/components/term/PendingPaycheckCard';
import { TermRenewalCard } from '../src/components/term/TermRenewalCard';
import { LineChart } from 'react-native-chart-kit';
import { useTheme, type ThemeColors } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

const screenWidth = Dimensions.get('window').width;

export default function TermTrackingScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isParent } = useUserProfile();
  const { selectedStudent } = useStudent();
  const [refreshing, setRefreshing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [termLength, setTermLength] = useState('9');
  const [isEditMode, setIsEditMode] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Use selected student's ID if parent, otherwise use logged-in user's ID
  // targetUserId uses profile ID for parents (resolveStudentUserId handles conversion)
  const targetUserId = isParent ? selectedStudent?.id : user?.id;
  // resolvedStudentUserId is the student's auth user_id (needed for grade/behavior hooks)
  const resolvedStudentUserId = isParent ? selectedStudent?.user_id : user?.id;

  const {
    termConfig,
    termSnapshots,
    pendingPaychecks,
    currentTermNumber,
    termProgress,
    cumulativeStats,
    paidPeriodNumbers,
    isLoading,
    configError,
    snapshotsError,
    setupNewTerm,
    updateTermDates,
    isSettingUpTerm,
    savePaycheck,
    isSavingPaycheck,
    approvePaycheck,
    isApprovingPaycheck,
    rejectPaycheck,
    isRejectingPaycheck,
    currentTermHasSnapshot,
    refetch,
  } = useTermTracking(targetUserId);

  // Get student's reporting frequency
  const { students } = useParentStudents();
  const selectedStudentInfo = students.find((s) => s.id === selectedStudent?.id);
  const reportingFrequency: PayFrequency = (selectedStudentInfo?.reporting_frequency as PayFrequency) || 'term';

  // Paycheck calculations (auto-populates from grades + bonuses)
  const paycheckCalc = usePaycheckCalculations(resolvedStudentUserId);

  // Grade and behavior data for term completion
  const { gradeEntries, totalReward, gpa } = useStudentGrades(resolvedStudentUserId);
  const { bonusAmount: behaviorEarnings } = useBehaviorBonus(resolvedStudentUserId, totalReward);
  const { bonusAmount: educationEarnings } = useEducationBonus(resolvedStudentUserId, totalReward);
  const pendingGradeCount = usePendingGradeCount();

  // Calculate allocation for the confirmation modal
  const totalEarnings = totalReward + behaviorEarnings + educationEarnings;
  const allocation = useMemo(() => {
    if (totalEarnings <= 0) return null;
    return calculateTotalAllocation(gradeEntries);
  }, [gradeEntries, totalEarnings]);

  // Compute pay periods for the current term
  const payPeriods = useMemo(() => {
    if (!termConfig) return [];
    return computePayPeriods(
      parseISO(termConfig.current_term_start),
      parseISO(termConfig.current_term_end),
      reportingFrequency
    );
  }, [termConfig, reportingFrequency]);

  const currentPayPeriod = useMemo(() => getCurrentPayPeriod(payPeriods), [payPeriods]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Computed end date for the modal preview
  const computedEndDate = useMemo(() => {
    const weeks = parseInt(termLength, 10);
    if (isNaN(weeks) || weeks < 1) return null;
    return addWeeks(startDate, weeks);
  }, [startDate, termLength]);

  const openEditModal = () => {
    if (!termConfig) return;
    setIsEditMode(true);
    setTermLength(String(termConfig.term_length));
    setStartDate(parseISO(termConfig.current_term_start));
    setShowDatePicker(false);
    setShowSetupModal(true);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setTermLength('9');
    setStartDate(new Date());
    setShowDatePicker(false);
    setShowSetupModal(true);
  };

  const handleSetupTerm = async () => {
    const weeks = parseInt(termLength, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      Alert.alert('Invalid Input', 'Please enter a valid number of weeks (1-52).');
      return;
    }

    try {
      if (isEditMode) {
        await updateTermDates(weeks, startDate);
        setShowSetupModal(false);
        Alert.alert('Success', 'Term has been updated successfully!');
      } else {
        await setupNewTerm(weeks);
        setShowSetupModal(false);
        Alert.alert('Success', 'Term has been set up successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save term');
    }
  };

  const handleCompleteTerm = async () => {
    if (!termConfig) return;

    try {
      await savePaycheck({
        term_number: currentTermNumber,
        term_start: termConfig.current_term_start.split('T')[0],
        term_end: termConfig.current_term_end.split('T')[0],
        pay_period_number: null,
        gpa: gpa || null,
        grade_earnings: totalReward,
        behavior_earnings: behaviorEarnings,
        education_earnings: educationEarnings,
        total_earnings: totalEarnings,
        allocation_breakdown: allocation
          ? {
              tax: allocation.taxQualified.taxes,
              retirement: allocation.taxQualified.retirement,
              savings: allocation.savings,
              discretionary: allocation.discretionary,
            }
          : null,
        grades_data: gradeEntries.map((g) => ({
          subject: g.className,
          grade: g.grade,
          baseAmount: g.baseAmount,
          reward: g.rewardAmount,
        })),
      });

      setShowCompleteModal(false);
      Alert.alert(
        'Term Completed',
        `Term #${currentTermNumber} is complete!\n\nTotal Earnings: $${totalEarnings.toFixed(2)}\n\nThe paycheck is pending your review.`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete term');
    }
  };

  const handleApprovePaycheck = async (snapshotId: string) => {
    try {
      await approvePaycheck(snapshotId);
      Alert.alert('Approved', 'Paycheck has been approved!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve paycheck');
    }
  };

  const handleRejectPaycheck = async (snapshotId: string) => {
    Alert.alert(
      'Reject Paycheck',
      'Are you sure you want to reject this paycheck? The student will need to resubmit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectPaycheck(snapshotId);
              Alert.alert('Rejected', 'Paycheck has been rejected.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject paycheck');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonList count={3} cardHeight={120} />
      </View>
    );
  }

  if ((configError || snapshotsError) && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorState message="Failed to load term data" onRetry={refetch} />
      </View>
    );
  }

  // Prepare chart data for GPA history
  const gpaChartData = termSnapshots
    .filter((s) => s.gpa !== null)
    .reverse()
    .slice(-6); // Last 6 terms

  const hasGPAData = gpaChartData.length >= 2;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Current Term Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Term</Text>
            <View style={styles.sectionHeaderRight}>
              {termConfig && isParent && termProgress && !termProgress.hasEnded && (
                <TouchableOpacity
                  style={styles.editTermButton}
                  onPress={openEditModal}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              <Text style={styles.termNumber}>Term #{currentTermNumber}</Text>
            </View>
          </View>

          {termConfig && termProgress ? (
            <View style={styles.card}>
              <View style={styles.progressHeader}>
                <Text style={styles.dateRange}>
                  {termProgress.startDate} - {termProgress.endDate}
                </Text>
                {termProgress.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
                {termProgress.hasEnded && (
                  <View style={[styles.activeBadge, styles.endedBadge]}>
                    <Text style={styles.activeBadgeText}>Ended</Text>
                  </View>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${termProgress.progressPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {Math.round(termProgress.progressPercent)}%
                </Text>
              </View>

              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {termProgress.elapsedDays}
                  </Text>
                  <Text style={styles.progressStatLabel}>Days Elapsed</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {termProgress.remainingDays}
                  </Text>
                  <Text style={styles.progressStatLabel}>Days Left</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {termConfig.term_length}
                  </Text>
                  <Text style={styles.progressStatLabel}>Weeks</Text>
                </View>
              </View>

              {/* Student notice when term has ended */}
              {termProgress.hasEnded && !isParent && !currentTermHasSnapshot && (
                <View style={styles.noticeBanner}>
                  <Ionicons name="alert-circle" size={20} color={colors.warning} />
                  <Text style={styles.noticeBannerText}>
                    Your term has ended! Submit any remaining grades so your parent can finalize payment.
                  </Text>
                </View>
              )}

              {/* Parent: Complete Term button (only if term ended and no snapshot yet) */}
              {termProgress.hasEnded && isParent && !currentTermHasSnapshot && (
                <TouchableOpacity
                  style={[styles.newTermButton, styles.completeTermButton]}
                  onPress={() => setShowCompleteModal(true)}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />
                  <Text style={styles.newTermButtonText}>Complete Term</Text>
                </TouchableOpacity>
              )}

              {/* Show completed badge if snapshot exists */}
              {termProgress.hasEnded && currentTermHasSnapshot && (
                <View style={styles.completedBadgeContainer}>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.completedBadgeText}>Term Completed</Text>
                  </View>
                </View>
              )}

              {/* Start New Term only available after term is completed */}
              {termProgress.hasEnded && currentTermHasSnapshot && isParent && (
                <TouchableOpacity
                  style={styles.newTermButton}
                  onPress={openCreateModal}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
                  <Text style={styles.newTermButtonText}>Start New Term</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>No Term Set Up</Text>
                <Text style={styles.emptyStateText}>
                  Set up your first term to start tracking your progress.
                </Text>
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={openCreateModal}
                >
                  <Text style={styles.setupButtonText}>Set Up Term</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Pay Period Progress (shown when term is active) */}
        {termConfig && termProgress?.isActive && payPeriods.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pay Period</Text>
            <PayPeriodProgress
              currentPeriod={currentPayPeriod}
              totalPeriods={payPeriods.length}
              paidCount={paidPeriodNumbers.size}
            />
          </View>
        )}

        {/* Pending Paychecks (parent view) */}
        {isParent && pendingPaychecks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Paychecks ({pendingPaychecks.length})
            </Text>
            {pendingPaychecks.map((paycheck) => (
              <PendingPaycheckCard
                key={paycheck.id}
                paycheck={paycheck}
                onApprove={handleApprovePaycheck}
                onReject={handleRejectPaycheck}
                isApproving={isApprovingPaycheck}
                isRejecting={isRejectingPaycheck}
              />
            ))}
          </View>
        )}

        {/* Term Renewal Card (parent view, when term has ended and snapshot exists) */}
        {isParent && termConfig && termProgress?.hasEnded && currentTermHasSnapshot && (
          <TermRenewalCard
            termConfig={termConfig}
            currentTermNumber={currentTermNumber}
            onRenew={(weeks) => setupNewTerm(weeks)}
            isRenewing={isSettingUpTerm}
          />
        )}

        {/* Cumulative Stats */}
        {termSnapshots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All-Time Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="wallet" size={24} color={colors.success} />
                <Text style={styles.statValue}>
                  {formatCurrency(cumulativeStats.totalEarnings)}
                </Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="school" size={24} color={colors.primary} />
                <Text style={styles.statValue}>
                  {cumulativeStats.overallAverageGPA?.toFixed(2) || 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Avg GPA</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="ribbon" size={24} color={colors.warning} />
                <Text style={styles.statValue}>
                  {formatCurrency(cumulativeStats.gradeEarnings)}
                </Text>
                <Text style={styles.statLabel}>Grade Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star" size={24} color={colors.error} />
                <Text style={styles.statValue}>
                  {formatCurrency(cumulativeStats.behaviorEarnings)}
                </Text>
                <Text style={styles.statLabel}>Behavior Earnings</Text>
              </View>
            </View>
          </View>
        )}

        {/* GPA History Chart */}
        {hasGPAData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GPA History</Text>
            <View style={styles.chartCard}>
              <LineChart
                data={{
                  labels: gpaChartData.map((s) => `T${s.term_number}`),
                  datasets: [
                    {
                      data: gpaChartData.map((s) => s.gpa || 0),
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={screenWidth - 64}
                height={200}
                yAxisSuffix=""
                yAxisInterval={1}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.primary,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
        )}

        {/* Term History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Term History</Text>
          {termSnapshots.length > 0 ? (
            <View style={styles.historyList}>
              {termSnapshots.map((snapshot) => (
                <TermHistoryItem key={snapshot.id} snapshot={snapshot} colors={colors} styles={styles} />
              ))}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>No History Yet</Text>
                <Text style={styles.emptyStateText}>
                  Complete your first term to see your history here.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </View>

      {/* Setup / Edit Term Modal */}
      <Modal
        visible={showSetupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Term' : 'Set Up Term'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isEditMode
                ? 'Update your term length and start date.'
                : 'Enter the length of your term in weeks.'}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Term Length (weeks)</Text>
              <TextInput
                style={styles.input}
                value={termLength}
                onChangeText={setTermLength}
                keyboardType="number-pad"
                placeholder="9"
                placeholderTextColor={colors.textTertiary}
                maxLength={2}
              />
            </View>

            <View style={styles.presetButtons}>
              {[6, 9, 12, 18].map((weeks) => (
                <TouchableOpacity
                  key={weeks}
                  style={[
                    styles.presetButton,
                    termLength === String(weeks) && styles.presetButtonActive,
                  ]}
                  onPress={() => setTermLength(String(weeks))}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      termLength === String(weeks) && styles.presetButtonTextActive,
                    ]}
                  >
                    {weeks}w
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Start Date (edit mode) */}
            {isEditMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.datePickerText}>
                    {format(startDate, 'MMM d, yyyy')}
                  </Text>
                  <Ionicons
                    name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                    style={styles.datePicker}
                  />
                )}
              </View>
            )}

            {/* Calculated End Date */}
            {isEditMode && computedEndDate && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>End Date (calculated)</Text>
                <View style={styles.readOnlyDate}>
                  <Ionicons name="calendar" size={18} color={colors.textSecondary} />
                  <Text style={styles.readOnlyDateText}>
                    {format(computedEndDate, 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSetupModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, isSettingUpTerm && styles.buttonDisabled]}
                onPress={handleSetupTerm}
                disabled={isSettingUpTerm}
              >
                {isSettingUpTerm ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {isEditMode ? 'Update Term' : 'Start Term'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Term Confirmation Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.completeModalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Complete Term #{currentTermNumber}</Text>

              {termConfig && (
                <Text style={styles.completeModalDates}>
                  {termProgress?.startDate} - {termProgress?.endDate}
                </Text>
              )}

              {/* Pending grades warning */}
              {pendingGradeCount > 0 && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={18} color={colors.warning} />
                  <Text style={styles.warningText}>
                    {pendingGradeCount} pending grade{pendingGradeCount !== 1 ? 's' : ''} still need approval. Approve them before completing to include in earnings.
                  </Text>
                </View>
              )}

              {/* GPA */}
              <View style={styles.completeSection}>
                <View style={styles.gpaBadge}>
                  <Text style={styles.gpaBadgeLabel}>GPA</Text>
                  <Text style={styles.gpaBadgeValue}>{gpa ? gpa.toFixed(2) : 'N/A'}</Text>
                </View>
              </View>

              {/* Earnings breakdown */}
              <View style={styles.completeSection}>
                <Text style={styles.completeSectionTitle}>Earnings</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Grade Earnings</Text>
                  <Text style={styles.detailValue}>{formatCurrency(totalReward)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Behavior Bonus</Text>
                  <Text style={styles.detailValue}>{formatCurrency(behaviorEarnings)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Education Bonus</Text>
                  <Text style={styles.detailValue}>{formatCurrency(educationEarnings)}</Text>
                </View>
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Earnings</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalEarnings)}</Text>
                </View>
              </View>

              {/* Allocation breakdown */}
              {allocation && totalEarnings > 0 && (
                <View style={styles.completeSection}>
                  <Text style={styles.completeSectionTitle}>Allocation</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Taxes (15%)</Text>
                    <Text style={styles.detailValue}>{formatCurrency(allocation.taxQualified.taxes)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Retirement (10%)</Text>
                    <Text style={styles.detailValue}>{formatCurrency(allocation.taxQualified.retirement)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Savings (25%)</Text>
                    <Text style={styles.detailValue}>{formatCurrency(allocation.savings)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Discretionary (50%)</Text>
                    <Text style={styles.detailValue}>{formatCurrency(allocation.discretionary)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCompleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isSavingPaycheck && styles.buttonDisabled]}
                  onPress={handleCompleteTerm}
                  disabled={isSavingPaycheck}
                >
                  {isSavingPaycheck ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={styles.confirmButtonText}>Complete Term</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Term History Item Component
function TermHistoryItem({ snapshot, colors, styles }: { snapshot: TermSnapshot; colors: ThemeColors; styles: any }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleRow}>
          <View style={styles.termBadge}>
            <Text style={styles.termBadgeText}>Term {snapshot.term_number}</Text>
          </View>
          <Text style={styles.historyDates}>
            {formatDate(snapshot.term_start)} - {formatDate(snapshot.term_end)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.historyStats}>
        <View style={styles.historyStat}>
          <Text style={styles.historyStatLabel}>GPA</Text>
          <Text style={styles.historyStatValue}>
            {snapshot.gpa?.toFixed(2) || 'N/A'}
          </Text>
        </View>
        <View style={styles.historyStat}>
          <Text style={styles.historyStatLabel}>Earned</Text>
          <Text style={[styles.historyStatValue, styles.earnedValue]}>
            {formatCurrency(snapshot.total_earnings)}
          </Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.historyDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Grade Earnings</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(snapshot.grade_earnings)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Behavior Earnings</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(snapshot.behavior_earnings)}
            </Text>
          </View>
          {snapshot.allocation_breakdown && (
            <>
              <View style={styles.detailDivider} />
              <Text style={styles.allocationTitle}>Allocation Breakdown</Text>
              {snapshot.allocation_breakdown.tax !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tax</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(snapshot.allocation_breakdown.tax)}
                  </Text>
                </View>
              )}
              {snapshot.allocation_breakdown.retirement !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Retirement</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(snapshot.allocation_breakdown.retirement)}
                  </Text>
                </View>
              )}
              {snapshot.allocation_breakdown.savings !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Savings</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(snapshot.allocation_breakdown.savings)}
                  </Text>
                </View>
              )}
              {snapshot.allocation_breakdown.discretionary !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Discretionary</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(snapshot.allocation_breakdown.discretionary)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      padding: 16,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    editTermButton: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    termNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dateRange: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    activeBadge: {
      backgroundColor: colors.success + '22',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    endedBadge: {
      backgroundColor: colors.error + '22',
    },
    activeBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    progressBar: {
      flex: 1,
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      marginRight: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 6,
    },
    progressPercent: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      width: 45,
      textAlign: 'right',
    },
    progressStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    progressStat: {
      alignItems: 'center',
      flex: 1,
    },
    progressStatDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    progressStatValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    progressStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    newTermButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 12,
      marginTop: 16,
      gap: 8,
      minHeight: 48,
    },
    newTermButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 12,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    setupButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      minHeight: 44,
      justifyContent: 'center',
    },
    setupButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      width: (screenWidth - 44) / 2,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    historyList: {
      gap: 12,
    },
    historyItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    termBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    termBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    historyDates: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    historyStats: {
      flexDirection: 'row',
      gap: 24,
    },
    historyStat: {},
    historyStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    historyStatValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 2,
    },
    earnedValue: {
      color: colors.success,
    },
    historyDetails: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    detailDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
    allocationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: screenWidth - 48,
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      textAlign: 'center',
      color: colors.text,
    },
    presetButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 24,
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: 14,
    },
    datePickerText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    datePicker: {
      marginTop: 8,
    },
    readOnlyDate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
    },
    readOnlyDateText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    presetButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      minHeight: 44,
      justifyContent: 'center',
    },
    presetButtonActive: {
      backgroundColor: colors.primary,
    },
    presetButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetButtonTextActive: {
      color: colors.textInverse,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    confirmButton: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textInverse,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    // Complete Term styles
    completeTermButton: {
      backgroundColor: colors.success,
    },
    completedBadgeContainer: {
      alignItems: 'center',
      marginTop: 16,
    },
    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.success + '18',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    completedBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.success,
    },
    noticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.warning + '18',
      padding: 14,
      borderRadius: 12,
      marginTop: 16,
    },
    noticeBannerText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    completeModalScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    completeModalDates: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 16,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.warning + '18',
      padding: 12,
      borderRadius: 10,
      marginBottom: 16,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    completeSection: {
      marginBottom: 16,
    },
    completeSectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    gpaBadge: {
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      padding: 16,
      borderRadius: 12,
    },
    gpaBadgeLabel: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    gpaBadgeValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 4,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
      paddingTop: 12,
    },
    totalLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    totalValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.success,
    },
  });
}
