import { Difficulty } from './types';

export const BASE_SCORES: Record<Difficulty, number> = {
  EASY: 100,
  MEDIUM: 150,
  HARD: 200,
  EXPERT: 300,
};

export const calculateFinalScore = (
  difficulty: Difficulty,
  isCorrect: boolean,
  timeTakenMs: number,
  initialTimeMs: number,
  hintsUsedForQuestion: number
): number => {
  if (!isCorrect) return 0;

  const baseScore = BASE_SCORES[difficulty];
  
  const expectedMaxTimeMs = Math.min(initialTimeMs / 2, 30000); 
  let timeBonus = 0;
  
  if (timeTakenMs < expectedMaxTimeMs) {
    const speedRatio = 1 - (timeTakenMs / expectedMaxTimeMs);
    timeBonus = Math.floor((baseScore * 0.2) * Math.max(0, speedRatio));
  }

  const hintPenalty = Math.floor(baseScore * 0.1) * hintsUsedForQuestion;

  const finalScore = Math.max(0, baseScore + timeBonus - hintPenalty);
  return finalScore;
};

// PuzzleVerse currently seems to calculate an aggregate score in the client and pass it as gameState.score.
// The requirements say: "Do NOT trust client-provided final score. Server calculates: finalScore from validated gameplay data."
// Wait, the client calculates the score per question using `calculateQuestionScore` and sums it up.
// If the server only gets `duration` and `correctAnswers`, it can only approximate the total score based on averages,
// or we assume it's one big question. Let's calculate an aggregate score based on the total time taken and correct answers.

export const calculateAggregateScore = (
  difficulty: Difficulty,
  correctAnswers: number,
  timeTakenMs: number,
  initialTimeMs: number,
  hintsUsed: number
): number => {
  if (correctAnswers === 0) return 0;

  const baseScore = BASE_SCORES[difficulty] * correctAnswers;
  
  const expectedMaxTimeMs = Math.min(initialTimeMs / 2, 30000 * correctAnswers);
  let timeBonus = 0;
  
  if (timeTakenMs < expectedMaxTimeMs) {
    const speedRatio = 1 - (timeTakenMs / expectedMaxTimeMs);
    timeBonus = Math.floor((baseScore * 0.2) * Math.max(0, speedRatio));
  }

  const hintPenalty = Math.floor(BASE_SCORES[difficulty] * 0.1) * hintsUsed;

  const finalScore = Math.max(0, baseScore + timeBonus - hintPenalty);
  return finalScore;
};

export const calculateAccuracy = (correctAnswers: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};
