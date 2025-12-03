import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useStudentGrades } from '../../src/hooks/useStudentGrades';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { calculateAllocation } from '../../src/shared/calculations';

export default function DashboardScreen() {
  const { user } = useAuth();
  const {
    selectedStudent,
    setSelectedStudent,
    students,
    isLoading: studentsLoading,
    isParentView,
  } = useStudent();

  // For parents, use selected student's ID; for students, use their own ID
  const targetUserId = isParentView ? selectedStudent?.id : user?.id;

  const {
    gradeEntries,
    totalReward,
    gpa,
    isLoading: gradesLoading,
    refetch: refetchGrades,
  } = useStudentGrades(targetUserId);

  const {
    overallAverage,
    assessments,
    isLoading: behaviorLoading,
    refetch: refetchBehavior,
  } = useBehaviorAssessments(targetUserId);

  const [refreshing, setRefreshing] = useState(false);
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGrades(), refetchBehavior()]);
    setRefreshing(false);
  }, [refetchGrades, refetchBehavior]);

  const isLoading = studentsLoading || gradesLoading || behaviorLoading;

  // Calculate allocation breakdown
  const allocation = calculateAllocation(totalReward);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
      }
    >
      <View style={styles.header}>
        {isParentView && students.length > 1 ? (
          <TouchableOpacity
            style={styles.studentSelector}
            onPress={() => setStudentPickerVisible(true)}
          >
            <Text style={styles.greeting}>
              {selectedStudent?.name || 'Select Student'}
            </Text>
            <Text style={styles.selectorChevron}>▼</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.greeting}>
            Welcome{selectedStudent?.name ? `, ${selectedStudent.name.split(' ')[0]}` : ''}!
          </Text>
        )}
        <Text style={styles.email}>{user?.email}</Text>
        {selectedStudent?.grade_level && (
          <Text style={styles.gradeLevel}>Grade {selectedStudent.grade_level}</Text>
        )}
        {isParentView && (
          <View style={styles.parentBadge}>
            <Text style={styles.parentBadgeText}>Parent View</Text>
          </View>
        )}
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Rewards</Text>
          <Text style={styles.cardValue}>{formatCurrency(totalReward)}</Text>
          <Text style={styles.cardSubtitle}>
            {gradeEntries.length} grade{gradeEntries.length !== 1 ? 's' : ''} entered
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current GPA</Text>
          <Text style={styles.cardValue}>
            {gradeEntries.length > 0 ? gpa.toFixed(2) : '--'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {gradeEntries.length > 0 ? 'Based on grades' : 'No grades yet'}
          </Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Behavior Score</Text>
          <Text style={styles.cardValue}>
            {assessments.length > 0 ? overallAverage.toFixed(1) : '--'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Base Amount</Text>
          <Text style={styles.cardValue}>
            {selectedStudent?.base_reward_amount
              ? formatCurrency(selectedStudent.base_reward_amount)
              : '--'}
          </Text>
          <Text style={styles.cardSubtitle}>Per grade</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allocation Breakdown</Text>
        <View style={styles.allocationCard}>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Taxes (15%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.taxQualified.taxes)}</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Retirement (10%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.taxQualified.retirement)}</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Savings (25%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.savings)}</Text>
          </View>
          <View style={[styles.allocationRow, styles.allocationRowLast]}>
            <Text style={styles.allocationLabel}>Discretionary (50%)</Text>
            <Text style={styles.allocationValue}>{formatCurrency(allocation.discretionary)}</Text>
          </View>
          <View style={styles.allocationTotal}>
            <Text style={styles.allocationTotalLabel}>Total</Text>
            <Text style={styles.allocationTotalValue}>{formatCurrency(allocation.total)}</Text>
          </View>
        </View>
      </View>

      {gradeEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Grades</Text>
          <View style={styles.gradesCard}>
            {gradeEntries.slice(0, 5).map((grade) => (
              <View key={grade.id} style={styles.gradeRow}>
                <View>
                  <Text style={styles.gradeSubject}>{grade.className}</Text>
                  <Text style={styles.gradeBase}>Base: {formatCurrency(grade.baseAmount)}</Text>
                </View>
                <View style={styles.gradeRight}>
                  <Text style={[styles.gradeLetter, getGradeStyle(grade.grade)]}>{grade.grade}</Text>
                  <Text style={styles.gradeReward}>{formatCurrency(grade.rewardAmount)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Student Picker Modal */}
      <Modal
        visible={studentPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStudentPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Student</Text>
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.studentOption,
                    selectedStudent?.id === item.id && styles.studentOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedStudent(item);
                    setStudentPickerVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentGrade}>Grade {item.grade_level}</Text>
                  </View>
                  {selectedStudent?.id === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStudentPickerVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function getGradeStyle(grade: string) {
  switch (grade) {
    case 'A': return { color: '#10B981' };
    case 'B': return { color: '#3B82F6' };
    case 'C': return { color: '#F59E0B' };
    case 'D': return { color: '#F97316' };
    case 'F': return { color: '#EF4444' };
    default: return { color: '#6B7280' };
  }
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  studentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorChevron: {
    fontSize: 12,
    color: '#C7D2FE',
    marginLeft: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  gradeLevel: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 2,
  },
  parentBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  parentBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  cardsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  allocationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  allocationRowLast: {
    borderBottomWidth: 0,
  },
  allocationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  allocationTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#4F46E5',
  },
  allocationTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  allocationTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  gradesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  gradeSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  gradeBase: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  gradeRight: {
    alignItems: 'flex-end',
  },
  gradeLetter: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gradeReward: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  studentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  studentOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  studentGrade: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
