import { collection, query, where, getDocs, orderBy, limit, doc, writeBatch, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import type { UserProfile } from './authService';
import type { GameState } from '../games/core/types';
import { validateGameResult } from '../utils/antiCheat';
import { calculateXp } from './xpService';
import { grantProgression } from './progressionService';
import { useGameHistoryStore } from '../store/useGameHistoryStore';

const PENDING_RESULTS_KEY = 'puzzleverse_pending_results';

export const syncPendingResults = async () => {
  if (!navigator.onLine) return;
  const pending = localStorage.getItem(PENDING_RESULTS_KEY);
  if (!pending) return;

  try {
    const results: any[] = JSON.parse(pending);
    if (results.length === 0) return;

    console.log(`Attempting to sync ${results.length} pending offline results...`);
    const submitGameResult = httpsCallable(functions, 'submitGameResult');
    
    // Attempt to submit each one. If SERVER mode, call function.
    // In FREE mode, we'd theoretically replay the progression, but we can't easily do batch commits asynchronously for past users without auth context if logged out.
    // We will just clear the queue for now if successful.
    
    const mode = import.meta.env.VITE_GAME_RESULT_MODE || 'FREE';
    
    for (const payload of results) {
       if (mode === 'SERVER') {
          await submitGameResult(payload);
       } else {
          // If FREE mode, just let Firestore native offline sync handle it, or we rely on the client state. 
          // Since we might have manually queued this, we can try to re-process it if we had stored the full state.
       }
    }
    
    // Clear queue after successful sync
    localStorage.removeItem(PENDING_RESULTS_KEY);
  } catch (error) {
    console.error("Failed to sync some pending results", error);
  }
};

export interface GameResultData {
  sessionId: string;
  userId: string;
  puzzleId: string | null;
  puzzleType: string;
  difficulty: string;
  status: string;
  score: number;
  xpEarned: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  accuracy: number;
  hintsUsed: number;
  timeTaken: number;
  moves?: number;
  
  oldLevel: number;
  newLevel: number;
  oldXp: number;
  newXp: number;
  newBestScore?: number;
  
  unlockedAchievements?: any[];
  
  createdAt: any;
}

export const processGameResult = async (
  gameState: GameState,
  profile: UserProfile | null
): Promise<GameResultData | null> => {
  if (!profile) return null;

  // 1. Client-side Anti-cheat validation (Baseline Defense)
  const validation = validateGameResult(gameState);
  if (!validation.valid) {
    console.error("Game result validation failed:", validation.reason);
    throw new Error(`Invalid result: ${validation.reason}`);
  }

  let timeTaken = gameState.initialTimeLimit - gameState.timeRemaining;
  if (timeTaken < 0) timeTaken = 0;
  if (timeTaken > gameState.initialTimeLimit) timeTaken = gameState.initialTimeLimit;

  // Intercept Battles
  if (gameState.isBattle && gameState.battleId) {
    const { submitBattleResult } = await import('./battleService');
    try {
      await submitBattleResult({
        battleId: gameState.battleId,
        score: gameState.score,
        timeTaken,
        progress: 100,
        correctAnswers: gameState.correctAnswers
      });
    } catch (err) {
      console.error("Failed to submit battle result:", err);
    }
    return null; // Signals components to wait for battle result screen
  }
  const payload = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    puzzleId: gameState.puzzleId,
    puzzleType: gameState.puzzleType,
    difficulty: gameState.difficulty,
    status: gameState.status,
    correctAnswers: gameState.correctAnswers,
    incorrectAnswers: gameState.incorrectAnswers,
    totalQuestions: gameState.totalQuestions,
    hintsUsed: gameState.hintsUsed,
    timeRemaining: gameState.timeRemaining,
    initialTimeLimit: gameState.initialTimeLimit,
    moves: gameState.moves,
    isDailyPuzzle: gameState.isDailyPuzzle,
    dailyPuzzleDate: gameState.dailyPuzzleDate,
    isWeeklyChallenge: gameState.isWeeklyChallenge,
    weeklyChallengeId: gameState.weeklyChallengeId
  };

  const mode = import.meta.env.VITE_GAME_RESULT_MODE || 'FREE';

  if (mode === 'SERVER') {
    if (!navigator.onLine) {
      if (gameState.isDailyPuzzle || gameState.isWeeklyChallenge) {
         throw new Error("This challenge requires an active internet connection to submit.");
      }
      
      const pending = JSON.parse(localStorage.getItem(PENDING_RESULTS_KEY) || '[]');
      pending.push(payload);
      localStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(pending));
      
      console.warn("Result queued for offline sync.");
      throw new Error("You are offline. Your result has been securely queued and will sync when reconnected.");
    }

    try {
      const submitGameResult = httpsCallable(functions, 'submitGameResult');
      const response = await submitGameResult(payload);
      const resultData = response.data as GameResultData;
      dispatchEvents(resultData, profile);
      return resultData;
    } catch (err: any) {
      console.error("Cloud Function submission failed:", err);
      
      // Queue on fail if it's not a hard anti-cheat error
      if (!gameState.isDailyPuzzle && !gameState.isWeeklyChallenge) {
          const pending = JSON.parse(localStorage.getItem(PENDING_RESULTS_KEY) || '[]');
          pending.push(payload);
          localStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(pending));
          throw new Error("Submission failed. Your result has been queued for offline sync.");
      }
      throw new Error(err.message || "Unable to submit your result. Please check your connection and try again.");
    }
  } else {
    // FREE MODE: Client-trusted execution
    console.warn("FREE MODE: Client-trusted gameplay progression. Suitable for demos, but not cheat-resistant.");
    
    if (!navigator.onLine && (gameState.isDailyPuzzle || gameState.isWeeklyChallenge)) {
      throw new Error("This challenge requires an active internet connection to submit.");
    }
    
    const isWin = gameState.status === 'COMPLETED';
    let xpEarned = calculateXp(gameState.difficulty, gameState.correctAnswers, isWin);
    
    // Streaks
    let currentStreak = profile.currentStreak || 0;
    let longestStreak = profile.longestStreak || 0;
    const lastActivityDate = profile.updatedAt?.toDate() || null;
    const today = new Date();
    
    if (!lastActivityDate) {
      currentStreak = 1;
    } else {
      const lastDate = new Date(Date.UTC(lastActivityDate.getUTCFullYear(), lastActivityDate.getUTCMonth(), lastActivityDate.getUTCDate()));
      const currentDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const diffDays = Math.round(Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) currentStreak += 1;
      else if (diffDays > 1) currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    let tempProfile = { ...profile, currentStreak, longestStreak } as any;

    const batch = writeBatch(db);

    const isDuplicateChallenge = gameState.isFriendChallenge && 
      gameState.friendChallengeId && 
      profile.completedFriendChallenges?.includes(gameState.friendChallengeId);
      
    if (isDuplicateChallenge) {
      console.log("XP denied: Duplicate friend challenge completion.");
      xpEarned = 0;
    }

    const newBestScore = Math.max(profile.bestScore || 0, gameState.score);
    let newBestTime = profile.bestTime;
    if (isWin) {
      if (!newBestTime || newBestTime === 0 || timeTaken < newBestTime) {
        newBestTime = timeTaken;
      }
    }

    const accuracy = gameState.totalQuestions > 0 ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100) : 0;
    
    // We create a dummy result for achievement checking
    const dummyResult = {
      isWeeklyChallenge: gameState.isWeeklyChallenge,
      difficulty: gameState.difficulty,
      timeTaken: timeTaken,
      status: gameState.status,
      accuracy,
      hintsUsed: gameState.hintsUsed
    };

    const userUpdate: any = {
      totalGames: (profile.totalGames || 0) + 1,
      totalWins: (profile.totalWins || 0) + (isWin ? 1 : 0),
      bestScore: newBestScore,
      bestTime: newBestTime,
      currentStreak,
      longestStreak
    };
    
    if (gameState.isFriendChallenge && gameState.friendChallengeId && !isDuplicateChallenge && isWin) {
      userUpdate.completedFriendChallenges = arrayUnion(gameState.friendChallengeId);
    }

    const progResult = await grantProgression(profile, xpEarned, {
      batch,
      commitBatch: false,
      isWin,
      additionalUserUpdates: userUpdate,
      gameResult: dummyResult,
      playedTypes: new Set([gameState.puzzleType]),
      wonTypes: isWin ? new Set([gameState.puzzleType]) : new Set()
    });

    const resultData: GameResultData = {
      sessionId: payload.sessionId,
      userId: profile.uid,
      puzzleId: gameState.puzzleId || null,
      puzzleType: gameState.puzzleType,
      difficulty: gameState.difficulty,
      status: gameState.status,
      score: gameState.score,
      xpEarned: progResult.newXp - (profile.xp || 0),
      correctAnswers: gameState.correctAnswers,
      incorrectAnswers: gameState.incorrectAnswers,
      totalQuestions: gameState.totalQuestions,
      accuracy,
      hintsUsed: gameState.hintsUsed,
      moves: gameState.moves ?? undefined,
      timeTaken,
      oldLevel: progResult.oldLevel,
      newLevel: progResult.newLevel,
      oldXp: profile.xp || 0,
      newXp: progResult.newXp,
      newBestScore,
      unlockedAchievements: progResult.unlockedAchievements,
      createdAt: serverTimestamp()
    };

    // Save Session
    const sessionRef = doc(db, 'gameSessions', payload.sessionId);
    batch.set(sessionRef, {
      ...resultData,
      isDailyPuzzle: gameState.isDailyPuzzle || false,
      dailyPuzzleDate: gameState.dailyPuzzleDate || null,
      isWeeklyChallenge: gameState.isWeeklyChallenge || false,
      weeklyChallengeId: gameState.weeklyChallengeId || null
    });

    // Update Global Leaderboard
    const lbRef = doc(db, 'leaderboards', `${profile.uid}_GLOBAL`);
    batch.set(lbRef, {
      userId: profile.uid,
      username: profile.username || '',
      displayName: profile.displayName || '',
      avatarUrl: profile.avatarUrl || null,
      score: newBestScore,
      level: progResult.newLevel,
      bestTime: newBestTime,
      puzzleType: 'ALL',
      difficulty: 'ALL',
      period: 'GLOBAL',
      periodKey: 'GLOBAL',
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update Weekly Leaderboard if applicable
    if (gameState.isWeeklyChallenge && gameState.weeklyChallengeId && isWin) {
      const weeklyLbRef = doc(db, 'leaderboards', `${profile.uid}_WEEKLY_${gameState.weeklyChallengeId}`);
      batch.set(weeklyLbRef, {
        userId: profile.uid,
        username: profile.username || '',
        displayName: profile.displayName || '',
        avatarUrl: profile.avatarUrl || null,
        score: gameState.score,
        level: progResult.newLevel,
        bestTime: timeTaken,
        puzzleType: gameState.puzzleType,
        difficulty: gameState.difficulty,
        period: 'WEEKLY',
        periodKey: gameState.weeklyChallengeId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    try {
      await batch.commit();
      dispatchEvents(resultData, profile);
      return resultData;
    } catch (err: any) {
      console.error("FREE Mode batch write failed:", err);
      throw new Error("Unable to save game result. Please check your connection.");
    }
  }
};

const dispatchEvents = (resultData: GameResultData, profile: UserProfile) => {
  useGameHistoryStore.getState().addGameToHistory(resultData);
  if (resultData.newBestScore && resultData.newBestScore > (profile.bestScore || 0)) {
    window.dispatchEvent(new CustomEvent('personalBest', { detail: { score: resultData.newBestScore, previous: profile.bestScore } }));
  }
};

export const getRecentGames = async (userId: string, limitCount: number = 5) => {
  try {
    const q = query(
      collection(db, 'gameSessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (err) {
    console.error("Failed to fetch recent games:", err);
    return [];
  }
};

export const getAllRecentGames = async (userId: string, limitCount: number = 100) => {
  return getRecentGames(userId, limitCount);
};
