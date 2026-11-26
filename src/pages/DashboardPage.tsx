import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';
import { getRecommendedPuzzles } from '../services/recommendation';
import { calculateUserMasteryProfile } from '../data/masteryData';
import {
  fetchPersonalBestHistory,
  fetchUserRecentGameSessions,
  fetchUserChallenges,
  fetchPuzzleEvents,
} from '../services/firebase';
import {
  PersonalBestHistoryItem,
  GameSession,
  ChallengeItem,
  PuzzleEvent,
} from '../types';
import {
  Play,
  Flame,
  Calendar,
  ChevronRight,
  Award,
  Swords,
  Heart,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, Badge } from '../components/ui/Card';
import { PuzzleArt, PuzzleCoverArt, PUZZLE_CATEGORY_ACCENT } from '../components/PuzzleArt';

export const DashboardPage: React.FC = () => {
  const {
    user,
    playGame,
    setActiveTab,
    getRecommendedDifficulty,
    startReplaySession,
    viewEventDetail,
    viewPuzzleGuide,
  } = useStore();

  const [pbHistory, setPbHistory] = useState<PersonalBestHistoryItem[]>([]);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeItem[]>([]);
  const [activeEvents, setActiveEvents] = useState<PuzzleEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchPersonalBestHistory(user.uid, undefined, 4).then(setPbHistory).catch(() => {});
    fetchUserRecentGameSessions(user.uid, 4).then(setRecentSessions).catch(() => {});
    fetchUserChallenges(user.uid)
      .then((list) => setActiveChallenges(list.filter((c) => c.status !== 'COMPLETED').slice(0, 2)))
      .catch(() => {});
    fetchPuzzleEvents()
      .then((evs) => setActiveEvents(evs.filter((e) => e.status === 'active').slice(0, 2)))
      .catch(() => {});
  }, [user]);

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpIntoLevel = xp % 250;
  const xpProgress = Math.min(100, Math.round((xpIntoLevel / 250) * 100));
  const unlockedAchievementsCount = Object.values(user?.achievements || {}).filter(Boolean).length;

  const masteryProfile = calculateUserMasteryProfile(user);
  const recommendedPuzzles = getRecommendedPuzzles(user, 3);
  const lastSession = recentSessions[0] || null;
  const lastPuzzleMeta = lastSession
    ? PUZZLE_MODES.find((p) => p.id === lastSession.puzzleType)
    : null;

  const favoriteModes = (user?.favoriteGameTypes || [])
    .map((id) => PUZZLE_MODES.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const topMasteries = Object.entries(masteryProfile.records)
    .filter(([, rec]) => rec.xp > 0)
    .sort((a, b) => b[1].xp - a[1].xp)
    .slice(0, 3)
    .map(([gameId, rec]) => ({
      gameMeta: PUZZLE_MODES.find((m) => m.id === gameId),
      record: rec,
    }))
    .filter((m) => m.gameMeta);

  // Deterministic Daily Puzzle
  const now = new Date();
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(now.getFullYear(), 0, 0)) /
      86400000
  );
  const eligibleDaily = PUZZLE_MODES.filter((p) => p.id !== 'challenge_mode');
  const todayPuzzle = eligibleDaily[dayOfYear % eligibleDaily.length] || eligibleDaily[0];

  const featuredPuzzle = lastPuzzleMeta || recommendedPuzzles[0] || todayPuzzle;
  const featuredDiff = lastSession?.difficulty || getRecommendedDifficulty(featuredPuzzle.id);
  const featuredPB = user?.personalBests?.[featuredPuzzle.id];
  const firstName = user?.displayName?.split(' ')[0] || 'Player';
  const winRate =
    user && user.totalGames > 0 ? Math.round((user.totalWins / user.totalGames) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Compact Player Studio Header + Telemetry Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#342D3D]">
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#9F97AB]">
            PuzzleVerse Studio · Welcome back, {firstName}
          </p>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#F5F3F7] tracking-tight mt-0.5">
            Ready to play
          </h1>
        </div>

        {/* Inline Telemetry Ribbon */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[#16131C] border border-[#342D3D] rounded-xl px-3.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 pr-3 border-r border-[#342D3D]">
            <span className="text-[#9F97AB]">Played</span>
            <span className="font-semibold text-[#F5F3F7] font-tabular">{user?.totalGames || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 pr-3 border-r border-[#342D3D]">
            <span className="text-[#9F97AB]">Win rate</span>
            <span className="font-semibold text-[#34D399] font-tabular">{winRate}%</span>
          </div>
          <div className="flex items-center gap-1.5 pr-3 border-r border-[#342D3D]">
            <span className="text-[#9F97AB]">Best</span>
            <span className="font-semibold text-[#F5F3F7] font-tabular">{user?.bestScore || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF4696]" />
            <span className="font-semibold text-[#F5F3F7] font-tabular">{user?.currentStreak || 1}d</span>
          </div>
        </div>
      </div>

      {/* Above-the-Fold Featured Stage + Daily Challenge Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Featured Launch Card (8 cols) */}
        <Card
          surface="featured"
          padding="none"
          className="lg:col-span-8 border-[#494052] overflow-hidden grid grid-cols-1 md:grid-cols-12"
        >
          <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">
                  {lastSession ? 'Continue playing' : 'Featured puzzle'}
                </Badge>
                <Badge variant="neutral">{featuredPuzzle.category}</Badge>
                <Badge variant="neutral" className="capitalize">
                  {featuredDiff}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#F5F3F7] tracking-tight">
                {featuredPuzzle.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#C5BFD0] leading-relaxed line-clamp-2">
                {featuredPuzzle.description}
              </p>
            </div>

            <div className="space-y-3">
              {lastSession ? (
                <p className="text-xs text-[#9F97AB] font-tabular">
                  Last run: <span className="text-[#F5F3F7] font-medium">{lastSession.score} pts</span> in{' '}
                  <span className="text-[#F5F3F7] font-medium">{lastSession.timeSeconds}s</span>
                  {featuredPB?.bestScore ? ` · PB ${featuredPB.bestScore} pts` : ''}
                </p>
              ) : (
                <p className="text-xs text-[#9F97AB] font-tabular">
                  Adaptive tier: <span className="text-[#F5F3F7] capitalize font-medium">{featuredDiff}</span> · 16 disciplines live
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => playGame(featuredPuzzle.id, featuredDiff)}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{lastSession ? `Play ${featuredPuzzle.name}` : `Launch ${featuredPuzzle.name}`}</span>
                </Button>
                {lastSession && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => startReplaySession(lastSession)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay seed</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => viewPuzzleGuide(featuredPuzzle.id)}
                  aria-label={`View rules for ${featuredPuzzle.name}`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Rules</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Live Bespoke Vector Art Preview */}
          <div className="md:col-span-5 bg-[#14111A] border-t md:border-t-0 md:border-l border-[#342D3D] min-h-[160px] flex items-center justify-center relative">
            <PuzzleCoverArt type={featuredPuzzle.id} className="w-full h-full object-cover" />
          </div>
        </Card>

        {/* Daily Challenge Ticket (4 cols) */}
        <Card padding="none" className="lg:col-span-4 flex flex-col justify-between overflow-hidden">
          <div className="h-24 border-b border-[#342D3D] relative overflow-hidden">
            <PuzzleCoverArt type={todayPuzzle.id} />
            <div className="absolute top-2.5 left-3">
              <Badge variant="accent">
                <Calendar className="w-3 h-3" />
                <span>Daily Puzzle</span>
              </Badge>
            </div>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-[#F5F3F7] truncate">{todayPuzzle.name}</h2>
                <button
                  onClick={() => setActiveTab('daily')}
                  className="text-xs text-[#9F97AB] hover:text-[#F5F3F7] inline-flex items-center gap-0.5 shrink-0 transition-colors"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#C5BFD0] mt-1 line-clamp-2">{todayPuzzle.description}</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#342D3D]">
              <div className="text-[11px] font-mono text-[#34D399]">2x XP · +50 coins</div>
              <Button variant="secondary" size="sm" onClick={() => playGame(todayPuzzle.id, 'medium')}>
                Play daily
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content + Tactical Progression Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Primary 8 Columns: Game Discovery Shelves */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recommended Discovery Shelf (with bespoke artwork banners) */}
          <section aria-labelledby="recommended-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="recommended-heading" className="text-sm font-semibold text-[#F5F3F7]">
                Recommended for you
              </h2>
              <button
                onClick={() => setActiveTab('games')}
                className="text-xs text-[#9F97AB] hover:text-[#F5F3F7] inline-flex items-center gap-1 transition-colors"
              >
                <span>All 16 puzzles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendedPuzzles.map((p) => {
                const diff = getRecommendedDifficulty(p.id);
                const pb = user?.personalBests?.[p.id];
                const catStyle = PUZZLE_CATEGORY_ACCENT[p.category];
                return (
                  <Card key={p.id} padding="none" interactive className="flex flex-col justify-between overflow-hidden group">
                    <div>
                      <div className="h-24 border-b border-[#342D3D] relative overflow-hidden bg-[#14111A]">
                        <PuzzleCoverArt type={p.id} />
                        <span
                          className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize ${
                            catStyle?.badge || 'bg-[#16131C] text-[#C5BFD0] border-[#342D3D]'
                          }`}
                        >
                          {diff}
                        </span>
                      </div>
                      <div className="p-4 pb-3">
                        <h3 className="text-[15px] font-semibold text-[#F5F3F7]">{p.name}</h3>
                        <p className="text-xs text-[#C5BFD0] mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-[#342D3D] flex items-center justify-between bg-[#16131C]/60">
                      <span className="text-xs text-[#9F97AB] font-tabular">
                        {pb?.bestScore ? `Best ${pb.bestScore}` : p.category}
                      </span>
                      <Button variant="secondary" size="sm" onClick={() => playGame(p.id, diff)}>
                        Play
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Favorite Puzzles Shelf */}
          {favoriteModes.length > 0 && (
            <section aria-labelledby="favorites-heading">
              <div className="flex items-center justify-between mb-3">
                <h2 id="favorites-heading" className="text-sm font-semibold text-[#F5F3F7] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#FF4696]" />
                  <span>Favorite puzzles</span>
                </h2>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-xs text-[#9F97AB] hover:text-[#F5F3F7] transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoriteModes.map((p) => {
                  const pb = user?.personalBests?.[p.id];
                  return (
                    <Card key={p.id} padding="sm" interactive className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#24202C] border border-[#342D3D] flex items-center justify-center shrink-0">
                          <PuzzleArt type={p.id} size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F5F3F7] truncate">{p.name}</p>
                          <p className="text-xs text-[#9F97AB] font-tabular">
                            {pb?.bestScore ? `Best: ${pb.bestScore} pts` : p.category}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => playGame(p.id, getRecommendedDifficulty(p.id))}>
                        Play
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recently Played Matches */}
          {recentSessions.length > 0 && (
            <section aria-labelledby="recent-matches-heading">
              <div className="flex items-center justify-between mb-3">
                <h2 id="recent-matches-heading" className="text-sm font-semibold text-[#F5F3F7]">
                  Recent runs
                </h2>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-xs text-[#9F97AB] hover:text-[#F5F3F7] transition-colors"
                >
                  Full history
                </button>
              </div>
              <Card padding="none" className="divide-y divide-[#342D3D]">
                {recentSessions.slice(0, 3).map((s, idx) => {
                  const meta = PUZZLE_MODES.find((m) => m.id === s.puzzleType);
                  if (!meta) return null;
                  return (
                    <div key={s.id || idx} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-[#24202C] border border-[#342D3D] flex items-center justify-center shrink-0">
                          <PuzzleArt type={meta.id} size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F5F3F7] truncate">{meta.name}</p>
                          <p className="text-[11px] text-[#9F97AB] capitalize font-tabular">
                            {s.difficulty} · {s.timeSeconds}s · {s.score} pts
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => startReplaySession(s)}>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Replay</span>
                      </Button>
                    </div>
                  );
                })}
              </Card>
            </section>
          )}
        </div>

        {/* Right Tactical Sidebar (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Player Progression */}
          <section aria-labelledby="progression-heading">
            <h2 id="progression-heading" className="text-sm font-semibold text-[#F5F3F7] mb-3">
              Player progression
            </h2>
            <Card padding="md" className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#F5F3F7]">Level {level}</span>
                  <span className="text-[#9F97AB] font-tabular">{xpIntoLevel} / 250 XP</span>
                </div>
                <div className="w-full bg-[#110F15] h-2 rounded-sm overflow-hidden border border-[#342D3D]">
                  <div
                    className="bg-[#FF4696] h-full transition-all duration-300"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#342D3D] text-xs">
                <div>
                  <span className="text-[#9F97AB] block">Total XP</span>
                  <span className="font-semibold text-[#F5F3F7] font-tabular">{xp}</span>
                </div>
                <div>
                  <span className="text-[#9F97AB] block">Coins</span>
                  <span className="font-semibold text-[#F5F3F7] font-tabular">{user?.coins || 0}</span>
                </div>
                <div>
                  <span className="text-[#9F97AB] block">Badges</span>
                  <span className="font-semibold text-[#F5F3F7] font-tabular">{unlockedAchievementsCount}</span>
                </div>
              </div>

              {topMasteries.length > 0 && (
                <div className="pt-3 border-t border-[#342D3D] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#C5BFD0]">Top mastery</span>
                    <button
                      onClick={() => setActiveTab('mastery')}
                      className="text-xs text-[#9F97AB] hover:text-[#F5F3F7] transition-colors"
                    >
                      View all
                    </button>
                  </div>
                  {topMasteries.map((m, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#C5BFD0] truncate">{m.gameMeta?.name}</span>
                        <span className="text-[#9F97AB] font-tabular">Lv.{m.record.level}</span>
                      </div>
                      <div className="w-full bg-[#110F15] h-1 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-[#FF4696]"
                          style={{ width: `${Math.min(100, (m.record.xp % 100) || 10)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#342D3D] flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="text-xs font-medium text-[#C5BFD0] hover:text-[#F5F3F7] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-[#FF4696]" />
                  <span>Achievements</span>
                </button>
                <button
                  onClick={() => setActiveTab('goals')}
                  className="text-xs font-medium text-[#C5BFD0] hover:text-[#F5F3F7] transition-colors"
                >
                  Daily goals
                </button>
              </div>
            </Card>
          </section>

          {/* Recent Personal Bests */}
          <section aria-labelledby="records-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="records-heading" className="text-sm font-semibold text-[#F5F3F7]">
                Recent records
              </h2>
              <button
                onClick={() => setActiveTab('profile')}
                className="text-xs text-[#9F97AB] hover:text-[#F5F3F7] transition-colors"
              >
                History
              </button>
            </div>
            <Card padding="none" className="divide-y divide-[#342D3D]">
              {pbHistory.length > 0 ? (
                pbHistory.map((pb) => {
                  const meta = PUZZLE_MODES.find((m) => m.id === pb.puzzleType);
                  return (
                    <div key={pb.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F5F3F7] truncate">
                          {meta?.name || pb.puzzleType}
                        </p>
                        <p className="text-[11px] text-[#9F97AB] capitalize font-tabular">
                          {pb.difficulty} · {pb.timeSeconds}s
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#F5F3F7] font-tabular shrink-0">
                        {pb.score}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-xs text-[#9F97AB]">
                  No personal bests yet. Complete a puzzle to record your first score.
                </div>
              )}
            </Card>
          </section>

          {/* Active Challenges & Events */}
          {(activeChallenges.length > 0 || activeEvents.length > 0) && (
            <section aria-labelledby="events-heading">
              <h2 id="events-heading" className="text-sm font-semibold text-[#F5F3F7] mb-3">
                Active challenges &amp; events
              </h2>
              <Card padding="none" className="divide-y divide-[#342D3D]">
                {activeChallenges.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveTab('challenges')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-[#24202C] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Swords className="w-4 h-4 text-[#FF4696] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F5F3F7] truncate">
                          Duel vs {ch.opponentName || ch.creatorName}
                        </p>
                        <p className="text-[11px] text-[#9F97AB] capitalize">
                          {ch.puzzleType.replace('_', ' ')} · {ch.status.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9F97AB] shrink-0" />
                  </button>
                ))}
                {activeEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => viewEventDetail(ev.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-[#24202C] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className="w-4 h-4 text-[#C5BFD0] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F5F3F7] truncate">{ev.name}</p>
                        <p className="text-[11px] text-[#9F97AB]">Active event</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9F97AB] shrink-0" />
                  </button>
                ))}
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
