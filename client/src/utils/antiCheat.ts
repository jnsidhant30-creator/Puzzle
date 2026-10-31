import type { GameState } from '../games/core/types';

/**
 * Validates a game state before submission to prevent basic cheating.
 * 
 * IMPORTANT:
 * This client-side validation is a baseline defense. 
 * For production, authoritative score, XP, and constraint validation
 * must be performed in Firebase Cloud Functions.
 */
export const validateGameResult = (gameState: GameState): { valid: boolean; reason?: string } => {
  // Validate primitives
  if (gameState.score < 0) return { valid: false, reason: 'Negative score' };
  if (gameState.hintsUsed < 0) return { valid: false, reason: 'Negative hints' };
  if (gameState.moves !== undefined && gameState.moves < 0) return { valid: false, reason: 'Negative moves' };
  if (gameState.correctAnswers < 0 || gameState.incorrectAnswers < 0) return { valid: false, reason: 'Negative answers' };
  
  // Validate total questions matches correctly
  if (gameState.correctAnswers + gameState.incorrectAnswers > gameState.totalQuestions) {
    return { valid: false, reason: 'Answers exceed total questions' };
  }

  // Validate time
  if (gameState.timeRemaining < 0) return { valid: false, reason: 'Negative time remaining' };
  if (gameState.timeRemaining > gameState.initialTimeLimit) {
    return { valid: false, reason: 'Time remaining exceeds limit' };
  }

  // Validate puzzle types
  const validTypes = ['NUMBER', 'WORD', 'MEMORY', 'SLIDING', 'LOGIC', 'PATTERN'];
  if (!validTypes.includes(gameState.puzzleType)) {
    return { valid: false, reason: 'Invalid puzzle type' };
  }

  // Validate difficulty
  const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
  if (!validDifficulties.includes(gameState.difficulty)) {
    return { valid: false, reason: 'Invalid difficulty' };
  }

  // Validate status
  const validStatuses = ['READY', 'PLAYING', 'PAUSED', 'COMPLETED', 'FAILED', 'TIMEOUT'];
  if (!validStatuses.includes(gameState.status)) {
    return { valid: false, reason: 'Invalid status' };
  }

  // Math sanity bounds (Assuming max realistic score isn't over 10M for a single game)
  if (gameState.score > 10000000) {
    return { valid: false, reason: 'Score exceeds mathematically possible limits' };
  }

  return { valid: true };
};
