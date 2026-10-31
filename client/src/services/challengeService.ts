import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PuzzleType, Difficulty } from '../games/core/types';

export interface FriendChallenge {
  id: string;
  gameId: PuzzleType;
  difficulty: Difficulty;
  puzzleSeed: number | number[];
  creatorUid: string;
  creatorScore: number;
  creatorTime: number;
  createdAt: any;
  status: 'OPEN';
}

export const createFriendChallenge = async (
  gameId: PuzzleType,
  difficulty: Difficulty,
  puzzleSeed: number | number[],
  creatorUid: string,
  creatorScore: number,
  creatorTime: number
): Promise<string> => {
  if (!creatorUid) throw new Error('User must be logged in to create a challenge');
  if (puzzleSeed === undefined) throw new Error('Cannot share a challenge without a valid puzzle seed');

  const challengesRef = collection(db, 'friendChallenges');
  
  const docRef = await addDoc(challengesRef, {
    gameId,
    difficulty,
    puzzleSeed,
    creatorUid,
    creatorScore,
    creatorTime,
    createdAt: serverTimestamp(),
    status: 'OPEN'
  });

  return docRef.id;
};

export const getFriendChallenge = async (challengeId: string): Promise<FriendChallenge | null> => {
  if (!challengeId) return null;
  
  const docRef = doc(db, 'friendChallenges', challengeId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as FriendChallenge;
};
