import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { generateTimeOptions, formatMeetingTime, MeetingRecurrence } from '../../types/family-meeting';

interface Props {
  scheduledDate: string | null;
  scheduledTime: string | null;
  recurrence: MeetingRecurrence;
  onSave: (date: string, time: string, recurrence: string) => void;
  onCancel: () => void;
}

const RECURRENCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Every 2 Weeks', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

export function MeetingScheduler({
  scheduledDate,
  scheduledTime,
  recurrence,
  onSave,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const [date, setDate] = useState<Date>(
    scheduledDate ? new Date(scheduledDate) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState(scheduledTime || '18:00');
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>(recurrence || 'weekly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const handleSave = () => {
    onSave(date.toISOString(), selectedTime, selectedRecurrence);
  };

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
        <Text style={styles.title}>Schedule Meeting</Text>
      </View>

      {/* Date Picker */}
      <TouchableOpacity
        style={styles.field}
        onPress={() => setShowDatePicker(!showDatePicker)}
      >
        <Text style={styles.fieldLabel}>Date</Text>
        <View style={styles.fieldValue}>
          <Text style={styles.fieldValueText}>{formattedDate}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
          themeVariant="light"
        />
      )}

      {/* Time Picker */}
      <TouchableOpacity
        style={styles.field}
        onPress={() => setShowTimePicker(!showTimePicker)}
      >
        <Text style={styles.fieldLabel}>Time</Text>
        <View style={styles.fieldValue}>
          <Text style={styles.fieldValueText}>{formatMeetingTime(selectedTime)}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
      {showTimePicker && (
        <View style={styles.timeGrid}>
          {timeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.timeChip, selectedTime === opt.value && styles.timeChipActive]}
              onPress={() => {
                setSelectedTime(opt.value);
                setShowTimePicker(false);
              }}
            >
              <Text style={[styles.timeChipText, selectedTime === opt.value && styles.timeChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recurrence */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Repeat</Text>
        <View style={styles.recurrenceChips}>
          {RECURRENCE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.recurrenceChip, selectedRecurrence === opt.value && styles.recurrenceChipActive]}
              onPress={() => setSelectedRecurrence(opt.value)}
            >
              <Text style={[styles.recurrenceChipText, selectedRecurrence === opt.value && styles.recurrenceChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color={colors.textInverse} />
          <Text style={styles.saveButtonText}>Save Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
      marginBottom: 24,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    field: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
    fieldValue: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder,
      borderRadius: 12, padding: 14, minHeight: 48,
    },
    fieldValueText: { fontSize: 16, color: colors.text },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, marginTop: -8 },
    timeChip: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
      backgroundColor: colors.backgroundSecondary, minHeight: 36, justifyContent: 'center',
    },
    timeChipActive: { backgroundColor: colors.primary },
    timeChipText: { fontSize: 13, color: colors.textSecondary },
    timeChipTextActive: { color: colors.textInverse, fontWeight: '600' },
    recurrenceChips: { flexDirection: 'row', gap: 8 },
    recurrenceChip: {
      flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
      backgroundColor: colors.backgroundSecondary, minHeight: 44, justifyContent: 'center',
    },
    recurrenceChipActive: { backgroundColor: colors.primary },
    recurrenceChipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    recurrenceChipTextActive: { color: colors.textInverse },
    actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: {
      flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
      backgroundColor: colors.backgroundSecondary, minHeight: 48, justifyContent: 'center',
    },
    cancelButtonText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    saveButton: {
      flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, minHeight: 48,
    },
    saveButtonText: { fontSize: 15, fontWeight: '600', color: colors.textInverse },
  });
}
