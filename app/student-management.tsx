import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStudentManagement, StudentProfile, CreateStudentInput } from '../src/hooks/useStudentManagement';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { getStudentLimit } from '../src/constants/subscriptionPlans';
import { useSubscriptionStatus } from '../src/hooks/useSubscriptionStatus';
import { useTheme, type ThemeColors } from '@/theme';

const screenWidth = Dimensions.get('window').width;

const GRADE_LEVELS = [
  '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade',
  '11th Grade', '12th Grade',
];

function generatePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export default function StudentManagementScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isParent } = useUserProfile();
  const { tier } = useSubscriptionStatus();
  const studentLimit = getStudentLimit(tier);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [gradeLevel, setGradeLevel] = useState('6th Grade');
  const [baseReward, setBaseReward] = useState('10');

  const {
    activeStudents,
    inactiveStudents,
    isLoading,
    error,
    refetch,
    createStudent,
    isCreating,
    updateStudent,
    isUpdating,
    deactivateStudent,
    isDeactivating,
    reactivateStudent,
    isReactivating,
  } = useStudentManagement();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword(generatePassword());
    setShowPassword(false);
    setGradeLevel('6th Grade');
    setBaseReward('10');
  };

  const handleOpenAddModal = () => {
    if (studentLimit > 0 && activeStudents.length >= studentLimit) {
      Alert.alert(
        'Student Limit Reached',
        `Your plan allows ${studentLimit} student${studentLimit !== 1 ? 's' : ''}. Upgrade your plan to add more students.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Plan', onPress: () => router.push('/paywall' as any) },
        ]
      );
      return;
    }
    resetForm();
    setShowAddModal(true);
  };

  const handleAddStudent = async () => {
    if (studentLimit > 0 && activeStudents.length >= studentLimit) {
      Alert.alert(
        'Student Limit Reached',
        `Your plan allows ${studentLimit} student${studentLimit !== 1 ? 's' : ''}. Upgrade your plan to add more students.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Plan', onPress: () => router.push('/paywall' as any) },
        ]
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a student name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a student email address');
      return;
    }

    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    const reward = parseFloat(baseReward);
    if (isNaN(reward) || reward < 0) {
      Alert.alert('Error', 'Please enter a valid base reward amount');
      return;
    }

    try {
      await createStudent({
        name: name.trim(),
        email: email.trim(),
        grade_level: gradeLevel,
        password: password,
        base_reward_amount: reward,
      });
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Student added successfully!\n\nSave their login credentials:\nEmail: ' + email.trim() + '\nPassword: ' + password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add student');
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a student name');
      return;
    }

    const reward = parseFloat(baseReward);
    if (isNaN(reward) || reward < 0) {
      Alert.alert('Error', 'Please enter a valid base reward amount');
      return;
    }

    try {
      await updateStudent(selectedStudent.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        grade_level: gradeLevel,
        base_reward_amount: reward,
      });
      setShowEditModal(false);
      setSelectedStudent(null);
      resetForm();
      Alert.alert('Success', 'Student updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update student');
    }
  };

  const handleDeactivate = (student: StudentProfile) => {
    Alert.alert(
      'Deactivate Student',
      `Are you sure you want to deactivate ${student.name}? They will no longer appear in your active students list, but their data will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateStudent(student.id);
              Alert.alert('Success', `${student.name} has been deactivated`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to deactivate student');
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async (student: StudentProfile) => {
    try {
      await reactivateStudent(student.id);
      Alert.alert('Success', `${student.name} has been reactivated`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reactivate student');
    }
  };

  const openEditModal = (student: StudentProfile) => {
    setSelectedStudent(student);
    setName(student.name);
    setEmail(student.email || '');
    setGradeLevel(student.grade_level);
    setBaseReward(student.base_reward_amount.toString());
    setShowEditModal(true);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (!isParent) {
    return (
      <View style={styles.accessDenied}>
        <Ionicons name="lock-closed" size={64} color={colors.textTertiary} />
        <Text style={styles.accessDeniedTitle}>Parent Access Only</Text>
        <Text style={styles.accessDeniedText}>
          This feature is only available for parent accounts.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Header with Add Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeStudents.length} Active Student{activeStudents.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenAddModal}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Active Students List */}
        {activeStudents.length > 0 ? (
          <View style={styles.studentsList}>
            {activeStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={() => openEditModal(student)}
                onDeactivate={() => handleDeactivate(student)}
                formatCurrency={formatCurrency}
                colors={colors}
                styles={styles}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Students Yet</Text>
            <Text style={styles.emptyText}>
              Add your first student to get started with Centsible Scholar.
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleOpenAddModal}
            >
              <Ionicons name="add-circle" size={20} color={colors.textInverse} />
              <Text style={styles.addFirstButtonText}>Add Student</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inactive Students Section */}
        {inactiveStudents.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.inactiveHeader}
              onPress={() => setShowInactive(!showInactive)}
            >
              <Text style={styles.inactiveTitle}>
                Inactive Students ({inactiveStudents.length})
              </Text>
              <Ionicons
                name={showInactive ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showInactive && (
              <View style={styles.studentsList}>
                {inactiveStudents.map((student) => (
                  <InactiveStudentCard
                    key={student.id}
                    student={student}
                    onReactivate={() => handleReactivate(student)}
                    isReactivating={isReactivating}
                    colors={colors}
                    styles={styles}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </View>

      {/* Add Student Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Student</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter student name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Student Email *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="student@email.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.inputHint}>
                  Your student will use this email to log in
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.passwordRow}>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Min 8 characters"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => setPassword(generatePassword())}
                  >
                    <Ionicons name="refresh" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  Save this password! Your student will need it to log in.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Grade Level *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.gradePicker}
                >
                  {GRADE_LEVELS.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.gradeOption,
                        gradeLevel === grade && styles.gradeOptionActive,
                      ]}
                      onPress={() => setGradeLevel(grade)}
                    >
                      <Text
                        style={[
                          styles.gradeOptionText,
                          gradeLevel === grade && styles.gradeOptionTextActive,
                        ]}
                      >
                        {grade.replace(' Grade', '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Base Reward Amount *</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.currencyField}
                    value={baseReward}
                    onChangeText={setBaseReward}
                    placeholder="10.00"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.inputHint}>
                  Amount earned for each A grade
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isCreating && styles.buttonDisabled]}
                  onPress={handleAddStudent}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={styles.confirmButtonText}>Add Student</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Student</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter student name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="student@email.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Grade Level *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.gradePicker}
                >
                  {GRADE_LEVELS.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.gradeOption,
                        gradeLevel === grade && styles.gradeOptionActive,
                      ]}
                      onPress={() => setGradeLevel(grade)}
                    >
                      <Text
                        style={[
                          styles.gradeOptionText,
                          gradeLevel === grade && styles.gradeOptionTextActive,
                        ]}
                      >
                        {grade.replace(' Grade', '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Base Reward Amount *</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.currencyField}
                    value={baseReward}
                    onChangeText={setBaseReward}
                    placeholder="10.00"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowEditModal(false);
                    setSelectedStudent(null);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isUpdating && styles.buttonDisabled]}
                  onPress={handleEditStudent}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={styles.confirmButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Student Card Component
function StudentCard({
  student,
  onEdit,
  onDeactivate,
  formatCurrency,
  colors,
  styles,
}: {
  student: StudentProfile;
  onEdit: () => void;
  onDeactivate: () => void;
  formatCurrency: (amount: number) => string;
  colors: ThemeColors;
  styles: any;
}) {
  return (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentInitial}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentGrade}>{student.grade_level}</Text>
        </View>
      </View>

      <View style={styles.studentDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Base Reward</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(student.base_reward_amount)}
          </Text>
        </View>
        {student.email && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{student.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.studentActions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="pencil" size={18} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deactivateButton} onPress={onDeactivate}>
          <Ionicons name="person-remove" size={18} color={colors.error} />
          <Text style={styles.deactivateButtonText}>Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Inactive Student Card Component
function InactiveStudentCard({
  student,
  onReactivate,
  isReactivating,
  colors,
  styles,
}: {
  student: StudentProfile;
  onReactivate: () => void;
  isReactivating: boolean;
  colors: ThemeColors;
  styles: any;
}) {
  return (
    <View style={[styles.studentCard, styles.inactiveCard]}>
      <View style={styles.studentHeader}>
        <View style={[styles.studentAvatar, styles.inactiveAvatar]}>
          <Text style={[styles.studentInitial, styles.inactiveInitial]}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, styles.inactiveName]}>{student.name}</Text>
          <Text style={styles.studentGrade}>{student.grade_level}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.reactivateButton}
        onPress={onReactivate}
        disabled={isReactivating}
      >
        {isReactivating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Ionicons name="person-add" size={18} color={colors.primary} />
            <Text style={styles.reactivateButtonText}>Reactivate</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
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
    },
    accessDenied: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      padding: 32,
    },
    accessDeniedTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16,
    },
    accessDeniedText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    backButton: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 12,
      minHeight: 44,
      justifyContent: 'center',
    },
    backButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    studentsList: {
      gap: 16,
    },
    studentCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inactiveCard: {
      opacity: 0.7,
    },
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    studentAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inactiveAvatar: {
      backgroundColor: colors.textTertiary,
    },
    studentInitial: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textInverse,
    },
    inactiveInitial: {
      color: colors.textInverse,
    },
    studentInfo: {
      marginLeft: 16,
    },
    studentName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    inactiveName: {
      color: colors.textSecondary,
    },
    studentGrade: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    studentDetails: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      marginBottom: 16,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    studentActions: {
      flexDirection: 'row',
      gap: 12,
    },
    editButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: colors.primaryLight,
      borderRadius: 10,
      gap: 8,
      minHeight: 44,
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    deactivateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: colors.error + '15',
      borderRadius: 10,
      gap: 8,
      minHeight: 44,
    },
    deactivateButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.error,
    },
    reactivateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: colors.primaryLight,
      borderRadius: 10,
      gap: 8,
      minHeight: 44,
    },
    reactivateButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 40,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 20,
    },
    addFirstButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      minHeight: 48,
    },
    addFirstButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    section: {
      marginTop: 24,
    },
    inactiveHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 12,
      minHeight: 44,
    },
    inactiveTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalScrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.text,
    },
    inputHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    passwordInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
    },
    passwordInput: {
      flex: 1,
      padding: 14,
      fontSize: 16,
      color: colors.text,
    },
    passwordToggle: {
      paddingHorizontal: 12,
      paddingVertical: 14,
    },
    generateButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradePicker: {
      flexGrow: 0,
    },
    gradeOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      marginRight: 8,
      minHeight: 44,
      justifyContent: 'center',
    },
    gradeOptionActive: {
      backgroundColor: colors.primary,
    },
    gradeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    gradeOptionTextActive: {
      color: colors.textInverse,
    },
    currencyInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginRight: 4,
    },
    currencyField: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    confirmButton: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textInverse,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });
}
