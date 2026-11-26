import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Play, Flame, Star, Award, WifiOff } from 'lucide-react';
import { PUZZLE_MODES } from '../data/puzzles';
import { Difficulty } from '../types';
import { PageHeader, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PuzzleCoverArt } from '../components/PuzzleArt';
import { formatCount } from '../utils/format';

export const DailyPuzzlePage: React.FC = () => {
  const { playGame, user, isOnline, isGuest } = useStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000
  );
  const eligibleModes = PUZZLE_MODES.filter((p) => p.id !== 'challenge_mode');
  const todayPuzzle = eligibleModes[dayOfYear % eligibleModes.length] || eligibleModes[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="Daily Puzzle"
        description="A fresh puzzle chosen every day with bonus XP and coins."
        action={
          <div className="bg-[#1C2D3B] border border-[#36515F] rounded-lg px-3.5 py-2 flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-[#38C6BA]" />
            <span className="text-xs font-semibold text-[#F5F7F8]">{todayStr}</span>
          </div>
        }
      />

      {(!isOnline || isGuest) && (
        <Card surface="primary" padding="md" className="border-[#F59E0B]/40 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-[#FBBF24] shrink-0" />
          <p className="text-xs sm:text-sm text-[#B4C3CE]">
            {!isOnline
              ? 'Offline Mode: you can practice today’s puzzle locally, but cloud streak sync and global rankings require an internet connection.'
              : 'Guest Practice Mode: sign in with a PuzzleVerse account online to record verified Daily Puzzle streaks.'}
          </p>
        </Card>
      )}

      <Card surface="ivory" padding="none" className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#D7F1EC] border border-[#087F8C] text-[#142331]">
                  Today&apos;s Pick
                </span>
                <span className="text-xs font-semibold text-[#526575] bg-[#E9EEE8] px-2.5 py-0.5 rounded-md border border-[#D5DEDB]">
                  {todayPuzzle.category === 'Spatial & Grid' ? 'Spatial' : todayPuzzle.category}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142331] tracking-tight">
                  {todayPuzzle.name}
                </h2>
                <p className="text-sm text-[#526575] mt-1.5 leading-relaxed">
                  {todayPuzzle.description}
                </p>
              </div>

              <div className="bg-[#E9EEE8] border border-[#D5DEDB] p-3.5 rounded-lg text-xs sm:text-sm text-[#142331]">
                <span className="font-bold block mb-0.5">How to solve</span>
                <span className="text-[#526575]">{todayPuzzle.instructions}</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#142331] block">
                  Choose Difficulty
                </span>
                <div className="inline-flex p-1 rounded-lg bg-[#E9EEE8] border border-[#D5DEDB] gap-1">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-3.5 h-8 rounded-md text-xs font-bold capitalize transition-colors ${
                        selectedDifficulty === diff
                          ? 'bg-[#087F8C] text-[#FFFFFF]'
                          : 'text-[#526575] hover:text-[#142331]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[#066B75]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>2x XP multiplier</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#065F46]">
                  <Award className="w-3.5 h-3.5" />
                  <span>+50 bonus coins</span>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#233D4A] border-t lg:border-t-0 lg:border-l border-[#36515F] flex flex-col justify-between text-[#F5F7F8]">
            <div className="flex-1 min-h-[190px] bg-[#E9EEE8] border-b border-[#36515F] flex items-center justify-center overflow-hidden">
              <PuzzleCoverArt type={todayPuzzle.id} variant="light" className="w-full h-full object-cover" />
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#B4C3CE] flex items-center gap-1.5 font-semibold">
                  <Flame className="w-4 h-4 text-[#38C6BA]" /> Current Streak
                </span>
                <span className="font-bold text-[#F5F7F8] font-tabular">
                  {formatCount(user?.currentStreak || 1, 'day')}
                </span>
              </div>

              <Button
                onClick={() => playGame(todayPuzzle.id, selectedDifficulty, undefined, true)}
                variant="accent"
                size="lg"
                className="w-full"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Today</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
