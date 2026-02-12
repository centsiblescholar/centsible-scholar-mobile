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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useStudent } from '../src/contexts/StudentContext';
import { useTermTracking, TermSnapshot } from '../src/hooks/useTermTracking';
import { useUserProfile } from '../src/hooks/useUserProfile';
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
    configError,
    snapshotsError,
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
  });
}
