import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Trophy, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getLeaderboard, getPlayerRank, type LeaderboardEntry } from '../../services/leaderboardService';

export const LeaderboardPreview = () => {
  const { profile } = useAuthStore();
  
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<{ rank: number; entry: LeaderboardEntry | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // Fetch top 3 global scores
        const entries = await getLeaderboard('GLOBAL', 'ALL', 'ALL', 3);
        setTopPlayers(entries);

        // Fetch current user rank
        if (profile) {
          const userRank = await getPlayerRank(profile.uid, 'GLOBAL', 'ALL', 'ALL');
          setUserEntry(userRank);
        }
      } catch (err) {
        console.error('Failed to load leaderboard preview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [profile]);

  return (
    <Card className="h-full flex flex-col bg-surface/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-accent" /> 
          Global Leaders
        </CardTitle>
        <Link to="/leaderboard" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 group">
          View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : topPlayers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-textMuted text-sm text-center">
            No rankings available yet. Complete a puzzle to claim the top spot!
          </div>
        ) : (
          <div className="space-y-3">
            {topPlayers.map((entry, i) => (
              <div key={entry.id} className="flex items-center justify-between group p-2 rounded-xl hover:bg-surface-elevated transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-6 flex justify-center font-black ${
                    i===0 ? 'text-accent drop-shadow-md text-lg' : 
                    i===1 ? 'text-gray-400 drop-shadow-sm text-base' : 
                    i===2 ? 'text-amber-700 drop-shadow-sm text-base' : 'text-textMuted text-sm'
                  }`}>{i + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-textMain font-bold text-sm shadow-sm overflow-hidden relative">
                    {i === 0 && <div className="absolute inset-0 border-2 border-accent rounded-full animate-pulse" />}
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                    ) : (
                      entry.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className={`font-semibold text-sm ${i === 0 ? 'text-textMain' : 'text-textMuted group-hover:text-textMain'} transition-colors`}>{entry.username}</span>
                </div>
                <span className={`text-sm font-bold font-mono ${i === 0 ? 'text-accent' : 'text-textMain'}`}>{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        
        {!loading && profile && userEntry && userEntry.rank > 3 && userEntry.entry && (
          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between bg-primary/5 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl">
            <div className="flex items-center gap-3">
              <span className="font-bold w-4 text-center text-textMuted">{userEntry.rank}</span>
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shadow-sm overflow-hidden">
                {userEntry.entry.avatarUrl ? (
                  <img src={userEntry.entry.avatarUrl} alt={userEntry.entry.username} className="w-full h-full object-cover" />
                ) : (
                  userEntry.entry.username.charAt(0).toUpperCase()
                )}
              </div>
              <span className="font-bold text-sm text-primary">{userEntry.entry.username}</span>
            </div>
            <span className="text-sm font-bold text-primary">{userEntry.entry.score.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
