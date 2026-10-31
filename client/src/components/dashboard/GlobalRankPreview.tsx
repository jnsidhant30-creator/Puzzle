import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getPlayerRank, type LeaderboardEntry } from '../../services/leaderboardService';

export const GlobalRankPreview = () => {
  const { profile } = useAuthStore();
  const [userEntry, setUserEntry] = useState<{ rank: number; entry: LeaderboardEntry | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRank = async () => {
      if (profile) {
        try {
          setLoading(true);
          const userRank = await getPlayerRank(profile.uid, 'GLOBAL', 'ALL', 'ALL');
          setUserEntry(userRank);
        } catch (err) {
          console.error('Failed to load user rank', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchRank();
  }, [profile]);

  return (
    <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm p-6 relative group flex flex-col items-center">
      <div className="flex items-center gap-2 mb-6 self-start">
        <h3 className="text-sm font-bold uppercase tracking-wider text-textMuted">GLOBAL RANK</h3>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[160px]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center w-full">
          <div className="text-6xl mb-4" role="img" aria-label="Globe">🌐</div>
          <div className="text-4xl font-black text-textMain tracking-tight mb-2">
            #{userEntry?.rank ? userEntry.rank.toLocaleString() : '---'}
          </div>
          <p className="text-textMuted font-medium mb-6">Your Global Rank</p>
          <p className="text-sm text-textMuted/70 mb-6">Keep playing to climb higher!</p>
          
          <Link to="/leaderboard" className="w-full">
            <button className="w-full py-3 bg-background hover:bg-background/80 border border-border rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};
