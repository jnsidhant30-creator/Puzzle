import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

interface Tile {
  id: number;
  rotation: number;
  targetRotation: number;
  symbol: string;
}

const TILE_SYMBOLS = ['└', '┬', '│', '┐', '┴', '├', '┤', '┌', '┘'];

export const RotatingTiles: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const size = difficulty === 'easy' ? 3 : 4;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [rotationsCount, setRotationsCount] = useState(0);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  const isTileAligned = (t: Tile) =>
    t.symbol === '│' ? t.rotation % 180 === t.targetRotation % 180 : t.rotation === t.targetRotation;

  useEffect(() => {
    initTiles();
  }, [difficulty]);

  const initTiles = () => {
    const total = size * size;
    const list: Tile[] = [];
    for (let i = 0; i < total; i++) {
      const sym = TILE_SYMBOLS[i % TILE_SYMBOLS.length];
      const targetRotation = Math.floor(Math.random() * 4) * 90;
      let rotation = Math.floor(Math.random() * 4) * 90;
      if (sym === '│' && rotation % 180 === targetRotation % 180) {
        rotation = (rotation + 90) % 360;
      } else if (rotation === targetRotation) {
        rotation = (rotation + 90) % 360;
      }
      list.push({ id: i, rotation, targetRotation, symbol: sym });
    }
    setTiles(list);
    setRotationsCount(0);
    setTimer(0);
    setHintIndex(null);
    setIsWon(false);
  };

  const handleTileClick = (index: number) => {
    if (isWon) return;
    sound.playRotate();
    const newTiles = tiles.map((t, i) =>
      i === index ? { ...t, rotation: (t.rotation + 90) % 360 } : t
    );
    setTiles(newTiles);
    setRotationsCount(r => r + 1);

    const isSolved = newTiles.every(isTileAligned);
    if (isSolved) {
      setIsWon(true);
      sound.playSuccess();
      const score = Math.max(120, 1000 - rotationsCount * 8 - timer * 4);
      setTimeout(() => onComplete(score, timer, true), 600);
    }
  };

  const handleHint = () => {
    if (isWon || hintsLeft <= 0) return;
    const misalignedIdx = tiles.findIndex(t => !isTileAligned(t));
    if (misalignedIdx === -1) return;

    if (useHint()) {
      sound.playRotate();
      const newTiles = tiles.map((t, i) =>
        i === misalignedIdx ? { ...t, rotation: t.targetRotation } : t
      );
      setTiles(newTiles);
      setHintIndex(misalignedIdx);
      setTimeout(() => setHintIndex(null), 2500);

      const isSolved = newTiles.every(isTileAligned);
      if (isSolved) {
        setIsWon(true);
        sound.playSuccess();
        const score = Math.max(120, 1000 - rotationsCount * 8 - timer * 4);
        setTimeout(() => onComplete(score, timer, true), 600);
      }
    }
  };

  const gridColsClass = size === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Grid Size', value: `${size} × ${size}` },
          { label: 'Rotations', value: rotationsCount, tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Board */}
      <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-[#C5BFD0] mb-4 text-center">
          Rotate tile glyphs to re-align their orientations correctly.
        </p>

        <div className={`grid ${gridColsClass} gap-2.5 w-full max-w-[340px] aspect-square`}>
          {tiles.map((tile, idx) => {
            const isAligned = isTileAligned(tile);
            const isHint = hintIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-lg text-3xl font-semibold flex items-center justify-center border transition-all duration-150 select-none ${
                  isHint
                    ? 'bg-pv-dragon-fruit/20 border-pv-dragon-fruit text-pv-dragon-fruit-light'
                    : isAligned
                    ? 'bg-pv-surface-secondary border-pv-border-strong text-pv-text-primary'
                    : 'bg-pv-surface-secondary border-pv-border text-pv-text-muted hover:border-pv-border-strong hover:text-pv-text-secondary'
                }`}
                style={{ transform: `rotate(${tile.rotation}deg)` }}
                aria-label={`Tile ${idx}`}
              >
                {tile.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Align 1 Tile ({hintsLeft})
        </button>
        <button
          onClick={initTiles}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Board
        </button>
      </div>
    </div>
  );
};
