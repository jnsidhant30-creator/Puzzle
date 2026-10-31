import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import type { Difficulty } from '../core/types';


import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateMemoryBoard, getPairsCountForDifficulty, getPreviewTimeForDifficulty } from './memoryPuzzleGenerator';
import type { MemoryCard } from './memoryPuzzleGenerator';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { calculateQuestionScore } from '../../services/scoringService';
import { useAuthStore } from '../../store/useAuthStore';
// import { Button } from '../../components/ui/Button'; // removed unused import

export const MemoryPuzzle = () => {
  const [_showHint, setShowHint] = useState(false);
  // Override the standard 10 questions, treat the whole board as 1 "question" for simple engine compatibility
  const {
    state,
    setState,
    startGame,
    pauseGame,
    resumeGame,
    consumeHint,
  } = useGameEngine('MEMORY', 1);

  const [board, setBoard] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]); // indices
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
    const [hintedPair, setHintedPair] = useState<number[]>([]);

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Initialize board
  useEffect(() => {
    if (state.status === 'PLAYING' && board.length === 0) {
      const seedToUse = getDeterministicSeed(state);

      const newBoard = generateUniquePuzzle(
        'MEMORY',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateMemoryBoard(state.difficulty as Difficulty, seed,
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
        (b) => b.map(c => c.value).join('')
      );

      // Temporarily flip all cards for preview
      setBoard(newBoard.map(c => ({...c, isFlipped: true})));
      setIsLocked(true);
      
      setTimeout(() => {
        setBoard(newBoard.map(c => ({...c, isFlipped: false})));
        setIsLocked(false);
      }, getPreviewTimeForDifficulty(state.difficulty as Difficulty));
      
      setFlippedCards([]);
      setMoves(0);
      setMatchedPairs(0);
      setHintedPair([]);
    }
  }, [state.status, state.difficulty, board.length, state.isDailyPuzzle, state.dailyPuzzleDate]);

  // Handle Game Restart
  useEffect(() => {
    if (state.status === 'READY' && board.length > 0) {
       setBoard([]);
       setResultData(null);
    }
  }, [state.status]);

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

  const handleCardClick = (index: number) => {
    if (isLocked || state.status !== 'PLAYING') return;
    if (board[index].isFlipped || board[index].isMatched) return;

    const newBoard = [...board];
    newBoard[index].isFlipped = true;
    setBoard(newBoard);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);

      const [firstIndex, secondIndex] = newFlipped;
      if (newBoard[firstIndex].pairId === newBoard[secondIndex].pairId) {
        // Match!
        setTimeout(() => {
          const matchedBoard = [...newBoard];
          matchedBoard[firstIndex].isMatched = true;
          matchedBoard[secondIndex].isMatched = true;
          setBoard(matchedBoard);
          setFlippedCards([]);
          setIsLocked(false);
          setHintedPair([]);
          
          const newMatchedPairs = matchedPairs + 1;
          setMatchedPairs(newMatchedPairs);

          const totalPairs = getPairsCountForDifficulty(state.difficulty as Difficulty);
          
          // Calculate score for this pair
          const timeTakenMs = Date.now() - state.questionStartTime;
          const points = calculateQuestionScore(
            state.difficulty,
            true,
            timeTakenMs,
            (state.initialTimeLimit / totalPairs) * 1000,
            state.hintsUsed
          );

          if (newMatchedPairs >= totalPairs) {
            // Game Won
            setState(prev => ({
              ...prev,
              score: prev.score + points,
              correctAnswers: totalPairs,
              totalQuestions: totalPairs,
              moves: moves + 1,
              status: 'COMPLETED'
            }));
          } else {
            // Still playing
            setState(prev => ({
              ...prev,
              score: prev.score + points,
              questionStartTime: Date.now(),
              hintsUsed: 0
            }));
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetBoard = [...newBoard];
          resetBoard[firstIndex].isFlipped = false;
          resetBoard[secondIndex].isFlipped = false;
          setBoard(resetBoard);
          setFlippedCards([]);
          setIsLocked(false);
          
          // Deduct points for mismatch? (Optional, skipping for now to align with base requirements)
        }, 800);
      }
    }
  };

  const handleHint = () => {
    if (state.hintsUsed < state.maxHints) {
      consumeHint();
      setShowHint(true);
      
      // Find an unmatched pair to hint
      const unmatched = board.map((c, i) => ({...c, originalIndex: i})).filter(c => !c.isMatched && !c.isFlipped);
      if (unmatched.length > 0) {
        const targetPairId = unmatched[0].pairId;
        const matchingIndices = unmatched.filter(c => c.pairId === targetPairId).map(c => c.originalIndex);
        setHintedPair(matchingIndices);
        
        setTimeout(() => {
          setHintedPair([]);
        }, 2000);
      }
    }
  };

  if (state.status === 'READY') {
    const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
    const configs = difficulties.map(diff => {
      // Default engine times: EASY 300, MEDIUM 240, HARD 180, EXPERT 120
      const timeLimit = diff === 'EASY' ? 300 : diff === 'MEDIUM' ? 240 : diff === 'HARD' ? 180 : 120;
      return {
        difficulty: diff,
        timeLimit: timeLimit,
        hints: 3
      };
    });

    return (
      <GameStartScreen
        title="Memory Puzzle"
        description="Test your memory and match all the pairs!"
        configs={configs}
        onStart={(diff) => startGame(diff, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      />
    );
  }

  const gridCols = state.difficulty === 'EASY' ? 'grid-cols-4' 
    : state.difficulty === 'MEDIUM' ? 'grid-cols-4 md:grid-cols-6'
    : state.difficulty === 'HARD' ? 'grid-cols-4 md:grid-cols-8'
    : 'grid-cols-5 md:grid-cols-10';

  return (
    <>
    <GameLayout
      title="Memory Puzzle"
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
      gameType="MEMORY"
      puzzleState={state}
      instructions={
        <>
          <p>Test your memory and match all the pairs!</p>
          <p className="mt-2 font-bold text-primary">Moves: {moves}</p>
        </>
      }
    >
      <div className="w-full flex flex-col items-center">
        <div className={`grid gap-3 ${gridCols}`}>
          {board.map((card, index) => {
            const isHinted = hintedPair.includes(index);
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                disabled={card.isFlipped || card.isMatched || isLocked || state.status !== 'PLAYING'}
                className={`
                  relative aspect-[3/4] rounded-xl transition-all duration-500 transform-gpu preserve-3d cursor-pointer
                  ${(card.isFlipped || card.isMatched) ? 'rotate-y-180' : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20'}
                  ${isHinted ? 'ring-4 ring-primary animate-pulse' : ''}
                `}
              >
                {/* Card Back */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 rounded-xl flex items-center justify-center">
                  <span className="text-3xl opacity-20">?</span>
              </div>
              
              {/* Card Front */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-surface border-2 border-primary rounded-xl flex items-center justify-center text-5xl shadow-inner">
                {card.isMatched && <div className="absolute inset-0 bg-success/20 rounded-xl" />}
                <span className={card.isMatched ? 'animate-bounce' : ''}>
                  {card.value}
                </span>
              </div>
            </button>
          )
        })}
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
