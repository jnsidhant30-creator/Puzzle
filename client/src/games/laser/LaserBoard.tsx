import { cn } from '../../utils/cn';
import type { LaserPuzzle, LaserCell } from './types';
import { Target, Zap } from 'lucide-react';

interface LaserBoardProps {
  puzzle: LaserPuzzle;
  grid: LaserCell[][];
  onSelect: (r: number, c: number) => void;
  isPaused: boolean;
}

export const LaserBoard = ({ puzzle, grid, onSelect, isPaused }: LaserBoardProps) => {
  const renderLaserLines = (cell: LaserCell) => {
    if (!cell.hasLaser || !cell.laserDirections) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {cell.laserDirections.includes('UP') && <div className="absolute left-1/2 top-0 bottom-1/2 w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -translate-x-1/2" />}
        {cell.laserDirections.includes('DOWN') && <div className="absolute left-1/2 top-1/2 bottom-0 w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -translate-x-1/2" />}
        {cell.laserDirections.includes('LEFT') && <div className="absolute top-1/2 left-0 right-1/2 h-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -translate-y-1/2" />}
        {cell.laserDirections.includes('RIGHT') && <div className="absolute top-1/2 left-1/2 right-0 h-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -translate-y-1/2" />}
        
        {/* Center dot if multiple directions or corner */}
        {cell.laserDirections.length > 0 && cell.type !== 'EMITTER' && cell.type !== 'TARGET' && (
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] rounded-full -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
    );
  };

  return (
    <div 
      className="grid gap-1 select-none p-2 bg-slate-900 rounded-xl w-full max-w-[400px] sm:max-w-[500px] mx-auto"
      style={{ 
        gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` 
      }}
    >
      {(grid.length > 0 ? grid : puzzle.grid).map((row, r) => 
        row.map((cell, c) => {
          return (
            <div
              key={`${r}-${c}`}
              role="button" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => onSelect(r, c)}
              className={cn(
                "aspect-square w-full flex items-center justify-center transition-all duration-200 relative",
                cell.type === 'MIRROR' && "cursor-pointer hover:bg-slate-800 rounded-md border border-slate-700",
                cell.type === 'TARGET' && "bg-slate-800 rounded-md",
                cell.type === 'EMITTER' && "bg-slate-800 rounded-md",
                isPaused && "opacity-50 cursor-not-allowed"
              )}
            >
              {renderLaserLines(cell)}
              
              {cell.type === 'EMITTER' && (
                <div className="z-10 relative bg-slate-700 p-1 rounded-sm border border-slate-600">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
              )}
              
              {cell.type === 'TARGET' && (
                <div className="z-10 relative">
                  <Target className={cn("w-6 h-6 transition-colors duration-300", cell.hasLaser ? "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-slate-500")} />
                </div>
              )}
              
              {cell.type === 'MIRROR' && (
                <div className={cn(
                  "w-1 h-3/4 bg-blue-400 rounded-full z-10 transition-transform duration-300 shadow-[0_0_8px_rgba(96,165,250,0.6)]",
                  cell.mirrorType === 'FORWARD' ? "rotate-45" : "-rotate-45"
                )} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
