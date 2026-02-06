import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { questionBank, Question } from '../data/questionBank';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakData, calculateStreak, updateStreakData, calculateXPReward, awardXP } from '../utils/questionOfTheDayApi';

export function useQuestionOfTheDay(gradeLevel: string | undefined) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [totalXP, setTotalXP] = useState<number>(0);

  const today = new Date().toISOString().split('T')[0];

  // Get user ID and check existing answer on component mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);

          // Fetch streak/XP data using shared utility
          try {
            const streakData = await getStreakData(user.id);
            if (streakData) {
              setStreakCount(streakData.streak_count || 0);
              setTotalXP(streakData.total_xp || 0);
            }
          } catch (profileError) {
            console.log('Streak/XP data not available');
          }

          await checkExistingAnswer(user.id);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Check if user has already answered today's question
  const checkExistingAnswer = async (userIdToCheck: string) => {
    try {
      const { data: existingResult } = await supabase
        .from('question_of_day_results')
        .select('passed')
        .eq('user_id', userIdToCheck)
        .eq('date', today)
        .maybeSingle();

      if (existingResult) {
        setHasAnsweredToday(true);
        setIsCorrect(existingResult.passed);
        setShowResult(true);
      }
    } catch (error) {
      console.error('Error checking existing answer:', error);
    }
  };

  const getQuestionOfTheDay = async (): Promise<Question | null> => {
    // Normalize grade level
    const normalizedGradeLevel = gradeLevel?.replace(/[a-zA-Z]+$/, '').trim();

    if (!normalizedGradeLevel) {
      return null;
    }

    // Try to get questions for the specific grade level
    let questions = questionBank[normalizedGradeLevel];
    let usedGradeLevel = normalizedGradeLevel;

    // Fallback to grade 12 if no questions
    if (!questions) {
      questions = questionBank['12'];
      usedGradeLevel = '12';

      if (!questions) {
        return null;
      }
    }

    const todayStr = new Date().toDateString();
    const savedQuestionKey = `questionOfTheDay-${todayStr}-${usedGradeLevel}`;

    // Try to get saved question from AsyncStorage
    try {
      const savedQuestion = await AsyncStorage.getItem(savedQuestionKey);
      if (savedQuestion) {
        return JSON.parse(savedQuestion);
      }
    } catch (error) {
      console.warn('AsyncStorage access failed:', error);
    }

    // Use date as seed for consistent daily question
    const dateNum = new Date().getDate() + new Date().getMonth() * 31;
    const questionIndex = dateNum % questions.length;
    const question = questions[questionIndex];

    // Try to save to AsyncStorage
    try {
      await AsyncStorage.setItem(savedQuestionKey, JSON.stringify(question));
    } catch (error) {
      console.warn('Could not save to AsyncStorage:', error);
    }

    return question;
  };

  useEffect(() => {
    const loadQuestion = async () => {
      const question = await getQuestionOfTheDay();
      setCurrentQuestion(question);

      // Only reset state if user hasn't answered today
      if (!hasAnsweredToday) {
        setSelectedAnswer(null);
        setShowResult(false);
      }
    };

    loadQuestion();
  }, [gradeLevel, hasAnsweredToday]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || showResult || !currentQuestion) return;

    setSaving(true);
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // Save result to database if user is authenticated
    if (userId) {
      try {
        // Check if result already exists for today
        const { data: existingResult } = await supabase
          .from('question_of_day_results')
          .select('id')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();

        if (existingResult) {
          // Update existing result
          const { error } = await supabase
            .from('question_of_day_results')
            .update({
              passed: correct,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingResult.id);

          if (error) throw error;
        } else {
          // Insert new result
          const { error } = await supabase
            .from('question_of_day_results')
            .insert({
              user_id: userId,
              date: today,
              passed: correct
            });

          if (error) throw error;
        }

        setHasAnsweredToday(true);

        // After successful QOD save, update streak and award XP (fire-and-forget)
        try {
          const streakData = await getStreakData(userId);
          if (streakData) {
            const streakSignal = calculateStreak(streakData.last_qod_date, today);
            let newStreakCount: number;
            if (streakSignal === -1) {
              // Consecutive day -- increment
              newStreakCount = streakData.streak_count + 1;
            } else if (streakSignal === 0) {
              // Same day -- no change
              newStreakCount = streakData.streak_count;
            } else {
              // Missed day or first time -- use signal value (1)
              newStreakCount = streakSignal;
            }

            await updateStreakData(userId, newStreakCount, today);

            const xpAwards = calculateXPReward(correct, newStreakCount);
            let totalXpEarned = 0;
            for (const award of xpAwards) {
              await awardXP(userId, userId, award);
              totalXpEarned += award.amount;
            }

            setStreakCount(newStreakCount);
            setXpEarned(totalXpEarned);
            setTotalXP((streakData.total_xp || 0) + totalXpEarned);
          }
        } catch (streakError) {
          console.error('Error updating streak/XP:', streakError);
          // Non-blocking: don't fail QOD submission
        }
      } catch (error: any) {
        console.error('Error saving question result:', error);
      }
    }

    setSaving(false);
  };

  return {
    currentQuestion,
    selectedAnswer,
    showResult,
    isCorrect,
    saving,
    loading,
    hasAnsweredToday,
    streakCount,
    xpEarned,
    totalXP,
    handleAnswerSelect,
    handleSubmitAnswer,
  };
}
