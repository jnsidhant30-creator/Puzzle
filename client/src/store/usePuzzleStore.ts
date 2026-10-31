import { create } from 'zustand';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { defaultPuzzles } from '../data/puzzles';

export interface PuzzleConfig {
  id: string;
  category: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  isPublished?: boolean;
  tutorialStage1?: string;
  tutorialStage2?: string;
  tutorialHowToPlay?: string;
}

interface PuzzleStoreState {
  puzzles: typeof defaultPuzzles;
  activePuzzles: typeof defaultPuzzles;
  isLoading: boolean;
  init: () => () => void;
}

export const usePuzzleStore = create<PuzzleStoreState>((set) => ({
  puzzles: defaultPuzzles,
  activePuzzles: defaultPuzzles,
  isLoading: true,
  init: () => {
    const q = collection(db, 'puzzles');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreOverrides = new Map<string, any>();
      snapshot.docs.forEach(doc => {
        firestoreOverrides.set(doc.id, doc.data());
      });

      const mergedPuzzles = defaultPuzzles.map(defaultPz => {
        const override = firestoreOverrides.get(defaultPz.id);
        if (override) {
          return { ...defaultPz, ...override };
        }
        return defaultPz;
      });

      const active = mergedPuzzles.filter((pz: any) => pz.isPublished !== false);

      set({ 
        puzzles: mergedPuzzles,
        activePuzzles: active,
        isLoading: false 
      });
    }, (err) => {
      console.error("Failed to fetch puzzle configs:", err);
      set({ isLoading: false }); // Fallback to defaults
    });

    return unsubscribe;
  }
}));
