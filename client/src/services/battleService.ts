import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import type { BattleData, BattleStatus, PuzzleType, Difficulty } from '../../../functions/src/types';

export const quickMatchBattle = async (gameType?: PuzzleType, difficulty?: Difficulty) => {
  const func = httpsCallable(functions, 'quickMatchBattle');
  const res = await func({ gameType, difficulty });
  return (res.data as any).battleId as string;
};

export const cancelMatchmaking = async (battleId: string) => {
  const func = httpsCallable(functions, 'cancelMatchmaking');
  await func({ battleId });
};

export const challengeFriendBattle = async (targetUid: string, gameType: PuzzleType, difficulty: Difficulty) => {
  const func = httpsCallable(functions, 'challengeFriendBattle');
  const res = await func({ targetUid, gameType, difficulty });
  return (res.data as any).battleId as string;
};

export const acceptFriendBattle = async (battleId: string) => {
  const func = httpsCallable(functions, 'acceptFriendBattle');
  await func({ battleId });
};

export const setBattleReady = async (battleId: string) => {
  const func = httpsCallable(functions, 'setBattleReady');
  await func({ battleId });
};

export const submitBattleResult = async (payload: {
  battleId: string;
  score: number;
  timeTaken: number;
  progress: number;
  correctAnswers: number;
}) => {
  const func = httpsCallable(functions, 'submitBattleResult');
  await func(payload);
};

export const forceBattleStatus = async (battleId: string, action: 'active' | 'forfeit') => {
  const func = httpsCallable(functions, 'forceBattleStatus');
  await func({ battleId, action });
};

export const syncMyBattleProgress = async (battleId: string, progress: number, score: number, uid: string) => {
  const ref = doc(db, 'battles', battleId);
  try {
    // We don't know if we are playerA or playerB without reading, but reading is 1 extra read.
    // Wait, the client can just read the battle from the `useBattleSubscription` state?
    // Let's just pass `playerKey` if we know it. But in useGameEngine we don't.
    // Instead, let's just do an update using a Cloud Function OR just read once?
    // Actually, `useGameEngine` can't easily know the player key.
    // Let's use a small helper here.
  } catch (err) {
    console.error(err);
  }
};

export const syncBattleProgress = async (battleId: string, playerKey: 'playerA' | 'playerB', progress: number, score: number) => {
  const ref = doc(db, 'battles', battleId);
  try {
    await updateDoc(ref, {
      [`${playerKey}.progress`]: progress,
      [`${playerKey}.score`]: score,
    });
  } catch (err) {
    console.error("Failed to sync progress:", err);
  }
};

export const useBattleSubscription = (battleId: string | null) => {
  const [battle, setBattle] = useState<BattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!battleId) {
      setBattle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, 'battles', battleId);
    
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setBattle({ id: snapshot.id, ...snapshot.data() } as BattleData);
        } else {
          setBattle(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Battle subscription error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [battleId]);

  return { battle, loading, error };
};

export const getBattleHistory = async (uid: string) => {
  try {
    const qA = query(collection(db, 'battles'), where('playerA.uid', '==', uid), where('status', '==', 'completed'), limit(20));
    const qB = query(collection(db, 'battles'), where('playerB.uid', '==', uid), where('status', '==', 'completed'), limit(20));
    
    const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);
    
    const results = [...snapA.docs, ...snapB.docs].map(d => ({ id: d.id, ...d.data() } as BattleData));
    
    const unique = Array.from(new Map(results.map(item => [item.id, item])).values());
    
    unique.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    return unique.slice(0, 20);
  } catch (err) {
    console.error("Failed to fetch battle history", err);
    return [];
  }
};
