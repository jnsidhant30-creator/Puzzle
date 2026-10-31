import { Link } from 'react-router-dom';
import { Puzzle, Menu, X, Search, Crown, Target } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../common/ThemeProvider';
import { useAuthStore } from '../../store/useAuthStore';
import { useSearchStore } from '../../store/useSearchStore';
import { logout } from '../../services/authService';
import { NotificationBell } from './NotificationBell';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, profile } = useAuthStore();
  const { openSearch } = useSearchStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Puzzle className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-textMain">Puzzle<span className="text-primary">Verse</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-textMuted hover:text-textMain transition-colors text-sm font-medium">Home</Link>
          <Link to="/dashboard" className="text-textMuted hover:text-textMain transition-colors text-sm font-medium">Dashboard</Link>
          <Link to="/seasons" className="text-textMuted hover:text-textMain transition-colors text-sm font-medium flex items-center gap-1">Seasons <Crown className="w-3 h-3 text-accent"/></Link>
          <Link to="/missions" className="text-textMuted hover:text-textMain transition-colors text-sm font-medium flex items-center gap-1">Missions <Target className="w-3 h-3 text-primary"/></Link>
          <Link to="/leaderboard" className="text-textMuted hover:text-textMain transition-colors text-sm font-medium">Leaderboard</Link>
        </nav>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={openSearch}
            className="flex items-center gap-2 bg-black/20 text-textMuted px-3 py-1.5 rounded-lg border border-border hover:bg-white/5 transition-colors"
            title="Search (Cmd+K)"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium hidden lg:inline">Search...</span>
            <kbd className="hidden lg:inline font-mono text-[10px] bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
          </button>
          
          <button onClick={toggleTheme} className="text-textMuted hover:text-textMain p-2 rounded-md hover:bg-white/5 transition-colors">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link to="/profile" aria-label="Profile" className="flex items-center gap-2 text-sm font-medium text-textMain hover:text-primary transition-colors ml-2">
                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center overflow-hidden shrink-0 relative">
                  {profile?.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.displayName || 'User'} 
                      className="w-full h-full object-cover absolute inset-0 z-10" 
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                      }} 
                    />
                  ) : null}
                  <span className="text-textMain font-bold z-0 text-xs">
                    {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </Link>
              <button onClick={() => logout()} className="text-sm font-medium text-textMuted hover:text-textMain transition-colors ml-2">Log out</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-textMuted hover:text-textMain transition-colors">Log in</Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile buttons */}
        <div className="md:hidden flex items-center gap-2">
          <button className="p-2 text-textMuted hover:text-textMain rounded-md hover:bg-white/5 transition-colors" onClick={openSearch}>
            <Search className="w-5 h-5" />
          </button>
          <button aria-label={isOpen ? "Close navigation" : "Open navigation"} className="p-2 text-textMuted" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-surface p-4 flex flex-col gap-4">
          <Link to="/" className="text-textMain font-medium p-2 hover:bg-white/5 rounded-md" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/dashboard" className="text-textMain font-medium p-2 hover:bg-white/5 rounded-md" onClick={() => setIsOpen(false)}>Dashboard</Link>
          <Link to="/daily-puzzle" className="text-textMain font-medium p-2 hover:bg-white/5 rounded-md" onClick={() => setIsOpen(false)}>Daily Puzzle</Link>
          <Link to="/missions" className="text-textMain font-medium p-2 hover:bg-white/5 rounded-md flex items-center gap-2" onClick={() => setIsOpen(false)}><Target className="w-4 h-4 text-primary" />Missions</Link>
          <Link to="/leaderboard" className="text-textMain font-medium p-2 hover:bg-white/5 rounded-md" onClick={() => setIsOpen(false)}>Leaderboard</Link>
          <div className="h-px bg-border my-2" />
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="text-textMain font-medium p-2 hover:bg-white/5 rounded-md" onClick={() => setIsOpen(false)}>Profile</Link>
              <button onClick={() => { logout(); setIsOpen(false); }} className="text-left text-textMain font-medium p-2 hover:bg-white/5 rounded-md">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-textMain font-medium p-2 hover:bg-white/5 rounded-md" onClick={() => setIsOpen(false)}>Log in</Link>
              <Link to="/register" className="text-primary font-medium p-2 hover:bg-primary/10 rounded-md" onClick={() => setIsOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}

      {/* Global Search Overlay */}
      <GlobalSearchModal />
    </header>
  );
};
