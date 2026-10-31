import { collection, query, where, getCountFromServer, getAggregateFromServer, sum, average, count, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export type TimeRange = 'today' | '7days' | '30days' | 'all';

export interface AnalyticsOverview {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  returningUsers: number;
  totalAttempts: number;
  completedAttempts: number;
  winRate: number;
  averageTime: number; // in seconds
  totalXp: number;
  avgXpPerUser: number;
  dailyChallengePart: number;
  weeklyChallengePart: number;
  achievementsUnlocked: number;
}

export interface GamePopularity {
  puzzleType: string;
  attempts: number;
  completions: number;
}

export interface DifficultyDist {
  difficulty: string;
  attempts: number;
}

const getStartDate = (range: TimeRange): Date | null => {
  const now = new Date();
  if (range === 'today') {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (range === '7days') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  if (range === '30days') {
    now.setDate(now.getDate() - 30);
    return now;
  }
  return null;
};

// ==========================================
// OVERVIEW
// ==========================================
export const getAnalyticsOverview = async (range: TimeRange): Promise<AnalyticsOverview> => {
  const startDate = getStartDate(range);
  const sessionsRef = collection(db, 'gameSessions');
  const usersRef = collection(db, 'users');

  let baseSessionQ = query(sessionsRef);
  let baseUsersQ = query(usersRef);
  let activeUsersQ = query(usersRef);
  let returningUsersQ = query(usersRef);

  if (startDate) {
    baseSessionQ = query(sessionsRef, where('createdAt', '>=', startDate));
    baseUsersQ = query(usersRef, where('createdAt', '>=', startDate));
    activeUsersQ = query(usersRef, where('updatedAt', '>=', startDate));
    returningUsersQ = query(usersRef, where('updatedAt', '>=', startDate), where('createdAt', '<', startDate));
  }

  // User stats
  const totalUsersCount = (await getCountFromServer(query(usersRef))).data().count;
  const newUsersCount = (await getCountFromServer(baseUsersQ)).data().count;
  const activeUsersCount = (await getCountFromServer(activeUsersQ)).data().count;
  const returningUsersCount = startDate ? (await getCountFromServer(returningUsersQ)).data().count : totalUsersCount; // all active are returning if all-time

  // Session Aggregates
  const sessionAgg = await getAggregateFromServer(baseSessionQ, {
    count: count(),
    totalXp: sum('xpEarned')
  });

  const totalAttempts = sessionAgg.data().count;
  const totalXp = sessionAgg.data().totalXp;
  const avgXpPerUser = activeUsersCount > 0 ? (totalXp / activeUsersCount) : 0;

  // Completed sessions
  const completedQ = startDate 
    ? query(sessionsRef, where('createdAt', '>=', startDate), where('status', '==', 'COMPLETED'))
    : query(sessionsRef, where('status', '==', 'COMPLETED'));
  
  const completedAgg = await getAggregateFromServer(completedQ, {
    count: count(),
    avgTime: average('timeTaken')
  });

  const completedAttempts = completedAgg.data().count;
  const averageTime = completedAgg.data().avgTime || 0;
  const winRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;

  // Daily Challenge Participation
  const dailyQ = startDate
    ? query(sessionsRef, where('createdAt', '>=', startDate), where('isDailyPuzzle', '==', true))
    : query(sessionsRef, where('isDailyPuzzle', '==', true));
  const dailyChallengePart = (await getCountFromServer(dailyQ)).data().count;

  // Weekly Challenge Participation
  const weeklyQ = startDate
    ? query(sessionsRef, where('createdAt', '>=', startDate), where('isWeeklyChallenge', '==', true))
    : query(sessionsRef, where('isWeeklyChallenge', '==', true));
  const weeklyChallengePart = (await getCountFromServer(weeklyQ)).data().count;

  // Dummy achievement unlocks metric (requires user achievements subcollection, which we don't have aggregated easily)
  // Let's assume we don't have a global achievements feed. We'll set to 0 for now.
  const achievementsUnlocked = 0;

  return {
    totalUsers: totalUsersCount,
    newUsers: newUsersCount,
    activeUsers: activeUsersCount,
    returningUsers: returningUsersCount,
    totalAttempts,
    completedAttempts,
    winRate,
    averageTime,
    totalXp,
    avgXpPerUser,
    dailyChallengePart,
    weeklyChallengePart,
    achievementsUnlocked
  };
};

// ==========================================
// GAME POPULARITY
// ==========================================
export const getGamePopularity = async (range: TimeRange, activePuzzleTypes: string[]): Promise<GamePopularity[]> => {
  const startDate = getStartDate(range);
  const sessionsRef = collection(db, 'gameSessions');
  
  const results: GamePopularity[] = [];
  
  const promises = activePuzzleTypes.map(async (type) => {
    let typeQ = query(sessionsRef, where('puzzleType', '==', type));
    let typeCompletedQ = query(sessionsRef, where('puzzleType', '==', type), where('status', '==', 'COMPLETED'));
    
    if (startDate) {
      typeQ = query(sessionsRef, where('puzzleType', '==', type), where('createdAt', '>=', startDate));
      typeCompletedQ = query(sessionsRef, where('puzzleType', '==', type), where('status', '==', 'COMPLETED'), where('createdAt', '>=', startDate));
    }
    
    const [attSnap, compSnap] = await Promise.all([
      getCountFromServer(typeQ),
      getCountFromServer(typeCompletedQ)
    ]);
    
    results.push({
      puzzleType: type,
      attempts: attSnap.data().count,
      completions: compSnap.data().count
    });
  });

  await Promise.all(promises);
  return results.sort((a, b) => b.attempts - a.attempts);
};

// ==========================================
// DIFFICULTY DISTRIBUTION
// ==========================================
export const getDifficultyDistribution = async (range: TimeRange): Promise<DifficultyDist[]> => {
  const startDate = getStartDate(range);
  const sessionsRef = collection(db, 'gameSessions');
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
  const results: DifficultyDist[] = [];
  
  const promises = difficulties.map(async (diff) => {
    let diffQ = query(sessionsRef, where('difficulty', '==', diff));
    if (startDate) {
      diffQ = query(sessionsRef, where('difficulty', '==', diff), where('createdAt', '>=', startDate));
    }
    const countSnap = await getCountFromServer(diffQ);
    results.push({
      difficulty: diff,
      attempts: countSnap.data().count
    });
  });

  await Promise.all(promises);
  
  const orderedResults = difficulties.map(d => results.find(r => r.difficulty === d) || { difficulty: d, attempts: 0 });
  return orderedResults;
};

// ==========================================
// REPORT GENERATION UTILS
// ==========================================
export const getPlayerActivityReportCSV = async (range: TimeRange): Promise<string> => {
  const startDate = getStartDate(range);
  const usersRef = collection(db, 'users');
  let q = query(usersRef, limit(500)); // limit for safety in browser
  if (startDate) {
    q = query(usersRef, where('updatedAt', '>=', startDate), limit(500));
  }
  const snap = await getDocs(q);
  
  let csv = 'UID,Username,Role,Level,TotalXP,TotalGames,BestScore,CurrentStreak,LongestStreak,JoinedAt,LastActive\n';
  snap.docs.forEach(doc => {
    const data = doc.data();
    const joined = data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : '';
    const active = data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toISOString() : '';
    csv += `${doc.id},${data.username},${data.role || 'PLAYER'},${data.level || 1},${data.xp || 0},${data.totalGames || 0},${data.bestScore || 0},${data.currentStreak || 0},${data.longestStreak || 0},${joined},${active}\n`;
  });
  return csv;
};

export const getGamePerformanceReportCSV = async (range: TimeRange, activePuzzleTypes: string[]): Promise<string> => {
  const pop = await getGamePopularity(range, activePuzzleTypes);
  let csv = 'PuzzleType,TotalAttempts,TotalCompletions,CompletionRate\n';
  pop.forEach(p => {
    const rate = p.attempts > 0 ? ((p.completions / p.attempts) * 100).toFixed(2) + '%' : '0%';
    csv += `${p.puzzleType},${p.attempts},${p.completions},${rate}\n`;
  });
  return csv;
};
