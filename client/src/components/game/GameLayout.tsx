import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Trophy, Target, 
  Lightbulb, Pause, RotateCcw, AlertCircle, HelpCircle 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TutorialModal, TUTORIAL_DATA } from './TutorialModal';
import type { Difficulty, PuzzleType } from '../../games/core/types';
import { HintControl } from './HintControl';

interface GameLayoutProps {
  title: string;
  difficulty?: Difficulty;
  timeRemaining?: number;
  score?: number;
  currentQuestion?: number;
  totalQuestions?: number;
  onHint?: () => void;
  onPause?: () => void;
  onRestart?: () => void;
  onExit?: () => void;
  hintsUsed?: number;
  maxHints?: number;
  hintText?: string;
  isDailyPuzzle?: boolean;
  instructions?: React.ReactNode;
  children: React.ReactNode;
  gameType?: PuzzleType;
  puzzleState?: any;
}

export const GameLayout = ({
  title,
  difficulty,
  timeRemaining,
  score,
  currentQuestion,
  totalQuestions,
  onHint,
  onPause,
  onRestart,
  onExit,
  hintsUsed = 0,
  maxHints = 0,
  hintText,
  isDailyPuzzle,
  instructions,
  children,
  gameType,
  puzzleState
}: GameLayoutProps) => {
  const [confirmHint, setConfirmHint] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [showManualTutorial, setShowManualTutorial] = useState(false);
  
  // Stage 2 Toast
  const [stage2Toast, setStage2Toast] = useState<string | null>(null);
  const hasTriggeredStage2 = React.useRef(false);

  useEffect(() => {
    // Only trigger once, when the user interacts (score increases, question advances, or hint used)
    if (!hasTriggeredStage2.current && (score! > 0 || (currentQuestion && currentQuestion > 1) || hintsUsed > 0)) {
      hasTriggeredStage2.current = true;
      const content = TUTORIAL_DATA[title] || TUTORIAL_DATA['Challenge Run'];
      
      // Check localStorage to not show Stage 2 repeatedly across sessions if they've already seen it 3+ times
      const storageKey = `stage2_seen_${title}`;
      const seenCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
      
      if (content?.stage2 && seenCount < 3) {
        setStage2Toast(content.stage2);
        localStorage.setItem(storageKey, (seenCount + 1).toString());
        
        setTimeout(() => {
          setStage2Toast(null);
        }, 6000);
      }
    }
  }, [score, currentQuestion, hintsUsed, title]);

  const hintsRemaining = maxHints - hintsUsed;

  // Formatting Time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarningTime = timeRemaining !== undefined && timeRemaining <= 30 && timeRemaining > 10;
  const isCriticalTime = timeRemaining !== undefined && timeRemaining <= 10;

  // Reset confirmations after a few seconds if not clicked
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (confirmHint) {
      timeout = setTimeout(() => setConfirmHint(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [confirmHint]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (confirmRestart) {
      timeout = setTimeout(() => setConfirmRestart(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [confirmRestart]);

  const handleHintClick = () => {
    if (confirmHint && onHint) {
      onHint();
      setConfirmHint(false);
    } else {
      setConfirmHint(true);
    }
  };

  const handleRestartClick = () => {
    if (confirmRestart && onRestart) {
      onRestart();
      setConfirmRestart(false);
    } else {
      setConfirmRestart(true);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto overflow-y-auto animate-in fade-in duration-500 custom-scrollbar">
      
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6 gap-2">
        <div className="flex-shrink-0">
          <Link to="/puzzles" onClick={onExit} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors p-2 rounded-lg hover:bg-surface-elevated">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-semibold">Back</span>
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-textMain tracking-widest uppercase truncate w-full px-2">{title}</h1>
          {difficulty && (
            <span className="text-[10px] sm:text-xs font-bold text-primary mt-1 uppercase tracking-widest">{difficulty}</span>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <Button variant="ghost" onClick={() => setShowManualTutorial(true)} className="text-textMuted hover:text-textMain px-2 sm:px-3">
            <HelpCircle className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">How to Play</span>
          </Button>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="flex items-center justify-between sm:justify-center sm:gap-16 mb-8 border-y border-border/50 py-4 px-2">
        {timeRemaining !== undefined && (
          <div className="text-center flex-1 sm:flex-none">
            <p className="text-[10px] sm:text-xs font-bold text-textMuted uppercase tracking-widest mb-1">Time</p>
            <p className={`text-xl sm:text-2xl font-mono font-bold ${isCriticalTime ? 'text-error animate-pulse' : isWarningTime ? 'text-warning' : 'text-textMain'}`}>
              {formatTime(timeRemaining)}
            </p>
          </div>
        )}
        
        {score !== undefined && (
          <div className="text-center flex-1 sm:flex-none border-l border-r border-border/30 sm:border-0 px-2 sm:px-0">
            <p className="text-[10px] sm:text-xs font-bold text-textMuted uppercase tracking-widest mb-1">Score</p>
            <p className="text-xl sm:text-2xl font-mono font-bold text-textMain">
              {score.toLocaleString()}
            </p>
          </div>
        )}
        
        {totalQuestions !== undefined && currentQuestion !== undefined && (
          <div className="text-center flex-1 sm:flex-none">
            <p className="text-[10px] sm:text-xs font-bold text-textMuted uppercase tracking-widest mb-1">Progress</p>
            <p className="text-xl sm:text-2xl font-mono font-bold text-textMain">
              {currentQuestion}/{totalQuestions}
            </p>
          </div>
        )}
      </div>
      
      {/* Game Board */}
      <div className="flex-1 w-full flex items-center justify-center min-h-[400px] relative">
        {children}

        {/* Stage 2 Inline Toast */}
        {stage2Toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="bg-primary/95 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-2xl shadow-primary/20 flex items-center gap-3 border border-primary-hover/50 max-w-md">
              <Lightbulb className="w-5 h-5 shrink-0 text-secondary" />
              <p className="text-sm font-semibold tracking-wide leading-tight">{stage2Toast}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Hint Message */}
      {hintText && (
        <div className="mt-6 text-center animate-in slide-in-from-bottom-2">
          <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" /> {hintText}
          </span>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-8 mt-8 pb-[env(safe-area-inset-bottom)]">
        {onHint && gameType && difficulty ? (
          <HintControl 
            gameType={gameType}
            difficulty={difficulty}
            puzzleState={puzzleState}
            hintsUsed={hintsUsed}
            maxHints={maxHints}
            onUseHint={onHint}
          />
        ) : onHint ? (
          <Button 
            variant={confirmHint ? "primary" : "secondary"}
            onClick={handleHintClick}
            disabled={hintsRemaining <= 0 && !confirmHint}
            className={`flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px] text-xs sm:text-sm ${confirmHint ? 'animate-pulse' : ''}`}
          >
            {confirmHint ? <AlertCircle className="w-4 h-4 mr-1 sm:mr-2" /> : <Lightbulb className="w-4 h-4 mr-1 sm:mr-2" />}
            {confirmHint ? 'Confirm' : `Hints: ${hintsUsed}/${maxHints}`}
          </Button>
        ) : null}
        
        {onPause && (
          <Button variant="ghost" onClick={onPause} className="flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm border border-border/50 hover:bg-surface">
            <Pause className="w-4 h-4 mr-1 sm:mr-2" />
            Pause
          </Button>
        )}
        
        {onRestart && !isDailyPuzzle && (
          <Button 
            variant="ghost" 
            onClick={handleRestartClick} 
            className={`flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm border border-border/50 ${confirmRestart ? 'text-error bg-error/10 border-error/50' : 'hover:text-error hover:bg-error/10 hover:border-error/30'}`}
          >
            {confirmRestart ? <AlertCircle className="w-4 h-4 mr-1 sm:mr-2" /> : <RotateCcw className="w-4 h-4 mr-1 sm:mr-2" />}
            {confirmRestart ? 'Sure?' : 'Restart'}
          </Button>
        )}
      </div>

      {/* Modals */}
      {showManualTutorial && (
        <TutorialModal
          gameTitle={title}
          stage="manual"
          onClose={() => setShowManualTutorial(false)}
          onSkip={() => setShowManualTutorial(false)}
        />
      )}
    </div>
  );
};
