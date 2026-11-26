import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Play, Flame, Star, Award } from 'lucide-react';
import { PUZZLE_MODES } from '../data/puzzles';
import { Difficulty } from '../types';
import { PageHeader, Card } from '../components/ui/Card';
import { PuzzleCoverArt } from '../components/PuzzleArt';
import { formatCount } from '../utils/format';

export const DailyPuzzlePage: React.FC = () => {
  const { playGame, user } = useStore();
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
      {/* Header */}
      <PageHeader
        title="Daily Challenge"
        description="Curated daily puzzle selection with bonus XP and streak progression."
        action={
          <div className="bg-[#1C1823] border border-[#342D3D] rounded-lg px-3.5 py-2 flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-[#FF4696]" />
            <span className="text-xs font-medium text-[#F5F3F7]">{todayStr}</span>
          </div>
        }
      />

      {/* Featured Night Violet Architectural Daily Card */}
      <Card surface="featured" padding="none" className="border-[#494052] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#FF4696]/15 border border-[#FF4696]/35 text-[#FF82B8] uppercase tracking-wider">
                  Daily Selection
                </span>
                <span className="text-[11px] font-medium text-[#C5BFD0] uppercase tracking-wider bg-[#16131C] px-2.5 py-0.5 rounded-md border border-[#342D3D]">
                  {todayPuzzle.category}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5F3F7] tracking-tight">
                  {todayPuzzle.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#C5BFD0] mt-1.5 leading-relaxed">
                  {todayPuzzle.description}
                </p>
              </div>

              <div className="bg-[#16131C]/90 border border-[#342D3D] p-3.5 rounded-lg text-xs text-[#C5BFD0]">
                <span className="font-semibold text-[#F5F3F7] block mb-0.5">Objective</span>
                {todayPuzzle.instructions}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Difficulty Tier Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-[#9F97AB] uppercase tracking-wider block">
                  Difficulty Tier
                </span>
                <div className="inline-flex p-1 rounded-lg bg-[#16131C] border border-[#342D3D] gap-1">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-3.5 h-8 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
                        selectedDifficulty === diff
                          ? 'bg-[#FF4696] text-[#110F15] font-semibold'
                          : 'text-[#C5BFD0] hover:text-[#F5F3F7]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reward Callouts */}
              <div className="flex flex-wrap items-center gap-5 text-xs">
                <span className="flex items-center gap-1.5 text-[#FF82B8] font-medium">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>2× XP multiplier</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#34D399] font-medium">
                  <Award className="w-3.5 h-3.5" />
                  <span>+50 bonus coins</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Live Schematic Board Preview & Launch Dock */}
          <div className="lg:col-span-5 bg-[#16131C] border-t lg:border-t-0 lg:border-l border-[#342D3D] flex flex-col justify-between">
            <div className="flex-1 min-h-[190px] bg-[#14111A] border-b border-[#342D3D] flex items-center justify-center overflow-hidden">
              <PuzzleCoverArt type={todayPuzzle.id} className="w-full h-full object-cover" />
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C5BFD0] flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF4696]" /> Current Streak
                </span>
                <span className="font-semibold text-[#F5F3F7] font-tabular">
                  {formatCount(user?.currentStreak || 1, 'day')}
                </span>
              </div>

              <button
                onClick={() => playGame(todayPuzzle.id, selectedDifficulty)}
                className="w-full h-11 bg-[#FF4696] hover:bg-[#E83C86] text-[#110F15] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors pv-keycap cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Daily Puzzle</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
