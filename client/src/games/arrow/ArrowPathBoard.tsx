import { cn } from '../../utils/cn';
import type { ArrowPathPuzzle } from './types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Target, Flag } from 'lucide-react';

interface ArrowPathBoardProps {
  puzzle: ArrowPathPuzzle;
  path: { r: number; c: number }[];
  onSelect: (r: number, c: number) => void;
  isPaused: boolean;
}

export const ArrowPathBoard = ({ puzzle, path, onSelect, isPaused }: ArrowPathBoardProps) => {
  const isCellInPath = (r: number, c: number) => {
    return path.some(cell => cell.r === r && cell.c === c);
  };

  const isCellCurrent = (r: number, c: number) => {
    if (path.length === 0) return false;
    const current = path[path.length - 1];
    return current.r === r && current.c === c;
  };

  const renderIcon = (type: string, direction?: string) => {
    if (type === 'START') return <Flag className="w-6 h-6 text-white" />;
    if (type === 'TARGET') return <Target className="w-6 h-6 text-white" />;
    if (type === 'HURDLE') return <div className="w-4 h-4 bg-gray-500 rounded-sm" />;
    
    if (direction === 'UP') return <ArrowUp className="w-5 h-5 text-current" />;
    if (direction === 'DOWN') return <ArrowDown className="w-5 h-5 text-current" />;
    if (direction === 'LEFT') return <ArrowLeft className="w-5 h-5 text-current" />;
    if (direction === 'RIGHT') return <ArrowRight className="w-5 h-5 text-current" />;
    
    return null;
  };

  return (
    <div 
      className="grid gap-2 select-none w-full max-w-[400px] sm:max-w-[500px] mx-auto"
      style={{ 
        gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` 
      }}
    >
      {puzzle.grid.map((row, r) => 
        row.map((cell, c) => {
          const inPath = isCellInPath(r, c);
          const isCurrent = isCellCurrent(r, c);
          
          return (
            <div
              key={`${r}-${c}`}
              role="button" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => onSelect(r, c)}
              className={cn(
                "w-full aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-200 cursor-pointer shadow-sm relative",
                isPaused ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95",
                cell.type === 'HURDLE' 
                  ? "bg-slate-800 border-2 border-slate-700 cursor-not-allowed hover:scale-100" 
                  : inPath 
                    ? "bg-primary border-2 border-primary text-white" 
                    : "bg-surface border-2 border-border text-textMuted hover:border-primary/50",
                isCurrent && "ring-4 ring-primary/30"
              )}
            >
              {renderIcon(cell.type, cell.direction)}
              
              {inPath && path.findIndex(p => p.r === r && p.c === c) > 0 && (
                <div className="absolute top-1 left-1 text-[10px] font-bold opacity-75">
                  {path.findIndex(p => p.r === r && p.c === c)}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
