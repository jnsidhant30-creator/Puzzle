import { create } from 'zustand';
import { getAllRecentGames, type GameResultData } from '../services/gameResultService';

interface GameHistoryState {
  games: GameResultData[];
  isLoaded: boolean;
  isLoading: boolean;
  fetchHistory: (userId: string, limit?: number) => Promise<void>;
  addGameToHistory: (game: GameResultData) => void;
  clearHistory: () => void;
}

export const useGameHistoryStore = create<GameHistoryState>((set, get) => ({
  games: [],
  isLoaded: false,
  isLoading: false,

  fetchHistory: async (userId: string, limitCount: number = 200) => {
    // If we've already loaded history for this session, don't refetch
    if (get().isLoaded || get().isLoading) return;

    set({ isLoading: true });
    try {
      const history = await getAllRecentGames(userId, limitCount);
      set({ games: history || [], isLoaded: true, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch game history for cache:', err);
      set({ isLoading: false });
    }
  },

  addGameToHistory: (game: GameResultData) => {
    set((state) => ({
      games: [game, ...state.games]
    }));
  },

  clearHistory: () => {
    set({ games: [], isLoaded: false, isLoading: false });
  }
}));
