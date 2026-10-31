import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, syncUserProfile, googleProvider } from '../services/firebase';
import { User, Lock, EyeOff, Eye, Loader2 } from 'lucide-react'; 

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
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') { 
        friendlyError = 'Incorrect email or password.'; 
      } else if (errorCode === 'auth/email-already-in-use') { 
        friendlyError = 'This email is already registered. Please log in.'; 
      } else if (errorCode === 'auth/weak-password') { 
        friendlyError = 'Password should be at least 6 characters.'; 
      } else if (errorCode === 'auth/network-request-failed' || errMsg.includes('network')) { 
        friendlyError = 'Network error. Please check your connection.'; 
      } else if (errorCode === 'auth/too-many-requests') { 
        friendlyError = 'Too many attempts. Please try again later.'; 
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
      const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      if (isMobile) {
        sessionStorage.setItem('pv_auth_redirect_in_progress', '1');
        await signInWithRedirect(auth, googleProvider); 
      } else {
        const res = await signInWithPopup(auth, googleProvider);
        const profile = await syncUserProfile(res.user);
        setUser(profile, false);
        setLoading(false);
      }
    } catch (err: any) { 
      sessionStorage.removeItem('pv_auth_redirect_in_progress');
      console.error('Google Auth Error:', err); 
      let msg = err.message || 'Google Authentication failed'; 
      if (err.code === 'auth/unauthorized-domain') msg = 'This domain is not authorized. Check Firebase settings.'; 
      setError(msg); 
      setLoading(false); 
    } 
  }; 
  
  return ( 
    <div className="w-full bg-pv-surface border border-pv-dragon-fruit/20 shadow-[0_8px_32px_rgba(30,16,51,0.6)] rounded-[26px] overflow-hidden px-5 py-8 sm:px-10 sm:py-10"> 
      <div className="text-center space-y-2 mb-10"> 
        <h2 className="text-[38px] leading-tight sm:text-[44px] font-bold tracking-tight text-pv-text-primary"> 
          {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'} 
        </h2> 
        <p className="text-pv-text-secondary font-medium text-sm"> 
          {mode === 'register' ? 'Start your PuzzleVerse journey.' : mode === 'forgot' ? "Enter your email and we'll help you get back into PuzzleVerse." : 'Sync your level, XP, and leaderboards across devices!'} 
        </p> 
      </div> 
      {error && ( 
        <div className="mb-6 p-4 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center" role="alert"> 
          {error} 
        </div> 
      )} 
      {resetSent && mode === 'forgot' && ( 
        <div className="mb-6 p-4 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center" role="alert"> 
          Password reset link sent! Check your email. 
        </div> 
      )} 
      <form className="space-y-6" onSubmit={handleAuth}> 
        <div className="space-y-2"> 
          <label htmlFor="email" className="block text-sm font-medium text-pv-text-secondary"> 
            Email 
          </label> 
          <div className="relative group"> 
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pv-text-muted group-focus-within:text-pv-dragon-fruit transition-colors"> 
              <User className="w-5 h-5" /> 
            </div> 
            <input 
              id="email" 
              type="email" 
              required 
              autoComplete="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="block w-full h-[54px] pl-11 pr-4 bg-pv-surface-deep border border-pv-dragon-fruit/20 rounded-[15px] text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:ring-4 focus:ring-pv-dragon-fruit/20 focus:border-pv-dragon-fruit transition-all text-sm shadow-sm" 
              placeholder="Enter your email" 
            /> 
          </div> 
        </div> 
        {mode !== 'forgot' && ( 
          <div className="space-y-2"> 
            <label htmlFor="password" className="block text-sm font-medium text-pv-text-secondary"> 
              Password 
            </label> 
            <div className="relative group"> 
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pv-text-muted group-focus-within:text-pv-dragon-fruit transition-colors"> 
                <Lock className="w-5 h-5" /> 
              </div> 
              <input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                required 
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="block w-full h-[54px] pl-11 pr-12 bg-pv-surface-deep border border-pv-dragon-fruit/20 rounded-[15px] text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:ring-4 focus:ring-pv-dragon-fruit/20 focus:border-pv-dragon-fruit transition-all text-sm shadow-sm" 
                placeholder="Your Password" 
              /> 
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-pv-text-muted hover:text-pv-text-secondary focus:outline-none transition-colors" 
                aria-label={showPassword ? 'Hide password' : 'Show password'} 
              > 
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />} 
              </button> 
            </div> 
          </div> 
        )} 
        {mode === 'login' && ( 
          <div className="flex justify-end pt-1"> 
            <button 
              type="button" 
              onClick={() => { setMode('forgot'); setError(null); setResetSent(false); }} 
              className="text-xs text-pv-text-secondary hover:text-pv-dragon-fruit-light font-medium transition-colors" 
            > 
              Forgot password? 
            </button> 
          </div> 
        )} 
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full relative flex items-center justify-center h-[54px] px-4 mt-6 border border-transparent rounded-[14px] text-base font-bold text-white bg-gradient-primary-btn hover:brightness-110 focus:outline-none shadow-[0_4px_12px_rgba(255,70,150,0.3)] active:translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200" 
        > 
          {loading ? ( 
            <span className="flex items-center gap-2"> 
              <Loader2 className="w-5 h-5 animate-spin" /> 
              {mode === 'register' ? 'Creating...' : mode === 'forgot' ? 'Sending...' : 'Signing in...'} 
            </span> 
          ) : ( 
            mode === 'register' ? 'Sign Up' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In' 
          )} 
        </button> 
        {mode !== 'forgot' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pv-dragon-fruit/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-pv-surface text-pv-text-muted">Or continue with</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 h-[54px] px-4 border-2 border-pv-dragon-fruit/30 rounded-[14px] text-base font-bold text-pv-text-primary hover:bg-pv-dragon-fruit/10 focus:outline-none transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </>
        )}
      </form> 
      <div className="mt-8 text-center text-[15px] text-pv-text-secondary"> 
        {mode === 'register' ? ( 
          <> 
            Already have an account?{' '} 
            <button 
              onClick={() => { setMode('login'); setError(null); }} 
              className="text-pv-text-primary hover:text-pv-dragon-fruit-light font-semibold transition-colors"
            > 
              Sign In 
            </button> 
          </> 
        ) : mode === 'forgot' ? ( 
          <> 
            Remember your password?{' '} 
            <button 
              onClick={() => { setMode('login'); setError(null); setResetSent(false); }} 
              className="text-pv-text-primary hover:text-pv-dragon-fruit-light font-semibold transition-colors"
            > 
              Back to Sign In 
            </button> 
          </> 
        ) : ( 
          <> 
            Need an account?{' '} 
            <button 
              onClick={() => { setMode('register'); setError(null); }} 
              className="text-pv-text-primary hover:text-pv-dragon-fruit-light font-semibold transition-colors"
            > 
              Sign Up 
            </button> 
          </> 
        )} 
      </div> 
    </div> 
  );
};
