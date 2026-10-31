import type { RotatingTilesPuzzle } from './types';
import type { Difficulty } from '../core/types';
import { PipeType, type PipeTileData, type PipeConnections } from '../pipe/types';
import { seededRandom } from '../../utils/random';

const getDifficultyConfig = (diff: Difficulty | string) => {
  switch (diff) {
    case 'EASY': return { rows: 4, cols: 4, lockLeaves: true };
    case 'MEDIUM': return { rows: 6, cols: 6, lockLeaves: false };
    case 'HARD': return { rows: 8, cols: 8, lockLeaves: false, lockRandom: 0.1 };
    case 'EXPERT': return { rows: 10, cols: 10, lockLeaves: false, lockRandom: 0.2 };
    default: return { rows: 4, cols: 4, lockLeaves: true };
  }
};

const determinePipeType = (conn: PipeConnections): { type: PipeType, rotation: number } => {
  const count = (conn.up ? 1 : 0) + (conn.right ? 1 : 0) + (conn.down ? 1 : 0) + (conn.left ? 1 : 0);
  
  if (count === 4) return { type: PipeType.CROSS, rotation: 0 };
  
  if (count === 3) {
    if (!conn.up) return { type: PipeType.T_JUNCTION, rotation: 180 };
    if (!conn.right) return { type: PipeType.T_JUNCTION, rotation: 270 };
    if (!conn.down) return { type: PipeType.T_JUNCTION, rotation: 0 };
    if (!conn.left) return { type: PipeType.T_JUNCTION, rotation: 90 };
  }
  
  if (count === 2) {
    if (conn.up && conn.down) return { type: PipeType.STRAIGHT, rotation: 0 };
    if (conn.left && conn.right) return { type: PipeType.STRAIGHT, rotation: 90 };
    
    if (conn.up && conn.right) return { type: PipeType.CORNER, rotation: 0 };
    if (conn.right && conn.down) return { type: PipeType.CORNER, rotation: 90 };
    if (conn.down && conn.left) return { type: PipeType.CORNER, rotation: 180 };
    if (conn.left && conn.up) return { type: PipeType.CORNER, rotation: 270 };
  }
  
  if (count === 1) {
    if (conn.up) return { type: PipeType.TARGET, rotation: 0 };
    if (conn.right) return { type: PipeType.TARGET, rotation: 90 };
    if (conn.down) return { type: PipeType.TARGET, rotation: 180 };
    if (conn.left) return { type: PipeType.TARGET, rotation: 270 };
  }
  
  return { type: PipeType.BLOCKER, rotation: 0 };
};

export const generateRotatingTilesPuzzle = (difficulty: Difficulty | string, seed: number): RotatingTilesPuzzle => {
  const config = getDifficultyConfig(difficulty);
  if (seed === undefined) seed = Date.now();
  
  const { rows, cols } = config;
  
  // 1. Generate a Spanning Tree using Randomized DFS
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const horizontalEdges = Array(rows).fill(null).map(() => Array(cols - 1).fill(false)); // true if connected
  const verticalEdges = Array(rows - 1).fill(null).map(() => Array(cols).fill(false));
  
  const stack: [number, number][] = [];
  const startR = Math.floor(seededRandom() * rows);
  const startC = Math.floor(seededRandom() * cols);
  
  visited[startR][startC] = true;
  stack.push([startR, startC]);
  
  while (stack.length > 0) {
    const currIdx = Math.floor(seededRandom() * stack.length);
    const [r, c] = stack[currIdx];
    
    // Find unvisited neighbors
    const neighbors: {r: number, c: number, dir: string}[] = [];
    if (r > 0 && !visited[r-1][c]) neighbors.push({r: r-1, c, dir: 'up'});
    if (r < rows - 1 && !visited[r+1][c]) neighbors.push({r: r+1, c, dir: 'down'});
    if (c > 0 && !visited[r][c-1]) neighbors.push({r, c: c-1, dir: 'left'});
    if (c < cols - 1 && !visited[r][c+1]) neighbors.push({r, c: c+1, dir: 'right'});
    
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(seededRandom() * neighbors.length)];
      visited[next.r][next.c] = true;
      stack.push([next.r, next.c]);
      
      if (next.dir === 'up') verticalEdges[next.r][c] = true;
      if (next.dir === 'down') verticalEdges[r][c] = true;
      if (next.dir === 'left') horizontalEdges[r][next.c] = true;
      if (next.dir === 'right') horizontalEdges[r][c] = true;
    } else {
      // Remove from stack if no unvisited neighbors
      stack.splice(currIdx, 1);
    }
  }

  // Add random loops for higher difficulties to make it a network instead of just a tree
  if (config.rows >= 6) {
    const numLoops = Math.floor(rows * cols * 0.1);
    for (let i = 0; i < numLoops; i++) {
      if (seededRandom() > 0.5) {
        const r = Math.floor(seededRandom() * rows);
        const c = Math.floor(seededRandom() * (cols - 1));
        horizontalEdges[r][c] = true;
      } else {
        const r = Math.floor(seededRandom() * (rows - 1));
        const c = Math.floor(seededRandom() * cols);
        verticalEdges[r][c] = true;
      }
    }
  }
  
  // 2. Build Tiles
  const tiles: PipeTileData[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const conn: PipeConnections = {
        up: r > 0 ? verticalEdges[r-1][c] : false,
        down: r < rows - 1 ? verticalEdges[r][c] : false,
        left: c > 0 ? horizontalEdges[r][c-1] : false,
        right: c < cols - 1 ? horizontalEdges[r][c] : false,
      };
      
      const { type, rotation } = determinePipeType(conn);
      
      let locked = false;
      const count = (conn.up?1:0) + (conn.right?1:0) + (conn.down?1:0) + (conn.left?1:0);
      
      if (count === 1 && config.lockLeaves) locked = true;
      if (config.lockRandom && seededRandom() < config.lockRandom) locked = true;
      if (type === PipeType.CROSS) locked = true; // CROSS looks the same regardless of rotation in most graphics
      
      // Randomize rotation if not locked
      let finalRotation = rotation;
      if (!locked) {
        const shifts = Math.floor(seededRandom() * 4);
        finalRotation = (rotation + shifts * 90) % 360;
      }
      
      if (count === 1 && r === startR && c === startC) {
        // Change one leaf to SOURCE
        tiles[r][c] = { row: r, col: c, type: PipeType.SOURCE, rotation: finalRotation, connections: conn, locked };
      } else {
        tiles[r][c] = { row: r, col: c, type, rotation: finalRotation, connections: conn, locked };
      }
    }
  }

  // Find a source if none assigned (fallback if start node wasn't a leaf)
  let hasSource = false;
  for (let r=0; r<rows; r++) {
    for(let c=0; c<cols; c++) {
      if (tiles[r][c].type === PipeType.SOURCE) hasSource = true;
    }
  }
  if (!hasSource) {
     tiles[0][0].type = PipeType.SOURCE;
  }

  return {
    id: 'rotate_' + Math.floor(seededRandom() * 1000000),
    rows,
    cols,
    tiles,
    difficulty: `${rows}x${cols}`
  };
};
