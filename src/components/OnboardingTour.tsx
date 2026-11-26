import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

export const OnboardingTour: React.FC = () => {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const tourDone = localStorage.getItem('pv_onboarding_done');
    if (!tourDone) {
      setStep(0);
    }
  }, []);

  if (step === null) return null;

  const steps = [
    {
      title: 'Welcome to PuzzleVerse',
      description:
        'A dedicated platform of 16 handcrafted puzzle modes, daily challenges, and competitive community leaderboards.',
    },
    {
      title: 'Explore 16 unique games',
      description:
        'Choose from logic deduction, spatial navigation, pattern recognition, and arithmetic puzzles with adaptive difficulty tiers.',
    },
    {
      title: 'Compete and track progress',
      description:
        'Earn mastery ranks, maintain daily streaks, challenge other players in real-time rooms, and compare records on the global leaderboard.',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('pv_onboarding_done', 'true');
    setStep(null);
  };

  const current = steps[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-pv-border bg-pv-surface-primary p-6 shadow-lg text-pv-text-primary relative">
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-pv-dragon-fruit mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Platform Overview ({step + 1} of {steps.length})
          </span>
        </div>

        <h3 id="onboarding-title" className="text-xl font-semibold text-pv-text-primary mb-2">
          {current.title}
        </h3>
        <p className="text-xs text-pv-text-secondary leading-relaxed mb-6">
          {current.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-pv-border">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === step ? 'w-5 bg-pv-dragon-fruit' : 'w-1.5 bg-pv-surface-secondary border border-pv-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleComplete}
              className="px-3 h-8 text-xs font-medium text-pv-text-secondary hover:text-pv-text-primary transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3.5 h-8 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] rounded-lg text-xs font-semibold transition-colors"
            >
              {step === steps.length - 1 ? (
                <>
                  Start Playing <Check className="w-3.5 h-3.5" />
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
