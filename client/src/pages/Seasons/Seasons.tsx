import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Trophy, CalendarDays, ArrowUpRight, Crown } from 'lucide-react';
import { getActiveSeason, getPastSeasons, getSeasonLeaderboard, type Season, type SeasonProgress } from '../../services/seasonService';
import { TITLES, BADGES } from '../../services/rewardService';
import { useAuthStore } from '../../store/useAuthStore';

export const Seasons = () => {
  const { profile } = useAuthStore();
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [pastSeasons, setPastSeasons] = useState<Season[]>([]);
  const [leaderboard, setLeaderboard] = useState<SeasonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [active, past] = await Promise.all([
          getActiveSeason(),
          getPastSeasons()
        ]);
        setActiveSeason(active);
        setPastSeasons(past);
        if (active) {
          const board = await getSeasonLeaderboard(active.id, 50);
          setLeaderboard(board);
        }
      } catch (err) {
        console.error("Failed to fetch season data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userRank = leaderboard.findIndex(p => p.userId === profile?.uid) + 1;
  const userProgress = leaderboard.find(p => p.userId === profile?.uid);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-black text-textMain tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-accent" /> 
            Seasonal Competition
          </h1>
          <p className="text-textMuted font-medium mt-1">Compete for exclusive titles and badges during the active season.</p>
        </div>
      </div>

      {!activeSeason ? (
        <Card className="bg-[#151B23] border-border text-center py-12">
          <CardContent>
            <CalendarDays className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-textMain mb-2">No Active Season</h2>
            <p className="text-textMuted">Check back later for the next seasonal competition!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#151B23] border-border overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
              <CardContent className="p-6">
                <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span> Active Season
                </div>
                <h2 className="text-2xl font-black text-textMain mb-2">{activeSeason.name}</h2>
                <p className="text-sm text-textMuted mb-6 font-medium">{activeSeason.description}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-textMuted font-semibold">Ends On</span>
                    <span className="text-textMain font-bold">{activeSeason.endAt.toLocaleDateString()}</span>
                  </div>
                  
                  {activeSeason.rewards && (
                    <div className="bg-background rounded-lg border border-border p-4 mt-6">
                      <h3 className="text-xs font-black uppercase tracking-wider text-textMuted mb-3 flex items-center gap-2">
                        <Crown className="w-3 h-3 text-secondary"/> Season Rewards
                      </h3>
                      {activeSeason.rewards.badgeId && (
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-xl">{BADGES.find(b => b.id === activeSeason.rewards.badgeId)?.icon}</div>
                          <span className="text-sm font-bold text-textMain">Exclusive Badge</span>
                        </div>
                      )}
                      {activeSeason.rewards.titleId && (
                        <div className="flex items-center gap-3">
                          <div className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded">TITLE</div>
                          <span className="text-sm font-bold text-textMain">{TITLES.find(t => t.id === activeSeason.rewards.titleId)?.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {profile && (
              <Card className="bg-[#151B23] border-border">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                    Your Standing
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-textMuted uppercase mb-1">Rank</span>
                    <span className="text-2xl font-black text-secondary">{userRank > 0 ? `#${userRank}` : 'Unranked'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-textMuted uppercase mb-1">Score</span>
                    <span className="text-2xl font-black text-primary">{userProgress?.score?.toLocaleString() || 0}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-[#151B23] border-border h-full">
              <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                  Top Players
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-textMuted font-medium">No scores posted yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 text-xs text-textMuted uppercase">
                          <th className="px-4 py-3 font-black">Rank</th>
                          <th className="px-4 py-3 font-black">Player</th>
                          <th className="px-4 py-3 font-black text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-semibold">
                        {leaderboard.map((p, index) => {
                          const isCurrentUser = p.userId === profile?.uid;
                          const title = p.activeTitleId ? TITLES.find(t => t.id === p.activeTitleId) : null;
                          return (
                            <tr key={p.userId} className={`border-b border-border/30 hover:bg-surface/50 transition-colors ${isCurrentUser ? 'bg-primary/5' : ''}`}>
                              <td className="px-4 py-3 w-16">
                                {index < 3 ? (
                                  <span className={`flex items-center justify-center w-6 h-6 rounded-full font-black text-background ${index === 0 ? 'bg-accent' : index === 1 ? 'bg-zinc-300' : 'bg-amber-600'}`}>
                                    {index + 1}
                                  </span>
                                ) : (
                                  <span className="text-textMuted pl-2">{index + 1}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-surface border-2 border-border overflow-hidden shrink-0">
                                    {p.avatarUrl ? (
                                      <img src={p.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                        {p.displayName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className={`font-bold ${isCurrentUser ? 'text-primary' : 'text-textMain'}`}>
                                      {p.displayName} {isCurrentUser && '(You)'}
                                    </p>
                                    {title && (
                                      <p className={`text-[10px] uppercase font-black tracking-wider ${title.rarity === 'Legendary' ? 'text-accent' : title.rarity === 'Epic' ? 'text-secondary' : 'text-primary'}`}>
                                        {title.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-black text-textMain bg-background px-2 py-1 rounded border border-border">
                                  {p.score.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {pastSeasons.length > 0 && (
        <div className="pt-8 border-t border-border mt-8">
          <h3 className="text-lg font-black text-textMain mb-4">Past Seasons</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pastSeasons.map(s => (
              <Card key={s.id} className="bg-background border-border hover:border-primary/50 transition-colors cursor-default">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-textMain text-sm">{s.name}</h4>
                    <span className="text-xs text-textMuted">{s.endAt.getFullYear()}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-textMuted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
