import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, AtSign, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerWithEmail } from '../../services/authService';

export const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      await registerWithEmail(email, password, username, fullName);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Your password is too weak. Please use a stronger password.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password accounts are not enabled. Please contact support.';
      } else if (err.code === 'auth/network-request-failed') {
        if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
          errorMessage = 'Firebase Emulator is not running. Please start it or disable it in your environment.';
        } else {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#11182B] to-[#1A2140] border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="p-8 sm:p-10 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Create your account</h1>
          <p className="text-slate-400 font-medium text-sm sm:text-base">Start your puzzle journey today.</p>
        </div>

        {error && (
          <div className="p-4 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleEmailRegister}>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FFB347] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#070B16]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FFB347]/50 focus:border-[#FFB347]/50 transition-all sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FFB347] transition-colors">
                  <AtSign className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#070B16]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FFB347]/50 focus:border-[#FFB347]/50 transition-all sm:text-sm"
                  placeholder="johndoe99"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FFB347] transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-[#070B16]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FFB347]/50 focus:border-[#FFB347]/50 transition-all sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FFB347] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-[#070B16]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FFB347]/50 focus:border-[#FFB347]/50 transition-all sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Confirm
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FFB347] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-[#070B16]/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FFB347]/50 focus:border-[#FFB347]/50 transition-all sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative flex justify-center py-3.5 px-4 mt-6 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FFB347] to-[#FF7A18] hover:from-[#FFB347] hover:to-[#FF9F43] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11182B] focus:ring-[#FFB347] shadow-lg shadow-[#FF7A18]/25 hover:shadow-[#FF7A18]/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#FFB347] hover:text-[#FF7A18] hover:underline font-medium transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
