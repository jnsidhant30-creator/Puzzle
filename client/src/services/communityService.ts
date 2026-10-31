import { db, functions } from '../config/firebase';
import { collection, doc, query, getDocs, getDoc, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type { PuzzleType, Difficulty } from '../games/core/types';

export type CommunityPuzzleStatus = 'draft' | 'published' | 'unpublished' | 'underReview' | 'removed';

export interface CommunityPuzzleConfig {
  puzzleSeed: number;
}

export interface CommunityPuzzleData {
  id?: string;
  creatorId: string; 
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
// API
// ------------------------------------------------------------------
export const getCommunityPuzzles = async (filters: { status?: CommunityPuzzleStatus, limitCount?: number } = {}): Promise<CommunityPuzzleData[]> => {
  let q = collection(db, 'communityPuzzles');
  
  if (filters.status) {
    // Note: status is queried directly
    const conditions = [where('status', '==', filters.status)];
    conditions.push(orderBy('publishedAt', 'desc'));
    if (filters.limitCount) conditions.push(limit(filters.limitCount));
    const snap = await getDocs(query(q, ...conditions));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPuzzleData));
  } else {
    const snap = await getDocs(query(q, orderBy('createdAt', 'desc'), limit(filters.limitCount || 50)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPuzzleData));
  }
};

export const getCommunityPuzzle = async (puzzleId: string): Promise<CommunityPuzzleData | null> => {
  const snap = await getDoc(doc(db, 'communityPuzzles', puzzleId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CommunityPuzzleData) : null;
};

export const getMyCommunityPuzzles = async (uid: string): Promise<CommunityPuzzleData[]> => {
  let q = query(collection(db, 'communityPuzzles'), where('creatorId', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPuzzleData));
};

export const publishCommunityPuzzle = async (puzzleData: Partial<CommunityPuzzleData>) => {
  const func = httpsCallable<{ puzzleData: Partial<CommunityPuzzleData> }, { success: boolean, puzzleId: string }>(functions, 'publishCommunityPuzzle');
  return await func({ puzzleData });
};

export const reportCommunityPuzzle = async (puzzleId: string, reason: string) => {
  const func = httpsCallable<{ puzzleId: string, reason: string }, { success: boolean }>(functions, 'reportCommunityPuzzle');
  return await func({ puzzleId, reason });
};

export const submitReview = async (puzzleId: string, rating: number, reviewText: string) => {
  const func = httpsCallable<{ puzzleId: string, rating: number, reviewText: string }, { success: boolean }>(functions, 'submitReview');
  return await func({ puzzleId, rating, reviewText });
};

export const voteReviewHelpful = async (puzzleId: string, reviewerId: string) => {
  const func = httpsCallable<{ puzzleId: string, reviewerId: string }, { success: boolean }>(functions, 'voteReviewHelpful');
  return await func({ puzzleId, reviewerId });
};

export const reportReview = async (puzzleId: string, reviewerId: string, reason: string) => {
  const func = httpsCallable<{ puzzleId: string, reviewerId: string, reason: string }, { success: boolean }>(functions, 'reportReview');
  return await func({ puzzleId, reviewerId, reason });
};

export const incrementPlayCount = async (puzzleId: string) => {
  const func = httpsCallable<{ puzzleId: string }, { success: boolean }>(functions, 'incrementPlayCount');
  return await func({ puzzleId });
};

export const getCommunityReviews = async (puzzleId: string, limitCount: number = 20): Promise<CommunityReviewData[]> => {
  const q = query(
    collection(db, `communityPuzzles/${puzzleId}/reviews`),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityReviewData));
};
