import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { supabase } from '../src/integrations/supabase/client';
import { useTheme, type ThemeColors } from '@/theme';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

const GRADE_LEVELS = [
  '7', '8', '9', '10', '11', '12',
  '13', '14', '15', '16',
];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, isLoading: profileLoading, error, refetch, isStudent } = useUserProfile();

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [baseRewardAmount, setBaseRewardAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setGradeLevel(profile.grade_level || '');
      setBaseRewardAmount(profile.base_reward_amount?.toString() || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (isStudent && !gradeLevel) {
      Alert.alert('Error', 'Grade level is required');
      return;
    }

    const rewardAmount = parseFloat(baseRewardAmount);
    if (isStudent && (isNaN(rewardAmount) || rewardAmount < 0)) {
      Alert.alert('Error', 'Please enter a valid base reward amount');
      return;
    }

    setSaving(true);

    try {
      if (!profile?.id) {
        throw new Error('Profile not found');
      }

      if (isStudent) {
        // Update student profile
        const { error } = await supabase
          .from('student_profiles')
          .update({
            name: name.trim(),
            grade_level: gradeLevel,
            base_reward_amount: rewardAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Update parent profile - split name into first and last
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { error } = await supabase
          .from('parent_profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
      }

      await refetch();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonList count={3} cardHeight={80} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorState message="Failed to load profile" onRetry={refetch} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email (read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{user?.email}</Text>
            </View>
            <Text style={styles.helpText}>Email cannot be changed</Text>
          </View>

          {/* Student-specific fields */}
          {isStudent && (
            <>
              {/* Grade Level */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Grade Level</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowGradePicker(!showGradePicker)}
                >
                  <Text style={gradeLevel ? styles.pickerText : styles.pickerPlaceholder}>
                    {gradeLevel ? `Grade ${gradeLevel}` : 'Select grade level'}
                  </Text>
                  <Text style={styles.pickerChevron}>{showGradePicker ? '\u25B2' : '\u25BC'}</Text>
                </TouchableOpacity>

                {showGradePicker && (
                  <View style={styles.gradePickerContainer}>
                    {GRADE_LEVELS.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.gradeOption,
                          gradeLevel === grade && styles.gradeOptionSelected,
                        ]}
                        onPress={() => {
                          setGradeLevel(grade);
                          setShowGradePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.gradeOptionText,
                            gradeLevel === grade && styles.gradeOptionTextSelected,
                          ]}
                        >
                          Grade {grade}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Base Reward Amount */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Base Reward Amount</Text>
                <View style={styles.currencyInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.currencyInput}
                    value={baseRewardAmount}
                    onChangeText={setBaseRewardAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.helpText}>Amount earned per A grade</Text>
              </View>
            </>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      padding: 16,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    readOnlyField: {
      backgroundColor: colors.input,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    readOnlyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    helpText: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 4,
    },
    pickerButton: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerText: {
      fontSize: 16,
      color: colors.text,
    },
    pickerPlaceholder: {
      fontSize: 16,
      color: colors.textTertiary,
    },
    pickerChevron: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    gradePickerContainer: {
      marginTop: 8,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    gradeOption: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundSecondary,
    },
    gradeOptionSelected: {
      backgroundColor: colors.primaryLight,
    },
    gradeOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    gradeOptionTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    currencyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
    },
    currencySymbol: {
      fontSize: 16,
      color: colors.textSecondary,
      marginRight: 4,
    },
    currencyInput: {
      flex: 1,
      padding: 16,
      paddingLeft: 0,
      fontSize: 16,
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
      minHeight: 44,
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
  });
}
