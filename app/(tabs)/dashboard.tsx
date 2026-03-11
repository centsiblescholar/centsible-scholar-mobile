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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useStudentGrades } from '../../src/hooks/useStudentGrades';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { useEducationBonus } from '../../src/hooks/useEducationBonus';
import { useBehaviorBonus } from '../../src/hooks/useBehaviorBonus';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { useQuestionOfTheDay } from '../../src/hooks/useQuestionOfTheDay';
import { useFamilyStats } from '../../src/hooks/useFamilyStats';
import { useParentQODStats } from '../../src/hooks/useParentQODStats';
import { calculateLevelInfo } from '../../src/utils/levelSystem';
import { calculateAllocation } from '../../src/shared/calculations';
import { useTheme, type ThemeColors, grades as gradeColors, indigo, financial, tints } from '@/theme';
import { DashboardSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import PendingReviewsWidget from '../../src/components/dashboard/PendingReviewsWidget';
import PendingGradesWidget from '../../src/components/dashboard/PendingGradesWidget';

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
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pStyles = useMemo(() => createParentStyles(colors), [colors]);

  const {
    selectedStudent,
    setSelectedStudent,
    students,
    isLoading: studentsLoading,
  } = useStudent();

  // Family-level aggregated stats
  const {
    familyGPA,
    totalRewards,
    averageBehaviorScore,
    qodAccuracy,
    studentSummaries,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useFamilyStats(students);

  // QOD stats for per-student XP/Level display
  const { studentStats, refetch: refetchQODStats } = useParentQODStats();

  const [refreshing, setRefreshing] = useState(false);
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchQODStats()]);
    setRefreshing(false);
  }, [refetchStats, refetchQODStats]);

  const isLoading = studentsLoading || statsLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <DashboardSkeleton />
      </View>
    );
  }

  if (!students.length && !studentsLoading) {
    return (
      <EmptyState
        icon="home-outline"
        title="Welcome to Centsible Scholar"
        description="Your dashboard will show your progress here. Add a student to get started."
      />
    );
  }

  // Stat cards data (matches web's 5-card hero row)
  const statCards: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string; bg: string }[] = [
    { icon: 'people', label: 'Students', value: String(students.length), color: '#8B5CF6', bg: tints.purple },
    { icon: 'school', label: students.length === 1 ? 'Student GPA' : 'Family GPA', value: familyGPA > 0 ? familyGPA.toFixed(2) : '--', color: '#EC4899', bg: '#FDF2F8' },
    { icon: 'cash', label: 'Total Rewards', value: `$${totalRewards.toFixed(0)}`, color: '#F97316', bg: '#FFF7ED' },
    { icon: 'fitness', label: 'Behavior', value: averageBehaviorScore > 0 ? averageBehaviorScore.toFixed(1) : '--', color: '#4F46E5', bg: tints.indigo },
    { icon: 'help-circle', label: 'QOD Accuracy', value: qodAccuracy > 0 ? `${qodAccuracy}%` : '--', color: '#06B6D4', bg: tints.cyan },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Family Dashboard</Text>
        <Text style={styles.email}>Monitor your family's progress</Text>
        <View style={styles.parentBadge}>
          <Text style={styles.parentBadgeText}>Parent Command Center</Text>
        </View>
      </View>

      {/* ── Family Stat Cards (scrollable row) ── */}
      <FlatList
        data={statCards}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={pStyles.statCardsContainer}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <View style={[pStyles.statCard, { backgroundColor: item.bg, borderLeftWidth: 4, borderLeftColor: item.color }]}>
            <View style={[pStyles.statIconBox, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={16} color="#fff" />
            </View>
            <Text style={[pStyles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={pStyles.statLabel}>{item.label}</Text>
          </View>
        )}
      />

      {/* ── Pending Reviews & Grades Widgets ── */}
      <View style={pStyles.widgetSection}>
        <PendingReviewsWidget />
      </View>
      <View style={pStyles.widgetSection}>
        <PendingGradesWidget />
      </View>

      {/* ── Your Students ── */}
      <View style={styles.section}>
        <View style={pStyles.studentsSectionHeader}>
          <Text style={styles.sectionTitle}>Your Students</Text>
          <View style={pStyles.studentsSectionActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/student-management' as never)}
            >
              <Text style={pStyles.viewAllLink}>View All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pStyles.addStudentBtn}
              onPress={() => router.push('/student-management' as never)}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={pStyles.addStudentText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {students.map((student) => {
          const summary = studentSummaries[student.user_id];
          return (
            <TouchableOpacity
              key={student.id}
              style={pStyles.studentCard}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedStudent(student);
                router.push('/(tabs)/grades');
              }}
            >
              <View style={pStyles.studentCardTop}>
                <View style={pStyles.studentAvatarBox}>
                  <Text style={pStyles.studentAvatarText}>
                    {student.name?.[0]?.toUpperCase() || 'S'}
                  </Text>
                </View>
                <View style={pStyles.studentCardInfo}>
                  <Text style={pStyles.studentCardName} numberOfLines={1}>{student.name}</Text>
                  <Text style={pStyles.studentCardGrade}>Grade {student.grade_level}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>

              {/* Mini stat row */}
              <View style={pStyles.miniStatRow}>
                <View style={pStyles.miniStat}>
                  <Ionicons name="school-outline" size={13} color="#8B5CF6" />
                  <Text style={pStyles.miniStatValue}>{summary?.gpa ? summary.gpa.toFixed(2) : '--'}</Text>
                  <Text style={pStyles.miniStatLabel}>GPA</Text>
                </View>
                <View style={pStyles.miniStat}>
                  <Ionicons name="cash-outline" size={13} color="#F97316" />
                  <Text style={pStyles.miniStatValue}>${summary?.totalRewards?.toFixed(0) || '0'}</Text>
                  <Text style={pStyles.miniStatLabel}>Rewards</Text>
                </View>
                <View style={pStyles.miniStat}>
                  <Ionicons name="fitness-outline" size={13} color="#3B82F6" />
                  <Text style={pStyles.miniStatValue}>{summary?.behaviorScore ? summary.behaviorScore.toFixed(1) : '--'}</Text>
                  <Text style={pStyles.miniStatLabel}>Behavior</Text>
                </View>
                <View style={pStyles.miniStat}>
                  <Ionicons name="help-circle-outline" size={13} color="#06B6D4" />
                  <Text style={pStyles.miniStatValue}>{summary?.qodAccuracy ? `${summary.qodAccuracy}%` : '--'}</Text>
                  <Text style={pStyles.miniStatLabel}>QOD</Text>
                </View>
              </View>

              {/* Level / XP Progress */}
              {(() => {
                const stats = studentStats?.find(s => s.studentUserId === student.user_id);
                const xp = stats?.totalXP ?? 0;
                const info = calculateLevelInfo(xp);
                return (
                  <View style={pStyles.levelRow}>
                    <Ionicons name="trophy" size={14} color="#8B5CF6" />
                    <Text style={pStyles.levelTitle} numberOfLines={1}>{info.title}</Text>
                    <View style={pStyles.levelProgressBg}>
                      <View style={[pStyles.levelProgressFill, { width: `${info.progressPercent}%` }]} />
                    </View>
                    <Text style={pStyles.levelPercent}>{info.progressPercent}%</Text>
                  </View>
                );
              })()}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={pStyles.quickActionsGrid}>
          {[
            { icon: 'people-outline' as const, label: 'Students', color: '#3B82F6', route: '/student-management' },
            { icon: 'checkmark-circle-outline' as const, label: 'Grade Approval', color: '#EC4899', route: '/grade-approval' },
            { icon: 'chatbubbles-outline' as const, label: 'Family Meeting', color: '#10B981', route: '/family-meetings' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={pStyles.quickActionBtn}
              onPress={() => router.push(action.route as never)}
            >
              <Ionicons name={action.icon} size={22} color={action.color} />
              <Text style={pStyles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 24 }} />
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

// ---------------------------------------------------------------------------
// Parent-specific styles factory
// ---------------------------------------------------------------------------
const createParentStyles = (colors: ThemeColors) => StyleSheet.create({
  // Stat cards row
  statCardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  statCard: {
    width: 110,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },

  // Widget section
  widgetSection: {
    padding: 16,
    paddingBottom: 0,
  },

  // Students section
  studentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addStudentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addStudentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Student card
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  studentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  studentAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  studentCardInfo: {
    flex: 1,
  },
  studentCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  studentCardGrade: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Mini stat row
  miniStatRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniStat: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  miniStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },

  // Level / XP row inside student cards
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  levelTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    maxWidth: 100,
  },
  levelProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  levelPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    minWidth: 28,
    textAlign: 'right',
  },

  // Students section actions row
  studentsSectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // View All link
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Quick actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionBtn: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 44,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
