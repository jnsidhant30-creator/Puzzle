import { useState, useRef, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { getHint } from '../../services/hintService';
import type { PuzzleType, Difficulty } from '../../services/hintService';

interface HintControlProps {
  gameType: PuzzleType;
  difficulty: Difficulty;
  puzzleState?: any;
  hintsUsed: number;
  onUseHint: () => void;
  maxHints?: number;
}

export const HintControl = ({ 
  gameType, 
  difficulty, 
  puzzleState, 
  hintsUsed, 
  onUseHint,
  maxHints = 3
}: HintControlProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHintText, setCurrentHintText] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleUseHint = () => {
    if (hintsUsed >= maxHints) return;
    
    const response = getHint(gameType, puzzleState, difficulty, hintsUsed);
    setCurrentHintText(response.text);
    onUseHint();
  };

  const isMaxed = hintsUsed >= maxHints;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
          isOpen ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-textMuted hover:text-textMain hover:bg-white/5'
        }`}
        aria-label="Hints"
      >
        <Lightbulb className={`w-4 h-4 ${hintsUsed > 0 ? 'text-primary' : ''}`} />
        <span className="text-xs font-semibold">{hintsUsed}/{maxHints}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-textMain">Need a Hint?</h4>
          </div>
          
          {currentHintText ? (
            <div className="mb-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-textMain leading-relaxed">
                {currentHintText}
              </div>
              <div className="mt-2 text-[10px] text-textMuted flex items-center justify-between">
                <span>Score multiplier: -{hintsUsed * 10}%</span>
                <span>Level {hintsUsed} Hint</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-textMuted mb-4">
              Using a hint will deduct 10% from your final score. You can use up to {maxHints} hints per puzzle.
            </p>
          )}

          <button
            onClick={handleUseHint}
            disabled={isMaxed}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
              isMaxed 
                ? 'bg-border/50 text-textMuted cursor-not-allowed' 
                : 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30'
            }`}
          >
            {isMaxed ? 'Max Hints Used' : (currentHintText ? 'Get Another Hint' : 'Use Hint')}
          </button>
        </div>
      )}
    </div>
  );
};
