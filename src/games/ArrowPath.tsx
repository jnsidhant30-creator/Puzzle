import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Navigation, Lightbulb, CheckCircle2 } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface ArrowCell {
  dir: Direction;
  arrowChar: string;
}

const DIRS: { dir: Direction; arrow: string; dr: number; dc: number }[] = [
  { dir: 'UP', arrow: '↑', dr: -1, dc: 0 },
  { dir: 'DOWN', arrow: '↓', dr: 1, dc: 0 },
  { dir: 'LEFT', arrow: '←', dr: 0, dc: -1 },
  { dir: 'RIGHT', arrow: '→', dr: 0, dc: 1 }
];

export const ArrowPath: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const size = difficulty === 'easy' ? 4 : 5;
  const gridColsClass = size === 4 ? 'grid-cols-4' : 'grid-cols-5';

  const [grid, setGrid] = useState<ArrowCell[][]>([]);
  const [currentPos, setCurrentPathPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [visited, setVisited] = useState<{ r: number; c: number }[]>([{ r: 0, c: 0 }]);
  const [solutionPath, setSolutionPath] = useState<{ r: number; c: number }[]>([]);
  const [hintActive, setHintActive] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initGrid();
  }, [difficulty]);

  const initGrid = () => {
    const path: { r: number; c: number; dir: Direction }[] = [];
    let cr = 0;
    let cc = 0;
    const visitedSet = new Set<string>();
    visitedSet.add('0,0');

    while (cr !== size - 1 || cc !== size - 1) {
      const possible: { dir: Direction; dr: number; dc: number }[] = [];
      if (cr < size - 1 && !visitedSet.has(`${cr + 1},${cc}`)) {
        possible.push({ dir: 'DOWN', dr: 1, dc: 0 });
      }
      if (cc < size - 1 && !visitedSet.has(`${cr},${cc + 1}`)) {
        possible.push({ dir: 'RIGHT', dr: 0, dc: 1 });
      }
      if (possible.length === 0) {
        if (cr > 0 && !visitedSet.has(`${cr - 1},${cc}`)) possible.push({ dir: 'UP', dr: -1, dc: 0 });
        if (cc > 0 && !visitedSet.has(`${cr},${cc - 1}`)) possible.push({ dir: 'LEFT', dr: 0, dc: -1 });
      }

      if (possible.length === 0) {
        if (cr < size - 1) possible.push({ dir: 'DOWN', dr: 1, dc: 0 });
        else possible.push({ dir: 'RIGHT', dr: 0, dc: 1 });
      }

      const chosen = possible[Math.floor(Math.random() * possible.length)];
      path.push({ r: cr, c: cc, dir: chosen.dir });
      cr += chosen.dr;
      cc += chosen.dc;
      visitedSet.add(`${cr},${cc}`);
    }

    const matrix: ArrowCell[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => {
        const dObj = DIRS[Math.floor(Math.random() * DIRS.length)];
        return { dir: dObj.dir, arrowChar: dObj.arrow };
      })
    );

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
    setIsWon(false);
  };

  const handleStep = () => {
    if (isWon) return;
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

      if (nextR === size - 1 && nextC === size - 1) {
        setIsWon(true);
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
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Position', value: `(${currentPos.r}, ${currentPos.c})`, tone: 'accent' },
          { label: 'Target', value: `(${size - 1}, ${size - 1})`, tone: 'success' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Board */}
      <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#C5BFD0] mb-4 text-center">
          Follow arrow directions from top-left (0, 0) to reach the exit at bottom-right.
        </p>
        <div className={`grid ${gridColsClass} gap-2 w-full max-w-[340px] aspect-square`}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isCurrent = currentPos.r === r && currentPos.c === c;
              const isTarget = r === size - 1 && c === size - 1;
              const isVisited = visited.some(v => v.r === r && v.c === c);
              const isOnSolution = hintActive && solutionPath.some(s => s.r === r && s.c === c);

              let cellStyle = 'bg-pv-surface-secondary border-pv-border text-pv-text-secondary';
              if (isCurrent) {
                cellStyle = 'bg-pv-dragon-fruit text-[#110F15] border-pv-dragon-fruit font-bold shadow-sm';
              } else if (isTarget) {
                cellStyle = 'bg-emerald-950/40 text-emerald-300 border-emerald-600/60 font-semibold';
              } else if (isOnSolution) {
                cellStyle = 'bg-pv-dragon-fruit/20 border-pv-dragon-fruit text-pv-dragon-fruit-light font-bold';
              } else if (isVisited) {
                cellStyle = 'bg-pv-surface-soft border-pv-border-strong text-pv-text-muted';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={`aspect-square rounded-md text-xl flex items-center justify-center border transition-colors select-none ${cellStyle}`}
                >
                  {isCurrent ? (
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-lg">{cell.arrowChar}</span>
                      <span className="text-[9px] uppercase tracking-tighter mt-0.5">You</span>
                    </div>
                  ) : isTarget ? (
                    <span className="text-xs font-semibold uppercase tracking-wider">End</span>
                  ) : (
                    <span>{cell.arrowChar}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-2.5">
        <button
          onClick={handleStep}
          disabled={isWon}
          className="w-full h-11 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors active:translate-y-px disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" /> Follow Arrow Step
        </button>

        <div className="flex items-center gap-2.5 w-full">
          <button
            onClick={handleHint}
            disabled={hintsLeft <= 0 || hintActive}
            className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
          </button>
          <button
            onClick={initGrid}
            className="h-9 px-3 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            title="Reset Grid"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};
