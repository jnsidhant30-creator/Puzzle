import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

export const NumberPath: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const maxNumber = size * size;
  const [targetPath, setTargetPath] = useState<number[]>([]);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const [errorVal, setErrorVal] = useState<number | null>(null);
  const [hintVal, setHintVal] = useState<number | null>(null);

  useEffect(() => {
    initGame();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  const initGame = () => {
    const arr = Array.from({ length: maxNumber }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setTargetPath(arr);
    setCurrentPath([]);
    setErrorVal(null);
    setHintVal(null);
    setTimer(0);
  };

  const handleCellClick = (val: number) => {
    sound.playClick();
    const expectedNext = currentPath.length + 1;
    if (val === expectedNext) {
      sound.playSuccess();
      const newPath = [...currentPath, val];
      setCurrentPath(newPath);
      setHintVal(null);

      if (newPath.length === maxNumber) {
        const score = Math.max(120, 1000 - timer * 6);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    } else if (!currentPath.includes(val)) {
      // Misclick: penalize timer by 2 seconds and flash error, but DO NOT wipe progress!
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
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Next Number</p>
          <p className="text-xl font-bold text-pv-dragon-fruit-light">{currentPath.length + 1} / {maxNumber}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Progress</p>
          <p className="text-xl font-bold text-emerald-400">{Math.round((currentPath.length / maxNumber) * 100)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-pv-border-strong rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <p className="text-xs font-semibold text-pv-dragon-fruit-light uppercase tracking-widest mb-6">
          Click Numbers in Sequence: 1 ➔ {maxNumber}
        </p>
        <div className={`grid ${gridColsClass} gap-3 w-full max-w-[320px] aspect-square`}>
          {targetPath.map((val, idx) => {
            const isSelected = currentPath.includes(val);
            const isNext = val === currentPath.length + 1;
            const isError = errorVal === val;
            const isHint = hintVal === val;

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(val)}
                disabled={isSelected}
                className={`aspect-square rounded-2xl text-2xl sm:text-3xl font-black flex items-center justify-center border-2 transition-all shadow-md active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500/50 scale-95 opacity-80'
                    : isError
                    ? 'bg-rose-600/40 border-rose-500 text-rose-300 animate-shake'
                    : isHint
                    ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-white animate-pulse ring-4 ring-pv-dragon-fruit scale-105'
                    : isNext
                    ? 'bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-dragon-fruit-light border-pv-dragon-fruit/40'
                    : 'bg-pv-surface-primary hover:bg-pv-surface-soft text-white border-pv-border-strong'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint & Reset */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || hintVal !== null}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initGame}
          className="p-2.5 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong rounded-xl transition"
          title="Restart Sequence"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
