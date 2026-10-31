import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Zap, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
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

export const LaserMirror: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const size = 5;
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [timer, setTimer] = useState(0);
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(null);

  useEffect(() => {
    initPuzzle();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
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
  };

  const simulateBeam = (currentGrid: Cell[][]): boolean => {
    let cr = 0;
    let cc = 0;
    let dr = 0;
    let dc = 1; // start moving RIGHT from (0,0)
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
    if ((r === 0 && c === 0) || (r === size - 1 && c === size - 1)) return;
    sound.playLaserBounce();
    const newGrid = grid.map(row => [...row]);
    const current = newGrid[r][c].mirror;
    const nextMirror: MirrorType = current === 'none' ? 'slash' : current === 'slash' ? 'backslash' : 'none';
    newGrid[r][c].mirror = nextMirror;

    const hitTarget = simulateBeam(newGrid);
    newGrid[size - 1][size - 1].isHit = hitTarget;
    setGrid(newGrid);

    if (hitTarget) {
      sound.playSuccess();
      const score = Math.max(180, 1200 - timer * 5);
      setTimeout(() => onComplete(score, timer, true), 800);
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0) return;
    // An elegant solution: placing a 'backslash' mirror at (0, size - 1) directs beam directly down to (size-1, size-1)
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
        sound.playSuccess();
        const score = Math.max(180, 1200 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm gap-2">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Emitter</p>
          <p className="text-xl font-bold text-pv-dragon-fruit-light">⚡ (0,0)</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Crystal</p>
          <p className="text-xl font-bold text-red-400 flex items-center gap-1 justify-center">
            <Zap className="w-4 h-4" /> Target
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-pv-border-strong rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <p className="text-xs font-semibold text-pv-text-secondary mb-6 text-center">
          Click tiles to rotate mirrors (╱ or ╲) and reflect the laser into the crystal!
        </p>
        <div className="grid grid-cols-5 gap-2 w-full max-w-[320px] aspect-square">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const symbol = cell.isEmitter ? '⚡' : cell.isTarget ? '💎' : cell.mirror === 'slash' ? '╱' : cell.mirror === 'backslash' ? '╲' : '';
              const isHinted = hintCell?.r === r && hintCell?.c === c;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  disabled={cell.isEmitter || cell.isTarget}
                  className={`aspect-square rounded-xl text-2xl font-black flex items-center justify-center border-2 transition-all shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pv-dragon-fruit ${
                    cell.isEmitter
                      ? 'bg-gradient-primary-btn text-pv-bg-primary border-amber-300 shadow-pv-dragon-fruit/50'
                      : cell.isTarget
                      ? cell.isHit
                        ? 'bg-emerald-600 text-white border-emerald-400 scale-105 shadow-emerald-500/50'
                        : 'bg-red-600/80 text-white border-red-400 animate-pulse'
                      : isHinted
                      ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-white ring-4 ring-pv-dragon-fruit animate-pulse'
                      : cell.mirror !== 'none'
                      ? 'bg-indigo-950/80 border-indigo-400 text-pv-dragon-fruit-light'
                      : 'bg-pv-surface-primary border-pv-border-strong text-pv-text-disabled hover:bg-pv-surface-soft'
                  }`}
                  aria-label={cell.isEmitter ? 'Emitter' : cell.isTarget ? 'Target' : 'Mirror tile'}
                >
                  {symbol}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full mt-4">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Place Mirror ({hintsLeft})
        </button>
        <button
          onClick={initPuzzle}
          className="flex-1 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Reset Grid
        </button>
      </div>
    </div>
  );
};
