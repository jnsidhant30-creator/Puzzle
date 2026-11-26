import React, { useEffect, Suspense, lazy } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { onAuthStateChanged, auth, syncUserProfile, getChallenge2ById } from './services/firebase';
import { getRedirectResult } from 'firebase/auth';
import { ToastContainer } from './components/ToastContainer';
import { BottomNavigation } from './components/BottomNavigation';

const AuthLayout = lazy(() => import('./components/AuthLayout').then((m) => ({ default: m.AuthLayout })));
const LevelUpModal = lazy(() => import('./components/LevelUpModal').then((m) => ({ default: m.LevelUpModal })));
const OnboardingTour = lazy(() => import('./components/OnboardingTour').then((m) => ({ default: m.OnboardingTour })));

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const GamesCatalogPage = lazy(() => import('./pages/GamesCatalogPage').then((m) => ({ default: m.GamesCatalogPage })));
const GamePlayPage = lazy(() => import('./pages/GamePlayPage').then((m) => ({ default: m.GamePlayPage })));
const DailyPuzzlePage = lazy(() => import('./pages/DailyPuzzlePage').then((m) => ({ default: m.DailyPuzzlePage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage').then((m) => ({ default: m.AchievementsPage })));
const CommunityPuzzlesPage = lazy(() => import('./pages/CommunityPuzzlesPage').then((m) => ({ default: m.CommunityPuzzlesPage })));
const FriendsPage = lazy(() => import('./pages/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage').then((m) => ({ default: m.ChallengesPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const ShowcasePage = lazy(() => import('./pages/ShowcasePage').then((m) => ({ default: m.ShowcasePage })));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage })));
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage').then((m) => ({ default: m.CollectionDetailPage })));
const JourneyPage = lazy(() => import('./pages/JourneyPage').then((m) => ({ default: m.JourneyPage })));
const LearnPage = lazy(() => import('./pages/LearnPage').then((m) => ({ default: m.LearnPage })));
const MasteryPage = lazy(() => import('./pages/MasteryPage').then((m) => ({ default: m.MasteryPage })));
const ClubsPage = lazy(() => import('./pages/ClubsPage').then((m) => ({ default: m.ClubsPage })));
const ClubDetailPage = lazy(() => import('./pages/ClubDetailPage').then((m) => ({ default: m.ClubDetailPage })));
const ClubEventsPage = lazy(() => import('./pages/ClubEventsPage').then((m) => ({ default: m.ClubEventsPage })));
const ClubDiscussionsPage = lazy(() => import('./pages/ClubDiscussionsPage').then((m) => ({ default: m.ClubDiscussionsPage })));
const ClubGuidesPage = lazy(() => import('./pages/ClubGuidesPage').then((m) => ({ default: m.ClubGuidesPage })));

const PageLoader = () => (
  <div className="min-h-[420px] flex items-center justify-center" aria-label="Loading view">
    <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#342D3D] border-t-[#FF4696]" />
  </div>
);

export default function App() {
  const {
    user,
    authLoading,
    activeTab,
    theme,
    setUser,
    setAuthLoading,
    playChallengeMatch,
    viewPuzzleGuide,
    viewMasteryDetail,
    setActiveTab,
  } = useStore();
  const [targetShowcaseId, setTargetShowcaseId] = React.useState<string | undefined>(undefined);

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-neon');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const initAuth = async () => {
      let isSyncing = false;

      // Step 1: Await getRedirectResult first to consume any incoming redirect credentials
      try {
        const redirectResult = await getRedirectResult(auth);
        sessionStorage.removeItem('pv_auth_redirect_in_progress');

        if (redirectResult?.user && isMounted) {
          isSyncing = true;
          const profile = await syncUserProfile(redirectResult.user);
          if (isMounted) {
            setUser(profile, false);
            setAuthLoading(false);
          }
          isSyncing = false;
        }
      } catch (err: any) {
        sessionStorage.removeItem('pv_auth_redirect_in_progress');
        console.error('Google Auth Redirect Error:', err);
      }

      // Step 2: Attach onAuthStateChanged to manage ongoing session restoration
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            if (!isSyncing) {
              isSyncing = true;
              const profile = await syncUserProfile(firebaseUser);
              if (isMounted) setUser(profile, false);
              isSyncing = false;
            }
          } else {
            const redirectPending = sessionStorage.getItem('pv_auth_redirect_in_progress') === '1';
            if (!redirectPending && isMounted) {
              setUser(null, false);
            }
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          if (isMounted) setUser(null, false);
        } finally {
          const redirectPending = sessionStorage.getItem('pv_auth_redirect_in_progress') === '1';
          if (!redirectPending && isMounted) {
            setAuthLoading(false);
          }
        }
      });
    };

    initAuth();

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
  }, [theme]);

  useEffect(() => {
    if (authLoading) return;
    const path = window.location.pathname;
    if (!user) {
      if (path !== '/login' && path !== '/register') {
        window.history.replaceState(null, '', '/login');
      }
    } else {
      if (path === '/login' || path === '/register' || path === '/') {
        window.history.replaceState(null, '', '/dashboard');
      }
    }
  }, [user, authLoading]);

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
      <div className="min-h-screen bg-[#110F15] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#342D3D] border-t-[#FF4696]" />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#110F15]" />}>
        <AuthLayout />
      </Suspense>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#110F15] text-[#F5F3F7] font-sans selection:bg-[#FF4696]/30 selection:text-[#F5F3F7]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-[env(safe-area-inset-bottom)] lg:pb-0">
        <Navbar />
        <main className="flex-1 pb-[88px] lg:pb-10 pt-5 px-4 sm:px-6 lg:px-8 relative w-full max-w-[1440px] mx-auto">
          <Suspense fallback={<PageLoader />}>{renderActiveTab()}</Suspense>
        </main>
      </div>
      <BottomNavigation />
      <Suspense fallback={null}>
        <LevelUpModal />
        <OnboardingTour />
      </Suspense>
      <ToastContainer />
    </div>
  );
}
