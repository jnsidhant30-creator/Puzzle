import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  mapAuthError,
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
} from '../services/authService';
import { usePlatformInfo } from '../platform/detectPlatform';
import { Mail, Lock, EyeOff, Eye, WifiOff, RefreshCw, Compass, Download } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  onClose?: () => void;
  hideClose?: boolean;
  isLayout?: boolean;
  onOpenDownload?: () => void;
}

export const AuthModal: React.FC<Props> = ({ onOpenDownload }) => {
  const { setUser, isOnline, retryConnection, enterOfflineGuestMode } = useStore();
  const platform = usePlatformInfo();
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
        const profile = await registerWithEmail(email, password);
        setUser(profile, false);
      } else if (mode === 'login') {
        const profile = await signInWithEmail(email, password);
        setUser(profile, false);
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setResetSent(true);
      }
    } catch (err: unknown) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    if (!isOnline) {
      setError('No internet connection. Connect to sign in with Google, or Play Offline in Guest mode below.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        setUser(profile, false);
      }
      setLoading(false);
    } catch (err: unknown) {
      setError(mapAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F5F2E9] border border-[#D5DEDB] rounded-xl p-6 sm:p-8 text-[#142331]">
      <div className="space-y-1.5 mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#142331]">
          {mode === 'register'
            ? 'Create account'
            : mode === 'forgot'
            ? 'Reset password'
            : 'Sign in'}
        </h2>
        <p className="text-sm text-[#526575]">
          {mode === 'register'
            ? 'Create your PuzzleVerse player account.'
            : mode === 'forgot'
            ? 'Enter your email address to receive a reset link.'
            : 'Sign in to save your puzzles, XP, and best scores.'}
        </p>
      </div>

      {!isOnline && (
        <div className="mb-5 p-3 text-xs font-semibold bg-[#FEF3C7] border border-[#F59E0B]/60 text-[#78350F] rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Offline detected. Account sign-in is paused, or play locally below.</span>
          </div>
          <button
            type="button"
            onClick={() => retryConnection()}
            className="px-2 py-1 rounded bg-white/80 hover:bg-white text-[#142331] inline-flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {error && (
        <div
          className="mb-5 p-3 text-sm font-semibold bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] rounded-lg"
          role="alert"
        >
          {error}
        </div>
      )}

      {resetSent && mode === 'forgot' && (
        <div
          className="mb-5 p-3 text-sm font-semibold bg-[#D1FAE5] border border-[#6EE7B7] text-[#065F46] rounded-lg"
          role="alert"
        >
          Password reset link sent. Check your inbox.
        </div>
      )}

      <form className="space-y-4" onSubmit={handleAuth}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold text-[#142331]">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#526575]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full h-11 pl-10 pr-3.5 bg-[#FFFFFF] border border-[#C3D0CB] rounded-lg text-sm text-[#142331] placeholder:text-[#526575] focus:outline-none focus:border-[#087F8C] focus:ring-2 focus:ring-[#38C6BA]/35 transition-colors"
              placeholder="name@example.com"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-bold text-[#142331]">
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
                  className="text-xs font-semibold text-[#066B75] hover:text-[#142331] transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#526575]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full h-11 pl-10 pr-11 bg-[#FFFFFF] border border-[#C3D0CB] rounded-lg text-sm text-[#142331] placeholder:text-[#526575] focus:outline-none focus:border-[#087F8C] focus:ring-2 focus:ring-[#38C6BA]/35 transition-colors"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[#526575] hover:text-[#142331] focus:outline-none transition-colors"
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
                <div className="w-full border-t border-[#D5DEDB]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2.5 bg-[#F5F2E9] text-[#526575] font-semibold">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondaryLight"
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

            <div className="pt-2 space-y-1.5">
              <Button
                type="button"
                variant="outlineLight"
                size="md"
                onClick={enterOfflineGuestMode}
                disabled={loading}
                className="w-full"
              >
                <Compass className="w-4 h-4 text-[#087F8C]" />
                <span>Play Offline (Guest Practice)</span>
              </Button>
              <p className="text-[11px] text-center text-[#526575]">
                Offline guest scores are stored locally and excluded from global leaderboards.
              </p>
            </div>
          </>
        )}
      </form>

      {platform.canShowDownloadOptions && onOpenDownload && (
        <div className="mt-4 pt-3 border-t border-[#D5DEDB] flex items-center justify-between text-xs">
          <span className="text-[#526575] font-medium">Desktop, Mobile, or PWA?</span>
          <button
            type="button"
            onClick={onOpenDownload}
            className="font-bold text-[#066B75] hover:text-[#142331] inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download / Install App</span>
          </button>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-[#D5DEDB] text-center text-xs text-[#526575]">
        {mode === 'login' ? (
          <p>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className="text-[#066B75] hover:text-[#142331] font-bold transition-colors"
            >
              Create account
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setResetSent(false);
              }}
              className="text-[#066B75] hover:text-[#142331] font-bold transition-colors"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
