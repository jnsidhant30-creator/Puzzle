import React, { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

interface OnboardingTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

/**
 * Manual-only orientation dialog. Never auto-interrupts players after login
 * so the player lands directly on the dashboard ready to play.
 */
export const OnboardingTour: React.FC<OnboardingTourProps> = ({ forceOpen = false, onClose }) => {
  const [step, setStep] = useState<number>(0);

  if (!forceOpen) return null;

  const steps = [
    {
      title: 'Welcome to PuzzleVerse',
      description:
        'Pick from 16 handcrafted logic, word, memory, and spatial puzzles plus a fresh daily puzzle every day.',
    },
    {
      title: 'Play at your own pace',
      description:
        'Choose Easy, Medium, or Hard tiers anytime, use hints when stuck, and save personal records automatically.',
    },
  ];

  const handleClose = () => {
    localStorage.setItem('pv_onboarding_done', 'true');
    setStep(0);
    onClose?.();
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = steps[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-[#36515F] bg-[#233D4A] p-6 text-[#F5F7F8] relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#2C4654] transition-colors"
          aria-label="Close guide"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-xs font-semibold text-[#A8E5D5] mb-2">
          Quick Guide ({step + 1} of {steps.length})
        </p>

        <h3 id="onboarding-title" className="text-xl font-bold text-[#F5F7F8] mb-2">
          {current.title}
        </h3>
        <p className="text-sm text-[#B4C3CE] leading-relaxed mb-6">
          {current.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-[#36515F]">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-sm transition-all duration-150 ${
                  i === step ? 'w-5 bg-[#38C6BA]' : 'w-2 bg-[#1C2D3B] border border-[#36515F]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-3 h-9 text-xs font-semibold text-[#B4C3CE] hover:text-[#F5F7F8] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 h-9 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] rounded-lg text-xs font-semibold transition-colors"
            >
              {step === steps.length - 1 ? (
                <>
                  Done <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
