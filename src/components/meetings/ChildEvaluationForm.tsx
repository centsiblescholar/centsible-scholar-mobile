import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { EVALUATION_CATEGORIES, EvaluationInput, calculateTotalScore, MAX_TOTAL_SCORE } from '../../types/family-meeting';

interface Props {
  studentName: string;
  onSubmit: (input: EvaluationInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ChildEvaluationForm({ studentName, onSubmit, onCancel, isSubmitting }: Props) {
  const { colors } = useTheme();
  const [ratings, setRatings] = useState<EvaluationInput>({
    express_complaints: -1,
    parents_listened: -1,
    parents_asked_questions: -1,
    liked_meeting: -1,
  });

  const setRating = (key: keyof EvaluationInput, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const allRated = Object.values(ratings).every((v) => v >= 0);
  const totalScore = allRated ? calculateTotalScore(ratings) : null;

  const handleSubmit = () => {
    if (allRated) {
      onSubmit(ratings);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{studentName}'s Evaluation</Text>
      </View>

      <Text style={styles.subtitle}>
        Let {studentName} rate the meeting on each category (0-3)
      </Text>

      {EVALUATION_CATEGORIES.map((category) => (
        <View key={category.key} style={styles.categoryCard}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <View style={styles.optionsRow}>
            {category.options.map((option) => {
              const isSelected = ratings[category.key] === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, isSelected && styles.optionButtonActive]}
                  onPress={() => setRating(category.key, option.value)}
                >
                  <Text style={[styles.optionValue, isSelected && styles.optionValueActive]}>
                    {option.value}
                  </Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {totalScore !== null && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Total Score</Text>
          <Text style={styles.scoreValue}>
            {totalScore}/{MAX_TOTAL_SCORE}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!allRated || isSubmitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!allRated || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
            <Text style={styles.submitButtonText}>Submit Evaluation</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    backButton: { padding: 4, minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: colors.text, flex: 1 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
    categoryCard: {
      backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    categoryLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    categoryDescription: { fontSize: 13, color: colors.textTertiary, marginBottom: 12 },
    optionsRow: { flexDirection: 'row', gap: 8 },
    optionButton: {
      flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
      backgroundColor: colors.backgroundSecondary, minHeight: 56, justifyContent: 'center',
    },
    optionButtonActive: { backgroundColor: colors.primary },
    optionValue: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
    optionValueActive: { color: colors.textInverse },
    optionLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
    optionLabelActive: { color: colors.textInverse },
    scoreCard: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.primary + '11', borderRadius: 12, padding: 16, marginBottom: 16,
    },
    scoreLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
    scoreValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
    submitButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.success, padding: 16, borderRadius: 12, minHeight: 52,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { fontSize: 16, fontWeight: '700', color: colors.textInverse },
  });
}
