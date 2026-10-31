import type { Difficulty } from '../games/core/types';

const BASE_XP: Record<Difficulty, number> = {
  EASY: 50,
  MEDIUM: 75,
  HARD: 100,
  EXPERT: 150,
};

const COMPLETION_BONUS: Record<Difficulty, number> = {
  EASY: 100,
  MEDIUM: 150,
  HARD: 250,
  EXPERT: 400,
};

export const calculateXp = (
  difficulty: Difficulty,
  correctAnswers: number,
  isCompleted: boolean
): number => {
  const pointsFromCorrect = BASE_XP[difficulty] * correctAnswers;
  const completionBonus = isCompleted ? COMPLETION_BONUS[difficulty] : 0;
  return pointsFromCorrect + completionBonus;
};

// Level breakpoints up to 5
const BASE_LEVEL_THRESHOLDS = [0, 500, 1200, 2000, 3000];

export const getLevelFromXp = (xp: number): number => {
  // Check predefined levels
  for (let i = BASE_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= BASE_LEVEL_THRESHOLDS[i]) {
      // If we are past level 5, calculate scalable
      if (i === BASE_LEVEL_THRESHOLDS.length - 1) {
        let currentLevel = 5;
        let currentThreshold = 3000;
        let gap = 1200; // Next gap: 4200 (Level 6), gap=1400 (Level 7)
        
        while (xp >= currentThreshold + gap) {
          currentThreshold += gap;
          gap += 200; // Increment gap linearly
          currentLevel++;
        }
        return currentLevel;
      }
      return i + 1; // Levels are 1-indexed
    }
  }
  return 1;
};

export const getXpForNextLevel = (level: number): number => {
  if (level < 5) {
    return BASE_LEVEL_THRESHOLDS[level];
  }
  
  let currentLevel = 5;
  let currentThreshold = 3000;
  let gap = 1200;
  
  while (currentLevel < level) {
    currentThreshold += gap;
    gap += 200;
    currentLevel++;
  }
  
  return currentThreshold + gap;
};

export const getXpForCurrentLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level <= 5) return BASE_LEVEL_THRESHOLDS[level - 1];
  
  let currentLevel = 5;
  let currentThreshold = 3000;
  let gap = 1200;
  
  while (currentLevel < level - 1) {
    currentThreshold += gap;
    gap += 200;
    currentLevel++;
  }
  
  return currentThreshold;
};

export const getLevelProgress = (xp: number): number => {
  const currentLevel = getLevelFromXp(xp);
  const xpFloor = getXpForCurrentLevel(currentLevel);
  const xpCeil = getXpForNextLevel(currentLevel);
  
  const xpIntoLevel = xp - xpFloor;
  const requiredForNext = xpCeil - xpFloor;
  
  return Math.min(100, Math.max(0, (xpIntoLevel / requiredForNext) * 100));
};
