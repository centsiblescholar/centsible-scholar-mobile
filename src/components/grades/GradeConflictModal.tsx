import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradeConflict } from '../../hooks/useGradeConflicts';
import { supabase } from '../../integrations/supabase/client';
import { useTheme, type ThemeColors, grades as gradeColors } from '@/theme';

interface GradeConflictModalProps {
  visible: boolean;
  onClose: () => void;
  conflicts: GradeConflict[];
  onResolved: () => void;
}

export default function GradeConflictModal({ visible, onClose, conflicts, onResolved }: GradeConflictModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const resolveConflict = async (conflict: GradeConflict, keepGradeId: string, removeGradeId: string) => {
    try {
      // Delete the rejected grade entry
      const { error } = await supabase
        .from('student_grades')
        .delete()
        .eq('id', removeGradeId);

      if (error) throw error;

      Alert.alert('Resolved', `Kept the ${keepGradeId === conflict.parent_grade_id ? 'parent' : 'student'}'s grade for ${conflict.subject}.`);
      onResolved();
    } catch (err) {
      Alert.alert('Error', 'Failed to resolve conflict. Please try again.');
      console.error('Error resolving grade conflict:', err);
    }
  };

  const getGradeColor = (grade: string): string => {
    return gradeColors[grade as keyof typeof gradeColors] || colors.textSecondary;
  };

  const renderConflict = ({ item }: { item: GradeConflict }) => (
    <View style={styles.conflictCard}>
      <Text style={styles.subjectName}>{item.subject}</Text>

      <View style={styles.comparisonRow}>
        {/* Parent Grade */}
        <View style={styles.gradeBox}>
          <Text style={styles.gradeBoxLabel}>Parent</Text>
          <Text style={[styles.gradeBoxLetter, { color: getGradeColor(item.parent_grade) }]}>
            {item.parent_grade}
          </Text>
        </View>

        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>vs</Text>
        </View>

        {/* Student Grade */}
        <View style={styles.gradeBox}>
          <Text style={styles.gradeBoxLabel}>Student</Text>
          <Text style={[styles.gradeBoxLetter, { color: getGradeColor(item.student_grade) }]}>
            {item.student_grade}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.resolveBtn, { backgroundColor: '#EFF6FF' }]}
          onPress={() => resolveConflict(item, item.parent_grade_id, item.student_grade_id)}
        >
          <Text style={[styles.resolveBtnText, { color: '#2563EB' }]}>Keep Parent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resolveBtn, { backgroundColor: '#F0FDF4' }]}
          onPress={() => resolveConflict(item, item.student_grade_id, item.parent_grade_id)}
        >
          <Text style={[styles.resolveBtnText, { color: '#16A34A' }]}>Keep Student</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Grade Conflicts</Text>
              <Text style={styles.modalSubtitle}>
                {conflicts.length} subject{conflicts.length !== 1 ? 's' : ''} need resolution
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={conflicts}
            keyExtractor={(item) => `${item.student_grade_id}-${item.parent_grade_id}`}
            renderItem={renderConflict}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  conflictCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 14,
  },
  gradeBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
  },
  gradeBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gradeBoxLetter: {
    fontSize: 32,
    fontWeight: '800',
  },
  vsCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resolveBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resolveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
