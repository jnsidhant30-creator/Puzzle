import type { NumberPathPuzzle, NumberPathCell } from './types';
import type { Difficulty } from '../core/types';
import { seededRandom, setSeed } from '../../utils/random';

interface GenConfig {
  rows: number;
  cols: number;
  pathLength: number;
  blockers: number;
  decoys: number;
}

const getConfig = (diff: Difficulty | string): GenConfig => {
  switch (diff) {
    case 'EASY': return { rows: 5, cols: 5, pathLength: 6, blockers: 2, decoys: 3 };
    case 'MEDIUM': return { rows: 6, cols: 6, pathLength: 10, blockers: 5, decoys: 6 };
    case 'HARD': return { rows: 7, cols: 7, pathLength: 15, blockers: 8, decoys: 10 };
    case 'EXPERT': return { rows: 8, cols: 8, pathLength: 22, blockers: 12, decoys: 15 };
    default: return { rows: 5, cols: 5, pathLength: 6, blockers: 2, decoys: 3 };
  }
};

const getNeighbors = (r: number, c: number, rows: number, cols: number) => {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  return dirs.map(([dr,dc]) => [r+dr, c+dc]).filter(([nr,nc]) => nr>=0 && nr<rows && nc>=0 && nc<cols);
};

const generatePath = (
  r: number, 
  c: number, 
  rows: number, 
  cols: number, 
  targetLen: number, 
  visited: boolean[][]
): [number, number][] | null => {
  if (targetLen === 1) return [[r, c]];
  
  const neighbors = getNeighbors(r, c, rows, cols);
  // Shuffle neighbors
  for (let i = neighbors.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
  }

  for (const [nr, nc] of neighbors) {
    if (!visited[nr][nc]) {
      visited[nr][nc] = true;
      const sub = generatePath(nr, nc, rows, cols, targetLen - 1, visited);
      if (sub) {
        return [[r, c], ...sub];
      }
      visited[nr][nc] = false;
    }
  }
  return null;
};

export const generateNumberPathPuzzle = (difficulty: Difficulty | string, seed: number): NumberPathPuzzle => {
  const config = getConfig(difficulty);
  if (seed === undefined) seed = Date.now();
  setSeed(seed);
  
  let attempts = 0;
  let path: [number, number][] | null = null;
  
  while (!path && attempts < 100) {
    const startR = Math.floor(seededRandom() * config.rows);
    const startC = Math.floor(seededRandom() * config.cols);
    const visited = Array(config.rows).fill(null).map(() => Array(config.cols).fill(false));
    visited[startR][startC] = true;
    path = generatePath(startR, startC, config.rows, config.cols, config.pathLength, visited);
    attempts++;
  }

  // Fallback if we fail to generate
  if (!path) {
    path = [];
    for(let i=0; i<config.pathLength; i++) {
      if (i < config.cols) path.push([0, i]);
      else path.push([i - config.cols + 1, config.cols - 1]);
    }
  }

  const grid: NumberPathCell[][] = Array(config.rows).fill(null).map((_, r) => 
    Array(config.cols).fill(null).map((_, c) => ({ r, c, type: 'EMPTY' }))
  );

  // Fill path
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    if (i === 0) grid[r][c] = { r, c, type: 'START' };
    else if (i === path.length - 1) grid[r][c] = { r, c, type: 'TARGET' };
    else grid[r][c] = { r, c, type: 'NUMBER', value: i };
  }

  // Get available empty cells
  const emptyCells: [number, number][] = [];
  for (let r=0; r<config.rows; r++) {
    for (let c=0; c<config.cols; c++) {
      if (grid[r][c].type === 'EMPTY') emptyCells.push([r, c]);
    }
  }

  // Shuffle empty cells
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }

  // Add blockers
  const blockersCount = Math.min(config.blockers, Math.floor(emptyCells.length / 2));
  for (let i = 0; i < blockersCount; i++) {
    const [r, c] = emptyCells.pop()!;
    grid[r][c] = { r, c, type: 'BLOCKER' };
  }

  // Add decoys
  const decoysCount = Math.min(config.decoys, emptyCells.length);
  for (let i = 0; i < decoysCount; i++) {
    const [r, c] = emptyCells.pop()!;
    // Random decoy number from 1 to pathLength - 2
    const decoyVal = Math.floor(seededRandom() * (config.pathLength - 2)) + 1;
    grid[r][c] = { r, c, type: 'DECOY', value: decoyVal };
  }

  return {
    id: 'num_path_' + Math.floor(seededRandom() * 1000000),
    rows: config.rows,
    cols: config.cols,
    start: { r: path[0][0], c: path[0][1] },
    target: { r: path[path.length - 1][0], c: path[path.length - 1][1] },
    pathLength: path.length,
    grid,
    difficulty: config.rows + 'x' + config.cols
  };
};
