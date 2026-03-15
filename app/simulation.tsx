import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useStudent } from '../src/contexts/StudentContext';
import { useStudentGrades } from '../src/hooks/useStudentGrades';
import { useBehaviorAssessments } from '../src/hooks/useBehaviorAssessments';
import { useStudentProfile } from '../src/hooks/useStudentProfile';
import { calculateAllocation } from '../src/shared/calculations';
import { GRADE_MULTIPLIERS, BEHAVIOR_THRESHOLDS } from '../src/shared/calculations/constants';
import { useTheme, type ThemeColors, indigo, tints } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'F'];

const BEHAVIOR_LEVELS = [
  { label: 'Poor', value: 2.0, color: '#EF4444' },
  { label: 'Fair', value: 3.0, color: '#F59E0B' },
  { label: 'Good', value: 3.5, color: '#3B82F6' },
  { label: 'Great', value: 4.0, color: '#8B5CF6' },
  { label: 'Excellent', value: 4.5, color: '#10B981' },
];

export default function SimulationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectedStudent, isParentView } = useStudent();

  const targetUserId = isParentView ? selectedStudent?.user_id : user?.id;
  const { profile } = useStudentProfile();
  const baseRewardAmount = isParentView
    ? (selectedStudent?.base_reward_amount || 0)
    : (profile?.base_reward_amount || 0);

  const { gradeEntries, totalReward, gpa, isLoading: gradesLoading } = useStudentGrades(targetUserId);
  const { overallAverage, isLoading: behaviorLoading } = useBehaviorAssessments(targetUserId);

  const [simType, setSimType] = useState<'grades' | 'behavior'>('grades');

  // Grade simulation state
  const [simGrade, setSimGrade] = useState<Grade>('A');
  const [simSubjectCount, setSimSubjectCount] = useState(1);

  // Behavior simulation state
  const [simBehaviorLevel, setSimBehaviorLevel] = useState(2); // index into BEHAVIOR_LEVELS

  const isLoading = gradesLoading || behaviorLoading;

  // Current allocation
  const currentAllocation = calculateAllocation(totalReward);

  // Simulated grade scenario
  const simGradeReward = baseRewardAmount * (GRADE_MULTIPLIERS[simGrade] ?? 0) * simSubjectCount;
  const simGradeTotalReward = totalReward + simGradeReward;
  const simGradeAllocation = calculateAllocation(simGradeTotalReward);

  // Simulated behavior scenario
  const simBehavior = BEHAVIOR_LEVELS[simBehaviorLevel];
  const getBehaviorBonusPercent = (avg: number) => {
    if (avg >= BEHAVIOR_THRESHOLDS.TIER_4) return 0.20;
    if (avg >= BEHAVIOR_THRESHOLDS.TIER_3) return 0.15;
    if (avg >= BEHAVIOR_THRESHOLDS.TIER_2) return 0.10;
    if (avg >= BEHAVIOR_THRESHOLDS.TIER_1) return 0.05;
    return 0;
  };
  const currentBehaviorBonus = getBehaviorBonusPercent(overallAverage) * baseRewardAmount;
  const simBehaviorBonus = getBehaviorBonusPercent(simBehavior.value) * baseRewardAmount;
  const simBehaviorTotalReward = totalReward - currentBehaviorBonus + simBehaviorBonus;
  const simBehaviorAllocation = calculateAllocation(simBehaviorTotalReward);

  const simAllocation = simType === 'grades' ? simGradeAllocation : simBehaviorAllocation;
  const simTotal = simType === 'grades' ? simGradeTotalReward : simBehaviorTotalReward;
  const diff = simTotal - totalReward;

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>What-If Calculator</Text>
          </View>
        </SafeAreaView>
        <SkeletonList count={3} cardHeight={100} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>What-If Calculator</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sim Type Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, simType === 'grades' && styles.toggleBtnActive]}
            onPress={() => setSimType('grades')}
          >
            <Ionicons name="school" size={16} color={simType === 'grades' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.toggleText, simType === 'grades' && styles.toggleTextActive]}>
              Grades
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, simType === 'behavior' && styles.toggleBtnActive]}
            onPress={() => setSimType('behavior')}
          >
            <Ionicons name="fitness" size={16} color={simType === 'behavior' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.toggleText, simType === 'behavior' && styles.toggleTextActive]}>
              Behavior
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Stats */}
        <View style={styles.currentCard}>
          <Text style={styles.cardLabel}>CURRENT</Text>
          <View style={styles.currentRow}>
            <View style={styles.currentStat}>
              <Text style={styles.currentStatValue}>{gradeEntries.length > 0 ? gpa.toFixed(2) : '--'}</Text>
              <Text style={styles.currentStatLabel}>GPA</Text>
            </View>
            <View style={styles.currentStat}>
              <Text style={styles.currentStatValue}>{overallAverage > 0 ? overallAverage.toFixed(1) : '--'}</Text>
              <Text style={styles.currentStatLabel}>Behavior</Text>
            </View>
            <View style={styles.currentStat}>
              <Text style={[styles.currentStatValue, { color: colors.success }]}>{fmt(totalReward)}</Text>
              <Text style={styles.currentStatLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Grade Simulation Controls */}
        {simType === 'grades' && (
          <View style={styles.simCard}>
            <Text style={styles.cardLabel}>SIMULATE: ADD GRADES</Text>
            <Text style={styles.simDescription}>
              What if you earn {simSubjectCount} more {simGrade} grade{simSubjectCount > 1 ? 's' : ''}?
            </Text>

            {/* Grade Selector */}
            <Text style={styles.inputLabel}>Grade</Text>
            <View style={styles.gradeRow}>
              {GRADES.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeBtn, simGrade === g && { backgroundColor: colors.primary }]}
                  onPress={() => setSimGrade(g)}
                >
                  <Text style={[styles.gradeBtnText, simGrade === g && { color: '#fff' }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Count */}
            <Text style={styles.inputLabel}>Number of subjects</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setSimSubjectCount(Math.max(1, simSubjectCount - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{simSubjectCount}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setSimSubjectCount(Math.min(10, simSubjectCount + 1))}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.simResultRow}>
              <Text style={styles.simResultLabel}>Additional reward</Text>
              <Text style={[styles.simResultValue, { color: colors.success }]}>+{fmt(simGradeReward)}</Text>
            </View>
          </View>
        )}

        {/* Behavior Simulation Controls */}
        {simType === 'behavior' && (
          <View style={styles.simCard}>
            <Text style={styles.cardLabel}>SIMULATE: BEHAVIOR SCORE</Text>
            <Text style={styles.simDescription}>
              What if your average behavior score was {simBehavior.value.toFixed(1)}?
            </Text>

            <View style={styles.behaviorSlider}>
              {BEHAVIOR_LEVELS.map((level, i) => (
                <TouchableOpacity
                  key={level.label}
                  style={[
                    styles.behaviorBtn,
                    simBehaviorLevel === i && { backgroundColor: level.color, borderColor: level.color },
                  ]}
                  onPress={() => setSimBehaviorLevel(i)}
                >
                  <Text style={[
                    styles.behaviorBtnScore,
                    simBehaviorLevel === i && { color: '#fff' },
                  ]}>
                    {level.value.toFixed(1)}
                  </Text>
                  <Text style={[
                    styles.behaviorBtnLabel,
                    simBehaviorLevel === i && { color: '#fff' },
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.simResultRow}>
              <Text style={styles.simResultLabel}>Behavior bonus change</Text>
              <Text style={[styles.simResultValue, {
                color: simBehaviorBonus - currentBehaviorBonus >= 0 ? colors.success : colors.error,
              }]}>
                {simBehaviorBonus - currentBehaviorBonus >= 0 ? '+' : ''}
                {fmt(simBehaviorBonus - currentBehaviorBonus)}
              </Text>
            </View>
          </View>
        )}

        {/* Results Comparison */}
        <View style={styles.resultsCard}>
          <Text style={styles.cardLabel}>SIMULATED PAYCHECK</Text>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonLabel}>Category</Text>
            <Text style={styles.comparisonLabel}>Current</Text>
            <Text style={styles.comparisonLabel}>Simulated</Text>
          </View>

          {[
            { label: 'Total', current: currentAllocation.total, sim: simAllocation.total },
            { label: 'Taxes (15%)', current: currentAllocation.taxQualified.taxes, sim: simAllocation.taxQualified.taxes },
            { label: 'Retirement (10%)', current: currentAllocation.taxQualified.retirement, sim: simAllocation.taxQualified.retirement },
            { label: 'Savings (25%)', current: currentAllocation.savings, sim: simAllocation.savings },
            { label: 'Discretionary (50%)', current: currentAllocation.discretionary, sim: simAllocation.discretionary },
          ].map((row, i) => {
            const rowDiff = row.sim - row.current;
            return (
              <View key={row.label} style={[styles.comparisonRow, i === 0 && styles.comparisonRowTotal]}>
                <Text style={[styles.compColLabel, i === 0 && styles.compColBold]}>{row.label}</Text>
                <Text style={[styles.compColValue, i === 0 && styles.compColBold]}>{fmt(row.current)}</Text>
                <View style={styles.compColSim}>
                  <Text style={[styles.compColValue, i === 0 && styles.compColBold, rowDiff > 0 && { color: colors.success }, rowDiff < 0 && { color: colors.error }]}>
                    {fmt(row.sim)}
                  </Text>
                  {rowDiff !== 0 && (
                    <Text style={[styles.compColDiff, { color: rowDiff > 0 ? colors.success : colors.error }]}>
                      {rowDiff > 0 ? '+' : ''}{fmt(rowDiff)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={[styles.summaryBanner, { backgroundColor: diff >= 0 ? '#F0FDF4' : '#FEF2F2' }]}>
          <Ionicons
            name={diff >= 0 ? 'trending-up' : 'trending-down'}
            size={24}
            color={diff >= 0 ? '#16A34A' : '#DC2626'}
          />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: diff >= 0 ? '#16A34A' : '#DC2626' }]}>
              {diff >= 0 ? 'You would earn more!' : 'You would earn less'}
            </Text>
            <Text style={styles.summaryDetail}>
              {diff >= 0 ? '+' : ''}{fmt(diff)} {simType === 'grades' ? 'from grade changes' : 'from behavior changes'}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 16, gap: 14 },

  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: '#fff' },

  currentCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 10,
  },
  currentRow: { flexDirection: 'row', gap: 12 },
  currentStat: { flex: 1, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 10, padding: 10 },
  currentStatValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  currentStatLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },

  simCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  simDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 14, lineHeight: 20 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },

  gradeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  gradeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
  },
  gradeBtnText: { fontSize: 16, fontWeight: '700', color: colors.text },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, justifyContent: 'center' },
  counterBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  counterValue: { fontSize: 24, fontWeight: '700', color: colors.text, minWidth: 30, textAlign: 'center' },

  behaviorSlider: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  behaviorBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1.5, borderColor: colors.border,
  },
  behaviorBtnScore: { fontSize: 14, fontWeight: '700', color: colors.text },
  behaviorBtnLabel: { fontSize: 9, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },

  simResultRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.backgroundSecondary, borderRadius: 10, padding: 12, marginTop: 4,
  },
  simResultLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  simResultValue: { fontSize: 16, fontWeight: '700' },

  resultsCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  comparisonHeader: {
    flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4,
  },
  comparisonLabel: { flex: 1, fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase' },
  comparisonRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.backgroundSecondary,
  },
  comparisonRowTotal: {
    borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 10, marginBottom: 4,
  },
  compColLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  compColBold: { fontWeight: '700', color: colors.text },
  compColValue: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'center' },
  compColSim: { flex: 1, alignItems: 'flex-end' },
  compColDiff: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, gap: 12,
  },
  summaryText: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: '700' },
  summaryDetail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
