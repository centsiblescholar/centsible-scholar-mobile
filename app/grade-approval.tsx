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
import { format, parseISO } from 'date-fns';
import { useGradeApproval, PendingGrade } from '../src/hooks/useGradeApproval';
import { useUserProfile } from '../src/hooks/useUserProfile';
import {
  spacing,
  textStyles,
  borderRadius,
  shadows,
  grades,
  tints,
  layout,
  sizing,
  useTheme,
  type ThemeColors,
} from '../src/theme';

const screenWidth = Dimensions.get('window').width;

export default function GradeApprovalScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isParent } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<PendingGrade | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const {
    pendingGrades,
    reviewedGrades,
    pendingByStudent,
    stats,
    isLoading,
    approveGrade,
    rejectGrade,
    bulkApproveGrades,
    isApproving,
    isRejecting,
    isBulkApproving,
    refetch,
  } = useGradeApproval();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleApprove = async (grade: PendingGrade) => {
    try {
      await approveGrade(grade.id);
      Alert.alert('Success', `${grade.subject} grade approved!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve grade');
    }
  };

  const handleReject = async () => {
    if (!selectedGrade) return;

    try {
      await rejectGrade(selectedGrade.id, rejectNotes || undefined);
      setShowRejectModal(false);
      setSelectedGrade(null);
      setRejectNotes('');
      Alert.alert('Success', 'Grade has been rejected');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject grade');
    }
  };

  const handleBulkApprove = async () => {
    if (pendingGrades.length === 0) return;

    Alert.alert(
      'Approve All',
      `Are you sure you want to approve all ${pendingGrades.length} pending grades?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              await bulkApproveGrades(pendingGrades.map((g) => g.id));
              Alert.alert('Success', 'All grades have been approved!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve grades');
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (grade: PendingGrade) => {
    setSelectedGrade(grade);
    setRejectNotes('');
    setShowRejectModal(true);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getGradeColor = (grade: string) => {
    return grades[grade as keyof typeof grades] || colors.textSecondary;
  };

  if (!isParent) {
    return (
      <View style={styles.accessDenied}>
        <Ionicons name="lock-closed" size={64} color={colors.textTertiary} />
        <Text style={styles.accessDeniedTitle}>Parent Access Only</Text>
        <Text style={styles.accessDeniedText}>
          This feature is only available for parent accounts.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      <View style={styles.content}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statBadge, { backgroundColor: tints.amber }]}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {stats.pendingCount}
              </Text>
            </View>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statBadge, { backgroundColor: tints.green }]}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {stats.approvedCount}
              </Text>
            </View>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statBadge, { backgroundColor: tints.red }]}>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {stats.rejectedCount}
              </Text>
            </View>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'pending' && styles.tabTextActive,
              ]}
            >
              Pending ({stats.pendingCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.tabTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'pending' ? (
          <View>
            {/* Bulk Approve Button */}
            {pendingGrades.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.bulkApproveButton,
                  isBulkApproving && styles.buttonDisabled,
                ]}
                onPress={handleBulkApprove}
                disabled={isBulkApproving}
              >
                {isBulkApproving ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color={colors.textInverse} />
                    <Text style={styles.bulkApproveText}>Approve All</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Pending Grades by Student */}
            {Object.entries(pendingByStudent).length > 0 ? (
              Object.entries(pendingByStudent).map(([studentName, studentGrades]) => (
                <View key={studentName} style={styles.studentSection}>
                  <View style={styles.studentHeader}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentInitial}>
                        {studentName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.studentName}>{studentName}</Text>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>
                        {studentGrades.length} pending
                      </Text>
                    </View>
                  </View>

                  {studentGrades.map((grade) => (
                    <GradeCard
                      key={grade.id}
                      grade={grade}
                      onApprove={() => handleApprove(grade)}
                      onReject={() => openRejectModal(grade)}
                      isApproving={isApproving}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                      getGradeColor={getGradeColor}
                      colors={colors}
                      styles={styles}
                    />
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptyText}>
                  No pending grades to review.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.historyList}>
            {reviewedGrades.length > 0 ? (
              reviewedGrades.map((grade) => (
                <HistoryCard
                  key={grade.id}
                  grade={grade}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  getGradeColor={getGradeColor}
                  colors={colors}
                  styles={styles}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="time-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No History</Text>
                <Text style={styles.emptyText}>
                  Recently reviewed grades will appear here.
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </View>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Grade</Text>
            {selectedGrade && (
              <View style={styles.gradePreview}>
                <Text style={styles.gradePreviewSubject}>
                  {selectedGrade.subject}
                </Text>
                <View
                  style={[
                    styles.gradeBadgeSmall,
                    { backgroundColor: getGradeColor(selectedGrade.grade) },
                  ]}
                >
                  <Text style={styles.gradeBadgeTextSmall}>
                    {selectedGrade.grade}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reason (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={rejectNotes}
                onChangeText={setRejectNotes}
                placeholder="Why is this grade being rejected?"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setSelectedGrade(null);
                  setRejectNotes('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectButton, isRejecting && styles.buttonDisabled]}
                onPress={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.rejectButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Grade Card Component
function GradeCard({
  grade,
  onApprove,
  onReject,
  isApproving,
  formatDate,
  formatCurrency,
  getGradeColor,
  colors,
  styles,
}: {
  grade: PendingGrade;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  getGradeColor: (grade: string) => string;
  colors: ThemeColors;
  styles: any;
}) {
  return (
    <View style={styles.gradeCard}>
      <View style={styles.gradeHeader}>
        <View style={styles.gradeInfo}>
          <Text style={styles.gradeSubject}>{grade.subject}</Text>
          <Text style={styles.gradeDate}>
            Submitted {formatDate(grade.submitted_at)}
          </Text>
        </View>
        <View
          style={[styles.gradeBadge, { backgroundColor: getGradeColor(grade.grade) }]}
        >
          <Text style={styles.gradeBadgeText}>{grade.grade}</Text>
        </View>
      </View>

      <View style={styles.gradeDetails}>
        <Text style={styles.gradeReward}>
          Reward: {formatCurrency(grade.base_amount)}
        </Text>
      </View>

      <View style={styles.gradeActions}>
        <TouchableOpacity
          style={[styles.approveButton, isApproving && styles.buttonDisabled]}
          onPress={onApprove}
          disabled={isApproving}
        >
          <Ionicons name="checkmark" size={20} color={colors.textInverse} />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectCardButton} onPress={onReject}>
          <Ionicons name="close" size={20} color={colors.error} />
          <Text style={styles.rejectCardButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// History Card Component
function HistoryCard({
  grade,
  formatDate,
  formatCurrency,
  getGradeColor,
  colors,
  styles,
}: {
  grade: PendingGrade;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  getGradeColor: (grade: string) => string;
  colors: ThemeColors;
  styles: any;
}) {
  const isApproved = grade.status === 'approved';

  return (
    <View style={[styles.historyCard, !isApproved && styles.rejectedCard]}>
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyStudent}>{grade.student_name}</Text>
          <Text style={styles.historySubject}>{grade.subject}</Text>
        </View>
        <View style={styles.historyRight}>
          <View
            style={[styles.gradeBadge, { backgroundColor: getGradeColor(grade.grade) }]}
          >
            <Text style={styles.gradeBadgeText}>{grade.grade}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isApproved ? styles.approvedBadge : styles.rejectedBadge,
            ]}
          >
            <Ionicons
              name={isApproved ? 'checkmark' : 'close'}
              size={12}
              color={isApproved ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.statusBadgeText,
                isApproved ? styles.approvedText : styles.rejectedText,
              ]}
            >
              {isApproved ? 'Approved' : 'Rejected'}
            </Text>
          </View>
        </View>
      </View>

      {grade.parent_notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{grade.parent_notes}</Text>
        </View>
      )}
    </View>
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
    },
    accessDenied: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      padding: spacing[8],
    },
    accessDeniedTitle: {
      ...textStyles.h3,
      color: colors.text,
      marginTop: spacing[4],
    },
    accessDeniedText: {
      ...textStyles.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing[2],
    },
    backButton: {
      marginTop: spacing[6],
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[3],
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      minHeight: 44,
      justifyContent: 'center',
    },
    backButtonText: {
      ...textStyles.button,
      color: colors.textInverse,
    },
    content: {
      padding: layout.screenPaddingHorizontal,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing[5],
    },
    statItem: {
      alignItems: 'center',
    },
    statBadge: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing[2],
    },
    statValue: {
      ...textStyles.metric,
    },
    statLabel: {
      ...textStyles.caption,
      color: colors.textSecondary,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing[1],
      marginBottom: spacing[5],
    },
    tab: {
      flex: 1,
      paddingVertical: spacing[3],
      alignItems: 'center',
      borderRadius: borderRadius.md,
      minHeight: 44,
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      ...textStyles.label,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.textInverse,
    },
    bulkApproveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success,
      padding: spacing[3.5],
      borderRadius: borderRadius.lg,
      marginBottom: spacing[5],
      gap: spacing[2],
      minHeight: 48,
    },
    bulkApproveText: {
      ...textStyles.button,
      color: colors.textInverse,
    },
    studentSection: {
      marginBottom: spacing[6],
    },
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    studentAvatar: {
      width: sizing.avatarMd,
      height: sizing.avatarMd,
      borderRadius: sizing.avatarMd / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    studentInitial: {
      ...textStyles.h4,
      color: colors.textInverse,
    },
    studentName: {
      ...textStyles.h4,
      color: colors.text,
      marginLeft: spacing[3],
      flex: 1,
    },
    pendingBadge: {
      backgroundColor: tints.amber,
      paddingHorizontal: spacing[2.5],
      paddingVertical: spacing[1],
      borderRadius: borderRadius.lg,
    },
    pendingBadgeText: {
      ...textStyles.caption,
      fontWeight: '600',
      color: colors.warning,
    },
    gradeCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: layout.cardPadding,
      marginBottom: spacing[3],
      ...shadows.sm,
    },
    gradeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing[3],
    },
    gradeInfo: {},
    gradeSubject: {
      ...textStyles.body,
      fontWeight: '600',
      color: colors.text,
    },
    gradeDate: {
      ...textStyles.caption,
      color: colors.textSecondary,
      marginTop: spacing[0.5],
    },
    gradeBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1.5],
      borderRadius: borderRadius.md,
    },
    gradeBadgeText: {
      ...textStyles.body,
      fontWeight: '700',
      color: colors.textInverse,
    },
    gradeBadgeSmall: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: borderRadius.sm,
    },
    gradeBadgeTextSmall: {
      ...textStyles.label,
      fontWeight: '700',
      color: colors.textInverse,
    },
    gradeDetails: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing[3],
      marginBottom: spacing[3],
    },
    gradeReward: {
      ...textStyles.bodySmall,
      color: colors.textSecondary,
    },
    gradeActions: {
      flexDirection: 'row',
      gap: spacing[3],
    },
    approveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success,
      padding: spacing[3],
      borderRadius: borderRadius.md,
      gap: spacing[1.5],
      minHeight: 44,
    },
    approveButtonText: {
      ...textStyles.label,
      color: colors.textInverse,
    },
    rejectCardButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tints.red,
      padding: spacing[3],
      borderRadius: borderRadius.md,
      gap: spacing[1.5],
      minHeight: 44,
    },
    rejectCardButtonText: {
      ...textStyles.label,
      color: colors.error,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing[10],
      alignItems: 'center',
      ...shadows.md,
    },
    emptyTitle: {
      ...textStyles.h3,
      color: colors.text,
      marginTop: spacing[4],
    },
    emptyText: {
      ...textStyles.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing[2],
    },
    historyList: {
      gap: spacing[3],
    },
    historyCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: layout.cardPadding,
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    rejectedCard: {
      borderLeftColor: colors.error,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    historyInfo: {},
    historyStudent: {
      ...textStyles.bodySmall,
      fontWeight: '600',
      color: colors.primary,
    },
    historySubject: {
      ...textStyles.body,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing[0.5],
    },
    historyRight: {
      alignItems: 'flex-end',
      gap: spacing[2],
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: borderRadius.sm,
      gap: spacing[1],
    },
    approvedBadge: {
      backgroundColor: tints.green,
    },
    rejectedBadge: {
      backgroundColor: tints.red,
    },
    statusBadgeText: {
      ...textStyles.caption,
      fontWeight: '600',
    },
    approvedText: {
      color: colors.success,
    },
    rejectedText: {
      color: colors.error,
    },
    notesSection: {
      marginTop: spacing[3],
      paddingTop: spacing[3],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    notesLabel: {
      ...textStyles.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing[1],
    },
    notesText: {
      ...textStyles.bodySmall,
      color: colors.text,
      fontStyle: 'italic',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: layout.modalPadding,
      width: screenWidth - 48,
      maxWidth: 400,
    },
    modalTitle: {
      ...textStyles.h3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing[4],
    },
    gradePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[3],
      marginBottom: spacing[5],
    },
    gradePreviewSubject: {
      ...textStyles.body,
      fontWeight: '600',
      color: colors.text,
    },
    inputContainer: {
      marginBottom: spacing[5],
    },
    inputLabel: {
      ...textStyles.label,
      color: colors.text,
      marginBottom: spacing[2],
    },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: borderRadius.lg,
      padding: spacing[3.5],
      ...textStyles.body,
      color: colors.text,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing[3],
    },
    cancelButton: {
      flex: 1,
      padding: spacing[3.5],
      borderRadius: borderRadius.lg,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    cancelButtonText: {
      ...textStyles.button,
      color: colors.textSecondary,
    },
    rejectButton: {
      flex: 1,
      padding: spacing[3.5],
      borderRadius: borderRadius.lg,
      backgroundColor: colors.error,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    rejectButtonText: {
      ...textStyles.button,
      color: colors.textInverse,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });
}
