import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, EyeOff, Eye, Loader2 } from 'lucide-react';
import { loginWithEmail } from '../../services/authService';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      let friendlyError = 'Login failed. Please try again.';
      const errorCode = err.code || '';
      const errorMsg = err.message || '';

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        friendlyError = 'Incorrect email or password.';
      } else if (errorCode === 'auth/network-request-failed' || errorMsg.includes('network')) {
        if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
          friendlyError = 'Firebase Emulator is not running. Please start it or disable it in your environment.';
        } else {
          friendlyError = 'Network error. Please check your connection.';
        }
      } else if (errorCode === 'permission-denied' || errorMsg.includes('Missing or insufficient permissions')) {
        friendlyError = 'Unable to access your profile right now.';
      } else if (errorMsg.includes('Profile not found')) {
        friendlyError = 'Your account is authenticated, but your player profile could not be created. Please log out and try again.';
      } else {
        friendlyError = err.message || 'Login failed';
      }

      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/[0.04] border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-2xl px-8 py-10 sm:px-10">
      
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
        <p className="text-slate-400 font-medium text-sm">Sync your level, XP, and leaderboards across devices!</p>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleEmailLogin}>
        
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-5 h-5" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-[#0B1120]/50 border border-white/5 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-12 py-3 bg-[#0B1120]/50 border border-white/5 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
              placeholder="Your Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full relative flex justify-center py-3.5 px-4 mt-8 border border-transparent rounded-xl text-base font-semibold text-[#0B1120] bg-gradient-to-r from-[#FFB347] to-[#FF7A18] hover:from-[#FFB347] hover:to-[#FF9F43] focus:outline-none shadow-[0_0_20px_rgba(255,122,24,0.3)] hover:shadow-[0_0_25px_rgba(255,122,24,0.4)] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-300">
        Need an account?{' '}
        <Link to="/register" className="text-white hover:text-[#FFB347] font-semibold transition-colors">
          Sign Up
        </Link>
      </div>
      
      {/* Hidden link for password reset if they still need it, though it wasn't strictly in the screenshot */}
      <div className="mt-2 text-center text-xs text-slate-500">
        <Link to="/forgot-password" className="hover:text-slate-300 transition-colors">
          Forgot your password?
        </Link>
      </div>

    </div>
  );
};
