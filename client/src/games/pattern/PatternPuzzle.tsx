import { useState, useEffect } from 'react';
import { useGameEngine } from '../core/useGameEngine';
import { GameLayout } from '../../components/game/GameLayout';
import type { Difficulty } from '../core/types';
import { GameStartScreen } from '../../components/game/GameStartScreen';
import { PauseModal, ResultModal, LevelUpModal } from '../../components/game/Modals';
import type { GameResultModalData } from '../../components/game/Modals';
import { getPatternConfig, type PatternQuestion } from './patternPuzzleGenerator';
import { generateUniquePuzzle, getDeterministicSeed } from '../../utils/puzzleFingerprint';
import { processGameResult } from '../../services/gameResultService';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { ArrowRight } from 'lucide-react';

export const PatternPuzzle = () => {
  const [_showHint, setShowHint] = useState(false);
  const { state, startGame, submitAnswer, pauseGame, resumeGame, consumeHint, setState } = useGameEngine('PATTERN');
  
  const [questions, setQuestions] = useState<PatternQuestion[]>([]);
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
        'PATTERN',
        seedToUse !== undefined,
        seedToUse,
        (seed) => getPatternConfig(state.difficulty, seed,
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
    const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
    const configs = difficulties.map(diff => {
      const config = getPatternConfig(diff, 0); // use dummy seed for config values
      return {
        difficulty: diff,
        timeLimit: config.timeLimit,
        questions: 5,
        hints: config.maxHints
      };
    });

    return (
      <GameStartScreen
        title="Pattern Puzzle"
        description="Identify the sequence, rotation, or progression in geometric patterns."
        configs={configs}
        onStart={(diff) => startGame(diff, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed })}
      />
    );
  }

  return (
    <GameLayout
      title="Pattern Puzzle"
      difficulty={state.difficulty}
      timeRemaining={state.timeRemaining}
      score={state.score}
      currentQuestion={state.currentQuestionIndex}
      totalQuestions={state.totalQuestions}
      onHint={handleHintClick}
      onPause={pauseGame}
      onRestart={() => { setQuestions([]); startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed }); }}
      hintsUsed={state.hintsUsed}
      maxHints={state.maxHints}
      isDailyPuzzle={state.isDailyPuzzle}
      gameType="PATTERN"
      puzzleState={state}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        {question && (
          <div className="w-full">
            <div className="bg-surface border border-border/50 rounded-2xl p-6 md:p-8 mb-8 text-center shadow-lg relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
               <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 border border-primary/30">
                {question.type.replace('_', ' ')}
              </span>
              
              <div className="flex flex-wrap justify-center items-center gap-4 text-4xl md:text-5xl text-textMain">
                {question.sequence.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className={`w-16 h-16 flex items-center justify-center rounded-xl ${
                      item === '?' ? 'bg-primary/10 border-2 border-dashed border-primary text-primary animate-pulse' : 'bg-background border border-border/50'
                    }`}>
                      {item}
                    </span>
                    {idx < question.sequence.length - 1 && (
                      <ArrowRight className="w-6 h-6 text-textMuted/50 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {_showHint && (
              <div className="mb-8 p-4 bg-primary/10 border border-primary/30 rounded-xl text-center text-primary font-medium animate-in fade-in slide-in-from-top-4">
                💡 Hint: {question.hint}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {question.options.map((opt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="lg"
                  className={`py-8 text-4xl h-auto shadow-md transition-all ${
                    feedback !== 'IDLE' && i === question.correctIndex ? 'bg-success/20 text-success border-success/50' :
                    feedback === 'INCORRECT' && _showHint === false ? 'bg-error/20 text-error border-error/50' : 
                    'hover:scale-[1.05] hover:bg-primary/10 hover:border-primary/50'
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
                Correct! Great pattern recognition.
              </div>
            )}
          </div>
        )}
      </div>

      {state.status === 'PAUSED' && (
        <PauseModal 
          onResume={resumeGame}
          onRestart={() => { setQuestions([]); startGame(state.difficulty, { isFriendChallenge: state.isFriendChallenge, friendChallengeId: state.friendChallengeId, puzzleSeed: state.puzzleSeed }); }}
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
                  setQuestions([]);
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
