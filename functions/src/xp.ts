import { Difficulty } from './types';

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
  isCompleted: boolean,
  isDailyPuzzle: boolean
): number => {
  const pointsFromCorrect = BASE_XP[difficulty] * correctAnswers;
  const completionBonus = isCompleted ? COMPLETION_BONUS[difficulty] : 0;
  let xp = pointsFromCorrect + completionBonus;
  
  if (isDailyPuzzle && isCompleted) {
    let bonus = 100;
    if (difficulty === 'MEDIUM') bonus += 75;
    else if (difficulty === 'HARD') bonus += 100;
    else if (difficulty === 'EXPERT') bonus += 150;
    else bonus += 50; // EASY
    xp += bonus;
  }
  
  return xp;
};

const BASE_LEVEL_THRESHOLDS = [0, 500, 1200, 2000, 3000];

export const getLevelFromXp = (xp: number): number => {
  for (let i = BASE_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= BASE_LEVEL_THRESHOLDS[i]) {
      if (i === BASE_LEVEL_THRESHOLDS.length - 1) {
        let currentLevel = 5;
        let currentThreshold = 3000;
        let gap = 1200;
        
        while (xp >= currentThreshold + gap) {
          currentThreshold += gap;
          gap += 200;
          currentLevel++;
        }
        return currentLevel;
      }
      return i + 1;
    }
  }
  return 1;
};
