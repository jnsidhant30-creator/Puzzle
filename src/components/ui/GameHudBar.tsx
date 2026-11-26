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
  default: 'text-[#F5F7F8]',
  accent: 'text-[#38C6BA]',
  success: 'text-[#6EE7B7]',
  warning: 'text-[#FCD34D]',
};

export const GameHudBar: React.FC<GameHudBarProps> = ({ items, className = '' }) => {
  const colsClass =
    items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div
      className={`grid ${colsClass} w-full bg-[#1C2D3B] border border-[#36515F] rounded-xl divide-x divide-[#36515F] overflow-hidden mb-5 ${className}`}
    >
      {items.map((item, idx) => (
        <div key={idx} className="px-2.5 sm:px-4 py-2.5 text-center min-w-0">
          <p className="text-[11px] text-[#B4C3CE] font-semibold truncate">
            {item.label}
          </p>
          <p
            className={`text-sm sm:text-base font-bold font-tabular truncate mt-0.5 ${
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
