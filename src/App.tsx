import React, { useEffect, Suspense, lazy } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { onAuthStateChanged, auth, syncUserProfile, getChallenge2ById } from './services/firebase';
import { completePendingRedirectSignIn, hasPendingRedirectSignIn } from './services/authService';
import { ToastContainer } from './components/ToastContainer';
import { BottomNavigation } from './components/BottomNavigation';
import { BrandLogo } from './components/BrandLogo';
import { PUZZLE_MODES } from './data/puzzles';
import { getPlatformAdapter, initPlatformBridge } from './platform/adapter';
import { usePlatformInfo } from './platform/detectPlatform';

const AuthLayout = lazy(() => import('./components/AuthLayout').then((m) => ({ default: m.AuthLayout })));
const DownloadPage = lazy(() => import('./pages/DownloadPage').then((m) => ({ default: m.DownloadPage })));
const DesktopAuthPage = lazy(() =>
  import('./pages/DesktopAuthPage').then((m) => ({ default: m.DesktopAuthPage }))
);
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const LevelUpModal = lazy(() => import('./components/LevelUpModal').then((m) => ({ default: m.LevelUpModal })));

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const GamesCatalogPage = lazy(() =>
  import('./pages/GamesCatalogPage').then((m) => ({ default: m.GamesCatalogPage }))
);
const GamePlayPage = lazy(() => import('./pages/GamePlayPage').then((m) => ({ default: m.GamePlayPage })));
const DailyPuzzlePage = lazy(() =>
  import('./pages/DailyPuzzlePage').then((m) => ({ default: m.DailyPuzzlePage }))
);
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const AchievementsPage = lazy(() =>
  import('./pages/AchievementsPage').then((m) => ({ default: m.AchievementsPage }))
);
const CommunityPuzzlesPage = lazy(() =>
  import('./pages/CommunityPuzzlesPage').then((m) => ({ default: m.CommunityPuzzlesPage }))
);
const FriendsPage = lazy(() => import('./pages/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage').then((m) => ({ default: m.ChallengesPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const ShowcasePage = lazy(() => import('./pages/ShowcasePage').then((m) => ({ default: m.ShowcasePage })));
const CollectionsPage = lazy(() =>
  import('./pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage }))
);
const CollectionDetailPage = lazy(() =>
  import('./pages/CollectionDetailPage').then((m) => ({ default: m.CollectionDetailPage }))
);
const JourneyPage = lazy(() => import('./pages/JourneyPage').then((m) => ({ default: m.JourneyPage })));
const LearnPage = lazy(() => import('./pages/LearnPage').then((m) => ({ default: m.LearnPage })));
const MasteryPage = lazy(() => import('./pages/MasteryPage').then((m) => ({ default: m.MasteryPage })));
const ClubsPage = lazy(() => import('./pages/ClubsPage').then((m) => ({ default: m.ClubsPage })));
const ClubDetailPage = lazy(() => import('./pages/ClubDetailPage').then((m) => ({ default: m.ClubDetailPage })));
const ClubEventsPage = lazy(() => import('./pages/ClubEventsPage').then((m) => ({ default: m.ClubEventsPage })));
const ClubDiscussionsPage = lazy(() =>
  import('./pages/ClubDiscussionsPage').then((m) => ({ default: m.ClubDiscussionsPage }))
);
const ClubGuidesPage = lazy(() => import('./pages/ClubGuidesPage').then((m) => ({ default: m.ClubGuidesPage })));

const PageLoader = () => (
  <div className="min-h-[420px] flex items-center justify-center" aria-label="Loading view">
    <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#36515F] border-t-[#38C6BA]" />
  </div>
);

function getInitialPathRoute(): 'download' | 'desktop_auth' | null {
  if (typeof window === 'undefined') return null;
  const p = window.location.pathname.toLowerCase();
  if (p === '/download') return 'download';
  if (p === '/desktop-auth') return 'desktop_auth';
  return null;
}

export default function App() {
  const {
    user,
    authLoading,
    activeTab,
    selectedPuzzle,
    theme,
    setUser,
    setAuthLoading,
    setOnlineStatus,
    playChallengeMatch,
    viewPuzzleGuide,
    viewMasteryDetail,
    setActiveTab,
  } = useStore();
  const [targetShowcaseId, setTargetShowcaseId] = React.useState<string | undefined>(undefined);
  const platform = usePlatformInfo();
  const [publicRoute, setPublicRoute] = React.useState<'download' | 'desktop_auth' | null>(() => {
    const initial = getInitialPathRoute();
    if (initial === 'download' && !platform.canShowDownloadOptions) return null;
    return initial;
  });
  const [pwaUpdateAction, setPwaUpdateAction] = React.useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-neon');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    const adapter = getPlatformAdapter();
    const syncNet = () => setOnlineStatus(navigator.onLine);
    window.addEventListener('online', syncNet);
    window.addEventListener('offline', syncNet);
    const unsubNet = adapter.network.subscribe((online) => setOnlineStatus(online));
    syncNet();

    const unsubNav = window.puzzleverseDesktop?.onNavigate
      ? window.puzzleverseDesktop.onNavigate((tab) => {
          setActiveTab(tab as any);
        })
      : () => {};

    let cleanupPlatform: () => void = () => {};
    initPlatformBridge({
      onBackButton: () => {
        const state = useStore.getState();
        if (state.isMobileMenuOpen) {
          state.setIsMobileMenuOpen(false);
          return true;
        }
        if (state.activeTab === 'game_play') {
          window.dispatchEvent(new CustomEvent('pv:escape-game'));
          return true;
        }
        if (state.activeTab !== 'dashboard') {
          state.setActiveTab('dashboard');
          return true;
        }
        return false;
      },
    }).then((fn) => {
      cleanupPlatform = fn;
    });

    const handlePwaUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<{ apply?: () => Promise<void> }>).detail;
      if (detail?.apply) {
        setPwaUpdateAction(() => detail.apply!);
      }
    };
    window.addEventListener('pv:pwa-update-available', handlePwaUpdate);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const hasDialog = Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
        if (!hasDialog && useStore.getState().activeTab === 'game_play') {
          window.dispatchEvent(new CustomEvent('pv:escape-game'));
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('online', syncNet);
      window.removeEventListener('offline', syncNet);
      window.removeEventListener('pv:pwa-update-available', handlePwaUpdate);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      unsubNet();
      unsubNav();
      cleanupPlatform();
    };
  }, [setOnlineStatus, setActiveTab]);

  useEffect(() => {
    const pName = selectedPuzzle ? PUZZLE_MODES.find((p) => p.id === selectedPuzzle)?.name : '';
    getPlatformAdapter().setActiveGameState(
      activeTab === 'game_play' && Boolean(selectedPuzzle),
      pName || ''
    );
  }, [activeTab, selectedPuzzle]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const initAuth = async () => {
      let isSyncing = false;
      const offlineLaunchTimer = setTimeout(() => {
        if (isMounted && !navigator.onLine) {
          setAuthLoading(false);
        }
      }, 1200);

      try {
        const redirectProfile = await completePendingRedirectSignIn();
        if (redirectProfile && isMounted) {
          isSyncing = true;
          setUser(redirectProfile, false);
          setAuthLoading(false);
          isSyncing = false;
        }
      } catch (err) {
        console.error('Google Auth Redirect Error:', err);
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(offlineLaunchTimer);
        try {
          if (firebaseUser) {
            if (!isSyncing) {
              isSyncing = true;
              const profile = await syncUserProfile(firebaseUser);
              if (isMounted) setUser(profile, false);
              isSyncing = false;
            }
          } else {
            const state = useStore.getState();
            if (!hasPendingRedirectSignIn() && !state.isGuest && isMounted) {
              setUser(null, false);
            }
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          if (isMounted && !useStore.getState().isGuest) setUser(null, false);
        } finally {
          if (!hasPendingRedirectSignIn() && isMounted) {
            setAuthLoading(false);
          }
        }
      });

      return () => clearTimeout(offlineLaunchTimer);
    };

    initAuth();

    const p = window.location.pathname.toLowerCase();
    if (p === '/settings') setActiveTab('settings');
    else if (p === '/download') {
      if (platform.canShowDownloadOptions) setActiveTab('download');
      else setActiveTab('dashboard');
    }
    else if (p === '/games') setActiveTab('games');
    else if (p === '/daily') setActiveTab('daily');
    else if (p === '/leaderboard') setActiveTab('leaderboard');

    const hash = window.location.hash;
    if (hash.startsWith('#challenge=')) {
      const challengeId = hash.replace('#challenge=', '');
      getChallenge2ById(challengeId).then((ch) => {
        if (ch) {
          playChallengeMatch(ch.id, ch.puzzleType, ch.difficulty, ch.seed);
        } else {
          setActiveTab('challenges');
        }
      });
    } else if (hash.startsWith('#showcase=')) {
      const showcaseId = hash.replace('#showcase=', '');
      if (showcaseId) {
        setTargetShowcaseId(showcaseId);
        setActiveTab('showcase');
      }
    } else if (hash.startsWith('#learn=')) {
      const pType = hash.replace('#learn=', '') as any;
      if (pType) {
        viewPuzzleGuide(pType);
      } else {
        setActiveTab('learn');
      }
    } else if (hash.startsWith('#mastery=')) {
      const pType = hash.replace('#mastery=', '') as any;
      viewMasteryDetail(pType);
    } else if (hash === '#mastery') {
      setActiveTab('mastery');
    } else if (hash === '#journey') {
      setActiveTab('journey');
    } else if (hash === '#clubs') {
      setActiveTab('clubs');
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Strictly block /download routes when running inside any installed app (Electron, Capacitor, or Installed PWA)
  useEffect(() => {
    if (platform.canShowDownloadOptions) return;
    if (publicRoute === 'download') {
      setPublicRoute(null);
      window.history.replaceState(null, '', user ? '/dashboard' : '/login');
    }
    if (activeTab === 'download') {
      setActiveTab('dashboard');
      window.history.replaceState(null, '', '/dashboard');
    }
  }, [platform.canShowDownloadOptions, publicRoute, activeTab, user, setActiveTab]);

  useEffect(() => {
    if (authLoading) return;
    const path = window.location.pathname;
    if (publicRoute === 'desktop_auth' || (publicRoute === 'download' && platform.canShowDownloadOptions)) {
      return;
    }
    if (!user) {
      if (path !== '/login' && path !== '/register' && path !== '/desktop-auth' && !(path === '/download' && platform.canShowDownloadOptions)) {
        window.history.replaceState(null, '', '/login');
      }
    } else if (activeTab === 'download' && platform.canShowDownloadOptions) {
      if (path !== '/download') window.history.replaceState(null, '', '/download');
    } else if (activeTab === 'settings') {
      if (path !== '/settings') window.history.replaceState(null, '', '/settings');
    } else {
      if (path === '/login' || path === '/register' || path === '/' || path === '/download') {
        window.history.replaceState(null, '', '/dashboard');
      }
    }
  }, [user, authLoading, publicRoute, activeTab, platform.canShowDownloadOptions]);

  if (publicRoute === 'desktop_auth') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#142331]" />}>
        <DesktopAuthPage />
      </Suspense>
    );
  }

  if (publicRoute === 'download' && !user && platform.canShowDownloadOptions) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#142331]" />}>
        <DownloadPage
          onPlayWeb={() => {
            setPublicRoute(null);
            window.history.replaceState(null, '', '/login');
          }}
        />
      </Suspense>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'journey':
        return <JourneyPage />;
      case 'mastery':
      case 'mastery_practice':
        return <MasteryPage />;
      case 'clubs':
        return <ClubsPage />;
      case 'club_detail':
        return <ClubDetailPage />;
      case 'club_events':
        return <ClubEventsPage />;
      case 'club_discussions':
        return <ClubDiscussionsPage />;
      case 'club_guides':
        return <ClubGuidesPage />;
      case 'games':
        return <GamesCatalogPage />;
      case 'learn':
        return <LearnPage />;
      case 'game_play':
        return <GamePlayPage />;
      case 'challenges':
        return <ChallengesPage />;
      case 'goals':
        return <GoalsPage />;
      case 'showcase':
        return <ShowcasePage targetUserId={targetShowcaseId} />;
      case 'collections':
        return <CollectionsPage />;
      case 'collection_detail':
        return <CollectionDetailPage />;
      case 'daily':
        return <DailyPuzzlePage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'community':
        return <CommunityPuzzlesPage />;
      case 'friends':
        return <FriendsPage />;
      case 'admin':
        return <AdminPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'download':
        return platform.canShowDownloadOptions ? (
          <DownloadPage embedded onPlayWeb={() => setActiveTab('dashboard')} />
        ) : (
          <DashboardPage />
        );
      case 'events':
        return <EventsPage />;
      case 'event_detail':
        return <EventDetailPage />;
      case 'insights':
        return <InsightsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#142331] text-[#F5F7F8] flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs w-full">
          <BrandLogo size={44} />
          <p className="text-xs font-semibold text-[#A8E5D5]">Challenge Your Mind. Beat Your Best.</p>
          <div className="w-48 h-1.5 rounded-full bg-[#1C2D3B] border border-[#36515F] overflow-hidden">
            <div className="w-1/2 h-full bg-[#38C6BA] rounded-full animate-pulse" />
          </div>
          <p className="text-[11px] text-[#98AAB8]">
            {navigator.onLine ? 'Restoring player session...' : 'Loading offline puzzle library...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#142331]" />}>
        <AuthLayout
          onOpenDownload={
            platform.canShowDownloadOptions
              ? () => {
                  setPublicRoute('download');
                  window.history.replaceState(null, '', '/download');
                }
              : undefined
          }
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#142331] text-[#F5F7F8] font-sans selection:bg-[#38C6BA]/30 selection:text-[#F5F7F8] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:pt-0 lg:pb-0">
        <Navbar />
        {pwaUpdateAction && activeTab !== 'game_play' && (
          <div className="bg-[#087F8C] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 border-b border-[#38C6BA]">
            <span>A newer version of PuzzleVerse Web App is cached and ready.</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => pwaUpdateAction()}
                className="px-2.5 py-1 rounded bg-white text-[#142331] font-bold hover:bg-[#E9EEE8]"
              >
                Reload to Update
              </button>
              <button
                type="button"
                onClick={() => setPwaUpdateAction(null)}
                className="px-2 py-1 rounded bg-[#142331]/30 hover:bg-[#142331]/50"
              >
                Later
              </button>
            </div>
          </div>
        )}
        <main
          className={`flex-1 relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 ${
            activeTab === 'game_play' ? 'pb-4 pt-2 sm:pt-3 lg:pb-8 lg:pt-5 pv-main-play' : 'pb-[88px] lg:pb-10 pt-5'
          }`}
        >
          <Suspense fallback={<PageLoader />}>{renderActiveTab()}</Suspense>
        </main>
      </div>
      <BottomNavigation />
      <Suspense fallback={null}>
        <LevelUpModal />
      </Suspense>
      <ToastContainer />
    </div>
  );
}
