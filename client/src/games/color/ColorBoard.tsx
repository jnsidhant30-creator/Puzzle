import React, { useRef } from 'react';
import type { ColorPathPuzzle, CellModel, ColorId } from './types';
import { ColorCell } from './ColorCell';

interface ColorBoardProps {
  puzzle: ColorPathPuzzle;
  grid: CellModel[][];
  onStartDraw: (r: number, c: number) => void;
  onDraw: (r: number, c: number) => void;
  onEndDraw: () => void;
}

export const ColorBoard: React.FC<ColorBoardProps> = ({
  puzzle,
  grid,
  onStartDraw,
  onDraw,
  onEndDraw
}) => {
  const boardRef = useRef<HTMLDivElement>(null);

  // To support touch move across elements (which pointerEnter doesn't handle natively on mobile without pointer capture)
  // We handle pointer move at the board level.
  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1 && e.pointerType !== 'touch') return;
    
    // Find which element is under the pointer
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // document.elementFromPoint works for touch events mapped to pointer events
    const el = document.elementFromPoint(clientX, clientY);
    if (el) {
      const r = el.getAttribute('data-r');
      const c = el.getAttribute('data-c');
      if (r !== null && c !== null) {
        onDraw(parseInt(r, 10), parseInt(c, 10));
      }
    }
  };

  const getColorClass = (colorId: ColorId | null): string => {
    if (colorId === null) return '';
    const pair = puzzle.pairs.find(p => p.colorId === colorId);
    return pair ? pair.displayColor : '';
  };

  return (
    <div 
      ref={boardRef}
      className="w-full max-w-[600px] mx-auto aspect-square bg-base-300 p-2 rounded-xl shadow-lg touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={onEndDraw}
      onPointerLeave={onEndDraw}
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${puzzle.rows}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
        gap: '2px'
      }}
    >
      {grid.map((row, r) => (
        row.map((cell, c) => {
          const isEndpoint = cell.state === 'endpoint';
          const colorClass = getColorClass(cell.colorId);
          
          return (
            <div key={`${r}-${c}`} data-r={r} data-c={c} className="w-full h-full">
              <ColorCell
                cell={cell}
                colorClass={colorClass}
                isEndpoint={isEndpoint}
                onPointerDown={onStartDraw}
                onPointerEnter={onDraw}
              />
            </div>
          );
        })
      ))}
    </div>
  );
};
