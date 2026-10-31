import { useState, useEffect, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import type { Difficulty, GameState, PuzzleType } from './types';
import { calculateQuestionScore } from '../../services/scoringService';
import { BattleContext } from '../../pages/Battle/BattleContext';
import { useAuthStore } from '../../store/useAuthStore';
import { syncBattleProgress } from '../../services/battleService';

const DIFFICULTY_TIMES: Record<Difficulty, number> = {
  EASY: 5 * 60,
  MEDIUM: 4 * 60,
  HARD: 3 * 60,
  EXPERT: 2 * 60,
};

export const useGameEngine = (puzzleType: PuzzleType, totalQuestions: number = 10) => {
  const [state, setState] = useState<GameState>({
    puzzleId: `game_${Date.now()}`,
    puzzleType,
    difficulty: 'EASY',
    status: 'READY',
    startTime: null,
    timeRemaining: 0,
    initialTimeLimit: 0,
    questionStartTime: 0,
    score: 0,
    hintsUsed: 0,
    maxHints: 3,
    attempts: 0,
    currentQuestionIndex: 0,
    totalQuestions,
    correctAnswers: 0,
    incorrectAnswers: 0,
  });

  const location = useLocation();
  const { user } = useAuthStore();
  const { battle } = useContext(BattleContext);

  // Auto-start Daily Puzzle or Friend Challenge if routed with state
  useEffect(() => {
    if (location.state?.difficulty && state.status === 'READY') {
      if (location.state.isDailyPuzzle || location.state.isFriendChallenge) {
        startGame(location.state.difficulty, {
          isDailyPuzzle: location.state.isDailyPuzzle,
          dailyPuzzleDate: location.state.dailyPuzzleDate,
          isFriendChallenge: location.state.isFriendChallenge,
          friendChallengeId: location.state.friendChallengeId,
          puzzleSeed: location.state.puzzleSeed
        });
      }
    }
  }, [location.state, state.status, startGame]);

  // Timer loop — depends only on status, NOT on timeRemaining, to prevent
  // creating a new interval every second.
  useEffect(() => {
    let timer: any;
    if (state.status === 'PLAYING') {
      timer = setInterval(() => {
        setState((prev) => {
          if (prev.status !== 'PLAYING') {
            clearInterval(timer);
            return prev;
          }
          const nextTime = prev.timeRemaining - 1;
          if (nextTime <= 0) {
            clearInterval(timer);
            return { ...prev, timeRemaining: 0, status: 'TIMEOUT' };
          }
          return { ...prev, timeRemaining: nextTime };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.status]);

  // Prevent accidental navigation/tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.status === 'PLAYING' || state.status === 'PAUSED') {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your game progress will be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.status]);

  const startGame = useCallback((difficulty: Difficulty, options?: import('./types').StartGameOptions) => {
    const timeLimit = DIFFICULTY_TIMES[difficulty];
    const generatedSeed = Math.floor(Math.random() * 1000000000);
    
    setState({
      puzzleId: `game_${Date.now()}`,
      puzzleType,
      difficulty,
      status: 'PLAYING',
      startTime: Date.now(),
      timeRemaining: timeLimit,
      initialTimeLimit: timeLimit,
      questionStartTime: Date.now(),
      score: 0,
      hintsUsed: 0,
      maxHints: 3,
      attempts: 0,
      currentQuestionIndex: 0,
      totalQuestions,
      correctAnswers: 0,
      incorrectAnswers: 0,
      isDailyPuzzle: options?.isDailyPuzzle,
      dailyPuzzleDate: options?.dailyPuzzleDate,
      isFriendChallenge: options?.isFriendChallenge,
      friendChallengeId: options?.friendChallengeId,
      puzzleSeed: options?.puzzleSeed !== undefined ? options.puzzleSeed : generatedSeed,
      isBattle: options?.isBattle,
      battleId: options?.battleId,
      isCommunityPuzzle: options?.isCommunityPuzzle,
      communityPuzzleId: options?.communityPuzzleId,
    });

    // Phase 58: Securely increment play count
    if (options?.isCommunityPuzzle && options?.communityPuzzleId) {
      import('../../services/communityService').then(({ incrementPlayCount }) => {
        incrementPlayCount(options.communityPuzzleId!).catch(err => {
          console.error("Failed to increment community play count", err);
        });
      });
    }
  }, [puzzleType, totalQuestions]);

  const pauseGame = useCallback(() => {
    setState((prev) => (prev.status === 'PLAYING' && !prev.isBattle) ? { ...prev, status: 'PAUSED' } : prev);
  }, []);

  const resumeGame = useCallback(() => {
    setState((prev) => prev.status === 'PAUSED' ? { ...prev, status: 'PLAYING' } : prev);
  }, []);

  const submitAnswer = useCallback((isCorrect: boolean) => {
    setState((prev) => {
      if (prev.status !== 'PLAYING') return prev;

      if (isCorrect) {
        const timeTakenMs = Date.now() - prev.questionStartTime;
        const points = calculateQuestionScore(
          prev.difficulty,
          true,
          timeTakenMs,
          prev.initialTimeLimit * 1000,
          prev.hintsUsed
        );
        
        const isLastQuestion = prev.currentQuestionIndex >= prev.totalQuestions - 1;
        
        const nextScore = prev.score + points;
        const nextCorrect = prev.correctAnswers + 1;
        
        if (prev.isBattle && prev.battleId && battle && user?.uid) {
           const progress = Math.round((nextCorrect / prev.totalQuestions) * 100);
           const isPlayerA = battle.playerA.uid === user.uid;
           const playerKey = isPlayerA ? 'playerA' : 'playerB';
           syncBattleProgress(prev.battleId, playerKey, progress, nextScore);
        }
        
        return {
          ...prev,
          score: nextScore,
          correctAnswers: nextCorrect,
          currentQuestionIndex: isLastQuestion ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
          attempts: 0,
          hintsUsed: 0, // Reset hints for next question
          questionStartTime: Date.now(),
          status: isLastQuestion ? 'COMPLETED' : 'PLAYING'
        };
      } else {
        return {
          ...prev,
          incorrectAnswers: prev.incorrectAnswers + 1,
          attempts: prev.attempts + 1
        };
      }
    });
  }, [battle, user?.uid]);

  const consumeHint = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'PLAYING' || prev.hintsUsed >= prev.maxHints) return prev;
      return { ...prev, hintsUsed: prev.hintsUsed + 1 };
    });
  }, []);

  const resetAttempts = useCallback(() => {
    setState((prev) => ({ ...prev, attempts: 0 }));
  }, []);

  return {
    state,
    setState, // Expose for custom non-standard games (like Memory)
    startGame,
    pauseGame,
    resumeGame,
    submitAnswer,
    consumeHint,
    resetAttempts,
  };
};
