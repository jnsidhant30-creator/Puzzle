import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import type { Difficulty } from '../core/types';


import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { getSlidingConfig, generateSolvableBoard, isSolved, getValidMoves } from './slidingPuzzleGenerator';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';

import { calculateQuestionScore } from '../../services/scoringService';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';

export const SlidingPuzzle = () => {
  const { state, startGame, pauseGame, resumeGame, consumeHint, setState } = useGameEngine('SLIDING');
  
  const [board, setBoard] = useState<number[]>([]);
  const [config, setConfig] = useState(getSlidingConfig('EASY'));
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState<number | null>(null);

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (state.status === 'READY' && board.length > 0) {
       setBoard([]);
       setMoves(0);
       setResultData(null);
    }
  }, [state.status]);

  useEffect(() => {
    if (state.status === 'PLAYING' && board.length === 0) {
      const c = getSlidingConfig(state.difficulty);
      setConfig(c);
      
      const seedToUse = getDeterministicSeed(state);

      const newBoard = generateUniquePuzzle(
        'SLIDING',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateSolvableBoard(c.size, c.shuffleMoves, seed,
        (p) => JSON.stringify(p),
        (seed) => {
          if (!state.isDailyPuzzle && !state.isFriendChallenge) {
            setState(s => {
              const currentSeeds = Array.isArray(s.puzzleSeed) ? [...s.puzzleSeed] : [];
              currentSeeds[s.currentQuestionIndex || 0] = seed;
              return { ...s, puzzleSeed: currentSeeds };
            });
          }
        }
      ),
        (b) => b.join(',')
      );

      setBoard(newBoard);
      setMoves(0);
      setShowHint(null);
      setState(s => ({
        ...s,
        timeRemaining: c.timeLimit,
        initialTimeLimit: c.timeLimit,
        maxHints: c.maxHints,
        hintsUsed: 0
      }));
    }
  }, [state.status, state.difficulty, board.length, state.isDailyPuzzle, state.dailyPuzzleDate]);

  // Process game end
  useEffect(() => {
    if ((state.status === 'COMPLETED' || state.status === 'TIMEOUT') && !resultData && !isProcessingResult) {
      const finishGame = async () => {
        setIsProcessingResult(true);
        const res = await processGameResult(state, profile);
        
        if (res) {
          setResultData({
            status: res.status as 'COMPLETED' | 'TIMEOUT',
            score: res.score,
            xpEarned: res.xpEarned,
            accuracy: res.accuracy,
            correctAnswers: res.correctAnswers,
            totalQuestions: res.totalQuestions,
            hintsUsed: res.hintsUsed,
            timeTaken: res.timeTaken,
            currentLevel: res.newLevel,
            currentXp: res.newXp,
            difficulty: state.difficulty,
            stage: state.currentQuestionIndex !== undefined ? state.currentQuestionIndex + 1 : undefined,
            isDailyPuzzle: state.isDailyPuzzle,
            isFriendChallenge: state.isFriendChallenge,
            friendChallengeId: state.friendChallengeId,
            puzzleSeed: state.puzzleSeed,
            puzzleType: state.puzzleType,
            isNewBest: res.newBestScore !== undefined && res.newBestScore === state.score && state.score > (profile?.bestScore || 0)
          });

          if (res.newLevel > res.oldLevel) {
            setLevelUpData({
              oldLevel: res.oldLevel,
              newLevel: res.newLevel,
              xpEarned: res.xpEarned
            });
            setShowLevelUp(true);
          }
        } else {
          setResultData({
            status: state.status as 'COMPLETED' | 'TIMEOUT',
            score: state.score,
            xpEarned: 0,
            accuracy: Math.round((state.correctAnswers / state.totalQuestions) * 100) || 0,
            correctAnswers: state.correctAnswers,
            totalQuestions: state.totalQuestions,
            hintsUsed: state.hintsUsed,
            timeTaken: state.initialTimeLimit - state.timeRemaining,
            currentLevel: 1,
            currentXp: 0,
            difficulty: state.difficulty,
            stage: state.currentQuestionIndex !== undefined ? state.currentQuestionIndex + 1 : undefined,
            isDailyPuzzle: state.isDailyPuzzle
          });
        }
        setIsProcessingResult(false);
      };

      finishGame();
    }
  }, [state, profile, resultData, isProcessingResult]);

  const handleTileClick = (index: number) => {
    if (state.status !== 'PLAYING') return;

    const emptyIndex = board.indexOf(0);
    const validMoves = getValidMoves(emptyIndex, config.size);

    if (validMoves.includes(index)) {
      const newBoard = [...board];
      newBoard[emptyIndex] = newBoard[index];
      newBoard[index] = 0;
      setBoard(newBoard);
      setMoves(m => m + 1);
      setShowHint(null);

      if (isSolved(newBoard)) {
        handleGameOver(true, moves + 1);
      }
    }
  };

  const handleGameOver = (success: boolean, finalMoves: number = moves) => {
    const timeTakenMs = (config.timeLimit - state.timeRemaining) * 1000;
    const initialTimeMs = config.timeLimit * 1000;
    
    // Abstract score. We'll use 1 question, but modify score dynamically
    const baseScore = calculateQuestionScore(
      state.difficulty,
      success,
      timeTakenMs,
      initialTimeMs,
      state.hintsUsed
    );

    let finalScore = success ? baseScore : 0;
    
    // Subtract points for excessive moves, but don't go below 10 for success
    if (success && finalMoves > config.shuffleMoves) {
       const penalty = Math.min((finalMoves - config.shuffleMoves) * 5, finalScore - 10);
       finalScore = Math.max(10, finalScore - penalty);
    }

    setState(s => ({
      ...s,
      status: success ? 'COMPLETED' : 'FAILED',
      score: finalScore,
      correctAnswers: success ? 1 : 0,
      totalQuestions: 1,
      moves: finalMoves
    }));
  };

  const handleHint = () => {
    if (state.hintsUsed < state.maxHints) {
      consumeHint();
      const emptyIndex = board.indexOf(0);
      const validMoves = getValidMoves(emptyIndex, config.size);
      // Give a hint by just picking a random valid move (could implement A* for perfect hints, but simple is fine for now)
      const randomHint = validMoves[Math.floor(Math.random() * validMoves.length)];
      setShowHint(randomHint);
    }
  };

  if (state.status === 'READY') {
    const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
    const configs = difficulties.map(diff => {
      const conf = getSlidingConfig(diff);
      return {
        difficulty: diff,
        timeLimit: conf.timeLimit,
        hints: conf.maxHints
      };
    });

    return (
      <GameStartScreen
        title="Sliding Puzzle"
        description="Slide the tiles into numerical order."
        configs={configs}
        onStart={(diff) => startGame(diff, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      />
    );
  }

  
  return (
    <>
    <GameLayout
      title="Sliding Puzzle"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={0}
      totalQuestions={1}
      onHint={handleHint}
      onPause={pauseGame}
      onRestart={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="SLIDING"
      puzzleState={state}
      instructions={
        <>
          <p>Slide the tiles to put them in numerical order.</p>
          <p className="mt-2 font-bold text-primary">Moves: {moves}</p>
        </>
      }
    >
      <div className="w-full flex flex-col items-center">
      {/* The Board */}
      <div className="flex justify-center p-4">
        <div 
          className="grid gap-2 p-2 glass rounded-xl border border-primary/20 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px]"
          style={{
            gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))`
          }}
        >
          {board.map((val, idx) => (
            <div 
              key={`${idx}-${val}`}
              role="button" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => handleTileClick(idx)}
              className={`
                aspect-square w-full flex items-center justify-center text-2xl sm:text-4xl font-bold rounded-lg select-none transition-all duration-200
                ${val === 0 ? 'opacity-0 cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'}
                ${val !== 0 && showHint === idx ? 'bg-accent/80 text-white ring-4 ring-accent ring-offset-2 ring-offset-background' : ''}
                ${val !== 0 && showHint !== idx ? 'bg-primary text-white shadow-md shadow-primary/20' : ''}
              `}
            >
              {val !== 0 && val}
            </div>
          ))}
        </div>
      </div>
      </div>
    </GameLayout>
{state.status === 'PAUSED' && (
        <PauseModal 
          onResume={resumeGame} 
          onRestart={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })} 
          isDailyPuzzle={state.isDailyPuzzle}
        />
      )}

      {(state.status === 'COMPLETED' || state.status === 'TIMEOUT' || state.status === 'FAILED') && (
        <>
          {isProcessingResult ? (
            <div className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-textMain font-bold animate-pulse">Calculating Result...</p>
            </div>
          ) : (
            showLevelUp && levelUpData ? (
              <LevelUpModal 
                oldLevel={levelUpData.oldLevel}
                newLevel={levelUpData.newLevel}
                xpEarned={levelUpData.xpEarned}
                onContinue={() => setShowLevelUp(false)}
              />
            ) : resultData && (
              <ResultModal 
                data={resultData}
                onPlayAgain={() => {
                  setResultData(null);
                  setLevelUpData(null);
                  setShowLevelUp(false);
                  startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed });
                }}
              />
            )
          )}
        </>
      )}
    </>
  );
};
