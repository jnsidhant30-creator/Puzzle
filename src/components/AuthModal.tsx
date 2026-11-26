import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { auth, syncUserProfile, googleProvider } from '../services/firebase';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  onClose?: () => void;
  hideClose?: boolean;
  isLayout?: boolean;
}

export const AuthModal: React.FC<Props> = () => {
  const { setUser } = useStore();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    setResetSent(false);
    try {
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(res.user);
        setUser(profile, false);
      } else if (mode === 'login') {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(res.user);
        setUser(profile, false);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Authentication failed';
      console.error('Authentication Error:', err);
      let friendlyError = 'Authentication failed. Please try again.';
      const errorCode = err.code || '';
      if (
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password'
      ) {
        friendlyError = 'Incorrect email or password.';
      } else if (errorCode === 'auth/email-already-in-use') {
        friendlyError = 'This email is already registered. Please sign in.';
      } else if (errorCode === 'auth/weak-password') {
        friendlyError = 'Password should be at least 6 characters.';
      } else if (errorCode === 'auth/network-request-failed' || errMsg.includes('network')) {
        friendlyError = 'Network error. Check your connection and try again.';
      } else if (errorCode === 'auth/too-many-requests') {
        friendlyError = 'Too many attempts. Please wait a few minutes and try again.';
      } else {
        friendlyError = errMsg;
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      // Use popup-first within the direct click gesture across desktop & mobile:
      // 1) Avoids cross-origin third-party storage partitioning on mobile browsers
      // 2) Routes through authorized firebaseapp.com/__/auth/handler cleanly
      const res = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(res.user);
      setUser(profile, false);
      setLoading(false);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          sessionStorage.setItem('pv_auth_redirect_in_progress', '1');
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          sessionStorage.removeItem('pv_auth_redirect_in_progress');
          setError(redirectErr?.message || 'Google sign-in redirect failed.');
          setLoading(false);
          return;
        }
      }
      sessionStorage.removeItem('pv_auth_redirect_in_progress');
      console.error('Google Auth Error:', err);
      let msg = err.message || 'Google sign-in failed.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized in Firebase settings.';
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        msg = 'Google sign-in popup was closed before completion.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#1C1823] border border-[#342D3D] rounded-xl p-6 sm:p-8">
      <div className="space-y-1.5 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#F5F3F7]">
          {mode === 'register'
            ? 'Create account'
            : mode === 'forgot'
            ? 'Reset password'
            : 'Sign in'}
        </h2>
        <p className="text-sm text-[#B9B3C2]">
          {mode === 'register'
            ? 'Create your PuzzleVerse account.'
            : mode === 'forgot'
            ? 'Enter your email address to receive a password reset link.'
            : 'Sign in to save your scores, XP, and daily streaks.'}
        </p>
      </div>

      {error && (
        <div
          className="mb-5 p-3 text-sm font-medium bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] rounded-lg"
          role="alert"
        >
          {error}
        </div>
      )}

      {resetSent && mode === 'forgot' && (
        <div
          className="mb-5 p-3 text-sm font-medium bg-[#34D399]/10 border border-[#34D399]/30 text-[#34D399] rounded-lg"
          role="alert"
        >
          Password reset link sent. Check your inbox.
        </div>
      )}

      <form className="space-y-4" onSubmit={handleAuth}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-medium text-[#B9B3C2]">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9F97AB]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full h-11 pl-10 pr-3.5 bg-[#110F15] border border-[#342D3D] rounded-lg text-sm text-[#F5F3F7] placeholder:text-[#9F97AB] focus:outline-none focus:border-[#FF4696] focus:ring-2 focus:ring-[#FF4696]/25 transition-colors"
              placeholder="name@example.com"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-medium text-[#B9B3C2]">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-xs text-[#B9B3C2] hover:text-[#F5F3F7] transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9F97AB]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full h-11 pl-10 pr-11 bg-[#110F15] border border-[#342D3D] rounded-lg text-sm text-[#F5F3F7] placeholder:text-[#9F97AB] focus:outline-none focus:border-[#FF4696] focus:ring-2 focus:ring-[#FF4696]/25 transition-colors"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[#9F97AB] hover:text-[#F5F3F7] focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
          {mode === 'register'
            ? 'Create account'
            : mode === 'forgot'
            ? 'Send reset link'
            : 'Sign in'}
        </Button>

        {mode !== 'forgot' && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#342D3D]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2.5 bg-[#1C1823] text-[#9F97AB]">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
          </>
        )}
      </form>

      <div className="mt-6 pt-5 border-t border-[#342D3D] text-center text-xs text-[#9F97AB]">
        {mode === 'login' ? (
          <>
            Need an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className="text-[#FF82B8] hover:text-[#FF4696] font-medium transition-colors"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="text-[#FF82B8] hover:text-[#FF4696] font-medium transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
};
