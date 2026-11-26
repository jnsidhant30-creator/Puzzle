import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Zap, Target, Lightbulb } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

type MirrorType = 'slash' | 'backslash' | 'none';

interface Cell {
  r: number;
  c: number;
  mirror: MirrorType;
  isEmitter?: boolean;
  isTarget?: boolean;
  isHit?: boolean;
}

export const LaserMirror: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const size = 5;
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initPuzzle();
  }, [difficulty]);

  const initPuzzle = () => {
    const matrix: Cell[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => ({
        r,
        c,
        mirror: 'none',
        isEmitter: r === 0 && c === 0,
        isTarget: r === size - 1 && c === size - 1,
        isHit: false
      }))
    );
    setGrid(matrix);
    setTimer(0);
    setHintCell(null);
    setIsWon(false);
  };

  const simulateBeam = (currentGrid: Cell[][]): boolean => {
    let cr = 0;
    let cc = 0;
    let dr = 0;
    let dc = 1;
    let hitTarget = false;

    for (let step = 0; step < 30; step++) {
      if (cr === size - 1 && cc === size - 1) {
        hitTarget = true;
        break;
      }
      const cell = currentGrid[cr][cc];
      if (cell.mirror === 'slash') {
        [dr, dc] = [-dc, -dr];
      } else if (cell.mirror === 'backslash') {
        [dr, dc] = [dc, dr];
      }
      cr += dr;
      cc += dc;
      if (cr < 0 || cr >= size || cc < 0 || cc >= size) break;
    }
    return hitTarget;
  };

  const handleTileClick = (r: number, c: number) => {
    if (isWon || (r === 0 && c === 0) || (r === size - 1 && c === size - 1)) return;
    sound.playLaserBounce();
    const newGrid = grid.map(row => [...row]);
    const current = newGrid[r][c].mirror;
    const nextMirror: MirrorType = current === 'none' ? 'slash' : current === 'slash' ? 'backslash' : 'none';
    newGrid[r][c].mirror = nextMirror;

    const hitTarget = simulateBeam(newGrid);
    newGrid[size - 1][size - 1].isHit = hitTarget;
    setGrid(newGrid);

    if (hitTarget) {
      setIsWon(true);
      sound.playSuccess();
      const score = Math.max(180, 1200 - timer * 5);
      setTimeout(() => onComplete(score, timer, true), 800);
    }
  };

  const handleHint = () => {
    if (isWon || hintsLeft <= 0) return;
    if (useHint()) {
      sound.playLaserBounce();
      const targetR = 0;
      const targetC = size - 1;
      const newGrid = grid.map(row => [...row]);
      newGrid[targetR][targetC].mirror = 'backslash';
      const hitTarget = simulateBeam(newGrid);
      newGrid[size - 1][size - 1].isHit = hitTarget;
      setGrid(newGrid);
      setHintCell({ r: targetR, c: targetC });
      setTimeout(() => setHintCell(null), 3000);

      if (hitTarget) {
        setIsWon(true);
        sound.playSuccess();
        const score = Math.max(180, 1200 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Emitter', value: '(0, 0)', tone: 'accent' },
          { label: 'Crystal', value: `(${size - 1}, ${size - 1})`, tone: 'success' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Grid */}
      <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#C5BFD0] mb-4 text-center">
          Click tiles to cycle mirrors (╱ or ╲) and direct the laser into the destination crystal.
        </p>

        <div className="grid grid-cols-5 gap-2 w-full max-w-[340px] aspect-square">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isHinted = hintCell?.r === r && hintCell?.c === c;

              let cellStyle = 'bg-pv-surface-secondary border-pv-border text-pv-text-muted hover:border-pv-border-strong';
              if (cell.isEmitter) {
                cellStyle = 'bg-pv-surface-soft border-pv-dragon-fruit text-pv-dragon-fruit font-bold';
              } else if (cell.isTarget) {
                cellStyle = cell.isHit
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500 font-bold'
                  : 'bg-pv-surface-soft border-pv-border text-pv-text-secondary';
              } else if (isHinted) {
                cellStyle = 'bg-pv-dragon-fruit/20 border-pv-dragon-fruit text-pv-dragon-fruit-light font-bold';
              } else if (cell.mirror !== 'none') {
                cellStyle = 'bg-pv-surface-soft border-pv-dragon-fruit/60 text-pv-dragon-fruit font-bold text-2xl';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  disabled={cell.isEmitter || cell.isTarget}
                  className={`aspect-square rounded-md text-xl flex items-center justify-center border transition-colors select-none ${cellStyle}`}
                  aria-label={cell.isEmitter ? 'Emitter' : cell.isTarget ? 'Target Crystal' : 'Mirror tile'}
                >
                  {cell.isEmitter ? (
                    <Zap className="w-5 h-5 text-pv-dragon-fruit" />
                  ) : cell.isTarget ? (
                    <Target className={`w-5 h-5 ${cell.isHit ? 'text-emerald-400' : 'text-pv-text-secondary'}`} />
                  ) : cell.mirror === 'slash' ? (
                    '╱'
                  ) : cell.mirror === 'backslash' ? (
                    '╲'
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Place Mirror ({hintsLeft})
        </button>
        <button
          onClick={initPuzzle}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Grid
        </button>
      </div>
    </div>
  );
};
