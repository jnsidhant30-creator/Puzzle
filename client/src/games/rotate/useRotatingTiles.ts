import { useState, useCallback, useEffect } from 'react';
import type { RotatingTilesPuzzle } from './types';
import { type PipeTileData, rotateConnections } from '../pipe/types';

export const useRotatingTiles = (
  puzzle: RotatingTilesPuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onComplete: () => void
) => {
  const [tiles, setTiles] = useState<PipeTileData[][]>([]);
  const [, setMoves] = useState(0);

  useEffect(() => {
    if (puzzle) {
      setTiles(puzzle.tiles);
      setMoves(0);
      onMovesUpdate(0);
    }
  }, [puzzle]);

  const checkWinCondition = useCallback((currentTiles: PipeTileData[][]) => {
    if (!puzzle) return false;
    const { rows, cols } = puzzle;
    
    let allConnected = true;
    
    // 1. Check for "leaks" or mismatched connections
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = currentTiles[r][c];
        const conn = rotateConnections(t.connections, t.rotation);
        
        if (conn.up) {
          if (r === 0) allConnected = false;
          else {
            const nt = currentTiles[r-1][c];
            const nConn = rotateConnections(nt.connections, nt.rotation);
            if (!nConn.down) allConnected = false;
          }
        }
        if (conn.down) {
          if (r === rows - 1) allConnected = false;
          else {
            const nt = currentTiles[r+1][c];
            const nConn = rotateConnections(nt.connections, nt.rotation);
            if (!nConn.up) allConnected = false;
          }
        }
        if (conn.left) {
          if (c === 0) allConnected = false;
          else {
            const nt = currentTiles[r][c-1];
            const nConn = rotateConnections(nt.connections, nt.rotation);
            if (!nConn.right) allConnected = false;
          }
        }
        if (conn.right) {
          if (c === cols - 1) allConnected = false;
          else {
            const nt = currentTiles[r][c+1];
            const nConn = rotateConnections(nt.connections, nt.rotation);
            if (!nConn.left) allConnected = false;
          }
        }
        
        if (!allConnected) break;
      }
      if (!allConnected) break;
    }
    
    return allConnected;
  }, [puzzle]);

  const rotateTile = useCallback((r: number, c: number) => {
    if (isPaused || !puzzle) return;
    
    setTiles(prev => {
      const t = prev[r][c];
      if (t.locked) return prev;
      
      const next = [...prev];
      next[r] = [...prev[r]];
      next[r][c] = { ...t, rotation: (t.rotation + 90) % 360 };
      
      setMoves(m => {
        const nextMoves = m + 1;
        onMovesUpdate(nextMoves);
        return nextMoves;
      });
      
      if (checkWinCondition(next)) {
        setTimeout(() => onComplete(), 500); // Small delay to let animation finish
      }
      
      return next;
    });
  }, [puzzle, isPaused, checkWinCondition, onMovesUpdate, onComplete]);

  return {
    tiles,
    rotateTile
  };
};
