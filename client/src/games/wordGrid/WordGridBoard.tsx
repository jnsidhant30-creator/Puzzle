import React, { useRef, useCallback } from 'react';
import type { WordGridPuzzle, WordLocation } from './types';
import { cn } from '../../utils/cn';

interface WordGridBoardProps {
  puzzle: WordGridPuzzle | null;
  words: WordLocation[];
  selectionPath: {r: number, c: number}[];
  onPointerDown: (r: number, c: number) => void;
  onPointerMove: (r: number, c: number) => void;
  onPointerUp: () => void;
  isPaused: boolean;
  hintWord?: string;
}

export const WordGridBoard: React.FC<WordGridBoardProps> = ({ 
  puzzle, 
  words, 
  selectionPath,
  onPointerDown, 
  onPointerMove, 
  onPointerUp,
  isPaused,
  hintWord
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const getCellFromEvent = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!gridRef.current || !puzzle) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x < 0 || x >= rect.width || y < 0 || y >= rect.height) return null;
    
    const c = Math.floor((x / rect.width) * puzzle.cols);
    const r = Math.floor((y / rect.height) * puzzle.rows);
    
    return { r, c };
  }, [puzzle]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPaused) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId); // Allows pointer enter/move on other elements!
    const cell = getCellFromEvent(e);
    if (cell) onPointerDown(cell.r, cell.c);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPaused) return;
    // With releasePointerCapture, standard PointerEvent still fires on the container.
    // However, touch devices might still need touchmove. But standard pointer-events work well if touch-action is none.
    const cell = getCellFromEvent(e);
    if (cell) onPointerMove(cell.r, cell.c);
  };

  if (!puzzle) return null;

  // Build a map of found cells for highlighting
  const foundCells = new Set<string>();
  words.filter(w => w.found).forEach(w => {
    for (let i = 0; i < w.word.length; i++) {
      foundCells.add(`${w.r + w.dr * i}-${w.c + w.dc * i}`);
    }
  });
  
  // Find hint cells
  const hintCells = new Set<string>();
  if (hintWord) {
    const hw = words.find(w => w.word === hintWord);
    if (hw && !hw.found) {
      hintCells.add(`${hw.r}-${hw.c}`);
    }
  }

  return (
    <div 
      ref={gridRef}
      role="button" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); const ev = new PointerEvent('pointerdown', { bubbles: true, cancelable: true }); e.currentTarget.dispatchEvent(ev); } }} onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className="w-full max-w-[500px] aspect-square mx-auto bg-slate-100 rounded-lg p-2 grid gap-[2px] md:gap-1 shadow-xl border-4 border-slate-300 select-none touch-none cursor-crosshair"
      style={{
        gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
        gridTemplateRows: `repeat(${puzzle.rows}, 1fr)` 
      }}
    >
      {puzzle.grid.map((row, r) => 
        row.map((char, c) => {
          const isFound = foundCells.has(`${r}-${c}`);
          const isSelected = selectionPath.some(p => p.r === r && p.c === c);
          const isHinted = hintCells.has(`${r}-${c}`);
          
          return (
            <div
              key={`${r}-${c}`}
              className={cn(
                "w-full h-full rounded-sm md:rounded-md flex items-center justify-center text-sm md:text-xl font-bold transition-colors duration-150",
                "bg-white text-slate-800",
                isFound && "bg-green-100 text-green-800 ring-1 ring-green-300",
                isSelected && "bg-blue-200 text-blue-900 ring-2 ring-blue-500 scale-105 z-10",
                isHinted && "animate-pulse bg-yellow-200 ring-2 ring-yellow-400"
              )}
            >
              {char}
            </div>
          );
        })
      )}
    </div>
  );
};
