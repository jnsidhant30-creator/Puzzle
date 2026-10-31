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

interface PipeTile {
  type: 'straight' | 'elbow' | 'cross';
  rotation: number;
  targetRotation: number;
}

export const PipeConnect: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const [grid, setGrid] = useState<PipeTile[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [hintIndex, setHintIndex] = useState<number | null>(null);

  useEffect(() => {
    initGrid();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  const initGrid = () => {
    const total = size * size;
    const tiles: PipeTile[] = [];
    for (let i = 0; i < total; i++) {
      const type: 'straight' | 'elbow' | 'cross' = Math.random() > 0.6 ? 'cross' : Math.random() > 0.3 ? 'elbow' : 'straight';
      const targetRotation = Math.floor(Math.random() * 4) * 90;
      let rotation = Math.floor(Math.random() * 4) * 90;
      if (type !== 'cross' && rotation === targetRotation) {
        rotation = (rotation + 90) % 360;
      }
      tiles.push({ type, rotation, targetRotation });
    }
    setGrid(tiles);
    setMoves(0);
    setTimer(0);
    setHintIndex(null);
  };

  const handleTileClick = (index: number) => {
    sound.playRotate();
    const newGrid = [...grid];
    newGrid[index].rotation = (newGrid[index].rotation + 90) % 360;
    setGrid(newGrid);
    setMoves(m => m + 1);

    // Check win condition
    const isSolved = newGrid.every(tile => tile.type === 'cross' || tile.rotation === tile.targetRotation);
    if (isSolved) {
      sound.playSuccess();
      const score = Math.max(150, 1200 - moves * 10 - timer * 5);
      setTimeout(() => onComplete(score, timer, true), 600);
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0) return;
    const misalignedIdx = grid.findIndex(tile => tile.type !== 'cross' && tile.rotation !== tile.targetRotation);
    if (misalignedIdx === -1) return;

    if (useHint()) {
      sound.playRotate();
      const newGrid = [...grid];
      newGrid[misalignedIdx].rotation = newGrid[misalignedIdx].targetRotation;
      setGrid(newGrid);
      setHintIndex(misalignedIdx);
      setTimeout(() => setHintIndex(null), 2500);

      // Check win condition
      const isSolved = newGrid.every(tile => tile.type === 'cross' || tile.rotation === tile.targetRotation);
      if (isSolved) {
        sound.playSuccess();
        const score = Math.max(150, 1200 - moves * 10 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    }
  };

  const renderPipeShape = (tile: PipeTile) => {
    if (tile.type === 'straight') return '║';
    if (tile.type === 'elbow') return '╚';
    return '╬';
  };

  const gridColsClass = size === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Grid</p>
          <p className="text-xl font-bold text-sky-400">{size}x{size}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Rotations</p>
          <p className="text-xl font-bold text-blue-400">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-emerald-400">{timer}s</p>
        </div>
      </div>

      {/* Pipe Board */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-sky-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <p className="text-xs font-semibold text-sky-300 uppercase tracking-widest mb-6">
          Click Tiles to Rotate &amp; Connect Pipes
        </p>
        <div className={`grid ${gridColsClass} gap-3 w-full max-w-[320px] aspect-square`}>
          {grid.map((tile, idx) => {
            const isAligned = tile.type === 'cross' || tile.rotation === tile.targetRotation;
            const isHint = hintIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-2xl text-4xl sm:text-5xl font-black flex items-center justify-center border-2 transition-transform duration-200 shadow-inner ${
                  isHint
                    ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-white ring-4 ring-pv-dragon-fruit'
                    : isAligned
                    ? 'bg-sky-950/80 border-sky-400 text-sky-300 shadow-sky-500/20'
                    : 'bg-pv-surface-primary hover:bg-pv-surface-soft border-pv-border-strong text-pv-text-secondary'
                }`}
                style={{ transform: `rotate(${tile.rotation}deg)` }}
                aria-label={`Pipe tile ${idx}`}
              >
                {renderPipeShape(tile)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Align 1 Tile ({hintsLeft})
        </button>
        <button
          onClick={initGrid}
          className="flex-1 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Reset Pipes
        </button>
      </div>
    </div>
  );
};
