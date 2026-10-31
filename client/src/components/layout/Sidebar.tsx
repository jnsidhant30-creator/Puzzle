import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  Puzzle, 
  LayoutDashboard, 
  Gamepad2, 
  Calendar, 
  Trophy, 
  Award, 
  User, 
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { logout } from '../../services/authService';
import { useState } from 'react';
import { useTheme } from '../common/ThemeProvider';
import { NotificationBell } from './NotificationBell';
import { useEffect } from 'react';

interface SidebarProps {
  layoutMode?: 'default' | 'game-focus';
  isGameSidebarOpen?: boolean;
  onGameSidebarChange?: (open: boolean) => void;
}

export const Sidebar = ({
  layoutMode = 'default',
  isGameSidebarOpen = false,
  onGameSidebarChange
}: SidebarProps = {}) => {
  const { profile } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isOpen = layoutMode === 'game-focus' ? isGameSidebarOpen : isMobileOpen;

  const handleOpenChange = (open: boolean) => {
    if (layoutMode === 'game-focus' && onGameSidebarChange) {
      onGameSidebarChange(open);
    } else {
      setIsMobileOpen(open);
    }
  };

  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => { 
      document.body.style.overflow = ''; 
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMobileOpen]);

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/puzzles', icon: Gamepad2, label: 'Puzzles' },
    { to: '/daily-puzzle', icon: Calendar, label: 'Daily Puzzle' },
    { to: '/competition', icon: Trophy, label: 'Competition' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/achievements', icon: Award, label: 'Achievements' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (profile?.role === 'ADMIN') {
    links.push({ to: '/admin', icon: ShieldCheck, label: 'Admin Dashboard' });
  }

  const handleLogout = async () => {
    await logout();
  };

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 group" onClick={() => handleOpenChange(false)}>
          <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg transition-colors">
            <Puzzle className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-textMain">Puzzle<span className="text-primary opacity-80">Verse</span></span>
        </Link>
        <button aria-label="Close navigation menu" className="md:hidden text-textMuted" onClick={() => handleOpenChange(false)}>
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to);
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => handleOpenChange(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold group relative",
                isActive 
                  ? "bg-[#6674CC]/15 text-primary" 
                  : "text-textMuted hover:bg-surface-elevated hover:text-textMain"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
              )}
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border mb-4">
          <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center overflow-hidden shrink-0 relative">
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
            <span className="text-textMain font-bold z-0">
              {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-textMain truncate">{profile?.displayName || 'User'}</p>
            <p className="text-xs text-textMuted">Level {profile?.level || 1}</p>
          </div>
          <NotificationBell />
          <button aria-label="Toggle dark mode" onClick={toggleTheme} className="text-textMuted hover:text-textMain p-1 rounded-md transition-colors">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      {layoutMode !== 'game-focus' && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Puzzle className="w-6 h-6 text-primary" />
            <span className="font-bold text-textMain">PuzzleVerse</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button aria-label={isMobileOpen ? "Close navigation" : "Open navigation"} onClick={() => handleOpenChange(!isMobileOpen)} className="p-2 text-textMuted">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => handleOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border z-50
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen 
          ? 'translate-x-0' 
          : `-translate-x-full ${layoutMode === 'game-focus' ? 'md:-translate-x-full' : 'md:translate-x-0'}`
        }
      `}>
        <NavContent />
      </aside>
    </>
  );
};
