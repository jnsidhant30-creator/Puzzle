import { useState, useCallback, useEffect } from 'react';
import type { ArrowPathPuzzle } from './types';

export const useArrowPath = (
  puzzle: ArrowPathPuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onComplete: () => void
) => {
  const [currentPath, setCurrentPath] = useState<{r: number, c: number}[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (puzzle) {
      setCurrentPath([puzzle.start]);
      setMoves(0);
      onMovesUpdate(0);
    }
  }, [puzzle]);

  const selectCell = useCallback((r: number, c: number) => {
    if (!puzzle || isPaused) return;

    const currentCellCoords = currentPath[currentPath.length - 1];
    if (!currentCellCoords) return;

    // Check if clicking previous cell to undo
    if (currentPath.length > 1) {
      const prevCellCoords = currentPath[currentPath.length - 2];
      if (prevCellCoords.r === r && prevCellCoords.c === c) {
        setCurrentPath(prev => prev.slice(0, -1));
        return;
      }
    }

    // Check if cell is already in path
    if (currentPath.some(cell => cell.r === r && cell.c === c)) {
      return;
    }

    const gridCell = puzzle.grid[currentCellCoords.r][currentCellCoords.c];
    if (!gridCell.direction) return;

    let dr = 0; let dc = 0;
    if (gridCell.direction === 'UP') dr = -1;
    if (gridCell.direction === 'DOWN') dr = 1;
    if (gridCell.direction === 'LEFT') dc = -1;
    if (gridCell.direction === 'RIGHT') dc = 1;

    // Valid if it's the exact neighbor pointed to by the arrow
    if (currentCellCoords.r + dr === r && currentCellCoords.c + dc === c) {
      const targetGridCell = puzzle.grid[r][c];
      if (targetGridCell.type === 'HURDLE') return;

      const newPath = [...currentPath, { r, c }];
      setCurrentPath(newPath);
      
      const newMoves = moves + 1;
      setMoves(newMoves);
      onMovesUpdate(newMoves);

      if (targetGridCell.type === 'TARGET') {
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }
  }, [puzzle, isPaused, currentPath, moves, onMovesUpdate, onComplete]);

  return {
    currentPath,
    selectCell
  };
};
