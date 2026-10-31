import React from 'react';
import type { NumberPathPuzzle } from './types';
import { cn } from '../../utils/cn';

interface NumberPathBoardProps {
  puzzle: NumberPathPuzzle | null;
  path: {r: number, c: number}[];
  currentR: number;
  currentC: number;
  onSelect: (r: number, c: number) => void;
  isPaused: boolean;
  hintNextVal?: number;
}

export const NumberPathBoard: React.FC<NumberPathBoardProps> = ({ 
  puzzle, 
  path, 
  currentR, 
  currentC, 
  onSelect, 
  isPaused,
  hintNextVal
}) => {
  if (!puzzle) return null;

  return (
    <div 
      className="w-full max-w-[400px] aspect-square mx-auto bg-gray-800 rounded-lg p-2 grid gap-1 shadow-xl border-4 border-gray-900 select-none touch-none"
      style={{
        gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
        gridTemplateRows: `repeat(${puzzle.rows}, 1fr)` 
      }}
    >
      {puzzle.grid.map((row, r) => 
        row.map((cell, c) => {
          const isVisited = path.some(p => p.r === r && p.c === c);
          const isCurrent = currentR === r && currentC === c;
          const isHinted = hintNextVal !== undefined && (
            (hintNextVal < puzzle.pathLength - 1 && (cell.type === 'NUMBER' || cell.type === 'DECOY') && cell.value === hintNextVal) ||
            (hintNextVal === puzzle.pathLength - 1 && cell.type === 'TARGET')
          );
          
          return (
            <button
              key={`${r}-${c}`}
              onClick={() => onSelect(r, c)}
              disabled={isPaused}
              className={cn(
                "w-full h-full rounded-md flex flex-col items-center justify-center text-sm md:text-base font-bold transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 relative",
                // Base colors based on cell type
                cell.type === 'EMPTY' && "bg-gray-700 border-gray-900 text-transparent",
                cell.type === 'BLOCKER' && "bg-gray-900 border-black text-gray-700 pointer-events-none",
                (cell.type === 'NUMBER' || cell.type === 'DECOY') && "bg-slate-200 border-slate-400 text-slate-700 hover:bg-slate-100",
                cell.type === 'START' && "bg-green-500 border-green-700 text-white",
                cell.type === 'TARGET' && "bg-red-500 border-red-700 text-white",
                
                // Visited states
                isVisited && cell.type !== 'START' && cell.type !== 'TARGET' && "bg-blue-500 border-blue-700 text-white",
                
                // Current position pulse
                isCurrent && "ring-2 ring-white ring-offset-2 ring-offset-gray-800",
                
                // Hint state
                isHinted && "animate-pulse ring-2 ring-yellow-400"
              )}
            >
              {cell.type === 'START' && 'START'}
              {cell.type === 'TARGET' && 'END'}
              {(cell.type === 'NUMBER' || cell.type === 'DECOY') && cell.value}
              {cell.type === 'BLOCKER' && 'X'}
            </button>
          );
        })
      )}
    </div>
  );
};
