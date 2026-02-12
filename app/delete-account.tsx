import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAccountDeletion } from '../src/hooks/useAccountDeletion';
import { useTheme, type ThemeColors } from '@/theme';

export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    step,
    isDeleting,
    error,
    studentCount,
    canDelete,
    subscriptionBlockReason,
    setStep,
    deleteAccount,
  } = useAccountDeletion();

  const [confirmText, setConfirmText] = useState('');

  const isConfirmValid = confirmText.trim() === 'DELETE';

  // --- Deleting State ---
  if (step === 'deleting') {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.error} />
        <Text style={styles.deletingText}>Deleting your account...</Text>
        <Text style={styles.deletingSubtext}>
          This may take a moment. Please do not close the app.
        </Text>
      </View>
    );
  }

  // --- Step 2: Confirmation ---
  if (step === 'confirm') {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Ionicons name="warning" size={56} color={colors.error} style={styles.icon} />

            <Text style={styles.title}>Confirm Deletion</Text>

            <Text style={styles.instruction}>
              Type <Text style={styles.deleteBold}>DELETE</Text> below to confirm account deletion.
            </Text>

            <TextInput
              style={styles.input}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type DELETE to confirm"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
            />

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Text style={styles.supportText}>
                    Contact support at support@centsiblescholar.com
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => {
                  setConfirmText('');
                  setStep('warning');
                }}
                disabled={isDeleting}
              >
                <Text style={styles.outlineButtonText}>Go Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.destructiveButton,
                  !isConfirmValid && styles.buttonDisabled,
                ]}
                onPress={deleteAccount}
                disabled={!isConfirmValid || isDeleting}
              >
                <Text style={styles.destructiveButtonText}>Delete My Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- Step 1: Warning ---
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Ionicons name="alert-circle" size={64} color={colors.error} style={styles.icon} />

        <Text style={styles.title}>Delete Your Account</Text>

        <Text style={styles.warningText}>
          This action is permanent and cannot be undone. All your data will be deleted, including:
        </Text>

        <View style={styles.bulletList}>
          <BulletItem text="Your profile and settings" colors={colors} styles={styles} />
          <BulletItem text="Grade records and transcripts" colors={colors} styles={styles} />
          <BulletItem text="Behavior assessments and scores" colors={colors} styles={styles} />
          <BulletItem text="Question of the Day history" colors={colors} styles={styles} />
          <BulletItem text="Earnings and savings goals" colors={colors} styles={styles} />
        </View>

        {studentCount > 0 && (
          <View style={styles.studentWarningBox}>
            <Ionicons name="people" size={22} color={colors.error} />
            <Text style={styles.studentWarningText}>
              This will also permanently delete{' '}
              <Text style={styles.boldText}>
                {studentCount} student account{studentCount !== 1 ? 's' : ''}
              </Text>{' '}
              and all their data.
            </Text>
          </View>
        )}

        {subscriptionBlockReason && (
          <View style={styles.subscriptionBlockBox}>
            <Ionicons name="card" size={22} color={colors.warning} />
            <View style={styles.subscriptionBlockContent}>
              <Text style={styles.subscriptionBlockText}>
                You must cancel your subscription before deleting your account.
              </Text>
              <TouchableOpacity
                style={styles.manageSubLink}
                onPress={() => router.push('/manage-subscription' as any)}
              >
                <Text style={styles.manageSubLinkText}>Manage Subscription</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => router.back()}
          >
            <Text style={styles.outlineButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.destructiveButton,
              !canDelete && styles.buttonDisabled,
            ]}
            onPress={() => setStep('confirm')}
            disabled={!canDelete}
          >
            <Text style={styles.destructiveButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// --- Bullet Item Component ---
function BulletItem({ text, colors, styles }: { text: string; colors: ThemeColors; styles: any }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },
    content: { padding: 24, paddingBottom: 48 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
    icon: { alignSelf: 'center', marginBottom: 16, marginTop: 8 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 16 },
    warningText: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 16 },
    bulletList: { marginBottom: 20 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 4 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error, marginTop: 8, marginRight: 12 },
    bulletText: { fontSize: 15, color: colors.text, flex: 1, lineHeight: 22 },
    studentWarningBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error + '33', borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 },
    studentWarningText: { fontSize: 15, color: colors.error, flex: 1, lineHeight: 22 },
    boldText: { fontWeight: '700' },
    subscriptionBlockBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.warning + '10', borderWidth: 1, borderColor: colors.warning + '33', borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 },
    subscriptionBlockContent: { flex: 1 },
    subscriptionBlockText: { fontSize: 15, color: colors.warning, lineHeight: 22, marginBottom: 8 },
    manageSubLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    manageSubLinkText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    outlineButton: { flex: 1, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    outlineButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
    destructiveButton: { flex: 1, backgroundColor: colors.error, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    destructiveButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
    buttonDisabled: { opacity: 0.4 },
    instruction: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 16 },
    deleteBold: { fontWeight: '700', color: colors.error },
    input: { borderWidth: 2, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', letterSpacing: 4, marginBottom: 16 },
    errorCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error + '33', borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 },
    errorTextContainer: { flex: 1 },
    errorText: { fontSize: 15, color: colors.error, lineHeight: 22, marginBottom: 4 },
    supportText: { fontSize: 13, color: colors.error },
    deletingText: { fontSize: 18, fontWeight: '600', color: colors.error, marginTop: 20 },
    deletingSubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  });
}
