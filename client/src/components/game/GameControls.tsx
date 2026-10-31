import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Lightbulb, Pause, RotateCcw, AlertCircle } from 'lucide-react';


interface GameControlsProps {
  onHint: () => void;
  onPause: () => void;
  onRestart: () => void;
  hintsUsed: number;
  maxHints: number;
  hintText?: string;
  isDailyPuzzle?: boolean;
}

export const GameControls = ({ onHint, onPause, onRestart, hintsUsed, maxHints, hintText, isDailyPuzzle }: GameControlsProps) => {
  const [confirmHint, setConfirmHint] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const hintsRemaining = maxHints - hintsUsed;

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
    if (confirmHint) {
      onHint();
      setConfirmHint(false);
    } else {
      setConfirmHint(true);
    }
  };

  const handleRestartClick = () => {
    if (confirmRestart) {
      onRestart();
      setConfirmRestart(false);
    } else {
      setConfirmRestart(true);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-border">
        <Button 
          variant="secondary"
          onClick={handleHintClick} 
          disabled={hintsRemaining <= 0}
          className={`flex items-center gap-2 transition-all ${confirmHint ? 'animate-pulse ring-2 ring-warning ring-offset-2 ring-offset-background' : ''}`}
        >
          {confirmHint ? <AlertCircle className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {confirmHint ? 'Confirm Hint (-Score)' : `Hint (${hintsRemaining})`}
          </span>
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={onPause}
          className="flex items-center gap-2 hover:bg-primary/20 transition-colors"
        >
          <Pause className="w-4 h-4" />
          <span className="hidden sm:inline">Pause</span>
        </Button>
        
        {!isDailyPuzzle && (
          <Button 
            variant={confirmHint ? "danger" : "secondary"}
            onClick={handleRestartClick}
            className={`flex items-center gap-2 transition-all ${confirmRestart ? 'animate-pulse ring-2 ring-error ring-offset-2 ring-offset-background' : 'hover:bg-error hover:text-white hover:border-error'}`}
          >
            {confirmRestart ? <AlertCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {confirmRestart ? 'Confirm Restart' : 'Restart'}
            </span>
          </Button>
        )}
      </div>
      {hintText && (
        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center animate-in slide-in-from-bottom-2 duration-300">
          <p className="text-primary font-bold tracking-wide">
            <Lightbulb className="w-5 h-5 inline mr-2 align-text-top" /> 
            HINT: {hintText}
          </p>
        </div>
      )}
    </div>
  );
};
