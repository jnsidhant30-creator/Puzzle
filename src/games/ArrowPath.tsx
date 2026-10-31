import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Navigation, Sparkles } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface ArrowCell {
  dir: Direction;
  arrowChar: string;
}

const DIRS: { dir: Direction; arrow: string; dr: number; dc: number }[] = [
  { dir: 'UP', arrow: '▲', dr: -1, dc: 0 },
  { dir: 'DOWN', arrow: '▼', dr: 1, dc: 0 },
  { dir: 'LEFT', arrow: '◄', dr: 0, dc: -1 },
  { dir: 'RIGHT', arrow: '►', dr: 0, dc: 1 }
];

export const ArrowPath: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const size = difficulty === 'easy' ? 4 : 5;
  const gridColsClass = size === 4 ? 'grid-cols-4' : 'grid-cols-5';

  const [grid, setGrid] = useState<ArrowCell[][]>([]);
  const [currentPos, setCurrentPathPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [visited, setVisited] = useState<{ r: number; c: number }[]>([{ r: 0, c: 0 }]);
  const [timer, setTimer] = useState(0);
  const [solutionPath, setSolutionPath] = useState<{ r: number; c: number }[]>([]);
  const [hintActive, setHintActive] = useState(false);

  useEffect(() => {
    initGrid();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  const initGrid = () => {
    // 1. Generate a guaranteed solvable path from (0,0) to (size-1, size-1)
    const path: { r: number; c: number; dir: Direction }[] = [];
    let cr = 0;
    let cc = 0;
    const visitedSet = new Set<string>();
    visitedSet.add(`0,0`);

    while (cr !== size - 1 || cc !== size - 1) {
      // Possible moves towards target
      const possible: { dir: Direction; dr: number; dc: number }[] = [];
      if (cr < size - 1 && !visitedSet.has(`${cr + 1},${cc}`)) {
        possible.push({ dir: 'DOWN', dr: 1, dc: 0 });
      }
      if (cc < size - 1 && !visitedSet.has(`${cr},${cc + 1}`)) {
        possible.push({ dir: 'RIGHT', dr: 0, dc: 1 });
      }
      // If stuck, allow any unvisited valid neighbor
      if (possible.length === 0) {
        if (cr > 0 && !visitedSet.has(`${cr - 1},${cc}`)) possible.push({ dir: 'UP', dr: -1, dc: 0 });
        if (cc > 0 && !visitedSet.has(`${cr},${cc - 1}`)) possible.push({ dir: 'LEFT', dr: 0, dc: -1 });
      }

      if (possible.length === 0) {
        // Fallback: force direct step to target
        if (cr < size - 1) possible.push({ dir: 'DOWN', dr: 1, dc: 0 });
        else possible.push({ dir: 'RIGHT', dr: 0, dc: 1 });
      }

      const chosen = possible[Math.floor(Math.random() * possible.length)];
      path.push({ r: cr, c: cc, dir: chosen.dir });
      cr += chosen.dr;
      cc += chosen.dc;
      visitedSet.add(`${cr},${cc}`);
    }

    // Initialize matrix
    const matrix: ArrowCell[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => {
        const dObj = DIRS[Math.floor(Math.random() * DIRS.length)];
        return { dir: dObj.dir, arrowChar: dObj.arrow };
      })
    );

    // Apply the winning path arrows
    path.forEach(p => {
      const dObj = DIRS.find(d => d.dir === p.dir)!;
      matrix[p.r][p.c] = { dir: p.dir, arrowChar: dObj.arrow };
    });

    const fullSolution = [...path.map(p => ({ r: p.r, c: p.c })), { r: size - 1, c: size - 1 }];

    setGrid(matrix);
    setSolutionPath(fullSolution);
    setCurrentPathPos({ r: 0, c: 0 });
    setVisited([{ r: 0, c: 0 }]);
    setHintActive(false);
    setTimer(0);
  };

  const handleStep = () => {
    const currentCell = grid[currentPos.r]?.[currentPos.c];
    if (!currentCell) return;

    const dObj = DIRS.find(d => d.dir === currentCell.dir);
    if (!dObj) return;

    const nextR = currentPos.r + dObj.dr;
    const nextC = currentPos.c + dObj.dc;

    if (nextR >= 0 && nextR < size && nextC >= 0 && nextC < size) {
      sound.playMove();
      setCurrentPathPos({ r: nextR, c: nextC });
      setVisited(prev => [...prev, { r: nextR, c: nextC }]);

      // Check win at bottom-right
      if (nextR === size - 1 && nextC === size - 1) {
        sound.playSuccess();
        const score = Math.max(120, 1000 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 800);
      }
    } else {
      sound.playError();
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || hintActive) return;
    if (useHint()) {
      sound.playClick();
      setHintActive(true);
      setTimeout(() => setHintActive(false), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Pos</p>
          <p className="text-xl font-bold text-blue-400">({currentPos.r}, {currentPos.c})</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Target</p>
          <p className="text-xl font-bold text-emerald-400">({size - 1}, {size - 1})</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-blue-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-6">
          Follow The Arrows To Reach Bottom Right (Exit)
        </p>
        <div className={`grid ${gridColsClass} gap-2 w-full max-w-[320px] aspect-square`}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isCurrent = currentPos.r === r && currentPos.c === c;
              const isTarget = r === size - 1 && c === size - 1;
              const isVisited = visited.some(v => v.r === r && v.c === c);
              const isOnSolution = hintActive && solutionPath.some(s => s.r === r && s.c === c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`aspect-square rounded-xl text-2xl font-black flex items-center justify-center border-2 transition-all shadow-inner ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-400 scale-105 shadow-blue-500/50'
                      : isTarget
                      ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                      : isOnSolution
                      ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-pv-dragon-fruit-light animate-pulse ring-2 ring-pv-dragon-fruit'
                      : isVisited
                      ? 'bg-indigo-950/60 border-indigo-700 text-pv-dragon-fruit-light'
                      : 'bg-pv-surface-primary border-pv-border-strong text-pv-text-secondary'
                  }`}
                >
                  {isCurrent ? '🚶' : isTarget ? '🏁' : cell.arrowChar}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-3 w-full mb-3">
        <button
          onClick={handleStep}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl border border-blue-400 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30 transition active:scale-95"
        >
          <Navigation className="w-5 h-5" /> Step Next Arrow
        </button>
      </div>

      {/* Hint & Reset Actions */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || hintActive}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initGrid}
          className="p-2.5 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong rounded-xl transition"
          title="Restart Maze"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
