import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { ChildEvaluationForm } from './ChildEvaluationForm';
import { StudentInfo } from '../../hooks/useParentStudents';
import { EvaluationInput, ChildEvaluation } from '../../types/family-meeting';

interface Props {
  students: StudentInfo[];
  meetingId: string;
  evaluations: ChildEvaluation[];
  initialNotes?: string;
  onComplete: (notes: string, gratitude: string) => void;
  onSubmitEvaluation: (studentUserId: string, input: EvaluationInput) => void;
  isSubmittingEvaluation: boolean;
}

export function MeetingStep6Closing({
  students,
  meetingId,
  evaluations,
  initialNotes,
  onComplete,
  onSubmitEvaluation,
  isSubmittingEvaluation,
}: Props) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState(initialNotes || '');
  const [gratitude, setGratitude] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluatingStudent, setEvaluatingStudent] = useState<StudentInfo | null>(null);

  const hasStudentEvaluated = (studentUserId: string) =>
    evaluations.some((e) => e.student_user_id === studentUserId);

  const handleStartEvaluation = (student: StudentInfo) => {
    setEvaluatingStudent(student);
    setShowEvaluation(true);
  };

  const handleSubmitEvaluation = (input: EvaluationInput) => {
    if (evaluatingStudent) {
      onSubmitEvaluation(evaluatingStudent.user_id, input);
      setShowEvaluation(false);
      setEvaluatingStudent(null);
    }
  };

  const styles = createStyles(colors);

  if (showEvaluation && evaluatingStudent) {
    return (
      <ChildEvaluationForm
        studentName={evaluatingStudent.name}
        onSubmit={handleSubmitEvaluation}
        onCancel={() => {
          setShowEvaluation(false);
          setEvaluatingStudent(null);
        }}
        isSubmitting={isSubmittingEvaluation}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        End with gratitude and let each child evaluate the meeting.
      </Text>

      {/* Gratitude */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Gratitude</Text>
        <TextInput
          style={styles.input}
          value={gratitude}
          onChangeText={setGratitude}
          placeholder="What is everyone grateful for today?"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Child Evaluations */}
      {students.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Child Evaluations</Text>
          <Text style={styles.evalDescription}>
            Each child rates the meeting on 4 categories (0-3 scale)
          </Text>
          {students.map((student) => {
            const evaluated = hasStudentEvaluated(student.user_id);
            const evaluation = evaluations.find((e) => e.student_user_id === student.user_id);

            return (
              <View key={student.user_id} style={styles.studentEvalCard}>
                <View style={styles.studentEvalInfo}>
                  <Ionicons
                    name={evaluated ? 'checkmark-circle' : 'person-circle-outline'}
                    size={28}
                    color={evaluated ? colors.success : colors.textTertiary}
                  />
                  <View>
                    <Text style={styles.studentName}>{student.name}</Text>
                    {evaluated && evaluation && (
                      <Text style={styles.studentScore}>
                        Score: {evaluation.total_score}/12
                      </Text>
                    )}
                  </View>
                </View>
                {!evaluated ? (
                  <TouchableOpacity
                    style={styles.evalButton}
                    onPress={() => handleStartEvaluation(student)}
                  >
                    <Text style={styles.evalButtonText}>Evaluate</Text>
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Closing Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Closing Notes</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any final thoughts or reminders..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={2}
        />
      </View>

      <TouchableOpacity
        style={styles.finishButton}
        onPress={() => onComplete(notes, gratitude)}
      >
        <Ionicons name="star" size={20} color={colors.textInverse} />
        <Text style={styles.finishButtonText}>Complete Meeting</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    instruction: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
    evalDescription: { fontSize: 13, color: colors.textTertiary, marginBottom: 12 },
    input: {
      backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder,
      borderRadius: 12, padding: 14, fontSize: 16, color: colors.text,
      minHeight: 60, textAlignVertical: 'top',
    },
    studentEvalCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    studentEvalInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    studentName: { fontSize: 15, fontWeight: '600', color: colors.text },
    studentScore: { fontSize: 12, color: colors.success, marginTop: 2 },
    evalButton: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
      backgroundColor: colors.primary, minHeight: 36, justifyContent: 'center',
    },
    evalButtonText: { fontSize: 13, fontWeight: '600', color: colors.textInverse },
    finishButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.success, padding: 16, borderRadius: 12, minHeight: 52,
    },
    finishButtonText: { fontSize: 16, fontWeight: '700', color: colors.textInverse },
  });
}
