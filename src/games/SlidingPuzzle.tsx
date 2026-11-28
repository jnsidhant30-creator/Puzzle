import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Lightbulb } from 'lucide-react';
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

export const SlidingPuzzle: React.FC<Props> = ({
  difficulty,
  onComplete,
  useHint,
  hintsLeft,
  seed,
  isPaused = false,
}) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const totalTiles = size * size;
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [hintTileIdx, setHintTileIdx] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initBoard(true);
  }, [difficulty, seed]);

  const initBoard = (usePropSeed = false) => {
    const rng = createRng(usePropSeed && typeof seed === 'number' ? seed : undefined);
    const solved = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
    solved.push(0);

    let arr = [...solved];
    let emptyIdx = totalTiles - 1;
    let prevIdx = -1;
    const steps = size === 3 ? 34 : 70;
    for (let i = 0; i < steps; i++) {
      const neighbors = getValidNeighbors(emptyIdx, size).filter((n) => n !== prevIdx);
      const pool = neighbors.length > 0 ? neighbors : getValidNeighbors(emptyIdx, size);
      const randomNeighbor = pool[Math.floor(rng() * pool.length)];
      prevIdx = emptyIdx;
      [arr[emptyIdx], arr[randomNeighbor]] = [arr[randomNeighbor], arr[emptyIdx]];
      emptyIdx = randomNeighbor;
    }
    while (arr.every((val, idx) => (idx === totalTiles - 1 ? val === 0 : val === idx + 1))) {
      const n = getValidNeighbors(emptyIdx, size)[0];
      [arr[emptyIdx], arr[n]] = [arr[n], arr[emptyIdx]];
      emptyIdx = n;
    }
    setBoard(arr);
    setMoves(0);
    setTimer(0);
    setHintTileIdx(null);
    setIsWon(false);
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
      const emptyIdx = board.indexOf(0);
      if (emptyIdx < 0) return;
      const r = Math.floor(emptyIdx / size);
      const c = emptyIdx % size;
      let slideFrom = -1;
      if (e.key === 'ArrowUp' && r < size - 1) slideFrom = emptyIdx + size;
      else if (e.key === 'ArrowDown' && r > 0) slideFrom = emptyIdx - size;
      else if (e.key === 'ArrowLeft' && c < size - 1) slideFrom = emptyIdx + 1;
      else if (e.key === 'ArrowRight' && c > 0) slideFrom = emptyIdx - 1;
      if (slideFrom !== -1) {
        e.preventDefault();
        handleTileClick(slideFrom);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, size, isWon, isPaused]);

  const getValidNeighbors = (idx: number, gridDimension: number) => {
    const row = Math.floor(idx / gridDimension);
    const col = idx % gridDimension;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(idx - gridDimension);
    if (row < gridDimension - 1) neighbors.push(idx + gridDimension);
    if (col > 0) neighbors.push(idx - 1);
    if (col < gridDimension - 1) neighbors.push(idx + 1);
    return neighbors;
  };

  const handleTileClick = (index: number) => {
    if (isWon) return;
    const emptyIdx = board.indexOf(0);
    const validNeighbors = getValidNeighbors(emptyIdx, size);
    if (validNeighbors.includes(index)) {
      sound.playMove();
      const newBoard = [...board];
      [newBoard[emptyIdx], newBoard[index]] = [newBoard[index], newBoard[emptyIdx]];
      setBoard(newBoard);
      setMoves(m => m + 1);
      setHintTileIdx(null);

      const isSolved = newBoard.every((val, i) => (i === totalTiles - 1 ? val === 0 : val === i + 1));
      if (isSolved) {
        setIsWon(true);
        sound.playSuccess();
        const score = Math.max(150, 1200 - moves * 15 - timer * 8);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    } else {
      sound.playError();
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || hintTileIdx !== null) return;
    const emptyIdx = board.indexOf(0);
    const validNeighbors = getValidNeighbors(emptyIdx, size);
    if (validNeighbors.length === 0) return;

    if (useHint()) {
      sound.playClick();
      const misaligned = validNeighbors.find(idx => board[idx] !== idx + 1);
      const chosen = misaligned !== undefined ? misaligned : validNeighbors[0];
      setHintTileIdx(chosen);
      setTimeout(() => setHintTileIdx(null), 3000);
    }
  };

  const gridColsClass = size === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="pv-game-grid flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Grid Size', value: `${size} × ${size}` },
          { label: 'Moves', value: moves, tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Board */}
      <div className="pv-game-board w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#B4C3CE] mb-4 text-center">
          Slide tiles into numerical order from 1 to {totalTiles - 1}.
        </p>

        <div className={`grid ${gridColsClass} gap-2.5 w-full max-w-[340px] aspect-square`}>
          {board.map((val, idx) => {
            const isHint = hintTileIdx === idx;
            const isEmpty = val === 0;

            let tileStyle = 'bg-pv-surface-secondary border-pv-border hover:border-pv-border-strong text-pv-text-primary';
            if (isEmpty) {
              tileStyle = 'bg-pv-bg-primary/50 border-pv-border/40 cursor-default';
            } else if (isHint) {
              tileStyle = 'bg-[#38C6BA]/20 border-[#38C6BA] text-[#A8E5D5] font-bold';
            }

            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                disabled={isEmpty}
                className={`aspect-square rounded-lg text-2xl sm:text-3xl font-semibold font-tabular flex items-center justify-center border transition-colors select-none active:translate-y-px ${tileStyle}`}
                aria-label={isEmpty ? 'Empty slot' : `Tile ${val}`}
              >
                {!isEmpty && val}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || hintTileIdx !== null}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Next Move ({hintsLeft})
        </button>
        <button
          onClick={() => initBoard(false)}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Board
        </button>
      </div>
    </div>
  );
};
