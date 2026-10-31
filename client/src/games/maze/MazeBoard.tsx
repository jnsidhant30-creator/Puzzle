import { cn } from '../../utils/cn';
import type { MazePuzzle } from './types';
import { Flag, Target, User } from 'lucide-react';

interface MazeBoardProps {
  puzzle: MazePuzzle;
  playerPosition: { r: number; c: number };
  onSelect: (r: number, c: number) => void;
  isPaused: boolean;
}

export const MazeBoard = ({ puzzle, playerPosition, onSelect, isPaused }: MazeBoardProps) => {
  const isPlayer = (r: number, c: number) => {
    return playerPosition.r === r && playerPosition.c === c;
  };

  return (
    <div 
      className="grid gap-px sm:gap-1 select-none bg-border p-1 rounded-lg w-full max-w-[400px] sm:max-w-[600px] mx-auto"
      style={{ 
        gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` 
      }}
    >
      {puzzle.grid.map((row, r) => 
        row.map((cell, c) => {
          const hasPlayer = isPlayer(r, c);
          
          return (
            <div
              key={`${r}-${c}`}
              role="button" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => onSelect(r, c)}
              className={cn(
                "w-full aspect-square flex items-center justify-center transition-all duration-100",
                cell.type === 'WALL' ? "bg-slate-800" : "bg-surface hover:bg-surface/80 cursor-pointer",
                isPaused && "opacity-50 cursor-not-allowed",
                cell.type === 'START' && !hasPlayer && "bg-primary/20",
                cell.type === 'EXIT' && "bg-green-500/20"
              )}
            >
              {hasPlayer && <User className="w-5 h-5 text-primary animate-pulse" />}
              {!hasPlayer && cell.type === 'START' && <Flag className="w-4 h-4 text-primary/50" />}
              {!hasPlayer && cell.type === 'EXIT' && <Target className="w-5 h-5 text-green-500" />}
            </div>
          );
        })
      )}
    </div>
  );
};
