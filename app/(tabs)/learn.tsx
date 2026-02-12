import { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, FlatList, Dimensions,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useQuestionOfTheDay } from '../../src/hooks/useQuestionOfTheDay';
import { useEducationBonus } from '../../src/hooks/useEducationBonus';
import { useParentQODStats, TimeRange, StudentQODStats } from '../../src/hooks/useParentQODStats';
import { calculateLevelInfo } from '../../src/utils/levelSystem';
import { format, parseISO } from 'date-fns';
import { useTheme, type ThemeColors, indigo, tints } from '@/theme';
import { SkeletonList, DashboardSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STUDENT_CARD_WIDTH = SCREEN_WIDTH - 64;
const STUDENT_CARD_GAP = 12;

export default function LearnScreen() {
  const { userRole } = useAuth();
  if (userRole === 'parent') return <ParentQODProgressView />;
  return <StudentLearnView />;
}

function getAccuracyColor(percentage: number, colors: ThemeColors): string {
  if (percentage > 90) return colors.success;
  if (percentage >= 75) return colors.warning;
  return colors.error;
}

function ParentQODProgressView() {
  const { colors } = useTheme();
  const styles = useMemo(() => createParentStyles(colors), [colors]);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const studentListRef = useRef<FlatList>(null);

  const { studentStats, isLoading, error, refetch, familyTotalXP, familyAveragePercentage, studentsWithActiveStreak, studentsAnsweredToday, totalStudents } = useParentQODStats(timeRange);
  const levelInfo = calculateLevelInfo(familyTotalXP);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const timeRangeOptions: { key: TimeRange; label: string }[] = [
    { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'all', label: 'All Time' },
  ];

  if (isLoading && !refreshing) {
    return <View style={styles.loadingContainer}><DashboardSkeleton /></View>;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Learning Progress</Text><Text style={styles.headerSubtitle}>Family QOD Dashboard</Text></View>
        <ErrorState message={error.message || 'Failed to load student progress'} onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.header}><Text style={styles.headerTitle}>Learning Progress</Text><Text style={styles.headerSubtitle}>Family QOD Dashboard</Text></View>

      <View style={styles.toggleContainer}><View style={styles.toggleRow}>
        {timeRangeOptions.map((option) => (
          <TouchableOpacity key={option.key} style={[styles.toggleOption, timeRange === option.key && styles.toggleOptionActive]} onPress={() => setTimeRange(option.key)}>
            <Text style={[styles.toggleOptionText, timeRange === option.key && styles.toggleOptionTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View></View>

      {totalStudents === 0 ? (
        <EmptyState icon="bulb-outline" title="No Student Data" description="Student progress will appear here." />
      ) : (
        <>
          <View style={styles.aggregateGrid}>
            <View style={styles.aggregateCard}><Text style={styles.aggregateValue}>{familyTotalXP}</Text><Text style={styles.aggregateLabel}>Total XP</Text><Text style={styles.aggregateSublabel}>Level {levelInfo.level} - {levelInfo.title}</Text></View>
            <View style={styles.aggregateCard}><Text style={[styles.aggregateValue, { color: totalStudents > 0 ? getAccuracyColor(familyAveragePercentage, colors) : colors.text }]}>{familyAveragePercentage}%</Text><Text style={styles.aggregateLabel}>Avg Accuracy</Text></View>
            <View style={styles.aggregateCard}><Text style={styles.aggregateValue}>{studentsWithActiveStreak}/{totalStudents}</Text><Text style={styles.aggregateLabel}>Active Streaks</Text></View>
            <View style={styles.aggregateCard}><Text style={styles.aggregateValue}>{studentsAnsweredToday}/{totalStudents}</Text><Text style={styles.aggregateLabel}>Answered Today</Text></View>
          </View>

          <View style={styles.studentSection}>
            <Text style={styles.studentSectionTitle}>Student Progress</Text>
            <FlatList ref={studentListRef} data={studentStats} horizontal pagingEnabled={false} snapToInterval={STUDENT_CARD_WIDTH + STUDENT_CARD_GAP} decelerationRate="fast" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.studentListContent} keyExtractor={(item) => item.studentId}
              onMomentumScrollEnd={(e) => { const index = Math.round(e.nativeEvent.contentOffset.x / (STUDENT_CARD_WIDTH + STUDENT_CARD_GAP)); setActiveStudentIndex(index); }}
              renderItem={({ item }) => <StudentProgressCard student={item} colors={colors} />}
            />
            {studentStats.length > 1 && (
              <View style={styles.dotsContainer}>{studentStats.map((_, i) => (<View key={i} style={[styles.dot, i === activeStudentIndex ? styles.dotActive : styles.dotInactive]} />))}</View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StudentProgressCard({ student, colors }: { student: StudentQODStats; colors: ThemeColors }) {
  const styles = useMemo(() => createParentStyles(colors), [colors]);
  const formattedDate = student.lastAnswerDate ? format(parseISO(student.lastAnswerDate), 'MMM d') : 'Never';
  return (
    <View style={[styles.studentCard, { width: STUDENT_CARD_WIDTH }]}>
      <View style={styles.studentCardHeader}><Text style={styles.studentCardName}>{student.studentName}</Text><View style={[styles.todayStatusDot, student.answeredToday ? styles.todayStatusDotComplete : styles.todayStatusDotPending]} /></View>
      <View style={styles.studentCardStats}>
        <View style={styles.studentStatRow}><Text style={styles.studentStatLabel}>Streak</Text><Text style={styles.studentStatValue}>{student.currentStreak > 0 ? `${student.currentStreak} days` : 'No streak'}</Text></View>
        <View style={styles.studentStatRow}><Text style={styles.studentStatLabel}>Accuracy</Text><Text style={[styles.studentStatValue, { color: student.totalAttempts > 0 ? getAccuracyColor(student.percentage, colors) : colors.textSecondary }]}>{student.totalAttempts > 0 ? `${student.percentage}%` : '--'}</Text></View>
        <View style={styles.studentStatRow}><Text style={styles.studentStatLabel}>Last Answer</Text><Text style={styles.studentStatValue}>{formattedDate}</Text></View>
        <View style={styles.studentStatRow}><Text style={styles.studentStatLabel}>Total Answered</Text><Text style={styles.studentStatValue}>{student.totalAttempts} question{student.totalAttempts !== 1 ? 's' : ''}</Text></View>
      </View>
    </View>
  );
}

function StudentLearnView() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStudentStyles(colors), [colors]);
  const { selectedStudent, isParentView } = useStudent();
  const [refreshing, setRefreshing] = useState(false);
  const gradeLevel = selectedStudent?.grade_level?.toString() || '12';

  const { currentQuestion, selectedAnswer, showResult, isCorrect, saving, loading, hasAnsweredToday, streakCount, handleAnswerSelect, handleSubmitAnswer } = useQuestionOfTheDay(gradeLevel);

  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const baseRewardAmount = selectedStudent?.base_reward_amount || 0;
  const { accuracyPercentage, totalQuestions, correctAnswers, currentTier, bonusAmount, refetch: refetchEducation } = useEducationBonus(targetUserId, baseRewardAmount);

  const onRefresh = async () => { refetchEducation(); setRefreshing(true); setRefreshing(false); };

  const getOptionStyle = (index: number) => {
    if (!showResult) return selectedAnswer === index ? styles.optionSelected : styles.option;
    if (index === currentQuestion?.correctAnswer) return styles.optionCorrect;
    if (selectedAnswer === index && !isCorrect) return styles.optionIncorrect;
    return styles.option;
  };
  const getOptionTextStyle = (index: number) => {
    if (!showResult) return selectedAnswer === index ? styles.optionTextSelected : styles.optionText;
    if (index === currentQuestion?.correctAnswer) return styles.optionTextCorrect;
    if (selectedAnswer === index && !isCorrect) return styles.optionTextIncorrect;
    return styles.optionText;
  };

  if (loading) {
    return <View style={styles.loadingContainer}><SkeletonList count={3} cardHeight={100} /></View>;
  }

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Daily Challenge</Text><Text style={styles.headerSubtitle}>Financial Education</Text></View>
        <EmptyState icon="bulb-outline" title="No Questions Available" description={`Questions for grade ${gradeLevel} are coming soon!`} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}><Text style={styles.headerTitle}>Daily Challenge</Text><Text style={styles.headerSubtitle}>Financial Education</Text></View>
      {streakCount > 0 && (<View style={styles.streakBanner}><Text style={styles.streakEmoji}>🔥</Text><Text style={styles.streakText}>{streakCount} Day Streak!</Text></View>)}
      <View style={styles.content}>
        <View style={styles.questionCard}>
          <View style={styles.topicBadge}><Text style={styles.topicText}>{currentQuestion.topic}</Text></View>
          <Text style={styles.question}>{currentQuestion.question}</Text>
          {hasAnsweredToday && showResult && (<View style={styles.alreadyAnswered}><Text style={styles.alreadyAnsweredText}>✓ Already answered today</Text></View>)}
        </View>
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity key={index} style={getOptionStyle(index)} onPress={() => handleAnswerSelect(index)} disabled={showResult || saving}>
              <View style={styles.optionContent}>
                <View style={[styles.optionLetter, selectedAnswer === index && !showResult && styles.optionLetterSelected]}>
                  <Text style={[styles.optionLetterText, selectedAnswer === index && !showResult && styles.optionLetterTextSelected]}>{String.fromCharCode(65 + index)}</Text>
                </View>
                <Text style={getOptionTextStyle(index)}>{option}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {!showResult && (
          <TouchableOpacity style={[styles.submitButton, (selectedAnswer === null || saving) && styles.submitButtonDisabled]} onPress={handleSubmitAnswer} disabled={selectedAnswer === null || saving}>
            {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.submitButtonText}>Submit Answer</Text>}
          </TouchableOpacity>
        )}
        {showResult && (
          <View style={[styles.resultCard, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
            <Text style={styles.resultTitle}>{isCorrect ? 'Correct!' : 'Not quite right'}</Text>
            <Text style={styles.resultExplanation}>{currentQuestion.explanation}</Text>
          </View>
        )}
        {totalQuestions > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{totalQuestions}</Text><Text style={styles.statLabel}>Questions</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={styles.statValue}>{correctAnswers}</Text><Text style={styles.statLabel}>Correct</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={[styles.statValue, accuracyPercentage >= 50 && { color: colors.success }]}>{accuracyPercentage}%</Text><Text style={styles.statLabel}>Accuracy</Text></View>
            </View>
            {currentTier && (<View style={styles.bonusTierContainer}><View style={styles.bonusTierBadge}><Text style={styles.bonusTierText}>{currentTier}</Text></View>{bonusAmount > 0 && (<Text style={styles.bonusAmountText}>Earning ${bonusAmount.toFixed(2)} bonus</Text>)}</View>)}
            {!currentTier && (<Text style={styles.noTierText}>Reach 50% accuracy to start earning bonuses</Text>)}
          </View>
        )}
        <View style={styles.infoCard}><Text style={styles.infoTitle}>Why Financial Education?</Text><Text style={styles.infoText}>Answer daily questions to build your financial knowledge and earn bonus rewards! The more you learn, the better prepared you'll be for managing money in the future.</Text></View>
      </View>
    </ScrollView>
  );
}

const createStudentStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary, padding: 16 },
  header: { backgroundColor: colors.primary, padding: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textInverse },
  headerSubtitle: { fontSize: 14, color: indigo[200], marginTop: 4 },
  streakBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: tints.amber, paddingVertical: 12, gap: 8 },
  streakEmoji: { fontSize: 20 },
  streakText: { fontSize: 16, fontWeight: 'bold', color: '#B45309' },
  content: { padding: 16 },
  questionCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  topicBadge: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  topicText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  question: { fontSize: 18, fontWeight: '600', color: colors.text, lineHeight: 26 },
  alreadyAnswered: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  alreadyAnsweredText: { fontSize: 14, color: colors.success, fontWeight: '500' },
  optionsContainer: { gap: 12, marginBottom: 20 },
  option: { backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.border, minHeight: 44 },
  optionSelected: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.primary, minHeight: 44 },
  optionCorrect: { backgroundColor: tints.green, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.success, minHeight: 44 },
  optionIncorrect: { backgroundColor: tints.red, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.error, minHeight: 44 },
  optionContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  optionLetterSelected: { backgroundColor: colors.primary },
  optionLetterText: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
  optionLetterTextSelected: { color: colors.textInverse },
  optionText: { flex: 1, fontSize: 16, color: colors.text },
  optionTextSelected: { flex: 1, fontSize: 16, color: colors.primary, fontWeight: '500' },
  optionTextCorrect: { flex: 1, fontSize: 16, color: '#059669', fontWeight: '500' },
  optionTextIncorrect: { flex: 1, fontSize: 16, color: colors.error, fontWeight: '500' },
  submitButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20, minHeight: 44, justifyContent: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
  resultCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  resultCorrect: { backgroundColor: tints.green, borderWidth: 2, borderColor: colors.success },
  resultIncorrect: { backgroundColor: tints.red, borderWidth: 2, borderColor: colors.error },
  resultTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  resultExplanation: { fontSize: 16, color: colors.text, lineHeight: 24 },
  statsCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  bonusTierContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  bonusTierBadge: { backgroundColor: tints.blue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  bonusTierText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  bonusAmountText: { fontSize: 14, color: colors.success, fontWeight: '600', marginTop: 8 },
  noTierText: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  infoCard: { backgroundColor: '#F0FDFA', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#99F6E4' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#0D9488', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#115E59', lineHeight: 22 },
});

const createParentStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary, padding: 16 },
  header: { backgroundColor: colors.primary, padding: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textInverse },
  headerSubtitle: { fontSize: 14, color: indigo[200], marginTop: 4 },
  toggleContainer: { padding: 16, paddingBottom: 0 },
  toggleRow: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 12, padding: 4 },
  toggleOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  toggleOptionActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleOptionText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  toggleOptionTextActive: { color: colors.primary, fontWeight: '600' },
  aggregateGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  aggregateCard: { width: (SCREEN_WIDTH - 44) / 2, backgroundColor: colors.card, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  aggregateValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  aggregateLabel: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600', marginTop: 4 },
  aggregateSublabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  studentSection: { paddingBottom: 24 },
  studentSectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, paddingHorizontal: 16, marginBottom: 12 },
  studentListContent: { paddingHorizontal: 32, gap: STUDENT_CARD_GAP },
  studentCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, minHeight: 200 },
  studentCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  studentCardName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  todayStatusDot: { width: 12, height: 12, borderRadius: 6 },
  todayStatusDotComplete: { backgroundColor: colors.success },
  todayStatusDotPending: { backgroundColor: colors.warning },
  studentCardStats: { gap: 12 },
  studentStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  studentStatLabel: { fontSize: 14, color: colors.textSecondary },
  studentStatValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.borderDark },
});
