import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '../services/authService';

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  profileMissing: boolean;
  login: (user: FirebaseUser, profile: UserProfile) => void;
  logout: () => void;
  recoverProfile: () => Promise<void>;
  initAuthListener: () => (() => void);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isInitializing: true,
  profileMissing: false,
  login: (user, profile) => set({ user, profile, isAuthenticated: true, profileMissing: false }),
  logout: () => set({ user: null, profile: null, isAuthenticated: false, profileMissing: false }),
  recoverProfile: async () => {
    const state = get();
    if (!state.user) return;
    
    set({ isInitializing: true });
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const userRef = doc(db, 'users', state.user.uid);
      const newProfile = {
        uid: state.user.uid,
        username: state.user.displayName || state.user.email?.split('@')[0] || 'Player',
        displayName: state.user.displayName || state.user.email?.split('@')[0] || 'Player',
        email: state.user.email,
        phoneNumber: null,
        avatarUrl: state.user.photoURL,
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
      
      const publicRef = doc(db, 'publicProfiles', state.user.uid);
      await setDoc(publicRef, {
        uid: state.user.uid,
        username: newProfile.username,
        displayName: newProfile.displayName,
        avatarUrl: newProfile.avatarUrl,
        level: newProfile.level
      });
      // The onSnapshot listener in initAuthListener will pick up the new document
      // and automatically resolve profileMissing
    } catch (error) {
      console.error('Failed to recover profile:', error);
      set({ isInitializing: false });
    }
  },
  initAuthListener: () => {
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (firebaseUser) {
        console.log('[onAuthStateChanged] User detected:', firebaseUser.uid);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        profileUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log('[onAuthStateChanged] Profile synced for UID:', firebaseUser.uid);
            set({ user: firebaseUser, profile: docSnap.data() as UserProfile, isAuthenticated: true, isInitializing: false, profileMissing: false });
          } else {
            console.log('[onAuthStateChanged] Profile not found yet, marking profileMissing: true');
            set({ user: firebaseUser, profile: null, isAuthenticated: true, isInitializing: false, profileMissing: true });
          }
        }, (error: any) => {
          console.error("[onAuthStateChanged] Error fetching user profile:", {
            firebaseUserUid: firebaseUser.uid,
            documentPath: userRef.path,
            authCurrentUserUid: auth.currentUser?.uid,
            errorCode: error.code,
            errorMessage: error.message
          });
          // Do not log the user out just because of a Firestore error.
          // Keep the existing user and auth state intact, but mark profile missing.
          set({ profile: null, isInitializing: false, profileMissing: true });
        });
      } else {
        set({ user: null, profile: null, isAuthenticated: false, isInitializing: false });
      }
    });

    return () => {
      if (profileUnsubscribe) profileUnsubscribe();
      unsubscribe();
    };
  }
}));
