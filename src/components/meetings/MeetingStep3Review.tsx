import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { MeetingGoal } from '../../types/family-meeting';

interface Props {
  activeGoals: MeetingGoal[];
  initialNotes?: string;
  initialReviewedGoals?: string[];
  onComplete: (notes: string, reviewedGoalIds: string[]) => void;
  onUpdateGoalStatus: (goalId: string, status: 'completed' | 'dropped') => void;
}

export function MeetingStep3Review({
  activeGoals,
  initialNotes,
  initialReviewedGoals,
  onComplete,
  onUpdateGoalStatus,
}: Props) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState(initialNotes || '');
  const [reviewedGoals, setReviewedGoals] = useState<Set<string>>(
    new Set(initialReviewedGoals || [])
  );

  const toggleGoalReviewed = (goalId: string) => {
    const next = new Set(reviewedGoals);
    if (next.has(goalId)) next.delete(goalId);
    else next.add(goalId);
    setReviewedGoals(next);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Review goals from the last meeting. How did everyone do?
      </Text>

      {activeGoals.length > 0 ? (
        <View style={styles.goalsList}>
          <Text style={styles.sectionLabel}>Active Goals</Text>
          {activeGoals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <TouchableOpacity
                style={styles.goalCheckbox}
                onPress={() => toggleGoalReviewed(goal.id)}
              >
                <Ionicons
                  name={reviewedGoals.has(goal.id) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={reviewedGoals.has(goal.id) ? colors.success : colors.textTertiary}
                />
              </TouchableOpacity>
              <View style={styles.goalContent}>
                <Text style={styles.goalText}>{goal.goal_text}</Text>
                {goal.specifics?.measurable && (
                  <Text style={styles.goalSpecific}>Target: {goal.specifics.measurable}</Text>
                )}
              </View>
              <View style={styles.goalActions}>
                <TouchableOpacity
                  style={styles.goalActionButton}
                  onPress={() => onUpdateGoalStatus(goal.id, 'completed')}
                >
                  <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.goalActionButton}
                  onPress={() => onUpdateGoalStatus(goal.id, 'dropped')}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="clipboard-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No active goals to review</Text>
          <Text style={styles.emptySubtext}>New goals can be set in the Planning step</Text>
        </View>
      )}

      <View style={styles.notesSection}>
        <Text style={styles.sectionLabel}>Review Notes</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did the family do on their goals?"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => onComplete(notes, Array.from(reviewedGoals))}
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
    goalsList: { marginBottom: 24 },
    goalCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    goalCheckbox: { marginRight: 12 },
    goalContent: { flex: 1 },
    goalText: { fontSize: 15, color: colors.text, lineHeight: 20 },
    goalSpecific: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
    goalActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
    goalActionButton: { padding: 4, minWidth: 30, minHeight: 30, alignItems: 'center', justifyContent: 'center' },
    emptyCard: {
      alignItems: 'center', padding: 24,
      backgroundColor: colors.backgroundSecondary, borderRadius: 12, marginBottom: 24,
    },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginTop: 12 },
    emptySubtext: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
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
