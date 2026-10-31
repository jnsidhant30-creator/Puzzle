import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { resetPassword } from '../../services/authService';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#11182B] to-[#1A2140] border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="p-8 sm:p-10 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Reset Password</h1>
          <p className="text-slate-400 font-medium text-sm sm:text-base">Enter your email to receive a reset link.</p>
        </div>
        
        {error && (
          <div className="p-4 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="p-4 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl" role="alert">
            {message}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleReset}>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full relative flex justify-center py-3.5 px-4 mt-6 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FFB347] to-[#FF7A18] hover:from-[#FFB347] hover:to-[#FF9F43] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11182B] focus:ring-[#FFB347] shadow-lg shadow-[#FF7A18]/25 hover:shadow-[#FF7A18]/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
        <div className="pt-2 text-center text-sm text-slate-400">
          <Link to="/login" className="text-[#FFB347] hover:text-[#FF7A18] hover:underline font-medium transition-colors">
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  return (
    <div className="w-full bg-gradient-to-b from-[#11182B] to-[#1A2140] border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="p-8 sm:p-10 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">New Password</h1>
          <p className="text-slate-400 font-medium text-sm sm:text-base">Enter your new password below.</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FFB347] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
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
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-slate-300">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FFB347] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="confirmNewPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
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

          <button
            type="submit"
            className="w-full relative flex justify-center py-3.5 px-4 mt-6 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FFB347] to-[#FF7A18] hover:from-[#FFB347] hover:to-[#FF9F43] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11182B] focus:ring-[#FFB347] shadow-lg shadow-[#FF7A18]/25 hover:shadow-[#FF7A18]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Save Password
          </button>
        </form>
      </div>
    </div>
  );
};
