import { useEffect, useState } from 'react';
import { getLeaderboard } from '../../services/leaderboardService';
import type { LeaderboardEntry } from '../../services/leaderboardService';
import { Medal } from 'lucide-react';
export const AdminLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<any>('ALL');
  const [period, setPeriod] = useState<any>('GLOBAL');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard(period, typeFilter, 'ALL', 50);
        setEntries(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [typeFilter, period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Leaderboard Monitoring</h1>
      </div>

      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-sm text-warning">
        Leaderboard data is generated directly from user profiles. Direct modification of leaderboard entries is blocked for data integrity. Use this view for moderation monitoring.
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-textMain">Top 50 Rankings</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="ALL">All Types</option>
              <option value="NUMBER">NUMBER</option>
              <option value="WORD">WORD</option>
              <option value="MEMORY">MEMORY</option>
              <option value="SLIDING">SLIDING</option>
              <option value="LOGIC">LOGIC</option>
              <option value="PATTERN">PATTERN</option>
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="GLOBAL">All Time</option>
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="DAILY">Daily</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Best Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textMuted">Loading rankings...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textMuted">No rankings found for this category.</td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-2xl">🥇</span>}
                        {index === 1 && <span className="text-2xl">🥈</span>}
                        {index === 2 && <span className="text-2xl">🥉</span>}
                        {index > 2 && <span className="font-bold text-textMuted w-8 text-center">#{index + 1}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-textMain">{entry.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surfaceHover text-xs font-bold text-textMain">
                        {entry.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-textMain">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {entry.bestTime ? `${entry.bestTime}s` : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
