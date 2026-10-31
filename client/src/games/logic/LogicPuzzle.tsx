import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import type { Difficulty } from '../core/types';
import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { getLogicConfig, type LogicQuestion } from './logicPuzzleGenerator';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';

export const LogicPuzzle = () => {
  const [_showHint, setShowHint] = useState(false);
  const { state, startGame, submitAnswer, pauseGame, resumeGame, consumeHint, setState } = useGameEngine('LOGIC');
  
  const [questions, setQuestions] = useState<LogicQuestion[]>([]);
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');

  const { profile } = useAuthStore();
  const [resultData, setResultData] = useState<GameResultModalData | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{oldLevel: number, newLevel: number, xpEarned: number} | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const question = questions[state.currentQuestionIndex];

  useEffect(() => {
    if (state.status === 'PLAYING' && questions.length === 0) {
      const seedToUse = getDeterministicSeed(state);

      const config = generateUniquePuzzle(
        'LOGIC',
        seedToUse !== undefined,
        seedToUse,
        (seed) => getLogicConfig(state.difficulty, seed,
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
        (c) => c.questions.map(q => q.id).join(',')
      );

      setQuestions(config.questions);
      setShowHint(false);
      setFeedback('IDLE');
      
      setState(s => ({
        ...s,
        totalQuestions: config.questions.length,
        timeRemaining: config.timeLimit,
        initialTimeLimit: config.timeLimit,
        maxHints: config.maxHints,
        hintsUsed: 0
      }));
    }
  }, [state.status, state.difficulty, questions.length, state.isDailyPuzzle, state.dailyPuzzleDate]);

  useEffect(() => {
    if (state.status === 'READY') {
      setQuestions([]);
      setResultData(null);
      setFeedback('IDLE');
      setShowHint(false);
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

  const handleOptionClick = (index: number) => {
    if (state.status !== 'PLAYING' || !question || feedback !== 'IDLE') return;

    if (index === question.correctIndex) {
      setFeedback('CORRECT');
      submitAnswer(true, state.difficulty);
    } else {
      setFeedback('INCORRECT');
      submitAnswer(false, state.difficulty);
    }

    setTimeout(() => {
      setFeedback('IDLE');
      setShowHint(false);
    }, 1200);
  };

  const handleHintClick = () => {
    setShowHint(true);
    consumeHint();
  };

  if (state.status === 'READY') {
    return (
      <GameStartScreen
        title="Logic Puzzle"
        description="Solve sequences, deduction, and conditional logic problems."
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
      title="LOGIC"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={state.currentQuestionIndex || 1}
      totalQuestions={state.totalQuestions || 1}
      onHint={handleHintClick || undefined}
      onPause={pauseGame}
      onRestart={() => startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="LOGIC"
      puzzleState={state}
    >
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        {question && (
          <div className="w-full">
            <div className="bg-surface border-2 border-border/50 rounded-2xl p-6 md:p-8 mb-8 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/30">
                {question.type.replace('_', ' ')}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-textMain leading-relaxed">
                {question.text}
              </h2>
            </div>

            {_showHint && (
              <div className="mb-8 p-4 bg-primary/10 border border-primary/30 rounded-xl text-center text-primary font-medium animate-in fade-in slide-in-from-top-4">
                💡 Hint: {question.hint}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((opt, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  size="lg"
                  className={`py-8 px-6 text-xl font-semibold break-words h-auto shadow-md transition-all ${
                    feedback !== 'IDLE' && i === question.correctIndex ? 'bg-success/20 text-success border-success/50' :
                    feedback === 'INCORRECT' && _showHint === false /* naive check */ ? 'bg-error/20 text-error border-error/50' : 
                    'hover:scale-[1.02] hover:bg-primary/10 hover:border-primary/50'
                  }`}
                  onClick={() => handleOptionClick(i)}
                  disabled={feedback !== 'IDLE'}
                >
                  {opt}
                </Button>
              ))}
            </div>
            
            {feedback === 'INCORRECT' && (
              <div className="mt-8 text-error font-bold text-xl text-center animate-shake">
                Incorrect! Try again next question.
              </div>
            )}
            {feedback === 'CORRECT' && (
              <div className="mt-8 text-success font-bold text-xl text-center animate-in slide-in-from-bottom-4">
                Correct! Excellent deduction.
              </div>
            )}
          </div>
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
