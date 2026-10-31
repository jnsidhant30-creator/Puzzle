import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { HelpCircle, Sparkles } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

const SHAPES = ['🔴', '🟦', '⭐', '🔺', '🟩', '💎', '🟡', '🟣'];

interface PatternState {
  grid: (string | null)[];
  answer: string;
  options: string[];
  missingIndex: number;
}

export const PatternPuzzle: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [pattern, setPattern] = useState<PatternState | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hintMsg, setHintMessage] = useState<string | null>(null);

  useEffect(() => {
    generatePattern();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [round, difficulty]);

  const generatePattern = () => {
    setSelectedOpt(null);
    setIsAnswered(false);
    setHintMessage(null);

    // Shuffle shapes pool
    const pool = [...SHAPES].sort(() => Math.random() - 0.5);
    const [s1, s2, s3] = pool.slice(0, 3);

    // 3x3 Latin square variations:
    // Variation A:
    // [s1, s2, s3]
    // [s2, s3, s1]
    // [s3, s1, s2]
    // Variation B:
    // [s1, s2, s3]
    // [s3, s1, s2]
    // [s2, s3, s1]
    const useVariationB = Math.random() > 0.5;
    const fullGrid = useVariationB
      ? [s1, s2, s3, s3, s1, s2, s2, s3, s1]
      : [s1, s2, s3, s2, s3, s1, s3, s1, s2];

    // Pick a missing position from valid test cells: 4, 6, 7, 8
    const candidateMissing = [4, 6, 7, 8];
    const missingIndex = candidateMissing[Math.floor(Math.random() * candidateMissing.length)];
    const target = fullGrid[missingIndex];

    const gridArr: (string | null)[] = [...fullGrid];
    gridArr[missingIndex] = null;

    // Distractor options
    const optsSet = new Set<string>();
    optsSet.add(target);
    while (optsSet.size < 4) {
      const wrong = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      if (wrong !== target) optsSet.add(wrong);
    }
    const options = Array.from(optsSet).sort(() => Math.random() - 0.5);

    setPattern({ grid: gridArr, answer: target, options, missingIndex });
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswered || !pattern) return;
    setSelectedOpt(opt);
    setIsAnswered(true);

    if (opt === pattern.answer) {
      sound.playSuccess();
      const points = difficulty === 'easy' ? 120 : difficulty === 'medium' ? 220 : 380;
      const newScore = score + points;
      setScore(newScore);

      setTimeout(() => {
        if (round < totalRounds) {
          setRound(r => r + 1);
        } else {
          onComplete(newScore + Math.max(0, 300 - timer * 4), timer, true);
        }
      }, 900);
    } else {
      sound.playError();
      setTimeout(() => {
        if (round < totalRounds) {
          setRound(r => r + 1);
        } else {
          onComplete(score, timer, false);
        }
      }, 900);
    }
  };

  const handleHint = () => {
    if (!pattern || isAnswered || hintsLeft <= 0) return;
    if (useHint()) {
      sound.playClick();
      setHintMessage(`Rule: Each shape appears exactly once in every row and every column.`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Pattern</p>
          <p className="text-xl font-bold text-violet-400">{round} / {totalRounds}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Score</p>
          <p className="text-xl font-bold text-emerald-400">{score}</p>
        </div>
      </div>

      {/* Pattern Matrix 3x3 */}
      {pattern && (
        <div className="w-full bg-pv-bg-secondary/90 border-2 border-violet-500/30 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
          <p className="text-xs font-semibold text-violet-300 uppercase tracking-widest mb-6">
            Complete The 3x3 Pattern Matrix
          </p>
          <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] aspect-square">
            {pattern.grid.map((symbol, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-2xl flex items-center justify-center text-4xl border-2 transition-all shadow-inner ${
                  symbol === null
                    ? 'bg-violet-500/20 border-violet-400 text-violet-300 animate-pulse ring-2 ring-violet-400'
                    : 'bg-pv-surface-primary border-pv-border-strong text-white'
                }`}
              >
                {symbol || '?'}
              </div>
            ))}
          </div>

          {hintMsg && (
            <div className="mt-6 bg-violet-500/20 border border-violet-500/40 text-violet-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-300" />
              {hintMsg}
            </div>
          )}
        </div>
      )}

      {/* Answer Options */}
      {pattern && (
        <div className="grid grid-cols-4 gap-3 w-full mb-6">
          {pattern.options.map((opt, idx) => {
            let style = "bg-pv-surface-primary hover:bg-pv-surface-soft text-white border-pv-border-strong";
            if (isAnswered) {
              if (opt === pattern.answer) {
                style = "bg-emerald-600 text-white border-emerald-400 scale-105 shadow-sm shadow-emerald-600/30";
              } else if (opt === selectedOpt) {
                style = "bg-rose-600 text-white border-rose-400";
              } else {
                style = "bg-pv-surface-primary/40 text-pv-text-muted border-pv-border-violet opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                disabled={isAnswered}
                className={`p-4 rounded-xl border-2 text-3xl font-bold flex items-center justify-center transition-all duration-200 shadow-md ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Hint Button */}
      <button
        onClick={handleHint}
        disabled={isAnswered || hintsLeft <= 0}
        className="w-full bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40"
      >
        <HelpCircle className="w-4 h-4" /> Hint ({hintsLeft})
      </button>
    </div>
  );
};
