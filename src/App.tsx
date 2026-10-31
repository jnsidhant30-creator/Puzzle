import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LevelUpModal } from './components/LevelUpModal';
import { DashboardPage } from './pages/DashboardPage';
import { GamesCatalogPage } from './pages/GamesCatalogPage';
import { GamePlayPage } from './pages/GamePlayPage';
import { DailyPuzzlePage } from './pages/DailyPuzzlePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { CommunityPuzzlesPage } from './pages/CommunityPuzzlesPage';
import { FriendsPage } from './pages/FriendsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { InsightsPage } from './pages/InsightsPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { GoalsPage } from './pages/GoalsPage';
import { ShowcasePage } from './pages/ShowcasePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { JourneyPage } from './pages/JourneyPage';
import { LearnPage } from './pages/LearnPage';
import { MasteryPage } from './pages/MasteryPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { ClubEventsPage } from './pages/ClubEventsPage';
import { ClubDiscussionsPage } from './pages/ClubDiscussionsPage';
import { ClubGuidesPage } from './pages/ClubGuidesPage';
import { onAuthStateChanged, auth, syncUserProfile, getChallenge2ById } from './services/firebase';
import { getRedirectResult } from 'firebase/auth';
import { ToastContainer } from './components/ToastContainer';
import { OnboardingTour } from './components/OnboardingTour';
import { AuthLayout } from './components/AuthLayout';
import { BottomNavigation } from './components/BottomNavigation';

export default function App() { 
  const { user, authLoading, activeTab, theme, setUser, setAuthLoading, playChallengeMatch, viewPuzzleGuide, viewMasteryDetail, setActiveTab } = useStore(); 
  const [targetShowcaseId, setTargetShowcaseId] = React.useState<string | undefined>(undefined); 
  
  useEffect(() => { 
    /* Set initial theme class */
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-neon'); 
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const initAuth = async () => {
      let isSyncing = false;
      let redirectProcessed = false;

      // Step 1: Await getRedirectResult first to consume any incoming redirect credentials
      try {
        const redirectResult = await getRedirectResult(auth);
        redirectProcessed = true;
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
        redirectProcessed = true;
        sessionStorage.removeItem('pv_auth_redirect_in_progress');
        console.error("Google Auth Redirect Error:", err);
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
            // Only conclude logged out if no redirect operation is pending
            const redirectPending = sessionStorage.getItem('pv_auth_redirect_in_progress') === '1';
            if (!redirectPending && isMounted) {
              setUser(null, false);
            }
          }
        } catch (err) {
          console.error("Auth state change error:", err);
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
        if (ch) { playChallengeMatch(ch.id, ch.puzzleType, ch.difficulty, ch.seed); } 
        else { setActiveTab('challenges'); } 
      }); 
    } else if (hash.startsWith('#showcase=')) { 
      const showcaseId = hash.replace('#showcase=', ''); 
      if (showcaseId) { setTargetShowcaseId(showcaseId); setActiveTab('showcase'); } 
    } else if (hash.startsWith('#learn=')) { 
      const pType = hash.replace('#learn=', '') as any; 
      if (pType) { viewPuzzleGuide(pType); } 
      else { setActiveTab('learn'); } 
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
  }, [theme]); /* URL-based routing enforcement for auth */
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
      case 'dashboard': return <DashboardPage />; 
      case 'journey': return <JourneyPage />; 
      case 'mastery': 
      case 'mastery_practice': return <MasteryPage />; 
      case 'clubs': return <ClubsPage />; 
      case 'club_detail': return <ClubDetailPage />; 
      case 'club_events': return <ClubEventsPage />; 
      case 'club_discussions': return <ClubDiscussionsPage />; 
      case 'club_guides': return <ClubGuidesPage />; 
      case 'games': return <GamesCatalogPage />; 
      case 'learn': return <LearnPage />; 
      case 'game_play': return <GamePlayPage />; 
      case 'challenges': return <ChallengesPage />; 
      case 'goals': return <GoalsPage />; 
      case 'showcase': return <ShowcasePage targetUserId={targetShowcaseId} />; 
      case 'collections': return <CollectionsPage />; 
      case 'collection_detail': return <CollectionDetailPage />; 
      case 'daily': return <DailyPuzzlePage />; 
      case 'leaderboard': return <LeaderboardPage />; 
      case 'achievements': return <AchievementsPage />; 
      case 'community': return <CommunityPuzzlesPage />; 
      case 'friends': return <FriendsPage />; 
      case 'admin': return <AdminPage />; 
      case 'profile': return <ProfilePage />; 
      case 'events': return <EventsPage />; 
      case 'event_detail': return <EventDetailPage />; 
      case 'insights': return <InsightsPage />; 
      default: return <DashboardPage />; 
    } 
  }; 
  
  if (authLoading) { 
    return ( 
      <div className="min-h-screen bg-gradient-premium flex items-center justify-center"> 
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pv-dragon-fruit"></div> 
      </div> 
    ); 
  } 
  
  if (!user) { 
    return <AuthLayout />; 
  } 
  
  return ( 
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-gradient-premium text-white font-sans selection:bg-pv-dragon-fruit selection:text-pv-bg-primary"> 
      <Sidebar /> 
      <div className="flex-1 flex flex-col min-w-0 pb-[env(safe-area-inset-bottom)] lg:pb-0"> 
        <Navbar /> 
        <main className="flex-1 pb-[80px] lg:pb-8 pt-4 px-2 sm:px-4 lg:px-8 relative w-full max-w-[1400px] mx-auto"> 
          {renderActiveTab()} 
        </main> 
      </div> 
      <BottomNavigation /> 
      <LevelUpModal /> 
      <ToastContainer /> 
      <OnboardingTour /> 
    </div> 
  );
}
