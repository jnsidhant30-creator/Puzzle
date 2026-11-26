import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

export const MazeEscape: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const size = difficulty === 'easy' ? 5 : 7;
  const [player, setPlayer] = useState({ r: 0, c: 0 });
  const [walls, setWalls] = useState<boolean[][]>([]);
  const [solutionSteps, setSolutionSteps] = useState<{ r: number; c: number }[]>([]);
  const [hintActive, setHintActive] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initMaze();
  }, [difficulty]);

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
  }, [player, walls, size, isWon, isPaused]);

  const initMaze = () => {
    const path: { r: number; c: number }[] = [{ r: 0, c: 0 }];
    let cr = 0;
    let cc = 0;
    const pathSet = new Set<string>();
    pathSet.add('0,0');

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
    setIsWon(false);
  };

  const movePlayer = (dr: number, dc: number) => {
    if (isWon || isPaused) return;
    const nextR = player.r + dr;
    const nextC = player.c + dc;

    if (nextR < 0 || nextR >= size || nextC < 0 || nextC >= size) {
      sound.playError();
      return;
    }

    if (walls[nextR]?.[nextC]) {
      sound.playError();
      return;
    }

    sound.playMove();
    setPlayer({ r: nextR, c: nextC });

    if (nextR === size - 1 && nextC === size - 1) {
      setIsWon(true);
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
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Maze Size', value: `${size} × ${size}` },
          { label: 'Exit Target', value: `(${size - 1}, ${size - 1})`, tone: 'success' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Grid */}
      <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <div className={`grid ${gridColsClass} gap-1.5 w-full max-w-[340px] aspect-square`}>
          {Array.from({ length: size }).map((_, r) =>
            Array.from({ length: size }).map((_, c) => {
              const isPlayer = player.r === r && player.c === c;
              const isExit = r === size - 1 && c === size - 1;
              const isWall = walls[r]?.[c];
              const isHintPath = hintActive && solutionSteps.some(s => s.r === r && s.c === c);

              let cellStyle = 'bg-pv-surface-secondary border-pv-border';
              if (isPlayer) {
                cellStyle = 'bg-pv-dragon-fruit/20 border-pv-dragon-fruit';
              } else if (isExit) {
                cellStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300';
              } else if (isWall) {
                cellStyle = 'bg-pv-bg-primary border-pv-border-strong';
              } else if (isHintPath) {
                cellStyle = 'bg-pv-dragon-fruit/20 border-pv-dragon-fruit text-pv-dragon-fruit-light';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={`aspect-square rounded-md flex items-center justify-center border transition-colors select-none ${cellStyle}`}
                >
                  {isPlayer ? (
                    <span className="w-3 h-3 rounded-full bg-pv-dragon-fruit" />
                  ) : isExit ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Exit</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* D-Pad Controls */}
      <div className="flex flex-col items-center gap-1.5 mb-5">
        <button
          onClick={() => movePlayer(-1, 0)}
          className="w-12 h-10 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-primary border border-pv-border rounded-lg flex items-center justify-center transition-colors active:translate-y-px"
          aria-label="Move Up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => movePlayer(0, -1)}
            className="w-12 h-10 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-primary border border-pv-border rounded-lg flex items-center justify-center transition-colors active:translate-y-px"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => movePlayer(1, 0)}
            className="w-12 h-10 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-primary border border-pv-border rounded-lg flex items-center justify-center transition-colors active:translate-y-px"
            aria-label="Move Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => movePlayer(0, 1)}
            className="w-12 h-10 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-primary border border-pv-border rounded-lg flex items-center justify-center transition-colors active:translate-y-px"
            aria-label="Move Right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-pv-text-muted mt-1">Use arrow keys or WASD to navigate</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || hintActive}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initMaze}
          className="h-9 px-3 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          title="Restart Maze"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </div>
  );
};
