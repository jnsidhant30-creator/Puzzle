import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { usePuzzleStore } from './store/usePuzzleStore';
import { useFavorites } from './store/useFavorites';
import { useSocialStore } from './store/useSocialStore';
import { useGameHistoryStore } from './store/useGameHistoryStore';
import { PublicRoute, ProtectedRoute } from './components/common/AuthRoutes';
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { GameFocusLayout } from './layouts/GameFocusLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { InitPuzzles as AdminInitPuzzles } from './pages/admin/InitPuzzles';
import { ForgotPassword, ResetPassword } from './pages/Auth/ForgotReset';

// Tournaments & Community
const TournamentsList = React.lazy(() => import('./pages/Tournaments/TournamentsList').then(m => ({ default: m.TournamentsList })));
const TournamentDetails = React.lazy(() => import('./pages/Tournaments/TournamentDetails').then(m => ({ default: m.TournamentDetails })));
const CommunityPuzzlesList = React.lazy(() => import('./pages/Community/CommunityPuzzlesList').then(m => ({ default: m.CommunityPuzzlesList })));
const PuzzleCreator = React.lazy(() => import('./pages/Community/PuzzleCreator').then(m => ({ default: m.PuzzleCreator })));
const CommunityPuzzleDetails = React.lazy(() => import('./pages/Community/CommunityPuzzleDetails').then(m => ({ default: m.CommunityPuzzleDetails })));
const Seasons = React.lazy(() => import('./pages/Seasons/Seasons').then(m => ({ default: m.Seasons })));


import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { ConnectionIndicator } from './components/common/ConnectionIndicator';
import { LiveAnnouncerProvider } from './components/common/LiveAnnouncer';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Play = React.lazy(() => import('./pages/Play').then(m => ({ default: m.Play })));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard/Leaderboard').then(m => ({ default: m.Leaderboard })));
const DailyPuzzle = React.lazy(() => import('./pages/DailyPuzzle/DailyPuzzle').then(m => ({ default: m.DailyPuzzle })));
const Profile = React.lazy(() => import('./pages/Profile/Profile').then(m => ({ default: m.Profile })));
const Puzzles = React.lazy(() => import('./pages/Puzzles/Puzzles').then(m => ({ default: m.Puzzles })));
const Competition = React.lazy(() => import('./pages/Competition/Competition').then(m => ({ default: m.Competition })));
const GamePlaceholder = React.lazy(() => import('./pages/GamePlaceholder').then(m => ({ default: m.GamePlaceholder })));
const Achievements = React.lazy(() => import('./pages/Achievements/Achievements').then(m => ({ default: m.Achievements })));
const Settings = React.lazy(() => import('./pages/Settings/Settings').then(m => ({ default: m.Settings })));
const Notifications = React.lazy(() => import('./pages/Notifications/Notifications').then(m => ({ default: m.Notifications })));
const GameResolver = React.lazy(() => import('./pages/GameResolver').then(m => ({ default: m.GameResolver })));
const ChallengeResolver = React.lazy(() => import('./pages/ChallengeResolver').then(m => ({ default: m.ChallengeResolver })));
const Friends = React.lazy(() => import('./pages/Friends/Friends').then(m => ({ default: m.Friends })));
const Missions = React.lazy(() => import('./pages/Missions/Missions').then(m => ({ default: m.Missions })));
const BattleDashboard = React.lazy(() => import('./pages/Battle/BattleDashboard').then(m => ({ default: m.BattleDashboard })));
const BattleResolver = React.lazy(() => import('./pages/Battle/BattleResolver').then(m => ({ default: m.BattleResolver })));

// Lazy load admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminUserDetails = React.lazy(() => import('./pages/admin/AdminUserDetails').then(m => ({ default: m.AdminUserDetails })));
const AdminPuzzles = React.lazy(() => import('./pages/admin/AdminPuzzles').then(m => ({ default: m.AdminPuzzles })));
const AdminPuzzleEdit = React.lazy(() => import('./pages/admin/AdminPuzzleEdit').then(m => ({ default: m.AdminPuzzleEdit })));
const AdminDailyPuzzles = React.lazy(() => import('./pages/admin/AdminDailyPuzzles').then(m => ({ default: m.AdminDailyPuzzles })));
const AdminWeeklyChallenges = React.lazy(() => import('./pages/admin/AdminWeeklyChallenges').then(m => ({ default: m.AdminWeeklyChallenges })));
const AdminAchievements = React.lazy(() => import('./pages/admin/AdminAchievements').then(m => ({ default: m.AdminAchievements })));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminNotifications = React.lazy(() => import('./pages/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const AdminAuditLogs = React.lazy(() => import('./pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminSystem = React.lazy(() => import('./pages/admin/AdminSystem').then(m => ({ default: m.AdminSystem })));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));


// Lazy load games
const NumberPuzzle = React.lazy(() => import('./games/number/NumberPuzzle').then(m => ({ default: m.NumberPuzzle })));
const WordPuzzle = React.lazy(() => import('./games/word/WordPuzzle').then(m => ({ default: m.WordPuzzle })));
const MemoryPuzzle = React.lazy(() => import('./games/memory/MemoryPuzzle').then(m => ({ default: m.MemoryPuzzle })));
const SlidingPuzzle = React.lazy(() => import('./games/sliding/SlidingPuzzle').then(m => ({ default: m.SlidingPuzzle })));
const LogicPuzzle = React.lazy(() => import('./games/logic/LogicPuzzle').then(m => ({ default: m.LogicPuzzle })));
const PatternPuzzle = React.lazy(() => import('./games/pattern/PatternPuzzle').then(m => ({ default: m.PatternPuzzle })));
const PipeGame = React.lazy(() => import('./games/pipe/PipeGame').then(m => ({ default: m.PipeGame })));
const ColorPathGame = React.lazy(() => import('./games/color/ColorPathGame').then(m => ({ default: m.ColorPathGame })));
const BlockEscapeGame = React.lazy(() => import('./games/block/BlockEscapeGame').then(m => ({ default: m.BlockEscapeGame })));
const NumberPathGame = React.lazy(() => import('./games/numberPath/NumberPathGame').then(m => ({ default: m.NumberPathGame })));
const RotatingTilesGame = React.lazy(() => import('./games/rotate/RotatingTilesGame').then(m => ({ default: m.RotatingTilesGame })));
const WordGridGame = React.lazy(() => import('./games/wordGrid/WordGridGame').then(m => ({ default: m.WordGridGame })));
const ChallengeGame = React.lazy(() => import('./games/challenge/ChallengeGame').then(m => ({ default: m.ChallengeGame })));
const ArrowPathGame = React.lazy(() => import('./games/arrow/ArrowPathGame').then(m => ({ default: m.ArrowPathGame })));
const MazeEscapeGame = React.lazy(() => import('./games/maze/MazeEscapeGame').then(m => ({ default: m.MazeEscapeGame })));
const LaserMirrorGame = React.lazy(() => import('./games/laser/LaserMirrorGame').then(m => ({ default: m.LaserMirrorGame })));

const FallbackLoader = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const { initAuthListener, isInitializing, user } = useAuthStore();
  const initPuzzles = usePuzzleStore(state => state.init);
  const { initFavoritesListener, clearFavorites } = useFavorites();

  useEffect(() => {
    const unsubscribeAuth = initAuthListener();
    const unsubscribePuzzles = initPuzzles();
    return () => {
      unsubscribeAuth();
      unsubscribePuzzles();
    };
  }, [initAuthListener, initPuzzles]);

  useEffect(() => {
    let unsubscribeFavorites: (() => void) | undefined;
    let unsubscribeSocial: (() => void) | undefined;
    if (user?.uid) {
      unsubscribeFavorites = initFavoritesListener(user.uid);
      unsubscribeSocial = useSocialStore.getState().initSocialListener(user.uid);
    } else {
      clearFavorites();
      useSocialStore.getState().clearSocial();
      useGameHistoryStore.getState().clearHistory();
    }
    return () => {
      if (unsubscribeFavorites) unsubscribeFavorites();
      if (unsubscribeSocial) unsubscribeSocial();
    };
  }, [user?.uid, initFavoritesListener, clearFavorites]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LiveAnnouncerProvider>
        <BrowserRouter>
          <OfflineBanner />
          <PWAInstallPrompt />
          <ConnectionIndicator />

          <Suspense fallback={<FallbackLoader />}>
            <Routes>
          {/* Main layout (Navbar + Footer) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
          </Route>

          {/* Authenticated Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            {/* Immersive Fullscreen Game Layout */}
            <Route element={<GameFocusLayout />}>
              <Route path="/game-fullscreen/:id" element={<GameResolver />} />
              <Route path="/game/number" element={<NumberPuzzle />} />
              <Route path="/game/word" element={<WordPuzzle />} />
              <Route path="/game/memory" element={<MemoryPuzzle />} />
              <Route path="/game/sliding" element={<SlidingPuzzle />} />
              <Route path="/game/logic" element={<LogicPuzzle />} />
              <Route path="/game/pattern" element={<PatternPuzzle />} />
              <Route path="/game/pipe" element={<PipeGame />} />
              <Route path="/game/color" element={<ColorPathGame />} />
              <Route path="/game/block" element={<BlockEscapeGame />} />
              <Route path="/game/number-path" element={<NumberPathGame />} />
              <Route path="/game/rotate" element={<RotatingTilesGame />} />
              <Route path="/game/word-grid" element={<WordGridGame />} />
              <Route path="/game/challenge" element={<ChallengeGame />} />
              <Route path="/game/arrow" element={<ArrowPathGame />} />
              <Route path="/game/maze" element={<MazeEscapeGame />} />
              <Route path="/game/laser" element={<LaserMirrorGame />} />
              <Route path="/challenge" element={<ChallengeGame />} />
              <Route path="/game/:type" element={<GamePlaceholder />} />
              <Route path="/game" element={<Play />} />
              <Route path="/play" element={<Play />} />
              <Route path="/battle/:battleId" element={<BattleResolver />} />
            </Route>

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/puzzles" element={<Puzzles />} />
              <Route path="/competition" element={<Competition />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/seasons" element={<Seasons />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/daily-puzzle" element={<DailyPuzzle />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/battle" element={<BattleDashboard />} />
              <Route path="/tournaments" element={<TournamentsList />} />
              <Route path="/tournaments/:id" element={<TournamentDetails />} />
              <Route path="/community" element={<CommunityPuzzlesList />} />
              <Route path="/community/:id" element={<CommunityPuzzleDetails />} />
              <Route path="/create-puzzle" element={<PuzzleCreator />} />
            </Route>

            {/* Authenticated Admin Layout */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/players" element={<AdminUsers />} />
                <Route path="/admin/players/:uid" element={<AdminUserDetails />} />
                <Route path="/admin/puzzles" element={<AdminPuzzles />} />
                <Route path="/admin/puzzles/new" element={<AdminPuzzleEdit />} />
                <Route path="/admin/puzzles/:id" element={<AdminPuzzleEdit />} />
                <Route path="/admin/init" element={<AdminInitPuzzles />} />
                <Route path="/admin/challenges/daily" element={<AdminDailyPuzzles />} />
                <Route path="/admin/competition" element={<AdminWeeklyChallenges />} />
                <Route path="/admin/achievements" element={<AdminAchievements />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                <Route path="/admin/system" element={<AdminSystem />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Route>

          {/* Auth Layout (Centered, no navbar) */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
          </Route>
          
          {/* Public Challenge Route */}
          <Route path="/challenge/:challengeId" element={<ChallengeResolver />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LiveAnnouncerProvider>
    </ErrorBoundary>
  );
}

export default App;
