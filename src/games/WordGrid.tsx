import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { RefreshCw, Lightbulb, Check } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

const WORDS_EASY = ['CAT', 'SUN', 'STAR', 'MOON', 'FISH'];
const WORDS_MEDIUM = ['BRAIN', 'LOGIC', 'SMART', 'SOLVE', 'FOCUS'];
const WORDS_HARD = ['CIPHER', 'VECTOR', 'BINARY', 'SYNTAX', 'MATRIX'];

export const WordGrid: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const wordsToFind =
    difficulty === 'easy'
      ? WORDS_EASY.slice(0, 3)
      : difficulty === 'medium'
      ? WORDS_MEDIUM.slice(0, 3)
      : WORDS_HARD.slice(0, 3);

  const gridSize = 6;
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<{ r: number; c: number; char: string }[]>([]);
  const [hintCells, setHintCells] = useState<{ r: number; c: number }[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  useEffect(() => {
    initGrid();
  }, [difficulty]);

  const initGrid = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const matrix: string[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => letters[Math.floor(Math.random() * letters.length)])
    );

    wordsToFind.forEach((word, idx) => {
      const row = idx * 2;
      for (let c = 0; c < word.length && c < gridSize; c++) {
        matrix[row][c] = word[c];
      }
    });

    setGrid(matrix);
    setFoundWords([]);
    setSelectedChain([]);
    setHintCells([]);
    setTimer(0);
    setIsWon(false);
  };

  const handleCellClick = (r: number, c: number) => {
    if (isWon) return;
    sound.playClick();
    const alreadyIdx = selectedChain.findIndex(item => item.r === r && item.c === c);
    if (alreadyIdx !== -1) {
      setSelectedChain(prev => prev.slice(0, alreadyIdx));
    } else {
      setSelectedChain(prev => [...prev, { r, c, char: grid[r][c] }]);
    }
  };

  const handleCheckWord = () => {
    if (isWon) return;
    const wordStr = selectedChain.map(s => s.char).join('');
    if (wordsToFind.includes(wordStr) && !foundWords.includes(wordStr)) {
      sound.playSuccess();
      const updatedFound = [...foundWords, wordStr];
      setFoundWords(updatedFound);
      setSelectedChain([]);
      setHintCells([]);

      if (updatedFound.length === wordsToFind.length) {
        setIsWon(true);
        const score = Math.max(150, 1000 - timer * 5);
        setTimeout(() => onComplete(score, timer, true), 800);
      }
    } else {
      sound.playError();
      setSelectedChain([]);
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0) return;
    const missingWord = wordsToFind.find(w => !foundWords.includes(w));
    if (!missingWord) return;

    if (useHint()) {
      sound.playClick();
      const wordIdx = wordsToFind.indexOf(missingWord);
      const row = wordIdx * 2;
      const cells = [
        { r: row, c: 0 },
        { r: row, c: 1 }
      ];
      setHintCells(cells);
      setTimeout(() => setHintCells([]), 4000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Found', value: `${foundWords.length} / ${wordsToFind.length}`, tone: 'success' },
          { label: 'Selected', value: selectedChain.map((s) => s.char).join('') || '-', tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
        ]}
      />

      {/* Target Word Badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
        {wordsToFind.map((w, idx) => {
          const isDone = foundWords.includes(w);
          return (
            <span
              key={idx}
              className={`px-3 py-1 rounded-md text-xs font-mono font-medium border uppercase transition-colors ${
                isDone
                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-600/40 line-through'
                  : 'bg-[#16131C] text-[#C5BFD0] border-[#342D3D]'
              }`}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* Board */}
      <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
        <p className="text-xs text-pv-text-secondary mb-4 text-center">
          Select adjacent letters to find each target word.
        </p>

        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 w-full max-w-[340px]">
          {grid.map((row, r) =>
            row.map((char, c) => {
              const isSelected = selectedChain.some(item => item.r === r && item.c === c);
              const isHinted = hintCells.some(h => h.r === r && h.c === c);

              let cellStyle = 'bg-pv-surface-secondary border-pv-border hover:border-pv-border-strong text-pv-text-primary';
              if (isSelected) {
                cellStyle = 'bg-pv-dragon-fruit text-[#110F15] border-pv-dragon-fruit font-bold';
              } else if (isHinted) {
                cellStyle = 'bg-pv-dragon-fruit/20 border-pv-dragon-fruit text-pv-dragon-fruit-light font-bold';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square rounded-md text-sm sm:text-lg font-mono font-semibold flex items-center justify-center border transition-colors select-none ${cellStyle}`}
                  aria-label={`Letter ${char}`}
                >
                  {char}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2.5 w-full mb-2.5">
        <button
          onClick={() => setSelectedChain([])}
          disabled={selectedChain.length === 0}
          className="flex-1 h-10 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
        >
          Clear
        </button>
        <button
          onClick={handleCheckWord}
          disabled={selectedChain.length === 0 || isWon}
          className="flex-1 h-10 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <Check className="w-4 h-4" /> Submit Word
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || foundWords.length === wordsToFind.length}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initGrid}
          className="h-9 px-3 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          title="Reset Grid"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </div>
  );
};
