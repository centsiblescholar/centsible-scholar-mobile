import { useState, useEffect } from 'react';
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

const GRADE_LEVELS = [
  '7', '8', '9', '10', '11', '12',
  '13', '14', '15', '16', '17', '18'
];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, refetch, isStudent } = useUserProfile();

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
        <ActivityIndicator size="large" color="#4F46E5" />
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
                  <Text style={styles.pickerChevron}>{showGradePicker ? '▲' : '▼'}</Text>
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
              <ActivityIndicator color="#fff" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
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
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyField: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  pickerChevron: {
    fontSize: 12,
    color: '#6B7280',
  },
  gradePickerContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  gradeOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  gradeOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  gradeOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  gradeOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
