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
  Dimensions,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useStudentGrades } from '../../src/hooks/useStudentGrades';
import { GRADE_MULTIPLIERS } from '../../src/shared/calculations/constants';

const screenWidth = Dimensions.get('window').width;

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;

export default function GradesScreen() {
  const { user } = useAuth();
  const { selectedStudent, isParentView } = useStudent();

  // Use selected student's ID for parents, own ID for students
  const targetUserId = isParentView ? selectedStudent?.id : user?.id;

  const { grades, gradeEntries, totalReward, gpa, isLoading, submitGrade, isSubmitting, refetch } = useStudentGrades(targetUserId);

  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [baseAmount, setBaseAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grades' | 'analytics'>('grades');

  // Calculate grade distribution for pie chart
  const getGradeDistribution = () => {
    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradeEntries.forEach((entry) => {
      if (distribution[entry.grade] !== undefined) {
        distribution[entry.grade]++;
      }
    });

    return Object.entries(distribution)
      .filter(([_, count]) => count > 0)
      .map(([grade, count]) => ({
        name: grade,
        count,
        color: getGradeColor(grade),
        legendFontColor: '#374151',
        legendFontSize: 12,
      }));
  };

  // Calculate earnings by subject for bar chart
  const getSubjectEarnings = () => {
    const subjects: Record<string, number> = {};
    gradeEntries.forEach((entry) => {
      if (subjects[entry.className]) {
        subjects[entry.className] += entry.rewardAmount;
      } else {
        subjects[entry.className] = entry.rewardAmount;
      }
    });

    const sorted = Object.entries(subjects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      labels: sorted.map(([name]) => name.length > 8 ? name.substring(0, 8) + '...' : name),
      data: sorted.map(([_, amount]) => amount),
    };
  };

  const gradeDistribution = getGradeDistribution();
  const subjectEarnings = getSubjectEarnings();

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

    const amount = parseFloat(baseAmount) || selectedStudent?.base_reward_amount || 50;

    try {
      await submitGrade({
        student_user_id: targetUserId!,
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

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grades' && styles.tabActive]}
            onPress={() => setActiveTab('grades')}
          >
            <Text style={[styles.tabText, activeTab === 'grades' && styles.tabTextActive]}>
              Grades
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
            {gradeEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Data Yet</Text>
                <Text style={styles.emptyDescription}>
                  Add grades to see your analytics
                </Text>
              </View>
            ) : (
              <>
                {/* Grade Distribution */}
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Grade Distribution</Text>
                  <Text style={styles.chartSubtitle}>{gradeEntries.length} grades total</Text>
                  {gradeDistribution.length > 0 && (
                    <PieChart
                      data={gradeDistribution}
                      width={screenWidth - 64}
                      height={180}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      }}
                      accessor="count"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  )}
                </View>

                {/* Earnings by Subject */}
                {subjectEarnings.labels.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Earnings by Subject</Text>
                    <Text style={styles.chartSubtitle}>Top subjects by reward</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <BarChart
                        data={{
                          labels: subjectEarnings.labels,
                          datasets: [{ data: subjectEarnings.data }],
                        }}
                        width={Math.max(screenWidth - 64, subjectEarnings.labels.length * 80)}
                        height={200}
                        yAxisLabel="$"
                        yAxisSuffix=""
                        chartConfig={{
                          backgroundColor: '#fff',
                          backgroundGradientFrom: '#fff',
                          backgroundGradientTo: '#fff',
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                          barPercentage: 0.7,
                        }}
                        style={{ marginVertical: 8, borderRadius: 16 }}
                        fromZero
                        showValuesOnTopOfBars
                      />
                    </ScrollView>
                  </View>
                )}

                {/* Summary Stats */}
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>Performance Summary</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statsGridItem}>
                      <Text style={styles.statsGridValue}>{gradeEntries.length}</Text>
                      <Text style={styles.statsGridLabel}>Total Grades</Text>
                    </View>
                    <View style={styles.statsGridItem}>
                      <Text style={styles.statsGridValue}>{gpa.toFixed(2)}</Text>
                      <Text style={styles.statsGridLabel}>GPA</Text>
                    </View>
                    <View style={styles.statsGridItem}>
                      <Text style={[styles.statsGridValue, styles.statsGridValueGreen]}>
                        {formatCurrency(totalReward)}
                      </Text>
                      <Text style={styles.statsGridLabel}>Total Earned</Text>
                    </View>
                    <View style={styles.statsGridItem}>
                      <Text style={styles.statsGridValue}>
                        {gradeEntries.length > 0
                          ? formatCurrency(totalReward / gradeEntries.length)
                          : '--'}
                      </Text>
                      <Text style={styles.statsGridLabel}>Avg/Grade</Text>
                    </View>
                  </View>
                </View>

                {/* Grade Breakdown */}
                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownTitle}>Grade Breakdown</Text>
                  {GRADES.map((g) => {
                    const count = gradeEntries.filter((e) => e.grade === g).length;
                    const percent = gradeEntries.length > 0 ? (count / gradeEntries.length) * 100 : 0;
                    return (
                      <View key={g} style={styles.breakdownRow}>
                        <View style={styles.breakdownLeft}>
                          <View style={[styles.breakdownBadge, { backgroundColor: getGradeColor(g) }]}>
                            <Text style={styles.breakdownGrade}>{g}</Text>
                          </View>
                          <Text style={styles.breakdownCount}>{count} grade{count !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.breakdownRight}>
                          <View style={styles.breakdownBarBg}>
                            <View
                              style={[
                                styles.breakdownBar,
                                { width: `${percent}%`, backgroundColor: getGradeColor(g) },
                              ]}
                            />
                          </View>
                          <Text style={styles.breakdownPercent}>{percent.toFixed(0)}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ) : (
          /* Grades List View */
          <>
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
          </>
        )}
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
                Base Amount (default: {formatCurrency(selectedStudent?.base_reward_amount || 50)})
              </Text>
              <TextInput
                style={styles.input}
                placeholder={`${selectedStudent?.base_reward_amount || 50}`}
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
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
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statsGridItem: {
    width: '50%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statsGridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsGridValueGreen: {
    color: '#10B981',
  },
  statsGridLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  breakdownBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  breakdownGrade: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  breakdownCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  breakdownRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    width: 36,
    textAlign: 'right',
  },
});
