import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import {
  ChildEvaluation,
  MAX_TOTAL_SCORE,
  calculateScorePercentage,
  getScoreColor,
  getScoreLabel,
} from '../../types/family-meeting';

interface Props {
  evaluations: ChildEvaluation[];
}

export function EvaluationTrendCard({ evaluations }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (evaluations.length === 0) return null;

  // Group evaluations by date to show trends
  const recentEvals = evaluations.slice(-12); // last 12 evaluations
  const overallAvg = recentEvals.reduce((sum, e) => sum + (e.total_score ?? 0), 0) / recentEvals.length;
  const overallPct = calculateScorePercentage(Math.round(overallAvg));

  // Simple trend: compare last 3 vs previous 3
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentEvals.length >= 6) {
    const recent3 = recentEvals.slice(-3);
    const prev3 = recentEvals.slice(-6, -3);
    const recentAvg = recent3.reduce((s, e) => s + (e.total_score ?? 0), 0) / 3;
    const prevAvg = prev3.reduce((s, e) => s + (e.total_score ?? 0), 0) / 3;
    if (recentAvg > prevAvg + 0.5) trend = 'up';
    else if (recentAvg < prevAvg - 0.5) trend = 'down';
  }

  // Simple bar chart of last evaluations
  const maxBarWidth = 200;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={20} color={colors.primary} />
        <Text style={styles.title}>Meeting Quality Trend</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={[styles.summaryValue, { color: getScoreColor(overallPct) }]}>
            {overallAvg.toFixed(1)}/{MAX_TOTAL_SCORE}
          </Text>
          <Text style={styles.summaryGrade}>{getScoreLabel(overallPct)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Evaluations</Text>
          <Text style={styles.summaryValue}>{evaluations.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Trend</Text>
          <View style={styles.trendIndicator}>
            <Ionicons
              name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'}
              size={18}
              color={trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textTertiary}
            />
            <Text style={[styles.trendText, {
              color: trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textTertiary,
            }]}>
              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartLabel}>Recent Evaluations</Text>
        {recentEvals.map((evaluation, index) => {
          const score = evaluation.total_score ?? 0;
          const pct = calculateScorePercentage(score);
          const barWidth = (score / MAX_TOTAL_SCORE) * maxBarWidth;
          const date = new Date(evaluation.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return (
            <View key={evaluation.id} style={styles.barRow}>
              <Text style={styles.barDate}>{date}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: barWidth, backgroundColor: getScoreColor(pct) }]} />
              </View>
              <Text style={styles.barScore}>{score}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
      marginBottom: 24,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    summaryRow: { flexDirection: 'row', marginBottom: 20 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase' },
    summaryValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 },
    summaryGrade: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    trendIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    trendText: { fontSize: 13, fontWeight: '600' },
    chartSection: {},
    chartLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 10 },
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    barDate: { fontSize: 11, color: colors.textTertiary, width: 48 },
    barTrack: {
      flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.backgroundSecondary, overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 6 },
    barScore: { fontSize: 12, fontWeight: '600', color: colors.text, width: 20, textAlign: 'right' },
  });
}
