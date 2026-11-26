import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

const COLOR_PAIRS = [
  { id: 'rose', label: '1', bg: 'bg-rose-500', textOnFill: 'text-[#110F15]', border: 'border-rose-400', name: 'Rose (1)' },
  { id: 'blue', label: '2', bg: 'bg-sky-400', textOnFill: 'text-[#110F15]', border: 'border-sky-300', name: 'Blue (2)' },
  { id: 'emerald', label: '3', bg: 'bg-emerald-400', textOnFill: 'text-[#110F15]', border: 'border-emerald-300', name: 'Emerald (3)' },
  { id: 'violet', label: '4', bg: 'bg-violet-400', textOnFill: 'text-[#110F15]', border: 'border-violet-300', name: 'Violet (4)' },
];

function arePairsSolvable(size: number, pairs: [number, number][]): boolean {
  const total = size * size;
  const blockedEndpoints = new Set<number>();
  pairs.forEach(([a, b]) => {
    blockedEndpoints.add(a);
    blockedEndpoints.add(b);
  });

  const sortedPairs = [...pairs].sort((a, b) => {
    const da = Math.abs(Math.floor(a[0] / size) - Math.floor(a[1] / size)) + Math.abs((a[0] % size) - (a[1] % size));
    const db = Math.abs(Math.floor(b[0] / size) - Math.floor(b[1] / size)) + Math.abs((b[0] % size) - (b[1] % size));
    return da - db;
  });

  const used = new Uint8Array(total);
  let budget = 2500;

  const canReach = (src: number, target: number): boolean => {
    const visited = new Uint8Array(total);
    const queue = [src];
    visited[src] = 1;
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      if (cur === target) return true;
      const r = Math.floor(cur / size);
      const c = cur % size;
      const neighbors = [
        r > 0 ? cur - size : -1,
        r < size - 1 ? cur + size : -1,
        c > 0 ? cur - 1 : -1,
        c < size - 1 ? cur + 1 : -1,
      ];
      for (const n of neighbors) {
        if (n < 0 || visited[n]) continue;
        if (n === target || (!used[n] && !blockedEndpoints.has(n))) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
    return false;
  };

  const solvePair = (pairIdx: number, cur: number): boolean => {
    if (budget-- <= 0) return false;
    const [, target] = sortedPairs[pairIdx];
    if (cur === target) {
      if (pairIdx + 1 === sortedPairs.length) return true;
      for (let i = pairIdx + 1; i < sortedPairs.length; i++) {
        if (!canReach(sortedPairs[i][0], sortedPairs[i][1])) return false;
      }
      return solvePair(pairIdx + 1, sortedPairs[pairIdx + 1][0]);
    }

    const r = Math.floor(cur / size);
    const c = cur % size;
    const tr = Math.floor(target / size);
    const tc = target % size;
    const candidates = [
      r > 0 ? cur - size : -1,
      r < size - 1 ? cur + size : -1,
      c > 0 ? cur - 1 : -1,
      c < size - 1 ? cur + 1 : -1,
    ]
      .filter((n) => n >= 0 && (n === target || (!used[n] && !blockedEndpoints.has(n))))
      .sort((a, b) => {
        const da = Math.abs(Math.floor(a / size) - tr) + Math.abs((a % size) - tc);
        const db = Math.abs(Math.floor(b / size) - tr) + Math.abs((b % size) - tc);
        return da - db;
      });

    for (const next of candidates) {
      if (next !== target) used[next] = 1;
      if (solvePair(pairIdx, next)) return true;
      if (next !== target) used[next] = 0;
    }
    return false;
  };

  return solvePair(0, sortedPairs[0][0]);
}

export const ColorPath: React.FC<Props> = ({ difficulty, onComplete, isPaused = false }) => {
  const size = difficulty === 'easy' ? 4 : 5;
  const gridColsClass = size === 4 ? 'grid-cols-4' : 'grid-cols-5';
  const pairCount = difficulty === 'easy' ? 3 : 4;
  const [board, setBoard] = useState<{ colorId: string | null; isEndpoint: boolean }[]>([]);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [paths, setPaths] = useState<{ [colorId: string]: number[] }>({});
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initBoard();
  }, [difficulty]);

  const initBoard = () => {
    const total = size * size;
    const activePairs = COLOR_PAIRS.slice(0, pairCount);
    const initialPaths: { [colorId: string]: number[] } = {};
    let chosenPairs: [number, number][] | null = null;

    for (let attempt = 0; attempt < 60; attempt++) {
      const taken = new Set<number>();
      const candidatePairs: [number, number][] = [];
      let validSpread = true;

      for (let i = 0; i < pairCount; i++) {
        let p1 = Math.floor(Math.random() * total);
        while (taken.has(p1)) p1 = Math.floor(Math.random() * total);
        taken.add(p1);

        let p2 = Math.floor(Math.random() * total);
        let guard = 0;
        while (
          (taken.has(p2) ||
            Math.abs(Math.floor(p1 / size) - Math.floor(p2 / size)) + Math.abs((p1 % size) - (p2 % size)) < 2) &&
          guard < 25
        ) {
          p2 = Math.floor(Math.random() * total);
          guard++;
        }
        if (taken.has(p2)) {
          validSpread = false;
          break;
        }
        taken.add(p2);
        candidatePairs.push([p1, p2]);
      }

      if (validSpread && arePairsSolvable(size, candidatePairs)) {
        chosenPairs = candidatePairs;
        break;
      }
    }

    if (!chosenPairs) {
      chosenPairs =
        size === 4
          ? [
              [0, 12],
              [2, 14],
              [3, 15],
            ]
          : [
              [0, 20],
              [1, 17],
              [3, 23],
              [4, 24],
            ];
    }

    const newBoard = Array.from({ length: total }, () => ({
      colorId: null as string | null,
      isEndpoint: false,
    }));

    activePairs.forEach((pair, idx) => {
      const [p1, p2] = chosenPairs![idx];
      newBoard[p1] = { colorId: pair.id, isEndpoint: true };
      newBoard[p2] = { colorId: pair.id, isEndpoint: true };
      initialPaths[pair.id] = [];
    });

    setBoard(newBoard);
    setPaths(initialPaths);
    setActiveColor(null);
    setTimer(0);
    setIsWon(false);
  };

  const handleCellClick = (index: number) => {
    if (isWon) return;
    sound.playClick();
    const cell = board[index];

    const currentPath = activeColor ? paths[activeColor] || [] : [];
    const lastIdx = currentPath.length > 0 ? currentPath[currentPath.length - 1] : -1;
    const isAdjacentToLast =
      lastIdx >= 0 &&
      Math.abs(Math.floor(lastIdx / size) - Math.floor(index / size)) +
        Math.abs((lastIdx % size) - (index % size)) ===
        1;

    // Check if clicking the matching second endpoint to complete the active path
    if (
      activeColor &&
      cell.isEndpoint &&
      cell.colorId === activeColor &&
      currentPath.length > 0 &&
      index !== currentPath[0] &&
      isAdjacentToLast
    ) {
      const newPath = [...currentPath, index];
      const updatedPaths = { ...paths, [activeColor]: newPath };
      setPaths(updatedPaths);
      sound.playSuccess();
      setActiveColor(null);

      const completedPairs = Object.keys(updatedPaths).filter((cId) => {
        const path = updatedPaths[cId];
        return (
          path.length > 1 &&
          board[path[0]]?.isEndpoint &&
          board[path[0]]?.colorId === cId &&
          board[path[path.length - 1]]?.isEndpoint &&
          board[path[path.length - 1]]?.colorId === cId
        );
      });

      if (completedPairs.length >= pairCount) {
        setIsWon(true);
        const score = Math.max(100, 1000 - timer * 8);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
      return;
    }

    // Starting or resetting a path from an endpoint
    if (cell.isEndpoint && cell.colorId) {
      setActiveColor(cell.colorId);
      setPaths((prev) => ({ ...prev, [cell.colorId!]: [index] }));
      return;
    }

    if (!activeColor || currentPath.length === 0) return;

    // Prevent crossing another color's path
    const occupiedByOther = Object.entries(paths).some(
      ([cId, pList]) => cId !== activeColor && pList.includes(index)
    );
    if (occupiedByOther) {
      sound.playError();
      return;
    }

    // Backtrack if clicking a cell already in currentPath
    const existingIdx = currentPath.indexOf(index);
    if (existingIdx !== -1) {
      setPaths((prev) => ({ ...prev, [activeColor]: currentPath.slice(0, existingIdx + 1) }));
      return;
    }

    if (isAdjacentToLast) {
      const newPath = [...currentPath, index];
      setPaths((prev) => ({ ...prev, [activeColor]: newPath }));
    }
  };

  const activePairMeta = COLOR_PAIRS.find((c) => c.id === activeColor);

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Grid Size', value: `${size} × ${size}` },
          { label: 'Active Node', value: activePairMeta ? activePairMeta.name : 'None', tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Board */}
      <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#C5BFD0] mb-4 text-center">
          Tap a numbered node (1-{pairCount}) and trace adjacent cells to its matching node without crossing paths.
        </p>

        <div className={`grid ${gridColsClass} gap-2 w-full max-w-[340px] aspect-square`}>
          {board.map((cell, idx) => {
            let pathColor: string | null = null;
            Object.entries(paths).forEach(([cId, pList]) => {
              if (pList.includes(idx)) pathColor = cId;
            });

            const pairObj = COLOR_PAIRS.find((c) => c.id === (cell.colorId || pathColor));

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                aria-label={
                  cell.isEndpoint && pairObj
                    ? `Endpoint ${pairObj.name}`
                    : pathColor && pairObj
                    ? `Path ${pairObj.name}`
                    : `Grid cell ${idx + 1}`
                }
                className={`aspect-square rounded-md flex items-center justify-center border transition-colors select-none ${
                  cell.isEndpoint
                    ? `${pairObj?.bg || 'bg-pv-surface-primary'} ${pairObj?.textOnFill || 'text-[#110F15]'} ${
                        pairObj?.border || 'border-pv-border'
                      } font-bold shadow-sm`
                    : pathColor
                    ? `${pairObj?.bg || 'bg-pv-surface-soft'} opacity-85 border-pv-border text-[#110F15] font-semibold`
                    : 'bg-pv-surface-secondary border-pv-border hover:border-pv-border-strong'
                }`}
              >
                {cell.isEndpoint && pairObj ? (
                  <span className="text-sm font-bold font-tabular">{pairObj.label}</span>
                ) : pathColor && pairObj ? (
                  <span className="text-[11px] font-bold font-tabular opacity-80">{pairObj.label}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Action */}
      <button
        onClick={initBoard}
        className="w-full h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Reset Board
      </button>
    </div>
  );
};
