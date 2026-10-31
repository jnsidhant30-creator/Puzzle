import type { ArrowPathPuzzle, ArrowCell, Direction } from './types';
import { setSeed, seededRandom, shuffleArray } from '../../utils/random';
import type { Difficulty } from '../core/types';

const getBoardSize = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'EASY': return { rows: 5, cols: 5 };
    case 'MEDIUM': return { rows: 6, cols: 6 };
    case 'HARD': return { rows: 7, cols: 7 };
    case 'EXPERT': return { rows: 8, cols: 8 };
    default: return { rows: 6, cols: 6 };
  }
};

const DIRS: { d: Direction; dr: number; dc: number }[] = [
  { d: 'UP', dr: -1, dc: 0 },
  { d: 'DOWN', dr: 1, dc: 0 },
  { d: 'LEFT', dr: 0, dc: -1 },
  { d: 'RIGHT', dr: 0, dc: 1 },
];

export const generateArrowPathPuzzle = (difficulty: Difficulty, seed: number): ArrowPathPuzzle => {
  setSeed(seed);
  const { rows, cols } = getBoardSize(difficulty);

  const minPathLen = Math.floor(rows * cols * (difficulty === 'EXPERT' ? 0.6 : difficulty === 'HARD' ? 0.5 : 0.4));

  let grid: ArrowCell[][];
  let path: { r: number; c: number }[];
  let start: { r: number; c: number };
  let target: { r: number; c: number };

  let maxAttempts = 200;
  let success = false;

  while (maxAttempts > 0 && !success) {
    maxAttempts--;
    
    // Initialize empty grid
    grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        r, c, type: 'EMPTY' as const
      }))
    );

    // Pick start and target far apart
    start = { 
      r: Math.floor(seededRandom() * rows), 
      c: Math.floor(seededRandom() * cols) 
    };
    
    do {
      target = { 
        r: Math.floor(seededRandom() * rows), 
        c: Math.floor(seededRandom() * cols) 
      };
    } while (Math.abs(start.r - target.r) + Math.abs(start.c - target.c) < Math.floor(rows/2));

    grid[start.r][start.c].type = 'START';
    grid[target.r][target.c].type = 'TARGET';

    path = [start];
    let current = start;
    let pathFound = false;
    const visited = new Set<string>();
    visited.add(`${start.r},${start.c}`);

    let pathAttempts = 0;
    while (pathAttempts < 150) {
      pathAttempts++;
      if (current.r === target.r && current.c === target.c) {
        pathFound = true;
        break;
      }

      const validNeighbors = DIRS.map(dir => ({
        dir,
        r: current.r + dir.dr,
        c: current.c + dir.dc
      })).filter(n => 
        n.r >= 0 && n.r < rows && 
        n.c >= 0 && n.c < cols && 
        !visited.has(`${n.r},${n.c}`)
      );

      if (validNeighbors.length > 0) {
        // Bias slightly towards wandering
        const neighbors = shuffleArray(validNeighbors);
        const next = neighbors[0];
        
        grid[current.r][current.c].direction = next.dir.d;
        if (current.r !== start.r || current.c !== start.c) {
          grid[current.r][current.c].type = 'ARROW';
        }

        current = { r: next.r, c: next.c };
        path.push(current);
        visited.add(`${current.r},${current.c}`);
      } else {
        break;
      }
    }

    if (pathFound && path.length >= minPathLen) {
      success = true;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].type === 'EMPTY') {
            if (seededRandom() > 0.8) {
              grid[r][c].type = 'HURDLE';
            } else {
              grid[r][c].type = 'ARROW';
              grid[r][c].direction = DIRS[Math.floor(seededRandom() * DIRS.length)].d;
            }
          }
        }
      }
      
      return { grid, rows, cols, start, target, path };
    }
  }

  // Fallback
  grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r, c, type: 'EMPTY' as const
    }))
  );
  
  start = { r: 0, c: 0 };
  target = { r: 0, c: 1 };
  grid[0][0] = { r: 0, c: 0, type: 'START', direction: 'RIGHT' };
  grid[0][1] = { r: 0, c: 1, type: 'TARGET' };
  path = [start, target];
  
  return { grid, rows, cols, start, target, path };
};
