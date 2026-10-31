import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, CheckCircle } from 'lucide-react'; interface Props { difficulty: Difficulty; onComplete: (score: number, timeSeconds: number, won: boolean) => void; useHint: () => boolean; hintsLeft: number;
} const COLOR_PAIRS = [ { id: 'red', bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', label: '🔴' }, { id: 'blue', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', label: '🔵' }, { id: 'green', bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500', label: '🟢' }, { id: 'yellow', bg: 'bg-pv-dragon-fruit-light', text: 'text-pv-dragon-fruit-light', border: 'border-accent-400', label: '🟡' }
]; export const ColorPath: React.FC<Props> = ({ difficulty, onComplete }) => { 
  const size = difficulty === 'easy' ? 4 : 5; 
  const gridColsClass = size === 4 ? 'grid-cols-4' : 'grid-cols-5';
  const pairCount = difficulty === 'easy' ? 3 : 4; 
  const [board, setBoard] = useState<{ colorId: string | null; isEndpoint: boolean }[]>([]); 
  const [activeColor, setActiveColor] = useState<string | null>(null); 
  const [paths, setPaths] = useState<{ [colorId: string]: number[] }>({}); 
  const [timer, setTimer] = useState(0);  useEffect(() => { initBoard(); const interval = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(interval); }, [difficulty]); const initBoard = () => { const total = size * size; const newBoard = Array.from({ length: total }, () => ({ colorId: null as string | null, isEndpoint: false })); const activePairs = COLOR_PAIRS.slice(0, pairCount); const initialPaths: { [colorId: string]: number[] } = {}; activePairs.forEach((pair) => { let p1 = Math.floor(Math.random() * total); while (newBoard[p1].colorId !== null) p1 = Math.floor(Math.random() * total); newBoard[p1] = { colorId: pair.id, isEndpoint: true }; let p2 = Math.floor(Math.random() * total); while (newBoard[p2].colorId !== null) p2 = Math.floor(Math.random() * total); newBoard[p2] = { colorId: pair.id, isEndpoint: true }; initialPaths[pair.id] = []; }); setBoard(newBoard); setPaths(initialPaths); setActiveColor(null); setTimer(0); }; const handleCellClick = (index: number) => { sound.playClick(); const cell = board[index]; if (cell.isEndpoint && cell.colorId) { setActiveColor(cell.colorId); setPaths(prev => ({ ...prev, [cell.colorId!]: [index] })); return; } if (!activeColor) return; const currentPath = paths[activeColor] || []; if (currentPath.length === 0) return; const lastIdx = currentPath[currentPath.length - 1]; const isAdjacent = Math.abs(Math.floor(lastIdx / size) - Math.floor(index / size)) + Math.abs((lastIdx % size) - (index % size)) === 1; if (isAdjacent && !currentPath.includes(index)) { const newPath = [...currentPath, index]; setPaths(prev => ({ ...prev, [activeColor]: newPath })); /* Check if reached other endpoint */
if (cell.isEndpoint && cell.colorId === activeColor && index !== currentPath[0]) { sound.playSuccess(); setActiveColor(null); /* Check overall completion */
const completedPairs = Object.keys(paths).filter(cId => { const path = paths[cId]; return path.length > 1 && board[path[0]].colorId === cId && board[path[path.length - 1]].colorId === cId; }); if (completedPairs.length >= pairCount - 1) { const score = Math.max(100, 1000 - timer * 8); setTimeout(() => onComplete(score, timer, true), 800); } } } };

  return ( 
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full"> 
      {/* Top Header */} 
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm"> 
        <div className="text-center"> 
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Grid</p> 
          <p className="text-xl font-bold text-pink-400">{size}x{size}</p> 
        </div> 
        <div className="text-center"> 
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Active</p> 
          <p className="text-xl font-bold text-pv-dragon-fruit-light uppercase">{activeColor || 'None'}</p> 
        </div> 
        <div className="text-center"> 
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p> 
          <p className="text-xl font-bold text-cyan-400">{timer}s</p> 
        </div> 
      </div> 
      {/* Board */} 
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-pink-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center"> 
        <p className="text-xs font-semibold text-pink-300 uppercase tracking-widest mb-6">Connect Color Nodes Without Crossing Paths</p> 
        <div className={`grid ${gridColsClass} gap-2 w-full max-w-[320px] aspect-square`}> 
          {board.map((cell, idx) => { /* Find if in path */
let pathColor: string | null = null; Object.entries(paths).forEach(([cId, pList]) => { if (pList.includes(idx)) pathColor = cId; }); const pairObj = COLOR_PAIRS.find(c => c.id === (cell.colorId || pathColor)); return ( <button key={idx} onClick={() => handleCellClick(idx)} className={`aspect-square rounded-xl text-2xl flex items-center justify-center border-2 transition-all shadow-inner ${ cell.isEndpoint ? `${pairObj?.bg || 'bg-pv-surface-primary'} text-white border-white scale-105 shadow-md` : pathColor ? `${pairObj?.bg || 'bg-pv-surface-soft'} opacity-80 border-slate-600` : 'bg-pv-surface-primary/80 border-pv-border-strong hover:border-pink-500/40' }`} > {cell.isEndpoint ? pairObj?.label : ''} </button> ); })} </div> </div> {/* Reset */} <button onClick={initBoard} className="w-full bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition" > <RefreshCw className="w-4 h-4" /> Reset Paths </button> </div> );
};
