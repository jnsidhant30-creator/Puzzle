import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Play, Flame, Star, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { PUZZLE_MODES } from '../data/puzzles';
import { Difficulty } from '../types';

export const DailyPuzzlePage: React.FC = () => {
  const { playGame, user } = useStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Deterministically select today's puzzle based on day of year
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000
  );
  const eligibleModes = PUZZLE_MODES.filter((p) => p.id !== 'challenge_mode');
  const todayPuzzle = eligibleModes[dayOfYear % eligibleModes.length] || eligibleModes[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Daily Header Banner */}
      <div className="relative overflow-hidden bg-pv-surface-secondary border border-pv-border-strong rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-primary-btn/20 border border-pv-border-strong text-pv-dragon-fruit-light px-3.5 py-1 rounded-full text-xs font-bold mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayStr}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide mb-2">
              Daily Brain Challenge
            </h1>
            <p className="text-xs sm:text-sm text-pv-text-secondary max-w-lg leading-relaxed">
              Complete today's specially curated challenge for 2x Bonus XP, +50 Bonus Coins, and to maintain your daily streak!
            </p>
          </div>

          <div className="bg-pv-bg-secondary/90 border border-pv-border-violet p-5 rounded-2xl text-center w-full sm:w-auto shrink-0">
            <p className="text-[10px] text-pv-text-muted font-bold uppercase tracking-wider mb-1">
              Active Streak
            </p>
            <p className="text-3xl font-black text-pv-dragon-fruit-light flex items-center justify-center gap-1.5 font-mono">
              <Flame className="w-6 h-6 fill-pv-dragon-fruit text-pv-dragon-fruit" />
              <span>{user?.currentStreak || 1} Days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Featured Daily Puzzle Card */}
      <div className="bg-pv-surface-primary border border-pv-border-violet rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-lg bg-pv-surface-secondary text-pv-dragon-fruit-light border border-pv-border-strong shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today's Curated Mode</span>
            </span>
            <span className="text-xs font-bold text-pv-text-secondary uppercase tracking-wider bg-pv-bg-primary px-2.5 py-1 rounded-lg border border-pv-border-violet">
              {todayPuzzle.category}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{todayPuzzle.name}</h2>
            <p className="text-xs sm:text-sm text-pv-text-secondary mt-1.5 leading-relaxed">
              {todayPuzzle.description}
            </p>
          </div>

          <div className="bg-pv-bg-primary/80 border border-pv-border-violet p-3.5 rounded-2xl text-xs text-pv-text-secondary">
            <span className="font-bold text-white block mb-0.5">Objective:</span>
            {todayPuzzle.instructions}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-pv-text-secondary uppercase tracking-wider">
              Select Difficulty Mode
            </span>
            <div className="grid grid-cols-3 gap-2 max-w-xs">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition border ${
                    selectedDifficulty === diff
                      ? 'bg-gradient-primary-btn text-pv-bg-primary border-pv-border-strong font-black shadow-sm'
                      : 'bg-pv-bg-primary text-pv-text-secondary border-pv-border-violet hover:text-white hover:border-pv-border-strong'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold pt-1">
            <span className="flex items-center gap-1.5 text-pv-dragon-fruit-light">
              <Star className="w-4 h-4 fill-pv-dragon-fruit" />
              <span>2x XP Multiplier</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Award className="w-4 h-4" />
              <span>+50 Bonus Coins</span>
            </span>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-3">
          <button
            onClick={() => playGame(todayPuzzle.id, selectedDifficulty)}
            className="w-full sm:w-auto bg-gradient-primary-btn hover:bg-pv-dragon-fruit-light text-pv-bg-primary font-black px-10 py-5 rounded-2xl shadow-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2.5 transition active:scale-95"
          >
            <Play className="w-5 h-5 fill-pv-bg-primary" />
            <span>Launch Daily Puzzle</span>
          </button>
          <span className="text-[11px] text-pv-text-muted font-medium">
            Standard scoring & streak rules apply
          </span>
        </div>
      </div>
    </div>
  );
};
