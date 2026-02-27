import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';
import { MEETING_STEPS, TOTAL_STEPS } from '../../types/family-meeting';

interface Props {
  currentStep: number;
  onBack: (() => void) | null;
  onExit: () => void;
  children: React.ReactNode;
}

export function MeetingStepper({ currentStep, onBack, onExit, children }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const stepInfo = MEETING_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBack || onExit}
        >
          <Ionicons
            name={onBack ? 'arrow-back' : 'close'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>
            Step {currentStep + 1} of {TOTAL_STEPS}
          </Text>
          <Text style={styles.stepTitle}>{stepInfo?.label}</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={onExit}>
          <Ionicons name="close" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsRow}>
        {MEETING_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <View key={step.key} style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepDot,
                  isCompleted && styles.stepDotCompleted,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.stepDotText,
                      isCurrent && styles.stepDotTextCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepName,
                  isCurrent && styles.stepNameCurrent,
                  isCompleted && styles.stepNameCompleted,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
      backgroundColor: colors.card,
    },
    headerButton: { padding: 8, minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { alignItems: 'center', flex: 1 },
    stepLabel: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' },
    stepTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
    progressContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.card },
    progressTrack: {
      height: 4, borderRadius: 2, backgroundColor: colors.backgroundSecondary, overflow: 'hidden',
    },
    progressFill: {
      height: '100%', borderRadius: 2, backgroundColor: colors.primary,
    },
    stepsRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    stepIndicator: { alignItems: 'center', flex: 1 },
    stepDot: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    stepDotCompleted: { backgroundColor: colors.success },
    stepDotCurrent: { backgroundColor: colors.primary },
    stepDotText: { fontSize: 11, fontWeight: '700', color: colors.textTertiary },
    stepDotTextCurrent: { color: colors.textInverse },
    stepName: { fontSize: 10, color: colors.textTertiary, textAlign: 'center' },
    stepNameCurrent: { color: colors.primary, fontWeight: '600' },
    stepNameCompleted: { color: colors.success },
    content: { flex: 1 },
    contentContainer: { paddingBottom: 40 },
  });
}
