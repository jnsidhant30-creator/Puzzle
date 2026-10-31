import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export type SeasonStatus = 'upcoming' | 'active' | 'completed';

export interface Season {
  id: string;
  name: string;
  description: string;
  theme?: string;
  startAt: Date;
  endAt: Date;
  status: SeasonStatus;
  rewards: {
    badgeId?: string;
    titleId?: string;
  };
}

export interface SeasonProgress {
  userId: string;
  seasonId: string;
  score: number;
  displayName: string;
  avatarUrl: string | null;
  activeTitleId?: string;
  updatedAt: Date;
}

export const getActiveSeason = async (): Promise<Season | null> => {
  const q = query(collection(db, 'seasons'), where('status', '==', 'active'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    ...data,
    id: snap.docs[0].id,
    startAt: (data.startAt as Timestamp).toDate(),
    endAt: (data.endAt as Timestamp).toDate(),
  } as Season;
};

export const getPastSeasons = async (): Promise<Season[]> => {
  const q = query(collection(db, 'seasons'), where('status', '==', 'completed'), orderBy('endAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      startAt: (data.startAt as Timestamp).toDate(),
      endAt: (data.endAt as Timestamp).toDate(),
    } as Season;
  });
};

export const getSeasonLeaderboard = async (seasonId: string, limitCount: number = 100): Promise<SeasonProgress[]> => {
  const q = query(
    collection(db, 'seasonLeaderboards', seasonId, 'players'),
    orderBy('score', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as SeasonProgress;
  });
};

export const getPlayerSeasonProgress = async (seasonId: string, userId: string): Promise<SeasonProgress | null> => {
  const ref = doc(db, 'seasonLeaderboards', seasonId, 'players', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  } as SeasonProgress;
};

// Admin Functions
export const createSeason = async (data: { name: string, description: string, startAt: string, endAt: string, rewards?: any, theme?: string }) => {
  const fn = httpsCallable(functions, 'adminCreateSeason');
  const res = await fn(data);
  return res.data;
};

export const updateSeasonStatus = async (seasonId: string, status: SeasonStatus) => {
  const fn = httpsCallable(functions, 'adminUpdateSeasonStatus');
  const res = await fn({ seasonId, status });
  return res.data;
};
