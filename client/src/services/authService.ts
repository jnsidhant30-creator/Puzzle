import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  updateProfile
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: string;
  level: number;
  xp: number;
  totalGames: number;
  totalWins: number;
  bestScore: number;
  bestTime: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: any;
  updatedAt: any;
  completedFriendChallenges?: string[];
  battleStats?: {
    wins: number;
    losses: number;
    draws: number;
    played: number;
    winStreak: number;
    totalXp: number;
  };
  unlockedTitles?: string[];
  unlockedBadges?: string[];
  activeTitleId?: string;
}

export const syncUserProfile = async (user: FirebaseUser): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', user.uid);
  console.log('[syncUserProfile] Calling getDoc for UID:', user.uid);
  try {
    const docSnap = await getDoc(userRef);
    console.log('[syncUserProfile] getDoc succeeded, exists:', docSnap.exists());
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('[syncUserProfile] getDoc failed:', error);
    throw error;
  }
};

// --- EMAIL AUTH ---

export const registerWithEmail = async (email: string, pass: string, username: string, fullName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(userCredential.user, { displayName: fullName });
  
  const userRef = doc(db, 'users', userCredential.user.uid);
  const newProfile: UserProfile = {
    uid: userCredential.user.uid,
    username,
    displayName: fullName,
    email: userCredential.user.email,
    phoneNumber: null,
    avatarUrl: userCredential.user.photoURL,
    role: 'PLAYER',
    level: 1,
    xp: 0,
    totalGames: 0,
    totalWins: 0,
    bestScore: 0,
    bestTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(userRef, newProfile);
  
  const publicRef = doc(db, 'publicProfiles', userCredential.user.uid);
  await setDoc(publicRef, {
    uid: newProfile.uid,
    username: newProfile.username,
    displayName: newProfile.displayName,
    avatarUrl: newProfile.avatarUrl,
    level: newProfile.level,
  });

  return { user: userCredential.user, profile: newProfile };
};

export const loginWithEmail = async (email: string, pass: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  let profile = await syncUserProfile(userCredential.user);
  
  if (!profile) {
    console.log('[loginWithEmail] Profile missing. Attempting safe recovery...');
    const userRef = doc(db, 'users', userCredential.user.uid);
    const newProfile: UserProfile = {
      uid: userCredential.user.uid,
      username: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Player',
      displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Player',
      email: userCredential.user.email,
      phoneNumber: null,
      avatarUrl: userCredential.user.photoURL,
      role: 'PLAYER',
      level: 1,
      xp: 0,
      totalGames: 0,
      totalWins: 0,
      bestScore: 0,
      bestTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(userRef, newProfile);

    const publicRef = doc(db, 'publicProfiles', userCredential.user.uid);
    await setDoc(publicRef, {
      uid: newProfile.uid,
      username: newProfile.username,
      displayName: newProfile.displayName,
      avatarUrl: newProfile.avatarUrl,
      level: newProfile.level,
    });

    profile = newProfile;
  }
  
  return { user: userCredential.user, profile };
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const logout = async () => {
  return signOut(auth);
};

