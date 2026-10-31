import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

export const MazeEscape: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const size = difficulty === 'easy' ? 5 : 7;
  const [player, setPlayer] = useState({ r: 0, c: 0 });
  const [walls, setWalls] = useState<boolean[][]>([]);
  const [timer, setTimer] = useState(0);
  const [solutionSteps, setSolutionSteps] = useState<{ r: number; c: number }[]>([]);
  const [hintActive, setHintActive] = useState(false);

  useEffect(() => {
    initMaze();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        movePlayer(1, 0);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        movePlayer(0, 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, walls, size]);

  const initMaze = () => {
    // 1. Build a guaranteed solution path from (0,0) to (size-1, size-1)
    const path: { r: number; c: number }[] = [{ r: 0, c: 0 }];
    let cr = 0;
    let cc = 0;
    const pathSet = new Set<string>();
    pathSet.add(`0,0`);

    while (cr !== size - 1 || cc !== size - 1) {
      const candidates: { r: number; c: number }[] = [];
      if (cr < size - 1 && !pathSet.has(`${cr + 1},${cc}`)) candidates.push({ r: cr + 1, c: cc });
      if (cc < size - 1 && !pathSet.has(`${cr},${cc + 1}`)) candidates.push({ r: cr, c: cc + 1 });
      if (candidates.length === 0) {
        if (cr < size - 1) candidates.push({ r: cr + 1, c: cc });
        else candidates.push({ r: cr, c: cc + 1 });
      }
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      cr = chosen.r;
      cc = chosen.c;
      pathSet.add(`${cr},${cc}`);
      path.push(chosen);
    }

    // 2. Initialize walls matrix (place walls only in cells NOT on the guaranteed path)
    const wallDensity = difficulty === 'easy' ? 0.35 : 0.45;
    const gridWalls: boolean[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => {
        if (pathSet.has(`${r},${c}`)) return false;
        return Math.random() < wallDensity;
      })
    );

    setWalls(gridWalls);
    setSolutionSteps(path);
    setPlayer({ r: 0, c: 0 });
    setTimer(0);
    setHintActive(false);
  };

  const movePlayer = (dr: number, dc: number) => {
    const nextR = player.r + dr;
    const nextC = player.c + dc;

    // Check bounds
    if (nextR < 0 || nextR >= size || nextC < 0 || nextC >= size) {
      sound.playError();
      return;
    }

    // Check wall collision
    if (walls[nextR]?.[nextC]) {
      sound.playError();
      return;
    }

    sound.playMove();
    setPlayer({ r: nextR, c: nextC });

    // Check win condition
    if (nextR === size - 1 && nextC === size - 1) {
      sound.playSuccess();
      const score = Math.max(150, 1000 - timer * 6);
      setTimeout(() => onComplete(score, timer, true), 600);
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

  const gridColsClass = size === 5 ? 'grid-cols-5' : 'grid-cols-7';

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Maze</p>
          <p className="text-xl font-bold text-cyan-400">{size}x{size}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Target</p>
          <p className="text-xl font-bold text-emerald-400">🏁 Exit</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-cyan-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <div className={`grid ${gridColsClass} gap-2 w-full max-w-[320px] aspect-square`}>
          {Array.from({ length: size }).map((_, r) =>
            Array.from({ length: size }).map((_, c) => {
              const isPlayer = player.r === r && player.c === c;
              const isExit = r === size - 1 && c === size - 1;
              const isWall = walls[r]?.[c];
              const isHintPath = hintActive && solutionSteps.some(s => s.r === r && s.c === c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`aspect-square rounded-xl text-xl sm:text-2xl font-black flex items-center justify-center border-2 transition-all shadow-inner ${
                    isPlayer
                      ? 'bg-cyan-500 text-pv-bg-primary border-cyan-300 scale-105 shadow-cyan-500/50 z-10'
                      : isExit
                      ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                      : isWall
                      ? 'bg-pv-bg-primary border-slate-700/80 shadow-md'
                      : isHintPath
                      ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-pv-dragon-fruit-light animate-pulse ring-2 ring-pv-dragon-fruit'
                      : 'bg-pv-surface-primary border-pv-border-strong/50 text-pv-text-disabled'
                  }`}
                >
                  {isPlayer ? '🏃' : isExit ? '🏁' : isWall ? '🧱' : ''}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* On-screen D-Pad Controls & Keyboard info */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <button
          onClick={() => movePlayer(-1, 0)}
          className="bg-pv-surface-primary hover:bg-cyan-600 text-white p-3.5 rounded-xl border border-pv-border-strong shadow-md active:scale-95 transition"
          aria-label="Move Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => movePlayer(0, -1)}
            className="bg-pv-surface-primary hover:bg-cyan-600 text-white p-3.5 rounded-xl border border-pv-border-strong shadow-md active:scale-95 transition"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => movePlayer(1, 0)}
            className="bg-pv-surface-primary hover:bg-cyan-600 text-white p-3.5 rounded-xl border border-pv-border-strong shadow-md active:scale-95 transition"
            aria-label="Move Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => movePlayer(0, 1)}
            className="bg-pv-surface-primary hover:bg-cyan-600 text-white p-3.5 rounded-xl border border-pv-border-strong shadow-md active:scale-95 transition"
            aria-label="Move Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-pv-text-muted mt-1">Use Arrow Keys or WASD to navigate</p>
      </div>

      {/* Hint & Reset */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || hintActive}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initMaze}
          className="p-2.5 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong rounded-xl transition"
          title="Restart Maze"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
