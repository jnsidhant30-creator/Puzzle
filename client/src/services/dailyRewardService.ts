import { doc, getDoc, setDoc, serverTimestamp, writeBatch, runTransaction } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import type { UserProfile } from './authService';
import { grantProgression } from './progressionService';

export interface DailyRewardState {
  lastClaimDate: string | null;
  streak: number;
}

const REWARD_AMOUNTS = [50, 60, 75, 90, 100, 125, 200];

export const getRewardAmountForStreak = (streak: number) => {
  // If streak is 1, index is 0 (50 XP).
  const index = Math.max(0, (streak - 1) % 7);
  return REWARD_AMOUNTS[index];
};

const getLocalDateString = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

export const getDailyRewardState = async (userId: string, retries = 2): Promise<DailyRewardState> => {
  try {
    const docRef = doc(db, 'dailyRewards', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DailyRewardState;
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      if (retries > 0) {
        console.warn(`Failed to fetch daily reward state (permission-denied). Retrying... (${retries} left)`);
        await new Promise(r => setTimeout(r, 800));
        return getDailyRewardState(userId, retries - 1);
      }
      console.warn('Failed to fetch daily reward state after retries: Missing or insufficient permissions. This may happen if the user profile is incomplete or unauthenticated.');
    } else {
      console.warn('Failed to fetch daily reward state:', err);
    }
  }
  return { lastClaimDate: null, streak: 0 };
};

export const claimDailyReward = async (profile: UserProfile): Promise<{ success: boolean, newXp: number, streak: number, amount: number, error?: string }> => {
  const mode = import.meta.env.VITE_GAME_RESULT_MODE || 'FREE';

  if (mode === 'SERVER') {
    try {
      const claimFn = httpsCallable(functions, 'claimDailyReward');
      const response = await claimFn();
      const data = response.data as any;
      return { success: true, newXp: data.newXp, streak: data.streak, amount: data.xp };
    } catch (err: any) {
      console.error("Cloud function claimDailyReward failed:", err);
      return { success: false, newXp: profile.xp || 0, streak: 0, amount: 0, error: err.message || "Failed to claim reward." };
    }
  }

  // FREE MODE: Client-trusted execution
  console.warn("FREE MODE: Client-trusted daily reward claim. Suitable for demos, but not cheat-resistant.");
  
  const docRef = doc(db, 'dailyRewards', profile.uid);
  const today = getLocalDateString();
  const currentXp = profile.xp || 0;
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let streak = 0;
      
      if (snap.exists()) {
        const data = snap.data() as DailyRewardState;
        if (data.lastClaimDate === today) {
          throw new Error('ALREADY_CLAIMED');
        }
        
        // Check if they missed a day
        const lastDate = data.lastClaimDate ? new Date(data.lastClaimDate) : null;
        const currentDate = new Date(today);
        let diffDays = 2; // Default to missed
        
        if (lastDate) {
          lastDate.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        if (diffDays === 1) {
          streak = data.streak; // Keep streak
        } else {
          streak = 0; // Reset streak
        }
      }
      
      streak += 1;
      const amount = getRewardAmountForStreak(streak);
      
      // Update Daily Reward Doc idempotently
      transaction.set(docRef, {
        lastClaimDate: today,
        streak,
        lastClaimedAt: serverTimestamp()
      });
      
      return { streak, amount };
    });
    
    // Call centralized progression to handle XP, Level, and Achievements safely
    const progResult = await grantProgression(profile, result.amount, {
      commitBatch: true,
      additionalUserUpdates: {
        currentStreak: result.streak,
        longestStreak: Math.max(profile.longestStreak || 0, result.streak)
      }
    });
    
    return { success: true, newXp: progResult.newXp, streak: result.streak, amount: result.amount };
  } catch (err: any) {
    if (err.message === 'ALREADY_CLAIMED') {
      return { success: false, newXp: currentXp, streak: 0, amount: 0, error: 'Already claimed today.' };
    }
    console.error('Failed to claim daily reward', err);
    return { success: false, newXp: currentXp, streak: 0, amount: 0, error: err.message || 'Unable to claim reward. Please check your connection.' };
  }
};
