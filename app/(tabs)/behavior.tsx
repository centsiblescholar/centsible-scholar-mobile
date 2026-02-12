import { useState, useMemo } from 'react';
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
import { useTheme, type ThemeColors, indigo, tints } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

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
  diet: 0, exercise: 0, work: 0, hygiene: 0, respect: 0,
  responsibilities: 0, attitude: 0, cooperation: 0, courtesy: 0, service: 0,
};

const SCORE_COLORS: Record<number, string> = {
  1: '#EF4444', 2: '#F97316', 3: '#F59E0B', 4: '#3B82F6', 5: '#10B981',
};

function getScoreStyle(score: number) {
  return { backgroundColor: SCORE_COLORS[score] || '#6B7280' };
}

export default function BehaviorScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectedStudent, isParentView } = useStudent();

  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const baseRewardAmount = selectedStudent?.base_reward_amount || 0;

  const { assessments, todayAssessment, overallAverage, isLoading, error, saveAssessment, isSaving, refetch } = useBehaviorAssessments(targetUserId);

  const {
    bonusAmount, bonusPercentage, currentTier, qualifiesForBonus, refetch: refetchBonus,
  } = useBehaviorBonus(targetUserId, baseRewardAmount);

  const { sendLowBehaviorAlert, isEnabled: notificationsEnabled } = useNotifications();

  const [scores, setScores] = useState<BehaviorScores>(todayAssessment || DEFAULT_SCORES);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'analytics'>('today');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchBonus()]);
    setRefreshing(false);
  };

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

  const getCategoryAverages = () => {
    if (assessments.length === 0) return null;
    const categories = [
      { key: 'diet', label: 'Diet' }, { key: 'exercise', label: 'Exercise' },
      { key: 'work', label: 'Work' }, { key: 'hygiene', label: 'Hygiene' },
      { key: 'respect', label: 'Respect' }, { key: 'responsibilities', label: 'Resp.' },
      { key: 'attitude', label: 'Attitude' }, { key: 'cooperation', label: 'Coop.' },
      { key: 'courtesy', label: 'Courtesy' }, { key: 'service', label: 'Service' },
    ];
    const averages = categories.map((cat) => {
      const sum = assessments.reduce((acc, a) => acc + (a[cat.key as keyof BehaviorScores] || 0), 0);
      return sum / assessments.length;
    });
    return { labels: categories.map((c) => c.label), data: averages };
  };

  const chartData = getChartData();
  const categoryData = getCategoryAverages();

  const updateScore = (key: keyof BehaviorScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    const hasScores = Object.values(scores).some((s) => s > 0);
    if (!hasScores && status === 'submitted') {
      Alert.alert('Error', 'Please rate at least one category before submitting');
      return;
    }
    try {
      await saveAssessment({ user_id: targetUserId!, date: new Date().toISOString().split('T')[0], scores, status });
      const average = calculateAssessmentAverageScore(scores);
      if (status === 'submitted' && average < 3.0 && notificationsEnabled) {
        const studentName = isParentView ? selectedStudent?.name : undefined;
        await sendLowBehaviorAlert(average, studentName);
      }
      Alert.alert('Success', status === 'submitted' ? 'Assessment submitted for review!' : 'Assessment saved as draft');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save assessment');
    }
  };

  const currentAverage = calculateAssessmentAverageScore(scores);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonList count={4} cardHeight={80} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message={error.message || 'Failed to load behavior data'} onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Behavior</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'today' && styles.tabActive]} onPress={() => setActiveTab('today')}>
            <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'analytics' && styles.tabActive]} onPress={() => setActiveTab('analytics')}>
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'analytics' ? (
          <View style={styles.analyticsContainer}>
            <View style={[styles.bonusCard, qualifiesForBonus && styles.bonusCardActive]}>
              <View style={styles.bonusHeader}>
                <Text style={styles.bonusTitle}>Behavior Bonus</Text>
                {currentTier && (
                  <View style={styles.tierBadge}><Text style={styles.tierBadgeText}>{currentTier}</Text></View>
                )}
              </View>
              <Text style={[styles.bonusAmount, qualifiesForBonus && styles.bonusAmountActive]}>
                ${bonusAmount.toFixed(2)}
              </Text>
              <Text style={styles.bonusSubtext}>
                {qualifiesForBonus ? `${(bonusPercentage * 100).toFixed(0)}% bonus on base reward` : 'Need 3.0+ average to qualify'}
              </Text>
            </View>

            {assessments.length >= 2 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Score Trend</Text>
                <Text style={styles.chartSubtitle}>Last {Math.min(14, assessments.length)} assessments</Text>
                <LineChart
                  data={{ labels: chartData.labels, datasets: [{ data: chartData.data.length > 0 ? chartData.data : [0] }] }}
                  width={screenWidth - 64} height={180} yAxisSuffix="" yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: colors.card, backgroundGradientFrom: colors.card, backgroundGradientTo: colors.card,
                    decimalPlaces: 1, color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: { borderRadius: 16 }, propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
                  }}
                  bezier style={{ marginVertical: 8, borderRadius: 16 }} fromZero segments={5}
                />
              </View>
            )}

            {categoryData && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Category Averages</Text>
                <Text style={styles.chartSubtitle}>Based on {assessments.length} assessments</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={{ labels: categoryData.labels, datasets: [{ data: categoryData.data }] }}
                    width={screenWidth * 1.5} height={200} yAxisSuffix="" yAxisLabel=""
                    chartConfig={{
                      backgroundColor: colors.card, backgroundGradientFrom: colors.card, backgroundGradientTo: colors.card,
                      decimalPlaces: 1, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, barPercentage: 0.6,
                    }}
                    style={{ marginVertical: 8, borderRadius: 16 }} fromZero showValuesOnTopOfBars
                  />
                </ScrollView>
              </View>
            )}

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
                  <Text style={[styles.summaryValue, qualifiesForBonus && { color: colors.success }]}>
                    {qualifiesForBonus ? 'Yes' : 'No'}
                  </Text>
                  <Text style={styles.summaryLabel}>Qualified</Text>
                </View>
              </View>
            </View>

            {assessments.length === 0 && (
              <EmptyState
                icon="checkmark-circle-outline"
                title="No Assessments Yet"
                description="Complete daily assessments to see behavior scores."
              />
            )}
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Today's Score</Text>
                <Text style={styles.statValue}>{currentAverage > 0 ? currentAverage.toFixed(1) : '--'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Overall Average</Text>
                <Text style={styles.statValue}>{assessments.length > 0 ? overallAverage.toFixed(1) : '--'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Obligations</Text>
              <Text style={styles.sectionDescription}>Required daily behaviors</Text>
              {OBLIGATIONS.map((item) => (
                <ScoreRow key={item.key} label={item.label} description={item.description} value={scores[item.key]} onChange={(value) => updateScore(item.key, value)} colors={colors} />
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opportunities</Text>
              <Text style={styles.sectionDescription}>Extra credit behaviors</Text>
              {OPPORTUNITIES.map((item) => (
                <ScoreRow key={item.key} label={item.label} description={item.description} value={scores[item.key]} onChange={(value) => updateScore(item.key, value)} colors={colors} />
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
          <TouchableOpacity style={styles.saveButton} onPress={() => handleSave('draft')} disabled={isSaving}>
            <Text style={styles.saveButtonText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, isSaving && styles.buttonDisabled]} onPress={() => handleSave('submitted')} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.submitButtonText}>Submit</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ScoreRow({ label, description, value, onChange, colors }: {
  label: string; description: string; value: number; onChange: (value: number) => void; colors: ThemeColors;
}) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 8 }}>
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{description}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((score) => (
          <TouchableOpacity key={score} style={[{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: colors.border, alignItems: 'center', minHeight: 44, justifyContent: 'center' }, value === score && getScoreStyle(score)]} onPress={() => onChange(score)}>
            <Text style={[{ fontSize: 16, fontWeight: '600', color: colors.textSecondary }, value === score && { color: colors.textInverse }]}>{score}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  scrollView: { flex: 1 },
  header: { backgroundColor: colors.primary, padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textInverse },
  headerDate: { fontSize: 14, color: indigo[200], marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  statLabel: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 4 },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  sectionDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  legend: { margin: 16, backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  legendTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { alignItems: 'center', flex: 1 },
  legendBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  legendScore: { fontSize: 14, fontWeight: 'bold', color: colors.textInverse },
  legendLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  submitButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  tabContainer: { flexDirection: 'row', margin: 16, backgroundColor: colors.border, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  tabActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  analyticsContainer: { padding: 16, paddingTop: 0 },
  bonusCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: 'transparent' },
  bonusCardActive: { borderColor: colors.success, backgroundColor: tints.green },
  bonusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bonusTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  tierBadge: { backgroundColor: tints.amber, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tierBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  bonusAmount: { fontSize: 36, fontWeight: 'bold', color: colors.textTertiary },
  bonusAmountActive: { color: colors.success },
  bonusSubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  chartCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  chartSubtitle: { fontSize: 12, color: colors.textTertiary, marginBottom: 8 },
  summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
