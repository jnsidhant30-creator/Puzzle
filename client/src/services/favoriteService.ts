import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FavoriteGame {
  gameId: string;
  createdAt: any;
}

export const addFavorite = async (userId: string, gameId: string): Promise<void> => {
  if (!userId || !gameId) throw new Error('userId and gameId are required');
  const favRef = doc(db, 'users', userId, 'favorites', gameId);
  await setDoc(favRef, {
    gameId,
    createdAt: serverTimestamp()
  });
};

export const removeFavorite = async (userId: string, gameId: string): Promise<void> => {
  if (!userId || !gameId) throw new Error('userId and gameId are required');
  const favRef = doc(db, 'users', userId, 'favorites', gameId);
  await deleteDoc(favRef);
};
