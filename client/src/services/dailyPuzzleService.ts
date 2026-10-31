import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface DailyPuzzleConfig {
  id: string; // The YYYY-MM-DD date
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
 * Deterministically generates a Daily Puzzle configuration based on a date string.
 * This ensures all clients see the identical puzzle for a given day without needing a backend sync.
 */
export const getDailyPuzzleByDate = (dateStr: string): DailyPuzzleConfig => {
  // Simple hash of the date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = Math.imul(31, hash) + dateStr.charCodeAt(i) | 0;
  }
  hash = Math.abs(hash);

  const typeIndex = hash % PUZZLE_TYPES.length;
  const puzzleType = PUZZLE_TYPES[typeIndex];
  
  // Distribute difficulty: Easy (30%), Medium (40%), Hard (20%), Expert (10%)
  const diffHash = (hash >> 4) % 100;
  let diffIndex = 0; // Easy
  let bonusReward = 50;
  if (diffHash >= 30 && diffHash < 70) { diffIndex = 1; bonusReward = 75; }
  else if (diffHash >= 70 && diffHash < 90) { diffIndex = 2; bonusReward = 100; }
  else if (diffHash >= 90) { diffIndex = 3; bonusReward = 150; }

  const difficulty = DIFFICULTIES[diffIndex];

  return {
    id: dateStr,
    puzzleType,
    difficulty,
    title: `${puzzleType.charAt(0) + puzzleType.slice(1).toLowerCase()} Master`,
    description: `Complete today's curated ${puzzleType.toLowerCase()} puzzle to earn bonus XP and climb the Daily Leaderboard!`,
    baseReward: 100, // standard completion
    bonusReward
  };
};

export const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

export const getTodayDailyPuzzle = (): DailyPuzzleConfig => {
  return getDailyPuzzleByDate(getTodayDateString());
};

export const getNextDailyPuzzleTime = (): Date => {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next;
};

export interface DailyCompletion {
  sessionId: string;
  date: string;
  score: number;
  xpEarned: number;
  timeTaken: number;
  accuracy: number;
}

/**
 * Checks if the user has completed a Daily Puzzle for a given date.
 */
export const getDailyCompletion = async (userId: string, dateStr: string): Promise<DailyCompletion | null> => {
  try {
    const q = query(
      collection(db, 'gameSessions'),
      where('userId', '==', userId),
      where('isDailyPuzzle', '==', true),
      where('dailyPuzzleDate', '==', dateStr),
      where('status', '==', 'COMPLETED'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        sessionId: snapshot.docs[0].id,
        date: data.dailyPuzzleDate,
        score: data.score,
        xpEarned: data.xpEarned,
        timeTaken: data.duration, // Note: gameSessions stores it as 'duration'
        accuracy: data.accuracy
      };
    }
  } catch (err) {
    console.warn("Failed to check daily completion", err);
  }
  return null;
};

export const hasCompletedToday = async (userId: string): Promise<boolean> => {
  const completion = await getDailyCompletion(userId, getTodayDateString());
  return completion !== null;
};
