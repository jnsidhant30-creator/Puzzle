import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateArrowPathPuzzle } from './arrowPathGenerator';
import type { ArrowPathPuzzle } from './types';
import { useArrowPath } from './useArrowPath';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowPathBoard } from './ArrowPathBoard';
import { Card, CardContent } from '../../components/ui/Card';
import { useChallenge } from '../challenge/ChallengeContext';

export const ArrowPathGame = () => {
  const { 
    state, 
    setState,
    startGame, 
    pauseGame, 
    resumeGame, 
    consumeHint,
  } = useGameEngine('ARROW_PATH', 1);

  const [puzzle, setPuzzle] = useState<ArrowPathPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState('');

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const challenge = useChallenge();

  const { currentPath, selectCell } = useArrowPath(
    puzzle,
    state.status !== 'PLAYING',
    (moves) => setState(s => ({ ...s, moves })),
    () => setState(s => ({ ...s, status: 'COMPLETED' }))
  );

  useEffect(() => {
    if (state.status === 'READY') {
      const seedToUse = getDeterministicSeed(state);

      const generatedPuzzle = generateUniquePuzzle(
        'ARROW_PATH',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateArrowPathPuzzle(state.difficulty, seed,
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
        (p) => p.path.map(c => `${c.r},${c.c}`).join('|')
      );
      
      setPuzzle(generatedPuzzle);
      setState(s => ({ ...s, totalQuestions: generatedPuzzle.path.length, initialTimeLimit: 0 })); 
      setShowHint(false);
      setHintMessage('');
    }
  }, [state.status, state.difficulty, setState, state.isDailyPuzzle, state.dailyPuzzleDate]);

  useEffect(() => {
    if (state.status === 'COMPLETED' && !isProcessingResult && profile && puzzle) {
      const handleCompletion = async () => {
        setIsProcessingResult(true);
        const finalState = { ...state, correctAnswers: currentPath.length, totalQuestions: puzzle.path.length };
        
        const accuracy = 100; // Path finding is boolean
        
        if (challenge?.isChallengeMode) {
          challenge.onChallengeComplete({
            status: 'COMPLETED',
            score: state.score,
            xpEarned: 0,
            accuracy,
            correctAnswers: currentPath.length,
            totalQuestions: puzzle.path.length,
            hintsUsed: state.hintsUsed,
            timeTaken: state.initialTimeLimit - state.timeRemaining,
            currentLevel: profile.level || 1,
            currentXp: profile.xp || 0
          ,
            difficulty: state.difficulty,
            stage: typeof state.currentQuestionIndex !== 'undefined' ? state.currentQuestionIndex + 1 : undefined});
          return;
        }
        
        const result = await processGameResult(finalState, profile);
        
        if (result) {
          setResultData({
            status: 'COMPLETED',
            score: result.score,
            xpEarned: result.xpEarned,
            accuracy,
            correctAnswers: currentPath.length,
            totalQuestions: puzzle.path.length,
            hintsUsed: state.hintsUsed,
            timeTaken: state.initialTimeLimit - state.timeRemaining,
            currentLevel: profile?.level || 1,
            currentXp: profile?.xp || 0
          ,
            difficulty: state.difficulty,
            stage: typeof state.currentQuestionIndex !== 'undefined' ? state.currentQuestionIndex + 1 : undefined});
          
          if (result.newLevel !== undefined && result.oldLevel !== undefined && result.newLevel > result.oldLevel) {
            setLevelUpData({
              oldLevel: result.oldLevel,
              newLevel: result.newLevel,
              xpEarned: result.xpEarned
            });
            setShowLevelUp(true);
          }
        }
      };
      
      handleCompletion();
    }
  }, [state.status, isProcessingResult, profile, state, puzzle, currentPath.length, challenge]);

  const handleUseHint = () => {
    if (state.hintsUsed < state.maxHints && puzzle) {
      consumeHint();
      setShowHint(true);
      
      // Find the next cell in the intended solution path
      const currentCell = currentPath[currentPath.length - 1];
      const solutionIndex = puzzle.path.findIndex(p => p.r === currentCell.r && p.c === currentCell.c);
      if (solutionIndex >= 0 && solutionIndex < puzzle.path.length - 1) {
        const nextCell = puzzle.path[solutionIndex + 1];
        setHintMessage(`Next step: Go to row ${nextCell.r + 1}, column ${nextCell.c + 1}`);
      } else {
        setHintMessage(`You are on the right track! Keep following the arrows.`);
      }

      setTimeout(() => setShowHint(false), 3000);
    }
  };

  if (state.status === 'READY') {
    return (
      <GameStartScreen
        title="Arrow Path"
        description="
                  Follow the arrows to reach the target.
                "
        configs={[
          { difficulty: 'EASY', timeLimit: 120, hints: 3 },
          { difficulty: 'MEDIUM', timeLimit: 90, hints: 3 },
          { difficulty: 'HARD', timeLimit: 60, hints: 3 },
          { difficulty: 'EXPERT', timeLimit: 45, hints: 3 }
        ]}
        onStart={(diff) => startGame(diff, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      />
    );
  }

  return (
    <GameLayout
      title="ARROW_PATH"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={state.currentQuestionIndex || 1}
      totalQuestions={state.totalQuestions || 1}
      onHint={handleUseHint || undefined}
      onPause={pauseGame}
      onRestart={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="ARROW_PATH"
      puzzleState={state}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
        {showHint && hintMessage && (
          <div className="mb-6 p-4 bg-primary/20 border border-primary/50 text-primary font-bold rounded-xl animate-in fade-in slide-in-from-top-4 w-full text-center">
            💡 Hint: {hintMessage}
          </div>
        )}

        {puzzle && (
          <ArrowPathBoard puzzle={puzzle} path={currentPath} onSelect={selectCell} isPaused={state.status !== 'PLAYING'} />
        )}

        {state.status === 'COMPLETED' && (
           <div className="mt-8 text-success font-bold text-2xl text-center animate-in zoom-in">
             Path Completed! Great job!
           </div>
        )}
      </div>

      {state.status === 'PAUSED' && (
        <PauseModal 
          onResume={resumeGame}
          onRestart={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
          isDailyPuzzle={state.isDailyPuzzle}
        />
      )}

      {(state.status === 'COMPLETED' || state.status === 'TIMEOUT') && (
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
            ) : (
              <ResultModal 
                data={resultData}
                onPlayAgain={() => {
                  startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed });
                }}
              />
            )
          )}
        </>
      )}
    </GameLayout>
  );
};
