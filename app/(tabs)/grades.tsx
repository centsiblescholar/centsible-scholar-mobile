import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudentGrades } from '../../src/hooks/useStudentGrades';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { GRADE_MULTIPLIERS } from '../../src/shared/calculations/constants';

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;

export default function GradesScreen() {
  const { user } = useAuth();
  const { profile } = useStudentProfile();
  const { grades, gradeEntries, totalReward, gpa, isLoading, submitGrade, isSubmitting, refetch } = useStudentGrades();

  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [baseAmount, setBaseAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }
    if (!selectedGrade) {
      Alert.alert('Error', 'Please select a grade');
      return;
    }

    const amount = parseFloat(baseAmount) || profile?.base_reward_amount || 50;

    try {
      await submitGrade({
        student_user_id: user!.id,
        subject: subject.trim(),
        grade: selectedGrade,
        base_amount: amount,
      });

      Alert.alert('Success', 'Grade submitted successfully!');
      setModalVisible(false);
      setSubject('');
      setSelectedGrade('');
      setBaseAmount('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit grade');
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10B981';
      case 'B': return '#3B82F6';
      case 'C': return '#F59E0B';
      case 'D': return '#F97316';
      case 'F': return '#EF4444';
      default: return '#6B7280';
    }
  };

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
        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Rewards</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalReward)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>GPA</Text>
            <Text style={styles.summaryValue}>{gradeEntries.length > 0 ? gpa.toFixed(2) : '--'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Grades</Text>

          {gradeEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No grades yet</Text>
              <Text style={styles.emptyDescription}>
                Tap the button below to add your first grade and start earning rewards!
              </Text>
            </View>
          ) : (
            <View style={styles.gradesList}>
              {gradeEntries.map((grade) => (
                <View key={grade.id} style={styles.gradeCard}>
                  <View style={styles.gradeInfo}>
                    <Text style={styles.gradeSubject}>{grade.className}</Text>
                    <Text style={styles.gradeBase}>Base: {formatCurrency(grade.baseAmount)}</Text>
                  </View>
                  <View style={styles.gradeRight}>
                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(grade.grade) }]}>
                      <Text style={styles.gradeLetter}>{grade.grade}</Text>
                    </View>
                    <Text style={styles.gradeReward}>{formatCurrency(grade.rewardAmount)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.rewardScale}>
          <Text style={styles.scaleTitle}>Reward Scale</Text>
          <View style={styles.scaleRow}>
            {GRADES.map((g) => (
              <View key={g} style={styles.scaleItem}>
                <View style={[styles.scaleBadge, { backgroundColor: getGradeColor(g) }]}>
                  <Text style={styles.scaleGrade}>{g}</Text>
                </View>
                <Text style={styles.scalePercent}>{(GRADE_MULTIPLIERS[g] * 100).toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Grade</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Grade</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Math, English, Science"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grade</Text>
              <View style={styles.gradeSelector}>
                {GRADES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.gradeOption,
                      selectedGrade === g && { backgroundColor: getGradeColor(g) },
                    ]}
                    onPress={() => setSelectedGrade(g)}
                  >
                    <Text
                      style={[
                        styles.gradeOptionText,
                        selectedGrade === g && styles.gradeOptionTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Base Amount (default: {formatCurrency(profile?.base_reward_amount || 50)})
              </Text>
              <TextInput
                style={styles.input}
                placeholder={`${profile?.base_reward_amount || 50}`}
                value={baseAmount}
                onChangeText={setBaseAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  scrollView: {
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#C7D2FE',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
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
  gradesList: {
    gap: 8,
  },
  gradeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeSubject: {
    fontSize: 16,
    fontWeight: '600',
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
  gradeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  gradeReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  rewardScale: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  scaleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scaleItem: {
    alignItems: 'center',
  },
  scaleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleGrade: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  scalePercent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
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
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  gradeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  gradeOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  gradeOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
