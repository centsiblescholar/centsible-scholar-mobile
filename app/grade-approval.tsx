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
import { format, parseISO } from 'date-fns';
import { useGradeApproval, PendingGrade } from '../src/hooks/useGradeApproval';
import { useUserProfile } from '../src/hooks/useUserProfile';

const screenWidth = Dimensions.get('window').width;

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10B981',
  'A': '#10B981',
  'A-': '#34D399',
  'B+': '#3B82F6',
  'B': '#3B82F6',
  'B-': '#60A5FA',
  'C+': '#F59E0B',
  'C': '#F59E0B',
  'C-': '#FBBF24',
  'D+': '#F97316',
  'D': '#F97316',
  'D-': '#FB923C',
  'F': '#EF4444',
};

export default function GradeApprovalScreen() {
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

  const getGradeColor = (grade: string) => GRADE_COLORS[grade] || '#6B7280';

  if (!isParent) {
    return (
      <View style={styles.accessDenied}>
        <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
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
        <ActivityIndicator size="large" color="#4F46E5" />
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
            <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.statValue, { color: '#D97706' }]}>
                {stats.pendingCount}
              </Text>
            </View>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statBadge, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.statValue, { color: '#059669' }]}>
                {stats.approvedCount}
              </Text>
            </View>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                    <Text style={styles.bulkApproveText}>Approve All</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Pending Grades by Student */}
            {Object.entries(pendingByStudent).length > 0 ? (
              Object.entries(pendingByStudent).map(([studentName, grades]) => (
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
                        {grades.length} pending
                      </Text>
                    </View>
                  </View>

                  {grades.map((grade) => (
                    <GradeCard
                      key={grade.id}
                      grade={grade}
                      onApprove={() => handleApprove(grade)}
                      onReject={() => openRejectModal(grade)}
                      isApproving={isApproving}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                      getGradeColor={getGradeColor}
                    />
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
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
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="time-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No History</Text>
                <Text style={styles.emptyText}>
                  Recently reviewed grades will appear here.
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
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
                  <ActivityIndicator size="small" color="#fff" />
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
}: {
  grade: PendingGrade;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  getGradeColor: (grade: string) => string;
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
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectCardButton} onPress={onReject}>
          <Ionicons name="close" size={20} color="#EF4444" />
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
}: {
  grade: PendingGrade;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  getGradeColor: (grade: string) => string;
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
              color={isApproved ? '#059669' : '#DC2626'}
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
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 32,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  bulkApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  bulkApproveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  studentSection: {
    marginBottom: 24,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  gradeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gradeInfo: {},
  gradeSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  gradeDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradeBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  gradeBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeBadgeTextSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  gradeDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 12,
  },
  gradeReward: {
    fontSize: 14,
    color: '#6B7280',
  },
  gradeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectCardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  rejectCardButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  rejectedCard: {
    borderLeftColor: '#EF4444',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyInfo: {},
  historyStudent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  historySubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  approvedBadge: {
    backgroundColor: '#D1FAE5',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approvedText: {
    color: '#059669',
  },
  rejectedText: {
    color: '#DC2626',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    fontStyle: 'italic',
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
    marginBottom: 16,
  },
  gradePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  gradePreviewSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  inputContainer: {
    marginBottom: 20,
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
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  rejectButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
