import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { XPProgress } from '../../components/dashboard/XPProgress';
import { 
  Gamepad2, 
  Trophy, 
  Flame, 
  Star,
  Puzzle,
  ArrowRight,
  LayoutGrid,
  Route,
  Lightbulb,
  Play,
  Users
} from 'lucide-react';
import { DailyRewardCard } from '../../components/dashboard/DailyRewardCard';
import { DailyPuzzleCard } from '../../components/dashboard/DailyPuzzleCard';
import { getAllRecentGames } from '../../services/gameResultService';
import { getRecommendation, type Recommendation } from '../../services/recommendationService';
import { usePuzzleStore } from '../../store/usePuzzleStore';
import { useFavorites } from '../../store/useFavorites';
import { useSocialStore } from '../../store/useSocialStore';
import { useGameHistoryStore } from '../../store/useGameHistoryStore';
import { MissionsWidget } from '../../components/dashboard/MissionsWidget';

export const Dashboard = () => {
  const { profile } = useAuthStore();
  const { activePuzzles } = usePuzzleStore();
  const { games: allGames, fetchHistory } = useGameHistoryStore();

  const username = profile?.displayName || 'Player';
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const totalGames = profile?.totalGames || 0;
  const bestScore = profile?.bestScore || 0;
  const currentStreak = profile?.currentStreak || 0;

  const [unlockedCount, setUnlockedCount] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recentCount, setRecentCount] = useState(0);
  const { favoriteIds } = useFavorites();
  const { requests } = useSocialStore();
  const friendsCount = requests.filter(r => r.status === 'accepted').length;
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.uid) {
      fetchHistory(profile.uid, 200);
      
      import('../../services/achievementService').then(({ getUserAchievements }) => {
        getUserAchievements(profile.uid).then(achs => {
          setUnlockedCount(achs.filter(a => a.unlocked).length);
        });
      });
    }
  }, [profile?.uid, fetchHistory]);

  useEffect(() => {
    if (allGames.length > 0) {
      const recentGames = allGames.slice(0, 50);
      setRecentCount(new Set(recentGames.map(g => g.puzzleType)).size);
      if (activePuzzles.length > 0) {
        const rec = getRecommendation(profile, recentGames, activePuzzles);
        setRecommendation(rec);
      }
    } else if (activePuzzles.length > 0 && profile) {
       // Fallback for brand new users
       const rec = getRecommendation(profile, [], activePuzzles);
       setRecommendation(rec);
    }
  }, [allGames, activePuzzles, profile]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-8">
      
      {/* Header */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-surface p-5 lg:p-6 rounded-2xl border border-border shadow-sm relative">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-textMain tracking-tight mb-2">
            Welcome back, <span className="text-primary">{username}</span>
          </h1>
          <p className="text-textMuted text-lg">Ready to challenge your mind today?</p>
          {unlockedCount !== null && (
            <div className="mt-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="text-sm text-textMuted font-medium">{unlockedCount} achievements unlocked</span>
              <Link to="/achievements" className="text-sm text-primary font-bold hover:text-accent transition-colors ml-2">
                View Achievements &rarr;
              </Link>
            </div>
          )}
        </div>
        <div className="w-full lg:w-[320px] shrink-0">
          <XPProgress level={level} xp={xp} />
        </div>
      </section>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Horizontal Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-textMuted font-medium text-sm">
              <Gamepad2 className="w-4 h-4 text-primary" /> Games Played
            </div>
            <div className="text-2xl font-bold text-textMain">{totalGames}</div>
          </div>
          
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-textMuted font-medium text-sm">
              <Trophy className="w-4 h-4 text-accent" /> Best Score
            </div>
            <div className="text-2xl font-bold text-textMain">{bestScore.toLocaleString()}</div>
          </div>
          
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-textMuted font-medium text-sm">
              <Flame className="w-4 h-4 text-accent" /> Current Streak
            </div>
            <div className="text-2xl font-bold text-textMain">{currentStreak} <span className="text-sm text-textMuted font-normal">Days</span></div>
          </div>
          
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-textMuted font-medium text-sm">
              <Star className="w-4 h-4 text-primary" /> Total XP
            </div>
            <div className="text-2xl font-bold text-textMain">{xp.toLocaleString()}</div>
          </div>

          <Link to="/friends" className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1 hover:border-primary/50 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-textMuted font-medium text-sm group-hover:text-primary transition-colors">
                <Users className="w-4 h-4 text-primary" /> Friends
              </div>
              <ArrowRight className="w-4 h-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-bold text-textMain">{friendsCount}</div>
          </Link>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="w-full min-w-0">
            <DailyPuzzleCard />
          </div>
          <div className="w-full min-w-0">
            <DailyRewardCard />
          </div>
          <div className="w-full min-w-0">
            <MissionsWidget />
          </div>
        </div>
        
        {/* Bottom Row: Puzzle Library & Next Challenge */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Unified Puzzles Entry Card */}
          <Link 
            to="/puzzles" 
            className="group flex flex-col md:flex-row items-center gap-6 bg-surface-elevated rounded-2xl border border-border hover:border-primary/40 transition-colors p-5 shadow-sm h-full"
          >
            <div className="w-full md:w-1/3 bg-surface rounded-xl border border-border p-4 flex items-center justify-center relative min-h-[140px]">
              <div className="flex justify-center -space-x-3 relative group-hover:-translate-y-1 transition-transform duration-200">
                <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-md -rotate-12 z-0 translate-y-2">
                  <Route className="w-4 h-4 text-accent" />
                </div>
                <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center shadow-md z-10 -translate-y-1">
                  <Puzzle className="w-5 h-5 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-md rotate-12 z-20 translate-y-2">
                  <LayoutGrid className="w-4 h-4 text-secondary" />
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Puzzle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-textMain tracking-tight">The Puzzle Library</h2>
              </div>
              <p className="text-textMuted text-sm font-medium mb-3">
                Challenge your mind with 16 different types of puzzles. Track progress, earn XP, and climb leaderboards.
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-4 mb-5 text-textMuted">
                <div className="text-xs font-bold bg-surface px-2 py-1 rounded border border-border flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-accent" /> {favoriteIds.length} Favorites
                </div>
                <div className="text-xs font-bold bg-surface px-2 py-1 rounded border border-border flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-primary" /> {recentCount} Recently Played
                </div>
              </div>

              <div className="inline-flex bg-surface group-hover:bg-primary text-textMain group-hover:text-white border border-border group-hover:border-primary font-medium py-2 px-4 rounded-lg shadow-sm transition-colors duration-200 items-center gap-2 text-sm">
                <span>Explore All</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Next Challenge */}
          <div className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-textMain tracking-tight">Next Challenge</h2>
            </div>
            
            {recommendation ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-surface rounded-xl border border-border p-6 text-center">
                  <h3 className="text-2xl font-bold text-textMain mb-1">{recommendation.title}</h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded bg-black/40 border border-white/5 ${
                      recommendation.difficulty === 'Easy' ? 'text-success' :
                      recommendation.difficulty === 'Medium' ? 'text-warning' :
                      recommendation.difficulty === 'Hard' ? 'text-error' : 'text-primary'
                    }`}>
                      {recommendation.difficulty}
                    </span>
                  </div>
                  <p className="text-textMuted text-sm font-medium mb-6">"{recommendation.reason}"</p>
                  
                  <button 
                    onClick={() => navigate(recommendation.route)}
                    className="inline-flex bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play Challenge
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-border border-dashed rounded-xl bg-surface/30">
                <p className="text-textMuted text-sm">Loading recommendation...</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

