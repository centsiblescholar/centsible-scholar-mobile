import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useQuestionOfTheDay } from '../../src/hooks/useQuestionOfTheDay';
import { useEducationBonus } from '../../src/hooks/useEducationBonus';
import { useParentQODStats, TimeRange, StudentQODStats } from '../../src/hooks/useParentQODStats';
import { calculateLevelInfo } from '../../src/utils/levelSystem';
import { format, parseISO } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STUDENT_CARD_WIDTH = SCREEN_WIDTH - 64;
const STUDENT_CARD_GAP = 12;

// ---------------------------------------------------------------------------
// Main Export: Role-conditional Learn screen
// ---------------------------------------------------------------------------
export default function LearnScreen() {
  const { userRole } = useAuth();

  if (userRole === 'parent') {
    return <ParentQODProgressView />;
  }

  return <StudentLearnView />;
}

// ---------------------------------------------------------------------------
// Accuracy color helper
// ---------------------------------------------------------------------------
function getAccuracyColor(percentage: number): string {
  if (percentage > 90) return '#10B981';
  if (percentage >= 75) return '#F59E0B';
  return '#EF4444';
}

// ---------------------------------------------------------------------------
// Parent QOD Progress Dashboard
// ---------------------------------------------------------------------------
function ParentQODProgressView() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const studentListRef = useRef<FlatList>(null);

  const {
    studentStats,
    isLoading,
    error,
    refetch,
    familyTotalXP,
    familyAveragePercentage,
    studentsWithActiveStreak,
    studentsAnsweredToday,
    totalStudents,
  } = useParentQODStats(timeRange);

  const levelInfo = calculateLevelInfo(familyTotalXP);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const timeRangeOptions: { key: TimeRange; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={parentStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={parentStyles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={parentStyles.container}>
        <View style={parentStyles.header}>
          <Text style={parentStyles.headerTitle}>Learning Progress</Text>
          <Text style={parentStyles.headerSubtitle}>Family QOD Dashboard</Text>
        </View>
        <View style={parentStyles.errorCard}>
          <Text style={parentStyles.errorText}>
            {error.message || 'Failed to load student progress'}
          </Text>
          <TouchableOpacity style={parentStyles.retryButton} onPress={() => refetch()}>
            <Text style={parentStyles.retryButtonText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={parentStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
      }
    >
      {/* A. Header */}
      <View style={parentStyles.header}>
        <Text style={parentStyles.headerTitle}>Learning Progress</Text>
        <Text style={parentStyles.headerSubtitle}>Family QOD Dashboard</Text>
      </View>

      {/* B. Time Range Toggle */}
      <View style={parentStyles.toggleContainer}>
        <View style={parentStyles.toggleRow}>
          {timeRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                parentStyles.toggleOption,
                timeRange === option.key && parentStyles.toggleOptionActive,
              ]}
              onPress={() => setTimeRange(option.key)}
            >
              <Text
                style={[
                  parentStyles.toggleOptionText,
                  timeRange === option.key && parentStyles.toggleOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* E. Empty State */}
      {totalStudents === 0 ? (
        <View style={parentStyles.emptyState}>
          <Text style={parentStyles.emptyTitle}>No Students Found</Text>
          <Text style={parentStyles.emptyDescription}>
            Add students from your dashboard.
          </Text>
        </View>
      ) : (
        <>
          {/* C. Family Aggregate Stats */}
          <View style={parentStyles.aggregateGrid}>
            <View style={parentStyles.aggregateCard}>
              <Text style={parentStyles.aggregateValue}>{familyTotalXP}</Text>
              <Text style={parentStyles.aggregateLabel}>Total XP</Text>
              <Text style={parentStyles.aggregateSublabel}>
                Level {levelInfo.level} - {levelInfo.title}
              </Text>
            </View>
            <View style={parentStyles.aggregateCard}>
              <Text
                style={[
                  parentStyles.aggregateValue,
                  { color: totalStudents > 0 ? getAccuracyColor(familyAveragePercentage) : '#111827' },
                ]}
              >
                {familyAveragePercentage}%
              </Text>
              <Text style={parentStyles.aggregateLabel}>Avg Accuracy</Text>
            </View>
            <View style={parentStyles.aggregateCard}>
              <Text style={parentStyles.aggregateValue}>
                {studentsWithActiveStreak}/{totalStudents}
              </Text>
              <Text style={parentStyles.aggregateLabel}>Active Streaks</Text>
            </View>
            <View style={parentStyles.aggregateCard}>
              <Text style={parentStyles.aggregateValue}>
                {studentsAnsweredToday}/{totalStudents}
              </Text>
              <Text style={parentStyles.aggregateLabel}>Answered Today</Text>
            </View>
          </View>

          {/* D. Per-Student Progress Cards */}
          <View style={parentStyles.studentSection}>
            <Text style={parentStyles.studentSectionTitle}>Student Progress</Text>
            <FlatList
              ref={studentListRef}
              data={studentStats}
              horizontal
              pagingEnabled={false}
              snapToInterval={STUDENT_CARD_WIDTH + STUDENT_CARD_GAP}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={parentStyles.studentListContent}
              keyExtractor={(item) => item.studentId}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / (STUDENT_CARD_WIDTH + STUDENT_CARD_GAP)
                );
                setActiveStudentIndex(index);
              }}
              renderItem={({ item }) => <StudentProgressCard student={item} />}
            />
            {/* Page indicator dots */}
            {studentStats.length > 1 && (
              <View style={parentStyles.dotsContainer}>
                {studentStats.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      parentStyles.dot,
                      i === activeStudentIndex ? parentStyles.dotActive : parentStyles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Student Progress Card (for parent horizontal scroll)
// ---------------------------------------------------------------------------
function StudentProgressCard({ student }: { student: StudentQODStats }) {
  const formattedDate = student.lastAnswerDate
    ? format(parseISO(student.lastAnswerDate), 'MMM d')
    : 'Never';

  return (
    <View style={[parentStyles.studentCard, { width: STUDENT_CARD_WIDTH }]}>
      <View style={parentStyles.studentCardHeader}>
        <Text style={parentStyles.studentCardName}>{student.studentName}</Text>
        <View
          style={[
            parentStyles.todayStatusDot,
            student.answeredToday
              ? parentStyles.todayStatusDotComplete
              : parentStyles.todayStatusDotPending,
          ]}
        />
      </View>

      <View style={parentStyles.studentCardStats}>
        <View style={parentStyles.studentStatRow}>
          <Text style={parentStyles.studentStatLabel}>Streak</Text>
          <Text style={parentStyles.studentStatValue}>
            {student.currentStreak > 0 ? `${student.currentStreak} days` : 'No streak'}
          </Text>
        </View>

        <View style={parentStyles.studentStatRow}>
          <Text style={parentStyles.studentStatLabel}>Accuracy</Text>
          <Text
            style={[
              parentStyles.studentStatValue,
              { color: student.totalAttempts > 0 ? getAccuracyColor(student.percentage) : '#6B7280' },
            ]}
          >
            {student.totalAttempts > 0 ? `${student.percentage}%` : '--'}
          </Text>
        </View>

        <View style={parentStyles.studentStatRow}>
          <Text style={parentStyles.studentStatLabel}>Last Answer</Text>
          <Text style={parentStyles.studentStatValue}>{formattedDate}</Text>
        </View>

        <View style={parentStyles.studentStatRow}>
          <Text style={parentStyles.studentStatLabel}>Total Answered</Text>
          <Text style={parentStyles.studentStatValue}>
            {student.totalAttempts} question{student.totalAttempts !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Student Learn View (existing QOD screen, unchanged)
// ---------------------------------------------------------------------------
function StudentLearnView() {
  const { user } = useAuth();
  const { selectedStudent, isParentView } = useStudent();
  const [refreshing, setRefreshing] = useState(false);

  // Use student's grade level
  const gradeLevel = selectedStudent?.grade_level?.toString() || '12';

  const {
    currentQuestion,
    selectedAnswer,
    showResult,
    isCorrect,
    saving,
    loading,
    hasAnsweredToday,
    streakCount,
    handleAnswerSelect,
    handleSubmitAnswer,
  } = useQuestionOfTheDay(gradeLevel);

  // Get user ID for education bonus stats
  // Use selected student's user_id for data queries (not profile id)
  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const baseRewardAmount = selectedStudent?.base_reward_amount || 0;

  const {
    accuracyPercentage,
    totalQuestions,
    correctAnswers,
    currentTier,
    bonusAmount,
    refetch: refetchEducation,
  } = useEducationBonus(targetUserId, baseRewardAmount);

  const onRefresh = async () => {
    refetchEducation();
    setRefreshing(true);
    // Hook will refetch on next render
    setRefreshing(false);
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionSelected : styles.option;
    }

    // Show result
    if (index === currentQuestion?.correctAnswer) {
      return styles.optionCorrect;
    }
    if (selectedAnswer === index && !isCorrect) {
      return styles.optionIncorrect;
    }
    return styles.option;
  };

  const getOptionTextStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionTextSelected : styles.optionText;
    }

    if (index === currentQuestion?.correctAnswer) {
      return styles.optionTextCorrect;
    }
    if (selectedAnswer === index && !isCorrect) {
      return styles.optionTextIncorrect;
    }
    return styles.optionText;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading today's question...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Challenge</Text>
          <Text style={styles.headerSubtitle}>Financial Education</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Questions Available</Text>
          <Text style={styles.emptyDescription}>
            Questions for grade {gradeLevel} are coming soon!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Challenge</Text>
        <Text style={styles.headerSubtitle}>Financial Education</Text>
      </View>

      {streakCount > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streakCount} Day Streak!</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.questionCard}>
          <View style={styles.topicBadge}>
            <Text style={styles.topicText}>{currentQuestion.topic}</Text>
          </View>

          <Text style={styles.question}>{currentQuestion.question}</Text>

          {hasAnsweredToday && showResult && (
            <View style={styles.alreadyAnswered}>
              <Text style={styles.alreadyAnsweredText}>✓ Already answered today</Text>
            </View>
          )}
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getOptionStyle(index)}
              onPress={() => handleAnswerSelect(index)}
              disabled={showResult || saving}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionLetter, selectedAnswer === index && !showResult && styles.optionLetterSelected]}>
                  <Text style={[styles.optionLetterText, selectedAnswer === index && !showResult && styles.optionLetterTextSelected]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={getOptionTextStyle(index)}>{option}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!showResult && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (selectedAnswer === null || saving) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAnswer}
            disabled={selectedAnswer === null || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            )}
          </TouchableOpacity>
        )}

        {showResult && (
          <View style={[styles.resultCard, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
            <Text style={styles.resultTitle}>
              {isCorrect ? '🎉 Correct!' : '❌ Not quite right'}
            </Text>
            <Text style={styles.resultExplanation}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}

        {/* Accuracy Stats Card */}
        {totalQuestions > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalQuestions}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{correctAnswers}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, accuracyPercentage >= 50 && styles.statValueGood]}>
                  {accuracyPercentage}%
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
            {currentTier && (
              <View style={styles.bonusTierContainer}>
                <View style={styles.bonusTierBadge}>
                  <Text style={styles.bonusTierText}>{currentTier}</Text>
                </View>
                {bonusAmount > 0 && (
                  <Text style={styles.bonusAmountText}>
                    Earning ${bonusAmount.toFixed(2)} bonus
                  </Text>
                )}
              </View>
            )}
            {!currentTier && (
              <Text style={styles.noTierText}>
                Reach 50% accuracy to start earning bonuses
              </Text>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why Financial Education?</Text>
          <Text style={styles.infoText}>
            Answer daily questions to build your financial knowledge and earn bonus rewards!
            The more you learn, the better prepared you'll be for managing money in the future.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Student Learn View Styles (preserved from original)
// ---------------------------------------------------------------------------
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
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    gap: 8,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B45309',
  },
  content: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 26,
  },
  alreadyAnswered: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  alreadyAnsweredText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  optionCorrect: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  optionIncorrect: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterSelected: {
    backgroundColor: '#4F46E5',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  optionLetterTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    flex: 1,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  optionTextCorrect: {
    flex: 1,
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  optionTextIncorrect: {
    flex: 1,
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultCorrect: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  resultIncorrect: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  resultExplanation: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statValueGood: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  bonusTierContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  bonusTierBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bonusTierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  bonusAmountText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
  },
  noTierText: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#115E59',
    lineHeight: 22,
  },
});

// ---------------------------------------------------------------------------
// Parent QOD Progress Dashboard Styles
// ---------------------------------------------------------------------------
const parentStyles = StyleSheet.create({
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

  // Time Range Toggle
  toggleContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  // Aggregate Stats
  aggregateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  aggregateCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aggregateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  aggregateLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 4,
  },
  aggregateSublabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Student Progress Section
  studentSection: {
    paddingBottom: 24,
  },
  studentSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  studentListContent: {
    paddingHorizontal: 32,
    gap: STUDENT_CARD_GAP,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 200,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  todayStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  todayStatusDotComplete: {
    backgroundColor: '#10B981',
  },
  todayStatusDotPending: {
    backgroundColor: '#F59E0B',
  },
  studentCardStats: {
    gap: 12,
  },
  studentStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  studentStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
    backgroundColor: '#4F46E5',
  },
  dotInactive: {
    backgroundColor: '#D1D5DB',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Error State
  errorCard: {
    margin: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
