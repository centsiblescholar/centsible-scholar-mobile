import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { StudentInfo } from '../../hooks/useParentStudents';

interface Props {
  students: StudentInfo[];
  meetingId: string;
  initialNotes?: string;
  onComplete: (notes: string) => void;
  onCreateGoal: (goalText: string, studentUserId: string | null) => void;
}

export function MeetingStep5Planning({
  students,
  meetingId,
  initialNotes,
  onComplete,
  onCreateGoal,
}: Props) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState(initialNotes || '');
  const [newGoal, setNewGoal] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [addedGoals, setAddedGoals] = useState<Array<{ text: string; student: string | null }>>([]);

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      onCreateGoal(newGoal.trim(), selectedStudent);
      setAddedGoals((prev) => [...prev, { text: newGoal.trim(), student: selectedStudent }]);
      setNewGoal('');
      setSelectedStudent(null);
    }
  };

  const getStudentName = (userId: string | null) => {
    if (!userId) return 'Family';
    return students.find((s) => s.user_id === userId)?.name || 'Unknown';
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Set goals for the coming week. Make them specific, measurable, and achievable.
      </Text>

      {/* Add Goal Form */}
      <View style={styles.addGoalSection}>
        <Text style={styles.sectionLabel}>New Goal</Text>
        <TextInput
          style={styles.goalInput}
          value={newGoal}
          onChangeText={setNewGoal}
          placeholder="What goal should we work on?"
          placeholderTextColor={colors.textTertiary}
        />

        {students.length > 0 && (
          <View style={styles.studentSelector}>
            <Text style={styles.assignLabel}>Assign to:</Text>
            <View style={styles.studentChips}>
              <TouchableOpacity
                style={[styles.studentChip, selectedStudent === null && styles.studentChipActive]}
                onPress={() => setSelectedStudent(null)}
              >
                <Text style={[styles.chipText, selectedStudent === null && styles.chipTextActive]}>
                  Family
                </Text>
              </TouchableOpacity>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.user_id}
                  style={[styles.studentChip, selectedStudent === student.user_id && styles.studentChipActive]}
                  onPress={() => setSelectedStudent(student.user_id)}
                >
                  <Text style={[styles.chipText, selectedStudent === student.user_id && styles.chipTextActive]}>
                    {student.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.addGoalButton, !newGoal.trim() && styles.addGoalButtonDisabled]}
          onPress={handleAddGoal}
          disabled={!newGoal.trim()}
        >
          <Ionicons name="add-circle" size={20} color={colors.textInverse} />
          <Text style={styles.addGoalButtonText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Added Goals */}
      {addedGoals.length > 0 && (
        <View style={styles.addedGoalsSection}>
          <Text style={styles.sectionLabel}>Goals Added This Meeting</Text>
          {addedGoals.map((goal, index) => (
            <View key={index} style={styles.addedGoalCard}>
              <Ionicons name="flag" size={18} color={colors.primary} />
              <View style={styles.addedGoalContent}>
                <Text style={styles.addedGoalText}>{goal.text}</Text>
                <Text style={styles.addedGoalAssignee}>{getStudentName(goal.student)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.notesSection}>
        <Text style={styles.sectionLabel}>Planning Notes</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Plans for the upcoming week..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => onComplete(notes)}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    instruction: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
    addGoalSection: { marginBottom: 24 },
    goalInput: {
      backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder,
      borderRadius: 12, padding: 14, fontSize: 16, color: colors.text, marginBottom: 12, minHeight: 48,
    },
    studentSelector: { marginBottom: 12 },
    assignLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
    studentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    studentChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.backgroundSecondary, minHeight: 36, justifyContent: 'center',
    },
    studentChipActive: { backgroundColor: colors.primary },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: colors.textInverse },
    addGoalButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, padding: 12, borderRadius: 12, minHeight: 44,
    },
    addGoalButtonDisabled: { opacity: 0.5 },
    addGoalButtonText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
    addedGoalsSection: { marginBottom: 24 },
    addedGoalCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.primary + '11', borderRadius: 12, padding: 14, marginBottom: 8,
    },
    addedGoalContent: { flex: 1 },
    addedGoalText: { fontSize: 14, color: colors.text },
    addedGoalAssignee: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    notesSection: { marginBottom: 24 },
    input: {
      backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder,
      borderRadius: 12, padding: 14, fontSize: 16, color: colors.text,
      minHeight: 80, textAlignVertical: 'top',
    },
    nextButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, padding: 16, borderRadius: 12, minHeight: 52,
    },
    nextButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  });
}
