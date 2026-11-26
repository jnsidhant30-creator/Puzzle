import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Award, Coins } from 'lucide-react';

export const LevelUpModal: React.FC = () => {
  const { levelUpModal, closeLevelUpModal } = useStore();

  useEffect(() => {
    if (levelUpModal?.show) {
      import('canvas-confetti')
        .then((mod) => {
          mod.default({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
        })
        .catch(() => {});
    }
  }, [levelUpModal]);

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
      <div className="bg-pv-surface-primary border border-pv-border rounded-xl p-6 max-w-sm w-full text-center shadow-lg relative">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-pv-surface-secondary border border-pv-border flex items-center justify-center">
          <Award className="w-7 h-7 text-pv-dragon-fruit" />
        </div>

        <p className="text-xs uppercase tracking-wider text-pv-text-muted font-medium mb-1">
          Account Progression
        </p>
        <h2 id="level-up-title" className="text-2xl font-semibold text-pv-text-primary mb-1">
          Level {levelUpModal.newLevel} Reached
        </h2>
        <p className="text-xs text-pv-text-secondary mb-5">
          You have achieved a new account tier. Bonus coins have been deposited into your balance.
        </p>

        <div className="bg-pv-surface-secondary border border-pv-border rounded-lg p-3 mb-5 flex items-center justify-center gap-2 text-pv-text-primary text-xs font-medium">
          <Coins className="w-4 h-4 text-pv-dragon-fruit" />
          <span>+100 bonus coins awarded</span>
        </div>

        <button
          onClick={closeLevelUpModal}
          className="w-full h-10 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] text-sm font-semibold rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
