import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export type LeaderboardPeriod = 'GLOBAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type PuzzleFilter = 'ALL' | 'NUMBER' | 'WORD' | 'MEMORY' | 'SLIDING' | 'LOGIC' | 'PATTERN';
export type DifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  level: number;
  bestTime: number;
  puzzleType: string;
  difficulty: string;
  period: LeaderboardPeriod;
  periodKey: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Returns deterministic period keys based on the input date.
 * GLOBAL: 'GLOBAL'
 * DAILY: 'YYYY-MM-DD'
 * WEEKLY: 'YYYY-WXX' (ISO week)
 * MONTHLY: 'YYYY-MM'
 */
export const getPeriodKey = (period: LeaderboardPeriod, date: Date = new Date()): string => {
  if (period === 'GLOBAL') return 'GLOBAL';

  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');

  if (period === 'DAILY') {
    return `${year}-${month}-${day}`;
  }

  if (period === 'MONTHLY') {
    return `${year}-${month}`;
  }

  if (period === 'WEEKLY') {
    // Calculate ISO week number
    const d = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }

  return 'GLOBAL';
};

/**
 * Queries the leaderboards collection based on filters.
 * Returns up to maxLimit results.
 */
export const getLeaderboard = async (
  period: LeaderboardPeriod,
  puzzleType: PuzzleFilter,
  difficulty: DifficultyFilter,
  maxLimit: number = 100,
  date?: Date
): Promise<LeaderboardEntry[]> => {
  try {
    const periodKey = getPeriodKey(period, date);
    
    // Base query constraints
    const constraints: any[] = [
      where('period', '==', period),
      where('periodKey', '==', periodKey),
    ];

    if (puzzleType !== 'ALL') {
      constraints.push(where('puzzleType', '==', puzzleType));
    }
    
    if (difficulty !== 'ALL') {
      constraints.push(where('difficulty', '==', difficulty));
    }

    // Sort by score descending, then bestTime ascending
    constraints.push(orderBy('score', 'desc'));
    constraints.push(orderBy('bestTime', 'asc'));
    constraints.push(limit(maxLimit));

    const q = query(collection(db, 'leaderboards'), ...constraints);
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaderboardEntry[];
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    throw err;
  }
};

/**
 * Gets a specific player's rank within the current filtered context.
 * In a scalable system, this might use Cloud Functions to avoid downloading the whole list.
 * For now, we query up to a reasonable limit and find the user.
 */
export const getPlayerRank = async (
  userId: string,
  period: LeaderboardPeriod,
  puzzleType: PuzzleFilter,
  difficulty: DifficultyFilter,
  date?: Date
): Promise<{ rank: number; entry: LeaderboardEntry | null; total: number }> => {
  try {
    // In reality, to accurately find rank without downloading everyone, 
    // we'd need a backend aggregation or an exact position tracking strategy.
    // Here we'll fetch the top 1000 and find the user locally as a fallback.
    const entries = await getLeaderboard(period, puzzleType, difficulty, 1000, date);
    const index = entries.findIndex(e => e.userId === userId);
    
    if (index !== -1) {
      return { rank: index + 1, entry: entries[index], total: entries.length };
    }

    return { rank: 0, entry: null, total: entries.length };
  } catch (err) {
    console.error('Error fetching player rank:', err);
    throw err;
  }
};
