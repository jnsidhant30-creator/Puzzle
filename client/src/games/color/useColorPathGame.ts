import { useState, useCallback, useEffect } from 'react';
import type { ColorPathPuzzle, CellModel, ColorId } from './types';

export const useColorPathGame = (
  puzzle: ColorPathPuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onPairsMatched: (matched: number) => void,
  onComplete: () => void
) => {
  const [grid, setGrid] = useState<CellModel[][]>([]);
  const [activeColorId, setActiveColorId] = useState<ColorId | null>(null);
  const [completedPairs, setCompletedPairs] = useState<Set<ColorId>>(new Set());
  const [moves, setMoves] = useState(0);

  // Initialize grid
  useEffect(() => {
    if (puzzle) {
      setGrid(puzzle.grid.map(row => row.map(cell => ({ ...cell, connectedTo: { up: false, down: false, left: false, right: false } }))));
      setCompletedPairs(new Set());
      setMoves(0);
      onMovesUpdate(0);
      onPairsMatched(0);
    }
  }, [puzzle]); // Intentionally omitting callbacks to prevent re-renders

  const updateConnections = (g: CellModel[][], colorId: ColorId) => {
    const cells: CellModel[] = [];
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c].colorId === colorId) {
          cells.push(g[r][c]);
        }
      }
    }
    cells.forEach(c => { c.connectedTo = { up: false, down: false, left: false, right: false }; });
    cells.forEach(c => {
      const { r, c: col } = c;
      if (r > 0 && g[r-1][col].colorId === colorId) c.connectedTo.up = true;
      if (r < g.length - 1 && g[r+1][col].colorId === colorId) c.connectedTo.down = true;
      if (col > 0 && g[r][col-1].colorId === colorId) c.connectedTo.left = true;
      if (col < g[r].length - 1 && g[r][col+1].colorId === colorId) c.connectedTo.right = true;
    });
  };

  const handleStartDraw = useCallback((r: number, c: number) => {
    if (isPaused) return;
    const cell = grid[r][c];
    
    if (cell.state === 'endpoint' || cell.state === 'path') {
      const cid = cell.colorId;
      if (cid !== null) {
        setActiveColorId(cid);
        if (cell.state === 'endpoint') {
          const newGrid = [...grid];
          for (let i = 0; i < newGrid.length; i++) {
            newGrid[i] = [...newGrid[i]];
            for (let j = 0; j < newGrid[i].length; j++) {
              if (newGrid[i][j].state === 'path' && newGrid[i][j].colorId === cid) {
                newGrid[i][j].state = 'empty' as any;
                newGrid[i][j].colorId = null;
                newGrid[i][j].connectedTo = { up: false, down: false, left: false, right: false };
              }
            }
          }
          const newCompleted = new Set(completedPairs);
          newCompleted.delete(cid);
          setCompletedPairs(newCompleted);
          updateConnections(newGrid, cid);
          setGrid(newGrid);
          onPairsMatched(newCompleted.size);
        }
      }
    }
  }, [grid, isPaused, completedPairs, onPairsMatched]);

  const handleDraw = useCallback((r: number, c: number) => {
    if (isPaused || activeColorId === null) return;
    
    const cell = grid[r][c];
    const newGrid = [...grid];
    newGrid[r] = [...newGrid[r]];
    let madeChange = false;
    
    if (cell.state === 'empty') {
      const isAdjacent = (ar: number, ac: number) => Math.abs(ar - r) + Math.abs(ac - c) === 1;
      let headPos = null;
      for (let ir = 0; ir < newGrid.length; ir++) {
        for (let ic = 0; ic < newGrid[ir].length; ic++) {
          if (newGrid[ir][ic].colorId === activeColorId && isAdjacent(ir, ic)) {
             const conn = newGrid[ir][ic].connectedTo;
             const numConn = (conn.up?1:0) + (conn.down?1:0) + (conn.left?1:0) + (conn.right?1:0);
             if (newGrid[ir][ic].state === 'endpoint' && numConn === 0) {
                 headPos = {r: ir, c: ic};
             } else if (newGrid[ir][ic].state === 'path' && numConn <= 1) {
                 headPos = {r: ir, c: ic};
             }
          }
        }
      }
      
      if (headPos) {
        newGrid[r][c] = { ...cell, state: 'path' as any, colorId: activeColorId };
        madeChange = true;
      }
    } else if (cell.state === 'endpoint' && cell.colorId === activeColorId) {
      const isAdjacent = (ar: number, ac: number) => Math.abs(ar - r) + Math.abs(ac - c) === 1;
      let headPos = null;
      for (let ir = 0; ir < newGrid.length; ir++) {
        for (let ic = 0; ic < newGrid[ir].length; ic++) {
          if (newGrid[ir][ic].colorId === activeColorId && isAdjacent(ir, ic)) {
             const conn = newGrid[ir][ic].connectedTo;
             const numConn = (conn.up?1:0) + (conn.down?1:0) + (conn.left?1:0) + (conn.right?1:0);
             if (newGrid[ir][ic].state === 'endpoint' && numConn === 0) {
                 headPos = {r: ir, c: ic};
             } else if (newGrid[ir][ic].state === 'path' && numConn <= 1) {
                 headPos = {r: ir, c: ic};
             }
          }
        }
      }
      
      if (headPos && !completedPairs.has(activeColorId)) {
        const newCompleted = new Set(completedPairs);
        newCompleted.add(activeColorId);
        setCompletedPairs(newCompleted);
        setActiveColorId(null);
        madeChange = true;
        onPairsMatched(newCompleted.size);
        const newMoves = moves + 1;
        setMoves(newMoves);
        onMovesUpdate(newMoves);
      }
    }
    
    if (madeChange) {
      updateConnections(newGrid, activeColorId);
      setGrid(newGrid);
    }
    
  }, [grid, activeColorId, isPaused, completedPairs, moves, onPairsMatched, onMovesUpdate]);

  const handleEndDraw = useCallback(() => {
    if (activeColorId !== null) {
      setActiveColorId(null);
      const newMoves = moves + 1;
      setMoves(newMoves);
      onMovesUpdate(newMoves);
    }
  }, [activeColorId, moves, onMovesUpdate]);

  useEffect(() => {
    if (puzzle && completedPairs.size === puzzle.pairs.length && !isPaused) {
      onComplete();
    }
  }, [completedPairs, puzzle, isPaused, onComplete]);

  return {
    grid,
    handleStartDraw,
    handleDraw,
    handleEndDraw,
    completedPairs
  };
};
