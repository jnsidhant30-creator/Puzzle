import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  CheckCheck,
  Search,
  Settings,
  Award,
  Flame,
  Swords,
  Trophy,
  Sparkles,
  Users,
  X,
  WifiOff,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  auth,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/firebase';
import { signOut } from 'firebase/auth';
import { NotificationItem } from '../types';
import { PUZZLE_MODES } from '../data/puzzles';
import { BrandLogo } from './BrandLogo';
import { Capacitor } from '@capacitor/core';

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Home',
  games: 'Games',
  game_play: 'Playing Puzzle',
  daily: 'Daily Puzzle',
  challenges: 'Challenges',
  leaderboard: 'Leaderboards',
  journey: 'Journey',
  mastery: 'Progress & Mastery',
  mastery_practice: 'Mastery Practice',
  achievements: 'Achievements',
  goals: 'Daily Goals',
  insights: 'Insights',
  friends: 'Friends',
  clubs: 'Clubs',
  club_detail: 'Club Details',
  club_events: 'Club Events',
  club_discussions: 'Club Discussions',
  club_guides: 'Club Guides',
  community: 'Custom Levels',
  events: 'Events',
  event_detail: 'Event Details',
  learn: 'Learn',
  collections: 'Collections',
  collection_detail: 'Collection',
  showcase: 'Player Showcase',
  profile: 'Profile',
  settings: 'Settings',
  download: 'Apps & Downloads',
  admin: 'Admin',
};

const QUICK_ROUTES = [
  { id: 'games', label: 'Games', hint: 'Browse all 16 puzzles' },
  { id: 'daily', label: 'Daily Puzzle', hint: "Today's puzzle" },
  { id: 'challenges', label: 'Challenges', hint: 'Player duels' },
  { id: 'leaderboard', label: 'Leaderboards', hint: 'High scores' },
  { id: 'achievements', label: 'Achievements', hint: 'Badges and coins' },
  { id: 'goals', label: 'Daily Goals', hint: 'Play objectives' },
  { id: 'friends', label: 'Friends', hint: 'Friends list' },
  { id: 'clubs', label: 'Clubs', hint: 'Puzzle clubs' },
  { id: 'learn', label: 'Learn', hint: 'Guides and tips' },
  { id: 'profile', label: 'Profile', hint: 'Player stats and customization' },
  { id: 'settings', label: 'Settings', hint: 'App, audio, updates & offline' },
];

export const Navbar: React.FC = () => {
  const {
    user,
    isGuest,
    isOnline,
    retryConnection,
    setUser,
    activeTab,
    selectedPuzzle,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setActiveTab,
    playGame,
  } = useStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setShowMobileSearch(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
        } else {
          searchInputRef.current?.focus();
          setShowSearchResults(true);
        }
      }
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowSearchResults(false);
        setShowMobileSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pb':
        return <Flame className="w-4 h-4 text-[#38C6BA]" />;
      case 'challenge':
        return <Swords className="w-4 h-4 text-[#93D1F2]" />;
      case 'reward':
        return <Award className="w-4 h-4 text-[#A8E5D5]" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-[#FBBF24]" />;
      case 'event':
        return <Sparkles className="w-4 h-4 text-[#93D1F2]" />;
      case 'friend':
        return <Users className="w-4 h-4 text-[#A8E5D5]" />;
      default:
        return <Bell className="w-4 h-4 text-[#B4C3CE]" />;
    }
  };

  const currentPuzzleName =
    activeTab === 'game_play' && selectedPuzzle
      ? PUZZLE_MODES.find((p) => p.id === selectedPuzzle)?.name
      : null;

  const pageTitle = currentPuzzleName || ROUTE_TITLES[activeTab] || 'PuzzleVerse';

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchedPuzzles = trimmedQuery
    ? PUZZLE_MODES.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedQuery) ||
          p.category.toLowerCase().includes(trimmedQuery)
      ).slice(0, 5)
    : [];

  const matchedRoutes = trimmedQuery
    ? QUICK_ROUTES.filter((r) => r.label.toLowerCase().includes(trimmedQuery)).slice(0, 4)
    : [];

  const photoUrl =
    user?.avatarUrl && !user.avatarUrl.includes('api.dicebear.com')
      ? user.avatarUrl
      : auth.currentUser?.photoURL || null;

  const initials = (user?.displayName || 'Player')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-[#1C2D3B] border-b border-[#36515F] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Drawer Toggle + Route Title / Mobile Brand */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden min-h-[44px] min-w-[44px] -ml-1.5 flex items-center justify-center rounded-lg text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#233D4A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA] shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {currentPuzzleName && (
            <>
              <button
                onClick={() => setActiveTab('games')}
                className="hidden sm:inline text-sm text-[#B4C3CE] hover:text-[#F5F7F8] transition-colors"
              >
                Games
              </button>
              <span className="hidden sm:inline text-[#98AAB8]" aria-hidden="true">
                /
              </span>
            </>
          )}
          {activeTab === 'dashboard' && (
            <span className="lg:hidden inline-flex items-center min-w-0">
              <BrandLogo
                size={24}
                className="!gap-1.5 [&_span]:text-[15px] [&_span]:truncate"
              />
            </span>
          )}
          <span
            className={`text-[15px] font-bold text-[#F5F7F8] truncate ${
              activeTab === 'dashboard' ? 'hidden lg:inline' : ''
            }`}
          >
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right: Offline Indicator, Web Download, Search, Notifications, Profile */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {(!isOnline || isGuest) && (
          <button
            type="button"
            onClick={() => retryConnection()}
            title={!isOnline ? 'Offline mode — click to retry connection' : 'Offline Guest Practice'}
            aria-label="Connectivity status"
            className="h-8 px-2.5 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FBBF24] text-[11px] font-bold inline-flex items-center gap-1.5 hover:bg-[#F59E0B]/25 transition-colors"
          >
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{!isOnline ? 'Offline' : 'Guest Practice'}</span>
            {!isOnline && <RefreshCw className="w-3 h-3 hidden sm:inline" />}
          </button>
        )}

        {!window.puzzleverseDesktop?.isDesktop && !Capacitor.isNativePlatform() && activeTab !== 'download' && (
          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className="hidden xl:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#233D4A] hover:bg-[#2C4654] border border-[#36515F] text-xs font-bold text-[#A8E5D5] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get Apps</span>
          </button>
        )}

        <button
          onClick={() => {
            setShowMobileSearch(!showMobileSearch);
            setShowNotifications(false);
            setShowProfileMenu(false);
            setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
          }}
          aria-label="Search puzzles or pages"
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#B4C3CE] hover:text-[#F5F7F8] rounded-lg hover:bg-[#233D4A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA]"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        <div className="relative hidden md:block w-56" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-[#98AAB8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setShowSearchResults(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              placeholder="Find a puzzle..."
              aria-label="Search puzzles or pages"
              className="w-full h-9 pl-9 pr-12 bg-[#142331] border border-[#36515F] rounded-lg text-xs text-[#F5F7F8] placeholder-[#98AAB8] focus:outline-none focus:border-[#38C6BA] transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98AAB8] hover:text-[#F5F7F8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#B4C3CE] bg-[#233D4A] border border-[#36515F] px-1.5 py-0.5 rounded font-mono">
                Ctrl K
              </kbd>
            )}
          </div>

          {showSearchResults && trimmedQuery.length > 0 && (
            <div className="absolute right-0 mt-1.5 w-80 bg-[#233D4A] border border-[#4A6A7B] rounded-xl overflow-hidden z-50">
              {matchedPuzzles.length === 0 && matchedRoutes.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[#B4C3CE]">
                  No matches for "{searchQuery}"
                </div>
              ) : (
                <div className="py-1.5 max-h-80 overflow-y-auto">
                  {matchedPuzzles.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[11px] font-bold text-[#A8E5D5]">
                        Games
                      </div>
                      {matchedPuzzles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            playGame(p.id);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#2C4654] transition-colors"
                        >
                          <span className="text-xs font-semibold text-[#F5F7F8]">{p.name}</span>
                          <span className="text-[11px] text-[#B4C3CE]">{p.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedRoutes.length > 0 && (
                    <div className="border-t border-[#36515F] mt-1 pt-1">
                      <div className="px-3 py-1 text-[11px] font-bold text-[#93D1F2]">
                        Pages
                      </div>
                      {matchedRoutes.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setActiveTab(r.id as any);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#2C4654] transition-colors"
                        >
                          <span className="text-xs font-semibold text-[#F5F7F8]">{r.label}</span>
                          <span className="text-[11px] text-[#B4C3CE]">{r.hint}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              if (!showNotifications) loadNotifications();
            }}
            aria-label="Notifications"
            className="relative min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-9 sm:w-9 flex items-center justify-center text-[#B4C3CE] hover:text-[#F5F7F8] rounded-lg hover:bg-[#233D4A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA]"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#38C6BA] text-[#142331] text-[10px] font-bold rounded flex items-center justify-center font-tabular">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-[#233D4A] border border-[#4A6A7B] rounded-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#36515F] flex items-center justify-between bg-[#1C2D3B]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#F5F7F8] text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-[#38C6BA]/20 text-[#A8E5D5] font-semibold text-[11px] font-tabular">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-[#A8E5D5] hover:text-[#38C6BA] flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#36515F]">
                {loadingNotifications ? (
                  <div className="py-8 text-center text-xs text-[#B4C3CE]">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-1.5">
                    <Bell className="w-6 h-6 text-[#98AAB8] mx-auto" />
                    <p className="text-xs font-semibold text-[#F5F7F8]">No notifications yet</p>
                    <p className="text-xs text-[#B4C3CE]">
                      Challenge invites, personal bests, and rewards appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        notif.isRead
                          ? 'hover:bg-[#2C4654] opacity-75'
                          : 'bg-[#38C6BA]/10 hover:bg-[#2C4654]'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#1C2D3B] border border-[#36515F] shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#F5F7F8] truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[11px] text-[#98AAB8] shrink-0 font-tabular">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#B4C3CE] leading-relaxed mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-sm bg-[#38C6BA] shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            aria-label="Account menu"
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0 sm:h-9 px-1.5 rounded-lg hover:bg-[#233D4A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA]"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={user?.displayName || 'Account avatar'}
                className="w-7 h-7 rounded-lg object-cover border border-[#36515F] bg-[#233D4A]"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#233D4A] border border-[#4A6A7B] flex items-center justify-center text-[11px] font-bold text-[#F5F7F8]">
                {initials}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-[#F5F7F8] max-w-[120px] truncate">
              {user?.displayName || 'Player'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#98AAB8] hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[#233D4A] border border-[#4A6A7B] rounded-xl overflow-hidden z-50 py-1">
              <div className="px-4 py-3 border-b border-[#36515F] bg-[#1C2D3B]">
                <p className="text-sm font-bold text-[#F5F7F8] truncate">
                  {user?.displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-[#B4C3CE] truncate mt-0.5">{user.email}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#B4C3CE] font-tabular">
                  <span className="px-2 py-0.5 rounded bg-[#233D4A] border border-[#36515F] text-[#A8E5D5]">
                    Level {user?.level || 1}
                  </span>
                  <span>{user?.xp || 0} XP</span>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-[#2C4654] transition-colors flex items-center gap-2.5 text-[#B4C3CE] hover:text-[#F5F7F8]"
                >
                  <UserIcon className="w-4 h-4 text-[#93D1F2]" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-[#2C4654] transition-colors flex items-center gap-2.5 text-[#B4C3CE] hover:text-[#F5F7F8]"
                >
                  <Settings className="w-4 h-4 text-[#93D1F2]" />
                  <span>Settings</span>
                </button>
                <div className="my-1 border-t border-[#36515F]" />
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    if (isGuest) {
                      setUser(null, false);
                    } else {
                      await signOut(auth);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-[#FCA5A5] hover:bg-[#EF4444]/15 transition-colors flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isGuest ? 'Exit Guest Mode' : 'Log out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#1C2D3B] border-b border-[#36515F] p-3 z-40">
          <div className="relative">
            <Search className="w-4 h-4 text-[#98AAB8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a puzzle or page..."
              aria-label="Search puzzles or pages"
              className="w-full h-10 pl-9 pr-9 bg-[#142331] border border-[#36515F] rounded-lg text-sm text-[#F5F7F8] placeholder-[#98AAB8] focus:outline-none focus:border-[#38C6BA]"
            />
            <button
              type="button"
              onClick={() => {
                setShowMobileSearch(false);
                setSearchQuery('');
              }}
              aria-label="Close mobile search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98AAB8] hover:text-[#F5F7F8] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {trimmedQuery.length > 0 && (
            <div className="mt-2 bg-[#233D4A] border border-[#36515F] rounded-lg max-h-64 overflow-y-auto divide-y divide-[#36515F]">
              {matchedPuzzles.length === 0 && matchedRoutes.length === 0 ? (
                <div className="px-4 py-4 text-center text-xs text-[#B4C3CE]">
                  No matches for "{searchQuery}"
                </div>
              ) : (
                <>
                  {matchedPuzzles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        playGame(p.id);
                        setShowMobileSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-[#2C4654]"
                    >
                      <span className="text-xs font-semibold text-[#F5F7F8]">{p.name}</span>
                      <span className="text-[11px] text-[#B4C3CE]">{p.category}</span>
                    </button>
                  ))}
                  {matchedRoutes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveTab(r.id as any);
                        setShowMobileSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-[#2C4654]"
                    >
                      <span className="text-xs font-semibold text-[#F5F7F8]">{r.label}</span>
                      <span className="text-[11px] text-[#B4C3CE]">{r.hint}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
