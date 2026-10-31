import React, { useRef, useState, useEffect } from 'react';
import type { BlockEscapePuzzle, BlockModel } from './types';
import { cn } from '../../utils/cn';

interface BlockBoardProps {
  puzzle: BlockEscapePuzzle | null;
  blocks: BlockModel[];
  onMove: (id: string, dRow: number, dCol: number) => void;
  isPaused: boolean;
}

export const BlockBoard: React.FC<BlockBoardProps> = ({ puzzle, blocks, onMove, isPaused }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(50); // fallback
  const [dragState, setDragState] = useState<{ id: string, startX: number, startY: number, currentX: number, currentY: number } | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current && puzzle) {
        const width = boardRef.current.clientWidth;
        setCellSize(width / puzzle.cols);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [puzzle]);

  if (!puzzle) return null;

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (isPaused) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    setDragState({
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    const b = blocks.find(x => x.id === dragState.id);
    if (b) {
      const dx = dragState.currentX - dragState.startX;
      const dy = dragState.currentY - dragState.startY;
      
      let dRow = 0;
      let dCol = 0;
      
      if (b.axis === 'H') {
        dCol = Math.round(dx / cellSize);
      } else {
        dRow = Math.round(dy / cellSize);
      }
      
      if (dRow !== 0 || dCol !== 0) {
        onMove(b.id, dRow, dCol);
      }
    }
    setDragState(null);
  };

  return (
    <div 
      ref={boardRef}
      className="relative w-full max-w-[400px] aspect-square mx-auto bg-gray-800 rounded-lg overflow-hidden select-none touch-none shadow-xl border-4 border-gray-900"
      style={{
        aspectRatio: `${puzzle.cols} / ${puzzle.rows}`
      }}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 grid" 
        style={{ 
          gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
          gridTemplateRows: `repeat(${puzzle.rows}, 1fr)` 
        }}
      >
        {Array.from({ length: puzzle.rows * puzzle.cols }).map((_, i) => (
          <div key={i} className="border border-gray-700/50" />
        ))}
      </div>
      
      {/* Exit Marker */}
      <div 
        className="absolute border-y-4 border-r-4 border-red-500/50 flex items-center justify-center bg-red-500/10 z-0"
        style={{
          width: '10px',
          height: `${cellSize}px`,
          top: `${puzzle.exitR * cellSize}px`,
          right: 0
        }}
      >
        <span className="text-[10px] uppercase font-bold text-red-500/80 -rotate-90 whitespace-nowrap -ml-4">Exit</span>
      </div>

      {/* Blocks */}
      {blocks.map(b => {
        let translateX = 0;
        let translateY = 0;
        let zIndex = 10;
        
        if (dragState && dragState.id === b.id) {
           zIndex = 20;
           if (b.axis === 'H') translateX = dragState.currentX - dragState.startX;
           if (b.axis === 'V') translateY = dragState.currentY - dragState.startY;
        }

        return (
          <div
            key={b.id}
            role="button" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); const ev = new PointerEvent('pointerdown', { bubbles: true, cancelable: true }); e.currentTarget.dispatchEvent(ev); } }} onPointerDown={(e) => handlePointerDown(e, b.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn(
              "absolute rounded-lg shadow-md cursor-grab active:cursor-grabbing border-2 border-black/20 flex items-center justify-center font-bold text-white/50 text-sm transition-transform duration-75",
              b.color || 'bg-blue-500',
              b.isTarget && "bg-red-500 !text-white"
            )}
            style={{
              left: `${b.c * cellSize}px`,
              top: `${b.r * cellSize}px`,
              width: `${(b.axis === 'H' ? b.len : 1) * cellSize}px`,
              height: `${(b.axis === 'V' ? b.len : 1) * cellSize}px`,
              transform: `translate(${translateX}px, ${translateY}px)`,
              zIndex
            }}
          >
            {b.isTarget && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            )}
          </div>
        );
      })}
    </div>
  );
};
