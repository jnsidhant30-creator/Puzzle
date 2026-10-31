import { useEffect, useState } from 'react';
import { getAdminGameSessions } from '../../services/adminService';
import type { GameResultData } from '../../services/gameResultService';
import { Gamepad2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminGames = () => {
  const [sessions, setSessions] = useState<GameResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getAdminGameSessions(50);
        setSessions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const filtered = sessions.filter(s => filterType === 'ALL' || s.puzzleType === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Recent Game Sessions</h1>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-textMuted" />
            <span className="text-sm font-medium text-textMain">Latest 50 Sessions</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">User ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Puzzle</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Score / XP</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-textMuted">Loading sessions...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-textMuted">No game sessions found.</td>
                </tr>
              ) : (
                filtered.map((session: any) => {
                  const date = session.createdAt ? new Date(session.createdAt.seconds * 1000).toLocaleString() : 'Unknown';
                  const isSuspicious = session.score > 100000 || session.duration < 0 || session.xpEarned < 0;

                  return (
                    <tr key={session.id} className="hover:bg-surfaceHover/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                        {date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-textMain">
                        {session.userId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-textMain">{session.puzzleType}</div>
                        <div className="text-xs text-textMuted">{session.difficulty}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 text-xs font-bold rounded-full",
                          session.status === 'COMPLETED' ? "bg-success/10 text-success" :
                          session.status === 'FAILED' ? "bg-error/10 text-error" :
                          "bg-warning/10 text-warning"
                        )}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-textMain">{session.score.toLocaleString()}</div>
                        <div className="text-xs text-primary">+{session.xpEarned} XP</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                        {session.duration}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSuspicious ? (
                          <div className="flex items-center gap-1 text-error text-xs font-bold bg-error/10 px-2 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Flagged
                          </div>
                        ) : (
                          <span className="text-xs text-textMuted">Clean</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
