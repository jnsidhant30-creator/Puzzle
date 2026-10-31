import { useState, useCallback, useEffect } from 'react';
import type { MazePuzzle } from './types';

export const useMazeEscape = (
  puzzle: MazePuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onComplete: () => void
) => {
  const [playerPosition, setPlayerPosition] = useState<{r: number, c: number}>({r: 1, c: 1});
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (puzzle) {
      setPlayerPosition(puzzle.start);
      setMoves(0);
      onMovesUpdate(0);
    }
  }, [puzzle]);

  const movePlayer = useCallback((dr: number, dc: number) => {
    if (!puzzle || isPaused) return;

    const nextR = playerPosition.r + dr;
    const nextC = playerPosition.c + dc;

    if (
      nextR >= 0 && nextR < puzzle.rows &&
      nextC >= 0 && nextC < puzzle.cols
    ) {
      const targetCell = puzzle.grid[nextR][nextC];
      if (targetCell.type !== 'WALL') {
        setPlayerPosition({ r: nextR, c: nextC });
        const newMoves = moves + 1;
        setMoves(newMoves);
        onMovesUpdate(newMoves);

        if (targetCell.type === 'EXIT') {
          setTimeout(() => {
            onComplete();
          }, 300);
        }
      }
    }
  }, [puzzle, isPaused, playerPosition, moves, onMovesUpdate, onComplete]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(-1, 0);
      else if (e.key === 'ArrowDown' || e.key === 's') movePlayer(1, 0);
      else if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(0, -1);
      else if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(0, 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, isPaused]);

  // Click support (only adjacent)
  const selectCell = useCallback((r: number, c: number) => {
    const dr = r - playerPosition.r;
    const dc = c - playerPosition.c;
    if (Math.abs(dr) + Math.abs(dc) === 1) { // Exactly one step away
      movePlayer(dr, dc);
    }
  }, [playerPosition, movePlayer]);

  return {
    playerPosition,
    selectCell
  };
};
