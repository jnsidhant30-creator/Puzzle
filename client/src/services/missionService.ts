import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export type MissionFrequency = 'daily' | 'weekly';
export type MissionType = 
  | 'COMPLETE_N_PUZZLES' 
  | 'PLAY_N_DIFFERENT_GAMES' 
  | 'USE_HINTS' 
  | 'EARN_XP'
  | 'COMPLETE_DAILY_CHALLENGE';

export interface MissionDefinition {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  category: string;
  frequency: MissionFrequency;
  target: number;
  rewardXp: number;
}

export interface PlayerMissionProgress {
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  period: string;
  updatedAt: any;
}

// These pools match the backend exactly for deterministic client-side display without needing extra backend reads.
export const DAILY_MISSIONS_POOL: MissionDefinition[] = [
  { id: 'd_play_3', name: 'Dedicated', description: 'Complete 3 puzzles', type: 'COMPLETE_N_PUZZLES', category: 'General', frequency: 'daily', target: 3, rewardXp: 50 },
  { id: 'd_play_diff_2', name: 'Explorer', description: 'Play 2 different puzzle types', type: 'PLAY_N_DIFFERENT_GAMES', category: 'General', frequency: 'daily', target: 2, rewardXp: 50 },
  { id: 'd_daily_challenge', name: 'Daily Challenger', description: "Complete today's Daily Challenge", type: 'COMPLETE_DAILY_CHALLENGE', category: 'Challenge', frequency: 'daily', target: 1, rewardXp: 75 },
  { id: 'd_use_hint_1', name: 'Strategic', description: 'Complete a puzzle using at most 1 hint', type: 'USE_HINTS', category: 'Strategy', frequency: 'daily', target: 1, rewardXp: 40 },
  { id: 'd_earn_100_xp', name: 'High Achiever', description: 'Earn 100 XP', type: 'EARN_XP', category: 'General', frequency: 'daily', target: 100, rewardXp: 60 }
];

export const WEEKLY_MISSIONS_POOL: MissionDefinition[] = [
  { id: 'w_play_15', name: 'Puzzle Master', description: 'Complete 15 puzzles', type: 'COMPLETE_N_PUZZLES', category: 'General', frequency: 'weekly', target: 15, rewardXp: 300 },
  { id: 'w_play_diff_5', name: 'Polymath', description: 'Play 5 different puzzle types', type: 'PLAY_N_DIFFERENT_GAMES', category: 'General', frequency: 'weekly', target: 5, rewardXp: 250 },
  { id: 'w_earn_1000_xp', name: 'XP Grinder', description: 'Earn 1000 XP', type: 'EARN_XP', category: 'General', frequency: 'weekly', target: 1000, rewardXp: 400 }
];

export const getDailyPeriod = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

export const getWeeklyPeriod = (): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getActiveMissions = (): MissionDefinition[] => {
  const dailyPeriod = getDailyPeriod();
  const weeklyPeriod = getWeeklyPeriod();
  
  const dailyHash = hashString(dailyPeriod);
  const weeklyHash = hashString(weeklyPeriod);
  
  const activeDaily: MissionDefinition[] = [];
  let dPool = [...DAILY_MISSIONS_POOL];
  for (let i = 0; i < 3; i++) {
    if (dPool.length === 0) break;
    const index = (dailyHash + i) % dPool.length;
    activeDaily.push(dPool[index]);
    dPool.splice(index, 1);
  }

  const activeWeekly: MissionDefinition[] = [];
  let wPool = [...WEEKLY_MISSIONS_POOL];
  for (let i = 0; i < 2; i++) {
    if (wPool.length === 0) break;
    const index = (weeklyHash + i) % wPool.length;
    activeWeekly.push(wPool[index]);
    wPool.splice(index, 1);
  }

  return [...activeDaily, ...activeWeekly];
};

export const getUserMissionProgress = async (userId: string): Promise<PlayerMissionProgress[]> => {
  const dailyPeriod = getDailyPeriod();
  const weeklyPeriod = getWeeklyPeriod();

  const q = query(
    collection(db, 'userMissions'),
    where('userId', '==', userId),
    where('period', 'in', [dailyPeriod, weeklyPeriod])
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as PlayerMissionProgress);
};
