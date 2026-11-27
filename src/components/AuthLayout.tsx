import React from 'react';
import { BrandLogo } from './BrandLogo';
import { AuthModal } from './AuthModal';
import { PuzzleCoverArt } from './PuzzleArt';
import { Download } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const PREVIEW_MODES = [
  { type: 'laser_mirror' as const, title: 'Laser Mirror', tag: 'Spatial' },
  { type: 'block_escape' as const, title: 'Block Escape', tag: 'Logic' },
  { type: 'word_grid' as const, title: 'Word Grid', tag: 'Words' },
  { type: 'number_path' as const, title: 'Number Path', tag: 'Math' },
];

interface AuthLayoutProps {
  onOpenDownload?: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ onOpenDownload }) => {
  const isNativeContainer = Boolean(window.puzzleverseDesktop?.isDesktop) || Capacitor.isNativePlatform();

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#142331] text-[#F5F7F8] font-sans selection:bg-[#38C6BA]/30 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Left Column: Puzzle Game Visual Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1C2D3B] border-r border-[#36515F] p-10 xl:p-14 flex-col justify-between">
        <div className="flex items-center justify-between">
          <BrandLogo size={34} />
          {!isNativeContainer && onOpenDownload && (
            <button
              type="button"
              onClick={onOpenDownload}
              className="px-3 py-1.5 rounded-lg bg-[#233D4A] hover:bg-[#2C4654] border border-[#36515F] text-xs font-bold text-[#A8E5D5] inline-flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Apps</span>
            </button>
          )}
        </div>

        <div className="max-w-lg space-y-6">
          <div className="space-y-3">
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-[#233D4A] border border-[#36515F] text-[#A8E5D5]">
              16 Handcrafted Puzzle Games
            </span>
            <h1 className="text-3xl xl:text-[36px] font-extrabold leading-tight text-[#F5F7F8] tracking-tight">
              Pick a puzzle and start playing.
            </h1>
            <p className="text-sm sm:text-base text-[#B4C3CE] leading-relaxed">
              Enjoy logic, word, memory, math, and spatial puzzles plus a fresh daily puzzle every day.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2" aria-hidden="true">
            {PREVIEW_MODES.map((item) => (
              <div
                key={item.type}
                className="rounded-xl bg-[#F5F2E9] border border-[#D5DEDB] overflow-hidden"
              >
                <div className="h-24 border-b border-[#D5DEDB]">
                  <PuzzleCoverArt type={item.type} variant="light" />
                </div>
                <div className="px-3 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#142331]">{item.title}</span>
                  <span className="text-[11px] font-semibold text-[#066B75]">{item.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#B4C3CE]">
          Save your scores, level progress, and personal bests across Windows, macOS, Linux, Mobile, and Web.
        </div>
      </div>

      {/* Right Column: Clean Sign-In Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
        <div className="lg:hidden mb-6 flex items-center justify-between w-full max-w-[420px]">
          <BrandLogo size={32} />
          {!isNativeContainer && onOpenDownload && (
            <button
              type="button"
              onClick={onOpenDownload}
              className="px-2.5 py-1.5 rounded-lg bg-[#233D4A] border border-[#36515F] text-xs font-bold text-[#A8E5D5] inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get Apps</span>
            </button>
          )}
        </div>
        <div className="w-full max-w-[420px]">
          <AuthModal onClose={() => {}} hideClose={true} isLayout={true} onOpenDownload={onOpenDownload} />
        </div>
      </div>
    </div>
  );
};
