export type PuzzleType = 'NUMBER' | 'WORD' | 'MEMORY' | 'SLIDING' | 'LOGIC' | 'PATTERN';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type GameStatus = 'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface GameResultPayload {
  sessionId: string;
  puzzleId: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  status: GameStatus;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  hintsUsed: number;
  timeRemaining: number;
  initialTimeLimit: number;
  moves?: number;
  isDailyPuzzle?: boolean;
  dailyPuzzleDate?: string | null;
  isWeeklyChallenge?: boolean;
  weeklyChallengeId?: string | null;
}

export type BattleStatus = 'waiting' | 'matched' | 'countdown' | 'active' | 'completed' | 'cancelled' | 'expired';

export interface BattlePlayer {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  ready: boolean;
  score: number;
  progress: number;
  timeTaken?: number;
  completedAt?: any;
  result?: 'VICTORY' | 'DEFEAT' | 'DRAW';
  correctAnswers?: number;
}

export interface BattleData {
  id?: string;
  status: BattleStatus;
  gameType: PuzzleType;
  difficulty: Difficulty;
  puzzleSeed?: number;
  isFriendBattle: boolean;
  tournamentId?: string; // Phase 56
  tournamentMatchId?: string; // Phase 56
  playerA: BattlePlayer;
  playerB: BattlePlayer | null;
  createdAt: any;
  matchedAt?: any;
  startedAt?: any;
  expiresAt?: any;
  version: number;
}

// ------------------------------------------------------------------
// TOURNAMENTS
// ------------------------------------------------------------------
export type TournamentStatus = 'draft' | 'registration' | 'full' | 'locked' | 'active' | 'completed' | 'cancelled';

export interface TournamentParticipant {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  registeredAt: any;
  eliminated: boolean;
  finalPlacement?: number;
}

export interface TournamentMatchData {
  id: string; // The match ID (e.g., 'round-1-match-1')
  round: number; // e.g. 1 (Round of 16), 2 (Quarterfinals), 3 (Semifinals), 4 (Finals)
  playerA: TournamentParticipant | null;
  playerB: TournamentParticipant | null;
  battleId?: string; // Links to Phase 55 Battle
  status: 'pending' | 'ready' | 'active' | 'completed';
  winnerUid?: string;
  nextMatchId?: string; // The match the winner advances to
}

export interface TournamentData {
  id?: string;
  name: string;
  description: string;
  gameType: PuzzleType;
  difficulty: Difficulty;
  capacity: number; // e.g. 8, 16, 32
  participantsCount: number;
  status: TournamentStatus;
  registrationDeadline: any;
  startTime: any;
  rewards: {
    winnerXp: number;
    runnerUpXp: number;
    participationXp: number;
  };
  createdAt: any;
  createdBy: string; // Admin uid
}

// ------------------------------------------------------------------
// COMMUNITY PUZZLES
// ------------------------------------------------------------------
export type CommunityPuzzleStatus = 'draft' | 'published' | 'unpublished' | 'underReview' | 'removed';

export interface CommunityPuzzleConfig {
  puzzleSeed: number;
  // Specific parameters could go here. For now, seed + difficulty drives everything safely.
}

export interface CommunityPuzzleData {
  id?: string;
  creatorId: string; // UID of creator
  creatorName: string;
  title: string;
  description: string;
  instructions: string;
  gameType: PuzzleType;
  difficulty: Difficulty;
  config: CommunityPuzzleConfig;
  status: CommunityPuzzleStatus;
  playCount: number;
  averageRating?: number;
  ratingCount?: number;
  reviewCount?: number;
  createdAt: any;
  updatedAt: any;
  publishedAt?: any;
  metadataVersion: number;
}

export interface CommunityReviewData {
  id?: string;
  puzzleId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  reviewText: string;
  helpfulCount: number;
  createdAt: any;
  updatedAt: any;
}

// ------------------------------------------------------------------
// PHASE 60: TITLES & BADGES
// ------------------------------------------------------------------
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface PlayerTitle {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: Rarity;
}

export interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: Rarity;
  icon: string;
}

// ------------------------------------------------------------------
// PHASE 61: SEASONS
// ------------------------------------------------------------------
export type SeasonStatus = 'upcoming' | 'active' | 'completed';

export interface Season {
  id?: string;
  name: string;
  description: string;
  theme?: string;
  startAt: any;
  endAt: any;
  status: SeasonStatus;
  rewards: {
    badgeId?: string;
    titleId?: string;
  };
  createdAt: any;
  updatedAt: any;
}

export interface SeasonProgress {
  userId: string;
  seasonId: string;
  score: number;
  displayName: string;
  avatarUrl: string | null;
  activeTitleId?: string;
  updatedAt: any;
}

// ------------------------------------------------------------------
// PHASE 62: MISSIONS
// ------------------------------------------------------------------
export type MissionFrequency = 'daily' | 'weekly';
export type MissionType = 
  | 'COMPLETE_N_PUZZLES' 
  | 'PLAY_N_DIFFERENT_GAMES' 
  | 'USE_HINTS' 
  | 'EARN_XP'
  | 'COMPLETE_DAILY_CHALLENGE';

export interface MissionDefinition {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  category: string;
  frequency: MissionFrequency;
  target: number;
  rewardXp: number;
}

export interface PlayerMissionProgress {
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  period: string; // e.g. "2023-10-27" for daily, "2023-W43" for weekly
  updatedAt: any;
}

export interface MissionEvaluationResult {
  missionId: string;
  progress: number;
  completed: boolean;
  xpEarned: number;
}

