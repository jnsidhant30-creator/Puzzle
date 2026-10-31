import type { ColorPathPuzzle, CellModel, ColorPair, Position, CellState } from './types';
import type { Difficulty } from '../core/types';
import { seededRandom, setSeed } from '../../utils/random';

const COLORS = [
  { id: 0, color: 'bg-red-500', label: 'Red' },
  { id: 1, color: 'bg-blue-500', label: 'Blue' },
  { id: 2, color: 'bg-green-500', label: 'Green' },
  { id: 3, color: 'bg-yellow-500', label: 'Yellow' },
  { id: 4, color: 'bg-purple-500', label: 'Purple' },
  { id: 5, color: 'bg-orange-500', label: 'Orange' },
  { id: 6, color: 'bg-pink-500', label: 'Pink' },
  { id: 7, color: 'bg-cyan-500', label: 'Cyan' },
  { id: 8, color: 'bg-indigo-500', label: 'Indigo' },
  { id: 9, color: 'bg-teal-500', label: 'Teal' },
];

interface GenConfig {
  rows: number;
  cols: number;
  pairs: number;
  minPathLen: number;
  maxPathLen: number;
  blockers: number;
}

const getDifficultyConfig = (difficulty: Difficulty | string): GenConfig => {
  switch (difficulty) {
    case 'EASY':
      return { rows: 5, cols: 5, pairs: 3, minPathLen: 4, maxPathLen: 10, blockers: 0 };
    case 'MEDIUM':
      return { rows: 6, cols: 6, pairs: 4, minPathLen: 5, maxPathLen: 12, blockers: 1 };
    case 'HARD':
      return { rows: 7, cols: 7, pairs: 5, minPathLen: 7, maxPathLen: 16, blockers: 2 };
    case 'EXPERT':
      return { rows: 8, cols: 8, pairs: 6, minPathLen: 8, maxPathLen: 24, blockers: 3 };
    default:
      return { rows: 5, cols: 5, pairs: 3, minPathLen: 4, maxPathLen: 10, blockers: 0 };
  }
};

const getAdjacent = (r: number, c: number, rows: number, cols: number): Position[] => {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const adj: Position[] = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      adj.push({ r: nr, c: nc });
    }
  }
  return adj;
};

const attemptGeneration = (config: GenConfig): ColorPathPuzzle | null => {
  const { rows, cols, pairs, minPathLen, maxPathLen, blockers } = config;
  
  // Need to seed based on original seed + attempt
  // Since seededRandom doesn't take seed directly after init, we rely on the sequence.
  // We'll use a local seeded function or just rely on the global seededRandom sequence.
  
  const grid: CellModel[][] = Array(rows).fill(null).map((_, r) => 
    Array(cols).fill(null).map((_, c) => ({
      r, c, state: 'empty' as CellState, colorId: null,
      connectedTo: { up: false, down: false, left: false, right: false }
    }))
  );

  const solution: Position[][] = [];
  const colorPairs: ColorPair[] = [];
  
  // Pick blockers
  let blockersPlaced = 0;
  let blockerAttempts = 0;
  while (blockersPlaced < blockers && blockerAttempts < 50) {
    blockerAttempts++;
    const r = Math.floor(seededRandom() * rows);
    const c = Math.floor(seededRandom() * cols);
    if (grid[r][c].state === 'empty') {
      grid[r][c].state = 'blocked';
      blockersPlaced++;
    }
  }

  // Generate paths
  for (let i = 0; i < pairs; i++) {
    let pathGenerated = false;
    let pathAttempts = 0;
    
    while (!pathGenerated && pathAttempts < 20) {
      pathAttempts++;
      
      // Find empty start
      const emptyCells: Position[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].state === 'empty') emptyCells.push({ r, c });
        }
      }
      
      if (emptyCells.length === 0) break;
      
      const start = emptyCells[Math.floor(seededRandom() * emptyCells.length)];
      const path: Position[] = [start];
      
      // We will mark the grid temporarily to prevent self-intersection
      const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
      tempGrid[start.r][start.c].state = 'path';
      tempGrid[start.r][start.c].colorId = i;
      
      let curr = start;
      const targetLen = minPathLen + Math.floor(seededRandom() * (maxPathLen - minPathLen + 1));
      
      let stuck = false;
      while (path.length < targetLen && !stuck) {
        const adj = getAdjacent(curr.r, curr.c, rows, cols);
        // Valid neighbors are empty
        const valid = adj.filter(p => tempGrid[p.r][p.c].state === 'empty');
        if (valid.length === 0) {
          stuck = true;
        } else {
          // Shuffle valid
          for (let k = valid.length - 1; k > 0; k--) {
            const j = Math.floor(seededRandom() * (k + 1));
            [valid[k], valid[j]] = [valid[j], valid[k]];
          }
          const next = valid[0];
          path.push(next);
          tempGrid[next.r][next.c].state = 'path';
          tempGrid[next.r][next.c].colorId = i;
          curr = next;
        }
      }
      
      if (path.length >= minPathLen) {
        // Success! Commit to real grid
        for (const p of path) {
          grid[p.r][p.c].state = 'path';
          grid[p.r][p.c].colorId = i;
        }
        grid[path[0].r][path[0].c].state = 'endpoint';
        grid[path[path.length - 1].r][path[path.length - 1].c].state = 'endpoint';
        
        const cInfo = COLORS[i % COLORS.length];
        colorPairs.push({
          colorId: i,
          displayColor: cInfo.color,
          label: cInfo.label,
          start: path[0],
          target: path[path.length - 1]
        });
        solution.push(path);
        pathGenerated = true;
      }
    }
    
    if (!pathGenerated) {
      // Failed to generate all pairs, need to abort this generation attempt
      return null;
    }
  }

  // Clear 'path' states so it's a puzzle for the user, but keep 'endpoint' and 'blocked'
  const puzzleGrid = grid.map(row => row.map(cell => {
    if (cell.state === 'path') {
      return { ...cell, state: 'empty' as CellState, colorId: null };
    }
    return { ...cell };
  }));

  return {
    rows,
    cols,
    grid: puzzleGrid,
    pairs: colorPairs,
    solution,
    difficulty: config.rows + 'x' + config.cols // just a string
  };
};

export const generateColorPathPuzzle = (difficulty: Difficulty | string, seed: number): ColorPathPuzzle => {
  setSeed(seed);
  const config = getDifficultyConfig(difficulty);
  
  // Try up to 50 times to generate a valid puzzle
  for (let i = 0; i < 50; i++) {
    const puzzle = attemptGeneration(config);
    if (puzzle) {
      return puzzle;
    }
  }
  
  // Fallback: trivial puzzle if all generation fails
  console.warn("Failed to generate complex Color Path puzzle, using fallback.");
  const fbGrid: CellModel[][] = Array(config.rows).fill(null).map((_, r) => 
    Array(config.cols).fill(null).map((_, c) => ({
      r, c, state: 'empty' as CellState, colorId: null,
      connectedTo: { up: false, down: false, left: false, right: false }
    }))
  );
  
  fbGrid[0][0] = { ...fbGrid[0][0], state: 'endpoint', colorId: 0 };
  fbGrid[0][1] = { ...fbGrid[0][1], state: 'endpoint', colorId: 0 };
  const fallbackPair = {
    colorId: 0, displayColor: COLORS[0].color, label: COLORS[0].label,
    start: {r:0, c:0}, target: {r:0, c:1}
  };
  
  return {
    rows: config.rows,
    cols: config.cols,
    grid: fbGrid,
    pairs: [fallbackPair],
    solution: [[{r:0,c:0}, {r:0,c:1}]],
    difficulty: difficulty
  };
};
