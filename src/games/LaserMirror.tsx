import React, { useState, useEffect, useRef } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Zap, Target, Lightbulb, Shield } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';
import { createRng } from '../utils/prng';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  seed?: number;
  isPaused?: boolean;
}

type MirrorType = 'slash' | 'backslash' | 'none';

interface Cell {
  r: number;
  c: number;
  mirror: MirrorType;
  isWall?: boolean;
  isEmitter?: boolean;
  isTarget?: boolean;
  isHit?: boolean;
}

interface MirrorSolutionStep {
  r: number;
  c: number;
  mirror: Exclude<MirrorType, 'none'>;
}

function generateLaserPuzzle(
  size: number,
  difficulty: Difficulty,
  rng: () => number
): { grid: Cell[][]; solution: MirrorSolutionStep[] } {
  const targetWalls = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 5;

  for (let attempt = 0; attempt < 25; attempt++) {
    const midCol = 1 + Math.floor(rng() * (size - 2));
    const midRow = 1 + Math.floor(rng() * (size - 2));

    const solution: MirrorSolutionStep[] = [];
    if (difficulty === 'easy' && attempt % 2 === 0) {
      solution.push({ r: 0, c: size - 1, mirror: 'backslash' });
    } else if (difficulty !== 'hard') {
      solution.push(
        { r: 0, c: midCol, mirror: 'backslash' },
        { r: midRow, c: midCol, mirror: 'slash' },
        { r: midRow, c: size - 1, mirror: 'backslash' }
      );
      if (midRow > 0 && midCol < size - 1) {
        // Flip valid bounce if going right at (0,0) -> down at (0,midCol) -> right again requires '\\' at (midRow, midCol)!
        solution[1] = { r: midRow, c: midCol, mirror: 'backslash' };
        solution.length = 0;
        // Beam from (0,0) going Right (0,1):
        // '\\' turns (0,1) -> (1,0) [Down]
        // '╱' turns (1,0) -> (0,-1) [Left] or '\\' turns (1,0) -> (0,1) [Right]
        solution.push(
          { r: 0, c: midCol, mirror: 'backslash' },
          { r: midRow, c: midCol, mirror: 'backslash' },
          { r: midRow, c: size - 1, mirror: 'backslash' }
        );
      }
    } else {
      const c1 = 1 + Math.floor(rng() * Math.max(1, size - 3));
      const r1 = 1 + Math.floor(rng() * Math.max(1, size - 3));
      const c2 = Math.min(size - 2, c1 + 1 + Math.floor(rng() * Math.max(1, size - 2 - c1)));
      const r2 = Math.min(size - 2, r1 + 1 + Math.floor(rng() * Math.max(1, size - 2 - r1)));
      // Down at (0,c1): '\' -> Down to (r1,c1): '\' -> Right to (r1,c2) [if slash? wait: (dr=0,dc=1): slash (-dc,-dr)=(-1,0) Up, backslash=(1,0) Down; Down (1,0): slash=(-0,-1)=(0,-1) Left, backslash=(0,1) Right!]
      // From (0,0) dr=0,dc=1 -> (0,c1) backslash -> dr=1,dc=0 (Down) -> (r1,c1) backslash -> dr=0,dc=1 (Right) -> (r1,c2) backslash -> dr=1,dc=0 (Down) -> (size-1,c2) backslash -> dr=0,dc=1 (Right) -> (size-1,size-1)!!
      if (r2 > r1 && c2 > c1) {
        solution.push(
          { r: 0, c: c1, mirror: 'backslash' },
          { r: r1, c: c1, mirror: 'backslash' },
          { r: r1, c: c2, mirror: 'backslash' },
          { r: size - 1, c: c2, mirror: 'backslash' }
        );
      } else {
        solution.push(
          { r: 0, c: c1, mirror: 'backslash' },
          { r: r1, c: c1, mirror: 'backslash' },
          { r: r1, c: size - 1, mirror: 'backslash' }
        );
      }
    }

    const testGrid: Cell[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => ({
        r,
        c,
        mirror: 'none' as MirrorType,
        isWall: false,
        isEmitter: r === 0 && c === 0,
        isTarget: r === size - 1 && c === size - 1,
        isHit: false,
      }))
    );

    solution.forEach((s) => {
      if (!testGrid[s.r][s.c].isEmitter && !testGrid[s.r][s.c].isTarget) {
        testGrid[s.r][s.c].mirror = s.mirror;
      }
    });

    // Trace beam to record protected cells
    const trace = traceBeamCells(testGrid, size);
    if (!trace.hit) continue;

    const protectedKeys = new Set<string>(trace.visited.map((p) => `${p.r},${p.c}`));
    protectedKeys.add('0,0');
    protectedKeys.add(`${size - 1},${size - 1}`);

    const candidates: { r: number; c: number }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!protectedKeys.has(`${r},${c}`)) candidates.push({ r, c });
      }
    }

    let placed = 0;
    while (placed < targetWalls && candidates.length > 0) {
      const idx = Math.floor(rng() * candidates.length);
      const [picked] = candidates.splice(idx, 1);
      testGrid[picked.r][picked.c].isWall = true;
      placed++;
    }

    // Clear solution mirrors before returning empty playable grid
    const playerGrid = testGrid.map((row) =>
      row.map((cell) => ({ ...cell, mirror: 'none' as MirrorType, isHit: false }))
    );
    return { grid: playerGrid, solution };
  }

  // Deterministic verified fallback
  const fallbackGrid: Cell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      r,
      c,
      mirror: 'none',
      isWall: (r === 1 && c === 1) || (difficulty !== 'easy' && r === 2 && c === 0),
      isEmitter: r === 0 && c === 0,
      isTarget: r === size - 1 && c === size - 1,
      isHit: false,
    }))
  );
  return { grid: fallbackGrid, solution: [{ r: 0, c: size - 1, mirror: 'backslash' }] };
}

function traceBeamCells(currentGrid: Cell[][], size: number): { hit: boolean; visited: { r: number; c: number }[] } {
  let cr = 0;
  let cc = 0;
  let dr = 0;
  let dc = 1;
  const visited: { r: number; c: number }[] = [];

  for (let step = 0; step < size * size * 2; step++) {
    visited.push({ r: cr, c: cc });
    if (cr === size - 1 && cc === size - 1) {
      return { hit: true, visited };
    }
    const cell = currentGrid[cr][cc];
    if (cell.isWall) return { hit: false, visited };
    if (cell.mirror === 'slash') {
      [dr, dc] = [-dc, -dr];
    } else if (cell.mirror === 'backslash') {
      [dr, dc] = [dc, dr];
    }
    cr += dr;
    cc += dc;
    if (cr < 0 || cr >= size || cc < 0 || cc >= size) break;
  }
  return { hit: false, visited };
}

export const LaserMirror: React.FC<Props> = ({
  difficulty,
  onComplete,
  useHint,
  hintsLeft,
  seed,
  isPaused = false,
}) => {
  const size = difficulty === 'hard' ? 6 : 5;
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [solutionSteps, setSolutionSteps] = useState<MirrorSolutionStep[]>([]);
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(null);
  const [focusCell, setFocusCell] = useState<{ r: number; c: number }>({ r: 0, c: 1 });
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);
  const roundCounterRef = useRef(0);

  useEffect(() => {
    initPuzzle(true);
  }, [difficulty, seed]);

  const initPuzzle = (usePropSeed = false) => {
    roundCounterRef.current += 1;
    const rng = createRng(
      usePropSeed && typeof seed === 'number' ? seed : Date.now() + roundCounterRef.current * 997
    );
    const { grid: newGrid, solution } = generateLaserPuzzle(size, difficulty, rng);
    setGrid(newGrid);
    setSolutionSteps(solution);
    setTimer(0);
    setHintCell(null);
    setFocusCell({ r: 0, c: 1 });
    setIsWon(false);
  };

  const handleTileClick = (r: number, c: number) => {
    const targetCell = grid[r]?.[c];
    if (!targetCell || isWon || isPaused || targetCell.isEmitter || targetCell.isTarget || targetCell.isWall) return;
    sound.playLaserBounce();
    setFocusCell({ r, c });
    const newGrid = grid.map((row) => row.map((item) => ({ ...item })));
    const current = newGrid[r][c].mirror;
    const nextMirror: MirrorType = current === 'none' ? 'slash' : current === 'slash' ? 'backslash' : 'none';
    newGrid[r][c].mirror = nextMirror;

    const { hit } = traceBeamCells(newGrid, size);
    newGrid[size - 1][size - 1].isHit = hit;
    setGrid(newGrid);

    if (hit) {
      setIsWon(true);
      sound.playSuccess();
      const score = Math.max(180, 1200 - timer * 5);
      setTimeout(() => onComplete(score, timer, true), 800);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        document.querySelector('[role="dialog"][aria-modal="true"]') ||
        isWon ||
        isPaused
      ) {
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusCell((p) => ({ r: Math.max(0, p.r - 1), c: p.c }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusCell((p) => ({ r: Math.min(size - 1, p.r + 1), c: p.c }));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusCell((p) => ({ r: p.r, c: Math.max(0, p.c - 1) }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusCell((p) => ({ r: p.r, c: Math.min(size - 1, p.c + 1) }));
      } else if (e.key === ' ' || (e.key === 'Enter' && target.tagName !== 'BUTTON')) {
        e.preventDefault();
        handleTileClick(focusCell.r, focusCell.c);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusCell, grid, size, isWon, isPaused]);

  const handleHint = () => {
    if (isWon || hintsLeft <= 0) return;
    const nextStep =
      solutionSteps.find((s) => grid[s.r]?.[s.c]?.mirror !== s.mirror) ||
      { r: 0, c: size - 1, mirror: 'backslash' as const };

    if (useHint()) {
      sound.playLaserBounce();
      const newGrid = grid.map((row) => row.map((item) => ({ ...item })));
      newGrid[nextStep.r][nextStep.c].mirror = nextStep.mirror;
      const { hit } = traceBeamCells(newGrid, size);
      newGrid[size - 1][size - 1].isHit = hit;
      setGrid(newGrid);
      setHintCell({ r: nextStep.r, c: nextStep.c });
      setTimeout(() => setHintCell(null), 3000);

      if (hit) {
        setIsWon(true);
        sound.playSuccess();
        const score = Math.max(180, 1200 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 800);
      }
    }
  };

  const gridColsClass = size === 6 ? 'grid-cols-6' : 'grid-cols-5';

  return (
    <div className="pv-game-grid flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Emitter', value: '(0, 0)', tone: 'accent' },
          { label: 'Crystal', value: `(${size - 1}, ${size - 1})`, tone: 'success' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      <div className="pv-game-board w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#B4C3CE] mb-4 text-center">
          Click tiles (or use Arrow keys + Space) to cycle mirrors (╱ or ╲) around shields into the crystal.
        </p>

        <div className={`grid ${gridColsClass} gap-2 w-full max-w-[350px] aspect-square`}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isHinted = hintCell?.r === r && hintCell?.c === c;
              const isFocused = focusCell.r === r && focusCell.c === c;

              let cellStyle = 'bg-pv-surface-secondary border-pv-border text-pv-text-muted hover:border-pv-border-strong';
              if (cell.isWall) {
                cellStyle = 'bg-[#1C2D3B] border-[#4A6A7B] text-[#6F8291] cursor-not-allowed';
              } else if (cell.isEmitter) {
                cellStyle = 'bg-pv-surface-soft border-[#38C6BA] text-[#38C6BA] font-bold';
              } else if (cell.isTarget) {
                cellStyle = cell.isHit
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500 font-bold'
                  : 'bg-pv-surface-soft border-pv-border text-pv-text-secondary';
              } else if (isHinted) {
                cellStyle = 'bg-[#38C6BA]/20 border-[#38C6BA] text-[#A8E5D5] font-bold';
              } else if (cell.mirror !== 'none') {
                cellStyle = 'bg-pv-surface-soft border-[#38C6BA]/60 text-[#38C6BA] font-bold text-2xl';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  disabled={cell.isEmitter || cell.isTarget || cell.isWall}
                  className={`aspect-square rounded-md text-xl flex items-center justify-center border transition-colors select-none ${cellStyle} ${
                    isFocused && !cell.isWall ? 'ring-2 ring-[#93D1F2]/70' : ''
                  }`}
                  aria-label={
                    cell.isWall
                      ? 'Blocker Wall'
                      : cell.isEmitter
                      ? 'Emitter'
                      : cell.isTarget
                      ? 'Target Crystal'
                      : 'Mirror tile'
                  }
                >
                  {cell.isWall ? (
                    <Shield className="w-4 h-4 text-[#6F8291]" />
                  ) : cell.isEmitter ? (
                    <Zap className="w-5 h-5 text-[#38C6BA]" />
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

      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Place Mirror ({hintsLeft})
        </button>
        <button
          onClick={() => initPuzzle(false)}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New Laser Grid
        </button>
      </div>
    </div>
  );
};
