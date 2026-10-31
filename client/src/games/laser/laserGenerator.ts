import type { LaserPuzzle, LaserCell, Direction, MirrorType } from './types';
import { setSeed, seededRandom } from '../../utils/random';
import type { Difficulty } from '../core/types';

const getBoardSize = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'EASY': return { rows: 5, cols: 5, mirrors: 3, decoys: 0 };
    case 'MEDIUM': return { rows: 7, cols: 7, mirrors: 5, decoys: 2 };
    case 'HARD': return { rows: 9, cols: 9, mirrors: 8, decoys: 5 };
    case 'EXPERT': return { rows: 11, cols: 11, mirrors: 12, decoys: 10 };
    default: return { rows: 7, cols: 7, mirrors: 5, decoys: 0 };
  }
};

export const generateLaserPuzzle = (difficulty: Difficulty, seed: number): LaserPuzzle => {
  setSeed(seed);
  const { rows, cols, mirrors, decoys } = getBoardSize(difficulty);

  let grid: LaserCell[][] = [];
  let emitter = { r: 0, c: 0 };
  let target = { r: 0, c: 0 };
  
  let success = false;
  let attempts = 0;

  while (!success && attempts < 200) {
    attempts++;
    
    grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        r, c, type: 'EMPTY' as const
      }))
    );

    const edge = Math.floor(seededRandom() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let dir: Direction = 'DOWN';
    
    if (edge === 0) {
      emitter = { r: 0, c: Math.floor(seededRandom() * cols) };
      dir = 'DOWN';
    } else if (edge === 1) {
      emitter = { r: Math.floor(seededRandom() * rows), c: cols - 1 };
      dir = 'LEFT';
    } else if (edge === 2) {
      emitter = { r: rows - 1, c: Math.floor(seededRandom() * cols) };
      dir = 'UP';
    } else {
      emitter = { r: Math.floor(seededRandom() * rows), c: 0 };
      dir = 'RIGHT';
    }

    grid[emitter.r][emitter.c] = { r: emitter.r, c: emitter.c, type: 'EMITTER', emitterDirection: dir };

    let currentR = emitter.r;
    let currentC = emitter.c;
    let currentDir = dir;
    let mirrorsPlaced = 0;
    
    let pathValid = true;

    while (mirrorsPlaced < mirrors && pathValid) {
      let maxDist = 0;
      if (currentDir === 'UP') maxDist = currentR;
      if (currentDir === 'DOWN') maxDist = rows - 1 - currentR;
      if (currentDir === 'LEFT') maxDist = currentC;
      if (currentDir === 'RIGHT') maxDist = cols - 1 - currentC;
      
      if (maxDist < 2) {
        pathValid = false;
        break;
      }
      
      const dist = 1 + Math.floor(seededRandom() * (maxDist - 1));
      
      let nextR = currentR;
      let nextC = currentC;
      
      if (currentDir === 'UP') nextR -= dist;
      if (currentDir === 'DOWN') nextR += dist;
      if (currentDir === 'LEFT') nextC -= dist;
      if (currentDir === 'RIGHT') nextC += dist;
      
      if (grid[nextR][nextC].type !== 'EMPTY') {
        pathValid = false;
        break;
      }

      const mirrorTypes: MirrorType[] = ['FORWARD', 'BACKWARD'];
      const mType = mirrorTypes[Math.floor(seededRandom() * 2)];
      
      grid[nextR][nextC] = { r: nextR, c: nextC, type: 'MIRROR', mirrorType: mType };
      mirrorsPlaced++;
      
      let newDir = currentDir;
      if (mType === 'FORWARD') { // /
        if (currentDir === 'RIGHT') newDir = 'UP';
        else if (currentDir === 'DOWN') newDir = 'LEFT';
        else if (currentDir === 'LEFT') newDir = 'DOWN';
        else if (currentDir === 'UP') newDir = 'RIGHT';
      } else { // \
        if (currentDir === 'RIGHT') newDir = 'DOWN';
        else if (currentDir === 'DOWN') newDir = 'RIGHT';
        else if (currentDir === 'LEFT') newDir = 'UP';
        else if (currentDir === 'UP') newDir = 'LEFT';
      }
      
      currentR = nextR;
      currentC = nextC;
      currentDir = newDir;
    }
    
    if (pathValid && mirrorsPlaced === mirrors) {
      let tr = currentR;
      let tc = currentC;
      
      if (currentDir === 'UP') { while(tr > 0 && grid[tr-1][tc].type === 'EMPTY') tr--; }
      if (currentDir === 'DOWN') { while(tr < rows-1 && grid[tr+1][tc].type === 'EMPTY') tr++; }
      if (currentDir === 'LEFT') { while(tc > 0 && grid[tr][tc-1].type === 'EMPTY') tc--; }
      if (currentDir === 'RIGHT') { while(tc < cols-1 && grid[tr][tc+1].type === 'EMPTY') tc++; }
      
      if (tr !== currentR || tc !== currentC) {
        target = { r: tr, c: tc };
        grid[tr][tc] = { r: tr, c: tc, type: 'TARGET' };
        
        // Add decoys
        let decoysPlaced = 0;
        let decoyAttempts = 0;
        while (decoysPlaced < decoys && decoyAttempts < 100) {
          decoyAttempts++;
          const dr = Math.floor(seededRandom() * rows);
          const dc = Math.floor(seededRandom() * cols);
          if (grid[dr][dc].type === 'EMPTY') {
            grid[dr][dc] = { r: dr, c: dc, type: 'MIRROR', mirrorType: seededRandom() > 0.5 ? 'FORWARD' : 'BACKWARD' };
            decoysPlaced++;
          }
        }
        
        // Scramble ALL mirrors (both solution and decoys)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (grid[r][c].type === 'MIRROR') {
              if (seededRandom() > 0.5) {
                grid[r][c].mirrorType = grid[r][c].mirrorType === 'FORWARD' ? 'BACKWARD' : 'FORWARD';
              }
            }
          }
        }
        
        success = true;
      }
    }
  }

  // Fallback
  if (!success) {
    grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        r, c, type: 'EMPTY' as const
      }))
    );
    emitter = { r: 0, c: 0 };
    target = { r: 0, c: cols - 1 };
    grid[0][0] = { r: 0, c: 0, type: 'EMITTER', emitterDirection: 'RIGHT' };
    grid[0][cols-1] = { r: 0, c: cols-1, type: 'TARGET' };
  }

  return { grid, rows, cols, emitter, target };
};
