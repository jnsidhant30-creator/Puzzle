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

interface Tile {
  id: number;
  rotation: number;
  targetRotation: number;
  symbol: string;
}

const TILE_SYMBOLS = ['┼', '└', '┬', '│', '┐', '┴', '├', '┤', '┌', '┘'];

export const RotatingTiles: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [rotationsCount, setRotationsCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [hintIndex, setHintIndex] = useState<number | null>(null);

  useEffect(() => {
    initTiles();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  const initTiles = () => {
    const total = size * size;
    const list: Tile[] = [];
    for (let i = 0; i < total; i++) {
      const sym = TILE_SYMBOLS[i % TILE_SYMBOLS.length];
      const targetRotation = Math.floor(Math.random() * 4) * 90;
      let rotation = Math.floor(Math.random() * 4) * 90;
      if (rotation === targetRotation) {
        rotation = (rotation + 90) % 360;
      }
      list.push({ id: i, rotation, targetRotation, symbol: sym });
    }
    setTiles(list);
    setRotationsCount(0);
    setTimer(0);
    setHintIndex(null);
  };

  const handleTileClick = (index: number) => {
    sound.playRotate();
    const newTiles = [...tiles];
    newTiles[index].rotation = (newTiles[index].rotation + 90) % 360;
    setTiles(newTiles);
    setRotationsCount(r => r + 1);

    const isSolved = newTiles.every(t => t.rotation === t.targetRotation);
    if (isSolved) {
      sound.playSuccess();
      const score = Math.max(120, 1000 - rotationsCount * 8 - timer * 4);
      setTimeout(() => onComplete(score, timer, true), 600);
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0) return;
    const misalignedIdx = tiles.findIndex(t => t.rotation !== t.targetRotation);
    if (misalignedIdx === -1) return;

    if (useHint()) {
      sound.playRotate();
      const newTiles = [...tiles];
      newTiles[misalignedIdx].rotation = newTiles[misalignedIdx].targetRotation;
      setTiles(newTiles);
      setHintIndex(misalignedIdx);
      setTimeout(() => setHintIndex(null), 2500);

      const isSolved = newTiles.every(t => t.rotation === t.targetRotation);
      if (isSolved) {
        sound.playSuccess();
        const score = Math.max(120, 1000 - rotationsCount * 8 - timer * 4);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    }
  };

  const gridColsClass = size === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Grid</p>
          <p className="text-xl font-bold text-pv-dragon-fruit-light">{size}x{size}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Rotations</p>
          <p className="text-xl font-bold text-blue-400">{rotationsCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
      </div>

      {/* Rotating Board */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-pv-border-violet rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <p className="text-xs font-semibold text-pv-dragon-fruit-light uppercase tracking-widest mb-6">
          Click Segments to Rotate Artwork into Place
        </p>
        <div className={`grid ${gridColsClass} gap-3 w-full max-w-[320px] aspect-square`}>
          {tiles.map((tile, idx) => {
            const isAligned = tile.rotation === tile.targetRotation;
            const isHint = hintIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-2xl text-4xl sm:text-5xl font-black flex items-center justify-center border-2 transition-transform duration-200 shadow-inner ${
                  isHint
                    ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-white ring-4 ring-pv-dragon-fruit'
                    : isAligned
                    ? 'bg-indigo-950/80 border-indigo-400 text-pv-dragon-fruit-light shadow-indigo-500/30'
                    : 'bg-pv-surface-primary hover:bg-pv-surface-soft border-pv-border-strong text-pv-text-secondary'
                }`}
                style={{ transform: `rotate(${tile.rotation}deg)` }}
                aria-label={`Artwork tile ${idx}`}
              >
                {tile.symbol}
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
          onClick={initTiles}
          className="flex-1 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Reset Pattern
        </button>
      </div>
    </div>
  );
};
