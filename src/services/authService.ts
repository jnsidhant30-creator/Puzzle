import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { auth, GOOGLE_WEB_CLIENT_ID, googleProvider, syncUserProfile } from './firebase';
import { detectPlatformSync } from '../platform/detectPlatform';
import type { UserProfile } from '../types';

const REDIRECT_FLAG_KEY = 'pv_auth_redirect_pending_v1';
const REDIRECT_TTL_MS = 5 * 60 * 1000;

let nativeGoogleInitialized = false;

function setRedirectPending(active: boolean): void {
  try {
    if (active) {
      const payload = String(Date.now());
      localStorage.setItem(REDIRECT_FLAG_KEY, payload);
      sessionStorage.setItem('pv_auth_redirect_in_progress', payload);
    } else {
      localStorage.removeItem(REDIRECT_FLAG_KEY);
      sessionStorage.removeItem('pv_auth_redirect_in_progress');
    }
  } catch {
    // Ignore storage unavailability
  }
}

export function hasPendingRedirectSignIn(): boolean {
  try {
    const raw =
      localStorage.getItem(REDIRECT_FLAG_KEY) || sessionStorage.getItem('pv_auth_redirect_in_progress');
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isFinite(ts) && ts > 0 && Date.now() - ts > REDIRECT_TTL_MS) {
      setRedirectPending(false);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Translate platform/Firebase auth error objects into clean user-facing messages
 * without exposing raw SDK internals or OAuth credentials.
 */
export function mapAuthError(err: unknown): string {
  const code = String((err as { code?: string })?.code || '');
  const message = err instanceof Error ? err.message : String(err || '');
  const lower = message.toLowerCase();

  if (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    code === 'auth/network-request-failed' ||
    lower.includes('network error') ||
    lower.includes('failed to fetch') ||
    lower.includes('internet connection')
  ) {
    return 'No internet connection. Check your connection and try again, or play in Guest mode.';
  }

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'SIGN_IN_CANCELED' ||
    lower.includes('cancel')
  ) {
    return 'Google Sign-In was cancelled before completion.';
  }

  if (
    code === 'auth/user-token-expired' ||
    code === 'auth/requires-recent-login' ||
    code === 'auth/invalid-user-token'
  ) {
    return 'Your session has expired. Please sign in again to continue.';
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists for this email using Email & Password. Sign in with your email and password first.';
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return 'Incorrect email or password. Please check your details and try again.';
  }

  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Sign in instead.';
  }

  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters long.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many sign-in attempts. Please wait a few minutes and try again.';
  }

  if (code === 'NO_CREDENTIAL_AVAILABLE') {
    return 'No Google account is configured on this device yet. Add a Google account in device Settings or sign in with Email.';
  }

  if (
    code === 'PROVIDER_CONFIGURATION_ERROR' ||
    code === 'auth/unauthorized-domain' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/invalid-api-key' ||
    lower.includes('configuration') ||
    lower.includes('invalid_request_uri')
  ) {
    return 'Google Sign-In configuration error on this environment. Please verify Firebase/OAuth settings or sign in with Email.';
  }

  if (lower.includes('profile')) {
    return 'Your player profile could not be loaded cleanly. Please try again.';
  }

  return 'Authentication failed. Please try again or use Play as Guest.';
}

async function ensureNativeGoogleInitialized(): Promise<void> {
  if (nativeGoogleInitialized) return;
  await GoogleSignIn.initialize({ clientId: GOOGLE_WEB_CLIENT_ID });
  nativeGoogleInitialized = true;
}

async function syncAuthenticatedUser(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const profile = await syncUserProfile(firebaseUser);
  if (!profile?.uid) {
    throw new Error('Missing player profile for authenticated account.');
  }
  return profile;
}

export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return syncAuthenticatedUser(res.user);
}

export async function registerWithEmail(email: string, password: string): Promise<UserProfile> {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  return syncAuthenticatedUser(res.user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

async function signInWithGoogleDesktop(): Promise<UserProfile> {
  if (!window.puzzleverseDesktop?.isDesktop) {
    throw new Error('Desktop bridge unavailable.');
  }
  const authRes = await window.puzzleverseDesktop.startGoogleAuth();
  if (!authRes.ok || (!authRes.idToken && !authRes.accessToken)) {
    throw new Error(authRes.error || 'Google sign-in in system browser did not complete.');
  }
  const credential = GoogleAuthProvider.credential(
    authRes.idToken || null,
    authRes.accessToken || null
  );
  const res = await signInWithCredential(auth, credential);
  return syncAuthenticatedUser(res.user);
}

async function signInWithGoogleNative(): Promise<UserProfile> {
  await ensureNativeGoogleInitialized();
  const nativeRes = await GoogleSignIn.signIn();
  if (!nativeRes?.idToken) {
    throw new Error('Google Sign-In did not return a valid identity token.');
  }
  const credential = GoogleAuthProvider.credential(nativeRes.idToken);
  const res = await signInWithCredential(auth, credential);
  return syncAuthenticatedUser(res.user);
}

async function signInWithGoogleWebOrPwa(): Promise<UserProfile | null> {
  const platform = detectPlatformSync();
  // iOS Safari standalone PWAs block popups; prefer redirect directly there
  const preferRedirectDirect = platform.isInstalledPWA && platform.os === 'ios';

  if (preferRedirectDirect) {
    setRedirectPending(true);
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const res = await signInWithPopup(auth, googleProvider);
    return await syncAuthenticatedUser(res.user);
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      setRedirectPending(true);
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

/**
 * Centralized platform-aware Google Sign-In flow across Desktop, Android, iOS, PWA, and Web.
 * Returns null only when a full-page browser redirect is intentionally in flight.
 */
export async function signInWithGoogle(): Promise<UserProfile | null> {
  const platform = detectPlatformSync();
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Internet connection required for Google sign-in.');
  }

  try {
    if (platform.isDesktopApp) {
      return await signInWithGoogleDesktop();
    }
    if (platform.isMobileApp) {
      return await signInWithGoogleNative();
    }
    return await signInWithGoogleWebOrPwa();
  } catch (err: any) {
    setRedirectPending(false);
    console.warn('[Auth] Google Sign-In failed', {
      runtime: platform.runtime,
      os: platform.os,
      code: err?.code || 'unknown',
    });
    throw err;
  }
}

/**
 * Complete any in-flight Firebase redirect sign-in on Web/PWA startup.
 */
export async function completePendingRedirectSignIn(): Promise<UserProfile | null> {
  const platform = detectPlatformSync();
  if (platform.isDesktopApp || platform.isMobileApp) {
    setRedirectPending(false);
    return null;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setRedirectPending(false);
    return null;
  }

  try {
    const result = await getRedirectResult(auth);
    setRedirectPending(false);
    if (result?.user) {
      return await syncAuthenticatedUser(result.user);
    }
    return null;
  } catch (err: any) {
    setRedirectPending(false);
    console.warn('[Auth] Redirect completion failed', {
      runtime: platform.runtime,
      code: err?.code || 'unknown',
    });
    return null;
  }
}

/**
 * Sign out cleanly across Firebase and native Credential Manager / GoogleSignIn SDK
 * so switching accounts always prompts fresh account selection.
 */
export async function signOutCurrentUser(): Promise<void> {
  const platform = detectPlatformSync();
  setRedirectPending(false);
  if (platform.isMobileApp) {
    try {
      await ensureNativeGoogleInitialized();
      await GoogleSignIn.signOut();
    } catch {
      // Non-fatal if native session already cleared
    }
  }
  await signOut(auth);
}
