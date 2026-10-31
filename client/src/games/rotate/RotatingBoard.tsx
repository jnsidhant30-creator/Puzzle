import React from 'react';
import type { RotatingTilesPuzzle } from './types';
import { type PipeTileData, PipeType } from '../pipe/types';
import { cn } from '../../utils/cn';

interface RotatingBoardProps {
  puzzle: RotatingTilesPuzzle | null;
  tiles: PipeTileData[][];
  onRotate: (r: number, c: number) => void;
  isPaused: boolean;
  hintLocation?: {r: number, c: number};
}

const getPipePath = (type: PipeType) => {
  switch(type) {
    case PipeType.STRAIGHT: return "M12 0v24";
    case PipeType.CORNER: return "M12 0v12h12";
    case PipeType.T_JUNCTION: return "M12 0v24M12 12h12";
    case PipeType.CROSS: return "M12 0v24M0 12h24";
    case PipeType.SOURCE: return "M12 12v12";
    case PipeType.TARGET: return "M12 0v12";
    default: return "";
  }
};

const TileSvg = ({ type }: { type: PipeType }) => {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full stroke-current pointer-events-none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={getPipePath(type)} />
      {type === PipeType.SOURCE && <circle cx="12" cy="12" r="4" className="fill-current" />}
      {type === PipeType.TARGET && <rect x="8" y="8" width="8" height="8" className="fill-current" />}
      {type === PipeType.BLOCKER && <path d="M6 6l12 12M18 6l-12 12" stroke="gray" />}
    </svg>
  );
};

export const RotatingBoard: React.FC<RotatingBoardProps> = ({ 
  puzzle, 
  tiles, 
  onRotate, 
  isPaused,
  hintLocation
}) => {
  if (!puzzle) return null;

  return (
    <div 
      className="w-full max-w-[500px] aspect-square mx-auto bg-slate-900 rounded-lg p-2 grid gap-1 shadow-xl border-4 border-slate-950 select-none touch-none"
      style={{
        gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
        gridTemplateRows: `repeat(${puzzle.rows}, 1fr)` 
      }}
    >
      {tiles.map((row, r) => 
        row.map((t, c) => {
          const isHinted = hintLocation?.r === r && hintLocation?.c === c;
          
          return (
            <button
              key={`${r}-${c}`}
              onClick={() => onRotate(r, c)}
              disabled={isPaused || t.locked}
              className={cn(
                "w-full h-full rounded-md flex items-center justify-center transition-all duration-300 relative",
                t.type === PipeType.SOURCE ? "text-green-500 bg-green-950/50" :
                t.type === PipeType.TARGET ? "text-red-500 bg-red-950/50" :
                "text-blue-400 bg-slate-800",
                !t.locked && "hover:bg-slate-700 active:scale-95 cursor-pointer",
                t.locked && "opacity-80",
                isHinted && "ring-2 ring-yellow-400 animate-pulse z-10"
              )}
            >
              <div 
                className="w-full h-full transition-transform duration-300 ease-spring"
                style={{ transform: `rotate(${t.rotation}deg)` }}
              >
                <TileSvg type={t.type} />
              </div>
              {t.locked && t.type !== PipeType.BLOCKER && (
                <div className="absolute top-0 right-0 p-0.5 text-[8px] opacity-50 bg-black/50 rounded-bl">🔒</div>
              )}
            </button>
          );
        })
      )}
    </div>
  );
};
