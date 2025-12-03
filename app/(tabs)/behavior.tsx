import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBehaviorAssessments } from '../../src/hooks/useBehaviorAssessments';
import { BehaviorScores } from '../../src/shared/types';
import { calculateAssessmentAverageScore } from '../../src/shared/calculations';
import { SCORE_DESCRIPTIONS } from '../../src/shared/validation/constants';

const OBLIGATIONS = [
  { key: 'diet', label: 'Diet', description: 'Eating healthy meals' },
  { key: 'exercise', label: 'Exercise', description: 'Physical activity' },
  { key: 'work', label: 'School Work', description: 'Completing assignments' },
  { key: 'hygiene', label: 'Hygiene', description: 'Personal cleanliness' },
  { key: 'respect', label: 'Respect', description: 'Showing respect to others' },
] as const;

const OPPORTUNITIES = [
  { key: 'responsibilities', label: 'Responsibilities', description: 'Chores and duties' },
  { key: 'attitude', label: 'Attitude', description: 'Positive mindset' },
  { key: 'cooperation', label: 'Cooperation', description: 'Working with others' },
  { key: 'courtesy', label: 'Courtesy', description: 'Being polite' },
  { key: 'service', label: 'Service', description: 'Helping others' },
] as const;

const DEFAULT_SCORES: BehaviorScores = {
  diet: 0,
  exercise: 0,
  work: 0,
  hygiene: 0,
  respect: 0,
  responsibilities: 0,
  attitude: 0,
  cooperation: 0,
  courtesy: 0,
  service: 0,
};

export default function BehaviorScreen() {
  const { user } = useAuth();
  const { assessments, todayAssessment, overallAverage, isLoading, saveAssessment, isSaving, refetch } = useBehaviorAssessments();

  const [scores, setScores] = useState<BehaviorScores>(
    todayAssessment || DEFAULT_SCORES
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const updateScore = (key: keyof BehaviorScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    // Check if at least one score is filled
    const hasScores = Object.values(scores).some((s) => s > 0);
    if (!hasScores && status === 'submitted') {
      Alert.alert('Error', 'Please rate at least one category before submitting');
      return;
    }

    try {
      await saveAssessment({
        user_id: user!.id,
        date: new Date().toISOString().split('T')[0],
        scores,
        status,
      });

      Alert.alert(
        'Success',
        status === 'submitted'
          ? 'Assessment submitted for review!'
          : 'Assessment saved as draft'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save assessment');
    }
  };

  const currentAverage = calculateAssessmentAverageScore(scores);

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Assessment</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's Score</Text>
            <Text style={styles.statValue}>
              {currentAverage > 0 ? currentAverage.toFixed(1) : '--'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overall Average</Text>
            <Text style={styles.statValue}>
              {assessments.length > 0 ? overallAverage.toFixed(1) : '--'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Obligations</Text>
          <Text style={styles.sectionDescription}>Required daily behaviors</Text>
          {OBLIGATIONS.map((item) => (
            <ScoreRow
              key={item.key}
              label={item.label}
              description={item.description}
              value={scores[item.key]}
              onChange={(value) => updateScore(item.key, value)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opportunities</Text>
          <Text style={styles.sectionDescription}>Extra credit behaviors</Text>
          {OPPORTUNITIES.map((item) => (
            <ScoreRow
              key={item.key}
              label={item.label}
              description={item.description}
              value={scores[item.key]}
              onChange={(value) => updateScore(item.key, value)}
            />
          ))}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Score Guide</Text>
          <View style={styles.legendRow}>
            {[1, 2, 3, 4, 5].map((score) => (
              <View key={score} style={styles.legendItem}>
                <View style={[styles.legendBadge, getScoreStyle(score)]}>
                  <Text style={styles.legendScore}>{score}</Text>
                </View>
                <Text style={styles.legendLabel}>
                  {SCORE_DESCRIPTIONS[score as keyof typeof SCORE_DESCRIPTIONS]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSave('draft')}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.buttonDisabled]}
          onPress={() => handleSave('submitted')}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScoreRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreInfo}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreDescription}>{description}</Text>
      </View>
      <View style={styles.scoreButtons}>
        {[1, 2, 3, 4, 5].map((score) => (
          <TouchableOpacity
            key={score}
            style={[
              styles.scoreButton,
              value === score && getScoreStyle(score),
            ]}
            onPress={() => onChange(score)}
          >
            <Text
              style={[
                styles.scoreButtonText,
                value === score && styles.scoreButtonTextSelected,
              ]}
            >
              {score}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getScoreStyle(score: number) {
  const colors: Record<number, string> = {
    1: '#EF4444',
    2: '#F97316',
    3: '#F59E0B',
    4: '#3B82F6',
    5: '#10B981',
  };
  return { backgroundColor: colors[score] || '#6B7280' };
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
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDate: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
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
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  scoreRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  scoreInfo: {
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scoreDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  scoreButtonTextSelected: {
    color: '#fff',
  },
  legend: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  legendLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
