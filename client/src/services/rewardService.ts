import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface PlayerTitle {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: Rarity;
}

export interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: Rarity;
  icon: string;
}

export const TITLES: PlayerTitle[] = [
  { id: 'puzzle_beginner', name: 'Puzzle Beginner', description: 'Complete your first puzzle.', category: 'Progression', rarity: 'Common' },
  { id: 'puzzle_explorer', name: 'Puzzle Explorer', description: 'Play all puzzle types.', category: 'Exploration', rarity: 'Uncommon' },
  { id: 'puzzle_solver', name: 'Puzzle Solver', description: 'Win 50 games.', category: 'Progression', rarity: 'Rare' },
  { id: 'puzzle_master', name: 'Puzzle Master', description: 'Win 500 games.', category: 'Progression', rarity: 'Legendary' },
  { id: 'logic_specialist', name: 'Logic Specialist', description: 'Win 20 logic puzzles.', category: 'Mastery', rarity: 'Rare' },
  { id: 'memory_specialist', name: 'Memory Specialist', description: 'Win 20 memory puzzles.', category: 'Mastery', rarity: 'Rare' },
  { id: 'speed_solver', name: 'Speed Solver', description: 'Solve a puzzle in under 30 seconds.', category: 'Mastery', rarity: 'Epic' },
  { id: 'daily_challenger', name: 'Daily Challenger', description: 'Maintain a 7-day streak.', category: 'Streaks', rarity: 'Rare' },
  { id: 'weekly_competitor', name: 'Weekly Competitor', description: 'Complete a weekly challenge.', category: 'Competition', rarity: 'Uncommon' },
  { id: 'community_creator', name: 'Community Creator', description: 'Publish a community puzzle.', category: 'Community', rarity: 'Epic' },
  { id: 'battle_veteran', name: 'Battle Veteran', description: 'Win 10 Battles.', category: 'Battles', rarity: 'Rare' },
  { id: 'tournament_competitor', name: 'Tournament Competitor', description: 'Participate in a tournament.', category: 'Competition', rarity: 'Rare' }
];

export const BADGES: PlayerBadge[] = [
  { id: 'first_win_badge', name: 'First Victory', description: 'Won your first game.', category: 'Progression', rarity: 'Common', icon: '🎯' },
  { id: 'dedicated_badge', name: 'Dedicated Player', description: 'Reached level 10.', category: 'Progression', rarity: 'Rare', icon: '⭐' },
  { id: 'streak_30_badge', name: 'Unstoppable', description: 'Maintained a 30-day streak.', category: 'Streaks', rarity: 'Epic', icon: '🔥' },
  { id: 'expert_badge', name: 'Expert Solver', description: 'Won a game on Expert difficulty.', category: 'Mastery', rarity: 'Epic', icon: '🌋' },
  { id: 'season_1_explorer', name: 'Season 1 Explorer', description: 'Participated in Season 1.', category: 'Seasons', rarity: 'Rare', icon: '🗺️' }
];

export const setActiveTitle = async (titleId: string | null): Promise<void> => {
  const setActiveTitleFn = httpsCallable<{ titleId: string | null }, { success: boolean }>(functions, 'setActiveTitle');
  await setActiveTitleFn({ titleId });
};
