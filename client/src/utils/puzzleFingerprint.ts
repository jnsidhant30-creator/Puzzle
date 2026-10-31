const HISTORY_KEY_PREFIX = 'puzzleverse_history_';
const MAX_HISTORY_PER_GAME = 50;
const MAX_ATTEMPTS = 30;

function getHistory(gameId: string): string[] {
  try {
    const data = localStorage.getItem(`${HISTORY_KEY_PREFIX}${gameId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToHistory(gameId: string, fingerprint: string) {
  try {
    const history = getHistory(gameId);
    history.push(fingerprint);
    if (history.length > MAX_HISTORY_PER_GAME) {
      history.shift();
    }
    localStorage.setItem(`${HISTORY_KEY_PREFIX}${gameId}`, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to save puzzle history', err);
  }
}

export function generateUniquePuzzle<T>(
  gameId: string,
  isDaily: boolean,
  dailySeed: number | undefined,
  generatorFn: (seed: number) => T,
  fingerprintFn: (puzzle: T) => string = (p) => JSON.stringify(p),
  onSeedGenerated?: (seed: number) => void
): T {
  if (isDaily && dailySeed !== undefined) {
    if (onSeedGenerated) onSeedGenerated(dailySeed);
    return generatorFn(dailySeed);
  }

  const history = getHistory(gameId);
  let bestPuzzle: T | null = null;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Generate a fresh random seed for this attempt
    const attemptSeed = Math.floor(Math.random() * 1000000000);
    const puzzle = generatorFn(attemptSeed);
    
    // We assume the first generated puzzle is "best" as a fallback
    if (attempt === 0) bestPuzzle = puzzle;

    const fingerprint = fingerprintFn(puzzle);
    
    if (!history.includes(fingerprint)) {
      saveToHistory(gameId, fingerprint);
      if (onSeedGenerated) onSeedGenerated(attemptSeed);
      return puzzle;
    }
  }

  // If all attempts failed to find a unique puzzle, return the fallback
  console.warn(`[${gameId}] Failed to find unique puzzle after ${MAX_ATTEMPTS} attempts.`);
  return bestPuzzle!;
}

import type { GameState } from '../games/core/types';

export function getDeterministicSeed(state: GameState): number | undefined {
  if (state.isDailyPuzzle && state.dailyPuzzleDate) {
    // Add currentQuestionIndex so daily multi-question games generate unique questions
    return parseInt(state.dailyPuzzleDate.replace(/-/g, ''), 10) + (state.currentQuestionIndex || 0);
  }
  if (state.isFriendChallenge && state.puzzleSeed !== undefined) {
    return Array.isArray(state.puzzleSeed) 
      ? state.puzzleSeed[state.currentQuestionIndex || 0] 
      : state.puzzleSeed;
  }
  return undefined;
}
