import React from 'react';

export interface HudMetric {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning';
}

interface GameHudBarProps {
  items: HudMetric[];
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<HudMetric['tone']>, string> = {
  default: 'text-[#F5F3F7]',
  accent: 'text-[#FF82B8]',
  success: 'text-[#34D399]',
  warning: 'text-[#FBBF24]',
};

export const GameHudBar: React.FC<GameHudBarProps> = ({ items, className = '' }) => {
  const colsClass =
    items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div
      className={`grid ${colsClass} w-full bg-[#1C1823] border border-[#342D3D] rounded-xl divide-x divide-[#342D3D] overflow-hidden mb-5 ${className}`}
    >
      {items.map((item, idx) => (
        <div key={idx} className="px-2.5 sm:px-4 py-2.5 text-center min-w-0">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#9F97AB] font-medium truncate">
            {item.label}
          </p>
          <p
            className={`text-sm sm:text-base font-semibold font-tabular truncate mt-0.5 ${
              TONE_CLASSES[item.tone || 'default']
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};
