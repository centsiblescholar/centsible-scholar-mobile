import { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useStudent } from '../src/contexts/StudentContext';
import { useTermTracking, TermSnapshot } from '../src/hooks/useTermTracking';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function TermTrackingScreen() {
  const { user } = useAuth();
  const { isParent } = useUserProfile();
  const { selectedStudent } = useStudent();
  const [refreshing, setRefreshing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [termLength, setTermLength] = useState('9');

  // Use selected student's ID if parent, otherwise use logged-in user's ID
  const targetUserId = isParent ? selectedStudent?.id : user?.id;

  const {
    termConfig,
    termSnapshots,
    currentTermNumber,
    termProgress,
    cumulativeStats,
    isLoading,
    setupNewTerm,
    isSettingUpTerm,
    refetch,
  } = useTermTracking(targetUserId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSetupTerm = async () => {
    const weeks = parseInt(termLength, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      Alert.alert('Invalid Input', 'Please enter a valid number of weeks (1-52).');
      return;
    }

    try {
      await setupNewTerm(weeks);
      setShowSetupModal(false);
      Alert.alert('Success', 'Term has been set up successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set up term');
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
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
            <Text style={styles.termNumber}>Term #{currentTermNumber}</Text>
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

              {termProgress.hasEnded && (
                <TouchableOpacity
                  style={styles.newTermButton}
                  onPress={() => setShowSetupModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.newTermButtonText}>Start New Term</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>No Term Set Up</Text>
                <Text style={styles.emptyStateText}>
                  Set up your first term to start tracking your progress.
                </Text>
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={() => setShowSetupModal(true)}
                >
                  <Text style={styles.setupButtonText}>Set Up Term</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Cumulative Stats */}
        {termSnapshots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All-Time Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="wallet" size={24} color="#10B981" />
                <Text style={styles.statValue}>
                  {formatCurrency(cumulativeStats.totalEarnings)}
                </Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="school" size={24} color="#4F46E5" />
                <Text style={styles.statValue}>
                  {cumulativeStats.overallAverageGPA?.toFixed(2) || 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Avg GPA</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="ribbon" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>
                  {formatCurrency(cumulativeStats.gradeEarnings)}
                </Text>
                <Text style={styles.statLabel}>Grade Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star" size={24} color="#EC4899" />
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
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#4F46E5',
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
                <TermHistoryItem key={snapshot.id} snapshot={snapshot} />
              ))}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#9CA3AF" />
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

      {/* Setup Term Modal */}
      <Modal
        visible={showSetupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Up Term</Text>
            <Text style={styles.modalSubtitle}>
              Enter the length of your term in weeks.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Term Length (weeks)</Text>
              <TextInput
                style={styles.input}
                value={termLength}
                onChangeText={setTermLength}
                keyboardType="number-pad"
                placeholder="9"
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Start Term</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Term History Item Component
function TermHistoryItem({ snapshot }: { snapshot: TermSnapshot }) {
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
          color="#6B7280"
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  termNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRange: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  endedBadge: {
    backgroundColor: '#FEE2E2',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 6,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
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
    backgroundColor: '#E5E7EB',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  newTermButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  newTermButtonText: {
    color: '#fff',
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
    color: '#111827',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  setupButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
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
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  termBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  historyDates: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyStats: {
    flexDirection: 'row',
    gap: 24,
  },
  historyStat: {},
  historyStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  earnedValue: {
    color: '#10B981',
  },
  historyDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  allocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: screenWidth - 48,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlign: 'center',
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  presetButtonActive: {
    backgroundColor: '#4F46E5',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  presetButtonTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
