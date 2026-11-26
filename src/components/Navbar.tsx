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

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Home',
  games: 'Puzzle Library',
  game_play: 'Playing Puzzle',
  daily: 'Daily Puzzle',
  challenges: 'Challenges',
  leaderboard: 'Leaderboard',
  journey: 'Journey',
  mastery: 'Mastery',
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
  profile: 'Profile & Settings',
  admin: 'Admin Console',
};

const QUICK_ROUTES = [
  { id: 'games', label: 'Puzzle Library', hint: 'Browse all 16 games' },
  { id: 'daily', label: 'Daily Puzzle', hint: 'Today’s featured challenge' },
  { id: 'challenges', label: 'Challenges', hint: 'Player duels' },
  { id: 'leaderboard', label: 'Leaderboard', hint: 'Rankings and high scores' },
  { id: 'achievements', label: 'Achievements', hint: 'Badges and rewards' },
  { id: 'goals', label: 'Daily Goals', hint: 'Objectives' },
  { id: 'friends', label: 'Friends', hint: 'Players and activity' },
  { id: 'clubs', label: 'Clubs', hint: 'Teams and discussions' },
  { id: 'learn', label: 'Learn', hint: 'Guides and strategies' },
  { id: 'profile', label: 'Profile & Settings', hint: 'Account preferences' },
];

export const Navbar: React.FC = () => {
  const {
    user,
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
        return <Flame className="w-4 h-4 text-[#FF4696]" />;
      case 'challenge':
        return <Swords className="w-4 h-4 text-[#B9B3C2]" />;
      case 'reward':
        return <Award className="w-4 h-4 text-[#34D399]" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-[#FF82B8]" />;
      case 'event':
        return <Sparkles className="w-4 h-4 text-[#B9B3C2]" />;
      case 'friend':
        return <Users className="w-4 h-4 text-[#B9B3C2]" />;
      default:
        return <Bell className="w-4 h-4 text-[#B9B3C2]" />;
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
    <header className="h-14 bg-[#16131C] border-b border-[#342D3D] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Sidebar Toggle + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-lg text-[#B9B3C2] hover:text-[#F5F3F7] hover:bg-[#24202C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696]"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {currentPuzzleName && (
            <>
              <button
                onClick={() => setActiveTab('games')}
                className="hidden sm:inline text-sm text-[#9F97AB] hover:text-[#F5F3F7] transition-colors"
              >
                Puzzles
              </button>
              <span className="hidden sm:inline text-[#9F97AB]" aria-hidden="true">
                /
              </span>
            </>
          )}
          <span className="text-[15px] font-semibold text-[#F5F3F7] truncate">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right: Global Search, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Quick Search Trigger */}
        <button
          onClick={() => {
            setShowMobileSearch(!showMobileSearch);
            setShowNotifications(false);
            setShowProfileMenu(false);
            setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
          }}
          aria-label="Search puzzles or pages"
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#B9B3C2] hover:text-[#F5F3F7] rounded-lg hover:bg-[#24202C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696]"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        {/* Desktop Global Search */}
        <div className="relative hidden md:block w-64" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-[#9F97AB] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setShowSearchResults(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              placeholder="Search puzzles or pages..."
              aria-label="Search puzzles or pages"
              className="w-full h-9 pl-9 pr-12 bg-[#110F15] border border-[#342D3D] rounded-lg text-xs text-[#F5F3F7] placeholder-[#9F97AB] focus:outline-none focus:border-[#FF4696] transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9F97AB] hover:text-[#F5F3F7]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#9F97AB] bg-[#1C1823] border border-[#342D3D] px-1.5 py-0.5 rounded font-mono">
                Ctrl K
              </kbd>
            )}
          </div>

          {showSearchResults && trimmedQuery.length > 0 && (
            <div className="absolute right-0 mt-1.5 w-80 bg-[#1C1823] border border-[#342D3D] rounded-xl shadow-lg overflow-hidden z-50">
              {matchedPuzzles.length === 0 && matchedRoutes.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[#9F97AB]">
                  No matches for "{searchQuery}"
                </div>
              ) : (
                <div className="py-1.5 max-h-80 overflow-y-auto">
                  {matchedPuzzles.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9F97AB]">
                        Puzzles
                      </div>
                      {matchedPuzzles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            playGame(p.id);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#24202C] transition-colors"
                        >
                          <span className="text-xs font-medium text-[#F5F3F7]">{p.name}</span>
                          <span className="text-[11px] text-[#9F97AB]">{p.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedRoutes.length > 0 && (
                    <div className="border-t border-[#342D3D] mt-1 pt-1">
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9F97AB]">
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
                          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#24202C] transition-colors"
                        >
                          <span className="text-xs font-medium text-[#F5F3F7]">{r.label}</span>
                          <span className="text-[11px] text-[#9F97AB]">{r.hint}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              if (!showNotifications) loadNotifications();
            }}
            aria-label="Notifications"
            className="relative min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-9 sm:w-9 flex items-center justify-center text-[#B9B3C2] hover:text-[#F5F3F7] rounded-lg hover:bg-[#24202C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696]"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#FF4696] text-[#110F15] text-[10px] font-bold rounded-md flex items-center justify-center font-tabular">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-[#1C1823] border border-[#342D3D] rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#342D3D] flex items-center justify-between bg-[#16131C]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#F5F3F7] text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FF4696]/15 text-[#FF82B8] font-semibold text-[11px] font-tabular">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-[#FF82B8] hover:text-[#FF4696] flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#342D3D]">
                {loadingNotifications ? (
                  <div className="py-8 text-center text-xs text-[#9F97AB]">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-1.5">
                    <Bell className="w-6 h-6 text-[#9F97AB] mx-auto" />
                    <p className="text-xs font-medium text-[#F5F3F7]">No notifications</p>
                    <p className="text-xs text-[#9F97AB]">
                      Updates for challenges, personal bests, and rewards appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        notif.isRead
                          ? 'hover:bg-[#24202C] opacity-75'
                          : 'bg-[#FF4696]/5 hover:bg-[#24202C]'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#24202C] border border-[#342D3D] shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-[#F5F3F7] truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[11px] text-[#9F97AB] shrink-0 font-tabular">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#B9B3C2] leading-relaxed mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-[#FF4696] shrink-0 mt-2" />
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
            aria-label="Account menu"
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0 sm:h-9 px-1.5 rounded-lg hover:bg-[#24202C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696]"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={user?.displayName || 'Account avatar'}
                className="w-7 h-7 rounded-md object-cover border border-[#342D3D] bg-[#24202C]"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-[#24202C] border border-[#494052] flex items-center justify-center text-[11px] font-semibold text-[#F5F3F7]">
                {initials}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-medium text-[#F5F3F7] max-w-[120px] truncate">
              {user?.displayName || 'Player'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9F97AB] hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[#1C1823] border border-[#342D3D] rounded-xl shadow-lg overflow-hidden z-50 py-1">
              <div className="px-4 py-3 border-b border-[#342D3D] bg-[#16131C]">
                <p className="text-sm font-semibold text-[#F5F3F7] truncate">
                  {user?.displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-[#9F97AB] truncate mt-0.5">{user.email}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[#B9B3C2] font-tabular">
                  <span className="px-1.5 py-0.5 rounded bg-[#24202C] border border-[#342D3D] text-[#FF82B8]">
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
                  className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-[#24202C] transition-colors flex items-center gap-2.5 text-[#B9B3C2] hover:text-[#F5F3F7]"
                >
                  <UserIcon className="w-4 h-4 text-[#9F97AB]" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-[#24202C] transition-colors flex items-center gap-2.5 text-[#B9B3C2] hover:text-[#F5F3F7]"
                >
                  <Settings className="w-4 h-4 text-[#9F97AB]" />
                  <span>Settings</span>
                </button>
                <div className="my-1 border-t border-[#342D3D]" />
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await signOut(auth);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-[#F87171] hover:bg-[#F87171]/10 transition-colors flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-[#16131C] border-b border-[#342D3D] p-3 z-40 shadow-lg">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9F97AB] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search puzzles or pages..."
              aria-label="Search puzzles or pages"
              className="w-full h-10 pl-9 pr-9 bg-[#110F15] border border-[#342D3D] rounded-lg text-sm text-[#F5F3F7] placeholder-[#9F97AB] focus:outline-none focus:border-[#FF4696]"
            />
            <button
              type="button"
              onClick={() => {
                setShowMobileSearch(false);
                setSearchQuery('');
              }}
              aria-label="Close mobile search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9F97AB] hover:text-[#F5F3F7] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {trimmedQuery.length > 0 && (
            <div className="mt-2 bg-[#1C1823] border border-[#342D3D] rounded-lg max-h-64 overflow-y-auto divide-y divide-[#342D3D]">
              {matchedPuzzles.length === 0 && matchedRoutes.length === 0 ? (
                <div className="px-4 py-4 text-center text-xs text-[#9F97AB]">
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
                      className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-[#24202C]"
                    >
                      <span className="text-xs font-medium text-[#F5F3F7]">{p.name}</span>
                      <span className="text-[11px] text-[#9F97AB]">{p.category}</span>
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
                      className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-[#24202C]"
                    >
                      <span className="text-xs font-medium text-[#F5F3F7]">{r.label}</span>
                      <span className="text-[11px] text-[#9F97AB]">{r.hint}</span>
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
