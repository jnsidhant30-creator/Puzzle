import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Award, Coins } from 'lucide-react';
import { Button } from './ui/Button';

export const LevelUpModal: React.FC = () => {
  const { levelUpModal, closeLevelUpModal, user } = useStore();

  useEffect(() => {
    if (!levelUpModal?.show) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(user?.preferences?.reduceAnimations));
    if (prefersReducedMotion) return;

    import('canvas-confetti')
      .then((mod) => {
        mod.default({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#38C6BA', '#A8E5D5', '#93D1F2', '#F5F2E9'],
        });
      })
      .catch(() => {});
  }, [levelUpModal, user?.preferences?.reduceAnimations]);

  useEffect(() => {
    if (!levelUpModal?.show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLevelUpModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [levelUpModal, closeLevelUpModal]);

  if (!levelUpModal?.show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    >
      <div className="bg-[#233D4A] border border-[#4A6A7B] rounded-xl p-6 max-w-sm w-full text-center relative">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#1C2D3B] border border-[#36515F] flex items-center justify-center">
          <Award className="w-7 h-7 text-[#38C6BA]" />
        </div>

        <p className="text-xs font-semibold text-[#A8E5D5] mb-1">
          New level unlocked
        </p>
        <h2 id="level-up-title" className="text-2xl font-bold text-[#F5F7F8] mb-1">
          Level {levelUpModal.newLevel} Reached
        </h2>
        <p className="text-sm text-[#B4C3CE] mb-5">
          Bonus coins have been added to your account.
        </p>

        <div className="bg-[#1C2D3B] border border-[#36515F] rounded-lg p-3 mb-5 flex items-center justify-center gap-2 text-[#F5F7F8] text-sm font-semibold">
          <Coins className="w-4 h-4 text-[#38C6BA]" />
          <span>+{levelUpModal.coinsAwarded} bonus coins</span>
        </div>

        <Button onClick={closeLevelUpModal} variant="primary" size="md" className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
};
