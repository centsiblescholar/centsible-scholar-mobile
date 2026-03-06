import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/theme';

interface Props {
  completed: boolean;
  onComplete: () => void;
}

const BREATH_DURATION = 4000; // 4 seconds per phase
const TOTAL_CYCLES = 3;

export function MeetingStep1Breathing({ completed, onComplete }: Props) {
  const { colors } = useTheme();
  const [isBreathing, setIsBreathing] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const runBreathingCycle = (currentCycle: number) => {
    if (currentCycle >= TOTAL_CYCLES) {
      setIsBreathing(false);
      onComplete();
      return;
    }

    // Inhale
    setPhase('inhale');
    Animated.timing(scaleAnim, {
      toValue: 1.5,
      duration: BREATH_DURATION,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      // Hold
      setPhase('hold');
      timerRef.current = setTimeout(() => {
        // Exhale
        setPhase('exhale');
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: BREATH_DURATION,
          useNativeDriver: true,
        }).start();

        timerRef.current = setTimeout(() => {
          setCycle(currentCycle + 1);
          runBreathingCycle(currentCycle + 1);
        }, BREATH_DURATION);
      }, BREATH_DURATION);
    }, BREATH_DURATION);
  };

  const startBreathing = () => {
    setCycle(0);
    setIsBreathing(true);
    runBreathingCycle(0);
  };

  const styles = createStyles(colors);

  if (completed) {
    return (
      <View style={styles.container}>
        <View style={styles.completedCard}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.completedText}>Breathing exercise completed!</Text>
          <Text style={styles.completedSubtext}>Everyone is centered and ready.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Take a moment to center yourselves. Everyone breathe together.
      </Text>

      {isBreathing ? (
        <View style={styles.breathingContainer}>
          <Animated.View style={[styles.breathCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.breathText}>
              {phase === 'inhale' ? 'Breathe In' : phase === 'hold' ? 'Hold' : 'Breathe Out'}
            </Text>
          </Animated.View>
          <Text style={styles.cycleText}>
            Cycle {cycle + 1} of {TOTAL_CYCLES}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.startButton} onPress={startBreathing}>
          <Ionicons name="leaf" size={24} color={colors.textInverse} />
          <Text style={styles.startButtonText}>Start Breathing Exercise</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
        <Text style={styles.skipButtonText}>Skip this step</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: 16, alignItems: 'center' },
    instruction: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
    breathingContainer: { alignItems: 'center', marginBottom: 32 },
    breathCircle: {
      width: 160, height: 160, borderRadius: 80,
      backgroundColor: colors.primary + '33',
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 24,
    },
    breathText: { fontSize: 18, fontWeight: '600', color: colors.primary },
    cycleText: { fontSize: 14, color: colors.textSecondary },
    startButton: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16,
      borderRadius: 16, marginBottom: 24, minHeight: 52,
    },
    startButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
    skipButton: { padding: 12 },
    skipButtonText: { fontSize: 14, color: colors.textTertiary },
    completedCard: {
      alignItems: 'center', padding: 32,
      backgroundColor: colors.success + '11', borderRadius: 16,
      width: '100%',
    },
    completedText: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
    completedSubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  });
}
