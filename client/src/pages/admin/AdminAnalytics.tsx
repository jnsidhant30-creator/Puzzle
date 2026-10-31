import { useEffect, useState } from 'react';
import { 
  getAnalyticsOverview, 
  getGamePopularity, 
  getDifficultyDistribution,
  type AnalyticsOverview,
  type GamePopularity,
  type DifficultyDist,
  type TimeRange
} from '../../services/adminAnalyticsService';
import { usePuzzleStore } from '../../store/usePuzzleStore';
import { Activity, Users, Gamepad2, Trophy, Clock, Target, Calendar, BarChart3, AlertCircle } from 'lucide-react';

export const AdminAnalytics = () => {
  const [range, setRange] = useState<TimeRange>('30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [popularity, setPopularity] = useState<GamePopularity[]>([]);
  const [difficultyDist, setDifficultyDist] = useState<DifficultyDist[]>([]);
  
  const { activePuzzles } = usePuzzleStore();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeTypes = activePuzzles.map(p => p.title);
      const [overviewData, popData, diffData] = await Promise.all([
        getAnalyticsOverview(range),
        getGamePopularity(range, activeTypes),
        getDifficultyDistribution(range)
      ]);
      setOverview(overviewData);
      setPopularity(popData);
      setDifficultyDist(diffData);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePuzzles.length > 0) {
      fetchAnalytics();
    }
  }, [range, activePuzzles]);

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Platform Analytics
          </h1>
          <p className="text-textMuted text-sm mt-1">Aggregate insights and system usage.</p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border p-1 rounded-lg">
          {(['today', '7days', '30days', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === r 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-textMuted hover:text-textMain hover:bg-surfaceHover'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7days' ? '7 Days' : r === '30days' ? '30 Days' : 'All Time'}
            </button>
          ))}
          <button 
            onClick={fetchAnalytics}
            className="ml-2 p-1.5 text-textMuted hover:text-textMain hover:bg-surfaceHover rounded-md transition-colors"
            title="Refresh"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {loading && !overview ? (
        <div className="py-20 text-center text-textMuted flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          Loading analytics...
        </div>
      ) : overview && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Users className="w-4 h-4 text-primary" /> Total Users
              </div>
              <div className="text-2xl font-bold text-textMain">{overview.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-textMuted">+{overview.newUsers.toLocaleString()} new in period</div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Activity className="w-4 h-4 text-secondary" /> Active Users
              </div>
              <div className="text-2xl font-bold text-textMain">{overview.activeUsers.toLocaleString()}</div>
              <div className="text-xs text-textMuted">{overview.returningUsers.toLocaleString()} returning in period</div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Gamepad2 className="w-4 h-4 text-secondary" /> Puzzle Attempts
              </div>
              <div className="text-2xl font-bold text-textMain">{overview.totalAttempts.toLocaleString()}</div>
              <div className="text-xs text-textMuted">{overview.completedAttempts.toLocaleString()} completed</div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Target className="w-4 h-4 text-success" /> Win Rate
              </div>
              <div className="text-2xl font-bold text-textMain">{overview.winRate.toFixed(1)}%</div>
              <div className="text-xs text-textMuted">Average Completion Time: {formatTime(overview.averageTime)}</div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Trophy className="w-4 h-4 text-accent" /> Total XP Earned
              </div>
              <div className="text-2xl font-bold text-textMain">{overview.totalXp.toLocaleString()}</div>
              <div className="text-xs text-textMuted">Avg {Math.round(overview.avgXpPerUser).toLocaleString()} XP / active player</div>
            </div>
            
            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Calendar className="w-4 h-4 text-warning" /> Daily Challenges
              </div>
              <div className="text-2xl font-bold text-textMain">{overview.dailyChallengePart.toLocaleString()}</div>
              <div className="text-xs text-textMuted">Attempts in period</div>
            </div>
            
            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Trophy className="w-4 h-4 text-error" /> Weekly Competition
              </div>
              <div className="text-2xl font-bold text-textMain">{overview.weeklyChallengePart.toLocaleString()}</div>
              <div className="text-xs text-textMuted">Attempts in period</div>
            </div>
            
            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 sm:col-span-2">
              <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
                <Clock className="w-4 h-4 text-primary" /> Active Puzzle Games
              </div>
              <div className="text-2xl font-bold text-textMain">{activePuzzles.length} <span className="text-sm font-normal text-textMuted">/ 16 available</span></div>
              <div className="text-xs text-textMuted">Determined by admin configuration</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Game Popularity Chart */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-textMain mb-4">Game Popularity</h2>
              <div className="space-y-4">
                {popularity.length === 0 ? (
                  <div className="text-textMuted text-sm py-4 text-center">No game data available for this period.</div>
                ) : (
                  popularity.map((pop, i) => {
                    const maxAttempts = popularity[0]?.attempts || 1;
                    const percent = Math.max((pop.attempts / maxAttempts) * 100, 2);
                    return (
                      <div key={pop.puzzleType} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-textMain">{pop.puzzleType}</span>
                          <span className="text-textMuted">{pop.attempts} attempts ({pop.completions} won)</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Difficulty Distribution Chart */}
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-lg font-bold text-textMain mb-4">Difficulty Distribution</h2>
                <div className="space-y-4">
                  {difficultyDist.every(d => d.attempts === 0) ? (
                    <div className="text-textMuted text-sm py-4 text-center">No difficulty data available.</div>
                  ) : (
                    difficultyDist.map(diff => {
                      const total = difficultyDist.reduce((acc, d) => acc + d.attempts, 0) || 1;
                      const percent = (diff.attempts / total) * 100;
                      
                      let colorClass = 'bg-success';
                      if (diff.difficulty === 'Medium') colorClass = 'bg-warning';
                      if (diff.difficulty === 'Hard') colorClass = 'bg-error';
                      if (diff.difficulty === 'Expert') colorClass = 'bg-accent';
                      
                      return (
                        <div key={diff.difficulty} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-textMain">{diff.difficulty}</span>
                            <span className="text-textMuted">{percent.toFixed(1)}% ({diff.attempts})</span>
                          </div>
                          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                            <div 
                              className={`${colorClass} h-full rounded-full transition-all duration-1000 ease-out`} 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              
              <div className="bg-surface border border-border rounded-xl p-6">
                 <h2 className="text-lg font-bold text-textMain mb-4">System Health</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-success" />
                        <span className="text-textMain font-medium">Firebase Connection</span>
                      </div>
                      <span className="text-success text-sm font-bold">● Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-success" />
                        <span className="text-textMain font-medium">Firestore Aggregation</span>
                      </div>
                      <span className="text-success text-sm font-bold">● Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-success" />
                        <span className="text-textMain font-medium">Authentication</span>
                      </div>
                      <span className="text-success text-sm font-bold">● Operational</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
