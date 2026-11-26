import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';
import { createRng } from '../utils/prng';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  seed?: number;
  isPaused?: boolean;
}

interface Question {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*' | '/';
  answer: number;
  options: number[];
}

export const NumberPuzzle: React.FC<Props> = ({
  difficulty,
  onComplete,
  useHint,
  hintsLeft,
  seed,
  isPaused = false,
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [timer] = useGameTimer(isPaused, currentRound === totalRounds && isAnswered, [difficulty]);

  useEffect(() => {
    generateQuestion();
  }, [currentRound, difficulty, seed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        document.querySelector('[role="dialog"][aria-modal="true"]') ||
        isAnswered ||
        isPaused ||
        !question
      ) {
        return;
      }
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1 && question.options[idx] !== undefined) {
        e.preventDefault();
        handleSelectOption(question.options[idx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, isAnswered, isPaused]);

  const generateQuestion = () => {
    const rng = createRng(typeof seed === 'number' ? seed + currentRound * 97 : undefined);
    setSelectedOption(null);
    setIsAnswered(false);
    setHintMessage(null);

    const ops: ('+' | '-' | '*' | '/')[] =
      difficulty === 'easy'
        ? ['+', '-']
        : difficulty === 'medium'
        ? ['+', '-', '*']
        : ['+', '-', '*', '/'];
    const operator = ops[Math.floor(rng() * ops.length)];
    let num1 = 1;
    let num2 = 1;
    let answer = 0;
    const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;

    if (operator === '+') {
      num1 = Math.floor(rng() * max) + 1;
      num2 = Math.floor(rng() * max) + 1;
      answer = num1 + num2;
    } else if (operator === '-') {
      num1 = Math.floor(rng() * max) + 10;
      num2 = Math.floor(rng() * num1);
      answer = num1 - num2;
    } else if (operator === '*') {
      num1 = Math.floor(rng() * (difficulty === 'hard' ? 15 : 10)) + 2;
      num2 = Math.floor(rng() * 10) + 2;
      answer = num1 * num2;
    } else {
      num2 = Math.floor(rng() * 10) + 2;
      answer = Math.floor(rng() * 12) + 1;
      num1 = num2 * answer;
    }

    const optsSet = new Set<number>();
    optsSet.add(answer);
    while (optsSet.size < 4) {
      const delta = (Math.floor(rng() * 10) + 1) * (rng() > 0.5 ? 1 : -1);
      const wrong = Math.max(0, answer + delta);
      if (wrong !== answer) optsSet.add(wrong);
    }
    const options = Array.from(optsSet).sort(() => rng() - 0.5);
    setQuestion({ num1, num2, operator, answer, options });
  };

  const handleSelectOption = (opt: number) => {
    if (isAnswered || !question) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt === question.answer) {
      sound.playSuccess();
      const points = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 350;
      const newScore = score + points;
      setScore(newScore);
      setTimeout(() => {
        if (currentRound < totalRounds) {
          setCurrentRound(r => r + 1);
        } else {
          onComplete(newScore + Math.max(0, 300 - timer * 5), timer, true);
        }
      }, 1000);
    } else {
      sound.playError();
      setTimeout(() => {
        if (currentRound < totalRounds) {
          setCurrentRound(r => r + 1);
        } else {
          onComplete(score, timer, false);
        }
      }, 1000);
    }
  };

  const handleHint = () => {
    if (!question || isAnswered) return;
    if (useHint()) {
      sound.playClick();
      const isEven = question.answer % 2 === 0;
      setHintMessage(`The answer is an ${isEven ? 'even' : 'odd'} number.`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Round', value: `${currentRound} / ${totalRounds}`, tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
          { label: 'Score', value: score, tone: 'success' },
        ]}
      />

      {/* Main Equation Box */}
      {question && (
        <div className="w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-6 mb-5 flex flex-col items-center">
          <p className="text-[11px] font-semibold text-pv-text-muted uppercase tracking-wider mb-4">
            Arithmetic Evaluation
          </p>
          <div className="flex items-center justify-center gap-3 text-3xl sm:text-4xl font-semibold text-pv-text-primary font-tabular my-2">
            <span>{question.num1}</span>
            <span className="text-pv-text-muted">
              {question.operator === '*' ? '×' : question.operator === '/' ? '÷' : question.operator}
            </span>
            <span>{question.num2}</span>
            <span className="text-pv-text-muted">=</span>
            <span className="text-[#38C6BA] font-bold">?</span>
          </div>

          {hintMessage && (
            <div className="mt-4 p-2.5 bg-pv-surface-secondary border border-[#38C6BA]/40 text-[#A8E5D5] rounded-md text-xs flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#38C6BA] shrink-0" />
              <span>{hintMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Answer Options */}
      {question && (
        <div className="grid grid-cols-2 gap-3 w-full mb-5">
          {question.options.map((opt, idx) => {
            let itemStyle = 'bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border-pv-border';
            if (isAnswered) {
              if (opt === question.answer) {
                itemStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300';
              } else if (opt === selectedOption) {
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
                className={`h-14 rounded-lg text-xl font-semibold font-tabular border transition-colors select-none active:translate-y-px ${itemStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handleHint}
          disabled={isAnswered || hintsLeft <= 0}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={generateQuestion}
          disabled={isAnswered}
          className="h-9 px-3 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          title="Skip question"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Skip
        </button>
      </div>
    </div>
  );
};
