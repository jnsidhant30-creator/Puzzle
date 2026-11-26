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
        <rect width="64" height="64" rx="14" fill="#142331" />
        <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke="#36515F" strokeWidth="2" />
        <path
          d="M18 22H26C26 19.2 28.2 17 31 17C33.8 17 36 19.2 36 22H44C45.7 22 47 23.3 47 25V33C49.8 33 52 35.2 52 38C52 40.8 49.8 43 47 43V47C47 48.7 45.7 50 44 50H18C16.3 50 15 48.7 15 47V25C15 23.3 16.3 22 18 22Z"
          fill="#38C6BA"
        />
        <rect x="21" y="29" width="8" height="8" rx="2" fill="#F5F2E9" />
        <rect x="33" y="29" width="8" height="8" rx="2" fill="#142331" />
        <rect x="21" y="40" width="8" height="5" rx="1.5" fill="#A8E5D5" />
      </svg>
      {showWordmark && (
        <span className="font-bold text-[17px] tracking-tight text-[#F5F7F8]">
          PuzzleVerse
        </span>
      )}
    </div>
  );
};
