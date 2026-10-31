import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface WeeklyChallengeConfig {
  id: string; // The YYYY-WXX period key
  puzzleType: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  title: string;
  description: string;
  baseReward: number;
  bonusReward: number;
}

const PUZZLE_TYPES = [
  'NUMBER', 'WORD', 'MEMORY', 'SLIDING', 'LOGIC', 'PATTERN',
  'ARROW', 'MAZE', 'NUMBER-PATH', 'COLOR', 'ROTATE', 'PIPE',
  'LASER', 'WORD-GRID', 'BLOCK'
];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

/**
 * Returns the deterministic period key 'YYYY-WXX' for a given date.
 */
export const getWeeklyChallengeId = (date: Date = new Date()): string => {
  const year = date.getUTCFullYear();
  const d = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

export const getPreviousWeeklyChallengeId = (date: Date = new Date()): string => {
  const prevDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 7));
  return getWeeklyChallengeId(prevDate);
};

export const getNextWeeklyResetTime = (): Date => {
  const d = new Date();
  const dayNum = d.getUTCDay() || 7; // 1 = Monday, 7 = Sunday
  const daysToNextMonday = 8 - dayNum;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToNextMonday));
};

/**
 * Deterministically generates a Weekly Challenge configuration based on a period key string.
 */
export const getWeeklyChallengeById = (periodKey: string): WeeklyChallengeConfig => {
  // Simple hash of the period string
  let hash = 0;
  for (let i = 0; i < periodKey.length; i++) {
    hash = Math.imul(31, hash) + periodKey.charCodeAt(i) | 0;
  }
  hash = Math.abs(hash);

  const typeIndex = hash % PUZZLE_TYPES.length;
  const puzzleType = PUZZLE_TYPES[typeIndex];
  
  // Distribute difficulty: Medium (30%), Hard (40%), Expert (30%)
  const diffHash = (hash >> 4) % 100;
  let diffIndex = 1; // Medium
  let bonusReward = 150;
  if (diffHash >= 30 && diffHash < 70) { diffIndex = 2; bonusReward = 300; }
  else if (diffHash >= 70) { diffIndex = 3; bonusReward = 500; }

  const difficulty = DIFFICULTIES[diffIndex];

  return {
    id: periodKey,
    puzzleType,
    difficulty,
    title: `${puzzleType.charAt(0) + puzzleType.slice(1).toLowerCase()} Weekly Challenge`,
    description: `Compete in this week's ${difficulty.toLowerCase()} ${puzzleType.toLowerCase()} challenge. Complete it to secure your rank on the Weekly Leaderboard!`,
    baseReward: 300, 
    bonusReward
  };
};

export const getCurrentWeeklyChallenge = (): WeeklyChallengeConfig => {
  return getWeeklyChallengeById(getWeeklyChallengeId());
};

export interface WeeklyCompletion {
  sessionId: string;
  weeklyChallengeId: string;
  score: number;
  xpEarned: number;
  timeTaken: number;
  accuracy: number;
}

/**
 * Checks if the user has completed a Weekly Challenge for a given period key.
 */
export const getWeeklyCompletion = async (userId: string, periodKey: string): Promise<WeeklyCompletion | null> => {
  try {
    const q = query(
      collection(db, 'gameSessions'),
      where('userId', '==', userId),
      where('isWeeklyChallenge', '==', true),
      where('weeklyChallengeId', '==', periodKey),
      where('status', '==', 'COMPLETED'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        sessionId: snapshot.docs[0].id,
        weeklyChallengeId: data.weeklyChallengeId,
        score: data.score,
        xpEarned: data.xpEarned,
        timeTaken: data.timeTaken || data.duration, // Check both just in case
        accuracy: data.accuracy
      };
    }
  } catch (err) {
    console.warn("Failed to check weekly completion", err);
  }
  return null;
};

export const hasCompletedCurrentWeek = async (userId: string): Promise<boolean> => {
  const completion = await getWeeklyCompletion(userId, getWeeklyChallengeId());
  return completion !== null;
};
