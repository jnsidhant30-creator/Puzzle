import { doc, writeBatch, serverTimestamp, WriteBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from './authService';
import { getLevelFromXp } from './xpService';
import { checkAchievements, type Achievement } from './achievementService';

export interface ProgressionUpdateResult {
  newXp: number;
  newLevel: number;
  oldLevel: number;
  unlockedAchievements: Achievement[];
  leveledUp: boolean;
}

/**
 * Centralized function to grant XP to a user.
 * Recalculates level, checks for achievements, and optionally writes to Firestore.
 */
export const grantProgression = async (
  profile: UserProfile,
  xpEarned: number,
  options?: {
    batch?: WriteBatch;
    commitBatch?: boolean; // If true, the batch is committed here. Useful for non-game actions like Daily Rewards
    isWin?: boolean;
    additionalUserUpdates?: any; // Any extra fields to update on the user doc
    gameResult?: any;
    playedTypes?: Set<string>;
    wonTypes?: Set<string>;
  }
): Promise<ProgressionUpdateResult> => {
  const oldXp = profile.xp || 0;
  const oldLevel = profile.level || 1;
  let newXp = oldXp + xpEarned;
  
  // Create a temporary profile with the newly earned XP and new level so achievements evaluate correctly
  const tempProfile: any = { 
    ...profile, 
    xp: newXp,
    level: getLevelFromXp(newXp) 
  };
  
  // Apply any other incoming updates to tempProfile (like updated streaks) for achievement eval
  if (options?.additionalUserUpdates) {
    Object.assign(tempProfile, options.additionalUserUpdates);
  }

  // 1. Check achievements with the updated stats
  let achievementXp = 0;
  const newlyUnlocked = await checkAchievements(
    tempProfile,
    options?.gameResult,
    options?.playedTypes,
    options?.wonTypes
  );

  // 2. Add any bonus XP from newly unlocked achievements
  for (const ach of newlyUnlocked) {
    achievementXp += ach.xpReward;
  }
  newXp += achievementXp;
  
  // 3. Final level calculation
  const finalLevel = getLevelFromXp(newXp);

  // 4. Update the user document
  const batch = options?.batch || writeBatch(db);
  const userRef = doc(db, 'users', profile.uid);

  const userUpdate = {
    ...options?.additionalUserUpdates,
    xp: newXp,
    level: finalLevel,
    updatedAt: serverTimestamp(),
  };
  
  batch.update(userRef, userUpdate);

  // 5. Batch achievement unlock documents
  for (const ach of newlyUnlocked) {
    const userAchRef = doc(db, 'userAchievements', `${profile.uid}_${ach.id}`);
    batch.set(userAchRef, {
      id: `${profile.uid}_${ach.id}`,
      userId: profile.uid,
      achievementId: ach.id,
      progress: ach.requirementValue,
      unlocked: true,
      unlockedAt: serverTimestamp(),
    }, { merge: true });
  }

  // 6. Optionally commit
  if (!options?.batch || options?.commitBatch) {
    try {
      await batch.commit();
    } catch (err) {
      console.error("Failed to commit progression update", err);
      throw new Error("Unable to save progression. Please check your connection.");
    }
  }

  // 7. Fire global events
  if (finalLevel > oldLevel) {
    window.dispatchEvent(new CustomEvent('levelUp', { detail: { level: finalLevel } }));
  }

  if (newlyUnlocked.length > 0) {
    window.dispatchEvent(new CustomEvent('achievementsUnlocked', { detail: newlyUnlocked }));
  }

  return {
    newXp,
    newLevel: finalLevel,
    oldLevel,
    unlockedAchievements: newlyUnlocked,
    leveledUp: finalLevel > oldLevel,
  };
};
