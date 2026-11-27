import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';
import { getRecommendedPuzzles } from '../services/recommendation';
import { fetchUserRecentGameSessions, fetchPlayerGlobalRank } from '../services/firebase';
import { GameSession } from '../types';
import {
  Play,
  Calendar,
  LayoutGrid,
  BarChart3,
  ChevronRight,
  Flame,
  Trophy,
  Download,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PuzzleCoverArt } from '../components/PuzzleArt';
import { formatCount } from '../utils/format';
import { Capacitor } from '@capacitor/core';

export const DashboardPage: React.FC = () => {
  const {
    user,
    isGuest,
    isOnline,
    playGame,
    setActiveTab,
    getRecommendedDifficulty,
    startReplaySession,
  } = useStore();
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [globalRank, setGlobalRank] = useState<{ rank: number | null; topScore: number }>({
    rank: null,
    topScore: 0,
  });

  useEffect(() => {
    if (!user?.uid || isGuest || !isOnline) {
      setGlobalRank({ rank: null, topScore: 0 });
      return;
    }
    fetchUserRecentGameSessions(user.uid, 3).then(setRecentSessions).catch(() => {});
    fetchPlayerGlobalRank(user.uid).then(setGlobalRank).catch(() => {});
  }, [user?.uid, isGuest, isOnline]);

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpIntoLevel = xp % 250;
  const xpProgress = Math.min(100, Math.round((xpIntoLevel / 250) * 100));
  const streakDays = user?.currentStreak || 0;

  const recommendedPuzzles = getRecommendedPuzzles(user, 2);
  const lastSession = recentSessions[0] || null;
  const lastPuzzleMeta = lastSession
    ? PUZZLE_MODES.find((p) => p.id === lastSession.puzzleType) || null
    : null;

  const now = new Date();
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) /
      86400000
  );
  const eligibleDaily = PUZZLE_MODES.filter((p) => p.id !== 'challenge_mode');
  const todayPuzzle = eligibleDaily[dayOfYear % eligibleDaily.length] || eligibleDaily[0];
  const challengeMeta = PUZZLE_MODES.find((p) => p.id === 'challenge_mode') || PUZZLE_MODES[15];

  const featuredPuzzle =
    recommendedPuzzles.find((p) => p.id !== todayPuzzle.id) ||
    PUZZLE_MODES.find((p) => p.id === 'laser_mirror') ||
    PUZZLE_MODES[0];

  const firstName = user?.displayName?.split(' ')[0] || 'Player';
  const isNativeContainer = Boolean(window.puzzleverseDesktop?.isDesktop) || Capacitor.isNativePlatform();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* A. Compact Welcome Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#F5F7F8] tracking-tight leading-tight">
            Ready to play, {firstName}?
          </h1>
          <p className="text-sm text-[#B4C3CE] mt-0.5">
            Challenge Your Mind. Beat Your Best.
          </p>
        </div>
        {!isNativeContainer && (
          <Button variant="secondary" size="sm" onClick={() => setActiveTab('download')}>
            <Download className="w-3.5 h-3.5 text-[#38C6BA]" />
            <span>Get Desktop &amp; Mobile Apps</span>
          </Button>
        )}
      </div>

      {/* Top Warm Ivory Action Banner */}
      <Card surface="ivory" padding="none" className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-center gap-4">
            <h2 className="text-xl sm:text-[26px] font-extrabold text-[#142331] tracking-tight leading-snug">
              16 puzzles. Pick one and start playing.
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => playGame(featuredPuzzle.id, getRecommendedDifficulty(featuredPuzzle.id))}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Now</span>
              </Button>
              <Button variant="outlineLight" size="md" onClick={() => setActiveTab('games')}>
                <span>Open Library</span>
              </Button>
            </div>
          </div>

          <div
            className="md:col-span-5 bg-[#E9EEE8] border-t md:border-t-0 md:border-l border-[#D5DEDB] min-h-[140px] sm:min-h-[168px] flex items-center justify-center p-4"
            aria-hidden="true"
          >
            <svg viewBox="0 0 260 140" className="w-full max-w-[260px] h-auto select-none">
              <path d="M110 140 A 150 150 0 0 1 260 10 L 260 140 Z" fill="#A8E5D5" opacity="0.45" />
              <g transform="translate(42, 16) rotate(-7)">
                <rect width="166" height="106" rx="12" fill="#1C2D3B" stroke="#142331" strokeWidth="3" />
                <path d="M18 32H148M18 58H148M18 84H148M52 14V94M92 14V94M132 14V94" stroke="#2C4654" strokeWidth="1.5" />
                <rect x="60" y="14" width="38" height="22" rx="4" fill="#38C6BA" stroke="#142331" strokeWidth="2" />
                <rect x="98" y="14" width="34" height="22" rx="4" fill="#A8E5D5" stroke="#142331" strokeWidth="2" />
                <path d="M22 40H56V86H22Z" fill="#F59E0B" stroke="#142331" strokeWidth="2" />
                <path d="M56 64H84V86H22" fill="none" stroke="#F59E0B" strokeWidth="2" />
                <rect x="98" y="64" width="44" height="22" rx="4" fill="#93D1F2" stroke="#142331" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>
      </Card>

      {/* Row 2: Continue Playing / Featured + Daily Puzzle + Challenge Run */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <Card surface="primary" padding="none" className="lg:col-span-5 overflow-hidden flex flex-col sm:flex-row">
          <div className="flex-1 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#F5F7F8]">
                {lastPuzzleMeta ? 'Continue Playing' : 'Featured Puzzle'}
              </h2>
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-lg bg-[#E9EEE8] border border-[#36515F] overflow-hidden shrink-0">
                  <PuzzleCoverArt
                    type={(lastPuzzleMeta || featuredPuzzle).id}
                    variant="light"
                    className="w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#F5F7F8] truncate">
                    {(lastPuzzleMeta || featuredPuzzle).name}
                  </p>
                  <p className="text-xs text-[#B4C3CE] line-clamp-2 mt-0.5">
                    {(lastPuzzleMeta || featuredPuzzle).description}
                  </p>
                </div>
              </div>
            </div>

            <div>
              {lastSession && lastPuzzleMeta ? (
                <Button variant="outline" size="sm" onClick={() => startReplaySession(lastSession)}>
                  <span>Continue</span>
                </Button>
              ) : (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => playGame(featuredPuzzle.id, getRecommendedDifficulty(featuredPuzzle.id))}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Now</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card surface="ivory" padding="none" className="lg:col-span-4 overflow-hidden flex items-stretch justify-between">
          <div className="flex-1 p-5 flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#142331]">
                <Calendar className="w-4 h-4 text-[#087F8C] shrink-0" />
                <h2 className="text-lg font-bold">Daily Puzzle</h2>
              </div>
              <p className="text-xs text-[#526575]">A new puzzle every day.</p>
              <p className="text-xs font-bold text-[#066B75] truncate">Today: {todayPuzzle.name}</p>
            </div>

            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => playGame(todayPuzzle.id, 'medium', undefined, true)}
              >
                <span>Play Today</span>
              </Button>
            </div>
          </div>

          <div className="w-28 flex items-end justify-end pr-2.5 pb-2.5 shrink-0" aria-hidden="true">
            <svg viewBox="0 0 130 110" className="w-full h-auto select-none">
              <polygon points="10,104 42,72 74,104" fill="#F59E0B" />
              <polygon points="42,72 74,104 74,40" fill="#087F8C" />
              <polygon points="74,40 106,72 74,104" fill="#38C6BA" />
              <polygon points="74,40 106,12 106,40" fill="#F59E0B" />
              <polygon points="106,12 122,28 106,40" fill="#93D1F2" />
            </svg>
          </div>
        </Card>

        {/* Challenge Run Card */}
        <Card surface="primary" padding="md" className="lg:col-span-3 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#F5F7F8]">
              <Flame className="w-4 h-4 text-[#38C6BA] shrink-0" />
              <h2 className="text-lg font-bold">Challenge Run</h2>
            </div>
            <p className="text-xs text-[#B4C3CE] leading-relaxed">
              {challengeMeta.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="accent"
              size="sm"
              onClick={() => playGame('challenge_mode', 'medium')}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Run</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('challenges')}>
              <span>Duels</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Row 3: Personal Progress + Current Player Global Rank */}
      <Card surface="ivory" padding="md" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D7F1EC] border border-[#087F8C]/30 flex items-center justify-center text-[#087F8C] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#142331]">
              Personal Progress · Level {level}
            </h2>
            <p className="text-xs font-semibold text-[#526575] font-tabular">
              {xpIntoLevel} / 250 XP to Level {level + 1}
              {streakDays > 0 ? ` · ${formatCount(streakDays, 'day')} streak` : ''}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-md w-full">
          <div className="w-full h-3 bg-[#D5DEDB] rounded-md overflow-hidden">
            <div
              className="h-full bg-[#087F8C] rounded-md transition-all duration-300"
              style={{ width: `${Math.max(8, xpProgress)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-[#E9EEE8] border border-[#D5DEDB] flex items-center gap-2 text-xs font-tabular">
            <Trophy className="w-3.5 h-3.5 text-[#087F8C]" />
            <span className="font-bold text-[#142331]">
              {!isOnline || isGuest
                ? 'Global Rank: Offline'
                : globalRank.rank
                ? `Global Rank #${globalRank.rank}`
                : 'Global Rank: Unranked'}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('mastery')}
            className="text-xs font-bold text-[#066B75] hover:text-[#142331] transition-colors"
          >
            Progress Details →
          </button>
        </div>
      </Card>

      {/* Row 4: Complete 16-Game Landscape Catalog Grid */}
      <Card surface="ivory" padding="md" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#142331]">
            <LayoutGrid className="w-5 h-5 text-[#087F8C]" />
            <h2 className="text-lg sm:text-xl font-bold">All 16 Puzzle Games</h2>
          </div>
          <button
            onClick={() => setActiveTab('games')}
            className="text-xs sm:text-sm font-bold text-[#066B75] hover:text-[#142331] inline-flex items-center gap-1 transition-colors"
          >
            <span>Open Full Library</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PUZZLE_MODES.map((game) => {
            const pb = user?.personalBests?.[game.id];
            return (
              <button
                key={game.id}
                onClick={() => playGame(game.id, getRecommendedDifficulty(game.id))}
                className="group text-left bg-[#E9EEE8] hover:bg-[#DFE8E4] border border-[#D5DEDB] hover:border-[#087F8C] rounded-xl overflow-hidden flex items-stretch transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F8C]"
              >
                <div className="w-24 shrink-0 bg-[#E9EEE8] border-r border-[#D5DEDB] overflow-hidden">
                  <PuzzleCoverArt type={game.id} variant="light" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0 p-3 bg-white/80 flex flex-col justify-between gap-1.5">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-[#142331] truncate">
                        {game.name}
                      </span>
                      <Play className="w-3.5 h-3.5 text-[#087F8C] shrink-0 fill-current opacity-80 group-hover:opacity-100" />
                    </div>
                    <p className="text-[11px] font-semibold text-[#526575]">
                      {game.category === 'Spatial & Grid' ? 'Spatial' : game.category}
                    </p>
                  </div>
                  <p className="text-[11px] font-semibold text-[#066B75] font-tabular">
                    {pb && pb.bestScore > 0 ? `Best: ${pb.bestScore} pts` : 'Play now'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
