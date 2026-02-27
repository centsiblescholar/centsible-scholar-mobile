import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BehaviorScores, BehaviorAssessment, BehaviorAssessmentStatus } from '../../shared/types';
import { useTheme, type ThemeColors, tints } from '@/theme';

// --- Category Configuration (matching premium) ---

interface CategoryConfig {
  key: keyof BehaviorScores;
  label: string;
  description: string;
  emoji: string;
}

const OBLIGATIONS: CategoryConfig[] = [
  { key: 'exercise', label: 'Exercise', description: 'Physical activity', emoji: '💪' },
  { key: 'diet', label: 'Diet', description: 'Eating healthy meals', emoji: '🥗' },
  { key: 'hygiene', label: 'Hygiene', description: 'Personal cleanliness', emoji: '🧼' },
  { key: 'respect', label: 'Respect', description: 'Showing respect to others', emoji: '🤝' },
  { key: 'responsibilities', label: 'Responsibilities', description: 'Chores and duties', emoji: '📝' },
  { key: 'work', label: 'School Work', description: 'Completing assignments', emoji: '📚' },
];

const OPPORTUNITIES: CategoryConfig[] = [
  { key: 'attitude', label: 'Attitude', description: 'Positive mindset', emoji: '😊' },
  { key: 'cooperation', label: 'Cooperation', description: 'Working with others', emoji: '🤲' },
  { key: 'courtesy', label: 'Courtesy', description: 'Being polite', emoji: '🎩' },
  { key: 'service', label: 'Service', description: 'Helping others', emoji: '❤️' },
];

// --- Score Descriptions (matching premium exactly) ---

const SCORE_DESCRIPTIONS: Record<number, string> = {
  5: 'More than two extraordinary',
  4: 'One or two extraordinary',
  3: 'No shortcomings, no extraordinary',
  2: 'One or two infractions',
  1: 'Multiple shortcomings',
};

const SCORE_COLORS: Record<number, string> = {
  1: '#EF4444', // red
  2: '#F97316', // orange
  3: '#F59E0B', // amber
  4: '#3B82F6', // blue
  5: '#10B981', // green
};

const SCORE_BG_COLORS: Record<number, string> = {
  1: '#FEF2F2', // red-50
  2: '#FFF7ED', // orange-50
  3: '#FFFBEB', // amber-50
  4: '#EFF6FF', // blue-50
  5: '#ECFDF5', // green-50
};

const STATUS_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
  draft: { label: 'Draft', icon: 'time-outline', color: '#6B7280', bgColor: '#F3F4F6' },
  submitted: { label: 'Submitted for Review', icon: 'time-outline', color: '#7C3AED', bgColor: '#F5F3FF' },
  approved: { label: 'Approved', icon: 'checkmark-circle', color: '#059669', bgColor: '#ECFDF5' },
  needs_revision: { label: 'Needs Revision', icon: 'alert-circle', color: '#DC2626', bgColor: '#FEF2F2' },
};

// --- Props ---

interface PremiumBehaviorFormProps {
  scores: BehaviorScores;
  onScoresChange: (scores: BehaviorScores) => void;
  onSave: (status: 'draft' | 'submitted') => void;
  isSaving: boolean;
  existingAssessment?: BehaviorAssessment | null;
  editable: boolean;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

// --- Component ---

export default function PremiumBehaviorForm({
  scores,
  onScoresChange,
  onSave,
  isSaving,
  existingAssessment,
  editable,
  notes = '',
  onNotesChange,
}: PremiumBehaviorFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Auto-save: debounce draft saves when scores change
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteracted = useRef(false);

  const handleScoreChange = useCallback((key: keyof BehaviorScores, value: number) => {
    if (!editable) return;
    hasInteracted.current = true;
    onScoresChange({ ...scores, [key]: value });
  }, [scores, onScoresChange, editable]);

  // Auto-save as draft after 3 seconds of inactivity (only when all scores are valid)
  useEffect(() => {
    if (!hasInteracted.current || !editable) return;
    const allScoresValid = Object.values(scores).every(s => s >= 1 && s <= 5);
    if (!allScoresValid) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      onSave('draft');
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [scores, editable, onSave]);

  const status = existingAssessment?.status;
  const statusInfo = status ? STATUS_CONFIG[status] : null;
  const parentNotes = existingAssessment?.parent_notes;

  // Validation: all 10 scores must be > 0 to submit
  const filledCount = Object.values(scores).filter(s => s > 0).length;
  const isFormValid = filledCount === 10;

  return (
    <View style={styles.formContainer}>
      {/* Status Badge */}
      {statusInfo && (
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <Ionicons name={statusInfo.icon} size={18} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      )}

      {/* Parent Feedback (when needs_revision) */}
      {status === 'needs_revision' && parentNotes && (
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#1D4ED8" />
            <Text style={styles.feedbackTitle}>Parent Feedback</Text>
          </View>
          <Text style={styles.feedbackText}>{parentNotes}</Text>
        </View>
      )}

      {/* Locked message */}
      {!editable && (
        <View style={styles.lockedMessage}>
          <Ionicons name="lock-closed" size={16} color={colors.textTertiary} />
          <Text style={styles.lockedText}>
            This assessment is {status} and cannot be modified.
          </Text>
        </View>
      )}

      {/* Score Guide */}
      <View style={styles.scoreGuide}>
        <Text style={styles.scoreGuideTitle}>Score Guide</Text>
        {[5, 4, 3, 2, 1].map((score) => (
          <View key={score} style={styles.scoreGuideRow}>
            <View style={[styles.scoreGuideBadge, { backgroundColor: SCORE_COLORS[score] }]}>
              <Text style={styles.scoreGuideBadgeText}>{score}</Text>
            </View>
            <Text style={styles.scoreGuideDescription}>{SCORE_DESCRIPTIONS[score]}</Text>
          </View>
        ))}
      </View>

      {/* Validation Progress */}
      {editable && (
        <View style={[styles.validationBar, isFormValid ? styles.validationBarReady : styles.validationBarPending]}>
          <Ionicons
            name={isFormValid ? 'checkmark-circle' : 'information-circle'}
            size={16}
            color={isFormValid ? '#059669' : '#D97706'}
          />
          <Text style={[styles.validationText, isFormValid ? styles.validationTextReady : styles.validationTextPending]}>
            {isFormValid ? 'Ready to submit for review' : `${filledCount}/10 fields rated`}
          </Text>
        </View>
      )}

      {/* Obligations Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>📋</Text>
        <View>
          <Text style={styles.sectionTitle}>Obligations</Text>
          <Text style={styles.sectionSubtitle}>Required daily behaviors</Text>
        </View>
      </View>
      {OBLIGATIONS.map((cat) => (
        <CategoryCard
          key={cat.key}
          category={cat}
          score={scores[cat.key]}
          onScoreChange={(value) => handleScoreChange(cat.key, value)}
          editable={editable}
          colors={colors}
        />
      ))}

      {/* Opportunities Section */}
      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Text style={styles.sectionEmoji}>⭐</Text>
        <View>
          <Text style={styles.sectionTitle}>Opportunities</Text>
          <Text style={styles.sectionSubtitle}>Chances to excel</Text>
        </View>
      </View>
      {OPPORTUNITIES.map((cat) => (
        <CategoryCard
          key={cat.key}
          category={cat}
          score={scores[cat.key]}
          onScoreChange={(value) => handleScoreChange(cat.key, value)}
          editable={editable}
          colors={colors}
        />
      ))}

      {/* Notes */}
      {(editable || notes) && (
        <View style={styles.notesContainer}>
          <View style={styles.notesHeader}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.notesTitle}>Notes (optional)</Text>
          </View>
          <TextInput
            style={[styles.notesInput, !editable && styles.notesInputDisabled]}
            multiline
            numberOfLines={3}
            placeholder="Add any notes about today's assessment..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={onNotesChange}
            editable={editable}
            maxLength={500}
          />
        </View>
      )}

      {/* Action Buttons */}
      {editable && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.draftButton, isSaving && styles.buttonDisabled]}
            onPress={() => onSave('draft')}
            disabled={isSaving}
          >
            <Ionicons name="save-outline" size={18} color={colors.primary} />
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || isSaving) && styles.buttonDisabled,
            ]}
            onPress={() => onSave('submitted')}
            disabled={!isFormValid || isSaving}
          >
            <Ionicons name="send" size={18} color={colors.textInverse} />
            <Text style={styles.submitButtonText}>Submit for Review</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 24 }} />
    </View>
  );
}

// --- Category Card Sub-component ---

function CategoryCard({
  category,
  score,
  onScoreChange,
  editable,
  colors,
}: {
  category: CategoryConfig;
  score: number;
  onScoreChange: (value: number) => void;
  editable: boolean;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createCategoryStyles(colors), [colors]);

  return (
    <View style={[styles.card, !editable && styles.cardDisabled]}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{category.emoji}</Text>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{category.label}</Text>
          <Text style={styles.description}>{category.description}</Text>
        </View>
        {score > 0 && (
          <View style={[styles.currentScoreBadge, { backgroundColor: SCORE_BG_COLORS[score] }]}>
            <Text style={[styles.currentScoreText, { color: SCORE_COLORS[score] }]}>{score}</Text>
          </View>
        )}
      </View>

      <View style={styles.scoreButtons}>
        {[1, 2, 3, 4, 5].map((value) => {
          const isSelected = score === value;
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.scoreButton,
                isSelected && { backgroundColor: SCORE_COLORS[value], borderColor: SCORE_COLORS[value] },
                !editable && styles.scoreButtonDisabled,
              ]}
              onPress={() => onScoreChange(value)}
              disabled={!editable}
              activeOpacity={editable ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.scoreButtonText,
                  isSelected && styles.scoreButtonTextSelected,
                ]}
              >
                {value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// --- Styles ---

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  formContainer: {
    paddingHorizontal: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  feedbackText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  lockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  lockedText: {
    fontSize: 13,
    color: colors.textTertiary,
    flex: 1,
  },
  scoreGuide: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  scoreGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  scoreGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  scoreGuideBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreGuideBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreGuideDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  validationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  validationBarReady: {
    backgroundColor: '#ECFDF5',
  },
  validationBarPending: {
    backgroundColor: '#FFFBEB',
  },
  validationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  validationTextReady: {
    color: '#059669',
  },
  validationTextPending: {
    color: '#D97706',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingVertical: 8,
  },
  sectionEmoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  notesContainer: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInputDisabled: {
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  draftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    minHeight: 48,
  },
  draftButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    minHeight: 48,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

const createCategoryStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
    marginRight: 10,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  currentScoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: colors.backgroundSecondary,
  },
  scoreButtonDisabled: {
    opacity: 0.5,
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  scoreButtonTextSelected: {
    color: '#FFFFFF',
  },
});
