/**
 * Badge management hook for Centsible Scholar Mobile
 * Loads, evaluates, and persists badge state via Supabase + AsyncStorage fallback
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Badge } from '../shared/types/badges';
import { GradeEntry, BehaviorAssessment } from '../shared/types';
import { BADGE_DEFINITIONS, evaluateBadges } from '../utils/badgeSystem';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_PREFIX = 'student-badges-';

export function useBadges(
  grades: GradeEntry[],
  assessments: BehaviorAssessment[],
  totalRewards: number,
  gradeLevel?: string,
  studentId: string = 'default',
) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  // Load badges on mount
  useEffect(() => {
    if (user) {
      loadBadges();
    } else {
      loadBadgesFromStorage();
    }
  }, [user, studentId]);

  const loadBadges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('student_badges')
        .select('badge_data')
        .eq('user_id', user.id)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading badges from database:', error);
      }

      if (data?.badge_data) {
        setBadges(data.badge_data as unknown as Badge[]);
      } else {
        await loadBadgesFromStorage();
      }
    } catch (error) {
      console.error('Failed to load badges from database:', error);
      await loadBadgesFromStorage();
    } finally {
      setLoaded(true);
    }
  };

  const loadBadgesFromStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem(`${STORAGE_PREFIX}${studentId}`);
      if (saved) {
        setBadges(JSON.parse(saved));
      } else {
        setBadges(BADGE_DEFINITIONS);
      }
    } catch (error) {
      console.error('Failed to load badges from AsyncStorage:', error);
      setBadges(BADGE_DEFINITIONS);
    } finally {
      setLoaded(true);
    }
  };

  // Evaluate badges when data changes
  useEffect(() => {
    if (!loaded || badges.length === 0) return;

    const previouslyUnlocked = badges.filter(b => b.unlocked).map(b => b.id);
    const updatedBadges = evaluateBadges(grades, assessments, totalRewards, badges, gradeLevel);

    const badgesChanged = JSON.stringify(badges) !== JSON.stringify(updatedBadges);
    if (!badgesChanged) return;

    // Find newly unlocked badges
    const currentlyUnlocked = updatedBadges.filter(b => b.unlocked).map(b => b.id);
    const justUnlocked = currentlyUnlocked.filter(id => !previouslyUnlocked.includes(id));

    if (justUnlocked.length > 0) {
      const newlyUnlockedBadges = updatedBadges.filter(b => justUnlocked.includes(b.id));
      setNewBadges(newlyUnlockedBadges);
    }

    setBadges(updatedBadges);
  }, [grades, assessments, totalRewards, gradeLevel, loaded]);

  // Persist badges when they change
  useEffect(() => {
    if (badges.length > 0 && loaded) {
      saveBadges(badges);
    }
  }, [badges, user, studentId, loaded]);

  const saveBadges = useCallback(async (badgeData: Badge[]) => {
    const storageKey = `${STORAGE_PREFIX}${studentId}`;

    if (!user) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(badgeData));
      return;
    }

    try {
      const { error } = await supabase
        .from('student_badges')
        .upsert(
          {
            user_id: user.id,
            student_id: studentId,
            badge_data: JSON.parse(JSON.stringify(badgeData)),
          },
          {
            onConflict: 'user_id,student_id',
            ignoreDuplicates: false,
          },
        );

      if (error) {
        console.error('Error saving badges to database:', error);
      }

      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem(storageKey, JSON.stringify(badgeData));
    } catch (error) {
      console.error('Failed to save badges:', error);
      await AsyncStorage.setItem(storageKey, JSON.stringify(badgeData));
    }
  }, [user, studentId]);

  const dismissNotification = useCallback((badgeId: string) => {
    setNewBadges(prev => prev.filter(b => b.id !== badgeId));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setNewBadges([]);
  }, []);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return {
    badges,
    newBadges,
    unlockedCount,
    totalCount,
    completionPercentage,
    dismissNotification,
    dismissAllNotifications,
    loaded,
  };
}
