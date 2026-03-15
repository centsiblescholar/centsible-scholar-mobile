/**
 * App tour hook - manages the interactive onboarding tour state
 * Stores completion in AsyncStorage so it only shows once
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TourStep } from '../components/tour/TourTooltip';

const TOUR_COMPLETED_KEY = 'app-tour-completed';

const PARENT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Centsible Scholar!',
    message: 'This quick tour will show you the key features. Your family dashboard is the command center for monitoring your students\' progress.',
    icon: 'home',
  },
  {
    id: 'grades',
    title: 'Grade Tracking',
    message: 'Enter and approve your students\' grades. Each grade earns reward money based on the base amount you set per student.',
    icon: 'school',
  },
  {
    id: 'behavior',
    title: 'Behavior Assessments',
    message: 'Daily behavior check-ins across 10 categories. Higher scores unlock bonus rewards. Students can also submit their own assessments for your review.',
    icon: 'fitness',
  },
  {
    id: 'earnings',
    title: 'Earnings & Savings',
    message: 'Track paychecks, set savings goals, and use the What-If Calculator to show students how improvements affect their earnings.',
    icon: 'cash',
  },
  {
    id: 'learn',
    title: 'Daily Challenges',
    message: 'Your students answer a financial literacy question each day. They earn XP, level up, and unlock achievement badges!',
    icon: 'bulb',
  },
];

const STUDENT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Centsible Scholar!',
    message: 'Let\'s take a quick look around. Complete daily tasks to earn rewards and level up!',
    icon: 'rocket',
  },
  {
    id: 'daily-tasks',
    title: 'Your Daily Tasks',
    message: 'Each day, complete the Question of the Day and your Behavior Check-in. Building streaks earns bonus XP!',
    icon: 'checkmark-circle',
  },
  {
    id: 'grades',
    title: 'Your Grades',
    message: 'View your grades and see how much you\'re earning. Better grades = bigger rewards!',
    icon: 'school',
  },
  {
    id: 'earnings',
    title: 'Earnings & Goals',
    message: 'Your paycheck is split into taxes, retirement, savings, and spending money - just like a real job! Set savings goals to work toward.',
    icon: 'cash',
  },
  {
    id: 'badges',
    title: 'Achievement Badges',
    message: 'Earn badges for academic excellence, good behavior streaks, and milestone earnings. Check the badge showcase on your dashboard!',
    icon: 'trophy',
  },
];

export function useAppTour(userRole: 'parent' | 'student' | null) {
  const [showTour, setShowTour] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const steps = userRole === 'parent' ? PARENT_TOUR_STEPS : STUDENT_TOUR_STEPS;
  const tourKey = `${TOUR_COMPLETED_KEY}-${userRole}`;

  useEffect(() => {
    if (!userRole) return;
    checkTourStatus();
  }, [userRole]);

  const checkTourStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(tourKey);
      if (!completed) {
        setShowTour(true);
      }
    } catch {
      // Don't show tour if we can't read storage
    } finally {
      setLoaded(true);
    }
  };

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStepIndex, steps.length]);

  const completeTour = useCallback(async () => {
    setShowTour(false);
    setCurrentStepIndex(0);
    try {
      await AsyncStorage.setItem(tourKey, 'true');
    } catch {
      // Silently fail
    }
  }, [tourKey]);

  const restartTour = useCallback(() => {
    setCurrentStepIndex(0);
    setShowTour(true);
  }, []);

  return {
    showTour,
    currentStep: steps[currentStepIndex] || null,
    currentStepIndex,
    totalSteps: steps.length,
    nextStep,
    skipTour: completeTour,
    restartTour,
    loaded,
  };
}
