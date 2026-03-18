import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import {
  ChildEvaluation,
  MeetingGoal,
  MeetingConflict,
  calculateScorePercentage,
  getScoreLabel,
  getScoreColor,
  MAX_TOTAL_SCORE,
  calculateAverageEvaluation,
} from '../../types/family-meeting';

interface Props {
  evaluations: ChildEvaluation[];
  activeGoals: MeetingGoal[];
  conflicts: MeetingConflict[];
  onStartNew: () => void;
}

export function MeetingCompletedCard({ evaluations, activeGoals, conflicts, onStartNew }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const avg = calculateAverageEvaluation(evaluations);
  const avgPct = avg !== null ? calculateScorePercentage(Math.round(avg)) : null;

  const completedGoals = activeGoals.filter((g) => g.status === 'completed' || g.status === 'achieved');
  const resolvedConflicts = conflicts.filter((c) => c.status === 'resolved');

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Ionicons name="trophy" size={56} color={colors.warning} />
        <Text style={styles.heroTitle}>Meeting Complete!</Text>
        <Text style={styles.heroSubtitle}>Great job finishing your family meeting.</Text>

        {avg !== null && avgPct !== null && (
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>Average Evaluation</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(avgPct) }]}>
              {avg.toFixed(1)}/{MAX_TOTAL_SCORE}
            </Text>
            <Text style={styles.scoreGrade}>{getScoreLabel(avgPct)}</Text>
          </View>
        )}

        {evaluations.length > 0 && (
          <View style={styles.evalsList}>
            {evaluations.map((evaluation) => {
              const pct = evaluation.total_score !== null
                ? calculateScorePercentage(evaluation.total_score)
                : null;
              return (
                <View key={evaluation.id} style={styles.evalItem}>
                  <Ionicons name="person" size={16} color={colors.primary} />
                  <Text style={styles.evalScore}>
                    Score: {evaluation.total_score}/{MAX_TOTAL_SCORE}
                  </Text>
                  {pct !== null && (
                    <View style={[styles.evalBadge, { backgroundColor: getScoreColor(pct) + '22' }]}>
                      <Text style={[styles.evalBadgeText, { color: getScoreColor(pct) }]}>
                        {getScoreLabel(pct)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Meeting Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="flag" size={18} color={colors.success} />
              <Text style={styles.summaryValue}>{completedGoals.length}</Text>
              <Text style={styles.summaryLabel}>Goals Achieved</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="clipboard" size={18} color={colors.primary} />
              <Text style={styles.summaryValue}>{activeGoals.length}</Text>
              <Text style={styles.summaryLabel}>Active Goals</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="chatbubbles" size={18} color={colors.warning} />
              <Text style={styles.summaryValue}>{resolvedConflicts.length}</Text>
              <Text style={styles.summaryLabel}>Resolved</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.newMeetingButton} onPress={onStartNew}>
        <Ionicons name="refresh" size={20} color={colors.textInverse} />
        <Text style={styles.newMeetingButtonText}>Start New Meeting</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16 },
    heroCard: {
      alignItems: 'center', padding: 32,
      backgroundColor: colors.card, borderRadius: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
      marginBottom: 24,
    },
    heroTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16 },
    heroSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
    scoreSection: { alignItems: 'center', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border, width: '100%' },
    scoreLabel: { fontSize: 13, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '600' },
    scoreValue: { fontSize: 32, fontWeight: '700', marginTop: 4 },
    scoreGrade: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
    evalsList: { marginTop: 16, width: '100%', gap: 8 },
    evalItem: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: 12,
    },
    evalScore: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1 },
    evalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    evalBadgeText: { fontSize: 12, fontWeight: '600' },
    summarySection: {
      marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border, width: '100%',
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },
    summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 6 },
    summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    newMeetingButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, padding: 16, borderRadius: 12, minHeight: 52,
    },
    newMeetingButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  });
}
