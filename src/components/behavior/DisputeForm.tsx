import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BehaviorAssessment, ScoreDispute } from '../../shared/types';
import { supabase } from '../../integrations/supabase/client';
import { useTheme, type ThemeColors } from '@/theme';

interface DisputeFormProps {
  visible: boolean;
  assessment: BehaviorAssessment | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Below Avg', 3: 'Average', 4: 'Good', 5: 'Excellent',
};

const ALL_CATEGORIES = [
  { key: 'diet', label: 'Diet' },
  { key: 'exercise', label: 'Exercise' },
  { key: 'work', label: 'Work' },
  { key: 'hygiene', label: 'Hygiene' },
  { key: 'respect', label: 'Respect' },
  { key: 'responsibilities', label: 'Responsibilities' },
  { key: 'attitude', label: 'Attitude' },
  { key: 'cooperation', label: 'Cooperation' },
  { key: 'courtesy', label: 'Courtesy' },
  { key: 'service', label: 'Service' },
] as const;

export default function DisputeForm({ visible, assessment, onClose, onSubmitted }: DisputeFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!assessment) return null;

  const getScore = (key: string): number => {
    const val = (assessment as unknown as Record<string, unknown>)[key];
    return typeof val === 'number' ? val : 0;
  };

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedCategories.size === 0) {
      Alert.alert('Select Categories', 'Please select at least one category to dispute.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Add a Comment', 'Please explain why you are disputing these scores.');
      return;
    }

    setSubmitting(true);
    try {
      // Build dispute records
      const existingDisputes = assessment.score_disputes || {};
      const newDisputes: Record<string, ScoreDispute> = { ...existingDisputes };

      for (const key of selectedCategories) {
        newDisputes[key] = {
          disputed_by: 'student',
          comment: comment.trim(),
          original_score: getScore(key),
          disputed_at: new Date().toISOString(),
        };
      }

      const { error } = await supabase
        .from('behavior_assessments')
        .update({
          score_disputes: newDisputes as unknown as Record<string, never>,
          status: 'student_disputed',
        })
        .eq('id', assessment.id);

      if (error) throw error;

      Alert.alert('Dispute Submitted', 'Your parent will review your dispute.');
      setSelectedCategories(new Set());
      setComment('');
      onSubmitted();
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit dispute. Please try again.');
      console.error('Error submitting dispute:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Dispute Scores</Text>
              <Text style={styles.subtitle}>
                Select the categories you want to dispute
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category selection */}
            <View style={styles.categoriesGrid}>
              {ALL_CATEGORIES.map(cat => {
                const score = getScore(cat.key);
                const isSelected = selectedCategories.has(cat.key);
                const alreadyDisputed = assessment.score_disputes?.[cat.key] !== undefined;

                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                      alreadyDisputed && styles.categoryCardDisabled,
                    ]}
                    onPress={() => !alreadyDisputed && toggleCategory(cat.key)}
                    disabled={alreadyDisputed}
                  >
                    <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                      {cat.label}
                    </Text>
                    <Text style={[styles.categoryScore, isSelected && styles.categoryScoreSelected]}>
                      {score}/5
                    </Text>
                    <Text style={[styles.categoryScoreLabel, isSelected && styles.categoryLabelSelected]}>
                      {SCORE_LABELS[score] || '--'}
                    </Text>
                    {alreadyDisputed && (
                      <View style={styles.alreadyDisputedBadge}>
                        <Text style={styles.alreadyDisputedText}>Disputed</Text>
                      </View>
                    )}
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Comment */}
            <Text style={styles.commentLabel}>
              Why do you disagree? ({selectedCategories.size} selected)
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Explain why you think these scores should be different..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (selectedCategories.size === 0 || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={selectedCategories.size === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Dispute</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryCard: {
    width: '48%', backgroundColor: colors.backgroundSecondary, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  categoryCardSelected: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  categoryCardDisabled: { opacity: 0.5 },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  categoryLabelSelected: { color: '#DC2626' },
  categoryScore: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  categoryScoreSelected: { color: '#DC2626' },
  categoryScoreLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  alreadyDisputedBadge: {
    marginTop: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  alreadyDisputedText: { fontSize: 9, fontWeight: '600', color: '#92400E' },
  checkmark: { position: 'absolute', top: 6, right: 6 },
  commentLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  commentInput: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 14,
    fontSize: 14, color: colors.text, minHeight: 100, borderWidth: 1, borderColor: colors.border,
  },
  submitBtn: {
    backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
