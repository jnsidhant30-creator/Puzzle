import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  achievementNotifications: boolean;
  levelUpNotifications: boolean;
  dailyPuzzleNotifications: boolean;
  personalBestNotifications: boolean;
  leaderboardNotifications: boolean;
  streakNotifications: boolean;
  systemNotifications: boolean;
  updatedAt?: any;
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId'> = {
  theme: 'dark',
  soundEnabled: true,
  animationsEnabled: true,
  achievementNotifications: true,
  levelUpNotifications: true,
  dailyPuzzleNotifications: true,
  personalBestNotifications: true,
  leaderboardNotifications: true,
  streakNotifications: true,
  systemNotifications: true,
};

export const getSettings = async (userId: string): Promise<UserSettings> => {
  const docRef = doc(db, 'settings', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserSettings;
  }

  // Create initial settings
  const initialSettings: UserSettings = {
    userId,
    ...DEFAULT_SETTINGS,
    updatedAt: serverTimestamp()
  };
  
  await setDoc(docRef, initialSettings);
  return initialSettings;
};

export const updateSettings = async (userId: string, partial: Partial<UserSettings>): Promise<void> => {
  const docRef = doc(db, 'settings', userId);
  await updateDoc(docRef, {
    ...partial,
    updatedAt: serverTimestamp()
  });
};

export const resetSettings = async (userId: string): Promise<UserSettings> => {
  const docRef = doc(db, 'settings', userId);
  const resetData: UserSettings = {
    userId,
    ...DEFAULT_SETTINGS,
    updatedAt: serverTimestamp()
  };
  await setDoc(docRef, resetData);
  return resetData;
};
