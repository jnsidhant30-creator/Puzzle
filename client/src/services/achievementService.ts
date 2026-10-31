import { collection, doc, getDocs, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from './authService';
import type { GameResultData } from './gameResultService';

export type AchievementRequirementType = 
  | 'FIRST_GAME' | 'FIRST_WIN' | 'GAMES_PLAYED' | 'GAMES_WON' 
  | 'TOTAL_SCORE' | 'TOTAL_XP' | 'LEVEL_REACHED' 
  | 'CURRENT_STREAK' | 'LONGEST_STREAK' | 'PUZZLE_TYPE_PLAYED' 
  | 'PUZZLE_TYPE_MASTERED' | 'PERFECT_GAME' | 'HINTLESS_GAME'
  | 'DAILY_COMPLETIONS' | 'WEEKLY_COMPLETIONS' | 'HARD_PUZZLE' | 'EXPERT_PUZZLE'
  | 'SPEED_SOLVER';

export type AchievementCategory = 'GAMEPLAY' | 'STREAKS' | 'MASTERY' | 'PROGRESSION';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirementType: AchievementRequirementType;
  requirementValue: number | string;
  xpReward: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt: any;
}

// In-memory cache for development/demo purposes if DB reads fail
let cachedAchievements: Achievement[] | null = null;

// Initial starter set definition
export const STARTER_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', name: 'First Step', description: 'Complete your first puzzle.', icon: '🎲', category: 'GAMEPLAY', requirementType: 'FIRST_GAME', requirementValue: 1, xpReward: 50, isActive: true },
  { id: 'first_victory', name: 'First Victory', description: 'Win your first puzzle.', icon: '🏆', category: 'GAMEPLAY', requirementType: 'FIRST_WIN', requirementValue: 1, xpReward: 75, isActive: true },
  { id: 'puzzle_5', name: 'Getting Started', description: 'Play 5 puzzles.', icon: '🌱', category: 'GAMEPLAY', requirementType: 'GAMES_PLAYED', requirementValue: 5, xpReward: 100, isActive: true },
  { id: 'puzzle_addict', name: 'Puzzle Addict', description: 'Play 10 puzzles.', icon: '🧩', category: 'GAMEPLAY', requirementType: 'GAMES_PLAYED', requirementValue: 10, xpReward: 150, isActive: true },
  { id: 'puzzle_25', name: 'Puzzle Enthusiast', description: 'Play 25 puzzles.', icon: '📚', category: 'PROGRESSION', requirementType: 'GAMES_PLAYED', requirementValue: 25, xpReward: 200, isActive: true },
  { id: 'puzzle_master', name: 'Puzzle Master', description: 'Play 50 puzzles.', icon: '👑', category: 'PROGRESSION', requirementType: 'GAMES_PLAYED', requirementValue: 50, xpReward: 250, isActive: true },
  { id: 'puzzle_100', name: 'Puzzle Legend', description: 'Play 100 puzzles.', icon: '🌟', category: 'PROGRESSION', requirementType: 'GAMES_PLAYED', requirementValue: 100, xpReward: 500, isActive: true },
  { id: 'winner_10', name: 'Winner', description: 'Win 10 puzzles.', icon: '🏅', category: 'GAMEPLAY', requirementType: 'GAMES_WON', requirementValue: 10, xpReward: 250, isActive: true },
  { id: 'perfect_mind', name: 'Perfect Mind', description: 'Complete a game with 100% accuracy.', icon: '🎯', category: 'MASTERY', requirementType: 'PERFECT_GAME', requirementValue: 1, xpReward: 200, isActive: true },
  { id: 'no_help_needed', name: 'No Help Needed', description: 'Complete a game without using hints.', icon: '🧠', category: 'MASTERY', requirementType: 'HINTLESS_GAME', requirementValue: 1, xpReward: 150, isActive: true },
  { id: 'hot_streak_3', name: 'Warming Up', description: 'Maintain a 3-day streak.', icon: '🔥', category: 'STREAKS', requirementType: 'CURRENT_STREAK', requirementValue: 3, xpReward: 100, isActive: true },
  { id: 'brain_on_fire', name: 'Brain On Fire', description: 'Maintain a 7-day streak.', icon: '🔥🔥', category: 'STREAKS', requirementType: 'CURRENT_STREAK', requirementValue: 7, xpReward: 250, isActive: true },
  { id: 'unstoppable_14', name: 'Unstoppable', description: 'Maintain a 14-day streak.', icon: '☄️', category: 'STREAKS', requirementType: 'CURRENT_STREAK', requirementValue: 14, xpReward: 500, isActive: true },
  { id: 'dedicated_player', name: 'Dedicated Player', description: 'Maintain a 30-day streak.', icon: '🗓️', category: 'STREAKS', requirementType: 'CURRENT_STREAK', requirementValue: 30, xpReward: 1000, isActive: true },
  { id: 'level_10', name: 'Level Up', description: 'Reach Level 10.', icon: '⭐', category: 'PROGRESSION', requirementType: 'LEVEL_REACHED', requirementValue: 10, xpReward: 300, isActive: true },
  { id: 'puzzle_explorer', name: 'Puzzle Explorer', description: 'Play all 6 puzzle types.', icon: '🧭', category: 'MASTERY', requirementType: 'PUZZLE_TYPE_PLAYED', requirementValue: 6, xpReward: 300, isActive: true },
  { id: 'master_of_all', name: 'Master of All', description: 'Win at least one game in all 6 puzzle types.', icon: '💎', category: 'MASTERY', requirementType: 'PUZZLE_TYPE_MASTERED', requirementValue: 6, xpReward: 500, isActive: true },
  { id: 'first_hard', name: 'Tough Cookie', description: 'Complete your first Hard difficulty puzzle.', icon: '🌶️', category: 'MASTERY', requirementType: 'HARD_PUZZLE', requirementValue: 1, xpReward: 200, isActive: true },
  { id: 'first_expert', name: 'Puzzle God', description: 'Complete your first Expert difficulty puzzle.', icon: '🌋', category: 'MASTERY', requirementType: 'EXPERT_PUZZLE', requirementValue: 1, xpReward: 500, isActive: true },
  { id: 'daily_player', name: 'Daily Player', description: 'Complete your first Daily Puzzle challenge.', icon: '🌅', category: 'STREAKS', requirementType: 'DAILY_COMPLETIONS', requirementValue: 1, xpReward: 100, isActive: true },
  { id: 'daily_champion', name: 'Daily Champion', description: 'Complete 7 Daily Puzzle challenges.', icon: '📅', category: 'STREAKS', requirementType: 'DAILY_COMPLETIONS', requirementValue: 7, xpReward: 500, isActive: true },
  { id: 'weekly_challenger', name: 'Weekly Challenger', description: 'Complete your first weekly challenge.', icon: '🏆', category: 'STREAKS', requirementType: 'WEEKLY_COMPLETIONS', requirementValue: 1, xpReward: 150, isActive: true },
  { id: 'weekly_regular', name: 'Weekly Regular', description: 'Participate in 3 weekly competitions.', icon: '🥉', category: 'STREAKS', requirementType: 'WEEKLY_COMPLETIONS', requirementValue: 3, xpReward: 300, isActive: true },
  { id: 'consistent_competitor', name: 'Consistent Competitor', description: 'Complete 10 weekly challenges.', icon: '🌟', category: 'STREAKS', requirementType: 'WEEKLY_COMPLETIONS', requirementValue: 10, xpReward: 1000, isActive: true },
  { id: 'speed_solver', name: 'Speed Solver', description: 'Complete a puzzle in under 60 seconds.', icon: '⚡', category: 'MASTERY', requirementType: 'SPEED_SOLVER', requirementValue: 60, xpReward: 200, isActive: true },
  { id: 'xp_collector', name: 'XP Collector', description: 'Reach 5,000 Total XP.', icon: '✨', category: 'PROGRESSION', requirementType: 'TOTAL_XP', requirementValue: 5000, xpReward: 500, isActive: true },
];

export const getAchievements = async (): Promise<Achievement[]> => {
  if (cachedAchievements) return cachedAchievements;
  try {
    const snapshot = await getDocs(collection(db, 'achievements'));
    if (!snapshot.empty) {
      cachedAchievements = snapshot.docs.map(doc => doc.data() as Achievement);
      return cachedAchievements;
    }
    // Fallback if DB empty (or if rules block us from seeing it properly)
    return STARTER_ACHIEVEMENTS;
  } catch (err) {
    console.warn("Failed to fetch achievements, using defaults", err);
    return STARTER_ACHIEVEMENTS;
  }
};

export const getUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  try {
    const q = query(collection(db, 'userAchievements'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserAchievement);
  } catch (err) {
    console.warn("Failed to fetch user achievements", err);
    return [];
  }
};

export interface AchievementProgress {
  achievement: Achievement;
  userAchievement: UserAchievement | null;
  currentProgress: number;
  percentage: number;
}

export const calculateProgress = async (userId: string, profile: UserProfile | null): Promise<AchievementProgress[]> => {
  const allAchievements = await getAchievements();
  const userAchievements = await getUserAchievements(userId);

  return allAchievements.map(ach => {
    const userAch = userAchievements.find(ua => ua.achievementId === ach.id) || null;
    let currentProgress = userAch?.progress || 0;

    // Dynamically calculate progress from profile stats if not fully unlocked
    if (!userAch?.unlocked && profile) {
      switch (ach.requirementType) {
        case 'FIRST_GAME': currentProgress = profile.totalGames >= 1 ? 1 : 0; break;
        case 'FIRST_WIN': currentProgress = profile.totalWins >= 1 ? 1 : 0; break;
        case 'GAMES_PLAYED': currentProgress = profile.totalGames || 0; break;
        case 'GAMES_WON': currentProgress = profile.totalWins || 0; break;
        case 'TOTAL_SCORE': currentProgress = profile.bestScore || 0; break; // Best score proxy
        case 'TOTAL_XP': currentProgress = profile.xp || 0; break;
        case 'LEVEL_REACHED': currentProgress = profile.level || 1; break;
        case 'CURRENT_STREAK': currentProgress = profile.currentStreak || 0; break;
        case 'LONGEST_STREAK': currentProgress = profile.longestStreak || 0; break;
        case 'DAILY_COMPLETIONS': currentProgress = profile.longestStreak || 0; break; // Approximated with longestStreak for now
        case 'SPEED_SOLVER': 
          currentProgress = (profile.bestTime && profile.bestTime < Number(ach.requirementValue)) 
            ? Number(ach.requirementValue) : 0; 
          break;
        // The rest are event-based and depend on DB records
      }
    }

    // Ensure progress doesn't exceed requirement
    const reqVal = Number(ach.requirementValue);
    if (currentProgress > reqVal) currentProgress = reqVal;

    return {
      achievement: ach,
      userAchievement: userAch,
      currentProgress,
      percentage: Math.min(100, Math.round((currentProgress / reqVal) * 100))
    };
  });
};

/**
 * Validates which achievements have been freshly unlocked after a game or profile update.
 * Note: In a production environment, this should be executed in Cloud Functions.
 */
export const checkAchievements = async (
  profile: UserProfile,
  gameResult?: GameResultData | any,
  playedTypes?: Set<string>,
  wonTypes?: Set<string>
): Promise<Achievement[]> => {
  const allAchievements = await getAchievements();
  const userAchievements = await getUserAchievements(profile.uid);
  const newlyUnlocked: Achievement[] = [];

  for (const ach of allAchievements) {
    // Skip if already unlocked
    if (userAchievements.some(ua => ua.achievementId === ach.id && ua.unlocked)) {
      continue;
    }

    let meetsRequirement = false;
    const reqVal = Number(ach.requirementValue);

    switch (ach.requirementType) {
      case 'FIRST_GAME': meetsRequirement = profile.totalGames >= 1; break;
      case 'FIRST_WIN': meetsRequirement = profile.totalWins >= 1; break;
      case 'GAMES_PLAYED': meetsRequirement = profile.totalGames >= reqVal; break;
      case 'GAMES_WON': meetsRequirement = profile.totalWins >= reqVal; break;
      case 'LEVEL_REACHED': meetsRequirement = profile.level >= reqVal; break;
      case 'CURRENT_STREAK': meetsRequirement = profile.currentStreak >= reqVal; break;
      case 'DAILY_COMPLETIONS': 
        meetsRequirement = (profile.longestStreak || 0) >= reqVal; 
        break;
      
      case 'WEEKLY_COMPLETIONS':
        if (gameResult?.isWeeklyChallenge && gameResult?.status === 'COMPLETED') {
          if (reqVal === 1) meetsRequirement = true;
        }
        break;

      case 'PERFECT_GAME':
        if (gameResult?.status === 'COMPLETED' && gameResult?.accuracy === 100) {
          meetsRequirement = true;
        }
        break;
      
      case 'HINTLESS_GAME':
        if (gameResult?.status === 'COMPLETED' && gameResult?.hintsUsed === 0) {
          meetsRequirement = true;
        }
        break;

      case 'HARD_PUZZLE':
        if (gameResult?.status === 'COMPLETED' && (gameResult?.difficulty === 'HARD' || gameResult?.difficulty === 'EXPERT')) {
          meetsRequirement = true;
        }
        break;

      case 'EXPERT_PUZZLE':
        if (gameResult?.status === 'COMPLETED' && gameResult?.difficulty === 'EXPERT') {
          meetsRequirement = true;
        }
        break;

      case 'SPEED_SOLVER':
        if (gameResult?.status === 'COMPLETED' && gameResult?.timeTaken > 0 && gameResult?.timeTaken <= reqVal) {
          meetsRequirement = true;
        }
        break;

      case 'TOTAL_XP':
        if (profile.xp >= reqVal) {
          meetsRequirement = true;
        }
        break;

      case 'PUZZLE_TYPE_PLAYED':
        if (playedTypes) meetsRequirement = playedTypes.size >= reqVal;
        break;

      case 'PUZZLE_TYPE_MASTERED':
        if (wonTypes) meetsRequirement = wonTypes.size >= reqVal;
        break;
    }

    if (meetsRequirement) {
      newlyUnlocked.push(ach);
    }
  }

  return newlyUnlocked;
};

/**
 * Attempts to persist unlocked achievements.
 * Fails safely if security rules prevent it (client environment without Cloud Functions).
 */
export const unlockAchievements = async (userId: string, achievements: Achievement[]) => {
  if (achievements.length === 0) return;

  const batch = writeBatch(db);
  let totalXpAwarded = 0;

  for (const ach of achievements) {
    const userAchId = `${userId}_${ach.id}`;
    const userAchRef = doc(db, 'userAchievements', userAchId);
    
    batch.set(userAchRef, {
      id: userAchId,
      userId,
      achievementId: ach.id,
      progress: ach.requirementValue,
      unlocked: true,
      unlockedAt: serverTimestamp(),
    }, { merge: true });

    totalXpAwarded += ach.xpReward;
  }

  try {
    await batch.commit();
    console.log(`Unlocked ${achievements.length} achievements successfully.`);
  } catch (err) {
    console.warn("Failed to write achievements to Firestore. (Expected if rules block client writes).", err);
    // Note: We swallow the error so the UI can still show the local notification
  }

  return totalXpAwarded;
};

// Expose a safe seeder for development to initialize the collection
export const seedAchievements = async () => {
  console.log("Starting achievement seed...");
  const batch = writeBatch(db);
  for (const ach of STARTER_ACHIEVEMENTS) {
    const ref = doc(db, 'achievements', ach.id);
    batch.set(ref, ach, { merge: true });
  }
  try {
    await batch.commit();
    console.log("Achievements seeded successfully!");
  } catch (err) {
    console.error("Failed to seed achievements. Check firestore rules.", err);
  }
};

if (import.meta.env.DEV) {
  (window as any).seedAchievements = seedAchievements;
}
