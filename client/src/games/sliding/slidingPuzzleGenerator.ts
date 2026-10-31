import type { Difficulty } from '../core/types';
import { setSeed, seededRandom } from '../../utils/random';

export interface SlidingConfig {
  size: number;
  shuffleMoves: number;
  timeLimit: number;
  maxHints: number;
}

export function getSlidingConfig(difficulty: Difficulty): SlidingConfig {
  switch (difficulty) {
    case 'EASY':
      return { size: 3, shuffleMoves: 40, timeLimit: 300, maxHints: 3 }; 
    case 'MEDIUM':
      return { size: 3, shuffleMoves: 80, timeLimit: 180, maxHints: 2 }; 
    case 'HARD':
      return { size: 4, shuffleMoves: 150, timeLimit: 300, maxHints: 1 };
    case 'EXPERT':
      return { size: 5, shuffleMoves: 300, timeLimit: 400, maxHints: 0 };
  }
}

export function isSolved(board: number[]): boolean {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[board.length - 1] === 0;
}

export function getValidMoves(emptyIndex: number, size: number): number[] {
  const validMoves: number[] = [];
  const row = Math.floor(emptyIndex / size);
  const col = emptyIndex % size;

  if (row > 0) validMoves.push(emptyIndex - size); // Up
  if (row < size - 1) validMoves.push(emptyIndex + size); // Down
  if (col > 0) validMoves.push(emptyIndex - 1); // Left
  if (col < size - 1) validMoves.push(emptyIndex + 1); // Right

  return validMoves;
}

export function generateSolvableBoard(size: number, shuffleMoves: number, seed: number): number[] {
  setSeed(seed);
  const totalTiles = size * size;
  const board = Array.from({ length: totalTiles }, (_, i) => (i === totalTiles - 1 ? 0 : i + 1));
  let emptyIndex = totalTiles - 1;
  let lastMove = -1;

  for (let i = 0; i < shuffleMoves; i++) {
    const validMoves = getValidMoves(emptyIndex, size).filter(m => m !== lastMove);
    const randomMove = validMoves[Math.floor(seededRandom() * validMoves.length)];
    
    // Swap
    board[emptyIndex] = board[randomMove];
    board[randomMove] = 0;
    
    lastMove = emptyIndex; 
    emptyIndex = randomMove;
  }

  // Ensure it's not solved immediately
  if (isSolved(board)) {
    return generateSolvableBoard(size, shuffleMoves, seed + 1);
  }

  return board;
}
