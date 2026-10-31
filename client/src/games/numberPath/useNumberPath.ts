import { useState, useCallback, useEffect } from 'react';
import type { NumberPathPuzzle } from './types';

export const useNumberPath = (
  puzzle: NumberPathPuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onComplete: () => void
) => {
  const [currentR, setCurrentR] = useState(-1);
  const [currentC, setCurrentC] = useState(-1);
  const [expectedVal, setExpectedVal] = useState(1);
  const [path, setPath] = useState<{r: number, c: number}[]>([]);
  const [, setMoves] = useState(0);

  useEffect(() => {
    if (puzzle) {
      setCurrentR(puzzle.start.r);
      setCurrentC(puzzle.start.c);
      setExpectedVal(1);
      setPath([{r: puzzle.start.r, c: puzzle.start.c}]);
      setMoves(0);
      onMovesUpdate(0);
    }
  }, [puzzle]);

  const selectCell = useCallback((r: number, c: number) => {
    if (!puzzle || isPaused) return false;
    
    // Check adjacency
    const isAdjacent = Math.abs(currentR - r) + Math.abs(currentC - c) === 1;
    if (!isAdjacent) return false;

    // Check if cell is the next expected
    const cell = puzzle.grid[r][c];
    
    if (expectedVal < puzzle.pathLength - 1) {
      if ((cell.type === 'NUMBER' || cell.type === 'DECOY') && cell.value === expectedVal) {
        // Valid step
        setCurrentR(r);
        setCurrentC(c);
        setExpectedVal(e => e + 1);
        setPath(p => [...p, {r, c}]);
        setMoves(m => {
          const next = m + 1;
          onMovesUpdate(next);
          return next;
        });
        return true;
      }
    } else if (expectedVal === puzzle.pathLength - 1) {
      if (cell.type === 'TARGET') {
        setCurrentR(r);
        setCurrentC(c);
        setPath(p => [...p, {r, c}]);
        setMoves(m => {
          const next = m + 1;
          onMovesUpdate(next);
          return next;
        });
        onComplete();
        return true;
      }
    }
    
    // Invalid move (wrong number or blocker) adds to move counter as penalty but doesn't advance
    setMoves(m => {
      const next = m + 1;
      onMovesUpdate(next);
      return next;
    });
    return false;

  }, [puzzle, isPaused, currentR, currentC, expectedVal, onMovesUpdate, onComplete]);

  return {
    currentR,
    currentC,
    expectedVal,
    path,
    selectCell
  };
};
