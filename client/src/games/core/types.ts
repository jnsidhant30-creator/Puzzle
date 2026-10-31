export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type PuzzleType = 'NUMBER' | 'WORD' | 'MEMORY' | 'SLIDING' | 'LOGIC' | 'PATTERN' | 'PIPE' | 'COLOR_PATH' | 'MAZE_ESCAPE' | 'LASER_MIRROR' | 'ARROW_PATH' | 'BLOCK_ESCAPE' | 'NUMBER_PATH' | 'ROTATING_TILES' | 'WORD_GRID' | 'CHALLENGE';
export type GameStatus = 'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface GameState {
  puzzleId: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  status: GameStatus;
  
  startTime: number | null;
  timeRemaining: number;
  initialTimeLimit: number;
  questionStartTime: number;
  
  score: number;
  
  hintsUsed: number;
  maxHints: number;
  
  attempts: number; // Current question attempts
  
  currentQuestionIndex: number;
  totalQuestions: number;
  
  correctAnswers: number;
  incorrectAnswers: number;
  
  moves?: number;
  pairsMatched?: number;
  totalPairs?: number;
  
  isDailyPuzzle?: boolean;
  dailyPuzzleDate?: string;
  
  isWeeklyChallenge?: boolean;
  weeklyChallengeId?: string;

  isFriendChallenge?: boolean;
  friendChallengeId?: string;
  puzzleSeed?: number | number[];

  isBattle?: boolean;
  battleId?: string;
  isCommunityPuzzle?: boolean;
  communityPuzzleId?: string;
}

export interface StartGameOptions {
  isDailyPuzzle?: boolean;
  dailyPuzzleDate?: string;
  isFriendChallenge?: boolean;
  friendChallengeId?: string;
  isWeeklyChallenge?: boolean;
  weeklyChallengeId?: string;
  puzzleSeed?: number | number[];
  isBattle?: boolean;
  battleId?: string;
  isCommunityPuzzle?: boolean;
  communityPuzzleId?: string;
}
