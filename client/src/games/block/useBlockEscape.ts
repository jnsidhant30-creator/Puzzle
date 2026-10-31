import { useState, useCallback, useEffect } from 'react';
import type { BlockEscapePuzzle, BlockModel } from './types';

export const useBlockEscape = (
  puzzle: BlockEscapePuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onComplete: () => void
) => {
  const [blocks, setBlocks] = useState<BlockModel[]>([]);
  const [, setMoves] = useState(0);

  useEffect(() => {
    if (puzzle) {
      setBlocks(puzzle.blocks);
      setMoves(0);
      onMovesUpdate(0);
    }
  }, [puzzle]); 

  const moveBlock = useCallback((id: string, dRow: number, dCol: number) => {
    if (isPaused || !puzzle) return false;
    
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      
      const b = prev[idx];
      const newR = b.r + dRow;
      const newC = b.c + dCol;
      
      // Enforce axis constraints
      if (b.axis === 'H' && dRow !== 0) return prev;
      if (b.axis === 'V' && dCol !== 0) return prev;
      
      // Check boundaries
      if (newR < 0 || newC < 0) return prev;
      if (b.axis === 'H' && newC + b.len > puzzle.cols) return prev;
      if (b.axis === 'V' && newR + b.len > puzzle.rows) return prev;
      
      // Check collisions
      const grid = Array(puzzle.rows).fill(null).map(() => Array(puzzle.cols).fill(false));
      for (let i = 0; i < prev.length; i++) {
        if (i === idx) continue;
        const ob = prev[i];
        for (let j = 0; j < ob.len; j++) {
          const r = ob.axis === 'V' ? ob.r + j : ob.r;
          const c = ob.axis === 'H' ? ob.c + j : ob.c;
          grid[r][c] = true;
        }
      }
      
      // Verify new positions
      let collision = false;
      for (let j = 0; j < b.len; j++) {
        const r = b.axis === 'V' ? newR + j : newR;
        const c = b.axis === 'H' ? newC + j : newC;
        if (grid[r][c]) {
          collision = true;
          break;
        }
      }
      
      if (collision) return prev;
      
      // Check if actually moved
      if (dRow === 0 && dCol === 0) return prev;

      const newBlocks = [...prev];
      newBlocks[idx] = { ...b, r: newR, c: newC };
      
      setMoves(m => {
        const next = m + 1;
        onMovesUpdate(next);
        return next;
      });
      
      return newBlocks;
    });
    
    return true;
  }, [isPaused, puzzle, onMovesUpdate]);

  // Check win condition
  useEffect(() => {
    if (!puzzle || isPaused) return;
    const target = blocks.find(b => b.id === 'TARGET');
    if (target && target.r === puzzle.exitR && target.c + target.len - 1 >= puzzle.exitC) {
      onComplete();
    }
  }, [blocks, puzzle, isPaused, onComplete]);

  return {
    blocks,
    moveBlock
  };
};
