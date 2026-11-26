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

interface PipeTile {
  type: 'straight' | 'elbow' | 'cross';
  rotation: number;
  targetRotation: number;
}

export const PipeConnect: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const [grid, setGrid] = useState<PipeTile[]>([]);
  const [moves, setMoves] = useState(0);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  const isTileAligned = (tile: PipeTile) => {
    if (tile.type === 'cross') return true;
    if (tile.type === 'straight') return tile.rotation % 180 === tile.targetRotation % 180;
    return tile.rotation === tile.targetRotation;
  };

  useEffect(() => {
    initGrid();
  }, [difficulty]);

  const initGrid = () => {
    const total = size * size;
    const tiles: PipeTile[] = [];
    for (let i = 0; i < total; i++) {
      const type: 'straight' | 'elbow' | 'cross' =
        Math.random() > 0.6 ? 'cross' : Math.random() > 0.3 ? 'elbow' : 'straight';
      const targetRotation = Math.floor(Math.random() * 4) * 90;
      let rotation = Math.floor(Math.random() * 4) * 90;
      if (type === 'straight' && rotation % 180 === targetRotation % 180) {
        rotation = (rotation + 90) % 360;
      } else if (type === 'elbow' && rotation === targetRotation) {
        rotation = (rotation + 90) % 360;
      }
      tiles.push({ type, rotation, targetRotation });
    }
    setGrid(tiles);
    setMoves(0);
    setTimer(0);
    setHintIndex(null);
    setIsWon(false);
  };

  const handleTileClick = (index: number) => {
    if (isWon) return;
    sound.playRotate();
    const newGrid = grid.map((t, i) =>
      i === index ? { ...t, rotation: (t.rotation + 90) % 360 } : t
    );
    setGrid(newGrid);
    setMoves(m => m + 1);

    const isSolved = newGrid.every(isTileAligned);
    if (isSolved) {
      setIsWon(true);
      sound.playSuccess();
      const score = Math.max(150, 1200 - moves * 10 - timer * 5);
      setTimeout(() => onComplete(score, timer, true), 600);
    }
  };

  const handleHint = () => {
    if (isWon || hintsLeft <= 0) return;
    const misalignedIdx = grid.findIndex(tile => !isTileAligned(tile));
    if (misalignedIdx === -1) return;

    if (useHint()) {
      sound.playRotate();
      const newGrid = grid.map((t, i) =>
        i === misalignedIdx ? { ...t, rotation: t.targetRotation } : t
      );
      setGrid(newGrid);
      setHintIndex(misalignedIdx);
      setTimeout(() => setHintIndex(null), 2500);

      const isSolved = newGrid.every(isTileAligned);
      if (isSolved) {
        setIsWon(true);
        sound.playSuccess();
        const score = Math.max(150, 1200 - moves * 10 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    }
  };

  const renderPipeSvg = (tile: PipeTile, isAligned: boolean) => {
    const strokeClass = isAligned ? 'stroke-[#38C6BA]' : 'stroke-pv-text-muted';
    const strokeWidth = 5;

    return (
      <svg viewBox="0 0 40 40" className="w-full h-full pointer-events-none">
        {tile.type === 'straight' && (
          <line
            x1="20"
            y1="0"
            x2="20"
            y2="40"
            className={strokeClass}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {tile.type === 'elbow' && (
          <path
            d="M 20 40 L 20 20 L 40 20"
            fill="none"
            className={strokeClass}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {tile.type === 'cross' && (
          <>
            <line
              x1="20"
              y1="0"
              x2="20"
              y2="40"
              className={strokeClass}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <line
              x1="0"
              y1="20"
              x2="40"
              y2="20"
              className={strokeClass}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    );
  };

  const gridColsClass = size === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Grid Size', value: `${size} × ${size}` },
          { label: 'Rotations', value: moves, tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Board */}
      <div className="w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#B4C3CE] mb-4 text-center">
          Click tiles to rotate pipe segments into continuous alignment.
        </p>

        <div className={`grid ${gridColsClass} gap-2.5 w-full max-w-[340px] aspect-square`}>
          {grid.map((tile, idx) => {
            const isAligned = isTileAligned(tile);
            const isHint = hintIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-lg flex items-center justify-center border transition-all duration-150 select-none ${
                  isHint
                    ? 'bg-[#38C6BA]/20 border-[#38C6BA]'
                    : isAligned
                    ? 'bg-pv-surface-secondary border-pv-border-strong'
                    : 'bg-pv-surface-secondary border-pv-border hover:border-pv-border-strong'
                }`}
                aria-label={`Rotate pipe segment ${idx}`}
              >
                <div
                  className="transition-transform duration-200"
                  style={{ transform: `rotate(${tile.rotation}deg)` }}
                >
                  {renderPipeSvg(tile, isAligned)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Align 1 Tile ({hintsLeft})
        </button>
        <button
          onClick={initGrid}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Board
        </button>
      </div>
    </div>
  );
};
