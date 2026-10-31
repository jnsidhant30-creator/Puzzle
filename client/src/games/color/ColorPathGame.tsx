import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import type { Difficulty } from '../core/types';
import { GameLayout } from '../../components/game/GameLayout';
import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateColorPathPuzzle } from './colorPathGenerator';
import type { ColorPathPuzzle } from './types';
import { useColorPathGame } from './useColorPathGame';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent } from '../../components/ui/Card';
import { ColorBoard } from './ColorBoard';
import { useChallenge } from '../challenge/ChallengeContext';

export const ColorPathGame = () => {
  const { 
    state, 
    setState,
    startGame, 
    pauseGame, 
    resumeGame, 
    consumeHint,
  } = useGameEngine('COLOR_PATH', 1); // 1 puzzle per game

  const [puzzle, setPuzzle] = useState<ColorPathPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState('');

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const challenge = useChallenge();

  const { grid, handleStartDraw, handleDraw, handleEndDraw, completedPairs } = useColorPathGame(
    puzzle,
    state.status !== 'PLAYING',
    (moves) => setState(s => ({ ...s, moves })),
    (matched) => setState(s => ({ ...s, pairsMatched: matched, correctAnswers: matched })),
    () => setState(s => ({ ...s, status: 'COMPLETED' }))
  );

  // Generate puzzle on game start
  useEffect(() => {
    if (state.status === 'READY') {
      const seedToUse = getDeterministicSeed(state);

      const generatedPuzzle = generateUniquePuzzle(
        'COLOR_PATH',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateColorPathPuzzle(state.difficulty, seed,
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
        (p) => p.pairs.map(pair => `${pair.colorId}:${pair.start.r},${pair.start.c}-${pair.target.r},${pair.target.c}`).join('|')
      );
      
      setPuzzle(generatedPuzzle);
      setState(s => ({ ...s, totalPairs: generatedPuzzle.pairs.length, totalQuestions: generatedPuzzle.pairs.length }));
      setShowHint(false);
      setHintMessage('');
    }
  }, [state.status, state.difficulty, state.isDailyPuzzle, state.dailyPuzzleDate, setState]);

  // Process game end
  useEffect(() => {
    if ((state.status === 'COMPLETED' || state.status === 'TIMEOUT') && !resultData && !isProcessingResult) {
      const finishGame = async () => {
        setIsProcessingResult(true);
        
        if (challenge?.isChallengeMode) {
          challenge.onChallengeComplete({
            status: state.status as 'COMPLETED' | 'TIMEOUT',
            score: state.score,
            xpEarned: 0,
            accuracy: state.totalQuestions > 0 ? Math.round((state.correctAnswers / state.totalQuestions) * 100) : 0,
            correctAnswers: state.pairsMatched || 0,
            totalQuestions: state.totalPairs || 1,
            hintsUsed: state.hintsUsed,
            timeTaken: state.initialTimeLimit - state.timeRemaining,
            currentLevel: profile?.level || 1,
            currentXp: profile?.xp || 0
          });
          return;
        }
        
        const res = await processGameResult(state, profile);
        
        if (res) {
          setResultData({
            status: res.status as 'COMPLETED' | 'TIMEOUT',
            score: res.score,
            xpEarned: res.xpEarned,
            accuracy: res.accuracy,
            correctAnswers: state.pairsMatched || 0,
            totalQuestions: state.totalPairs || 1,
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
            accuracy: 100,
            correctAnswers: state.pairsMatched || 0,
            totalQuestions: state.totalPairs || 1,
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

  const handleHint = () => {
    if (state.hintsUsed >= state.maxHints) return;
    consumeHint();
    setShowHint(true);
    
    // Generate a contextual hint based on hints used
    if (!puzzle) return;
    
    // Find a pair that is not completed
    const incompletePair = puzzle.pairs.find(p => !completedPairs.has(p.colorId));
    if (incompletePair) {
      if (state.hintsUsed === 0) {
        setHintMessage(`Focus on the ${incompletePair.label} endpoints.`);
      } else if (state.hintsUsed === 1) {
        setHintMessage(`The ${incompletePair.label} path has ${puzzle.solution[incompletePair.colorId].length} steps.`);
      } else {
        setHintMessage(`Try connecting the ${incompletePair.label} pair first to clear up space.`);
      }
    } else {
      setHintMessage('You are almost done!');
    }
  };

  if (state.status === 'READY') {
    const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
    const configs = difficulties.map(diff => {
      const timeLimit = diff === 'EASY' ? 300 : diff === 'MEDIUM' ? 240 : diff === 'HARD' ? 180 : 120;
      return {
        difficulty: diff,
        timeLimit: timeLimit,
        questions: 1, // 1 puzzle per session
        hints: 3
      };
    });

    return (
      <GameStartScreen
        title="Color Path"
        description="Connect all matching color pairs with non-overlapping paths to fill the board."
        configs={configs}
        onStart={(diff) => startGame(diff, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      />
    );
  }

  return (
    <>
    <GameLayout
      title="Color Path"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={completedPairs.size}
      totalQuestions={puzzle?.pairs.length || 1}
      onHint={handleHint}
      onPause={pauseGame}
      onRestart={() => { setPuzzle(null); startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed }); }}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="COLOR_PATH"
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
                <p className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2">Connect the Colors</p>
                {showHint && (
                  <p className="text-primary font-medium bg-primary/10 px-4 py-2 rounded-lg inline-block">
                    💡 {hintMessage}
                  </p>
                )}
              </div>
              
              <ColorBoard 
                puzzle={puzzle}
                grid={grid}
                onStartDraw={handleStartDraw}
                onDraw={handleDraw}
                onEndDraw={handleEndDraw}
              />
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
