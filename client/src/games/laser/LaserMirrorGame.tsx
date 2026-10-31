import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateLaserPuzzle } from './laserGenerator';
import type { LaserPuzzle } from './types';
import { useLaserMirror } from './useLaserMirror';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { LaserBoard } from './LaserBoard';
import { useChallenge } from '../challenge/ChallengeContext';

export const LaserMirrorGame = () => {
  const { 
    state, 
    setState,
    startGame, 
    pauseGame, 
    resumeGame, 
    consumeHint,
  } = useGameEngine('LASER_MIRROR', 1);

  const [puzzle, setPuzzle] = useState<LaserPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState('');

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const challenge = useChallenge();

  const { grid, selectCell } = useLaserMirror(
    puzzle,
    state.status !== 'PLAYING',
    (moves) => setState(s => ({ ...s, moves })),
    () => setState(s => ({ ...s, status: 'COMPLETED' }))
  );

  useEffect(() => {
    if (state.status === 'READY') {
      const seedToUse = getDeterministicSeed(state);

      const generatedPuzzle = generateUniquePuzzle(
        'LASER_MIRROR',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateLaserPuzzle(state.difficulty, seed,
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
        
        const accuracy = 100;
        
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
      
      let incorrectMirror = null;
      
      for (let r = 0; r < puzzle.grid.length; r++) {
        for (let c = 0; c < puzzle.grid[0].length; c++) {
          const expected = puzzle.grid[r][c];
          const actual = grid[r][c];
          
          if (expected.type === 'MIRROR' && actual.type === 'MIRROR') {
            if (expected.mirrorType !== actual.mirrorType) {
              incorrectMirror = { r, c };
              break;
            }
          }
        }
        if (incorrectMirror) break;
      }
      
      if (incorrectMirror) {
        setHintMessage(`Check the mirror at row ${incorrectMirror.r + 1}, column ${incorrectMirror.c + 1}.`);
      } else {
        setHintMessage(`Your mirrors are correct so far, you just need to add more!`);
      }

      setTimeout(() => setShowHint(false), 3000);
    }
  };

  if (state.status === 'READY') {
    return (
      <GameLayout
      title="LASER_MIRROR"
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
      gameType="LASER_MIRROR"
      puzzleState={state}
    >
         <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-full max-w-md bg-surface border-2 border-border/50 rounded-2xl p-8 text-center flex flex-col gap-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <h2 className="text-3xl font-black text-textMain uppercase tracking-widest">Laser Mirror</h2>
              <p className="text-textMuted text-lg leading-relaxed">
                Place and rotate mirrors to direct the laser from the emitter to the target.
              </p>
              <div className="flex gap-4 justify-center mt-4">
                <button onClick={() => startGame('EASY')} className="px-6 py-3 bg-success/20 text-success font-bold rounded-lg hover:bg-success/30 transition-all uppercase tracking-wide">Easy</button>
                <button onClick={() => startGame('MEDIUM')} className="px-6 py-3 bg-warning/20 text-warning font-bold rounded-lg hover:bg-warning/30 transition-all uppercase tracking-wide">Medium</button>
                <button onClick={() => startGame('HARD')} className="px-6 py-3 bg-error/20 text-error font-bold rounded-lg hover:bg-error/30 transition-all uppercase tracking-wide">Hard</button>
              </div>
            </div>
         </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout
      title="LASER_MIRROR"
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
      gameType="LASER_MIRROR"
      puzzleState={state}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
        {showHint && hintMessage && (
          <div className="mb-6 p-4 bg-primary/20 border border-primary/50 text-primary font-bold rounded-xl animate-in fade-in slide-in-from-top-4 w-full text-center">
            💡 Hint: {hintMessage}
          </div>
        )}

        {puzzle && (
          <LaserBoard
            grid={grid}
            onSelectCell={selectCell}
            disabled={state.status !== 'PLAYING'}
          />
        )}

        {state.status === 'COMPLETED' && (
           <div className="mt-8 text-success font-bold text-2xl text-center animate-in zoom-in">
             Target Hit! Laser Redirected.
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
