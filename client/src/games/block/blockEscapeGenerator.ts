import type { BlockEscapePuzzle, BlockModel } from './types';
import type { Difficulty } from '../core/types';
import { seededRandom } from '../../utils/random';

interface GenConfig {
  rows: number;
  cols: number;
  numBlocks: number;
  minDepth: number;
  scrambleSteps: number;
}

const getDifficultyConfig = (diff: Difficulty | string): GenConfig => {
  switch (diff) {
    case 'EASY': return { rows: 6, cols: 6, numBlocks: 6, minDepth: 4, scrambleSteps: 30 };
    case 'MEDIUM': return { rows: 6, cols: 6, numBlocks: 8, minDepth: 8, scrambleSteps: 50 };
    case 'HARD': return { rows: 6, cols: 6, numBlocks: 11, minDepth: 12, scrambleSteps: 80 };
    case 'EXPERT': return { rows: 6, cols: 6, numBlocks: 13, minDepth: 15, scrambleSteps: 120 };
    default: return { rows: 6, cols: 6, numBlocks: 6, minDepth: 4, scrambleSteps: 30 };
  }
};

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
];

// Helper: check if a board state is valid (no overlaps)
const isValidState = (blocks: BlockModel[], rows: number, cols: number): boolean => {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));
  for (const b of blocks) {
    for (let i = 0; i < b.len; i++) {
      const r = b.axis === 'V' ? b.r + i : b.r;
      const c = b.axis === 'H' ? b.c + i : b.c;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false; // out of bounds
      if (grid[r][c]) return false; // overlap
      grid[r][c] = true;
    }
  }
  return true;
};

// Get all valid single-step moves
const getValidMoves = (blocks: BlockModel[], rows: number, cols: number): BlockModel[][] => {
  const moves: BlockModel[][] = [];
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));
  for (const b of blocks) {
    for (let i = 0; i < b.len; i++) {
      const r = b.axis === 'V' ? b.r + i : b.r;
      const c = b.axis === 'H' ? b.c + i : b.c;
      grid[r][c] = true;
    }
  }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // Try -1
    if (b.axis === 'H' && b.c > 0 && !grid[b.r][b.c - 1]) {
      const newBlocks = [...blocks];
      newBlocks[i] = { ...b, c: b.c - 1 };
      moves.push(newBlocks);
    }
    if (b.axis === 'V' && b.r > 0 && !grid[b.r - 1][b.c]) {
      const newBlocks = [...blocks];
      newBlocks[i] = { ...b, r: b.r - 1 };
      moves.push(newBlocks);
    }
    // Try +1
    if (b.axis === 'H' && b.c + b.len < cols && !grid[b.r][b.c + b.len]) {
      const newBlocks = [...blocks];
      newBlocks[i] = { ...b, c: b.c + 1 };
      moves.push(newBlocks);
    }
    if (b.axis === 'V' && b.r + b.len < rows && !grid[b.r + b.len][b.c]) {
      const newBlocks = [...blocks];
      newBlocks[i] = { ...b, r: b.r + 1 };
      moves.push(newBlocks);
    }
  }
  return moves;
};

const solveBFS = (initialBlocks: BlockModel[], rows: number, cols: number, targetId: string, exitR: number, exitC: number, maxDepth: number): number => {
  const serialize = (blocks: BlockModel[]) => blocks.map(b => `${b.id}:${b.r},${b.c}`).join('|');
  const q = [{ blocks: initialBlocks, depth: 0 }];
  const visited = new Set<string>();
  visited.add(serialize(initialBlocks));
  
  let head = 0;
  while (head < q.length) {
    const { blocks, depth } = q[head++];
    if (depth > maxDepth) return -1;
    
    const target = blocks.find(b => b.id === targetId);
    if (!target) return -1;
    if (target.r === exitR && target.c + target.len - 1 === exitC) {
      return depth;
    }
    
    const nextMoves = getValidMoves(blocks, rows, cols);
    for (const nm of nextMoves) {
      const stateStr = serialize(nm);
      if (!visited.has(stateStr)) {
        visited.add(stateStr);
        q.push({ blocks: nm, depth: depth + 1 });
      }
    }
    
    // Safety break to prevent browser crash
    if (visited.size > 8000) return -1;
  }
  return -1;
};

const attemptGeneration = (config: GenConfig): BlockEscapePuzzle | null => {
  const { rows, cols, numBlocks, minDepth, scrambleSteps } = config;
  
  // 1. Place target at solved position
  // Target is usually length 2, horizontal, placed at row 2. Exit is row 2, col: cols - 1.
  const targetR = Math.floor(rows / 2) - 1;
  const exitC = cols - 1;
  const targetLen = 2;
  const targetC = exitC - targetLen + 1; // 5 - 2 + 1 = 4
  
  let currentBlocks: BlockModel[] = [
    { id: 'TARGET', r: targetR, c: targetC, len: targetLen, axis: 'H', isTarget: true, color: 'bg-red-500' }
  ];
  
  // 2. Add random blocks
  let colorIdx = 0;
  for (let i = 0; i < numBlocks * 3; i++) { // try up to 3x times to place blocks
    if (currentBlocks.length >= numBlocks + 1) break;
    
    const axis = seededRandom() > 0.5 ? 'H' : 'V';
    const len = seededRandom() > 0.7 ? 3 : 2;
    const r = Math.floor(seededRandom() * rows);
    const c = Math.floor(seededRandom() * cols);
    
    const newBlock: BlockModel = {
      id: `B_${i}`, r, c, len, axis, isTarget: false, color: COLORS[colorIdx % COLORS.length]
    };
    
    // Ensure the new block is valid and doesn't overlap
    if (isValidState([...currentBlocks, newBlock], rows, cols)) {
      currentBlocks.push(newBlock);
      colorIdx++;
    }
  }
  
  // 3. Scramble backward
  // We just use getValidMoves and randomly pick one for `scrambleSteps`
  let scrambled = [...currentBlocks];
  for (let i = 0; i < scrambleSteps; i++) {
    const possible = getValidMoves(scrambled, rows, cols);
    if (possible.length > 0) {
      scrambled = possible[Math.floor(seededRandom() * possible.length)];
    }
  }
  
  // Ensure target actually moved away from exit
  const target = scrambled.find(b => b.id === 'TARGET');
  if (target && target.c === targetC) return null; // Didn't scramble target enough
  
  // 4. Verify Solvability and calculate minimum depth
  // BFS search
  const depth = solveBFS(scrambled, rows, cols, 'TARGET', targetR, exitC, 35);
  if (depth === -1 || depth < minDepth) {
    return null; // No solution within bounds, or too easy
  }
  
  return {
    id: 'block_' + Math.floor(seededRandom() * 1000000),
    rows, cols,
    exitR: targetR,
    exitC: exitC,
    blocks: scrambled,
    difficulty: config.rows + 'x' + config.cols,
    minMoves: depth
  };
};

export const generateBlockEscapePuzzle = (difficulty: Difficulty | string, seed: number): BlockEscapePuzzle => {
  const config = getDifficultyConfig(difficulty);
  if (seed === undefined) seed = Date.now();
  
  // Try up to 50 times
  for (let i = 0; i < 50; i++) {
    const p = attemptGeneration(config);
    if (p) return p;
  }
  
  // Fallback puzzle (Rush Hour standard easy config)
  console.warn("Using fallback Block Escape puzzle.");
  return {
    id: 'block_fallback',
    rows: 6, cols: 6,
    exitR: 2, exitC: 5,
    difficulty: '6x6',
    minMoves: 8,
    blocks: [
      { id: 'TARGET', r: 2, c: 0, len: 2, axis: 'H', isTarget: true, color: 'bg-red-500' },
      { id: 'B_1', r: 0, c: 0, len: 3, axis: 'H', isTarget: false, color: 'bg-blue-500' },
      { id: 'B_2', r: 1, c: 0, len: 2, axis: 'V', isTarget: false, color: 'bg-green-500' },
      { id: 'B_3', r: 0, c: 5, len: 3, axis: 'V', isTarget: false, color: 'bg-yellow-500' },
      { id: 'B_4', r: 4, c: 4, len: 2, axis: 'H', isTarget: false, color: 'bg-purple-500' }
    ]
  };
};
