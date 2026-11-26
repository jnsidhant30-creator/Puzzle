import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';
import { getRecommendedPuzzles } from '../services/recommendation';
import { fetchUserRecentGameSessions, fetchPersonalBestHistory } from '../services/firebase';
import { GameSession, PersonalBestHistoryItem, RadarSkillPoint, HeatmapDay } from '../types';
import { RadarChart } from '../components/RadarChart';
import { HeatmapChart } from '../components/HeatmapChart';
import { Brain, Flame, Play, BarChart2, Calendar, Lightbulb, ChevronRight, Target } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';
import { formatCount } from '../utils/format';

type DateFilter = '7days' | '30days' | '90days' | 'all';

export const InsightsPage: React.FC = () => {
  const { user, playGame } = useStore();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [pbHistory, setPbHistory] = useState<PersonalBestHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetchUserRecentGameSessions(user.uid, 100),
      fetchPersonalBestHistory(user.uid, undefined, 50),
    ])
      .then(([fetchedSessions, fetchedPbs]) => {
        setSessions(fetchedSessions);
        setPbHistory(fetchedPbs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  const filteredSessions = sessions.filter((s) => {
    if (dateFilter === 'all') return true;
    if (!s.createdAt) return true;
    const sessionDate = new Date(s.createdAt).getTime();
    const now = Date.now();
    const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
    return now - sessionDate <= days * 24 * 60 * 60 * 1000;
  });

  const totalGamesPlayed = filteredSessions.length > 0 ? filteredSessions.length : (user?.totalGames || 0);
  const winsCount = filteredSessions.length > 0 ? filteredSessions.filter((s) => s.won).length : (user?.totalWins || 0);
  const winRatePct = totalGamesPlayed > 0 ? Math.round((winsCount / totalGamesPlayed) * 100) : 0;

  const formatTimeSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '-';
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`;
  };

  const recommendedGames = getRecommendedPuzzles(user, 4);

  const categoryStats: Record<string, { total: number; wins: number }> = {
    Math: { total: 0, wins: 0 },
    Words: { total: 0, wins: 0 },
    Memory: { total: 0, wins: 0 },
    Logic: { total: 0, wins: 0 },
    'Spatial & Grid': { total: 0, wins: 0 },
    Challenge: { total: 0, wins: 0 },
  };

  filteredSessions.forEach((s) => {
    const puzzleInfo = PUZZLE_MODES.find((p) => p.id === s.puzzleType);
    if (puzzleInfo && categoryStats[puzzleInfo.category]) {
      categoryStats[puzzleInfo.category].total += 1;
      if (s.won) categoryStats[puzzleInfo.category].wins += 1;
    }
  });

  const diffCounts = {
    easy: filteredSessions.filter((s) => s.difficulty === 'easy').length,
    medium: filteredSessions.filter((s) => s.difficulty === 'medium').length,
    hard: filteredSessions.filter((s) => s.difficulty === 'hard').length,
  };

  const generateCoachTips = () => {
    const tips: string[] = [];
    if (totalGamesPlayed === 0) {
      tips.push('Complete 3 or more puzzles across different categories to generate personalized gameplay tips.');
      return tips;
    }
    if (winRatePct >= 75) {
      tips.push('High accuracy observed. Progressing to Hard difficulty yields higher score and mastery multipliers.');
    } else if (winRatePct < 50) {
      tips.push('Prioritize move accuracy over speed to increase completion rates and streak continuity.');
    }
    const unplayedCats = Object.entries(categoryStats).filter(([_, stat]) => stat.total === 0);
    if (unplayedCats.length > 0) {
      tips.push(`Play a puzzle in ${unplayedCats[0][0]} to balance cognitive coverage across your profile.`);
    } else {
      tips.push('Balanced coverage maintained across all categories. Continue daily sessions to strengthen skill depth.');
    }
    if ((user?.currentStreak || 1) >= 3) {
      tips.push(`Active streak of ${formatCount(user?.currentStreak || 0, 'day')}. Return daily to preserve multiplier bonuses.`);
    }
    return tips;
  };

  const coachTips = generateCoachTips();

  const radarSkills: RadarSkillPoint[] = [
    { category: 'Logic', score: Math.min(100, (categoryStats['Logic']?.wins || 0) * 20), label: 'Logic' },
    { category: 'Spatial', score: Math.min(100, (categoryStats['Spatial & Grid']?.wins || 0) * 20), label: 'Spatial' },
    { category: 'Math', score: Math.min(100, (categoryStats['Math']?.wins || 0) * 20), label: 'Math' },
    { category: 'Words', score: Math.min(100, (categoryStats['Words']?.wins || 0) * 20), label: 'Words' },
    { category: 'Memory', score: Math.min(100, (categoryStats['Memory']?.wins || 0) * 20), label: 'Memory' },
    {
      category: 'Speed',
      score: totalGamesPlayed > 0 ? Math.min(100, Math.round(winRatePct * 0.8 + 20)) : 0,
      label: 'Speed',
    },
  ];

  const sessionCountsByDate = filteredSessions.reduce<Record<string, number>>((acc, s) => {
    const sDate = s.createdAt ? s.createdAt.slice(0, 10) : '';
    if (sDate) {
      acc[sDate] = (acc[sDate] || 0) + 1;
    }
    return acc;
  }, {});

  const heatmapData: HeatmapDay[] = Array.from({ length: 35 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const count = sessionCountsByDate[dateStr] || 0;
    const level = (count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4) as 0 | 1 | 2 | 3 | 4;
    return { date: dateStr, count, level };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Performance Insights"
        description="Detailed play metrics, cognitive category breakdowns, and performance trends."
        action={
          <div className="flex items-center gap-1 bg-pv-surface-primary p-1 rounded-lg border border-pv-border shrink-0">
            {[
              { id: 'all', label: 'All Time' },
              { id: '90days', label: '90d' },
              { id: '30days', label: '30d' },
              { id: '7days', label: '7d' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id as DateFilter)}
                className={`px-3 h-7 rounded text-xs font-medium transition-colors ${
                  dateFilter === filter.id
                    ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong font-semibold'
                    : 'text-pv-text-secondary hover:text-pv-text-primary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase mb-1">Played</p>
          <p className="text-xl font-semibold text-pv-text-primary font-tabular">{totalGamesPlayed}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase mb-1">Win Rate</p>
          <p className="text-xl font-semibold text-emerald-400 font-tabular">{winRatePct}%</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase mb-1">Best Score</p>
          <p className="text-xl font-semibold text-pv-text-primary font-tabular">{user?.bestScore || 0}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase mb-1">Streak</p>
          <p className="text-xl font-semibold text-[#38C6BA] font-tabular flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 fill-current" /> {user?.currentStreak || 1}d
          </p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase mb-1">Level</p>
          <p className="text-xl font-semibold text-pv-text-primary font-tabular">Lvl {user?.level || 1}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase mb-1">PBs Broken</p>
          <p className="text-xl font-semibold text-pv-text-primary font-tabular">{pbHistory.length}</p>
        </Card>
      </div>

      {/* Coach Insights */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#38C6BA]" />
          <h3 className="text-xs font-semibold text-pv-text-primary">Performance Observations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {coachTips.map((tip, idx) => (
            <div key={idx} className="bg-pv-surface-secondary border border-pv-border p-3 rounded-lg text-xs text-pv-text-secondary leading-relaxed">
              {tip}
            </div>
          ))}
        </div>
      </Card>

      {/* Radar & Heatmap Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-pv-border pb-2.5">
            <h3 className="text-xs font-semibold text-pv-text-primary flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#38C6BA]" /> Skill Distribution Radar
            </h3>
            <span className="text-[10px] text-pv-text-muted font-mono uppercase">6 Axes</span>
          </div>
          <div className="flex justify-center py-2">
            <RadarChart skills={radarSkills} size={260} />
          </div>
        </Card>

        <Card className="p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-pv-border pb-2.5 mb-3">
              <h3 className="text-xs font-semibold text-pv-text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#38C6BA]" /> Consistency Heatmap
              </h3>
              <span className="text-[10px] text-pv-text-muted font-mono">Past 5 Weeks</span>
            </div>
            <HeatmapChart data={heatmapData} />
          </div>
          <div className="bg-pv-surface-secondary p-3 rounded-lg border border-pv-border text-xs text-pv-text-secondary flex items-center justify-between">
            <span>Daily Streak: <strong className="text-[#38C6BA] font-tabular">{formatCount(user?.currentStreak || 1, 'day')}</strong></span>
            <span className="text-[11px] text-pv-text-muted font-medium">Keep solving daily</span>
          </div>
        </Card>
      </div>

      {/* Game Breakdown */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-pv-border pb-3">
          <h3 className="text-xs font-semibold text-pv-text-primary flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#38C6BA]" /> Game Performance Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PUZZLE_MODES.map((puzzle) => {
            const gameSessions = filteredSessions.filter((s) => s.puzzleType === puzzle.id);
            const pb = user?.personalBests?.[puzzle.id];
            const playedCount = gameSessions.length || pb?.totalGames || 0;
            const wonCount = gameSessions.filter((s) => s.won).length || pb?.totalWins || 0;
            const gameWinRate = playedCount > 0 ? Math.round((wonCount / playedCount) * 100) : 0;
            const scores = gameSessions.map((s) => s.score);
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : (pb?.bestScore || 0);

            return (
              <div key={puzzle.id} className="bg-pv-surface-secondary border border-pv-border p-3.5 rounded-lg flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-pv-text-primary text-xs">{puzzle.name}</span>
                  <span className="text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-pv-surface-primary border border-pv-border text-pv-text-muted">
                    {puzzle.category}
                  </span>
                </div>

                {playedCount === 0 ? (
                  <div className="text-center py-2 text-[11px] text-pv-text-muted">
                    No session data logged
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-pv-surface-primary p-2 rounded border border-pv-border">
                    <div>
                      <span className="text-pv-text-muted block text-[10px]">Played</span>
                      <span className="font-semibold text-pv-text-primary font-tabular">{playedCount}</span>
                    </div>
                    <div>
                      <span className="text-pv-text-muted block text-[10px]">Win Rate</span>
                      <span className="font-semibold text-emerald-400 font-tabular">{gameWinRate}%</span>
                    </div>
                    <div>
                      <span className="text-pv-text-muted block text-[10px]">Best Score</span>
                      <span className="font-semibold text-pv-text-primary font-tabular">{pb?.bestScore || avgScore}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-pv-text-muted pt-1 border-t border-pv-border/60">
                  <span>Fastest: <strong className="text-pv-text-secondary font-tabular">{formatTimeSeconds(pb?.bestTime || 0)}</strong></span>
                  <button
                    onClick={() => playGame(puzzle.id)}
                    className="text-[#38C6BA] hover:underline font-medium flex items-center gap-0.5"
                  >
                    Play <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recommended Next Challenges */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-semibold text-pv-text-primary flex items-center gap-2 border-b border-pv-border pb-2.5">
          <Target className="w-4 h-4 text-[#38C6BA]" /> Recommended Puzzles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recommendedGames.map((p) => (
            <div key={p.id} className="bg-pv-surface-secondary border border-pv-border p-3.5 rounded-lg flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] uppercase font-medium text-pv-text-muted bg-pv-surface-primary px-1.5 py-0.2 rounded border border-pv-border mb-1.5 inline-block">
                  {p.category}
                </span>
                <h4 className="text-xs font-semibold text-pv-text-primary">{p.name}</h4>
                <p className="text-[11px] text-pv-text-secondary line-clamp-2 mt-0.5">{p.description}</p>
              </div>
              <button
                onClick={() => playGame(p.id)}
                className="w-full h-8 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" /> Play Mode
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
