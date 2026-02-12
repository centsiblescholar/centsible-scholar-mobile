import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStudentProfile } from '../../src/hooks/useStudentProfile';
import { useTheme, type ThemeColors } from '@/theme';

function ProgressDots({ current, total, colors }: { current: number; total: number; colors: ThemeColors }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.dot,
            { backgroundColor: i < current ? colors.primary : colors.inputBorder },
          ]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useStudentProfile();
  const firstName = profile?.name?.split(' ')[0] || 'Scholar';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ProgressDots current={1} total={3} colors={colors} />

        <View style={styles.content}>
          <View style={styles.iconRow}>
            <Ionicons name="school" size={48} color={colors.primary} />
            <Text style={styles.iconEmoji}>💰</Text>
          </View>

          <Text style={styles.title}>Welcome to{'\n'}Centsible Scholar!</Text>

          <Text style={styles.subtitle}>
            We're excited to have you here! Let's take a quick tour so you know
            how everything works.
          </Text>

          <Text style={styles.readyText}>Ready, {firstName}?</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Let's Go!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 24,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 32,
    },
    iconEmoji: {
      fontSize: 44,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 24,
      lineHeight: 24,
      marginBottom: 24,
    },
    readyText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    buttonText: {
      color: colors.textInverse,
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
