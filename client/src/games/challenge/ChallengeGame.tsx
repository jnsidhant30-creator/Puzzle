import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Zap, Trophy } from 'lucide-react';
import { ChallengeContext } from './ChallengeContext';
import type { GameResultModalData } from '../../components/game/Modals';
import type { PuzzleType, Difficulty } from '../core/types';
import { useAuthStore } from '../../store/useAuthStore';
import { processGameResult } from '../../services/gameResultService';
import { ResultModal, LevelUpModal } from '../../components/game/Modals';

// Lazy load the supported games
const games: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'COLOR_PATH': React.lazy(() => import('../color/ColorPathGame').then(m => ({ default: m.ColorPathGame }))),
  'BLOCK_ESCAPE': React.lazy(() => import('../block/BlockEscapeGame').then(m => ({ default: m.BlockEscapeGame }))),
  'NUMBER_PATH': React.lazy(() => import('../numberPath/NumberPathGame').then(m => ({ default: m.NumberPathGame }))),
  'ROTATING_TILES': React.lazy(() => import('../rotate/RotatingTilesGame').then(m => ({ default: m.RotatingTilesGame }))),
  'WORD_GRID': React.lazy(() => import('../wordGrid/WordGridGame').then(m => ({ default: m.WordGridGame }))),
  'ARROW_PATH': React.lazy(() => import('../arrow/ArrowPathGame').then(m => ({ default: m.ArrowPathGame }))),
  'MAZE_ESCAPE': React.lazy(() => import('../maze/MazeEscapeGame').then(m => ({ default: m.MazeEscapeGame }))),
  'LASER_MIRROR': React.lazy(() => import('../laser/LaserMirrorGame').then(m => ({ default: m.LaserMirrorGame })))
};

const SUPPORTED_TYPES = Object.keys(games) as PuzzleType[];

interface RunStats {
  score: number;
  xpEarned: number;
  timeTaken: number;
  completed: number;
}

export const ChallengeGame = () => {
  const [mode, setMode] = useState<'QUICK' | 'RUN' | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(1);
  const [currentType, setCurrentType] = useState<PuzzleType | null>(null);
  const [stats, setStats] = useState<RunStats>({ score: 0, xpEarned: 0, timeTaken: 0, completed: 0 });
  const [isFinished, setIsFinished] = useState(false);
  
  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const [playedHistory, setPlayedHistory] = useState<PuzzleType[]>([]);

  const startChallenge = (selectedMode: 'QUICK' | 'RUN') => {
    setMode(selectedMode);
    setTotalChallenges(selectedMode === 'QUICK' ? 1 : 5);
    setCurrentIndex(0);
    setStats({ score: 0, xpEarned: 0, timeTaken: 0, completed: 0 });
    setIsFinished(false);
    setResultData(null);
    setPlayedHistory([]);
    nextChallenge(true); // Pass true to indicate it's the first in a session, though we use the state
  };

  const nextChallenge = (isInitial = false) => {
    const history = isInitial ? [] : playedHistory;
    const maxHistory = 10;
    const weights: Partial<Record<PuzzleType, number>> = {};
    
    SUPPORTED_TYPES.forEach(t => {
      weights[t] = 10; // Base weight
    });

    // Penalize recently played
    history.forEach((t, idx) => {
      const recency = history.length - idx; // 1 is most recent
      if (weights[t] !== undefined) {
        weights[t]! -= (10 - recency); 
        if (weights[t]! < 1) weights[t] = 1;
      }
    });
    
    let totalWeight = 0;
    SUPPORTED_TYPES.forEach(t => { totalWeight += (weights[t] || 0); });
    
    let random = Math.random() * totalWeight;
    let selectedType = SUPPORTED_TYPES[0];
    
    for (const t of SUPPORTED_TYPES) {
      random -= (weights[t] || 0);
      if (random <= 0) {
        selectedType = t;
        break;
      }
    }
    
    setPlayedHistory(prev => {
      const updated = [...prev, selectedType];
      if (updated.length > maxHistory) return updated.slice(updated.length - maxHistory);
      return updated;
    });
    
    setCurrentType(selectedType);
  };

  const handleChallengeComplete = (result: GameResultModalData) => {
    setStats(prev => ({
      score: prev.score + result.score,
      xpEarned: prev.xpEarned + result.xpEarned,
      timeTaken: prev.timeTaken + result.timeTaken,
      completed: prev.completed + (result.status === 'COMPLETED' ? 1 : 0)
    }));

    if (currentIndex + 1 >= totalChallenges) {
      // Run finished
      setIsFinished(true);
      submitFinalResult({
        score: stats.score + result.score,
        xpEarned: stats.xpEarned + result.xpEarned,
        timeTaken: stats.timeTaken + result.timeTaken,
        completed: stats.completed + (result.status === 'COMPLETED' ? 1 : 0)
      });
    } else {
      setCurrentIndex(prev => prev + 1);
      nextChallenge();
    }
  };

  const submitFinalResult = async (finalStats: RunStats) => {
    if (!profile) return;
    setIsProcessingResult(true);
    
    // Simulate a game state for the submission
    const fakeState = {
      puzzleId: `challenge_${Date.now()}`,
      puzzleType: 'CHALLENGE' as PuzzleType,
      difficulty: 'HARD' as Difficulty,
      status: 'COMPLETED' as const,
      startTime: Date.now() - finalStats.timeTaken * 1000,
      questionStartTime: Date.now() - finalStats.timeTaken * 1000,
      maxHints: 3,
      attempts: 1,
      currentQuestionIndex: totalChallenges,
      score: finalStats.score,
      initialTimeLimit: 0,
      timeRemaining: -finalStats.timeTaken,
      hintsUsed: 0,
      correctAnswers: finalStats.completed,
      incorrectAnswers: totalChallenges - finalStats.completed,
      totalQuestions: totalChallenges,
      isDailyPuzzle: false,
      moves: 0
    };
    
    const result = await processGameResult(fakeState, profile);
    
    if (result) {
      setResultData({
        status: 'COMPLETED',
        score: result.score,
        xpEarned: result.xpEarned,
        accuracy: (finalStats.completed / totalChallenges) * 100,
        correctAnswers: finalStats.completed,
        totalQuestions: totalChallenges,
        hintsUsed: 0,
        timeTaken: finalStats.timeTaken,
        currentLevel: profile?.level || 1,
        currentXp: profile?.xp || 0,
        difficulty: fakeState.difficulty,
        stage: typeof fakeState.currentQuestionIndex !== 'undefined' ? fakeState.currentQuestionIndex + 1 : undefined
      });
      
      if (result.newLevel !== undefined && result.oldLevel !== undefined && result.newLevel > result.oldLevel) {
        setLevelUpData({
          oldLevel: result.oldLevel,
          newLevel: result.newLevel,
          xpEarned: result.xpEarned
        });
        setShowLevelUp(true);
      }
    }
    setIsProcessingResult(false);
  };

  if (!mode) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-center mb-8">
          Random Challenge
        </h1>
        <div className="grid md:grid-cols-2 gap-6">
          <Card role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startChallenge('QUICK'); } }} className="glass cursor-pointer hover:scale-105 transition-transform" onClick={() => startChallenge('QUICK')}>
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
              <CardTitle>Quick Challenge</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-textMuted">
              Play 1 random procedural puzzle.
            </CardContent>
          </Card>
          
          <Card role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startChallenge('RUN'); } }} className="glass cursor-pointer hover:scale-105 transition-transform" onClick={() => startChallenge('RUN')}>
            <CardHeader className="text-center">
              <Trophy className="w-12 h-12 mx-auto text-purple-400 mb-2" />
              <CardTitle>5-Challenge Run</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-textMuted">
              Complete 5 random puzzles in a row for a massive score multiplier.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isFinished) {
    if (isProcessingResult) {
      return (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-textMain font-bold animate-pulse">Finalizing Challenge Run...</p>
        </div>
      );
    }
    
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        {showLevelUp && levelUpData ? (
          <LevelUpModal 
            oldLevel={levelUpData.oldLevel}
            newLevel={levelUpData.newLevel}
            xpEarned={levelUpData.xpEarned}
            onContinue={() => setShowLevelUp(false)}
          />
        ) : (
          <ResultModal 
            data={resultData}
            onPlayAgain={() => setMode(null)}
          />
        )}
      </div>
    );
  }

  const CurrentGame = currentType ? games[currentType] : null;

  return (
    <ChallengeContext.Provider value={{
      isChallengeMode: true,
      challengeIndex: currentIndex,
      totalChallenges: totalChallenges,
      onChallengeComplete: handleChallengeComplete,
      onChallengeAbort: () => setMode(null)
    }}>
      <div className="animate-in fade-in">
        <div className="bg-slate-900/80 border-b border-primary/20 sticky top-16 z-30 mb-6 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between text-sm md:text-base">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Zap className="w-4 h-4" />
              {mode === 'RUN' ? `Challenge Run (${currentIndex + 1}/${totalChallenges})` : 'Quick Challenge'}
            </div>
            <div className="flex items-center gap-4 text-textMuted">
              <span className="hidden md:inline">Score: <span className="text-white font-bold">{stats.score}</span></span>
              <Button variant="ghost" size="sm" className="h-8 text-error hover:text-error hover:bg-error/10" onClick={() => setMode(null)}>
                Abort
              </Button>
            </div>
          </div>
        </div>
        
        {CurrentGame && (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <CurrentGame />
          </React.Suspense>
        )}
      </div>
    </ChallengeContext.Provider>
  );
};
