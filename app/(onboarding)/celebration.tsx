import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { useAuth } from '../../src/contexts/AuthContext';
import { studentProfileKeys } from '../../src/hooks/useStudentProfile';
import { useTheme, type ThemeColors } from '@/theme';

export default function CelebrationScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState(false);

  const handleGoToDashboard = async () => {
    if (!user) {
      router.replace('/(tabs)/dashboard');
      return;
    }

    setCompleting(true);
    try {
      const updatePayload = { has_completed_onboarding: true };

      const { error } = await supabase
        .from('student_profiles')
        .update(updatePayload)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating onboarding status:', error);
        // Also try matching by email in case user_id doesn't match
        if (user.email) {
          const { error: emailError } = await supabase
            .from('student_profiles')
            .update(updatePayload)
            .eq('email', user.email);

          if (emailError) {
            console.error('Error updating onboarding status by email:', emailError);
            Alert.alert(
              'Heads up',
              'We had trouble saving your progress, but don\'t worry -- you can keep using the app!',
            );
          }
        }
      }

      // Invalidate cache so useStudentProfile picks up the change
      await queryClient.invalidateQueries({ queryKey: studentProfileKeys.all });
    } catch (err) {
      console.error('Unexpected error completing onboarding:', err);
      // Don't trap student -- still navigate to dashboard
    } finally {
      setCompleting(false);
      router.replace('/(tabs)/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.celebrationEmoji}>🎉🏆🎉</Text>

          <Text style={styles.title}>You're All Set!</Text>

          <Text style={styles.subtitle}>
            Great job completing the tour! You're ready to start earning and
            learning.
          </Text>

          <Text style={styles.reminder}>
            Remember: check in daily for your Question of the Day and Behavior
            assessment. You've got this!
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, completing && styles.buttonDisabled]}
          onPress={handleGoToDashboard}
          activeOpacity={0.8}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Go to Dashboard</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </View>
          )}
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
    celebrationEmoji: {
      fontSize: 64,
      marginBottom: 32,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 16,
      lineHeight: 24,
      marginBottom: 24,
    },
    reminder: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 24,
      lineHeight: 22,
      backgroundColor: colors.secondaryLight,
      borderRadius: 12,
      padding: 16,
      overflow: 'hidden',
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    buttonText: {
      color: colors.textInverse,
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
