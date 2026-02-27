import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import PremiumBehaviorForm from '../../src/components/behavior/PremiumBehaviorForm';
import { useTheme, type ThemeColors, indigo, tints } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const screenWidth = Dimensions.get('window').width;

const DEFAULT_SCORES: BehaviorScores = {
  diet: 0, exercise: 0, work: 0, hygiene: 0, respect: 0,
  responsibilities: 0, attitude: 0, cooperation: 0, courtesy: 0, service: 0,
};

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
  const [notes, setNotes] = useState(todayAssessment?.notes || '');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'analytics'>('today');

  // Sync scores when todayAssessment loads
  const [syncedAssessmentId, setSyncedAssessmentId] = useState<string | null>(null);
  if (todayAssessment && todayAssessment.id !== syncedAssessmentId) {
    setScores({
      diet: todayAssessment.diet,
      exercise: todayAssessment.exercise,
      work: todayAssessment.work,
      hygiene: todayAssessment.hygiene,
      respect: todayAssessment.respect,
      responsibilities: todayAssessment.responsibilities,
      attitude: todayAssessment.attitude,
      cooperation: todayAssessment.cooperation,
      courtesy: todayAssessment.courtesy,
      service: todayAssessment.service,
    });
    setNotes(todayAssessment.notes || '');
    setSyncedAssessmentId(todayAssessment.id);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchBonus()]);
    setRefreshing(false);
  };

  // Determine editability based on assessment status
  const status = todayAssessment?.status;
  const editable = !isParentView && (!status || status === 'draft' || status === 'needs_revision');

  const handleSave = useCallback(async (saveStatus: 'draft' | 'submitted') => {
    const allScoresValid = Object.values(scores).every((s) => s >= 1 && s <= 5);
    if (!allScoresValid) {
      if (saveStatus === 'submitted') {
        Alert.alert('Error', 'Please rate all categories before submitting.');
      }
      return;
    }
    try {
      await saveAssessment({ user_id: targetUserId!, date: new Date().toISOString().split('T')[0], scores, status: saveStatus });
      const average = calculateAssessmentAverageScore(scores);
      if (saveStatus === 'submitted' && average < 3.0 && notificationsEnabled) {
        const studentName = isParentView ? selectedStudent?.name : undefined;
        await sendLowBehaviorAlert(average, studentName);
      }
      if (saveStatus === 'submitted') {
        Alert.alert('Submitted', 'Your assessment has been submitted for parent review.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save assessment');
    }
  }, [scores, targetUserId, saveAssessment, notificationsEnabled, isParentView, selectedStudent, sendLowBehaviorAlert]);

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

            <PremiumBehaviorForm
              scores={scores}
              onScoresChange={setScores}
              onSave={handleSave}
              isSaving={isSaving}
              existingAssessment={todayAssessment}
              editable={editable}
              notes={notes}
              onNotesChange={setNotes}
            />
          </>
        )}
      </ScrollView>
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
