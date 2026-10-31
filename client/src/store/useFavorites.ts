import { create } from 'zustand';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';

interface FavoritesState {
  favoriteIds: string[];
  isLoading: boolean;
  isInitialized: boolean;
  initFavoritesListener: (userId: string) => (() => void);
  clearFavorites: () => void;
}

export const useFavorites = create<FavoritesState>((set) => ({
  favoriteIds: [],
  isLoading: true,
  isInitialized: false,
  initFavoritesListener: (userId: string) => {
    set({ isLoading: true });
    
    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(favoritesRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.id);
      set({ favoriteIds: ids, isLoading: false, isInitialized: true });
    }, (error) => {
      console.error('Error fetching favorites:', error);
      set({ isLoading: false, isInitialized: true });
    });
    
    return unsubscribe;
  },
  clearFavorites: () => {
    set({ favoriteIds: [], isLoading: true, isInitialized: false });
  }
}));
