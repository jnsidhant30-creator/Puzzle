import { useState, useEffect, useRef } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import type { Difficulty } from '../core/types';
import { GameLayout } from '../../components/game/GameLayout';
import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateNumberQuestion } from './numberPuzzleGenerator';
import type { NumberQuestion } from './numberPuzzleGenerator';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Check, X, AlertCircle } from 'lucide-react';

export const NumberPuzzle = () => {
  const { 
    state, 
    startGame, 
    pauseGame, 
    resumeGame, 
    submitAnswer, 
    consumeHint,
    resetAttempts,
    setState
  } = useGameEngine('NUMBER', 10);

  const [question, setQuestion] = useState<NumberQuestion | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Generate question on game start or when moving to next question
  useEffect(() => {
    if (state.status === 'PLAYING' && feedback === 'IDLE') {
      const seedToUse = getDeterministicSeed(state);
      
      const newQuestion = generateUniquePuzzle(
        'NUMBER',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateNumberQuestion(state.difficulty, seed),
        (q) => q.expression,
        (seed) => {
          if (!state.isDailyPuzzle && !state.isFriendChallenge) {
            setState(s => {
              const currentSeeds = Array.isArray(s.puzzleSeed) ? [...s.puzzleSeed] : [];
              currentSeeds[state.currentQuestionIndex] = seed;
              return { ...s, puzzleSeed: currentSeeds };
            });
          }
        }
      );

      // Small delay before showing new question if we just answered
      setQuestion(newQuestion);
      setInputValue('');
      setShowHint(false);
      resetAttempts();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.currentQuestionIndex, state.status, state.difficulty, feedback, resetAttempts, state.isDailyPuzzle, state.dailyPuzzleDate, state.isFriendChallenge, state.puzzleSeed, setState]);

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
          // Fallback if profile is null (e.g. unauthenticated)
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
            isDailyPuzzle: state.isDailyPuzzle,
            isFriendChallenge: state.isFriendChallenge,
            friendChallengeId: state.friendChallengeId,
            puzzleSeed: state.puzzleSeed,
            puzzleType: state.puzzleType,
          });
        }
        setIsProcessingResult(false);
      };

      finishGame();
    }
  }, [state, profile, resultData, isProcessingResult]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue || feedback !== 'IDLE' || !question) return;

    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) return;

    const isCorrect = parsed === question.answer;

    if (isCorrect) {
      setFeedback('CORRECT');
      setTimeout(() => {
        setFeedback('IDLE');
        submitAnswer(true);
      }, 1000);
    } else {
      setFeedback('INCORRECT');
      submitAnswer(false);
      setTimeout(() => {
        setFeedback('IDLE');
        setInputValue('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 1500);
    }
  };

  const handleHint = () => {
    consumeHint();
    setShowHint(true);
  };

  if (state.status === 'READY') {
    const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
    const configs = difficulties.map(diff => {
      // Default engine times: EASY 300, MEDIUM 240, HARD 180, EXPERT 120
      const timeLimit = diff === 'EASY' ? 300 : diff === 'MEDIUM' ? 240 : diff === 'HARD' ? 180 : 120;
      return {
        difficulty: diff,
        timeLimit: timeLimit,
        questions: 10,
        hints: 3
      };
    });

    return (
      <GameStartScreen
        title="Number Puzzle"
        description="Solve the mathematical expressions as fast as you can."
        configs={configs}
        onStart={(diff) => startGame(diff, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      />
    );
  }

  return (
    <>
    <GameLayout
      title="Number Puzzle"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={state.currentQuestionIndex + 1}
      totalQuestions={state.totalQuestions}
      onHint={handleHint}
      onPause={pauseGame}
      onRestart={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="NUMBER"
      puzzleState={question}
      instructions={
        <>
          <p>Solve the mathematical expressions as fast as you can.</p>
          <p>Enter the correct number to proceed to the next question.</p>
        </>
      }
    >

      <Card className="glass border-border/50 relative overflow-hidden min-h-[300px]">
        {/* Progress bar background */}
        <div 
          className="absolute top-0 left-0 h-1 bg-primary/30 transition-all duration-500 ease-out"
          style={{ width: `${((state.currentQuestionIndex) / state.totalQuestions) * 100}%` }}
        />

        <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center">
          {question ? (
            <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              
              <div className="text-center">
                <p className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4">Solve this:</p>
                <h2 className="text-5xl md:text-6xl font-bold text-textMain font-mono tracking-tight drop-shadow-sm">
                  {question.expression} = ?
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input 
                    ref={inputRef}
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`text-center text-3xl font-mono h-16 ${
                      feedback === 'CORRECT' ? 'border-success text-success bg-success/5' :
                      feedback === 'INCORRECT' ? 'border-error text-error bg-error/5' : ''
                    }`}
                    placeholder="Enter answer"
                    disabled={feedback !== 'IDLE'}
                    autoFocus
                  />
                  {feedback === 'CORRECT' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success animate-in zoom-in duration-300">
                      <Check className="w-8 h-8" />
                    </div>
                  )}
                  {feedback === 'INCORRECT' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-error animate-in zoom-in duration-300">
                      <X className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg" 
                  disabled={!inputValue || feedback !== 'IDLE'}
                >
                  Submit Answer
                </Button>
              </form>

              {/* Feedback Message */}
              <div className="h-8 flex items-center justify-center">
                {feedback === 'INCORRECT' && (
                  <p className="text-error font-bold animate-in slide-in-from-bottom-2">
                    Incorrect. Try again!
                  </p>
                )}
                {feedback === 'CORRECT' && (
                  <p className="text-success font-bold animate-in slide-in-from-bottom-2">
                    Correct! +Points
                  </p>
                )}
                {state.attempts >= 2 && feedback === 'IDLE' && !showHint && (
                  <p className="text-warning text-sm font-medium flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-4 h-4" /> Having trouble? Try using a hint.
                  </p>
                )}
                {showHint && feedback === 'IDLE' && (
                  <p className="text-primary text-sm font-medium bg-primary/10 px-4 py-2 rounded-lg animate-in slide-in-from-top-2">
                    💡 {question.hint}
                  </p>
                )}
              </div>

            </div>
          ) : (
             <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </CardContent>
      </Card>

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
