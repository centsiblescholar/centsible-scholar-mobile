import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { useBehaviorBonus } from '../../src/hooks/useBehaviorBonus';
import { useNotifications } from '../../src/hooks/useNotifications';
import { BehaviorScores } from '../../src/shared/types';
import { calculateAssessmentAverageScore } from '../../src/shared/calculations';
import { SCORE_DESCRIPTIONS } from '../../src/shared/validation/constants';

const screenWidth = Dimensions.get('window').width;

const OBLIGATIONS = [
  { key: 'diet', label: 'Diet', description: 'Eating healthy meals' },
  { key: 'exercise', label: 'Exercise', description: 'Physical activity' },
  { key: 'work', label: 'School Work', description: 'Completing assignments' },
  { key: 'hygiene', label: 'Hygiene', description: 'Personal cleanliness' },
  { key: 'respect', label: 'Respect', description: 'Showing respect to others' },
] as const;

const OPPORTUNITIES = [
  { key: 'responsibilities', label: 'Responsibilities', description: 'Chores and duties' },
  { key: 'attitude', label: 'Attitude', description: 'Positive mindset' },
  { key: 'cooperation', label: 'Cooperation', description: 'Working with others' },
  { key: 'courtesy', label: 'Courtesy', description: 'Being polite' },
  { key: 'service', label: 'Service', description: 'Helping others' },
] as const;

const DEFAULT_SCORES: BehaviorScores = {
  diet: 0,
  exercise: 0,
  work: 0,
  hygiene: 0,
  respect: 0,
  responsibilities: 0,
  attitude: 0,
  cooperation: 0,
  courtesy: 0,
  service: 0,
};

export default function BehaviorScreen() {
  const { user } = useAuth();
  const { selectedStudent, isParentView } = useStudent();

  // Use selected student's user_id for data queries (not profile id)
  // For parents viewing student data: use selectedStudent.user_id
  // For students viewing own data: use their auth user.id
  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const baseRewardAmount = selectedStudent?.base_reward_amount || 0;

  const { assessments, todayAssessment, overallAverage, isLoading, saveAssessment, isSaving, refetch } = useBehaviorAssessments(targetUserId);

  const {
    bonusAmount,
    bonusPercentage,
    currentTier,
    qualifiesForBonus,
    refetch: refetchBonus,
  } = useBehaviorBonus(targetUserId, baseRewardAmount);

  const { sendLowBehaviorAlert, isEnabled: notificationsEnabled } = useNotifications();

  const [scores, setScores] = useState<BehaviorScores>(
    todayAssessment || DEFAULT_SCORES
  );
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'analytics'>('today');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchBonus()]);
    setRefreshing(false);
  };

  // Prepare chart data from assessments
  const getChartData = () => {
    const recentAssessments = assessments.slice(0, 14).reverse();
    const labels = recentAssessments.map((a, i) => {
      if (i === 0 || i === recentAssessments.length - 1) {
        const date = new Date(a.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return '';
    });
    const data = recentAssessments.map((a) => calculateAssessmentAverageScore(a));
    return { labels, data };
  };

  // Calculate category averages for bar chart
  const getCategoryAverages = () => {
    if (assessments.length === 0) return null;

    const categories = [
      { key: 'diet', label: 'Diet' },
      { key: 'exercise', label: 'Exercise' },
      { key: 'work', label: 'Work' },
      { key: 'hygiene', label: 'Hygiene' },
      { key: 'respect', label: 'Respect' },
      { key: 'responsibilities', label: 'Resp.' },
      { key: 'attitude', label: 'Attitude' },
      { key: 'cooperation', label: 'Coop.' },
      { key: 'courtesy', label: 'Courtesy' },
      { key: 'service', label: 'Service' },
    ];

    const averages = categories.map((cat) => {
      const sum = assessments.reduce((acc, a) => acc + (a[cat.key as keyof BehaviorScores] || 0), 0);
      return sum / assessments.length;
    });

    return {
      labels: categories.map((c) => c.label),
      data: averages,
    };
  };

  const chartData = getChartData();
  const categoryData = getCategoryAverages();

  const updateScore = (key: keyof BehaviorScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    // Check if at least one score is filled
    const hasScores = Object.values(scores).some((s) => s > 0);
    if (!hasScores && status === 'submitted') {
      Alert.alert('Error', 'Please rate at least one category before submitting');
      return;
    }

    try {
      await saveAssessment({
        user_id: targetUserId!,
        date: new Date().toISOString().split('T')[0],
        scores,
        status,
      });

      // Check if score is below bonus threshold and send alert
      const average = calculateAssessmentAverageScore(scores);
      if (status === 'submitted' && average < 3.0 && notificationsEnabled) {
        const studentName = isParentView ? selectedStudent?.name : undefined;
        await sendLowBehaviorAlert(average, studentName);
      }

      Alert.alert(
        'Success',
        status === 'submitted'
          ? 'Assessment submitted for review!'
          : 'Assessment saved as draft'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save assessment');
    }
  };

  const currentAverage = calculateAssessmentAverageScore(scores);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Behavior</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.tabActive]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'analytics' ? (
          /* Analytics View */
          <View style={styles.analyticsContainer}>
            {/* Bonus Card */}
            <View style={[styles.bonusCard, qualifiesForBonus && styles.bonusCardActive]}>
              <View style={styles.bonusHeader}>
                <Text style={styles.bonusTitle}>Behavior Bonus</Text>
                {currentTier && (
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierBadgeText}>{currentTier}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.bonusAmount, qualifiesForBonus && styles.bonusAmountActive]}>
                ${bonusAmount.toFixed(2)}
              </Text>
              <Text style={styles.bonusSubtext}>
                {qualifiesForBonus
                  ? `${(bonusPercentage * 100).toFixed(0)}% bonus on base reward`
                  : 'Need 3.0+ average to qualify'}
              </Text>
            </View>

            {/* Trend Chart */}
            {assessments.length >= 2 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Score Trend</Text>
                <Text style={styles.chartSubtitle}>Last {Math.min(14, assessments.length)} assessments</Text>
                <LineChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{ data: chartData.data.length > 0 ? chartData.data : [0] }],
                  }}
                  width={screenWidth - 64}
                  height={180}
                  yAxisSuffix=""
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#4F46E5',
                    },
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                  fromZero
                  segments={5}
                />
              </View>
            )}

            {/* Category Breakdown */}
            {categoryData && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Category Averages</Text>
                <Text style={styles.chartSubtitle}>Based on {assessments.length} assessments</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={{
                      labels: categoryData.labels,
                      datasets: [{ data: categoryData.data }],
                    }}
                    width={screenWidth * 1.5}
                    height={200}
                    yAxisSuffix=""
                    yAxisLabel=""
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      barPercentage: 0.6,
                    }}
                    style={{ marginVertical: 8, borderRadius: 16 }}
                    fromZero
                    showValuesOnTopOfBars
                  />
                </ScrollView>
              </View>
            )}

            {/* Summary Stats */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{assessments.length}</Text>
                  <Text style={styles.summaryLabel}>Assessments</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{overallAverage.toFixed(2)}</Text>
                  <Text style={styles.summaryLabel}>Average</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, qualifiesForBonus && styles.summaryValueGreen]}>
                    {qualifiesForBonus ? 'Yes' : 'No'}
                  </Text>
                  <Text style={styles.summaryLabel}>Qualified</Text>
                </View>
              </View>
            </View>

            {assessments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Data Yet</Text>
                <Text style={styles.emptyDescription}>
                  Complete daily assessments to see your analytics
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Today's Assessment View */
          <>
            <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's Score</Text>
            <Text style={styles.statValue}>
              {currentAverage > 0 ? currentAverage.toFixed(1) : '--'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overall Average</Text>
            <Text style={styles.statValue}>
              {assessments.length > 0 ? overallAverage.toFixed(1) : '--'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Obligations</Text>
          <Text style={styles.sectionDescription}>Required daily behaviors</Text>
          {OBLIGATIONS.map((item) => (
            <ScoreRow
              key={item.key}
              label={item.label}
              description={item.description}
              value={scores[item.key]}
              onChange={(value) => updateScore(item.key, value)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opportunities</Text>
          <Text style={styles.sectionDescription}>Extra credit behaviors</Text>
          {OPPORTUNITIES.map((item) => (
            <ScoreRow
              key={item.key}
              label={item.label}
              description={item.description}
              value={scores[item.key]}
              onChange={(value) => updateScore(item.key, value)}
            />
          ))}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Score Guide</Text>
          <View style={styles.legendRow}>
            {[1, 2, 3, 4, 5].map((score) => (
              <View key={score} style={styles.legendItem}>
                <View style={[styles.legendBadge, getScoreStyle(score)]}>
                  <Text style={styles.legendScore}>{score}</Text>
                </View>
                <Text style={styles.legendLabel}>
                  {SCORE_DESCRIPTIONS[score as keyof typeof SCORE_DESCRIPTIONS]}
                </Text>
              </View>
            ))}
          </View>
        </View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {activeTab === 'today' && (
        <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSave('draft')}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.buttonDisabled]}
          onPress={() => handleSave('submitted')}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      )}
    </View>
  );
}

function ScoreRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreInfo}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreDescription}>{description}</Text>
      </View>
      <View style={styles.scoreButtons}>
        {[1, 2, 3, 4, 5].map((score) => (
          <TouchableOpacity
            key={score}
            style={[
              styles.scoreButton,
              value === score && getScoreStyle(score),
            ]}
            onPress={() => onChange(score)}
          >
            <Text
              style={[
                styles.scoreButtonText,
                value === score && styles.scoreButtonTextSelected,
              ]}
            >
              {score}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getScoreStyle(score: number) {
  const colors: Record<number, string> = {
    1: '#EF4444',
    2: '#F97316',
    3: '#F59E0B',
    4: '#3B82F6',
    5: '#10B981',
  };
  return { backgroundColor: colors[score] || '#6B7280' };
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDate: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  scoreRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  scoreInfo: {
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scoreDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  scoreButtonTextSelected: {
    color: '#fff',
  },
  legend: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  legendLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4F46E5',
  },
  analyticsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  bonusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bonusCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  bonusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tierBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  bonusAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  bonusAmountActive: {
    color: '#10B981',
  },
  bonusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryValueGreen: {
    color: '#10B981',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
