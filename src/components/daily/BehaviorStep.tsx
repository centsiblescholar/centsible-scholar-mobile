import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '../../contexts/AuthContext';
import { useBehaviorAssessments } from '../../hooks/useBehaviorAssessments';
import { BehaviorScores } from '../../shared/types/index';

interface BehaviorStepProps {
  onComplete: () => void;
}

const OBLIGATIONS = [
  { key: 'diet' as const, label: 'Diet', description: 'Eating healthy meals' },
  { key: 'exercise' as const, label: 'Exercise', description: 'Physical activity' },
  { key: 'work' as const, label: 'School Work', description: 'Completing assignments' },
  { key: 'hygiene' as const, label: 'Hygiene', description: 'Personal cleanliness' },
  { key: 'respect' as const, label: 'Respect', description: 'Showing respect to others' },
];

const OPPORTUNITIES = [
  { key: 'responsibilities' as const, label: 'Responsibilities', description: 'Chores and duties' },
  { key: 'attitude' as const, label: 'Attitude', description: 'Positive mindset' },
  { key: 'cooperation' as const, label: 'Cooperation', description: 'Working with others' },
  { key: 'courtesy' as const, label: 'Courtesy', description: 'Being polite' },
  { key: 'service' as const, label: 'Service', description: 'Helping others' },
];

const SCORE_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

const SCORE_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#EAB308',
  4: '#3B82F6',
  5: '#10B981',
};

const DEFAULT_SCORES: BehaviorScores = {
  diet: 3,
  exercise: 3,
  work: 3,
  hygiene: 3,
  respect: 3,
  responsibilities: 3,
  attitude: 3,
  cooperation: 3,
  courtesy: 3,
  service: 3,
};

export default function BehaviorStep({ onComplete }: BehaviorStepProps) {
  const { user } = useAuth();
  const {
    todayAssessment,
    isLoading,
    saveAssessment,
    isSaving,
  } = useBehaviorAssessments(user?.id);

  const [scores, setScores] = useState<BehaviorScores>(DEFAULT_SCORES);

  // If already completed today, skip this step
  useEffect(() => {
    if (!isLoading && todayAssessment) {
      onComplete();
    }
  }, [isLoading, todayAssessment]);

  const updateScore = (key: keyof BehaviorScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: Math.round(value) }));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    try {
      await saveAssessment({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        scores,
        status: 'submitted',
      });
      onComplete();
    } catch (error: any) {
      console.error('Error saving behavior assessment:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const renderCategory = (
    item: { key: keyof BehaviorScores; label: string; description: string },
  ) => {
    const value = scores[item.key];
    const color = SCORE_COLORS[value] || '#6B7280';

    return (
      <View key={item.key} style={styles.categoryRow}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryLabel}>{item.label}</Text>
            <Text style={styles.categoryDescription}>{item.description}</Text>
          </View>
          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreValue, { color }]}>{value}</Text>
            <Text style={[styles.scoreLabel, { color }]}>{SCORE_LABELS[value]}</Text>
          </View>
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEndLabel}>Needs Improvement</Text>
          <View style={styles.sliderContainer}>
            <Slider
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={value}
              onValueChange={(val) => updateScore(item.key, val)}
              minimumTrackTintColor="#4F46E5"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#4F46E5"
              style={styles.slider}
            />
          </View>
          <Text style={styles.sliderEndLabel}>Excellent</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Score Guide Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Score Guide: </Text>
          {[1, 2, 3, 4, 5].map((score) => (
            <Text key={score} style={[styles.legendItem, { color: SCORE_COLORS[score] }]}>
              {score}={SCORE_LABELS[score]}
              {score < 5 ? '  ' : ''}
            </Text>
          ))}
        </View>

        {/* Obligations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Obligations</Text>
          <Text style={styles.sectionDescription}>Required daily behaviors</Text>
          {OBLIGATIONS.map(renderCategory)}
        </View>

        {/* Opportunities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opportunities</Text>
          <Text style={styles.sectionDescription}>Extra credit behaviors</Text>
          {OPPORTUNITIES.map(renderCategory)}
        </View>

        {/* Spacer for button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Check-in</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  legendItem: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: 16,
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

  // Category Row
  categoryRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginLeft: 12,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Slider
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sliderContainer: {
    flex: 1,
  },
  slider: {
    height: 40,
  },
  sliderEndLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    width: 50,
    textAlign: 'center',
  },

  // Button
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
