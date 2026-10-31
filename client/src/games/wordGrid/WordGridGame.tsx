import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateWordGridPuzzle } from './wordGridGenerator';
import type { WordGridPuzzle } from './types';
import { useWordGrid } from './useWordGrid';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { WordGridBoard } from './WordGridBoard';
import { Card, CardContent } from '../../components/ui/Card';
import { cn } from '../../utils/cn';
import { useChallenge } from '../challenge/ChallengeContext';

export const WordGridGame = () => {
  const { 
    state, 
    setState,
    startGame, 
    pauseGame, 
    resumeGame, 
    consumeHint,
  } = useGameEngine('WORD_GRID', 1);

  const [puzzle, setPuzzle] = useState<WordGridPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintWord, setHintWord] = useState<string | undefined>();

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const challenge = useChallenge();

  const { words, selectionPath, handlePointerDown, handlePointerMove, handlePointerUp } = useWordGrid(
    puzzle,
    state.status !== 'PLAYING',
    (moves) => setState(s => ({ ...s, moves })),
    () => setState(s => ({ ...s, status: 'COMPLETED' }))
  );

  useEffect(() => {
    if (state.status === 'READY') {
      const seedToUse = getDeterministicSeed(state);

      const generatedPuzzle = generateUniquePuzzle(
        'WORD_GRID',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateWordGridPuzzle(state.difficulty, seed,
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
        (p) => p.grid.map(row => row.join('')).join('|')
      );
      
      setPuzzle(generatedPuzzle);
      setState(s => ({ ...s, totalQuestions: generatedPuzzle.words.length, initialTimeLimit: 0 })); 
      setShowHint(false);
      setHintWord(undefined);
    }
  }, [state.status, state.difficulty, setState, state.isDailyPuzzle, state.dailyPuzzleDate]);

  const foundCount = words.filter(w => w.found).length;

  useEffect(() => {
    if (state.status === 'COMPLETED' && !isProcessingResult && profile && puzzle) {
      const handleCompletion = async () => {
        setIsProcessingResult(true);
        const finalState = { ...state, correctAnswers: foundCount, totalQuestions: puzzle.words.length };
        
        const isPerfect = (state.moves || 0) <= puzzle.words.length;
        const accuracy = isPerfect ? 100 : Math.max(0, 100 - ((state.moves || 0) - puzzle.words.length) * 5);
        
        if (challenge?.isChallengeMode) {
          challenge.onChallengeComplete({
            status: 'COMPLETED',
            score: state.score,
            xpEarned: 0,
            accuracy,
            correctAnswers: foundCount,
            totalQuestions: puzzle.words.length,
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
            accuracy: isPerfect ? 100 : Math.max(0, 100 - ((state.moves || 0) - puzzle.words.length) * 5),
            correctAnswers: foundCount,
            totalQuestions: puzzle.words.length,
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
  }, [state.status, isProcessingResult, profile, state.difficulty, state.moves, state.timeRemaining, state.hintsUsed, puzzle, foundCount]);

  const handleUseHint = () => {
    if (state.hintsUsed < state.maxHints && puzzle) {
      consumeHint();
      setShowHint(true);
      const unfound = words.filter(w => !w.found);
      if (unfound.length > 0) {
        setHintWord(unfound[0].word);
      }
    }
  };

  return (
    <>
    <GameLayout
      title="Word Grid"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={foundCount}
      totalQuestions={puzzle?.words.length || 0}
      onHint={handleUseHint}
      onPause={pauseGame}
      onRestart={() => { setPuzzle(null); startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed }); }}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="WORD_GRID"
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
            <div className="w-full grid md:grid-cols-[1fr_250px] gap-8 animate-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex flex-col items-center">
                <div className="text-center mb-4">
                  <p className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2">Find the hidden words</p>
                  {showHint && hintWord && (
                    <p className="text-primary font-medium bg-primary/10 px-4 py-2 rounded-lg inline-block">
                      💡 Look for the start of: {hintWord}
                    </p>
                  )}
                </div>
                
                <WordGridBoard 
                  puzzle={puzzle}
                  words={words}
                  selectionPath={selectionPath}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  isPaused={state.status !== 'PLAYING'}
                  hintWord={showHint ? hintWord : undefined}
                />
              </div>

              {/* Word List Sidebar */}
              <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col h-full border border-slate-700/50">
                <h3 className="font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Words to Find</h3>
                <div className="flex flex-wrap md:flex-col gap-2 overflow-y-auto max-h-[300px] md:max-h-[500px]">
                  {words.map(w => (
                    <div 
                      key={w.word}
                      className={cn(
                        "px-3 py-1.5 rounded text-sm md:text-base font-semibold transition-all duration-300",
                        w.found 
                          ? "bg-green-500/20 text-green-400 line-through decoration-2 decoration-green-500" 
                          : "bg-slate-700 text-slate-200"
                      )}
                    >
                      {w.word}
                    </div>
                  ))}
                </div>
              </div>
              
              {state.status === 'READY' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
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
