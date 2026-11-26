import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, ArrowRight, Lightbulb, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
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
    { id: 'b3', x: 3, y: 1, length: 2, orientation: 'V' },
    { id: 'b4', x: 4, y: 0, length: 2, orientation: 'H' },
    { id: 'b5', x: 5, y: 1, length: 3, orientation: 'V' },
    { id: 'b6', x: 1, y: 4, length: 2, orientation: 'H' },
    { id: 'b7', x: 3, y: 4, length: 2, orientation: 'H' },
    { id: 'b8', x: 0, y: 5, length: 3, orientation: 'H' },
  ]
};

export const BlockEscape: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const gridWidth = 6;
  const gridHeight = 6;
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [moves, setMoves] = useState(0);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initPuzzle();
  }, [difficulty]);

  const initPuzzle = () => {
    const levelConfig = PUZZLE_LEVELS[difficulty] || PUZZLE_LEVELS.medium;
    setBlocks(JSON.parse(JSON.stringify(levelConfig)));
    setMoves(0);
    setTimer(0);
    setHighlightedBlockId(null);
    setIsWon(false);
  };

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
    if (isWon) return;
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    if (block.orientation === 'H') {
      const targetX = delta > 0 ? block.x + block.length : block.x - 1;
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

      const target = newBlocks.find(b => b.isTarget);
      if (target && target.x + target.length >= gridWidth) {
        setIsWon(true);
        sound.playSuccess();
        const score = Math.max(150, 1000 - moves * 15 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    } else {
      const targetY = delta > 0 ? block.y + block.length : block.y - 1;
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
      const obstacle = blocks.find(b => !b.isTarget && isCellOccupied(target.x + target.length, target.y, b.id, blocks));
      const chosen = obstacle ? obstacle.id : target.id;
      setHighlightedBlockId(chosen);
      setTimeout(() => setHighlightedBlockId(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Moves', value: moves },
          {
            label: 'Goal',
            value: (
              <span className="inline-flex items-center gap-1">
                Exit <ArrowRight className="w-3.5 h-3.5" />
              </span>
            ),
            tone: 'accent',
          },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Board Container */}
      <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center relative">
        <p className="text-xs text-[#C5BFD0] mb-4 text-center">
          Slide obstacles out of the path to move the highlighted block to the right exit.
        </p>

        <div className="relative w-full max-w-[340px] aspect-square bg-pv-surface-secondary rounded-lg border border-pv-border overflow-hidden">
          {/* Exit Indicator */}
          <div className="absolute right-0 top-1/3 w-1.5 h-1/6 bg-emerald-500 z-20 rounded-l" />

          {/* Grid lines */}
          <div className="grid grid-cols-6 grid-rows-6 w-full h-full absolute inset-0 pointer-events-none opacity-30">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border border-pv-border/40" />
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
                className={`absolute p-1 transition-all duration-150 ${b.isTarget ? 'z-10' : 'z-0'}`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`
                }}
              >
                <div
                  className={`w-full h-full rounded-md border flex items-center justify-around select-none transition-colors ${
                    b.isTarget
                      ? 'bg-pv-dragon-fruit border-pv-dragon-fruit text-[#110F15] font-semibold'
                      : isHighlighted
                      ? 'bg-pv-surface-soft border-pv-dragon-fruit text-pv-text-primary ring-1 ring-pv-dragon-fruit'
                      : 'bg-pv-surface-soft border-pv-border text-pv-text-secondary'
                  }`}
                >
                  <button
                    onClick={() => moveBlock(b.id, -1)}
                    className={`p-1 rounded hover:bg-black/20 transition active:scale-95 flex items-center justify-center ${
                      b.isTarget ? 'text-[#110F15]' : 'text-pv-text-primary'
                    }`}
                    aria-label={b.orientation === 'H' ? 'Move Left' : 'Move Up'}
                  >
                    {b.orientation === 'H' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </button>
                  {b.isTarget && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1">Goal</span>
                  )}
                  <button
                    onClick={() => moveBlock(b.id, 1)}
                    className={`p-1 rounded hover:bg-black/20 transition active:scale-95 flex items-center justify-center ${
                      b.isTarget ? 'text-[#110F15]' : 'text-pv-text-primary'
                    }`}
                    aria-label={b.orientation === 'H' ? 'Move Right' : 'Move Down'}
                  >
                    {b.orientation === 'H' ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || !!highlightedBlockId}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initPuzzle}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Board
        </button>
      </div>
    </div>
  );
};
