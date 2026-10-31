import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateMazePuzzle } from './mazeGenerator';
import type { MazePuzzle } from './types';
import { useMazeEscape } from './useMazeEscape';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { MazeBoard } from './MazeBoard';
import { Card, CardContent } from '../../components/ui/Card';
import { useChallenge } from '../challenge/ChallengeContext';

export const MazeEscapeGame = () => {
  const { 
    state, 
    setState,
    startGame, 
    pauseGame, 
    resumeGame, 
    consumeHint,
  } = useGameEngine('MAZE_ESCAPE', 1);

  const [puzzle, setPuzzle] = useState<MazePuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState('');

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const challenge = useChallenge();

  const { playerPosition, selectCell } = useMazeEscape(
    puzzle,
    state.status !== 'PLAYING',
    (moves) => setState(s => ({ ...s, moves })),
    () => setState(s => ({ ...s, status: 'COMPLETED' }))
  );

  useEffect(() => {
    if (state.status === 'READY') {
      const seedToUse = getDeterministicSeed(state);

      const generatedPuzzle = generateUniquePuzzle(
        'MAZE_ESCAPE',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateMazePuzzle(state.difficulty, seed,
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
        (p) => p.grid.map(row => row.map(c => c.type).join('')).join('|')
      );
      
      setPuzzle(generatedPuzzle);
      setState(s => ({ ...s, totalQuestions: 1, initialTimeLimit: 0 })); 
      setShowHint(false);
      setHintMessage('');
    }
  }, [state.status, state.difficulty, setState, state.isDailyPuzzle, state.dailyPuzzleDate]);

  useEffect(() => {
    if (state.status === 'COMPLETED' && !isProcessingResult && profile && puzzle) {
      const handleCompletion = async () => {
        setIsProcessingResult(true);
        const finalState = { ...state, correctAnswers: 1, totalQuestions: 1 };
        
        const accuracy = 100; // Found the exit
        
        if (challenge?.isChallengeMode) {
          challenge.onChallengeComplete({
            status: 'COMPLETED',
            score: state.score,
            xpEarned: 0,
            accuracy,
            correctAnswers: 1,
            totalQuestions: 1,
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
            correctAnswers: 1,
            totalQuestions: 1,
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
  }, [state.status, isProcessingResult, profile, state, puzzle, challenge]);

  const handleUseHint = () => {
    if (state.hintsUsed < state.maxHints && puzzle) {
      consumeHint();
      setShowHint(true);
      
      // A simple hint: show distance to exit or a direction
      // In a real BFS we could show the exact next step
      const dr = puzzle.exit.r - playerPosition.r;
      const dc = puzzle.exit.c - playerPosition.c;
      
      let dir = '';
      if (Math.abs(dr) > Math.abs(dc)) {
        dir = dr > 0 ? 'South' : 'North';
      } else {
        dir = dc > 0 ? 'East' : 'West';
      }
      
      setHintMessage(`The exit is generally to the ${dir}.`);
      setTimeout(() => setShowHint(false), 3000);
    }
  };

  if (state.status === 'READY') {
    return (
      <GameStartScreen
        title="Maze Escape"
        description="
                  Find your way out of the procedural maze! Use arrow keys, WASD, or tap/click adjacent cells to move.
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
      title="MAZE_ESCAPE"
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
      gameType="MAZE_ESCAPE"
      puzzleState={state}
      instructions="Find your way out of the procedural maze! Use arrow keys, WASD, or tap/click adjacent cells to move."
    >
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
        {showHint && hintMessage && (
          <div className="mb-6 p-4 bg-primary/20 border border-primary/50 text-primary font-bold rounded-xl animate-in fade-in slide-in-from-top-4 w-full text-center">
            💡 Hint: {hintMessage}
          </div>
        )}

        {puzzle && (
          <MazeBoard
            grid={puzzle.grid}
            playerPosition={playerPosition}
            start={puzzle.start}
            exit={puzzle.exit}
            onSelectCell={selectCell}
            disabled={state.status !== 'PLAYING'}
          />
        )}

        {state.status === 'COMPLETED' && (
           <div className="mt-8 text-success font-bold text-2xl text-center animate-in zoom-in">
             Escaped the Maze!
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
