import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

interface Block {
  id: string;
  x: number;
  y: number;
  length: number;
  orientation: 'H' | 'V';
  isTarget?: boolean;
}

const PUZZLE_LEVELS: Record<Difficulty, Block[]> = {
  easy: [
    { id: 'target', x: 1, y: 2, length: 2, orientation: 'H', isTarget: true },
    { id: 'b1', x: 0, y: 0, length: 3, orientation: 'V' },
    { id: 'b2', x: 3, y: 0, length: 2, orientation: 'H' },
    { id: 'b3', x: 3, y: 2, length: 2, orientation: 'V' },
    { id: 'b4', x: 0, y: 4, length: 2, orientation: 'H' },
  ],
  medium: [
    { id: 'target', x: 1, y: 2, length: 2, orientation: 'H', isTarget: true },
    { id: 'b1', x: 0, y: 0, length: 3, orientation: 'V' },
    { id: 'b2', x: 3, y: 0, length: 2, orientation: 'H' },
    { id: 'b3', x: 3, y: 1, length: 2, orientation: 'V' },
    { id: 'b4', x: 0, y: 4, length: 2, orientation: 'H' },
    { id: 'b5', x: 2, y: 3, length: 2, orientation: 'V' },
    { id: 'b6', x: 5, y: 1, length: 3, orientation: 'V' },
  ],
  hard: [
    { id: 'target', x: 0, y: 2, length: 2, orientation: 'H', isTarget: true },
    { id: 'b1', x: 2, y: 0, length: 3, orientation: 'V' },
    { id: 'b2', x: 0, y: 0, length: 2, orientation: 'H' },
    { id: 'b3', x: 3, y: 1, length: 3, orientation: 'V' },
    { id: 'b4', x: 4, y: 0, length: 2, orientation: 'H' },
    { id: 'b5', x: 5, y: 1, length: 3, orientation: 'V' },
    { id: 'b6', x: 1, y: 4, length: 2, orientation: 'H' },
    { id: 'b7', x: 3, y: 4, length: 2, orientation: 'H' },
    { id: 'b8', x: 0, y: 5, length: 3, orientation: 'H' },
  ]
};

export const BlockEscape: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const gridWidth = 6;
  const gridHeight = 6;
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  useEffect(() => {
    initPuzzle();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  const initPuzzle = () => {
    const levelConfig = PUZZLE_LEVELS[difficulty] || PUZZLE_LEVELS.medium;
    setBlocks(JSON.parse(JSON.stringify(levelConfig)));
    setMoves(0);
    setTimer(0);
    setHighlightedBlockId(null);
  };

  // Helper to check if a grid cell is occupied by any block (excluding a specific block id)
  const isCellOccupied = (x: number, y: number, excludeId: string, currentBlocks: Block[]): boolean => {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return true;
    return currentBlocks.some(b => {
      if (b.id === excludeId) return false;
      if (b.orientation === 'H') {
        return b.y === y && x >= b.x && x < b.x + b.length;
      } else {
        return b.x === x && y >= b.y && y < b.y + b.length;
      }
    });
  };

  const moveBlock = (id: string, delta: number) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    if (block.orientation === 'H') {
      const targetX = delta > 0 ? block.x + block.length : block.x - 1;
      // Check collision
      if (isCellOccupied(targetX, block.y, id, blocks)) {
        sound.playError();
        return;
      }
      const newX = block.x + delta;
      if (newX < 0 || newX + block.length > gridWidth) {
        sound.playError();
        return;
      }

      const newBlocks = blocks.map(b => (b.id === id ? { ...b, x: newX } : b));
      sound.playMove();
      setBlocks(newBlocks);
      setMoves(m => m + 1);

      // Check win condition
      const target = newBlocks.find(b => b.isTarget);
      if (target && target.x + target.length >= gridWidth) {
        sound.playSuccess();
        const score = Math.max(150, 1000 - moves * 15 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    } else {
      const targetY = delta > 0 ? block.y + block.length : block.y - 1;
      // Check collision
      if (isCellOccupied(block.x, targetY, id, blocks)) {
        sound.playError();
        return;
      }
      const newY = block.y + delta;
      if (newY < 0 || newY + block.length > gridHeight) {
        sound.playError();
        return;
      }

      const newBlocks = blocks.map(b => (b.id === id ? { ...b, y: newY } : b));
      sound.playMove();
      setBlocks(newBlocks);
      setMoves(m => m + 1);
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || highlightedBlockId) return;
    const target = blocks.find(b => b.isTarget);
    if (!target) return;

    if (useHint()) {
      sound.playClick();
      // Find what is blocking the target block's row (y=2)
      const obstacle = blocks.find(b => !b.isTarget && isCellOccupied(target.x + target.length, target.y, b.id, blocks));
      const chosen = obstacle ? obstacle.id : target.id;
      setHighlightedBlockId(chosen);
      setTimeout(() => setHighlightedBlockId(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Moves</p>
          <p className="text-xl font-bold text-red-400">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Goal</p>
          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            Escape Red Block <ArrowRight className="w-4 h-4" />
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
      </div>

      {/* Grid Container */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-red-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center relative">
        <div className="relative w-full max-w-[320px] aspect-square bg-pv-bg-primary rounded-xl border-2 border-pv-border-violet overflow-hidden">
          {/* Exit Indicator */}
          <div className="absolute right-0 top-1/3 w-2 h-1/6 bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500 z-20" />

          {/* Grid lines */}
          <div className="grid grid-cols-6 grid-rows-6 w-full h-full absolute inset-0 pointer-events-none opacity-20">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border border-pv-border-strong" />
            ))}
          </div>

          {/* Blocks */}
          {blocks.map(b => {
            const leftPct = (b.x / gridWidth) * 100;
            const topPct = (b.y / gridHeight) * 100;
            const widthPct = (b.orientation === 'H' ? b.length / gridWidth : 1 / gridWidth) * 100;
            const heightPct = (b.orientation === 'V' ? b.length / gridHeight : 1 / gridHeight) * 100;
            const isHighlighted = highlightedBlockId === b.id;

            return (
              <div
                key={b.id}
                className={`absolute p-1 transition-all duration-200 ${
                  b.isTarget ? 'z-10' : 'z-0'
                }`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`
                }}
              >
                <div
                  className={`w-full h-full rounded-xl border-2 flex items-center justify-around shadow-md ${
                    b.isTarget
                      ? 'bg-rose-600 border-red-400 text-white shadow-red-600/50'
                      : isHighlighted
                      ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-white ring-2 ring-pv-dragon-fruit animate-pulse'
                      : 'bg-pv-surface-soft border-slate-600 text-pv-text-secondary'
                  }`}
                >
                  {/* Arrow controls */}
                  <button
                    onClick={() => moveBlock(b.id, -1)}
                    className="hover:bg-black/30 text-xs font-bold px-1.5 py-1 rounded active:scale-90 transition"
                    aria-label={b.orientation === 'H' ? 'Move Left' : 'Move Up'}
                  >
                    {b.orientation === 'H' ? '◄' : '▲'}
                  </button>
                  <button
                    onClick={() => moveBlock(b.id, 1)}
                    className="hover:bg-black/30 text-xs font-bold px-1.5 py-1 rounded active:scale-90 transition"
                    aria-label={b.orientation === 'H' ? 'Move Right' : 'Move Down'}
                  >
                    {b.orientation === 'H' ? '►' : '▼'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || !!highlightedBlockId}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initPuzzle}
          className="flex-1 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Reset Puzzle
        </button>
      </div>
    </div>
  );
};
