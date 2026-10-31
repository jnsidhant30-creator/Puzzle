import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

// Interfaces
export interface PuzzleCategory {
  id: string;
  name: string;
  description: string;
}

export interface Puzzle {
  id: string;
  categoryId?: string;
  title: string;
  description?: string;
  type: 'NUMBER' | 'WORD' | 'MEMORY' | 'SLIDING' | 'LOGIC' | 'PATTERN' | string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | string;
  question?: string;
  options?: string[];
  answer?: string;
  timeLimit?: number;
  maxHints?: number;
  baseScore?: number;
  xpReward?: number;
  isPublished?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Service functions
export const getCategories = async (): Promise<PuzzleCategory[]> => {
  const categoriesRef = collection(db, 'puzzleCategories');
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuzzleCategory));
};

export const getPuzzlesByCategory = async (categoryId: string): Promise<Puzzle[]> => {
  const puzzlesRef = collection(db, 'puzzles');
  const q = query(puzzlesRef, where('categoryId', '==', categoryId), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
};

export const getPuzzleById = async (puzzleId: string): Promise<Puzzle | null> => {
  const puzzleRef = doc(db, 'puzzles', puzzleId);
  const snapshot = await getDoc(puzzleRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Puzzle;
};
