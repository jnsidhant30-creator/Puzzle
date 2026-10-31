import type { MazePuzzle, MazeCell } from './types';
import { setSeed, seededRandom, shuffleArray } from '../../utils/random';
import type { Difficulty } from '../core/types';

const getBoardSize = (difficulty: Difficulty) => {
  // Sizes must be odd for standard recursive backtracker maze on a grid
  switch (difficulty) {
    case 'EASY': return { rows: 9, cols: 9 };
    case 'MEDIUM': return { rows: 15, cols: 15 };
    case 'HARD': return { rows: 21, cols: 21 };
    case 'EXPERT': return { rows: 27, cols: 27 };
    default: return { rows: 15, cols: 15 };
  }
};

export const generateMazePuzzle = (difficulty: Difficulty, seed: number): MazePuzzle => {
  setSeed(seed);
  const { rows, cols } = getBoardSize(difficulty);

  const grid: MazeCell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r, c, type: 'WALL' as const
    }))
  );

  const start = { r: 1, c: 1 };
  const exit = { r: rows - 2, c: cols - 2 };

  // Recursive backtracking to generate perfect maze
  const stack: { r: number; c: number }[] = [];
  grid[start.r][start.c].type = 'PATH';
  stack.push(start);

  const dirs = [
    { dr: -2, dc: 0 },
    { dr: 2, dc: 0 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: 2 }
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    
    const unvisited = dirs.map(d => ({
      r: current.r + d.dr,
      c: current.c + d.dc,
      dr: d.dr,
      dc: d.dc
    })).filter(n => 
      n.r > 0 && n.r < rows - 1 && 
      n.c > 0 && n.c < cols - 1 && 
      grid[n.r][n.c].type === 'WALL'
    );

    if (unvisited.length > 0) {
      const neighbors = shuffleArray(unvisited);
      const next = neighbors[0];
      
      grid[current.r + next.dr / 2][current.c + next.dc / 2].type = 'PATH';
      grid[next.r][next.c].type = 'PATH';
      
      stack.push({ r: next.r, c: next.c });
    } else {
      stack.pop();
    }
  }

  // Braiding (removing dead ends) for HARD and EXPERT
  if (difficulty === 'HARD' || difficulty === 'EXPERT') {
    const braidChance = difficulty === 'HARD' ? 0.3 : 0.6;
    for (let r = 1; r < rows - 1; r += 2) {
      for (let c = 1; c < cols - 1; c += 2) {
        if ((r !== start.r || c !== start.c) && (r !== exit.r || c !== exit.c) && grid[r][c].type === 'PATH') {
          // Count walls
          let wallCount = 0;
          const adj = [
            { r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }
          ];
          adj.forEach(a => {
            if (grid[a.r][a.c].type === 'WALL') wallCount++;
          });
          
          if (wallCount === 3 && seededRandom() < braidChance) {
            // It's a dead end. Pick a random wall to knock down that leads to another path (or just a wall that isn't the outer boundary)
            const validWalls = adj.filter(a => a.r > 0 && a.r < rows - 1 && a.c > 0 && a.c < cols - 1 && grid[a.r][a.c].type === 'WALL');
            if (validWalls.length > 0) {
              const wallToBreak = validWalls[Math.floor(seededRandom() * validWalls.length)];
              grid[wallToBreak.r][wallToBreak.c].type = 'PATH';
            }
          }
        }
      }
    }
  }

  // Pick start and exit (randomize slightly on harder difficulties)
  let finalStart = start;
  let finalExit = exit;

  if (difficulty === 'EXPERT') {
    // Top or left edge for start, bottom or right for exit
    const startCandidates = [];
    const exitCandidates = [];
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c].type === 'PATH') {
          if (r === 1 || c === 1) startCandidates.push({r, c});
          if (r === rows - 2 || c === cols - 2) exitCandidates.push({r, c});
        }
      }
    }
    if (startCandidates.length > 0) finalStart = startCandidates[Math.floor(seededRandom() * startCandidates.length)];
    if (exitCandidates.length > 0) finalExit = exitCandidates[Math.floor(seededRandom() * exitCandidates.length)];
  }

  grid[finalStart.r][finalStart.c].type = 'START';
  grid[finalExit.r][finalExit.c].type = 'EXIT';

  return { grid, rows, cols, start: finalStart, exit: finalExit };
};
