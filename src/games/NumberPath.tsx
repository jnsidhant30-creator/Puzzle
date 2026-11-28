import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

export const NumberPath: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const maxNumber = size * size;
  const [targetPath, setTargetPath] = useState<number[]>([]);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [errorVal, setErrorVal] = useState<number | null>(null);
  const [hintVal, setHintVal] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const initGame = () => {
    const arr = Array.from({ length: maxNumber }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setTargetPath(arr);
    setCurrentPath([]);
    setErrorVal(null);
    setHintVal(null);
    setTimer(0);
    setIsWon(false);
  };

  const handleCellClick = (val: number) => {
    if (isWon) return;
    sound.playClick();
    const expectedNext = currentPath.length + 1;
    if (val === expectedNext) {
      sound.playSuccess();
      const newPath = [...currentPath, val];
      setCurrentPath(newPath);
      setHintVal(null);

      if (newPath.length === maxNumber) {
        setIsWon(true);
        const score = Math.max(120, 1000 - timer * 6);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    } else if (!currentPath.includes(val)) {
      sound.playError();
      setErrorVal(val);
      setTimer(t => t + 2);
      setTimeout(() => setErrorVal(null), 800);
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || hintVal !== null) return;
    const nextExpected = currentPath.length + 1;
    if (nextExpected > maxNumber) return;

    if (useHint()) {
      sound.playClick();
      setHintVal(nextExpected);
      setTimeout(() => setHintVal(null), 3000);
    }
  };

  const gridColsClass = size === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="pv-game-grid flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Next Number', value: `${currentPath.length + 1} / ${maxNumber}`, tone: 'accent' },
          { label: 'Progress', value: `${Math.round((currentPath.length / maxNumber) * 100)}%`, tone: 'success' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Grid */}
      <div className="pv-game-board w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#B4C3CE] mb-4 text-center">
          Click numbers in numerical order from 1 to {maxNumber}.
        </p>

        <div className={`grid ${gridColsClass} gap-2.5 w-full max-w-[340px] aspect-square`}>
          {targetPath.map((val, idx) => {
            const isSelected = currentPath.includes(val);
            const isError = errorVal === val;
            const isHint = hintVal === val;

            let tileStyle = 'bg-pv-surface-secondary border-pv-border hover:border-pv-border-strong text-pv-text-primary';
            if (isSelected) {
              tileStyle = 'bg-pv-surface-soft border-pv-border-strong text-pv-text-muted opacity-40';
            } else if (isError) {
              tileStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
            } else if (isHint) {
              tileStyle = 'bg-[#38C6BA]/20 border-[#38C6BA] text-[#A8E5D5] font-bold';
            }

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(val)}
                disabled={isSelected}
                className={`aspect-square rounded-lg text-xl sm:text-2xl font-semibold font-tabular flex items-center justify-center border transition-colors select-none active:translate-y-px ${tileStyle}`}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || hintVal !== null}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Next Clue ({hintsLeft})
        </button>
        <button
          onClick={initGame}
          className="h-9 px-3 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          title="Reset Numbers"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </div>
  );
};
