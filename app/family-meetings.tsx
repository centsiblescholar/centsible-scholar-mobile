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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format, addDays, addWeeks, parseISO } from 'date-fns';
import { useAuth } from '../src/contexts/AuthContext';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useFamilyMeetings, FamilyMeeting } from '../src/hooks/useFamilyMeetings';
import { useNotifications } from '../src/hooks/useNotifications';
import { useTheme, type ThemeColors } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

const screenWidth = Dimensions.get('window').width;

export default function FamilyMeetingsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isParent } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<FamilyMeeting | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 7));

  // Assessment state
  const [participation, setParticipation] = useState(4);
  const [goalProgress, setGoalProgress] = useState(4);
  const [communication, setCommunication] = useState(4);
  const [assessmentNotes, setAssessmentNotes] = useState('');

  const {
    nextMeeting,
    upcomingMeetings,
    completedMeetings,
    stats,
    isLoading,
    error,
    scheduleMeeting,
    completeMeeting,
    cancelMeeting,
    addAssessment,
    getAssessmentsForMeeting,
    refetch,
  } = useFamilyMeetings(user?.id);

  const { scheduleMeetingReminder, isEnabled: notificationsEnabled } = useNotifications();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleScheduleMeeting = async () => {
    try {
      const meeting = await scheduleMeeting(selectedDate, notes || undefined);

      // Schedule a reminder notification if enabled
      if (notificationsEnabled && meeting) {
        await scheduleMeetingReminder(meeting.id, selectedDate, 60); // 1 hour before
      }

      setShowScheduleModal(false);
      setNotes('');
      setSelectedDate(addDays(new Date(), 7));

      const message = notificationsEnabled
        ? 'Meeting scheduled! You\'ll receive a reminder 1 hour before.'
        : 'Meeting scheduled successfully!';
      Alert.alert('Success', message);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to schedule meeting');
    }
  };

  const handleCompleteMeeting = async (meeting: FamilyMeeting) => {
    Alert.alert(
      'Complete Meeting',
      'Mark this meeting as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeMeeting(meeting.id);
              Alert.alert('Success', 'Meeting marked as completed!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete meeting');
            }
          },
        },
      ]
    );
  };

  const handleCancelMeeting = async (meeting: FamilyMeeting) => {
    Alert.alert(
      'Cancel Meeting',
      'Are you sure you want to cancel this meeting?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMeeting(meeting.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel meeting');
            }
          },
        },
      ]
    );
  };

  const handleAddAssessment = async () => {
    if (!selectedMeeting) return;

    try {
      const overall = (participation + goalProgress + communication) / 3;
      await addAssessment(
        selectedMeeting.id,
        user?.id || '',
        'Self',
        {
          participation,
          goalProgress,
          communication,
          overall,
        },
        assessmentNotes || undefined
      );
      setShowAssessmentModal(false);
      resetAssessmentForm();
      Alert.alert('Success', 'Assessment submitted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit assessment');
    }
  };

  const resetAssessmentForm = () => {
    setParticipation(4);
    setGoalProgress(4);
    setCommunication(4);
    setAssessmentNotes('');
    setSelectedMeeting(null);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonList count={3} cardHeight={100} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorState message="Failed to load meetings" onRetry={refetch} />
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
        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.upcomingCount}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.averageAssessmentScore?.toFixed(1) || '-'}
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {/* Next Meeting Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Meeting</Text>
          {nextMeeting ? (
            <View style={styles.nextMeetingCard}>
              <View style={styles.nextMeetingHeader}>
                <Ionicons name="calendar" size={32} color={colors.primary} />
                <View style={styles.nextMeetingInfo}>
                  <Text style={styles.nextMeetingDate}>
                    {formatDate(nextMeeting.scheduledDate)}
                  </Text>
                  <Text style={styles.nextMeetingTime}>
                    {formatTime(nextMeeting.scheduledDate)}
                  </Text>
                </View>
              </View>
              {nextMeeting.notes && (
                <Text style={styles.meetingNotes}>{nextMeeting.notes}</Text>
              )}
              <View style={styles.nextMeetingActions}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleCompleteMeeting(nextMeeting)}
                >
                  <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
                {!isParent && (
                  <TouchableOpacity
                    style={styles.assessButton}
                    onPress={() => {
                      setSelectedMeeting(nextMeeting);
                      setShowAssessmentModal(true);
                    }}
                  >
                    <Ionicons name="clipboard" size={18} color={colors.primary} />
                    <Text style={styles.assessButtonText}>Self-Assess</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No upcoming meetings</Text>
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={() => setShowScheduleModal(true)}
              >
                <Text style={styles.scheduleButtonText}>Schedule Meeting</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Schedule New Meeting Button */}
        {nextMeeting && (
          <TouchableOpacity
            style={styles.addMeetingButton}
            onPress={() => setShowScheduleModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
            <Text style={styles.addMeetingButtonText}>Schedule New Meeting</Text>
          </TouchableOpacity>
        )}

        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Upcoming</Text>
            <View style={styles.meetingsList}>
              {upcomingMeetings.slice(1).map((meeting) => (
                <MeetingItem
                  key={meeting.id}
                  meeting={meeting}
                  onComplete={() => handleCompleteMeeting(meeting)}
                  onCancel={() => handleCancelMeeting(meeting)}
                  onAssess={() => {
                    setSelectedMeeting(meeting);
                    setShowAssessmentModal(true);
                  }}
                  isParent={isParent}
                  colors={colors}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        )}

        {/* Meeting History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting History</Text>
          {completedMeetings.length > 0 ? (
            <View style={styles.meetingsList}>
              {completedMeetings.map((meeting) => (
                <MeetingHistoryItem
                  key={meeting.id}
                  meeting={meeting}
                  assessments={getAssessmentsForMeeting(meeting.id)}
                  colors={colors}
                  styles={styles}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No meeting history yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </View>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Meeting</Text>

            <Text style={styles.inputLabel}>Select Date</Text>
            <View style={styles.datePresets}>
              {[
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 days', days: 3 },
                { label: 'Next week', days: 7 },
                { label: 'In 2 weeks', days: 14 },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.days}
                  style={[
                    styles.datePreset,
                    Math.floor((selectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) === preset.days &&
                      styles.datePresetActive,
                  ]}
                  onPress={() => setSelectedDate(addDays(new Date(), preset.days))}
                >
                  <Text
                    style={[
                      styles.datePresetText,
                      Math.floor((selectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) === preset.days &&
                        styles.datePresetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.selectedDateText}>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes or agenda items..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleScheduleMeeting}
              >
                <Text style={styles.confirmButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assessment Modal */}
      <Modal
        visible={showAssessmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAssessmentModal(false);
          resetAssessmentForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Self-Assessment</Text>
            <Text style={styles.modalSubtitle}>
              Rate your meeting participation
            </Text>

            <RatingInput label="Participation" value={participation} onChange={setParticipation} colors={colors} styles={styles} />
            <RatingInput label="Goal Progress" value={goalProgress} onChange={setGoalProgress} colors={colors} styles={styles} />
            <RatingInput label="Communication" value={communication} onChange={setCommunication} colors={colors} styles={styles} />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={assessmentNotes}
                onChangeText={setAssessmentNotes}
                placeholder="How did the meeting go?"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAssessmentModal(false);
                  resetAssessmentForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddAssessment}
              >
                <Text style={styles.confirmButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Rating Input Component
function RatingInput({ label, value, onChange, colors, styles }: { label: string; value: number; onChange: (value: number) => void; colors: ThemeColors; styles: any }) {
  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.ratingButtons}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[styles.ratingButton, value === rating && styles.ratingButtonActive]}
            onPress={() => onChange(rating)}
          >
            <Text style={[styles.ratingButtonText, value === rating && styles.ratingButtonTextActive]}>
              {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Meeting Item Component
function MeetingItem({ meeting, onComplete, onCancel, onAssess, isParent, colors, styles }: { meeting: FamilyMeeting; onComplete: () => void; onCancel: () => void; onAssess: () => void; isParent: boolean; colors: ThemeColors; styles: any }) {
  return (
    <View style={styles.meetingItem}>
      <View style={styles.meetingItemHeader}>
        <View>
          <Text style={styles.meetingItemDate}>{format(parseISO(meeting.scheduledDate), 'MMM d, yyyy')}</Text>
          <Text style={styles.meetingItemTime}>{format(parseISO(meeting.scheduledDate), 'h:mm a')}</Text>
        </View>
        <View style={styles.meetingItemActions}>
          <TouchableOpacity onPress={onComplete} style={styles.iconButton}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
          </TouchableOpacity>
          {!isParent && (
            <TouchableOpacity onPress={onAssess} style={styles.iconButton}>
              <Ionicons name="clipboard-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onCancel} style={styles.iconButton}>
            <Ionicons name="close-circle-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      {meeting.notes && <Text style={styles.meetingItemNotes}>{meeting.notes}</Text>}
    </View>
  );
}

// Meeting History Item Component
function MeetingHistoryItem({ meeting, assessments, colors, styles }: { meeting: FamilyMeeting; assessments: any[]; colors: ThemeColors; styles: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity style={styles.historyItem} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={styles.historyItemHeader}>
        <View style={styles.historyItemInfo}>
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark" size={12} color={colors.success} />
          </View>
          <View>
            <Text style={styles.historyItemDate}>{format(parseISO(meeting.scheduledDate), 'MMM d, yyyy')}</Text>
            {meeting.attendees && meeting.attendees.length > 0 && (
              <Text style={styles.attendeesText}>{meeting.attendees.length} attendee(s)</Text>
            )}
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </View>

      {expanded && (
        <View style={styles.historyDetails}>
          {meeting.notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailText}>{meeting.notes}</Text>
            </View>
          )}
          {assessments.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Assessments</Text>
              {assessments.map((assessment, index) => (
                <View key={index} style={styles.assessmentItem}>
                  <Text style={styles.assessmentName}>{assessment.studentName}</Text>
                  <Text style={styles.assessmentScore}>Overall: {assessment.ratings.overall.toFixed(1)}/5</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary, padding: 16 },
    content: { padding: 16 },
    statsRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: colors.border },
    statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
    nextMeetingCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    nextMeetingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    nextMeetingInfo: { marginLeft: 16 },
    nextMeetingDate: { fontSize: 20, fontWeight: '700', color: colors.text },
    nextMeetingTime: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    meetingNotes: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, fontStyle: 'italic' },
    nextMeetingActions: { flexDirection: 'row', gap: 12 },
    completeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, padding: 12, borderRadius: 10, gap: 8, minHeight: 44 },
    completeButtonText: { color: colors.textInverse, fontSize: 14, fontWeight: '600' },
    assessButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, padding: 12, borderRadius: 10, gap: 8, minHeight: 44 },
    assessButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    emptyCard: { backgroundColor: colors.card, borderRadius: 16, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12, marginBottom: 16 },
    scheduleButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' },
    scheduleButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
    addMeetingButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: 16, borderRadius: 12, marginBottom: 24, gap: 8, minHeight: 48 },
    addMeetingButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
    meetingsList: { gap: 12 },
    meetingItem: { backgroundColor: colors.card, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    meetingItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    meetingItemDate: { fontSize: 16, fontWeight: '600', color: colors.text },
    meetingItemTime: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    meetingItemActions: { flexDirection: 'row', gap: 8 },
    iconButton: { padding: 4, minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
    meetingItemNotes: { fontSize: 14, color: colors.textSecondary, marginTop: 12, fontStyle: 'italic' },
    historyItem: { backgroundColor: colors.card, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    historyItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    completedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.success + '22', alignItems: 'center', justifyContent: 'center' },
    historyItemDate: { fontSize: 16, fontWeight: '600', color: colors.text },
    attendeesText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    historyDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    detailSection: { marginBottom: 12 },
    detailLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    detailText: { fontSize: 14, color: colors.text },
    assessmentItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.backgroundSecondary },
    assessmentName: { fontSize: 14, color: colors.text },
    assessmentScore: { fontSize: 14, fontWeight: '600', color: colors.primary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.card, borderRadius: 16, padding: 24, width: screenWidth - 48, maxWidth: 400, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 14, fontSize: 16, color: colors.text },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    datePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    datePreset: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.backgroundSecondary, minHeight: 44, justifyContent: 'center' },
    datePresetActive: { backgroundColor: colors.primary },
    datePresetText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    datePresetTextActive: { color: colors.textInverse },
    selectedDateText: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 24 },
    ratingContainer: { marginBottom: 20 },
    ratingLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    ratingButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    ratingButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.backgroundSecondary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
    ratingButtonActive: { backgroundColor: colors.primary },
    ratingButtonText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
    ratingButtonTextActive: { color: colors.textInverse },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.backgroundSecondary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
    confirmButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
    confirmButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  });
}
