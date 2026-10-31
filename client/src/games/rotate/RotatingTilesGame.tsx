import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateRotatingTilesPuzzle } from './rotatingTilesGenerator';
import type { RotatingTilesPuzzle } from './types';
import { useRotatingTiles } from './useRotatingTiles';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { RotatingBoard } from './RotatingBoard';
import { Card, CardContent } from '../../components/ui/Card';
import { useChallenge } from '../challenge/ChallengeContext';

export const RotatingTilesGame = () => {
  const { 
    state, 
    setState,
    startGame, 
    pauseGame, 
    resumeGame, 
    consumeHint,
  } = useGameEngine('ROTATING_TILES', 1);

  const [puzzle, setPuzzle] = useState<RotatingTilesPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintLocation, setHintLocation] = useState<{r: number, c: number} | undefined>();

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const challenge = useChallenge();

  const { tiles, rotateTile } = useRotatingTiles(
    puzzle,
    state.status !== 'PLAYING',
    (moves) => setState(s => ({ ...s, moves })),
    () => setState(s => ({ ...s, status: 'COMPLETED' }))
  );

  useEffect(() => {
    if (state.status === 'READY') {
      const seedToUse = getDeterministicSeed(state);

      const generatedPuzzle = generateUniquePuzzle(
        'ROTATING_TILES',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateRotatingTilesPuzzle(state.difficulty, seed,
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
        (p) => p.tiles.map(row => row.map(c => c.rotation).join(',')).join('|')
      );
      
      setPuzzle(generatedPuzzle);
      setState(s => ({ ...s, totalQuestions: 1, initialTimeLimit: 0 })); 
      setShowHint(false);
      setHintLocation(undefined);
    }
  }, [state.status, state.difficulty, setState, state.isDailyPuzzle, state.dailyPuzzleDate]);

  useEffect(() => {
    if (state.status === 'COMPLETED' && !isProcessingResult && profile) {
      const handleCompletion = async () => {
        setIsProcessingResult(true);
        const finalState = { ...state, correctAnswers: 1, totalQuestions: 1 };
        
        const maxOptimal = puzzle?.rows && puzzle?.cols ? puzzle.rows * puzzle.cols * 2 : 50;
        const isPerfect = (state.moves || 0) <= maxOptimal;
        const accuracy = isPerfect ? 100 : Math.max(0, 100 - ((state.moves || 0) - maxOptimal));
        
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
            accuracy: isPerfect ? 100 : Math.max(0, 100 - ((state.moves || 0) - maxOptimal)),
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
          }
        }
      };
      
      handleCompletion();
    }
  }, [state.status, isProcessingResult, profile, state.difficulty, state.moves, state.timeRemaining, state.hintsUsed, puzzle]);

  const handleUseHint = () => {
    if (state.hintsUsed < state.maxHints && puzzle) {
      consumeHint();
      setShowHint(true);
      // Pick a random unlocked tile as a hint
      const unlocked = [];
      for (let r=0; r<puzzle.rows; r++) {
        for (let c=0; c<puzzle.cols; c++) {
          if (!tiles[r][c].locked) unlocked.push({r,c});
        }
      }
      if (unlocked.length > 0) {
        setHintLocation(unlocked[Math.floor(Math.random() * unlocked.length)]);
      }
    }
  };

  return (
    <>
    <GameLayout
      title="Rotating Tiles"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={state.moves || 0}
      totalQuestions={0}
      onHint={handleUseHint}
      onPause={pauseGame}
      onRestart={() => { setPuzzle(null); startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed }); }}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="ROTATE"
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
                <p className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2">Connect All Tiles</p>
                {showHint && (
                  <p className="text-primary font-medium bg-primary/10 px-4 py-2 rounded-lg inline-block">
                    💡 Try rotating the highlighted tile!
                  </p>
                )}
              </div>
              
              <RotatingBoard 
                puzzle={puzzle}
                tiles={tiles}
                onRotate={rotateTile}
                isPaused={state.status !== 'PLAYING'}
                hintLocation={hintLocation}
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
