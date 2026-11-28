import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { Lightbulb, Check, Delete, RefreshCw } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

const WORD_BANK = {
  easy: ['BRAIN', 'PUZZLE', 'SMART', 'LOGIC', 'MATCH', 'POWER', 'THINK', 'SOLVE', 'LEVEL', 'SPEED'],
  medium: ['CONCEPT', 'MASTERY', 'CHALLENGE', 'PATTERN', 'SEQUENCE', 'DYNAMIC', 'STRATEGY', 'CREATIVE'],
  hard: ['ALGORITHM', 'CYBERSPACE', 'EXCELLENCE', 'HYPOTHESIS', 'INTELLIGENCE', 'MULTIVERSE', 'PHENOMENON']
};

export const WordPuzzle: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const [targetWord, setTargetWord] = useState('');
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [userGuess, setUserGuess] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [round, setCurrentRound] = useState(1);
  const totalRounds = 3;
  const [hintMsg, setHintMessage] = useState<string | null>(null);
  const [isRoundLocked, setIsRoundLocked] = useState(false);
  const [timer] = useGameTimer(isPaused, round === totalRounds && isRoundLocked, [difficulty]);

  useEffect(() => {
    initRound();
  }, [round, difficulty]);

  const initRound = () => {
    setUserGuess([]);
    setUsedIndices([]);
    setHintMessage(null);
    setIsRoundLocked(false);

    const pool = WORD_BANK[difficulty];
    const word = pool[Math.floor(Math.random() * pool.length)];
    setTargetWord(word);

    let letters = word.split('');
    while (letters.join('') === word && letters.length > 1) {
      letters = letters.sort(() => Math.random() - 0.5);
    }
    setScrambled(letters);
  };

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
        isRoundLocked ||
        isPaused
      ) {
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (e.key === 'Enter' && userGuess.length === targetWord.length) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      const upper = e.key.toUpperCase();
      if (/^[A-Z]$/.test(upper)) {
        const matchIdx = scrambled.findIndex((ch, idx) => ch === upper && !usedIndices.includes(idx));
        if (matchIdx !== -1) {
          e.preventDefault();
          handlePickLetter(upper, matchIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrambled, usedIndices, userGuess, targetWord, isRoundLocked, isPaused]);

  const handlePickLetter = (char: string, index: number) => {
    if (isRoundLocked || isPaused || usedIndices.includes(index)) return;
    sound.playClick();
    setUserGuess(prev => [...prev, char]);
    setUsedIndices(prev => [...prev, index]);
  };

  const handleBackspace = () => {
    if (isRoundLocked || userGuess.length === 0) return;
    sound.playClick();
    const newGuess = [...userGuess];
    newGuess.pop();
    setUserGuess(newGuess);

    const newIndices = [...usedIndices];
    newIndices.pop();
    setUsedIndices(newIndices);
  };

  const handleClear = () => {
    if (isRoundLocked) return;
    sound.playClick();
    setUserGuess([]);
    setUsedIndices([]);
  };

  const handleSubmit = () => {
    if (isRoundLocked) return;
    const guessStr = userGuess.join('');
    if (guessStr === targetWord) {
      setIsRoundLocked(true);
      sound.playSuccess();
      const points = difficulty === 'easy' ? 120 : difficulty === 'medium' ? 220 : 400;
      const newScore = score + points;
      setScore(newScore);

      setTimeout(() => {
        if (round < totalRounds) {
          setCurrentRound(r => r + 1);
        } else {
          onComplete(newScore + Math.max(0, 300 - timer * 4), timer, true);
        }
      }, 800);
    } else {
      sound.playError();
      handleClear();
    }
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || userGuess.length >= targetWord.length) return;
    if (useHint()) {
      sound.playClick();
      const nextChar = targetWord[userGuess.length];
      setHintMessage(`Next letter: "${nextChar}"`);
    }
  };

  return (
    <div className="pv-game-grid flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Round', value: `${round} / ${totalRounds}`, tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
          { label: 'Score', value: score, tone: 'success' },
        ]}
      />

      {/* Target Word Slots */}
      <div className="w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-5 sm:p-6 mb-5 flex flex-col items-center">
        <p className="text-xs text-pv-text-secondary mb-4 text-center">
          Unscramble the letters to form the target word.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
          {Array.from({ length: targetWord.length }).map((_, idx) => {
            const char = userGuess[idx] || '';
            return (
              <div
                key={idx}
                className={`w-10 h-12 sm:w-11 sm:h-13 rounded-md border flex items-center justify-center text-xl font-mono font-semibold uppercase select-none transition-colors ${
                  char
                    ? 'bg-pv-surface-secondary border-[#38C6BA] text-pv-text-primary'
                    : 'bg-pv-surface-secondary/40 border-pv-border text-transparent'
                }`}
              >
                {char || '·'}
              </div>
            );
          })}
        </div>

        {hintMsg && (
          <div className="mt-3 p-2 bg-pv-surface-secondary border border-[#38C6BA]/40 text-[#A8E5D5] rounded-md text-xs flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#38C6BA]" />
            <span>{hintMsg}</span>
          </div>
        )}
      </div>

      {/* Scrambled Letter Palette */}
      <div className="pv-game-board flex flex-wrap justify-center gap-2 w-full mb-5">
        {scrambled.map((char, idx) => {
          const isUsed = usedIndices.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handlePickLetter(char, idx)}
              disabled={isUsed}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg border font-mono text-lg font-semibold transition-colors select-none active:translate-y-px ${
                isUsed
                  ? 'bg-pv-surface-primary border-pv-border text-pv-text-muted opacity-30 cursor-not-allowed'
                  : 'bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border-pv-border hover:border-pv-border-strong'
              }`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* Control Actions */}
      <div className="grid grid-cols-4 gap-2 w-full">
        <button
          onClick={handleClear}
          disabled={userGuess.length === 0}
          className="h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
        >
          Clear
        </button>
        <button
          onClick={handleBackspace}
          disabled={userGuess.length === 0}
          className="h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
        >
          <Delete className="w-3.5 h-3.5" /> Del
        </button>
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
        </button>
        <button
          onClick={handleSubmit}
          disabled={userGuess.length !== targetWord.length || isRoundLocked}
          className="h-9 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
        >
          <Check className="w-3.5 h-3.5" /> Submit
        </button>
      </div>
    </div>
  );
};
