import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { HelpCircle, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

export const SlidingPuzzle: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const totalTiles = size * size;
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [hintTileIdx, setHintTileIdx] = useState<number | null>(null);

  useEffect(() => {
    initBoard();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  const initBoard = () => {
    const solved = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
    solved.push(0);

    let arr = [...solved];
    let emptyIdx = totalTiles - 1;
    for (let i = 0; i < (size === 3 ? 30 : 60); i++) {
      const neighbors = getValidNeighbors(emptyIdx, size);
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      [arr[emptyIdx], arr[randomNeighbor]] = [arr[randomNeighbor], arr[emptyIdx]];
      emptyIdx = randomNeighbor;
    }
    setBoard(arr);
    setMoves(0);
    setTimer(0);
    setHintTileIdx(null);
  };

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
    const emptyIdx = board.indexOf(0);
    const validNeighbors = getValidNeighbors(emptyIdx, size);
    if (validNeighbors.includes(index)) {
      sound.playMove();
      const newBoard = [...board];
      [newBoard[emptyIdx], newBoard[index]] = [newBoard[index], newBoard[emptyIdx]];
      setBoard(newBoard);
      setMoves(m => m + 1);
      setHintTileIdx(null);

      // Check win condition
      const isSolved = newBoard.every((val, i) => (i === totalTiles - 1 ? val === 0 : val === i + 1));
      if (isSolved) {
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
      // Pick a neighbor tile that is not currently in its correct slot
      const misaligned = validNeighbors.find(idx => board[idx] !== idx + 1);
      const chosen = misaligned !== undefined ? misaligned : validNeighbors[0];
      setHintTileIdx(chosen);
      setTimeout(() => setHintTileIdx(null), 3000);
    }
  };

  const gridColsClass = size === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Grid</p>
          <p className="text-xl font-bold text-cyan-400">{size}x{size}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Moves</p>
          <p className="text-xl font-bold text-blue-400">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-emerald-400">{timer}s</p>
        </div>
      </div>

      {/* Sliding Grid */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-cyan-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <div className={`grid ${gridColsClass} gap-3 w-full max-w-md aspect-square`}>
          {board.map((val, idx) => {
            const isHint = hintTileIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                disabled={val === 0}
                className={`rounded-xl text-2xl sm:text-3xl font-black flex items-center justify-center transition-all duration-150 shadow-md ${
                  val === 0
                    ? 'bg-pv-surface-primary border-2 border-dashed border-pv-border-violet cursor-default'
                    : isHint
                    ? 'bg-pv-dragon-fruit/40 border-pv-dragon-fruit text-white animate-pulse ring-4 ring-pv-dragon-fruit'
                    : 'bg-pv-surface-primary hover:bg-cyan-600 text-cyan-300 hover:text-white border-2 border-pv-border-strong hover:border-cyan-400 active:scale-95 shadow-cyan-950/30'
                }`}
              >
                {val !== 0 ? val : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || hintTileIdx !== null}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initBoard}
          className="flex-1 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Reset Board
        </button>
      </div>
    </div>
  );
};
