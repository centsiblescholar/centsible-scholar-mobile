import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useStudentGrades } from '../../src/hooks/useStudentGrades';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { useEducationBonus } from '../../src/hooks/useEducationBonus';
import { useBehaviorBonus } from '../../src/hooks/useBehaviorBonus';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { useQuestionOfTheDay } from '../../src/hooks/useQuestionOfTheDay';
import { calculateAllocation } from '../../src/shared/calculations';
import { useTheme, type ThemeColors, grades as gradeColors, indigo, financial, tints } from '@/theme';
import { DashboardSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const SCREEN_WIDTH = Dimensions.get('window').width;
const METRIC_CARD_WIDTH = SCREEN_WIDTH - 64;
const METRIC_CARD_GAP = 12;

// Format currency helper (shared between both views)
const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

// ---------------------------------------------------------------------------
// Student Dashboard View
// ---------------------------------------------------------------------------
function StudentDashboardView() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const studentUserId = user?.id;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sStyles = useMemo(() => createStudentStyles(colors), [colors]);

  // Student profile for name, grade level, base reward
  const { profile: studentProfile } = useStudentProfile();
  const firstName = studentProfile?.name?.split(' ')[0] || 'Student';
  const gradeLevel = studentProfile?.grade_level;
  const baseRewardAmount = studentProfile?.base_reward_amount || 0;

  // Data hooks using student's own user.id
  const {
    gradeEntries,
    totalReward,
    gpa,
    isLoading: gradesLoading,
    refetch: refetchGrades,
  } = useStudentGrades(studentUserId);

  const {
    overallAverage,
    assessments,
    todayAssessment,
    isLoading: behaviorLoading,
    refetch: refetchBehavior,
  } = useBehaviorAssessments(studentUserId);

  const {
    bonusAmount: educationBonusAmount,
    currentTier: educationTier,
    isLoading: educationLoading,
    refetch: refetchEducation,
  } = useEducationBonus(studentUserId, baseRewardAmount);

  const {
    bonusAmount: behaviorBonusAmount,
    currentTier: behaviorTier,
    isLoading: behaviorBonusLoading,
    refetch: refetchBehaviorBonus,
  } = useBehaviorBonus(studentUserId, baseRewardAmount);

  // QOD hook for today's task status and streak
  const {
    hasAnsweredToday: qodAnsweredToday,
    streakCount,
    loading: qodLoading,
  } = useQuestionOfTheDay(gradeLevel);

  const [refreshing, setRefreshing] = useState(false);
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const metricListRef = useRef<FlatList>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGrades(),
      refetchBehavior(),
      refetchEducation(),
      refetchBehaviorBonus(),
    ]);
    setRefreshing(false);
  }, [refetchGrades, refetchBehavior, refetchEducation, refetchBehaviorBonus]);

  const isLoading =
    gradesLoading || behaviorLoading || educationLoading || behaviorBonusLoading || qodLoading;

  // Allocation breakdown
  const allocation = calculateAllocation(totalReward);

  // Metric card data
  const metricCards = [
    {
      id: 'gpa',
      value: gradeEntries.length > 0 ? gpa.toFixed(2) : '--',
      subtitle: 'CURRENT GPA',
      context:
        gradeEntries.length > 0
          ? `${gradeEntries.length} grade${gradeEntries.length !== 1 ? 's' : ''} entered`
          : "You've got this!",
      color: colors.primary,
    },
    {
      id: 'earnings',
      value: formatCurrency(totalReward),
      subtitle: 'TOTAL REWARDS',
      context: baseRewardAmount > 0 ? `${formatCurrency(baseRewardAmount)} per grade` : 'Earn rewards for your grades',
      color: colors.success,
    },
    {
      id: 'streak',
      value: String(streakCount),
      subtitle: 'DAY STREAK',
      context: streakCount > 0 ? 'Keep it going!' : "Answer today's QOD!",
      color: colors.warning,
    },
    {
      id: 'behavior',
      value: assessments.length > 0 ? overallAverage.toFixed(1) : '--',
      subtitle: 'BEHAVIOR SCORE',
      context:
        assessments.length > 0
          ? `${assessments.length} assessment${assessments.length !== 1 ? 's' : ''}`
          : "You've got this!",
      color: '#8B5CF6',
    },
  ];

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* A. Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey, {firstName}!</Text>
        <Text style={sStyles.streakText}>
          {streakCount > 0 ? `${streakCount} day streak` : 'Start your streak!'}
        </Text>
        <View style={sStyles.studentBadge}>
          <Text style={styles.parentBadgeText}>Student</Text>
        </View>
      </View>

      {/* B. Today's Tasks */}
      <View style={sStyles.tasksSection}>
        <Text style={sStyles.tasksSectionTitle}>What You Need To Do Today</Text>
        <View style={sStyles.tasksRow}>
          {/* QOD Card */}
          <TouchableOpacity
            style={sStyles.taskCard}
            onPress={() => router.push('/daily')}
            disabled={qodAnsweredToday}
          >
            <View style={sStyles.taskStatusRow}>
              <View
                style={[
                  sStyles.statusDot,
                  qodAnsweredToday ? sStyles.statusDotComplete : sStyles.statusDotPending,
                ]}
              />
              <Text style={sStyles.taskCardTitle}>Question of the Day</Text>
            </View>
            <Text style={sStyles.taskStatusText}>
              {qodAnsweredToday ? 'Completed!' : 'Ready to answer!'}
            </Text>
          </TouchableOpacity>

          {/* Behavior Card */}
          <TouchableOpacity
            style={sStyles.taskCard}
            onPress={() => router.push('/(tabs)/behavior')}
            disabled={!!todayAssessment}
          >
            <View style={sStyles.taskStatusRow}>
              <View
                style={[
                  sStyles.statusDot,
                  todayAssessment ? sStyles.statusDotComplete : sStyles.statusDotPending,
                ]}
              />
              <Text style={sStyles.taskCardTitle}>Behavior Check-in</Text>
            </View>
            <Text style={sStyles.taskStatusText}>
              {todayAssessment ? 'Completed!' : 'Time to reflect!'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* C. Horizontal Scrollable Metric Cards */}
      <View style={sStyles.metricsSection}>
        <FlatList
          ref={metricListRef}
          data={metricCards}
          horizontal
          pagingEnabled={false}
          snapToInterval={METRIC_CARD_WIDTH + METRIC_CARD_GAP}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sStyles.metricsListContent}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / (METRIC_CARD_WIDTH + METRIC_CARD_GAP)
            );
            setActiveMetricIndex(index);
          }}
          renderItem={({ item }) => (
            <View style={[sStyles.metricCard, { width: METRIC_CARD_WIDTH }]}>
              <Text style={[sStyles.metricValue, { color: item.color }]}>{item.value}</Text>
              <Text style={sStyles.metricSubtitle}>{item.subtitle}</Text>
              <Text style={sStyles.metricContext}>{item.context}</Text>
            </View>
          )}
        />
        {/* Page Indicator Dots */}
        <View style={sStyles.dotsContainer}>
          {metricCards.map((_, i) => (
            <View
              key={i}
              style={[
                sStyles.dot,
                i === activeMetricIndex ? sStyles.dotActive : sStyles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* D. Reward Structure */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Reward Structure</Text>

        {/* Base reward */}
        <View style={sStyles.rewardInfoCard}>
          <Text style={sStyles.rewardLabel}>Base Reward</Text>
          <Text style={sStyles.rewardValue}>
            {baseRewardAmount > 0 ? `${formatCurrency(baseRewardAmount)} per grade` : 'Not set yet'}
          </Text>
        </View>

        {/* Bonuses earned */}
        {(educationBonusAmount > 0 || behaviorBonusAmount > 0) && (
          <View style={sStyles.bonusesRow}>
            {educationBonusAmount > 0 && (
              <View style={sStyles.bonusChip}>
                <Text style={sStyles.bonusChipText}>
                  Education Bonus: {formatCurrency(educationBonusAmount)}
                  {educationTier ? ` (${educationTier})` : ''}
                </Text>
              </View>
            )}
            {behaviorBonusAmount > 0 && (
              <View style={sStyles.bonusChip}>
                <Text style={sStyles.bonusChipText}>
                  Behavior Bonus: {formatCurrency(behaviorBonusAmount)}
                  {behaviorTier ? ` (${behaviorTier})` : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Allocation Breakdown */}
        <View style={sStyles.allocationHeader}>
          <Text style={sStyles.allocationTitle}>Where Your Money Goes</Text>
        </View>
        <View style={styles.allocationCard}>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Taxes (15%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.taxQualified.taxes)}</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Retirement (10%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.taxQualified.retirement)}</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Savings (25%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.savings)}</Text>
          </View>
          <View style={[styles.allocationRow, styles.allocationRowLast]}>
            <Text style={styles.allocationLabel}>Discretionary (50%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.discretionary)}</Text>
          </View>
          <View style={styles.allocationTotal}>
            <Text style={styles.allocationTotalLabel}>Total</Text>
            <Text style={styles.allocationTotalValue}>{formatCurrency(allocation.total)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Parent Dashboard View (original, unchanged)
// ---------------------------------------------------------------------------
export default function DashboardScreen() {
  const { user, userRole } = useAuth();

  // Student users see the dedicated student dashboard
  if (userRole === 'student') {
    return <StudentDashboardView />;
  }

  // --- Parent dashboard code below (unchanged) ---
  return <ParentDashboardView />;
}

function ParentDashboardView() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    selectedStudent,
    setSelectedStudent,
    students,
    isLoading: studentsLoading,
    isParentView,
  } = useStudent();

  // Use selected student's user_id for data queries (not profile id)
  // For parents viewing student data: use selectedStudent.user_id
  // For students viewing own data: use their auth user.id
  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const profileId = isParentView ? selectedStudent?.id : undefined;

  const {
    gradeEntries,
    totalReward,
    gpa,
    isLoading: gradesLoading,
    refetch: refetchGrades,
  } = useStudentGrades(targetUserId, profileId);

  const {
    overallAverage,
    assessments,
    isLoading: behaviorLoading,
    refetch: refetchBehavior,
  } = useBehaviorAssessments(targetUserId);

  // Get base reward amount for bonus calculations
  const baseRewardAmount = selectedStudent?.base_reward_amount || 0;

  // Education bonus hook
  const {
    accuracyPercentage,
    bonusAmount: educationBonusAmount,
    currentTier: educationTier,
    totalQuestions: qodTotal,
    correctAnswers: qodCorrect,
    isLoading: educationLoading,
    refetch: refetchEducation,
  } = useEducationBonus(targetUserId, baseRewardAmount);

  // Behavior bonus hook
  const {
    bonusAmount: behaviorBonusAmount,
    currentTier: behaviorTier,
    qualifiesForBonus,
    isLoading: behaviorBonusLoading,
    refetch: refetchBehaviorBonus,
  } = useBehaviorBonus(targetUserId, baseRewardAmount);

  const [refreshing, setRefreshing] = useState(false);
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGrades(),
      refetchBehavior(),
      refetchEducation(),
      refetchBehaviorBonus(),
    ]);
    setRefreshing(false);
  }, [refetchGrades, refetchBehavior, refetchEducation, refetchBehaviorBonus]);

  const isLoading = studentsLoading || gradesLoading || behaviorLoading || educationLoading || behaviorBonusLoading;

  // Calculate allocation breakdown
  const allocation = calculateAllocation(totalReward);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <DashboardSkeleton />
      </View>
    );
  }

  if (!selectedStudent && !studentsLoading) {
    return (
      <EmptyState
        icon="home-outline"
        title="Welcome to Centsible Scholar"
        description="Your dashboard will show your progress here. Add a student to get started."
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.header}>
        {isParentView && students.length > 1 ? (
          <TouchableOpacity
            style={styles.studentSelector}
            onPress={() => setStudentPickerVisible(true)}
          >
            <Text style={styles.greeting}>
              {selectedStudent?.name || 'Select Student'}
            </Text>
            <Text style={styles.selectorChevron}>▼</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.greeting}>
            Welcome{selectedStudent?.name ? `, ${selectedStudent.name.split(' ')[0]}` : ''}!
          </Text>
        )}
        <Text style={styles.email}>{user?.email}</Text>
        {selectedStudent?.grade_level && (
          <Text style={styles.gradeLevel}>Grade {selectedStudent.grade_level}</Text>
        )}
        {isParentView && (
          <View style={styles.parentBadge}>
            <Text style={styles.parentBadgeText}>Parent View</Text>
          </View>
        )}
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Rewards</Text>
          <Text style={styles.cardValue}>{formatCurrency(totalReward)}</Text>
          <Text style={styles.cardSubtitle}>
            {gradeEntries.length} grade{gradeEntries.length !== 1 ? 's' : ''} entered
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current GPA</Text>
          <Text style={styles.cardValue}>
            {gradeEntries.length > 0 ? gpa.toFixed(2) : '--'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {gradeEntries.length > 0 ? 'Based on grades' : 'No grades yet'}
          </Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Behavior Score</Text>
          <Text style={styles.cardValue}>
            {assessments.length > 0 ? overallAverage.toFixed(1) : '--'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Base Amount</Text>
          <Text style={styles.cardValue}>
            {selectedStudent?.base_reward_amount
              ? formatCurrency(selectedStudent.base_reward_amount)
              : '--'}
          </Text>
          <Text style={styles.cardSubtitle}>Per grade</Text>
        </View>
      </View>

      {/* Bonus Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bonuses</Text>
        <View style={styles.bonusCardsContainer}>
          {/* Education Bonus Card */}
          <View style={[styles.bonusCard, educationBonusAmount > 0 && styles.bonusCardActive]}>
            <View style={styles.bonusHeader}>
              <Text style={styles.bonusIcon}>📚</Text>
              <Text style={styles.bonusTitle}>Education</Text>
            </View>
            <Text style={[styles.bonusValueText, educationBonusAmount > 0 && styles.bonusValueActive]}>
              {educationBonusAmount > 0 ? formatCurrency(educationBonusAmount) : '--'}
            </Text>
            {qodTotal > 0 ? (
              <>
                <Text style={styles.bonusAccuracy}>{accuracyPercentage}% accuracy</Text>
                <Text style={styles.bonusDetail}>
                  {qodCorrect}/{qodTotal} correct
                </Text>
                {educationTier && (
                  <View style={[styles.tierBadge, styles.tierBadgeEducation]}>
                    <Text style={styles.tierBadgeText}>{educationTier}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.bonusDetail}>Answer QOD to earn</Text>
            )}
          </View>

          {/* Behavior Bonus Card */}
          <View style={[styles.bonusCard, behaviorBonusAmount > 0 && styles.bonusCardActive]}>
            <View style={styles.bonusHeader}>
              <Text style={styles.bonusIcon}>⭐</Text>
              <Text style={styles.bonusTitle}>Behavior</Text>
            </View>
            <Text style={[styles.bonusValueText, behaviorBonusAmount > 0 && styles.bonusValueActive]}>
              {behaviorBonusAmount > 0 ? formatCurrency(behaviorBonusAmount) : '--'}
            </Text>
            {assessments.length > 0 ? (
              <>
                <Text style={styles.bonusAccuracy}>{overallAverage.toFixed(2)} avg score</Text>
                <Text style={styles.bonusDetail}>
                  {qualifiesForBonus ? 'Qualified' : 'Need 3.0+ to qualify'}
                </Text>
                {behaviorTier && (
                  <View style={[styles.tierBadge, styles.tierBadgeBehavior]}>
                    <Text style={styles.tierBadgeText}>{behaviorTier}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.bonusDetail}>Complete assessments</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allocation Breakdown</Text>
        <View style={styles.allocationCard}>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Taxes (15%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.taxQualified.taxes)}</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Retirement (10%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.taxQualified.retirement)}</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Savings (25%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.savings)}</Text>
          </View>
          <View style={[styles.allocationRow, styles.allocationRowLast]}>
            <Text style={styles.allocationLabel}>Discretionary (50%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.discretionary)}</Text>
          </View>
          <View style={styles.allocationTotal}>
            <Text style={styles.allocationTotalLabel}>Total</Text>
            <Text style={styles.allocationTotalValue}>{formatCurrency(allocation.total)}</Text>
          </View>
        </View>
      </View>

      {gradeEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Grades</Text>
          <View style={styles.gradesCard}>
            {gradeEntries.slice(0, 5).map((grade) => (
              <View key={grade.id} style={styles.gradeRow}>
                <View>
                  <Text style={styles.gradeSubject}>{grade.className}</Text>
                  <Text style={styles.gradeBase}>Base: {formatCurrency(grade.baseAmount)}</Text>
                </View>
                <View style={styles.gradeRight}>
                  <Text style={[styles.gradeLetter, { color: gradeColors[grade.grade as keyof typeof gradeColors] || colors.textSecondary }]}>{grade.grade}</Text>
                  <Text style={styles.gradeReward}>{formatCurrency(grade.rewardAmount)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Student Picker Modal */}
      <Modal
        visible={studentPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStudentPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Student</Text>
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.studentOption,
                    selectedStudent?.id === item.id && styles.studentOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedStudent(item);
                    setStudentPickerVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentGrade}>Grade {item.grade_level}</Text>
                  </View>
                  {selectedStudent?.id === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStudentPickerVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Shared styles factory (used by both views)
// ---------------------------------------------------------------------------
const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  studentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  selectorChevron: {
    fontSize: 12,
    color: indigo[200],
    marginLeft: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  email: {
    fontSize: 14,
    color: indigo[200],
    marginTop: 4,
  },
  gradeLevel: {
    fontSize: 14,
    color: indigo[200],
    marginTop: 2,
  },
  parentBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  parentBadgeText: {
    fontSize: 12,
    color: colors.textInverse,
    fontWeight: '600',
  },
  cardsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  allocationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  allocationRowLast: {
    borderBottomWidth: 0,
  },
  allocationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  allocationTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  allocationTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  allocationTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  gradesCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
    minHeight: 44,
  },
  gradeSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  gradeBase: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  gradeRight: {
    alignItems: 'flex-end',
  },
  gradeLetter: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gradeReward: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  studentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.backgroundSecondary,
    minHeight: 44,
  },
  studentOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  studentGrade: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bonusCardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bonusCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bonusCardActive: {
    borderColor: colors.success,
    backgroundColor: tints.green,
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bonusIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  bonusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  bonusValueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textTertiary,
    marginBottom: 4,
  },
  bonusValueActive: {
    color: colors.success,
  },
  bonusAccuracy: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bonusDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tierBadgeEducation: {
    backgroundColor: tints.blue,
  },
  tierBadgeBehavior: {
    backgroundColor: tints.amber,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
});

// ---------------------------------------------------------------------------
// Student-specific styles factory
// ---------------------------------------------------------------------------
const createStudentStyles = (colors: ThemeColors) => StyleSheet.create({
  streakText: {
    fontSize: 14,
    color: indigo[200],
    marginTop: 4,
  },
  studentBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  // Today's Tasks
  tasksSection: {
    padding: 16,
  },
  tasksSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  tasksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  taskCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
  },
  taskStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusDotComplete: {
    backgroundColor: colors.success,
  },
  statusDotPending: {
    backgroundColor: colors.warning,
  },
  taskCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  taskStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 18,
  },

  // Metric Cards
  metricsSection: {
    paddingBottom: 16,
  },
  metricsListContent: {
    paddingHorizontal: 32,
    gap: METRIC_CARD_GAP,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    minHeight: 120,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  metricSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 4,
  },
  metricContext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Page indicator dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: colors.borderDark,
  },

  // Reward Structure
  rewardInfoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  bonusesRow: {
    marginBottom: 12,
    gap: 8,
  },
  bonusChip: {
    backgroundColor: tints.green,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: financial[200],
  },
  bonusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: financial[800],
  },
  allocationHeader: {
    marginBottom: 8,
  },
  allocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
