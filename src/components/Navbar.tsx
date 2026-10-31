import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { 
  Menu, Bell, User as UserIcon, LogOut, ChevronDown, CheckCheck, 
  Flame, Swords, Award, Sparkles, Trophy, Users 
} from 'lucide-react';
import { auth, fetchUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { NotificationItem } from '../types';

export const Navbar: React.FC = () => {
  const { user, isMobileMenuOpen, setIsMobileMenuOpen, setActiveTab } = useStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Derive greeting based on time
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  const firstName = user?.displayName?.split(' ')[0] || 'Player';

  const loadNotifications = async () => {
    if (!user || user.uid.startsWith('guest_')) return;
    setLoadingNotifications(true);
    try {
      const data = await fetchUserNotifications(user.uid);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user && !user.uid.startsWith('guest_')) {
      loadNotifications();
    }
  }, [user]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pb':
        return <Flame className="w-4 h-4 text-pv-dragon-fruit" />;
      case 'challenge':
        return <Swords className="w-4 h-4 text-pv-dragon-fruit-light" />;
      case 'reward':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-pv-dragon-fruit-light" />;
      case 'event':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'friend':
        return <Users className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-pv-dragon-fruit-light" />;
    }
  };

  return (
    <header className="bg-pv-surface-primary border-b border-pv-border-violet px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Area: Mobile Menu + Greeting */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 -ml-2 rounded-xl text-pv-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle mobile navigation"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-xl font-black text-white tracking-tight">
            {greeting}, {firstName}
          </h2>
          <p className="text-sm text-pv-text-secondary font-medium">
            Ready for your next puzzle?
          </p>
        </div>
        <div className="sm:hidden flex items-center gap-2">
          <h1 className="font-black text-lg tracking-wide text-white">PuzzleVerse</h1>
        </div>
      </div>

      {/* Right Area: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              if (!showNotifications) loadNotifications();
            }}
            aria-label="Notifications"
            className="relative p-2 text-pv-text-secondary hover:text-white transition-colors rounded-full hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pv-dragon-fruit"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-pv-dragon-fruit text-pv-bg-primary text-[10px] font-black rounded-full flex items-center justify-center border border-brand-950 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-pv-surface-primary border border-pv-border-violet rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-pv-border-violet flex items-center justify-between bg-gradient-sidebar">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-pv-dragon-fruit/20 text-pv-dragon-fruit-light font-extrabold text-[10px] border border-pv-dragon-fruit/40">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-pv-dragon-fruit-light hover:underline flex items-center gap-1 transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {loadingNotifications ? (
                  <div className="py-8 text-center text-xs text-pv-text-muted">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-2">
                    <Bell className="w-8 h-8 text-pv-text-muted mx-auto opacity-50" />
                    <p className="text-xs font-semibold text-pv-text-secondary">No notifications yet</p>
                    <p className="text-[11px] text-pv-text-muted">Solve puzzles and conquer challenges to earn achievements and rewards!</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                      className={`p-3.5 flex items-start gap-3 transition cursor-pointer ${
                        notif.isRead ? 'hover:bg-white/5 opacity-70' : 'bg-pv-dragon-fruit/5 hover:bg-pv-dragon-fruit/10'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-pv-bg-primary border border-pv-border-violet shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                          <span className="text-[10px] text-pv-text-muted shrink-0 font-mono">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-pv-text-secondary leading-relaxed mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-pv-dragon-fruit shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            aria-label="User profile menu"
            className="flex items-center gap-3 focus:outline-none p-1 pr-2 rounded-full hover:bg-white/5 transition-colors border border-transparent"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-primary-btn p-[2px]">
              <img
                src={user?.avatarUrl || auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || 'Guest'}`}
                alt={user?.displayName || 'User'}
                className="w-full h-full rounded-full object-cover bg-pv-surface-primary"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallback = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || 'Guest'}`;
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            </div>
            <ChevronDown className="w-4 h-4 text-pv-text-secondary hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-pv-surface-primary border border-pv-border-violet rounded-xl shadow-2xl overflow-hidden z-50 py-1">
              <div className="px-4 py-3 border-b border-pv-border-violet bg-gradient-sidebar">
                <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                <p className="text-xs text-pv-text-secondary truncate">{user?.email}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pv-surface-soft border border-pv-border-violet text-[10px] font-extrabold text-pv-dragon-fruit-light">
                  <span>Level {user?.level || 1}</span>
                  <span>•</span>
                  <span>{user?.xp || 0} XP</span>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold hover:bg-white/5 transition flex items-center gap-3 text-pv-text-secondary hover:text-white"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile & Records</span>
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-semibold hover:bg-white/5 transition flex items-center gap-3 text-pv-dragon-fruit-light"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Admin Console</span>
                  </button>
                )}
              </div>
              <div className="border-t border-pv-border-violet py-1">
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await signOut(auth);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold hover:bg-white/5 transition flex items-center gap-3 text-rose-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
