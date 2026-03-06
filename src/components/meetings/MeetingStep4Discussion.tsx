import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { MeetingConflict } from '../../types/family-meeting';

interface Props {
  pendingConflicts: MeetingConflict[];
  meetingId: string;
  initialNotes?: string;
  onComplete: (notes: string, discussedConflictIds: string[]) => void;
  onResolveConflict: (conflictId: string) => void;
  onMarkDiscussed: (conflictId: string) => void;
  onAddConflict: (description: string) => void;
}

export function MeetingStep4Discussion({
  pendingConflicts,
  meetingId,
  initialNotes,
  onComplete,
  onResolveConflict,
  onMarkDiscussed,
  onAddConflict,
}: Props) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState(initialNotes || '');
  const [newConflict, setNewConflict] = useState('');
  const [discussedIds, setDiscussedIds] = useState<Set<string>>(new Set());

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
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => onResolveConflict(conflict.id)}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                    <Text style={styles.resolveButtonText}>Resolved</Text>
                  </TouchableOpacity>
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
