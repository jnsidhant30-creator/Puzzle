import { collection, doc, getDoc, getDocs, query, limit, orderBy, where, updateDoc, setDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from './authService';
import type { Puzzle } from './puzzleService';
import type { GameResultData } from './gameResultService';
import type { Achievement } from './achievementService';

// ==========================================
// STATISTICS
// ==========================================

export const getPlatformStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Baseline counts
    const usersCountReq = getCountFromServer(collection(db, 'users'));
    const gamesCountReq = getCountFromServer(collection(db, 'gameSessions'));
    const puzzlesCountReq = getCountFromServer(collection(db, 'puzzles'));
    const reportsCountReq = getCountFromServer(collection(db, 'reports'));

    // Activity counts
    const activePlayersQ = query(collection(db, 'users'), where('updatedAt', '>=', sevenDaysAgo));
    const activePlayersReq = getCountFromServer(activePlayersQ);

    const gamesTodayQ = query(collection(db, 'gameSessions'), where('createdAt', '>=', today));
    const gamesTodayReq = getCountFromServer(gamesTodayQ);

    const dailyActivityQ = query(collection(db, 'gameSessions'), where('type', '==', 'DAILY_PUZZLE'), where('createdAt', '>=', today));
    const dailyActivityReq = getCountFromServer(dailyActivityQ);

    const weeklyActivityQ = query(collection(db, 'gameSessions'), where('type', '==', 'WEEKLY_CHALLENGE'), where('createdAt', '>=', today));
    const weeklyActivityReq = getCountFromServer(weeklyActivityQ);

    const [
      usersSnap, gamesSnap, puzzlesSnap, reportsSnap,
      activePlayersSnap, gamesTodaySnap, dailyActivitySnap, weeklyActivitySnap
    ] = await Promise.all([
      usersCountReq, gamesCountReq, puzzlesCountReq, reportsCountReq,
      activePlayersReq, gamesTodayReq, dailyActivityReq, weeklyActivityReq
    ]);

    return {
      totalUsers: usersSnap.data().count,
      activePlayers: activePlayersSnap.data().count,
      totalGames: gamesSnap.data().count,
      totalPuzzles: puzzlesSnap.data().count,
      gamesToday: gamesTodaySnap.data().count,
      dailyChallengeActivity: dailyActivitySnap.data().count,
      weeklyCompetitionActivity: weeklyActivitySnap.data().count,
      reportedContent: reportsSnap.data().count,
      pendingActions: reportsSnap.data().count, // simplified
    };
  } catch (error) {
    console.error("Failed to fetch platform stats:", error);
    throw error;
  }
};

// ==========================================
// USERS
// ==========================================

export const getAdminUsers = async (limitCount: number = 50, searchTerm?: string): Promise<UserProfile[]> => {
  try {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitCount));
    
    if (searchTerm) {
      // Very basic client-friendly search. Firestore string matching is hard natively without Algolia.
      // We will do a generic fetch and filter locally if a search term is provided,
      // or we can just fetch a larger chunk and filter.
      // For a robust system, we'd use a dedicated field or trigrams.
      const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)));
      return snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => 
          u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
          u.uid.includes(searchTerm)
        );
    }

    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

export const getAdminUserDetails = async (uid: string): Promise<UserProfile | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    throw error;
  }
};

// ==========================================
// PUZZLES
// ==========================================

export const getAdminPuzzles = async (): Promise<Puzzle[]> => {
  try {
    const q = query(collection(db, 'puzzles'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
  } catch (error) {
    console.error("Failed to fetch puzzles:", error);
    throw error;
  }
};

export const createAdminPuzzle = async (puzzle: Omit<Puzzle, 'id'>): Promise<Puzzle> => {
  try {
    const newRef = doc(collection(db, 'puzzles'));
    const data = {
      ...puzzle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(newRef, data);
    return { id: newRef.id, ...data } as unknown as Puzzle;
  } catch (error) {
    console.error("Failed to create puzzle:", error);
    throw error;
  }
};

export const updateAdminPuzzle = async (id: string, puzzle: Partial<Puzzle>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'puzzles', id), {
      ...puzzle,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to update puzzle:", error);
    throw error;
  }
};

export const archiveAdminPuzzle = async (id: string): Promise<void> => {
  return updateAdminPuzzle(id, { isPublished: false } as any);
};

// ==========================================
// DAILY PUZZLES
// ==========================================

export interface DailyPuzzleEntry {
  id: string;
  date: string;
  puzzleId: string;
  puzzleType: string;
  difficulty: string;
  createdAt: any;
}

export const getAdminDailyPuzzles = async (): Promise<DailyPuzzleEntry[]> => {
  try {
    const q = query(collection(db, 'dailyPuzzles'), orderBy('date', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyPuzzleEntry));
  } catch (error) {
    console.error("Failed to fetch daily puzzles:", error);
    throw error;
  }
};

export const scheduleAdminDailyPuzzle = async (date: string, puzzleId: string, puzzleType: string, difficulty: string): Promise<void> => {
  try {
    const q = query(collection(db, 'dailyPuzzles'), where('date', '==', date));
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error(`A Daily Puzzle is already scheduled for ${date}`);
    }

    const newRef = doc(collection(db, 'dailyPuzzles'));
    await setDoc(newRef, {
      date,
      puzzleId,
      puzzleType,
      difficulty,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to schedule daily puzzle:", error);
    throw error;
  }
};

// ==========================================
// WEEKLY CHALLENGES
// ==========================================

export interface WeeklyChallengeEntry {
  id?: string;
  year: number;
  week: number;
  puzzleType: string;
  startDate: any;
  endDate: any;
  createdAt: any;
}

export const getAdminWeeklyChallenges = async (): Promise<WeeklyChallengeEntry[]> => {
  try {
    const q = query(collection(db, 'weeklyChallenges'), orderBy('year', 'desc'), orderBy('week', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeeklyChallengeEntry));
  } catch (error) {
    console.error("Failed to fetch weekly challenges:", error);
    throw error;
  }
};

export const scheduleAdminWeeklyChallenge = async (year: number, week: number, puzzleType: string, startDate: Date, endDate: Date): Promise<void> => {
  try {
    const q = query(collection(db, 'weeklyChallenges'), where('year', '==', year), where('week', '==', week));
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error(`A Weekly Challenge is already scheduled for Year ${year} Week ${week}`);
    }

    const newRef = doc(collection(db, 'weeklyChallenges'));
    await setDoc(newRef, {
      year,
      week,
      puzzleType,
      startDate,
      endDate,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to schedule weekly challenge:", error);
    throw error;
  }
};

// ==========================================
// ACHIEVEMENTS
// ==========================================

export const getAdminAchievements = async (): Promise<Achievement[]> => {
  try {
    const snap = await getDocs(collection(db, 'achievements'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
  } catch (error) {
    console.error("Failed to fetch achievements:", error);
    throw error;
  }
};

export const createAdminAchievement = async (achievement: Omit<Achievement, 'id'>): Promise<void> => {
  try {
    const newRef = doc(collection(db, 'achievements'));
    await setDoc(newRef, achievement);
  } catch (error) {
    console.error("Failed to create achievement:", error);
    throw error;
  }
};

export const updateAdminAchievement = async (id: string, achievement: Partial<Achievement>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'achievements', id), achievement);
  } catch (error) {
    console.error("Failed to update achievement:", error);
    throw error;
  }
};

// ==========================================
// GAME SESSIONS
// ==========================================

export const getAdminGameSessions = async (limitCount: number = 50): Promise<GameResultData[]> => {
  try {
    const q = query(collection(db, 'gameSessions'), orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    console.error("Failed to fetch game sessions:", error);
    throw error;
  }
};

// ==========================================
// ANNOUNCEMENTS
// ==========================================
export interface Announcement {
  id: string;
  title: string;
  message: string;
  category: string;
  targetAudience: 'ALL' | 'ACTIVE' | 'NEW';
  publishTime: any;
  expirationTime: any;
  isActive: boolean;
  createdAt: any;
}

export const getAdminAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return [];
  }
};

export const createAdminAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const newRef = doc(collection(db, 'announcements'));
    await setDoc(newRef, {
      ...data,
      createdAt: serverTimestamp()
    });
    await logAdminAction('CREATE_ANNOUNCEMENT', newRef.id, { title: data.title });
  } catch (error) {
    console.error("Failed to create announcement:", error);
    throw error;
  }
};

export const updateAdminAnnouncement = async (id: string, data: Partial<Announcement>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'announcements', id), data);
    await logAdminAction('UPDATE_ANNOUNCEMENT', id, data);
  } catch (error) {
    console.error("Failed to update announcement:", error);
    throw error;
  }
};

// ==========================================
// AUDIT LOGS
// ==========================================
export interface AuditLog {
  id: string;
  adminUid: string;
  action: string;
  target: string;
  metadata: any;
  timestamp: any;
}

export const logAdminAction = async (action: string, target: string, metadata: any = {}) => {
  try {
    const { useAuthStore } = await import('../store/useAuthStore');
    const user = useAuthStore.getState().user;
    if (!user) return;

    const newRef = doc(collection(db, 'adminAuditLogs'));
    await setDoc(newRef, {
      adminUid: user.uid,
      action,
      target,
      metadata,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.warn("Failed to write audit log (may not have permissions):", error);
  }
};

export const getAdminAuditLogs = async (limitCount: number = 50): Promise<AuditLog[]> => {
  try {
    const q = query(collection(db, 'adminAuditLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
};

// ==========================================
// REPORTS
// ==========================================
export interface Report {
  id: string;
  type: string;
  targetId: string;
  reportedBy: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: any;
}

export const getAdminReports = async (): Promise<Report[]> => {
  try {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
};
