import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useStudent } from '../../src/contexts/StudentContext';
import { useQuestionOfTheDay } from '../../src/hooks/useQuestionOfTheDay';

export default function LearnScreen() {
  const { user } = useAuth();
  const { selectedStudent, isParentView } = useStudent();
  const [refreshing, setRefreshing] = useState(false);

  // Use student's grade level
  const gradeLevel = selectedStudent?.grade_level?.toString() || '12';

  const {
    currentQuestion,
    selectedAnswer,
    showResult,
    isCorrect,
    saving,
    loading,
    hasAnsweredToday,
    streakCount,
    handleAnswerSelect,
    handleSubmitAnswer,
  } = useQuestionOfTheDay(gradeLevel);

  const onRefresh = async () => {
    setRefreshing(true);
    // Hook will refetch on next render
    setRefreshing(false);
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionSelected : styles.option;
    }

    // Show result
    if (index === currentQuestion?.correctAnswer) {
      return styles.optionCorrect;
    }
    if (selectedAnswer === index && !isCorrect) {
      return styles.optionIncorrect;
    }
    return styles.option;
  };

  const getOptionTextStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionTextSelected : styles.optionText;
    }

    if (index === currentQuestion?.correctAnswer) {
      return styles.optionTextCorrect;
    }
    if (selectedAnswer === index && !isCorrect) {
      return styles.optionTextIncorrect;
    }
    return styles.optionText;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading today's question...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Challenge</Text>
          <Text style={styles.headerSubtitle}>Financial Education</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Questions Available</Text>
          <Text style={styles.emptyDescription}>
            Questions for grade {gradeLevel} are coming soon!
          </Text>
        </View>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Challenge</Text>
        <Text style={styles.headerSubtitle}>Financial Education</Text>
      </View>

      {streakCount > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streakCount} Day Streak!</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.questionCard}>
          <View style={styles.topicBadge}>
            <Text style={styles.topicText}>{currentQuestion.topic}</Text>
          </View>

          <Text style={styles.question}>{currentQuestion.question}</Text>

          {hasAnsweredToday && showResult && (
            <View style={styles.alreadyAnswered}>
              <Text style={styles.alreadyAnsweredText}>✓ Already answered today</Text>
            </View>
          )}
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getOptionStyle(index)}
              onPress={() => handleAnswerSelect(index)}
              disabled={showResult || saving}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionLetter, selectedAnswer === index && !showResult && styles.optionLetterSelected]}>
                  <Text style={[styles.optionLetterText, selectedAnswer === index && !showResult && styles.optionLetterTextSelected]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={getOptionTextStyle(index)}>{option}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!showResult && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (selectedAnswer === null || saving) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAnswer}
            disabled={selectedAnswer === null || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            )}
          </TouchableOpacity>
        )}

        {showResult && (
          <View style={[styles.resultCard, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
            <Text style={styles.resultTitle}>
              {isCorrect ? '🎉 Correct!' : '❌ Not quite right'}
            </Text>
            <Text style={styles.resultExplanation}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why Financial Education?</Text>
          <Text style={styles.infoText}>
            Answer daily questions to build your financial knowledge and earn bonus rewards!
            The more you learn, the better prepared you'll be for managing money in the future.
          </Text>
        </View>
      </View>
    </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    gap: 8,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B45309',
  },
  content: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 26,
  },
  alreadyAnswered: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  alreadyAnsweredText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  optionCorrect: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  optionIncorrect: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterSelected: {
    backgroundColor: '#4F46E5',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  optionLetterTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    flex: 1,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  optionTextCorrect: {
    flex: 1,
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  optionTextIncorrect: {
    flex: 1,
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultCorrect: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  resultIncorrect: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  resultExplanation: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#115E59',
    lineHeight: 22,
  },
});
