import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useQuestionOfTheDay } from '../../hooks/useQuestionOfTheDay';
import { useStudentProfile } from '../../hooks/useStudentProfile';
import { useTheme, type ThemeColors } from '@/theme';

interface QODStepProps {
  onComplete: (wasCorrect: boolean) => void;
}

export default function QODStep({ onComplete }: QODStepProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useStudentProfile();
  const gradeLevel = profile?.grade_level;

  const {
    currentQuestion,
    selectedAnswer,
    showResult,
    isCorrect,
    saving,
    loading,
    hasAnsweredToday,
    handleAnswerSelect,
    handleSubmitAnswer,
  } = useQuestionOfTheDay(gradeLevel);

  const [feedbackShown, setFeedbackShown] = useState(false);

  // If already answered today, skip this step immediately
  useEffect(() => {
    if (!loading && hasAnsweredToday) {
      onComplete(isCorrect);
    }
  }, [loading, hasAnsweredToday]);

  // After submission shows result, show feedback then proceed
  useEffect(() => {
    if (showResult && !hasAnsweredToday && !feedbackShown) {
      // Newly submitted answer -- mark feedback as shown
      setFeedbackShown(true);
    }
  }, [showResult, hasAnsweredToday, feedbackShown]);

  const handleContinue = () => {
    onComplete(isCorrect);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading today's question...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Questions Available</Text>
        <Text style={styles.emptyDescription}>
          Questions for grade {gradeLevel || '?'} are coming soon!
        </Text>
        <TouchableOpacity style={styles.continueButton} onPress={() => onComplete(false)}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionSelected : styles.option;
    }
    if (index === currentQuestion.correctAnswer) {
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
    if (index === currentQuestion.correctAnswer) {
      return styles.optionTextCorrect;
    }
    if (selectedAnswer === index && !isCorrect) {
      return styles.optionTextIncorrect;
    }
    return styles.optionText;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.topicBadge}>
          <Text style={styles.topicText}>{currentQuestion.topic}</Text>
        </View>
        <Text style={styles.question}>{currentQuestion.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(index)}
            onPress={() => handleAnswerSelect(index)}
            disabled={showResult || saving}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionLetter,
                  selectedAnswer === index && !showResult && styles.optionLetterSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetterText,
                    selectedAnswer === index && !showResult && styles.optionLetterTextSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={getOptionTextStyle(index)}>{option}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button (before answering) */}
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
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Feedback Card (after answering) */}
      {showResult && feedbackShown && (
        <View style={[styles.resultCard, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
          <Text style={styles.resultTitle}>
            {isCorrect ? 'Nice! You got it right!' : 'Not quite right'}
          </Text>
          <Text style={styles.resultExplanation}>{currentQuestion.explanation}</Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    questionCard: {
      backgroundColor: colors.card,
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
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
    },
    topicText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    question: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 26,
    },
    optionsContainer: {
      gap: 12,
      marginBottom: 20,
    },
    option: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.border,
      minHeight: 52,
      justifyContent: 'center',
    },
    optionSelected: {
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.primary,
      minHeight: 52,
      justifyContent: 'center',
    },
    optionCorrect: {
      backgroundColor: colors.secondaryLight,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.success,
      minHeight: 52,
      justifyContent: 'center',
    },
    optionIncorrect: {
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.error,
      minHeight: 52,
      justifyContent: 'center',
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
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionLetterSelected: {
      backgroundColor: colors.primary,
    },
    optionLetterText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textSecondary,
    },
    optionLetterTextSelected: {
      color: colors.textInverse,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: colors.textSecondary,
    },
    optionTextSelected: {
      flex: 1,
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    optionTextCorrect: {
      flex: 1,
      fontSize: 16,
      color: colors.success,
      fontWeight: '500',
    },
    optionTextIncorrect: {
      flex: 1,
      fontSize: 16,
      color: colors.error,
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
      minHeight: 48,
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    resultCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    resultCorrect: {
      backgroundColor: colors.secondaryLight,
      borderWidth: 2,
      borderColor: colors.success,
    },
    resultIncorrect: {
      backgroundColor: colors.primaryLight,
      borderWidth: 2,
      borderColor: colors.error,
    },
    resultTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    resultExplanation: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 16,
    },
    continueButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    continueButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
