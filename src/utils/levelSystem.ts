/**
 * Level System for Centsible Scholar
 * Converts XP into meaningful progression levels with titles
 */

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  xpToNextLevel: number;
  isMaxLevel: boolean;
}

export interface LevelThreshold {
  level: number;
  minXP: number;
  title: string;
}

/**
 * Level thresholds - XP required to reach each level
 */
/**
 * Three-pillar level names reflecting the integrated student experience:
 * - Grades/Academic (68% #1 daily stressor)
 * - Mental Health (50-56% #1 obstacle to learning)
 * - Financial Literacy (future-focused)
 *
 * "Scholar" bookends connect to "Centsible Scholar" brand
 */
export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, minXP: 0, title: 'Centsible Starter' },
  { level: 2, minXP: 100, title: 'Habit Builder' },
  { level: 3, minXP: 300, title: 'Progress Tracker' },
  { level: 4, minXP: 600, title: 'Balance Seeker' },
  { level: 5, minXP: 1000, title: 'Growth Champion' },
  { level: 6, minXP: 1500, title: 'Achievement Hunter' },
  { level: 7, minXP: 2500, title: 'Success Strategist' },
  { level: 8, minXP: 4000, title: 'Mastery Builder' },
  { level: 9, minXP: 6000, title: 'Excellence Expert' },
  { level: 10, minXP: 10000, title: 'Centsible Scholar Supreme' },
];

/**
 * Calculate level info from total XP
 */
export function calculateLevelInfo(totalXP: number): LevelInfo {
  const xp = Math.max(0, totalXP || 0);

  // Find current level
  let currentLevel = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.minXP) {
      currentLevel = threshold;
    } else {
      break;
    }
  }

  // Find next level (if exists)
  const currentIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === currentLevel.level);
  const nextLevel = LEVEL_THRESHOLDS[currentIndex + 1];
  const isMaxLevel = !nextLevel;

  // Calculate progress
  const xpForCurrentLevel = currentLevel.minXP;
  const xpForNextLevel = nextLevel?.minXP ?? currentLevel.minXP;
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpRequiredForNextLevel = xpForNextLevel - xpForCurrentLevel;

  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100));

  const xpToNextLevel = isMaxLevel ? 0 : xpForNextLevel - xp;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXP: xp,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPercent,
    xpToNextLevel,
    isMaxLevel,
  };
}

/**
 * Get just the level number from XP (lightweight)
 */
export function getLevel(totalXP: number): number {
  return calculateLevelInfo(totalXP).level;
}

/**
 * Get just the title from XP (lightweight)
 */
export function getLevelTitle(totalXP: number): string {
  return calculateLevelInfo(totalXP).title;
}

/**
 * Check if a level-up occurred between two XP values
 */
export function checkLevelUp(previousXP: number, newXP: number): LevelThreshold | null {
  const previousLevel = getLevel(previousXP);
  const newLevel = getLevel(newXP);

  if (newLevel > previousLevel) {
    return LEVEL_THRESHOLDS.find(t => t.level === newLevel) || null;
  }

  return null;
}

/**
 * Get color scheme for a level (for UI styling)
 */
export function getLevelColors(level: number): { gradient: string; badge: string } {
  if (level >= 10) {
    return { gradient: 'from-yellow-400 via-amber-500 to-orange-500', badge: 'bg-gradient-to-r from-yellow-400 to-orange-500' };
  }
  if (level >= 8) {
    return { gradient: 'from-purple-500 via-violet-500 to-indigo-500', badge: 'bg-gradient-to-r from-purple-500 to-indigo-500' };
  }
  if (level >= 6) {
    return { gradient: 'from-blue-500 via-cyan-500 to-teal-500', badge: 'bg-gradient-to-r from-blue-500 to-teal-500' };
  }
  if (level >= 4) {
    return { gradient: 'from-green-500 via-emerald-500 to-teal-500', badge: 'bg-gradient-to-r from-green-500 to-emerald-500' };
  }
  if (level >= 2) {
    return { gradient: 'from-blue-400 via-blue-500 to-blue-600', badge: 'bg-gradient-to-r from-blue-400 to-blue-600' };
  }
  return { gradient: 'from-lime-400 via-green-400 to-emerald-400', badge: 'bg-gradient-to-r from-lime-400 to-emerald-400' };
}
