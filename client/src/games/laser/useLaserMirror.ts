import { useState, useCallback, useEffect } from 'react';
import type { LaserPuzzle, LaserCell, Direction } from './types';

export const useLaserMirror = (
  puzzle: LaserPuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onComplete: () => void
) => {
  const [grid, setGrid] = useState<LaserCell[][]>([]);
  const [moves, setMoves] = useState(0);

  // Compute laser path whenever grid changes
  useEffect(() => {
    if (!puzzle) return;
    
    // Create a copy of the grid to hold laser state
    const newGrid: LaserCell[][] = JSON.parse(JSON.stringify(grid.length > 0 ? grid : puzzle.grid));
    
    // Reset laser state
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        newGrid[r][c].hasLaser = false;
        newGrid[r][c].laserDirections = [];
      }
    }

    // Raycast
    const emitterCell = newGrid[puzzle.emitter.r][puzzle.emitter.c];
    let currR = puzzle.emitter.r;
    let currC = puzzle.emitter.c;
    let currDir: Direction | undefined = emitterCell.emitterDirection;
    
    let targetHit = false;
    let maxSteps = puzzle.rows * puzzle.cols * 2;
    let steps = 0;

    if (currDir) {
      newGrid[currR][currC].hasLaser = true;
      if (!newGrid[currR][currC].laserDirections) newGrid[currR][currC].laserDirections = [];
      newGrid[currR][currC].laserDirections!.push(currDir);

      while (steps < maxSteps) {
        steps++;
        
        // Move one step
        if (currDir === 'UP') currR--;
        else if (currDir === 'DOWN') currR++;
        else if (currDir === 'LEFT') currC--;
        else if (currDir === 'RIGHT') currC++;

        // Out of bounds
        if (currR < 0 || currR >= puzzle.rows || currC < 0 || currC >= puzzle.cols) {
          break;
        }

        const cell = newGrid[currR][currC];
        cell.hasLaser = true;
        if (!cell.laserDirections) cell.laserDirections = [];
        cell.laserDirections.push(currDir); // Enter direction

        if (cell.type === 'TARGET') {
          targetHit = true;
          break;
        } else if (cell.type === 'MIRROR') {
          // Reflect
          if (cell.mirrorType === 'FORWARD') { // /
            if (currDir === 'RIGHT') currDir = 'UP';
            else if (currDir === 'DOWN') currDir = 'LEFT';
            else if (currDir === 'LEFT') currDir = 'DOWN';
            else if (currDir === 'UP') currDir = 'RIGHT';
          } else { // \
            if (currDir === 'RIGHT') currDir = 'DOWN';
            else if (currDir === 'DOWN') currDir = 'RIGHT';
            else if (currDir === 'LEFT') currDir = 'UP';
            else if (currDir === 'UP') currDir = 'LEFT';
          }
          cell.laserDirections.push(currDir); // Exit direction
        } else if (cell.type === 'EMITTER') {
          // Blocked by emitter
          break;
        }
      }
    }

    setGrid(newGrid);

    // If target hit, trigger complete
    if (targetHit && !isPaused && puzzle) {
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  }, [puzzle, grid.map(r => r.map(c => c.mirrorType).join(',')).join('|')]);

  const selectCell = useCallback((r: number, c: number) => {
    if (!puzzle || isPaused) return;

    if (grid[r][c].type === 'MIRROR') {
      const newGrid = [...grid];
      newGrid[r][c].mirrorType = newGrid[r][c].mirrorType === 'FORWARD' ? 'BACKWARD' : 'FORWARD';
      setGrid(newGrid);
      
      const newMoves = moves + 1;
      setMoves(newMoves);
      onMovesUpdate(newMoves);
    }
  }, [grid, puzzle, isPaused, moves, onMovesUpdate]);

  return {
    grid,
    selectCell
  };
};
