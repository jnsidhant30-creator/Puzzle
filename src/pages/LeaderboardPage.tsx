import React, { useState, useEffect } from 'react';
import { fetchTopLeaderboard } from '../services/firebase';
import { LeaderboardEntry, PuzzleType } from '../types';
import { Trophy, RefreshCw, Play, WifiOff } from 'lucide-react';
import { PUZZLE_MODES } from '../data/puzzles';
import { useStore } from '../store/useStore';
import { PageHeader, Card } from '../components/ui/Card';
import { resolveAvatarUrl } from '../utils/avatar';

export const LeaderboardPage: React.FC = () => {
  const { playGame, isOnline, retryConnection } = useStore();
  const [selectedType, setSelectedType] = useState<string>('overall');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOnline) loadLeaderboard();
    else setEntries([]);
  }, [selectedType, isOnline]);

  const loadLeaderboard = async () => {
    if (!isOnline) return;
    setLoading(true);
    try {
      const data = await fetchTopLeaderboard(
        selectedType === 'overall' ? undefined : selectedType,
        25
      );
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Leaderboard"
        description="Verified player rankings and competitive records across all puzzle modes."
        action={
          <button
            onClick={async () => {
              const ok = await retryConnection();
              if (ok) loadLeaderboard();
            }}
            disabled={loading}
            aria-label="Refresh leaderboard"
            className="h-9 px-3 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {!isOnline && (
        <Card className="p-6 text-center space-y-3 border-[#F59E0B]/40">
          <WifiOff className="w-7 h-7 text-[#FBBF24] mx-auto" />
          <h3 className="text-base font-bold text-[#F5F7F8]">Global Leaderboard Requires Internet</h3>
          <p className="text-xs text-[#B4C3CE] max-w-md mx-auto">
            Offline practice scores remain local and are never shown as verified global rankings. Reconnect to view verified leaderboard standings.
          </p>
          <button
            onClick={() => retryConnection()}
            className="h-9 px-4 bg-[#087F8C] hover:bg-[#066B75] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-pv-border">
        <button
          onClick={() => setSelectedType('overall')}
          className={`px-3.5 h-8 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            selectedType === 'overall'
              ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
              : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
          }`}
        >
          Overall
        </button>
        {PUZZLE_MODES.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedType(p.id)}
            className={`px-3.5 h-8 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedType === p.id
                ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Leaderboard Table / Empty State */}
      {!isOnline ? null : loading ? (
        <Card className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-[#38C6BA] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-pv-text-secondary font-medium">Loading rankings...</p>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-pv-surface-secondary rounded-lg flex items-center justify-center text-pv-text-muted mx-auto border border-pv-border">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-pv-text-primary mb-1">
              No records for this category yet
            </h3>
            <p className="text-xs text-pv-text-secondary max-w-sm mx-auto leading-relaxed">
              Complete a puzzle session in this mode to log the first verified high score on the leaderboard.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => playGame(selectedType === 'overall' ? 'number' : (selectedType as PuzzleType))}
              className="h-9 px-4 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Now</span>
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Top-Ranked Spotlight Strip */}
          {entries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {entries.slice(0, 3).map((item, idx) => {
                const rank = idx + 1;
                return (
                  <Card
                    key={`podium-${item.userId || idx}`}
                    surface={rank === 1 ? 'featured' : 'primary'}
                    padding="md"
                    className={rank === 1 ? 'border-[#38C6BA]/45' : ''}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          rank === 1
                            ? 'bg-[#38C6BA]/15 border-[#38C6BA]/40 text-[#A8E5D5]'
                            : 'bg-[#233D4A] border-[#36515F] text-[#B4C3CE]'
                        }`}
                      >
                        RANK #{rank}
                      </span>
                      <span className="text-[11px] font-mono text-[#98AAB8] font-tabular">
                        {item.bestTime}s
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveAvatarUrl(item.avatarUrl, item.username || item.userId)}
                        alt={item.displayName}
                        className="w-10 h-10 rounded-lg object-cover border border-[#36515F] bg-[#1C2D3B] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-[#F5F7F8] truncate">{item.displayName}</h4>
                        <p className="text-[11px] text-[#98AAB8] font-mono truncate">@{item.username}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#36515F] flex items-center justify-between text-xs">
                      <span className="text-[#98AAB8]">Verified Score</span>
                      <span className="text-base font-semibold text-[#F5F7F8] font-tabular">
                        {item.score.toLocaleString()} pts
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Full Ledger Table */}
          <div className="bg-[#233D4A] border border-[#36515F] rounded-xl overflow-hidden divide-y divide-[#36515F]">
            {entries.map((item, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={item.userId || idx}
                  className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[#233D4A]/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-7 text-center text-xs font-mono font-semibold text-[#98AAB8] font-tabular">
                      {rank === 1 ? (
                        <span className="text-[#A8E5D5] font-bold">#1</span>
                      ) : (
                        `#${rank}`
                      )}
                    </div>
                    <img
                      src={resolveAvatarUrl(item.avatarUrl, item.username || item.userId)}
                      alt={item.displayName}
                      className="w-8 h-8 rounded-md object-cover border border-[#36515F] bg-[#1C2D3B] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-medium text-[#F5F7F8] text-xs truncate">
                        {item.displayName}
                      </h4>
                      <p className="text-[11px] text-[#98AAB8] font-mono truncate">
                        @{item.username}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#F5F7F8] font-tabular">
                      {item.score.toLocaleString()} pts
                    </p>
                    <p className="text-[11px] text-[#98AAB8] font-tabular">
                      {item.bestTime}s time
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
