import React from 'react';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 28,
  showWordmark = true,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="14" fill="#1E1033" />
        <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke="#494052" strokeWidth="2" />
        <rect x="14" y="14" width="16" height="16" rx="4" fill="#FF4696" />
        <rect x="34" y="14" width="16" height="16" rx="4" fill="#F5F3F7" />
        <rect x="14" y="34" width="16" height="16" rx="4" fill="#F5F3F7" />
        <rect x="34" y="34" width="16" height="16" rx="4" fill="#2B2533" stroke="#FF4696" strokeWidth="2.5" />
      </svg>
      {showWordmark && (
        <span className="font-semibold text-[16px] tracking-tight text-[#F5F3F7]">
          PuzzleVerse
        </span>
      )}
    </div>
  );
};
