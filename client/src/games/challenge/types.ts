import type { PuzzleType, Difficulty } from '../core/types';

export interface ChallengeConfig {
  mode: 'QUICK' | 'RUN';
  index: number;
  total: number;
  onComplete: (score: number, xp: number, time: number, accuracy: number, passed: boolean) => void;
  onAbort: () => void;
}

export type ChallengeResult = {
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  score: number;
  xp: number;
  time: number;
  accuracy: number;
  passed: boolean;
};
