import React, { useState, useEffect, useRef } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { GameHudBar } from '../components/ui/GameHudBar';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

export const ChallengeMode: React.FC<Props> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const deadlineRef = useRef<number>(Date.now() + 30000);
  const [currentMath, setCurrentMath] = useState({ n1: 0, n2: 0, op: '+', ans: 0, opts: [0] });

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
        finishedRef.current
      ) {
        return;
      }
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1 && currentMath.opts[idx] !== undefined) {
        e.preventDefault();
        handlePickAnswer(currentMath.opts[idx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMath, streak]);

  useEffect(() => {
    generateMiniTask();
    deadlineRef.current = Date.now() + 30000;

    const syncCountdown = () => {
      if (finishedRef.current) return;
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finishedRef.current = true;
        setIsFinished(true);
        sound.playSuccess();
        onComplete(scoreRef.current, 30, true);
      }
    };

    const interval = setInterval(syncCountdown, 250);
    const handleVisibility = () => {
      if (!document.hidden) syncCountdown();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const generateMiniTask = () => {
    const n1 = Math.floor(Math.random() * 20) + 1;
    const n2 = Math.floor(Math.random() * 20) + 1;
    const op = Math.random() > 0.5 ? '+' : '-';
    const ans = op === '+' ? n1 + n2 : n1 - n2;
    const optsSet = new Set<number>();
    optsSet.add(ans);
    while (optsSet.size < 4) {
      const wrong = ans + (Math.floor(Math.random() * 6) + 1) * (Math.random() > 0.5 ? 1 : -1);
      optsSet.add(wrong);
    }
    setCurrentMath({
      n1,
      n2,
      op,
      ans,
      opts: Array.from(optsSet).sort(() => Math.random() - 0.5),
    });
  };

  const handlePickAnswer = (val: number) => {
    if (finishedRef.current) return;
    if (val === currentMath.ans) {
      sound.playSuccess();
      const newStreak = streak + 1;
      const points = 100 * newStreak;
      scoreRef.current += points;
      setScore(scoreRef.current);
      setStreak(newStreak);
      const now = Date.now();
      const cappedEnd = Math.min(now + 45000, deadlineRef.current + 2000);
      deadlineRef.current = cappedEnd;
      setTimeLeft(Math.max(1, Math.ceil((cappedEnd - now) / 1000)));
      generateMiniTask();
    } else {
      sound.playError();
      setStreak(0);
      generateMiniTask();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Streak', value: `${streak}x`, tone: streak >= 3 ? 'accent' : 'default' },
          { label: 'Time Left', value: `${timeLeft}s`, tone: timeLeft <= 5 ? 'warning' : 'default' },
          { label: 'Score', value: score, tone: 'success' },
        ]}
      />

      {/* Equation Card */}
      <div className="w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-6 sm:p-8 mb-5 flex flex-col items-center">
        <p className="text-xs font-semibold text-[#A8E5D5] mb-4">
          Solve Equation
        </p>
        <div className="text-4xl sm:text-5xl font-semibold text-[#F5F7F8] font-tabular tracking-tight my-2">
          {currentMath.n1} {currentMath.op} {currentMath.n2} = ?
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {currentMath.opts.map((opt, idx) => (
          <button
            key={idx}
            disabled={isFinished}
            onClick={() => handlePickAnswer(opt)}
            className="h-16 bg-[#233D4A] hover:bg-[#2C4654] text-[#F5F7F8] font-semibold text-2xl font-tabular rounded-xl border border-[#36515F] hover:border-[#38C6BA] transition-colors pv-keycap select-none disabled:opacity-50 cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
