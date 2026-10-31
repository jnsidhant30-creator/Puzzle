import { useState, useCallback, useEffect } from 'react';
import type { WordGridPuzzle, WordLocation } from './types';

export const useWordGrid = (
  puzzle: WordGridPuzzle | null,
  isPaused: boolean,
  onMovesUpdate: (moves: number) => void,
  onComplete: () => void
) => {
  const [words, setWords] = useState<WordLocation[]>([]);
  const [selectionStart, setSelectionStart] = useState<{r: number, c: number} | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{r: number, c: number} | null>(null);
  const [, setMoves] = useState(0);
  
  useEffect(() => {
    if (puzzle) {
      setWords(puzzle.words.map(w => ({ ...w, found: false })));
      setSelectionStart(null);
      setSelectionCurrent(null);
      setMoves(0);
      onMovesUpdate(0);
    }
  }, [puzzle]);

  // Calculate the path from start to current, constraining to 8 directions
  const getSelectionPath = useCallback(() => {
    if (!selectionStart || !selectionCurrent) return [];
    
    const dr = selectionCurrent.r - selectionStart.r;
    const dc = selectionCurrent.c - selectionStart.c;
    
    // Snap to 45 degree angles (horizontal, vertical, diagonal)
    let stepR = 0;
    let stepC = 0;
    
    if (Math.abs(dr) > Math.abs(dc) * 2) {
      stepR = Math.sign(dr);
    } else if (Math.abs(dc) > Math.abs(dr) * 2) {
      stepC = Math.sign(dc);
    } else {
      stepR = Math.sign(dr);
      stepC = Math.sign(dc);
    }
    
    // Number of steps based on the primary axis
    const maxSteps = Math.max(Math.abs(dr), Math.abs(dc));
    
    const path = [];
    for (let i = 0; i <= maxSteps; i++) {
      path.push({
        r: selectionStart.r + i * stepR,
        c: selectionStart.c + i * stepC
      });
    }
    return path;
  }, [selectionStart, selectionCurrent]);

  const handlePointerDown = useCallback((r: number, c: number) => {
    if (isPaused || !puzzle) return;
    setSelectionStart({r, c});
    setSelectionCurrent({r, c});
  }, [isPaused, puzzle]);

  const handlePointerMove = useCallback((r: number, c: number) => {
    if (!selectionStart || isPaused || !puzzle) return;
    setSelectionCurrent({r, c});
  }, [selectionStart, isPaused, puzzle]);

  const handlePointerUp = useCallback(() => {
    if (!selectionStart || !selectionCurrent || isPaused || !puzzle) return;
    
    const path = getSelectionPath();
    if (path.length > 0) {
      // Build the selected string
      let selectedStr = '';
      for (const {r, c} of path) {
        if (r >= 0 && r < puzzle.rows && c >= 0 && c < puzzle.cols) {
          selectedStr += puzzle.grid[r][c];
        }
      }
      
      const reversedStr = selectedStr.split('').reverse().join('');
      
      setWords(prev => {
        const next = [...prev];
        let foundSomething = false;
        
        for (let i = 0; i < next.length; i++) {
          if (!next[i].found) {
            if (next[i].word === selectedStr || next[i].word === reversedStr) {
              next[i] = { ...next[i], found: true };
              foundSomething = true;
            }
          }
        }
        
        if (foundSomething) {
          const allFound = next.every(w => w.found);
          if (allFound) {
            onComplete();
          }
        }
        
        return next;
      });
      
      // Update moves (a drag attempt counts as 1 move)
      setMoves(m => {
        const next = m + 1;
        onMovesUpdate(next);
        return next;
      });
    }
    
    setSelectionStart(null);
    setSelectionCurrent(null);
  }, [selectionStart, selectionCurrent, isPaused, puzzle, getSelectionPath, onComplete, onMovesUpdate]);

  return {
    words,
    selectionStart,
    selectionCurrent,
    selectionPath: getSelectionPath(),
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
