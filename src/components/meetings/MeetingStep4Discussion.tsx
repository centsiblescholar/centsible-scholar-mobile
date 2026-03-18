import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { MeetingConflict } from '../../types/family-meeting';

const FINANCIAL_IDENTITY_PROMPTS = {
  middle: [
    'What does money mean to your family?',
    'How do you feel when you save vs. spend?',
    'What is one thing you learned about money this week?',
  ],
  high: [
    'How do your spending habits reflect your values?',
    'What financial goal are you working toward and why?',
    'How do you decide between wants and needs?',
    'What would you do differently if you had more financial responsibility?',
  ],
};

const DISCUSSION_TIPS = [
  'Use "I feel..." statements instead of "You always..."',
  'Listen to understand, not to respond',
  'One person speaks at a time',
  'Stay on the topic being discussed',
];

interface Props {
  pendingConflicts: MeetingConflict[];
  meetingId: string;
  initialNotes?: string;
  onComplete: (notes: string, discussedConflictIds: string[]) => void;
  onResolveConflict: (conflictId: string) => void;
  onMarkDiscussed: (conflictId: string) => void;
  onAddConflict: (description: string) => void;
  onCarryForward?: (conflictId: string) => void;
}

export function MeetingStep4Discussion({
  pendingConflicts,
  meetingId,
  initialNotes,
  onComplete,
  onResolveConflict,
  onMarkDiscussed,
  onAddConflict,
  onCarryForward,
}: Props) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState(initialNotes || '');
  const [newConflict, setNewConflict] = useState('');
  const [discussedIds, setDiscussedIds] = useState<Set<string>>(new Set());
  const [showFinancialPrompts, setShowFinancialPrompts] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleAddConflict = () => {
    if (newConflict.trim()) {
      onAddConflict(newConflict.trim());
      setNewConflict('');
    }
  };

  const handleDiscuss = (conflictId: string) => {
    setDiscussedIds((prev) => new Set(prev).add(conflictId));
    onMarkDiscussed(conflictId);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Discuss any conflicts or concerns. Use "I feel..." statements and listen actively.
      </Text>

      {/* Meeting Rules / Tips (collapsible) */}
      <TouchableOpacity
        style={styles.tipsToggle}
        onPress={() => setShowTips(!showTips)}
      >
        <Ionicons name="bulb-outline" size={18} color={colors.warning} />
        <Text style={styles.tipsToggleText}>Discussion Tips</Text>
        <Ionicons name={showTips ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
      </TouchableOpacity>
      {showTips && (
        <View style={styles.tipsCard}>
          {DISCUSSION_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Pending Conflicts */}
      {pendingConflicts.length > 0 ? (
        <View style={styles.conflictsList}>
          <Text style={styles.sectionLabel}>Pending Conflicts</Text>
          {pendingConflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflictCard}>
              <View style={styles.conflictContent}>
                <Text style={styles.conflictText}>{conflict.description}</Text>
                <Text style={styles.conflictMeta}>
                  Added by {conflict.added_by}
                </Text>
              </View>
              <View style={styles.conflictActions}>
                {!discussedIds.has(conflict.id) ? (
                  <TouchableOpacity
                    style={styles.discussButton}
                    onPress={() => handleDiscuss(conflict.id)}
                  >
                    <Text style={styles.discussButtonText}>Discussed</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.conflictActionRow}>
                    <TouchableOpacity
                      style={styles.resolveButton}
                      onPress={() => onResolveConflict(conflict.id)}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                      <Text style={styles.resolveButtonText}>Resolved</Text>
                    </TouchableOpacity>
                    {onCarryForward && (
                      <TouchableOpacity
                        style={styles.carryForwardButton}
                        onPress={() => onCarryForward(conflict.id)}
                      >
                        <Ionicons name="arrow-forward" size={14} color={colors.warning} />
                        <Text style={styles.carryForwardText}>Next</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="happy-outline" size={40} color={colors.success} />
          <Text style={styles.emptyText}>No pending conflicts!</Text>
        </View>
      )}

      <View style={styles.addConflictSection}>
        <Text style={styles.sectionLabel}>Add New Topic</Text>
        <View style={styles.addConflictRow}>
          <TextInput
            style={styles.addConflictInput}
            value={newConflict}
            onChangeText={setNewConflict}
            placeholder="Describe a concern to discuss..."
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity
            style={[styles.addButton, !newConflict.trim() && styles.addButtonDisabled]}
            onPress={handleAddConflict}
            disabled={!newConflict.trim()}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Financial Identity Check-In */}
      <TouchableOpacity
        style={styles.financialToggle}
        onPress={() => setShowFinancialPrompts(!showFinancialPrompts)}
      >
        <Ionicons name="cash-outline" size={18} color={colors.primary} />
        <Text style={styles.financialToggleText}>Financial Identity Check-In</Text>
        <Ionicons name={showFinancialPrompts ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
      </TouchableOpacity>
      {showFinancialPrompts && (
        <View style={styles.financialSection}>
          <Text style={styles.financialSubheading}>Middle School</Text>
          {FINANCIAL_IDENTITY_PROMPTS.middle.map((prompt, i) => (
            <View key={`m-${i}`} style={styles.promptRow}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
              <Text style={styles.promptText}>{prompt}</Text>
            </View>
          ))}
          <Text style={[styles.financialSubheading, { marginTop: 12 }]}>High School</Text>
          {FINANCIAL_IDENTITY_PROMPTS.high.map((prompt, i) => (
            <View key={`h-${i}`} style={styles.promptRow}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
              <Text style={styles.promptText}>{prompt}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.notesSection}>
        <Text style={styles.sectionLabel}>Discussion Notes</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Key points from the discussion..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => onComplete(notes, Array.from(discussedIds))}
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

    // Tips
    tipsToggle: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.warning + '11', borderRadius: 12, padding: 14, marginBottom: 8,
    },
    tipsToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
    tipsCard: {
      backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 16, gap: 10,
    },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tipText: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },

    // Conflicts
    conflictsList: { marginBottom: 24 },
    conflictCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    conflictContent: { flex: 1 },
    conflictText: { fontSize: 15, color: colors.text, lineHeight: 20 },
    conflictMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
    conflictActions: { marginLeft: 12 },
    conflictActionRow: { gap: 6 },
    discussButton: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
      backgroundColor: colors.primary + '22', minHeight: 36, justifyContent: 'center',
    },
    discussButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    resolveButton: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
      backgroundColor: colors.success, minHeight: 36,
    },
    resolveButtonText: { fontSize: 13, fontWeight: '600', color: colors.textInverse },
    carryForwardButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
      backgroundColor: colors.warning + '22', minHeight: 30,
    },
    carryForwardText: { fontSize: 12, fontWeight: '600', color: colors.warning },

    emptyCard: {
      alignItems: 'center', padding: 24,
      backgroundColor: colors.success + '11', borderRadius: 12, marginBottom: 24,
    },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 },
    addConflictSection: { marginBottom: 24 },
    addConflictRow: { flexDirection: 'row', gap: 8 },
    addConflictInput: {
      flex: 1, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder,
      borderRadius: 12, padding: 14, fontSize: 16, color: colors.text, minHeight: 48,
    },
    addButton: {
      width: 48, height: 48, borderRadius: 12,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    addButtonDisabled: { opacity: 0.5 },

    // Financial Identity
    financialToggle: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.primary + '11', borderRadius: 12, padding: 14, marginBottom: 8,
    },
    financialToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
    financialSection: {
      backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 24,
    },
    financialSubheading: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
    promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    promptText: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },

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
