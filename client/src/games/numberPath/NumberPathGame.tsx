import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateNumberPathPuzzle } from './numberPathGenerator';
import type { NumberPathPuzzle } from './types';
import { useNumberPath } from './useNumberPath';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { NumberPathBoard } from './NumberPathBoard';
import { Card, CardContent } from '../../components/ui/Card';
import { useChallenge } from '../challenge/ChallengeContext';

export const NumberPathGame = () => {
  const { 
    state, 
    setState,
    startGame, 
    pauseGame, 
    resumeGame, 
    consumeHint,
  } = useGameEngine('NUMBER_PATH', 1);

  const [puzzle, setPuzzle] = useState<NumberPathPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState('');

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const challenge = useChallenge();

  const { currentR, currentC, expectedVal, path, selectCell } = useNumberPath(
    puzzle,
    state.status !== 'PLAYING',
    (moves) => setState(s => ({ ...s, moves })),
    () => setState(s => ({ ...s, status: 'COMPLETED' }))
  );

  useEffect(() => {
    if (state.status === 'READY') {
      const seedToUse = getDeterministicSeed(state);

      const generatedPuzzle = generateUniquePuzzle(
        'NUMBER_PATH',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateNumberPathPuzzle(state.difficulty, seed,
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
        (p) => p.grid.map(row => row.map(c => c.value).join(',')).join('|')
      );
      
      setPuzzle(generatedPuzzle);
      setState(s => ({ ...s, totalQuestions: generatedPuzzle.pathLength, initialTimeLimit: 0 })); 
      setShowHint(false);
      setHintMessage('');
    }
  }, [state.status, state.difficulty, setState, state.isDailyPuzzle, state.dailyPuzzleDate]);

  useEffect(() => {
    if (state.status === 'COMPLETED' && !isProcessingResult && profile && puzzle) {
      const handleCompletion = async () => {
        setIsProcessingResult(true);
        const finalState = { ...state, correctAnswers: path.length, totalQuestions: puzzle.pathLength };
        
        const isPerfect = (state.moves || 0) === (puzzle.pathLength - 1);
        const accuracy = isPerfect ? 100 : Math.max(0, 100 - ((state.moves || 0) - (puzzle.pathLength - 1)) * 5);
        
        if (challenge?.isChallengeMode) {
          challenge.onChallengeComplete({
            status: 'COMPLETED',
            score: state.score,
            xpEarned: 0,
            accuracy,
            correctAnswers: path.length,
            totalQuestions: puzzle.pathLength,
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
            accuracy: isPerfect ? 100 : Math.max(0, 100 - ((state.moves || 0) - (puzzle.pathLength - 1)) * 5),
            correctAnswers: path.length,
            totalQuestions: puzzle.pathLength,
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
          }
        }
      };
      
      handleCompletion();
    }
  }, [state.status, isProcessingResult, profile, state.difficulty, state.moves, state.timeRemaining, state.hintsUsed, puzzle, path.length]);

  const handleUseHint = () => {
    if (state.hintsUsed < state.maxHints) {
      consumeHint();
      setShowHint(true);
      setHintMessage(`Look for ${expectedVal < (puzzle?.pathLength || 0) - 1 ? expectedVal : 'the exit'}`);
    }
  };

  return (
    <>
    <GameLayout
      title="Number Path"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={expectedVal - 1}
      totalQuestions={(puzzle?.pathLength || 1) - 1}
      onHint={handleUseHint}
      onPause={pauseGame}
      onRestart={() => { setPuzzle(null); startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed }); }}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="NUMBER_PATH"
      puzzleState={state}
      instructions={
        <>
          <p>Solve the puzzle and beat the clock.</p>
        </>
      }
    >
      <div className="w-full flex flex-col items-center">

      <Card className="glass border-border/50 relative overflow-hidden min-h-[400px]">
        <CardContent className="p-4 md:p-8 flex flex-col items-center justify-center">
          {puzzle ? (
            <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <p className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2">Connect in Order</p>
                {showHint && (
                  <p className="text-primary font-medium bg-primary/10 px-4 py-2 rounded-lg inline-block">
                    💡 {hintMessage}
                  </p>
                )}
              </div>
              
              <NumberPathBoard 
                puzzle={puzzle}
                path={path}
                currentR={currentR}
                currentC={currentC}
                onSelect={selectCell}
                isPaused={state.status !== 'PLAYING'}
                hintNextVal={showHint ? expectedVal : undefined}
              />
              
              {state.status === 'READY' && (
                <div className="mt-8 flex justify-center">
                  <button 
                    type="button"
                    onClick={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
                    className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/25 transition-transform active:scale-95"
                  >
                    Start Game
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </GameLayout>


      

      {state.status === 'PAUSED' && (
        <PauseModal 
          onResume={resumeGame}
          onRestart={() => { setPuzzle(null); startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed }); }}
          isDailyPuzzle={state.isDailyPuzzle}
        />
      )}

      {(state.status === 'COMPLETED' || state.status === 'TIMEOUT') && !challenge?.isChallengeMode && (
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
                  setResultData(null);
                  setLevelUpData(null);
                  setShowLevelUp(false);
                  setPuzzle(null);
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
