import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { HelpCircle, Check, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

const WORDS_EASY = ['CAT', 'SUN', 'STAR', 'MOON', 'FISH'];
const WORDS_MEDIUM = ['BRAIN', 'LOGIC', 'SMART', 'SOLVE', 'FOCUS'];
const WORDS_HARD = ['CIPHER', 'VECTOR', 'BINARY', 'SYNTAX', 'MATRIX'];

export const WordGrid: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const wordsToFind = difficulty === 'easy' 
    ? WORDS_EASY.slice(0, 3) 
    : difficulty === 'medium' 
    ? WORDS_MEDIUM.slice(0, 3) 
    : WORDS_HARD.slice(0, 3);

  const gridSize = 6;
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<{ r: number; c: number; char: string }[]>([]);
  const [timer, setTimer] = useState(0);
  const [hintCells, setHintCells] = useState<{ r: number; c: number }[]>([]);

  useEffect(() => {
    initGrid();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty]);

  const initGrid = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const matrix: string[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => letters[Math.floor(Math.random() * letters.length)])
    );

    // Embed words horizontally on rows 0, 2, 4
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
  };

  const handleCellClick = (r: number, c: number) => {
    sound.playClick();
    const alreadyIdx = selectedChain.findIndex(item => item.r === r && item.c === c);
    if (alreadyIdx !== -1) {
      // Remove from that point
      setSelectedChain(prev => prev.slice(0, alreadyIdx));
    } else {
      setSelectedChain(prev => [...prev, { r, c, char: grid[r][c] }]);
    }
  };

  const handleCheckWord = () => {
    const wordStr = selectedChain.map(s => s.char).join('');
    if (wordsToFind.includes(wordStr) && !foundWords.includes(wordStr)) {
      sound.playSuccess();
      const updatedFound = [...foundWords, wordStr];
      setFoundWords(updatedFound);
      setSelectedChain([]);
      setHintCells([]);

      if (updatedFound.length === wordsToFind.length) {
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
      // Locate the missing word on the grid
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
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Found</p>
          <p className="text-xl font-bold text-emerald-400">{foundWords.length} / {wordsToFind.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Selected</p>
          <p className="text-xl font-bold text-pv-dragon-fruit-light tracking-wider">
            {selectedChain.map(s => s.char).join('') || '...'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
      </div>

      {/* Target Word Badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {wordsToFind.map((w, idx) => {
          const isDone = foundWords.includes(w);
          return (
            <span
              key={idx}
              className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase transition ${
                isDone
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 line-through'
                  : 'bg-pv-surface-primary text-pv-text-secondary border-pv-border-strong'
              }`}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* Grid */}
      <div className="w-full bg-pv-bg-secondary/90 border-2 border-emerald-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
        <div className="grid grid-cols-6 gap-2 w-full max-w-md aspect-square">
          {grid.map((row, r) =>
            row.map((char, c) => {
              const isSelected = selectedChain.some(item => item.r === r && item.c === c);
              const isHinted = hintCells.some(h => h.r === r && h.c === c);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`rounded-xl text-xl sm:text-2xl font-bold flex items-center justify-center border-2 transition-all shadow-sm ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-400 scale-105 shadow-emerald-600/40'
                      : isHinted
                      ? 'bg-pv-dragon-fruit/30 border-pv-dragon-fruit text-pv-dragon-fruit-light animate-pulse scale-105 ring-2 ring-pv-dragon-fruit'
                      : 'bg-pv-surface-primary hover:bg-pv-surface-soft text-slate-200 border-pv-border-strong'
                  }`}
                >
                  {char}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 w-full mb-3">
        <button
          onClick={() => setSelectedChain([])}
          disabled={selectedChain.length === 0}
          className="flex-1 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong py-3 rounded-xl font-semibold text-sm transition disabled:opacity-40"
        >
          Clear Selection
        </button>
        <button
          onClick={handleCheckWord}
          disabled={selectedChain.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl border border-emerald-400 flex items-center justify-center gap-1 transition shadow-sm shadow-emerald-600/30 disabled:opacity-40"
        >
          <Check className="w-5 h-5" /> Submit Word
        </button>
      </div>

      {/* Hint and Reset */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0 || foundWords.length === wordsToFind.length}
          className="flex-1 bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={initGrid}
          className="p-2.5 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border-strong rounded-xl transition"
          title="Reset Grid"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
