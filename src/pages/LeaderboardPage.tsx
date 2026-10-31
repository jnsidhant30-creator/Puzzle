import React, { useState, useEffect } from 'react';
import { fetchTopLeaderboard } from '../services/firebase';
import { LeaderboardEntry, PuzzleType } from '../types';
import { Trophy, Medal, Crown, RefreshCw, Play, Eye } from 'lucide-react';
import { PUZZLE_MODES } from '../data/puzzles';
import { useStore } from '../store/useStore';

export const LeaderboardPage: React.FC = () => {
  const { playGame } = useStore();
  const [selectedType, setSelectedType] = useState<string>('overall');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedType]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await fetchTopLeaderboard(selectedType === 'overall' ? undefined : selectedType, 20);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      userId: 'demo_1',
      username: 'BrainiacMaster',
      displayName: 'Brainiac Master',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Brainiac',
      period: 'ALL_TIME',
      periodKey: 'all',
      puzzleType: 'overall',
      difficulty: 'all',
      score: 4850,
      bestTime: 18,
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'demo_2',
      username: 'CipherQueen',
      displayName: 'Cipher Queen',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cipher',
      period: 'ALL_TIME',
      periodKey: 'all',
      puzzleType: 'overall',
      difficulty: 'all',
      score: 4200,
      bestTime: 22,
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'demo_3',
      username: 'PixelKnight',
      displayName: 'Pixel Knight',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel',
      period: 'ALL_TIME',
      periodKey: 'all',
      puzzleType: 'overall',
      difficulty: 'all',
      score: 3890,
      bestTime: 25,
      updatedAt: new Date().toISOString()
    }
  ];

  const displayList = entries.length > 0 ? entries : showDemoPreview ? mockLeaderboard : [];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-pv-surface-primary p-6 rounded-3xl border border-pv-border-violet">
        <div>
          <h1 className="text-3xl font-black text-white tracking-wide flex items-center gap-2">
            <Trophy className="w-8 h-8 text-pv-dragon-fruit-light" />
            Global Hall of Fame
          </h1>
          <p className="text-xs text-pv-text-secondary mt-1">
            Real player rankings and verified high score records across PuzzleVerse
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length === 0 && (
            <button
              onClick={() => setShowDemoPreview(!showDemoPreview)}
              className="px-3 py-2 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showDemoPreview ? 'Hide Demo' : 'Demo Preview'}</span>
            </button>
          )}
          <button
            onClick={loadLeaderboard}
            aria-label="Refresh leaderboard"
            className="p-2.5 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedType('overall')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
            selectedType === 'overall'
              ? 'bg-gradient-primary-btn text-pv-bg-primary font-black border-pv-border-strong shadow-md'
              : 'bg-pv-bg-secondary text-pv-text-secondary border-pv-border-violet hover:text-white'
          }`}
        >
          🏆 Overall Ranks
        </button>
        {PUZZLE_MODES.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedType(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedType === p.id
                ? 'bg-gradient-primary-btn/20 text-pv-dragon-fruit-light border-pv-border-strong'
                : 'bg-pv-bg-secondary text-pv-text-secondary border-pv-border-violet hover:text-white'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Demo Warning Banner */}
      {showDemoPreview && entries.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-xs text-amber-300 flex items-center justify-between">
          <span>Viewing sample demo leaderboard. No official player records logged for this mode yet.</span>
          <button onClick={() => setShowDemoPreview(false)} className="font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Leaderboard Table / Empty State */}
      {loading ? (
        <div className="py-20 text-center bg-pv-surface-primary border border-pv-border-violet rounded-3xl">
          <div className="w-8 h-8 border-2 border-pv-dragon-fruit border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-pv-text-secondary font-medium">Loading ranking records...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-pv-surface-primary border border-pv-border-violet rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-pv-bg-secondary rounded-2xl flex items-center justify-center text-pv-dragon-fruit-light mx-auto border border-pv-border-strong">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">No Leaderboard Records Yet</h3>
            <p className="text-xs text-pv-text-secondary max-w-md mx-auto leading-relaxed">
              Be the first puzzle master to complete this challenge and claim the #1 rank in the Global Hall of Fame!
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => playGame(selectedType === 'overall' ? 'number' : (selectedType as PuzzleType))}
              className="bg-gradient-primary-btn hover:bg-pv-dragon-fruit-light text-pv-bg-primary font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-pv-bg-primary" />
              <span>Claim Rank #1 Now</span>
            </button>
            <button
              onClick={() => setShowDemoPreview(true)}
              className="px-4 py-3 rounded-2xl bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary text-xs font-bold border border-pv-border-strong transition"
            >
              Show Demo Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-pv-surface-primary border border-pv-border-violet rounded-3xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-800/80">
            {displayList.map((item, idx) => {
              const rank = idx + 1;
              let rankBadge = <span className="text-sm font-bold text-pv-text-muted font-mono">#{rank}</span>;
              if (rank === 1) rankBadge = <Crown className="w-6 h-6 text-pv-dragon-fruit-light fill-pv-dragon-fruit animate-bounce" />;
              if (rank === 2) rankBadge = <Medal className="w-6 h-6 text-slate-300 fill-slate-300" />;
              if (rank === 3) rankBadge = <Medal className="w-6 h-6 text-amber-500 fill-amber-500" />;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex items-center justify-center font-black">{rankBadge}</div>
                    <img
                      src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                      alt={item.displayName}
                      className="w-10 h-10 rounded-xl object-cover border border-pv-border-strong bg-pv-surface-secondary"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.displayName}</h4>
                      <p className="text-[10px] text-pv-text-secondary font-mono">@{item.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-pv-dragon-fruit-light font-mono">{item.score.toLocaleString()} PTS</p>
                    <p className="text-[10px] text-cyan-400 font-bold font-mono">{item.bestTime}s Best Time</p>
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
