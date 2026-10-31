import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Trophy, AlertCircle, Search, Hash, Type, BrainCircuit, LayoutGrid, Network, Scan } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getLeaderboard, getPlayerRank, type LeaderboardEntry, type LeaderboardPeriod, type PuzzleFilter, type DifficultyFilter } from '../../services/leaderboardService';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const Leaderboard = () => {
  const { profile } = useAuthStore();
  
  const [period, setPeriod] = useState<LeaderboardPeriod>('GLOBAL');
  const [puzzleType, setPuzzleType] = useState<PuzzleFilter>('ALL');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('ALL');
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<{ rank: number; entry: LeaderboardEntry | null } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getLeaderboard(period, puzzleType, difficulty, 100);
      setEntries(data);

      if (profile) {
        const rankData = await getPlayerRank(profile.uid, period, puzzleType, difficulty);
        setUserEntry(rankData);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      setError('Unable to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, puzzleType, difficulty, profile]);

  const periods: LeaderboardPeriod[] = ['GLOBAL', 'DAILY', 'WEEKLY', 'MONTHLY'];
  const puzzles: { id: PuzzleFilter, label: string, icon: any }[] = [
    { id: 'ALL', label: 'All Puzzles', icon: null },
    { id: 'NUMBER', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { id: 'WORD', label: 'Word', icon: <Type className="w-4 h-4" /> },
    { id: 'MEMORY', label: 'Memory', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'SLIDING', label: 'Sliding', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'LOGIC', label: 'Logic', icon: <Network className="w-4 h-4" /> },
    { id: 'PATTERN', label: 'Pattern', icon: <Scan className="w-4 h-4" /> },
  ];
  const difficulties: DifficultyFilter[] = ['ALL', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'];

  const formatTime = (seconds: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center justify-center p-4 bg-accent/20 rounded-full mb-2">
          <Trophy className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-4xl font-bold">Hall of Fame</h1>
        <p className="text-textMuted">Compete with the best minds in the PuzzleVerse.</p>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6 space-y-6 bg-surface/50">
        
        {/* Period Filter */}
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center bg-background p-1 rounded-lg border border-border">
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 sm:px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  period === p 
                    ? 'bg-primary text-textMain shadow-md' 
                    : 'text-textMuted hover:text-textMain hover:bg-textMuted/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Puzzle Type Filter */}
          <div className="relative w-full sm:w-64">
            <select
              value={puzzleType}
              onChange={(e) => setPuzzleType(e.target.value as PuzzleFilter)}
              className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 pr-10 font-bold text-textMain outline-none focus-visible:border-primary transition-colors cursor-pointer"
            >
              {puzzles.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-textMuted">
              ▼
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyFilter)}
              className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 pr-10 font-bold text-textMain outline-none focus-visible:border-primary transition-colors cursor-pointer"
            >
              {difficulties.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-textMuted">
              ▼
            </div>
          </div>
        </div>

      </Card>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-textMuted font-bold animate-pulse">Loading rankings...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-error/50 bg-error/5">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-xl font-bold text-textMain mb-2">{error}</h3>
          <Button onClick={fetchLeaderboardData} variant="ghost" className="mt-4 border border-border">
            Retry
          </Button>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="p-12 text-center bg-surface/50">
          <Search className="w-16 h-16 text-textMuted/50 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-textMain mb-2">No rankings available yet.</h3>
          <p className="text-textMuted mb-8 max-w-md mx-auto">
            Be the first to complete a puzzle in this category and claim the #1 spot!
          </p>
          <Link to="/dashboard">
            <Button variant="primary" className="font-bold uppercase tracking-wider px-8">
              Play Now
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-8">
          
          {/* Podium for Top 3 */}
          {top3.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-center items-end gap-4 sm:gap-6 pt-10 pb-6 px-4">
              
              {/* 2nd Place */}
              {top3[1] && (
                <div className="order-2 sm:order-1 flex flex-col items-center flex-1 max-w-[200px] animate-in slide-in-from-bottom-8 duration-700 delay-100">
                  <div className="relative mb-4">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-surface border-textMuted border rounded-full flex items-center justify-center font-black text-textMuted shadow-lg z-10">2</div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-textMuted/50 overflow-hidden bg-surface flex items-center justify-center text-3xl font-bold text-textMuted">
                      {top3[1].avatarUrl ? <img src={top3[1].avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : top3[1].username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="w-full bg-surface border border-border rounded-t-xl pt-6 pb-4 px-2 text-center shadow-lg relative overflow-hidden h-[120px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-300/10 to-transparent" />
                    <p className="font-bold text-textMain truncate px-2">{top3[1].username}</p>
                    <p className="text-lg font-black text-secondary mt-1">{top3[1].score.toLocaleString()}</p>
                    <p className="text-xs text-textMuted mt-1">Lvl {top3[1].level}</p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              <div className="order-1 sm:order-2 flex flex-col items-center flex-1 max-w-[220px] animate-in slide-in-from-bottom-12 duration-700 z-10">
                <div className="relative mb-4">
                  <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-accent drop-shadow-[0_0_15px_rgba(var(--accent),0.5)]" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center font-black text-white shadow-lg border-2 border-background z-10">1</div>
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-accent overflow-hidden bg-surface flex items-center justify-center text-4xl font-bold text-accent shadow-[0_0_30px_rgba(var(--accent),0.3)]">
                    {top3[0].avatarUrl ? <img src={top3[0].avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : top3[0].username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="w-full bg-surface border-2 border-accent/50 rounded-t-xl pt-8 pb-6 px-2 text-center shadow-xl relative overflow-hidden h-[150px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent" />
                  <p className="font-black text-lg text-textMain truncate px-2">{top3[0].username}</p>
                  <p className="text-2xl font-black text-accent mt-1 drop-shadow-md">{top3[0].score.toLocaleString()}</p>
                  <p className="text-sm font-bold text-textMuted mt-1">Level {top3[0].level}</p>
                </div>
              </div>

              {/* 3rd Place */}
              {top3[2] && (
                <div className="order-3 flex flex-col items-center flex-1 max-w-[200px] animate-in slide-in-from-bottom-8 duration-700 delay-200">
                  <div className="relative mb-4">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center font-black text-white shadow-lg border-2 border-background z-10">3</div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-700 overflow-hidden bg-surface flex items-center justify-center text-3xl font-bold text-textMuted">
                      {top3[2].avatarUrl ? <img src={top3[2].avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : top3[2].username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="w-full bg-surface border border-border rounded-t-xl pt-6 pb-4 px-2 text-center shadow-lg relative overflow-hidden h-[100px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-700/10 to-transparent" />
                    <p className="font-bold text-textMain truncate px-2">{top3[2].username}</p>
                    <p className="text-lg font-black text-secondary mt-1">{top3[2].score.toLocaleString()}</p>
                    <p className="text-xs text-textMuted mt-1">Lvl {top3[2].level}</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Current User Sticky Row (if not in top 100 or to highlight their current standing) */}
          {profile && userEntry && userEntry.entry && (
            <Card className={`overflow-hidden border-2 shadow-xl ${userEntry.rank <= 3 ? 'border-primary/50 bg-primary/5' : 'border-primary shadow-primary/20 bg-primary/10'}`}>
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 text-center font-black text-primary text-xl">
                  #{userEntry.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-background border-2 border-primary overflow-hidden flex items-center justify-center font-bold text-primary shrink-0">
                  {userEntry.entry.avatarUrl ? <img src={userEntry.entry.avatarUrl} alt="Avatar" /> : userEntry.entry.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-primary truncate">{userEntry.entry.username} (You)</p>
                  <div className="flex gap-4 text-xs font-medium text-primary/80 mt-1">
                    <span>Lvl {userEntry.entry.level}</span>
                    <span className="hidden sm:inline">Best: {formatTime(userEntry.entry.bestTime)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase font-bold text-primary/80 tracking-wider">Score</p>
                  <p className="text-2xl font-black text-primary">{userEntry.entry.score.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Rest of the Table (Rank 4+) */}
          {rest.length > 0 && (
            <Card className="overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface/50 text-textMuted text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold text-center w-20">Rank</th>
                      <th className="p-4 font-bold">Player</th>
                      <th className="p-4 font-bold text-center">Level</th>
                      <th className="p-4 font-bold text-center">Best Time</th>
                      <th className="p-4 font-bold text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry, idx) => {
                      const rank = idx + 4;
                      const isMe = entry.userId === profile?.uid;
                      
                      return (
                        <tr key={entry.id} className={`border-b border-border last:border-0 hover:bg-textMuted/10 transition-colors ${isMe ? 'bg-primary/5' : ''}`}>
                          <td className="p-4 text-center">
                            <span className="font-bold text-textMuted">#{rank}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
                                {entry.avatarUrl ? <img src={entry.avatarUrl} alt="Avatar" /> : entry.username.charAt(0).toUpperCase()}
                              </div>
                              <span className={`font-bold truncate ${isMe ? 'text-primary' : 'text-textMain'}`}>
                                {entry.username} {isMe && '(You)'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center text-textMuted font-medium">{entry.level}</td>
                          <td className="p-4 text-center text-textMuted font-mono text-sm">{formatTime(entry.bestTime)}</td>
                          <td className="p-4 text-right font-black text-secondary">{entry.score.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden flex flex-col">
                {rest.map((entry, idx) => {
                  const rank = idx + 4;
                  const isMe = entry.userId === profile?.uid;
                  
                  return (
                    <div key={entry.id} className={`flex items-center gap-3 p-4 border-b border-border last:border-0 ${isMe ? 'bg-primary/5' : ''}`}>
                      <div className="w-8 text-center font-bold text-textMuted text-sm">#{rank}</div>
                      <div className="w-10 h-10 rounded-full bg-background border border-border overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt="Avatar" /> : entry.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : 'text-textMain'}`}>{entry.username} {isMe && '(You)'}</p>
                        <p className="text-xs text-textMuted mt-0.5">Lvl {entry.level} • {formatTime(entry.bestTime)}</p>
                      </div>
                      <div className="text-right font-black text-secondary">{entry.score.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>
      )}
      
    </div>
  );
};
