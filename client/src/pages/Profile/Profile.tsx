import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Lock, Clock, Target, Calendar, CheckCircle2, XCircle, Flame, 
  Gamepad2, Trophy, Star, History, Puzzle, TrendingUp, Medal,
  Activity, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { calculateProgress, type AchievementProgress } from '../../services/achievementService';
import { useGameHistoryStore } from '../../store/useGameHistoryStore';
import { Button } from '../../components/ui/Button';
import { getLevelProgress, getXpForNextLevel, getXpForCurrentLevel } from '../../services/xpService';
import { BADGES, TITLES, setActiveTitle } from '../../services/rewardService';

// Constants
const ACTIVE_GAMES = [
  'number', 'word', 'memory', 'sliding', 'logic', 'pattern', 
  'arrow path', 'maze escape', 'laser mirror', 'pipe connect', 
  'color path', 'block escape', 'number path', 'rotating tiles', 
  'word grid'
];

export const Profile = () => {
  const { profile } = useAuthStore();
  const { games: allGames, fetchHistory, isLoaded } = useGameHistoryStore();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('All');
  const [showTitleSelect, setShowTitleSelect] = useState(false);
  const [settingTitle, setSettingTitle] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (profile) {
        try {
          await fetchHistory(profile.uid, 200);
          const achData = await calculateProgress(profile.uid, profile);
          setAchievements(achData);
        } catch (err) {
          console.error("Failed to load profile data", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfileData();
  }, [profile, fetchHistory]);

  // Derived Data
  const {
    puzzleStats,
    xpByDay,
    maxDailyXp,
    fastestCompletion,
    mostXpInGame
  } = useMemo(() => {
    if (!profile) return { puzzleStats: {}, xpByDay: [], maxDailyXp: 0, fastestCompletion: null, mostXpInGame: null };

    const stats: Record<string, any> = {};
    const days: Record<string, number> = {};
    let fastest: any = null;
    let mostXp: any = null;

    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      days[dateStr] = 0;
    }

    allGames.forEach(game => {
      // Game Stats
      const type = (game.puzzleType || 'unknown').toLowerCase();
      if (!stats[type]) {
        stats[type] = { played: 0, won: 0, bestScore: 0, bestTime: Infinity, lastPlayed: null };
      }
      
      stats[type].played += 1;
      if (game.status === 'COMPLETED') {
        stats[type].won += 1;
      }
      if (game.score && game.score > stats[type].bestScore) {
        stats[type].bestScore = game.score;
      }
      if (game.status === 'COMPLETED' && game.timeTaken && game.timeTaken < stats[type].bestTime) {
        stats[type].bestTime = game.timeTaken;
      }
      
      const gameDate = game.createdAt ? (game.createdAt.toDate ? game.createdAt.toDate() : new Date(game.createdAt)) : new Date();
      
      if (!stats[type].lastPlayed || gameDate > stats[type].lastPlayed) {
        stats[type].lastPlayed = gameDate;
      }

      // 7-day Activity
      const dateStr = gameDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (days[dateStr] !== undefined) {
        days[dateStr] += (game.xpEarned || 0);
      }

      // Personal Records (Local)
      if (game.status === 'COMPLETED' && game.timeTaken > 0) {
        if (!fastest || game.timeTaken < fastest.timeTaken) {
          fastest = game;
        }
      }
      if (!mostXp || (game.xpEarned || 0) > (mostXp.xpEarned || 0)) {
        mostXp = game;
      }
    });

    const xpByDayArr = Object.keys(days).map(date => ({ date, xp: days[date] }));
    const maxXp = Math.max(...xpByDayArr.map(d => d.xp), 10);

    return { puzzleStats: stats, xpByDay: xpByDayArr, maxDailyXp: maxXp, fastestCompletion: fastest, mostXpInGame: mostXp };
  }, [allGames, profile]);

  if (!profile) return null;

  const xpPercentage = getLevelProgress(profile.xp);
  const currentLevelXp = getXpForCurrentLevel(profile.level);
  const nextLevelXp = getXpForNextLevel(profile.level);
  const xpIntoLevel = profile.xp - currentLevelXp;

  const formatTime = (seconds?: number) => {
    if (!seconds || seconds === Infinity) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getMemberSince = () => {
    if (!profile.createdAt) return 'Recently';
    const date = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const unlockedAchCount = achievements.filter(a => a.userAchievement?.unlocked).length;
  const totalAchCount = achievements.length;
  const achProgressPercent = totalAchCount > 0 ? (unlockedAchCount / totalAchCount) * 100 : 0;

  const FILTERS = ['All', 'Daily', 'Weekly', ...ACTIVE_GAMES.map(g => g.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))];
  
  const filteredHistory = historyFilter === 'All' 
    ? allGames 
    : historyFilter === 'Daily'
    ? allGames.filter(game => game.isDailyPuzzle)
    : historyFilter === 'Weekly'
    ? allGames.filter(game => game.isWeeklyChallenge)
    : allGames.filter(game => (game.puzzleType || '').toLowerCase() === historyFilter.toLowerCase());

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  const handleSetTitle = async (titleId: string | null) => {
    setSettingTitle(true);
    try {
      await setActiveTitle(titleId);
      // Let global sync happen or just rely on page refresh
      window.location.reload(); 
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 px-4 sm:px-6">
      
      {/* 1. Profile Header & Progression */}
      <Card className="bg-[#151B23] border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-background via-surface to-[#1F2937] relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
        </div>
        <CardContent className="p-6 pt-0 relative sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12 mb-4 sm:mb-0">
            <div className="w-32 h-32 rounded-2xl bg-surface border-4 border-background flex items-center justify-center text-5xl text-primary font-black shadow-xl shrink-0 overflow-hidden relative group">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (profile.displayName || profile.username || 'P').charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="text-center sm:text-left relative">
              <h1 className="text-3xl font-black text-textMain tracking-tight">{profile.displayName || 'Player'}</h1>
              <p className="text-primary font-bold">@{profile.username}</p>
              
              {/* Titles System */}
              <div className="mt-1 relative">
                {profile.activeTitleId ? (
                  <button onClick={() => setShowTitleSelect(!showTitleSelect)} className="text-xs font-bold bg-accent/20 text-accent px-2 py-1 rounded border border-accent/30 hover:bg-accent/30 transition-colors uppercase tracking-wider">
                    {TITLES.find(t => t.id === profile.activeTitleId)?.name || 'Unknown Title'}
                  </button>
                ) : (
                  <button onClick={() => setShowTitleSelect(!showTitleSelect)} className="text-xs font-bold bg-surface text-textMuted px-2 py-1 rounded border border-border hover:border-primary/50 transition-colors uppercase tracking-wider">
                    Select Title
                  </button>
                )}
                
                {showTitleSelect && (
                  <div className="absolute top-full mt-2 left-0 w-64 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-border bg-surface flex justify-between items-center">
                      <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Unlocked Titles</span>
                      <button onClick={() => setShowTitleSelect(false)} className="text-textMuted hover:text-textMain"><XCircle className="w-4 h-4"/></button>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      <button 
                        disabled={settingTitle}
                        onClick={() => handleSetTitle(null)}
                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md hover:bg-surface transition-colors ${!profile.activeTitleId ? 'bg-primary/10 text-primary' : 'text-textMain'}`}
                      >
                        None
                      </button>
                      {(profile.unlockedTitles || []).map(tId => {
                        const title = TITLES.find(t => t.id === tId);
                        if (!title) return null;
                        return (
                          <button
                            key={tId}
                            disabled={settingTitle}
                            onClick={() => handleSetTitle(title.id)}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md hover:bg-surface transition-colors ${profile.activeTitleId === title.id ? 'bg-primary/10 text-primary' : 'text-textMain'}`}
                          >
                            <span className={title.rarity === 'Legendary' ? 'text-accent' : title.rarity === 'Epic' ? 'text-secondary' : 'text-textMain'}>
                              {title.name}
                            </span>
                          </button>
                        );
                      })}
                      {(!profile.unlockedTitles || profile.unlockedTitles.length === 0) && (
                        <p className="px-3 py-4 text-center text-xs text-textMuted">Keep playing to unlock titles!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 justify-center sm:justify-start mt-2 text-sm text-textMuted font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Joined {getMemberSince()}</span>
              </div>
            </div>
          </div>
          
          {/* Main Progression */}
          <div className="w-full sm:max-w-md bg-background rounded-xl p-4 border border-border shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-black text-textMain flex items-center gap-1.5">
                <Star className="w-4 h-4 text-accent fill-accent" /> 
                LEVEL {profile.level || 1}
              </span>
              <span className="text-textMuted font-semibold">
                <span className="text-textMain">{xpIntoLevel.toLocaleString()}</span> / {(nextLevelXp - currentLevelXp).toLocaleString()} XP
              </span>
            </div>
            <div className="w-full bg-surface rounded-full h-3 border border-border overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.max(2, xpPercentage)}%` }}
              />
            </div>
            <p className="text-xs text-textMuted mt-2 text-center sm:text-left font-medium">
              {(nextLevelXp - profile.xp).toLocaleString()} XP to Level {profile.level + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Records */}
        <div className="space-y-6">
          
          {/* Core Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#151B23] p-4 rounded-xl border border-border flex flex-col">
              <Gamepad2 className="w-5 h-5 text-textMuted mb-2" />
              <span className="text-2xl font-black text-textMain">{profile.totalGames || 0}</span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Games Played</span>
            </div>
            <div className="bg-[#151B23] p-4 rounded-xl border border-border flex flex-col">
              <CheckCircle2 className="w-5 h-5 text-success mb-2" />
              <span className="text-2xl font-black text-success">{profile.totalWins || 0}</span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Completed</span>
            </div>
            <div className="bg-[#151B23] p-4 rounded-xl border border-border flex flex-col">
              <Flame className="w-5 h-5 text-accent mb-2" />
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-textMain">{profile.currentStreak || 0}</span>
                <span className="text-sm font-bold text-textMuted">days</span>
              </div>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Current Streak</span>
            </div>
            <div className="bg-[#151B23] p-4 rounded-xl border border-border flex flex-col">
              <Star className="w-5 h-5 text-primary mb-2" />
              <span className="text-2xl font-black text-primary">{profile.xp?.toLocaleString() || 0}</span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Total XP</span>
            </div>
          </div>

          {/* Achievement Summary */}
          <Card className="bg-[#151B23] border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center justify-between">
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-accent"/> Achievements</span>
                <Link to="/achievements" className="text-primary hover:text-primary-hover transition-colors flex items-center gap-1">View <ArrowRight className="w-3 h-3"/></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-black text-textMain">{unlockedAchCount} / {totalAchCount} unlocked</span>
                <span className="text-xs font-black text-textMuted">{Math.round(achProgressPercent)}%</span>
              </div>
              <div className="w-full bg-surface rounded-full h-2.5 border border-border overflow-hidden">
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${achProgressPercent}%` }}
                />
              </div>
              {unlockedAchCount === 0 && (
                <p className="text-xs text-textMuted mt-3 font-medium">Keep playing to unlock your first achievement.</p>
              )}
            </CardContent>
          </Card>

          {/* Personal Records */}
          <Card className="bg-[#151B23] border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                <Medal className="w-4 h-4 text-secondary"/> Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-textMuted">Highest Score</span>
                <span className="font-black text-secondary">{profile.bestScore ? profile.bestScore.toLocaleString() : 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-textMuted">Fastest Completion</span>
                <span className="font-black text-textMain">{formatTime(profile.bestTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-textMuted">Longest Streak</span>
                <span className="font-black text-accent">{profile.longestStreak || 0} days</span>
              </div>
              {fastestCompletion && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-textMuted">Fastest Game</span>
                  <span className="font-bold text-textMain capitalize text-xs bg-surface px-2 py-0.5 rounded border border-border">
                    {fastestCompletion.puzzleType} ({formatTime(fastestCompletion.timeTaken)})
                  </span>
                </div>
              )}
              {mostXpInGame && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-textMuted">Most XP in Game</span>
                  <span className="font-black text-primary">+{mostXpInGame.xpEarned} XP</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badge Collection */}
          <Card className="bg-[#151B23] border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                <Medal className="w-4 h-4 text-primary"/> Badge Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-4 gap-3">
              {BADGES.map((badge) => {
                const unlocked = (profile.unlockedBadges || []).includes(badge.id);
                return (
                  <div key={badge.id} className="group relative flex justify-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${unlocked ? 'bg-surface border-primary opacity-100 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'bg-background border-border opacity-40 grayscale'}`}>
                      {badge.icon}
                    </div>
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-background border border-border p-2 rounded-lg shadow-xl z-50 pointer-events-none transition-opacity">
                      <p className="font-bold text-textMain text-sm text-center">{badge.name}</p>
                      <p className="text-xs text-textMuted text-center mt-1">{badge.description}</p>
                      <p className={`text-[10px] font-black uppercase text-center mt-2 ${badge.rarity === 'Legendary' ? 'text-accent' : badge.rarity === 'Epic' ? 'text-secondary' : 'text-primary'}`}>
                        {badge.rarity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Charts, Game Perf, History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Performance Over Time */}
          <Card className="bg-[#151B23] border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary"/> Activity (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {allGames.length === 0 ? (
                <div className="text-center py-8 text-textMuted">
                  <p className="font-medium">Not enough activity yet.</p>
                  <p className="text-sm mt-1">Play a few games to see your chart!</p>
                </div>
              ) : (
                <div className="h-48 flex items-end gap-2 justify-between px-2">
                  {xpByDay.map((day, i) => {
                    const heightPercent = maxDailyXp > 0 ? (day.xp / maxDailyXp) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-surface border border-border text-xs font-bold text-textMain px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {day.xp} XP
                        </div>
                        {/* Bar */}
                        <div className="w-full max-w-[40px] bg-surface border border-border rounded-t-md relative overflow-hidden h-full flex items-end">
                          <div 
                            className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm"
                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                          />
                        </div>
                        {/* Label */}
                        <span className="text-[10px] font-bold text-textMuted uppercase whitespace-nowrap">{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Performance */}
          <Card className="bg-[#151B23] border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                <Target className="w-4 h-4 text-secondary"/> Game Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {Object.keys(puzzleStats).length === 0 ? (
                <div className="text-center py-6 text-textMuted">
                  <p className="font-medium">No game performance data yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.keys(puzzleStats).sort((a,b) => puzzleStats[b].played - puzzleStats[a].played).map(type => {
                    const stat = puzzleStats[type];
                    return (
                      <div key={type} className="bg-background border border-border rounded-xl p-3 flex flex-col justify-between hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-black text-textMain capitalize text-sm">{type}</span>
                          <span className="text-[10px] font-bold bg-surface text-textMuted px-2 py-0.5 rounded border border-border">
                            {stat.played} PLAYS
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-textMuted block text-[10px] uppercase font-bold">Best Score</span>
                            <span className="font-black text-secondary">{stat.bestScore > 0 ? stat.bestScore.toLocaleString() : '-'}</span>
                          </div>
                          <div>
                            <span className="text-textMuted block text-[10px] uppercase font-bold">Best Time</span>
                            <span className="font-black text-textMain">{stat.bestTime < Infinity ? formatTime(stat.bestTime) : '-'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-[#151B23] border-border h-full">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-border">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                <History className="w-4 h-4 text-primary"/> Recent Activity
              </CardTitle>
              <select 
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="bg-surface border border-border rounded-lg py-1.5 px-3 text-textMain text-xs font-bold focus:outline-none focus-visible:border-primary/50 cursor-pointer"
              >
                {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </CardHeader>
            <CardContent className="pt-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-textMuted bg-background border border-border rounded-xl">
                  <p className="font-medium mb-4">No recent activity found.</p>
                  <Link to="/puzzles" className="inline-block">
                    <Button variant="primary" size="sm">Play a Puzzle</Button>
                  </Link>
                </div>
              ) : (
                <div className="relative space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar sm:pl-2">
                  {/* Vertical Timeline Line (Desktop only) */}
                  <div className="absolute left-[13px] top-4 bottom-4 w-px bg-border z-0 hidden sm:block"></div>
                  
                  {filteredHistory.slice(0, 20).map((game, i) => {
                    const date = game.createdAt ? (game.createdAt.toDate ? game.createdAt.toDate() : new Date(game.createdAt)) : new Date();
                    return (
                      <div key={game.id} className="relative z-10 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        
                        {/* Timeline Dot */}
                        <div className={`hidden sm:flex mt-3 w-[11px] h-[11px] rounded-full ring-4 ring-[#151B23] shrink-0 ${game.status === 'COMPLETED' ? 'bg-success' : 'bg-error'}`} />
                        
                        {/* Timeline Card */}
                        <div className="w-full bg-background p-3 rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-primary/30 transition-colors shadow-sm">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className={`p-1.5 rounded-lg shrink-0 sm:hidden ${game.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                              {game.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-bold text-textMain text-sm capitalize">
                                {game.isWeeklyChallenge ? 'Weekly ' : game.isDailyPuzzle ? 'Daily ' : ''}{game.puzzleType}
                              </p>
                              <p className="text-[10px] text-textMuted font-medium mt-0.5">
                                {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 items-center w-full sm:w-auto border-t border-border sm:border-0 pt-2 sm:pt-0">
                            <div className="flex-1 sm:flex-none text-left sm:text-right">
                              <span className="text-[9px] text-textMuted uppercase font-bold sm:hidden block mb-0.5">Score / Time</span>
                              {game.score > 0 ? (
                                <p className="font-black text-secondary text-xs">{game.score.toLocaleString()}</p>
                              ) : (
                                <p className="text-xs font-bold text-textMain flex items-center sm:justify-end gap-1"><Clock className="w-3 h-3"/> {formatTime(game.timeTaken || game.duration)}</p>
                              )}
                            </div>
                            <div className="flex-1 sm:flex-none text-right">
                              <span className="text-[9px] text-textMuted uppercase font-bold sm:hidden block mb-0.5">XP</span>
                              <p className="text-xs font-black text-primary">+{game.xpEarned} XP</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredHistory.length > 20 && (
                    <div className="text-center pt-2">
                      <p className="text-xs font-semibold text-textMuted">Showing 20 most recent games</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
