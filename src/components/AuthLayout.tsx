import React from 'react';
import { BrandLogo } from './BrandLogo';
import { AuthModal } from './AuthModal';
import { PuzzleCoverArt } from './PuzzleArt';

const PREVIEW_MODES = [
  { type: 'laser_mirror' as const, title: 'Laser Mirror', tag: 'Optics' },
  { type: 'block_escape' as const, title: 'Block Escape', tag: 'Spatial' },
  { type: 'word_grid' as const, title: 'Word Grid', tag: 'Lexicon' },
  { type: 'number' as const, title: 'Number Puzzle', tag: 'Arithmetic' },
];

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#110F15] text-[#F5F3F7] font-sans selection:bg-[#FF4696]/30">
      {/* Left Column: Architectural Game Platform Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 pv-stage-surface border-r border-[#342D3D] p-10 xl:p-14 flex-col justify-between">
        <div>
          <BrandLogo size={32} />
        </div>

        <div className="max-w-lg space-y-6">
          <div className="space-y-2.5">
            <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-widest text-[#FF82B8]">
              Tactile Brain Training Platform
            </span>
            <h1 className="text-3xl xl:text-[36px] font-semibold leading-tight text-[#F5F3F7] tracking-tight">
              16 puzzles. One studio to master.
            </h1>
            <p className="text-sm text-[#C5BFD0] leading-relaxed">
              Play curated logic, optical, sliding, memory, and lexicon challenges with daily seeds and live progression.
            </p>
          </div>

          {/* Live 2x2 Procedural Game Cover Showcase */}
          <div className="grid grid-cols-2 gap-3 pt-2" aria-hidden="true">
            {PREVIEW_MODES.map((item) => (
              <div
                key={item.type}
                className="rounded-xl bg-[#16131C] border border-[#342D3D] overflow-hidden"
              >
                <div className="h-24 border-b border-[#342D3D]">
                  <PuzzleCoverArt type={item.type} />
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F5F3F7]">{item.title}</span>
                  <span className="text-[10px] font-mono uppercase text-[#9F97AB]">{item.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#9F97AB]">
          Synced profiles preserve personal bests, mastery levels, and daily streaks.
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
        <div className="lg:hidden mb-8">
          <BrandLogo size={30} />
        </div>
        <div className="w-full max-w-[420px]">
          <AuthModal onClose={() => {}} hideClose={true} isLayout={true} />
        </div>
      </div>
    </div>
  );
};
