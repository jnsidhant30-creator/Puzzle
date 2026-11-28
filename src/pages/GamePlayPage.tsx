import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';

const NumberPuzzle = lazy(() => import('../games/NumberPuzzle').then((m) => ({ default: m.NumberPuzzle })));
const WordPuzzle = lazy(() => import('../games/WordPuzzle').then((m) => ({ default: m.WordPuzzle })));
const MemoryPuzzle = lazy(() => import('../games/MemoryPuzzle').then((m) => ({ default: m.MemoryPuzzle })));
const SlidingPuzzle = lazy(() => import('../games/SlidingPuzzle').then((m) => ({ default: m.SlidingPuzzle })));
const LogicPuzzle = lazy(() => import('../games/LogicPuzzle').then((m) => ({ default: m.LogicPuzzle })));
const PatternPuzzle = lazy(() => import('../games/PatternPuzzle').then((m) => ({ default: m.PatternPuzzle })));
const PipeConnect = lazy(() => import('../games/PipeConnect').then((m) => ({ default: m.PipeConnect })));
const ColorPath = lazy(() => import('../games/ColorPath').then((m) => ({ default: m.ColorPath })));
const BlockEscape = lazy(() => import('../games/BlockEscape').then((m) => ({ default: m.BlockEscape })));
const NumberPath = lazy(() => import('../games/NumberPath').then((m) => ({ default: m.NumberPath })));
const RotatingTiles = lazy(() => import('../games/RotatingTiles').then((m) => ({ default: m.RotatingTiles })));
const WordGrid = lazy(() => import('../games/WordGrid').then((m) => ({ default: m.WordGrid })));
const ArrowPath = lazy(() => import('../games/ArrowPath').then((m) => ({ default: m.ArrowPath })));
const MazeEscape = lazy(() => import('../games/MazeEscape').then((m) => ({ default: m.MazeEscape })));
const LaserMirror = lazy(() => import('../games/LaserMirror').then((m) => ({ default: m.LaserMirror })));
const ChallengeMode = lazy(() => import('../games/ChallengeMode').then((m) => ({ default: m.ChallengeMode })));
import {
  saveGameSession,
  getPuzzleEventById,
  processEventResult,
  processChallengeResult,
  updateUserGoalProgress,
  fetchPuzzleCollectionById,
  updateCollectionPuzzleProgress,
  processJourneyStageCompletion,
  processPracticeChallengeCompletion,
} from '../services/firebase';
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Award,
  Flame,
  Compass,
  BookOpen,
  Target,
  Pause,
  Play,
  Share2,
  X,
} from 'lucide-react';
import { getPlatformAdapter } from '../platform/adapter';
import { Button } from '../components/ui/Button';
import { Badge, Card } from '../components/ui/Card';
import { PuzzleCoverArt } from '../components/PuzzleArt';
import { DEFAULT_PUZZLE_GUIDES } from '../data/learnData';
import { Difficulty } from '../types';

export const GamePlayPage: React.FC = () => {
  const {
    selectedPuzzle,
    selectedDifficulty,
    selectedSeed,
    selectedEventId,
    activeChallengeId,
    selectedCollectionId,
    activeCollectionIndex,
    selectedJourneyStageId,
    activePracticeChallenge,
    isReplayAttempt,
    isDailySession,
    setActiveTab,
    viewCollectionDetail,
    viewPuzzleGuide,
    user,
    isGuest,
    isOnline,
    addXPAndCoins,
    useHint,
    pbToast,
    closePbToast,
  } = useStore();

  const [isCompleting, setIsCompleting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [didPause, setDidPause] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const stageWrapperRef = useRef<HTMLDivElement>(null);

  const isCompetitiveOrTimed = Boolean(
    activeChallengeId || selectedEventId || isDailySession || selectedPuzzle === 'challenge_mode'
  );

  useEffect(() => {
    if (isCompetitiveOrTimed) {
      setIsPaused(false);
    }
  }, [isCompetitiveOrTimed, selectedPuzzle]);

  useEffect(() => {
    if (stageWrapperRef.current) {
      (stageWrapperRef.current as HTMLDivElement & { inert: boolean }).inert = isPaused;
    }
  }, [isPaused]);

  useEffect(() => {
    const handleEscapeToggle = () => {
      if (!isCompetitiveOrTimed && !isCompleting) {
        setIsPaused((prev) => {
          const next = !prev;
          if (next) setDidPause(true);
          return next;
        });
      }
    };
    window.addEventListener('pv:escape-game', handleEscapeToggle);
    return () => window.removeEventListener('pv:escape-game', handleEscapeToggle);
  }, [isCompetitiveOrTimed, isCompleting]);

  const [winResult, setWinResult] = useState<{
    score: number;
    timeSeconds: number;
    won: boolean;
    xpAwarded: number;
    coinsAwarded: number;
    isPB?: boolean;
    pbDiffMsg?: string;
    eventPointsGained?: number;
    isEventCompleted?: boolean;
    challengeCompleted?: boolean;
    challengeWinnerName?: string;
    collectionCompleted?: boolean;
    collectionNextIndex?: number;
    collectionTotal?: number;
    journeyCompleted?: boolean;
    journeyStageClearedId?: string;
    practiceCompleted?: boolean;
    practiceRewardXP?: number;
    practiceRewardCoins?: number;
  } | null>(null);

  if (!selectedPuzzle) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-[#B4C3CE]">No puzzle selected.</p>
        <Button variant="primary" onClick={() => setActiveTab('games')}>
          Open Games
        </Button>
      </div>
    );
  }

  const puzzleInfo = PUZZLE_MODES.find((p) => p.id === selectedPuzzle);
  const currentIdx = PUZZLE_MODES.findIndex((p) => p.id === selectedPuzzle);
  const nextSuggestedPuzzle =
    PUZZLE_MODES[(currentIdx + 1) % PUZZLE_MODES.length] || PUZZLE_MODES[0];

  const handleComplete = async (score: number, timeSeconds: number, won: boolean) => {
    if (isPaused || isCompleting || winResult) return;
    setIsCompleting(true);
    try {
      const baseXp = won
        ? selectedDifficulty === 'easy'
          ? 50
          : selectedDifficulty === 'medium'
          ? 100
          : 200
        : 10;
      const xpEarned = isReplayAttempt ? 0 : baseXp;

      const { isPB, pbDiffMsg, coinsAwarded } = await addXPAndCoins(
        xpEarned,
        score,
        timeSeconds,
        won
      );
      let eventPointsGained: number | undefined = undefined;
      let isEventCompleted: boolean | undefined = undefined;
      let challengeCompleted: boolean | undefined = undefined;
      let challengeWinnerName: string | undefined = undefined;

      const sessionData = {
        userId: user?.uid || 'guest',
        username: user?.displayName || 'Guest Player',
        puzzleType: selectedPuzzle,
        difficulty: selectedDifficulty,
        score,
        timeSeconds,
        moves: 0,
        won,
        isReplay: isReplayAttempt,
        ...(selectedSeed !== undefined ? { puzzleSeed: selectedSeed } : {}),
        createdAt: new Date().toISOString(),
      };

      if (selectedEventId && user) {
        try {
          const ev = await getPuzzleEventById(selectedEventId);
          if (ev && ev.eligibleGames.includes(selectedPuzzle)) {
            const res = await processEventResult(user.uid, selectedEventId, sessionData, ev);
            eventPointsGained = res.eventScoreGained;
            isEventCompleted = res.isEventCompleted;
          }
        } catch (err) {
          console.error('Event processing error:', err);
        }
      }

      if (activeChallengeId && user) {
        try {
          const chRes = await processChallengeResult(
            activeChallengeId,
            user.uid,
            user.displayName,
            score,
            timeSeconds
          );
          challengeCompleted = chRes.isCompleted;
          challengeWinnerName = chRes.winnerName;
          await updateUserGoalProgress(user.uid, 'challenges', 1);
        } catch (err) {
          console.error('Challenge result processing error:', err);
        }
      }

      let collectionCompleted: boolean | undefined = undefined;
      let collectionNextIndex: number | undefined = undefined;
      let collectionTotal: number | undefined = undefined;

      if (selectedCollectionId && user && won) {
        try {
          const colData = await fetchPuzzleCollectionById(selectedCollectionId);
          if (colData) {
            collectionTotal = colData.items.length;
            const colRes = await updateCollectionPuzzleProgress(
              user.uid,
              selectedCollectionId,
              activeCollectionIndex,
              colData.items.length,
              colData.rewardXP,
              colData.rewardCoins
            );
            collectionCompleted = colRes.isCompletedNow;
            if (activeCollectionIndex + 1 < colData.items.length) {
              collectionNextIndex = activeCollectionIndex + 1;
            }
          }
        } catch (err) {
          console.error('Collection progress update error:', err);
        }
      }

      let journeyCompleted = false;
      let journeyStageClearedId: string | undefined = undefined;
      if (selectedJourneyStageId && user && won) {
        try {
          const stageRes = await processJourneyStageCompletion(
            user.uid,
            selectedJourneyStageId,
            100,
            50
          );
          journeyCompleted = stageRes.isFirstCompletion;
          journeyStageClearedId = selectedJourneyStageId;
        } catch (err) {
          console.error('Journey stage progress error:', err);
        }
      }

      let practiceCompleted = false;
      let practiceRewardXP: number | undefined = undefined;
      let practiceRewardCoins: number | undefined = undefined;
      if (activePracticeChallenge && user && won) {
        try {
          const pracRes = await processPracticeChallengeCompletion(
            user.uid,
            activePracticeChallenge.id,
            activePracticeChallenge.rewardXP,
            activePracticeChallenge.rewardCoins
          );
          practiceCompleted = pracRes.isFirstCompletion;
          practiceRewardXP = activePracticeChallenge.rewardXP;
          practiceRewardCoins = activePracticeChallenge.rewardCoins;
        } catch (err) {
          console.error('Practice challenge error:', err);
        }
      }

      if (user) {
        updateUserGoalProgress(user.uid, 'games', 1);
        if (won) {
          updateUserGoalProgress(user.uid, 'score', score);
          if (timeSeconds <= 45) {
            updateUserGoalProgress(user.uid, 'speed', 1);
          }
        }
      }

      getPlatformAdapter().haptics(won ? 'medium' : 'light').catch(() => {});

      setWinResult({
        score,
        timeSeconds,
        won,
        xpAwarded: xpEarned,
        coinsAwarded,
        isPB,
        pbDiffMsg,
        eventPointsGained,
        isEventCompleted,
        challengeCompleted,
        challengeWinnerName,
        collectionCompleted,
        collectionNextIndex,
        collectionTotal,
        journeyCompleted,
        journeyStageClearedId,
        practiceCompleted,
        practiceRewardXP,
        practiceRewardCoins,
      });

      if (user) {
        saveGameSession(sessionData, didPause);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const renderGameEngine = () => {
    const props = {
      difficulty: selectedDifficulty,
      onComplete: handleComplete,
      useHint,
      hintsLeft: user?.hints || 0,
      seed: selectedSeed,
      isPaused,
    };
    switch (selectedPuzzle) {
      case 'number':
        return <NumberPuzzle key={resetKey} {...props} />;
      case 'word':
        return <WordPuzzle key={resetKey} {...props} />;
      case 'memory':
        return <MemoryPuzzle key={resetKey} {...props} />;
      case 'sliding':
        return <SlidingPuzzle key={resetKey} {...props} />;
      case 'logic':
        return <LogicPuzzle key={resetKey} {...props} />;
      case 'pattern':
        return <PatternPuzzle key={resetKey} {...props} />;
      case 'pipe':
        return <PipeConnect key={resetKey} {...props} />;
      case 'color_path':
        return <ColorPath key={resetKey} {...props} />;
      case 'block_escape':
        return <BlockEscape key={resetKey} {...props} />;
      case 'number_path':
        return <NumberPath key={resetKey} {...props} />;
      case 'rotating_tiles':
        return <RotatingTiles key={resetKey} {...props} />;
      case 'word_grid':
        return <WordGrid key={resetKey} {...props} />;
      case 'arrow_path':
        return <ArrowPath key={resetKey} {...props} />;
      case 'maze_escape':
        return <MazeEscape key={resetKey} {...props} />;
      case 'laser_mirror':
        return <LaserMirror key={resetKey} {...props} />;
      case 'challenge_mode':
        return <ChallengeMode key={resetKey} {...props} />;
      default:
        return <NumberPuzzle key={resetKey} {...props} />;
    }
  };

  const currentPB = user?.personalBests?.[selectedPuzzle];
  const guide = DEFAULT_PUZZLE_GUIDES.find((g) => g.puzzleType === selectedPuzzle);
  const playGame = useStore((s) => s.playGame);

  return (
    <div className="space-y-2.5 sm:space-y-4 animate-fade-in pv-gameplay-shell">
      {/* Focused Arena Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-[#36515F] pv-gameplay-topbar">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (winResult) {
              setActiveTab('games');
            } else {
              setShowExitConfirm(true);
            }
          }}
          className="-ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games</span>
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-[#F5F7F8]">
            {puzzleInfo?.name}
          </h1>
          <Badge variant="neutral" className="capitalize">
            {selectedDifficulty}
          </Badge>
          {isReplayAttempt && <Badge variant="accent">Replay</Badge>}
          {(!isOnline || isGuest) && (
            <Badge variant="warning">Offline Practice · Unranked</Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={isCompetitiveOrTimed || Boolean(winResult)}
            onClick={() => {
              if (!isCompetitiveOrTimed && !winResult) {
                setIsPaused((p) => {
                  const next = !p;
                  if (next) setDidPause(true);
                  return next;
                });
              }
            }}
            title={
              isCompetitiveOrTimed
                ? 'Pause disabled in daily, competitive, and timed modes'
                : isPaused
                ? 'Resume match'
                : 'Pause timer and board'
            }
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isCompetitiveOrTimed ? 'No Pause' : isPaused ? 'Resume' : 'Pause'}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => viewPuzzleGuide(selectedPuzzle)}
            title="How to play"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Rules</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsPaused(false);
              setDidPause(false);
              setWinResult(null);
              setResetKey((k) => k + 1);
            }}
            title="Restart puzzle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Board-Dominant Arena Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Interactive Board Stage (9 cols desktop -> dominant focus) */}
        <div className="lg:col-span-9 pv-board-matte border border-[#36515F] rounded-xl p-2.5 sm:p-6 min-h-[240px] sm:min-h-[340px] lg:min-h-[540px] flex items-center justify-center relative overflow-hidden pv-gameplay-stage">
          <div
            ref={stageWrapperRef}
            aria-hidden={isPaused}
            className={isPaused ? 'w-full invisible pointer-events-none select-none' : 'w-full'}
          >
            <Suspense
              fallback={
                <div className="flex flex-col items-center gap-2 text-xs text-[#B4C3CE]">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#36515F] border-t-[#38C6BA]" />
                  <span>Loading puzzle...</span>
                </div>
              }
            >
              {renderGameEngine()}
            </Suspense>
          </div>

          {isPaused && !isCompetitiveOrTimed && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Match paused"
              className="absolute inset-0 z-20 bg-[#142331] flex flex-col items-center justify-center gap-4 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#233D4A] border border-[#36515F] flex items-center justify-center text-[#38C6BA]">
                <Pause className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5F7F8]">Match paused</h2>
                <p className="text-xs sm:text-sm text-[#B4C3CE] mt-1 max-w-sm">
                  Gameplay timer and board inputs are paused. Pausing excludes this run from leaderboard ranking to prevent timer exploits.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Button variant="primary" size="md" onClick={() => setIsPaused(false)}>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume match</span>
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setIsPaused(false);
                    setActiveTab('games');
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Exit to Games</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Clean Compact Side Controls (3 cols desktop) */}
        <aside aria-label="Game Settings" className="lg:col-span-3 space-y-4">
          <Card surface="ivory" padding="none" className="overflow-hidden">
            <div className="h-24 border-b border-[#D5DEDB] relative bg-[#E9EEE8]">
              <PuzzleCoverArt type={selectedPuzzle} variant="light" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[#526575] font-semibold">Personal best</span>
                <span className="font-bold text-[#142331] font-tabular">
                  {currentPB && currentPB.bestScore > 0
                    ? `${currentPB.bestScore} pts`
                    : 'Not played'}
                </span>
              </div>

              {!activeChallengeId && !selectedEventId && !selectedCollectionId && !selectedJourneyStageId && !isReplayAttempt && (
                <div className="pt-2 border-t border-[#D5DEDB]">
                  <span className="block text-xs font-bold text-[#142331] mb-1.5">
                    Difficulty
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-[#E9EEE8] p-1 rounded-lg border border-[#D5DEDB]">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          if (d !== selectedDifficulty) {
                            setIsPaused(false);
                            setWinResult(null);
                            playGame(selectedPuzzle, d);
                            setResetKey((k) => k + 1);
                          }
                        }}
                        className={`py-1.5 rounded text-xs font-bold capitalize transition-colors ${
                          selectedDifficulty === d
                            ? 'bg-[#087F8C] text-[#FFFFFF]'
                            : 'text-[#526575] hover:text-[#142331]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {guide && (
            <Card surface="primary" padding="md" className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#36515F] pb-2">
                <h2 className="text-xs font-bold text-[#F5F7F8]">How to play</h2>
                <button
                  onClick={() => viewPuzzleGuide(selectedPuzzle)}
                  className="text-xs text-[#A8E5D5] hover:text-[#38C6BA] font-semibold"
                >
                  Full guide
                </button>
              </div>
              <p className="text-xs text-[#B4C3CE] leading-relaxed">{guide.objective}</p>
              <ul className="space-y-1 text-xs text-[#B4C3CE] pt-1">
                {guide.controls.slice(0, 2).map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#38C6BA] mt-0.5 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      {/* Personal Best Toast */}
      {pbToast?.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-[#233D4A] border border-[#38C6BA] rounded-xl animate-fade-in">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#38C6BA]/15 text-[#38C6BA] flex items-center justify-center border border-[#38C6BA]/40 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#A8E5D5]">New personal best</p>
              <p className="text-sm font-bold text-[#F5F7F8]">{pbToast.puzzleName}</p>
              <p className="text-xs text-[#6EE7B7] font-tabular">{pbToast.improvementMsg}</p>
            </div>
            <button
              onClick={closePbToast}
              aria-label="Dismiss notification"
              className="ml-2 p-1 text-[#98AAB8] hover:text-[#F5F7F8]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Clean, Restrained Game Completion Dialog */}
      {winResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
        >
          <div className="bg-[#233D4A] border border-[#4A6A7B] rounded-xl p-6 max-w-md w-full space-y-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
                  winResult.won
                    ? 'bg-[#38C6BA]/15 border-[#38C6BA]/40 text-[#38C6BA]'
                    : 'bg-[#1C2D3B] border-[#36515F] text-[#B4C3CE]'
                }`}
              >
                {winResult.isPB ? <Award className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="result-title" className="text-xl font-bold text-[#F5F7F8]">
                    {winResult.won ? 'Puzzle Completed!' : 'Try Again'}
                  </h2>
                  {winResult.isPB && <Badge variant="accent">Personal Best</Badge>}
                </div>
                <p className="text-xs text-[#B4C3CE] mt-0.5">
                  {puzzleInfo?.name} · <span className="capitalize">{selectedDifficulty}</span>
                </p>
              </div>
            </div>

            <div className="bg-[#1C2D3B] border border-[#36515F] rounded-lg divide-y divide-[#36515F] text-xs">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#B4C3CE]">Time taken</span>
                <span className="font-bold text-[#F5F7F8] font-tabular">
                  {winResult.timeSeconds}s
                </span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#B4C3CE]">Score</span>
                <div className="text-right font-tabular">
                  <span className="font-bold text-[#F5F7F8]">{winResult.score} pts</span>
                  {winResult.pbDiffMsg && (
                    <span className="block text-[11px] text-[#6EE7B7]">{winResult.pbDiffMsg}</span>
                  )}
                </div>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#B4C3CE]">XP earned</span>
                <span className="font-bold text-[#A8E5D5] font-tabular">
                  +{winResult.xpAwarded} XP
                </span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#B4C3CE]">Coins earned</span>
                <span className="font-bold text-[#93D1F2] font-tabular">
                  +{winResult.coinsAwarded} coins
                </span>
              </div>
              {winResult.eventPointsGained !== undefined && (
                <div className="px-4 py-2.5 flex items-center justify-between bg-[#38C6BA]/10">
                  <span className="text-[#A8E5D5] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Event points</span>
                  </span>
                  <span className="font-bold text-[#A8E5D5] font-tabular">
                    +{winResult.eventPointsGained} pts
                  </span>
                </div>
              )}
              {winResult.practiceCompleted && (
                <div className="px-4 py-2.5 flex items-center justify-between bg-[#10B981]/10">
                  <span className="text-[#6EE7B7] flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Practice bonus</span>
                  </span>
                  <span className="font-bold text-[#6EE7B7] font-tabular">
                    +{winResult.practiceRewardXP} XP / +{winResult.practiceRewardCoins} Coins
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {selectedCollectionId ? (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setWinResult(null);
                    viewCollectionDetail(selectedCollectionId);
                  }}
                >
                  Return to collection
                </Button>
              ) : selectedJourneyStageId ? (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setWinResult(null);
                    setActiveTab('journey');
                  }}
                >
                  <Compass className="w-4 h-4" />
                  <span>Return to journey</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setWinResult(null);
                    setDidPause(false);
                    playGame(nextSuggestedPuzzle.id, selectedDifficulty);
                    setResetKey((k) => k + 1);
                  }}
                >
                  Play Another Puzzle
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setWinResult(null);
                    setDidPause(false);
                    setResetKey((k) => k + 1);
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setWinResult(null);
                    setActiveTab('games');
                  }}
                >
                  <span>Back to Games</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={async () => {
                  const res = await getPlatformAdapter().share({
                    title: `PuzzleVerse — ${puzzleInfo?.name || 'Puzzle'}`,
                    text: `I scored ${winResult.score} pts in ${winResult.timeSeconds}s on ${puzzleInfo?.name || 'PuzzleVerse'}!`,
                    url: 'https://puzzleverse-e16e4.web.app/',
                  });
                  if (res.shared) {
                    getPlatformAdapter().notifications.notify(
                      'Score Shared',
                      res.method === 'clipboard' ? 'Score summary copied to clipboard.' : 'Shared!'
                    );
                  }
                }}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Result</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Match Exit Confirmation Dialog */}
      {showExitConfirm && !winResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-match-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
        >
          <div className="bg-[#233D4A] border border-[#4A6A7B] rounded-xl p-6 max-w-sm w-full space-y-4">
            <h2 id="exit-match-title" className="text-lg font-bold text-[#F5F7F8]">
              Leave Active Puzzle?
            </h2>
            <p className="text-xs sm:text-sm text-[#B4C3CE] leading-relaxed">
              Leaving {puzzleInfo?.name || 'this match'} now will forfeit your current round progress.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setShowExitConfirm(false)}>
                Keep Playing
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowExitConfirm(false);
                  setActiveTab('games');
                }}
              >
                Leave Puzzle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
