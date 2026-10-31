import React from 'react';
import type { CellModel } from './types';
import { cn } from '../../utils/cn';

interface ColorCellProps {
  cell: CellModel;
  colorClass: string;
  isEndpoint: boolean;
  onPointerDown: (r: number, c: number) => void;
  onPointerEnter: (r: number, c: number) => void;
}

export const ColorCell: React.FC<ColorCellProps> = ({ 
  cell, colorClass, isEndpoint, onPointerDown, onPointerEnter 
}) => {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onPointerDown(cell.r, cell.c);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    e.preventDefault();
    // Only trigger if we are actively pressing down (buttons === 1 for left click, or touch active)
    if (e.buttons === 1 || e.pointerType === 'touch') {
      onPointerEnter(cell.r, cell.c);
    }
  };

  return (
    <div 
      className={cn(
        "relative w-full h-full border border-base-content/10 touch-none user-select-none",
        cell.state === 'blocked' ? "bg-base-content/20" : "bg-base-200"
      )}
      role="button" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); const ev = new PointerEvent('pointerdown', { bubbles: true, cancelable: true }); e.currentTarget.dispatchEvent(ev); } }} onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
    >
      {/* Endpoint marker */}
      {isEndpoint && (
        <div className={cn(
          "absolute inset-2 rounded-full shadow-inner",
          colorClass || "bg-base-300"
        )} />
      )}

      {/* Path lines */}
      {cell.state === 'path' && colorClass && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn("w-4 h-4 rounded-full", colorClass)} />
          {/* Connection up */}
          {cell.connectedTo.up && <div className={cn("absolute top-0 w-4 h-1/2", colorClass)} />}
          {/* Connection down */}
          {cell.connectedTo.down && <div className={cn("absolute bottom-0 w-4 h-1/2", colorClass)} />}
          {/* Connection left */}
          {cell.connectedTo.left && <div className={cn("absolute left-0 h-4 w-1/2", colorClass)} />}
          {/* Connection right */}
          {cell.connectedTo.right && <div className={cn("absolute right-0 h-4 w-1/2", colorClass)} />}
        </div>
      )}

      {/* Connection from endpoint to path */}
      {isEndpoint && cell.colorId !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {cell.connectedTo.up && <div className={cn("absolute top-0 w-4 h-1/2", colorClass)} />}
          {cell.connectedTo.down && <div className={cn("absolute bottom-0 w-4 h-1/2", colorClass)} />}
          {cell.connectedTo.left && <div className={cn("absolute left-0 h-4 w-1/2", colorClass)} />}
          {cell.connectedTo.right && <div className={cn("absolute right-0 h-4 w-1/2", colorClass)} />}
        </div>
      )}

      {/* Blocked marker */}
      {cell.state === 'blocked' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-base-300 transform rotate-45" />
        </div>
      )}
    </div>
  );
};
