import { useState, useEffect, useRef } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import type { Difficulty } from '../core/types';
import { GameLayout } from '../../components/game/GameLayout';
import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { generateWordQuestion } from './wordPuzzleGenerator';
import type { WordQuestion } from './wordPuzzleGenerator';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const WordPuzzle = () => {
  const {
    state,
    startGame,
    pauseGame,
    resumeGame,
    submitAnswer,
    consumeHint,
    resetAttempts,
  } = useGameEngine('WORD', 10);

  const [question, setQuestion] = useState<WordQuestion | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Generate question
  useEffect(() => {
    if (state.status === 'PLAYING' && feedback === 'IDLE') {
      const seedToUse = getDeterministicSeed(state);
        
      const newQuestion = generateUniquePuzzle(
        'WORD',
        seedToUse !== undefined,
        seedToUse,
        (seed) => generateWordQuestion(state.difficulty, seed,
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
        (q) => `${q.type}_${q.answer}` // Fingerprint based on type and answer
      );

      setQuestion(newQuestion);
      setInputValue('');
      setShowHint(false);
      resetAttempts();
      
      // Auto-focus input if not multiple choice
      if (newQuestion.type !== 'DEFINITION') {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [state.currentQuestionIndex, state.status, state.difficulty, feedback, resetAttempts, state.isDailyPuzzle, state.dailyPuzzleDate]);

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
            currentLevel: profile?.level || 1,
            currentXp: profile?.xp || 0,
            difficulty: state.difficulty,
            stage: state.currentQuestionIndex !== undefined ? state.currentQuestionIndex + 1 : undefined,
            isDailyPuzzle: state.isDailyPuzzle,
            isFriendChallenge: state.isFriendChallenge,
            friendChallengeId: state.friendChallengeId,
            puzzleSeed: state.puzzleSeed,
            puzzleType: state.puzzleType,
            isNewBest: false
          });
        }
        setIsProcessingResult(false);
      };
      finishGame();
    }
  }, [state.status, state, profile, resultData, isProcessingResult]);

  const handleSubmit = (answer: string) => {
    if (state.status !== 'PLAYING' || !question || feedback !== 'IDLE') return;

    let isCorrect = false;
    
    if (question.type === 'DEFINITION') {
      isCorrect = answer === question.answer;
    } else {
      isCorrect = answer.trim().toUpperCase() === question.answer.toUpperCase();
    }

    if (isCorrect) {
      setFeedback('CORRECT');
      submitAnswer(true, state.difficulty);
      setTimeout(() => {
        setFeedback('IDLE');
      }, 1000);
    } else {
      setFeedback('INCORRECT');
      submitAnswer(false, state.difficulty);
      setTimeout(() => {
        setFeedback('IDLE');
        if (question.type !== 'DEFINITION') {
          inputRef.current?.focus();
        }
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSubmit(inputValue);
    }
  };

  const handleHint = () => {
    setShowHint(true);
    consumeHint();
    if (question?.type !== 'DEFINITION') {
      inputRef.current?.focus();
    }
  };

  if (state.status === 'READY') {
    return (
      <GameStartScreen
        title="Word Puzzle"
        description="Unscramble words, fill in missing letters, or find the right synonym."
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
      title="WORD"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={state.currentQuestionIndex || 1}
      totalQuestions={state.totalQuestions || 1}
      onHint={handleHint || undefined}
      onPause={pauseGame}
      onRestart={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="WORD"
      puzzleState={question}
    >
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        {question && (
          <Card className="w-full">
            <CardContent className="p-8 flex flex-col items-center">
              
              <div className="mb-8 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-surface text-textMuted text-xs font-bold uppercase tracking-wider mb-4">
                  {question.type.replace('_', ' ')}
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-textMain tracking-widest break-all">
                  {question.prompt}
                </h2>
              </div>

              {showHint && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl w-full text-center text-primary font-medium">
                  {question.hint}
                </div>
              )}

              {question.type === 'DEFINITION' && question.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                  {question.options.map((opt) => (
                    <Button
                      key={opt}
                      variant="secondary"
                      size="lg"
                      className="py-6 text-lg font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      onClick={() => handleSubmit(opt)}
                      disabled={feedback !== 'IDLE'}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex w-full max-w-md gap-2 mt-4">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    disabled={feedback !== 'IDLE'}
                    placeholder="Type your answer..."
                    className="text-center text-xl font-bold uppercase"
                    maxLength={question.answer.length + 5}
                  />
                  <Button 
                    size="lg" 
                    onClick={() => handleSubmit(inputValue)}
                    disabled={!inputValue.trim() || feedback !== 'IDLE'}
                  >
                    Submit
                  </Button>
                </div>
              )}

              {feedback === 'INCORRECT' && (
                <div className="mt-6 text-error font-bold text-lg animate-shake">
                  Incorrect! Try again.
                </div>
              )}
              {feedback === 'CORRECT' && (
                <div className="mt-6 text-success font-bold text-lg animate-in slide-in-from-bottom-2">
                  Correct! +Points
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <PauseModal
        isOpen={state.status === 'PAUSED'}
        onResume={resumeGame}
        onQuit={() => {}} 
      />

      {resultData && (
        <ResultModal
          isOpen={true}
          data={resultData}
          onPlayAgain={(diff) => {
            setResultData(null);
            startGame(diff, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed });
          }}
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
