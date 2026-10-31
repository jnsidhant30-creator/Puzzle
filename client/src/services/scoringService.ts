import type { Difficulty } from '../games/core/types';

export const BASE_SCORES: Record<Difficulty, number> = {
  EASY: 100,
  MEDIUM: 150,
  HARD: 200,
  EXPERT: 300,
};

export const calculateQuestionScore = (
  difficulty: Difficulty,
  isCorrect: boolean,
  timeTakenMs: number,
  initialTimeMs: number,
  hintsUsedForQuestion: number
): number => {
  if (!isCorrect) return 0;

  const baseScore = BASE_SCORES[difficulty];
  
  // Time Bonus: max 20% of base score if answered instantly.
  // Scales down linearly. No bonus if taking more than 50% of allotted time (or 30s, whichever is smaller).
  const expectedMaxTimeMs = Math.min(initialTimeMs / 2, 30000); 
  let timeBonus = 0;
  
  if (timeTakenMs < expectedMaxTimeMs) {
    const speedRatio = 1 - (timeTakenMs / expectedMaxTimeMs);
    timeBonus = Math.floor((baseScore * 0.2) * Math.max(0, speedRatio));
  }

  // Hint Penalty: -10% of base score per hint used
  const hintPenalty = Math.floor(baseScore * 0.1) * hintsUsedForQuestion;

  const finalScore = Math.max(0, baseScore + timeBonus - hintPenalty);
  return finalScore;
};

export const calculateAccuracy = (correctAnswers: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};
