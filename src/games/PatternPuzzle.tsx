import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';
import {
  Lightbulb,
  Circle,
  Square,
  Triangle,
  Diamond,
  Hexagon,
  Star,
  Plus
} from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

const SHAPES = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'hexagon',
  'star'
] as const;

type ShapeId = typeof SHAPES[number];

const renderShape = (id: ShapeId, className = 'w-6 h-6 sm:w-7 sm:h-7') => {
  switch (id) {
    case 'circle': return <Circle className={className} />;
    case 'square': return <Square className={className} />;
    case 'triangle': return <Triangle className={className} />;
    case 'diamond': return <Diamond className={className} />;
    case 'hexagon': return <Hexagon className={className} />;
    case 'star': return <Star className={className} />;
  }
};

interface PatternState {
  grid: (ShapeId | null)[];
  answer: ShapeId;
  options: ShapeId[];
  missingIndex: number;
}

export const PatternPuzzle: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [score, setScore] = useState(0);
  const [pattern, setPattern] = useState<PatternState | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<ShapeId | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hintMsg, setHintMessage] = useState<string | null>(null);
  const [timer] = useGameTimer(isPaused, round === totalRounds && isAnswered, [difficulty]);

  useEffect(() => {
    generatePattern();
  }, [round, difficulty]);

  const generatePattern = () => {
    setSelectedOpt(null);
    setIsAnswered(false);
    setHintMessage(null);

    const pool = [...SHAPES].sort(() => Math.random() - 0.5);
    const [s1, s2, s3] = pool.slice(0, 3);

    const useVariationB = Math.random() > 0.5;
    const fullGrid: ShapeId[] = useVariationB
      ? [s1, s2, s3, s3, s1, s2, s2, s3, s1]
      : [s1, s2, s3, s2, s3, s1, s3, s1, s2];

    const candidateMissing = [4, 6, 7, 8];
    const missingIndex = candidateMissing[Math.floor(Math.random() * candidateMissing.length)];
    const target = fullGrid[missingIndex];

    const gridArr: (ShapeId | null)[] = [...fullGrid];
    gridArr[missingIndex] = null;

    const optsSet = new Set<ShapeId>();
    optsSet.add(target);
    while (optsSet.size < 4) {
      const wrong = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      if (wrong !== target) optsSet.add(wrong);
    }
    const options = Array.from(optsSet).sort(() => Math.random() - 0.5);

    setPattern({ grid: gridArr, answer: target, options, missingIndex });
  };

  const handleSelectOption = (opt: ShapeId) => {
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
      setHintMessage('Latin Square: Each shape occurs exactly once per row and column.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Round', value: `${round} / ${totalRounds}`, tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
          { label: 'Score', value: score, tone: 'success' },
        ]}
      />

      {/* Pattern Matrix 3x3 */}
      {pattern && (
        <div className="w-full bg-[#110F15]/90 border border-[#342D3D] rounded-xl p-4 sm:p-5 mb-5 flex flex-col items-center">
          <p className="text-xs text-[#C5BFD0] mb-4 text-center">
            Determine the missing shape to complete the 3 × 3 matrix pattern.
          </p>

          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] aspect-square">
            {pattern.grid.map((shapeId, idx) => {
              const isMissing = shapeId === null;

              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-lg flex items-center justify-center border transition-colors select-none ${
                    isMissing
                      ? 'bg-pv-surface-soft border-pv-dragon-fruit text-pv-dragon-fruit font-bold text-xl'
                      : 'bg-pv-surface-secondary border-pv-border text-pv-text-primary'
                  }`}
                >
                  {isMissing ? '?' : renderShape(shapeId!)}
                </div>
              );
            })}
          </div>

          {hintMsg && (
            <div className="mt-4 p-2.5 bg-pv-surface-secondary border border-pv-dragon-fruit/40 text-pv-dragon-fruit-light rounded-md text-xs flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-pv-dragon-fruit shrink-0" />
              <span>{hintMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Answer Options */}
      {pattern && (
        <div className="grid grid-cols-4 gap-2.5 w-full mb-5">
          {pattern.options.map((opt, idx) => {
            let itemStyle = 'bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border-pv-border';
            if (isAnswered) {
              if (opt === pattern.answer) {
                itemStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300';
              } else if (opt === selectedOpt) {
                itemStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
              } else {
                itemStyle = 'bg-pv-surface-primary border-pv-border text-pv-text-muted opacity-40';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                disabled={isAnswered}
                className={`h-14 rounded-lg border flex items-center justify-center transition-colors active:translate-y-px select-none ${itemStyle}`}
                aria-label={`Select ${opt}`}
              >
                {renderShape(opt)}
              </button>
            );
          })}
        </div>
      )}

      {/* Hint Button */}
      <button
        onClick={handleHint}
        disabled={isAnswered || hintsLeft <= 0}
        className="w-full h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
      </button>
    </div>
  );
};
