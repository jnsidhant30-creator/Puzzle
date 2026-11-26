import React from 'react';
import { PuzzleType } from '../types';

interface PuzzleArtProps {
  type: PuzzleType;
  size?: number;
  className?: string;
}

export const PuzzleArt: React.FC<PuzzleArtProps> = ({
  type,
  size = 24,
  className = '',
}) => {
  const strokeMain = '#93D1F2';
  const accent = '#38C6BA';
  const light = '#F5F2E9';

  switch (type) {
    case 'number':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={accent} strokeWidth="1.75" />
          <path d="M7 5.5V8.5M5.5 7H8.5M15.5 17H18.5" stroke={light} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'word':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="2.5" y="6" width="5.5" height="12" rx="1.5" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="9.25" y="4" width="5.5" height="12" rx="1.5" stroke={accent} strokeWidth="1.75" />
          <rect x="16" y="7" width="5.5" height="12" rx="1.5" stroke={strokeMain} strokeWidth="1.75" />
          <path d="M11 10H13" stroke={light} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'memory':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="4" width="11" height="14" rx="2" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="10" y="6" width="11" height="14" rx="2" fill="#233D4A" stroke={accent} strokeWidth="1.75" />
          <circle cx="15.5" cy="13" r="2" fill={accent} />
        </svg>
      );

    case 'sliding':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" stroke={strokeMain} strokeWidth="1.6" />
          <rect x="9.25" y="3" width="5.5" height="5.5" rx="1.2" stroke={strokeMain} strokeWidth="1.6" />
          <rect x="15.5" y="3" width="5.5" height="5.5" rx="1.2" stroke={strokeMain} strokeWidth="1.6" />
          <rect x="3" y="9.25" width="5.5" height="5.5" rx="1.2" stroke={strokeMain} strokeWidth="1.6" />
          <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1.2" stroke={accent} strokeWidth="1.6" />
          <rect x="3" y="15.5" width="5.5" height="5.5" rx="1.2" stroke={strokeMain} strokeWidth="1.6" />
          <rect x="9.25" y="15.5" width="5.5" height="5.5" rx="1.2" stroke={strokeMain} strokeWidth="1.6" />
          <rect x="15.5" y="15.5" width="5.5" height="5.5" rx="1.2" stroke={strokeMain} strokeWidth="1.6" />
        </svg>
      );

    case 'logic':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="7" cy="7" r="3" stroke={strokeMain} strokeWidth="1.75" />
          <circle cx="17" cy="7" r="3" stroke={accent} strokeWidth="1.75" />
          <circle cx="12" cy="17" r="3" stroke={light} strokeWidth="1.75" />
          <path d="M9.5 8.5L11 14M14.5 8.5L13 14" stroke={strokeMain} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'pattern':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="2.5" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="15" y="4" width="5" height="5" rx="1" stroke={strokeMain} strokeWidth="1.75" />
          <polygon points="6.5,14.5 9.5,20 3.5,20" stroke={strokeMain} strokeWidth="1.75" strokeLinejoin="round" />
          <rect x="14.5" y="14.5" width="6" height="6" rx="1.2" stroke={accent} strokeWidth="1.75" strokeDasharray="2 2" />
        </svg>
      );

    case 'pipe':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 8H12V16H20" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="8" r="2" fill={light} />
          <circle cx="20" cy="16" r="2" fill={accent} />
          <path d="M12 4V6M12 18V20" stroke={strokeMain} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );

    case 'color_path':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M5 6H12V18H19" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 18H8V12H16V6H19" stroke={strokeMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5" cy="6" r="2.2" fill={accent} />
          <circle cx="19" cy="18" r="2.2" fill={accent} />
          <circle cx="5" cy="18" r="2" fill={light} />
          <circle cx="19" cy="6" r="2" fill={light} />
        </svg>
      );

    case 'block_escape':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="3" width="16" height="18" rx="2" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="5.5" y="10" width="8" height="4" rx="1" fill={accent} />
          <rect x="14.5" y="5.5" width="2.5" height="6" rx="0.8" fill={strokeMain} />
          <path d="M19 12H22M20.5 10L22.5 12L20.5 14" stroke={light} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'number_path':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M5 18L10 12L14 14L19 6" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5" cy="18" r="2.2" fill={light} />
          <circle cx="10" cy="12" r="2.2" fill={strokeMain} />
          <circle cx="14" cy="14" r="2.2" fill={strokeMain} />
          <circle cx="19" cy="6" r="2.2" fill={accent} />
        </svg>
      );

    case 'rotating_tiles':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" rx="1.2" stroke={strokeMain} strokeWidth="1.75" />
          <rect x="13" y="4" width="7" height="7" rx="1.2" stroke={accent} strokeWidth="1.75" />
          <rect x="4" y="13" width="7" height="7" rx="1.2" stroke={strokeMain} strokeWidth="1.75" />
          <path d="M16.5 14A3 3 0 1 1 13.5 17" stroke={light} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M16.5 12.5V15H19" stroke={light} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'word_grid':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke={strokeMain} strokeWidth="1.75" />
          <path d="M9 3V21M15 3V21M3 9H21M3 15H21" stroke={strokeMain} strokeWidth="1.4" />
          <line x1="5.5" y1="6" x2="18.5" y2="18" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'arrow_path':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M5 7H11M9 5L11 7L9 9" stroke={strokeMain} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 5V11M13 9L15 11L17 9" stroke={accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 17H19M17 15L19 17L17 19" stroke={light} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 13V18M5 16L7 18L9 16" stroke={strokeMain} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'maze_escape':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M3 4H21V20H3V4Z" stroke={strokeMain} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M8 4V11H13M16 4V15H9V20M3 15H6" stroke={strokeMain} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5.5" cy="7.5" r="1.5" fill={accent} />
          <rect x="17.5" y="16.5" width="2" height="2" fill={light} />
        </svg>
      );

    case 'laser_mirror':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 18H16V6" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <line x1="13" y1="21" x2="19" y2="15" stroke={light} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="4" cy="18" r="2" fill={strokeMain} />
          <polygon points="16,3.5 18.5,6 16,8.5 13.5,6" fill={accent} />
        </svg>
      );

    case 'challenge_mode':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="13" r="8" stroke={strokeMain} strokeWidth="1.75" />
          <path d="M12 9V13L15 15" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 3H14.5" stroke={light} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
  }
};

export const PUZZLE_CATEGORY_ACCENT: Record<string, { hex: string; border: string; badge: string; badgeLight: string }> = {
  Math: {
    hex: '#93D1F2',
    border: 'border-[#93D1F2]/40',
    badge: 'text-[#93D1F2] bg-[#1C2D3B] border-[#93D1F2]/35',
    badgeLight: 'text-[#142331] bg-[#DCEEF8] border-[#93D1F2]',
  },
  Words: {
    hex: '#A8E5D5',
    border: 'border-[#A8E5D5]/40',
    badge: 'text-[#A8E5D5] bg-[#1C2D3B] border-[#A8E5D5]/35',
    badgeLight: 'text-[#142331] bg-[#DCF3EB] border-[#38C6BA]',
  },
  Memory: {
    hex: '#38C6BA',
    border: 'border-[#38C6BA]/40',
    badge: 'text-[#38C6BA] bg-[#1C2D3B] border-[#38C6BA]/40',
    badgeLight: 'text-[#142331] bg-[#D7F0EE] border-[#087F8C]',
  },
  Logic: {
    hex: '#F59E0B',
    border: 'border-[#F59E0B]/40',
    badge: 'text-[#FCD34D] bg-[#1C2D3B] border-[#F59E0B]/35',
    badgeLight: 'text-[#142331] bg-[#FDEFD5] border-[#D97706]',
  },
  'Spatial & Grid': {
    hex: '#38C6BA',
    border: 'border-[#38C6BA]/45',
    badge: 'text-[#A8E5D5] bg-[#087F8C]/25 border-[#38C6BA]/45',
    badgeLight: 'text-[#142331] bg-[#D6F1EC] border-[#087F8C]',
  },
  Challenge: {
    hex: '#EF6C57',
    border: 'border-[#EF6C57]/45',
    badge: 'text-[#FCA5A5] bg-[#1C2D3B] border-[#EF6C57]/40',
    badgeLight: 'text-[#142331] bg-[#FCE5DF] border-[#E0523D]',
  },
};

interface PuzzleCoverArtProps {
  type: PuzzleType;
  variant?: 'dark' | 'light';
  className?: string;
}

export const PuzzleCoverArt: React.FC<PuzzleCoverArtProps> = ({
  type,
  variant = 'dark',
  className = '',
}) => {
  const isLight = variant === 'light';
  const bg = isLight ? '#E9EEE8' : '#101E2B';
  const gridLine = isLight ? '#D5DEDB' : '#213849';
  const tileBg = isLight ? '#FFFFFF' : '#233D4A';
  const tileBorder = isLight ? '#B4C3CE' : '#36515F';
  const ink = isLight ? '#142331' : '#F5F7F8';
  const muted = isLight ? '#526575' : '#98AAB8';
  const accent = isLight ? '#087F8C' : '#38C6BA';
  const mint = isLight ? '#38C6BA' : '#A8E5D5';
  const sky = isLight ? '#2B7AB3' : '#93D1F2';
  const highlightBg = isLight ? '#D7F1EC' : '#1C2D3B';
  const gold = '#F59E0B';
  const coral = '#EF6C57';

  const renderScene = () => {
    switch (type) {
      case 'number':
        return (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${44 + i * 50}, 36)`}>
                <rect
                  width="38"
                  height="48"
                  rx="7"
                  fill={i === 1 ? highlightBg : tileBg}
                  stroke={i === 1 ? accent : tileBorder}
                  strokeWidth="2"
                />
                <text
                  x="19"
                  y="30"
                  textAnchor="middle"
                  fill={i === 1 ? accent : ink}
                  fontSize="17"
                  fontFamily="sans-serif"
                  fontWeight="800"
                >
                  {['7', '+', '9', '16'][i]}
                </text>
              </g>
            ))}
            <text x="140" y="108" textAnchor="middle" fill={muted} fontSize="11" fontFamily="sans-serif" fontWeight="700">
              SOLVE EQUATION
            </text>
          </g>
        );
      case 'word':
        return (
          <g>
            {['W', 'O', 'R', 'D'].map((ch, idx) => (
              <g key={idx} transform={`translate(${54 + idx * 44}, ${idx % 2 === 0 ? 38 : 30})`}>
                <rect
                  width="36"
                  height="42"
                  rx="7"
                  fill={idx === 1 ? highlightBg : tileBg}
                  stroke={idx === 1 ? accent : tileBorder}
                  strokeWidth="2"
                />
                <text
                  x="18"
                  y="27"
                  textAnchor="middle"
                  fill={idx === 1 ? accent : ink}
                  fontSize="17"
                  fontFamily="sans-serif"
                  fontWeight="800"
                >
                  {ch}
                </text>
              </g>
            ))}
            <rect x="64" y="96" width="152" height="6" rx="3" fill={tileBorder} />
            <rect x="64" y="96" width="96" height="6" rx="3" fill={accent} />
          </g>
        );
      case 'memory':
        return (
          <g transform="translate(52, 24)">
            {[0, 1, 2, 3].map((r) => (
              <rect
                key={r}
                x={(r % 2) * 92}
                y={Math.floor(r / 2) * 46}
                width="82"
                height="38"
                rx="7"
                fill={r === 0 || r === 3 ? highlightBg : tileBg}
                stroke={r === 0 || r === 3 ? accent : tileBorder}
                strokeWidth="2"
              />
            ))}
            <circle cx="41" cy="19" r="9" fill={sky} />
            <circle cx="133" cy="65" r="9" fill={accent} />
            <polygon points="133,12 141,26 125,26" fill={gold} />
            <polygon points="41,58 49,72 33,72" fill={gold} />
          </g>
        );
      case 'sliding':
        return (
          <g transform="translate(86, 16)">
            <rect width="108" height="108" rx="9" fill={isLight ? '#DDE6E2' : '#142331'} stroke={tileBorder} strokeWidth="2" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const isMoved = n === 8;
              return (
                <g key={n} transform={`translate(${8 + col * 32}, ${8 + row * 32})`}>
                  <rect
                    width="28"
                    height="28"
                    rx="5"
                    fill={isMoved ? accent : tileBg}
                    stroke={isMoved ? accent : tileBorder}
                    strokeWidth="1.5"
                  />
                  <text
                    x="14"
                    y="19"
                    textAnchor="middle"
                    fill={isMoved ? '#FFFFFF' : ink}
                    fontSize="13"
                    fontFamily="sans-serif"
                    fontWeight="800"
                  >
                    {n}
                  </text>
                </g>
              );
            })}
            <rect x="72" y="72" width="28" height="28" rx="5" fill="none" stroke={muted} strokeWidth="1.5" strokeDasharray="3 3" />
          </g>
        );
      case 'logic':
        return (
          <g>
            <path d="M95 54L126 84M185 54L154 84M98 44H182" stroke={sky} strokeWidth="2.5" />
            <circle cx="80" cy="44" r="19" fill={tileBg} stroke={sky} strokeWidth="2.5" />
            <circle cx="200" cy="44" r="19" fill={tileBg} stroke={tileBorder} strokeWidth="2.5" />
            <circle cx="140" cy="96" r="19" fill={highlightBg} stroke={accent} strokeWidth="2.5" />
            <text x="80" y="50" textAnchor="middle" fill={sky} fontSize="15" fontFamily="sans-serif" fontWeight="800">A</text>
            <text x="200" y="50" textAnchor="middle" fill={ink} fontSize="15" fontFamily="sans-serif" fontWeight="800">B</text>
            <text x="140" y="102" textAnchor="middle" fill={accent} fontSize="15" fontFamily="sans-serif" fontWeight="800">?</text>
          </g>
        );
      case 'pattern':
        return (
          <g transform="translate(88, 18)">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect
                key={i}
                x={(i % 3) * 36}
                y={Math.floor(i / 3) * 36}
                width="30"
                height="30"
                rx="6"
                fill={tileBg}
                stroke={tileBorder}
                strokeWidth="1.5"
              />
            ))}
            <circle cx="15" cy="15" r="7" stroke={gold} strokeWidth="2.5" />
            <rect x="44" y="8" width="14" height="14" rx="2" stroke={sky} strokeWidth="2.5" />
            <polygon points="87,8 94,22 80,22" stroke={accent} strokeWidth="2.5" />
            <rect x="72" y="72" width="30" height="30" rx="6" fill={highlightBg} stroke={accent} strokeWidth="2" strokeDasharray="4 3" />
            <text x="87" y="92" textAnchor="middle" fill={accent} fontSize="14" fontFamily="sans-serif" fontWeight="800">?</text>
          </g>
        );
      case 'pipe':
        return (
          <g>
            <path d="M36 42H106V98H176V42H244" fill="none" stroke={tileBorder} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M36 42H106V98H176V42H244" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="36" cy="42" r="9" fill={gold} />
            <circle cx="244" cy="42" r="9" fill={sky} />
            <rect x="96" y="32" width="20" height="20" rx="4" fill={tileBg} stroke={tileBorder} strokeWidth="2" />
            <rect x="166" y="88" width="20" height="20" rx="4" fill={tileBg} stroke={tileBorder} strokeWidth="2" />
          </g>
        );
      case 'color_path':
        return (
          <g>
            <path d="M48 34H116V102H232" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M48 102H82V66H198V34H232" fill="none" stroke={gold} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="48" cy="34" r="11" fill={accent} />
            <circle cx="232" cy="102" r="11" fill={accent} />
            <circle cx="48" cy="102" r="11" fill={gold} />
            <circle cx="232" cy="34" r="11" fill={gold} />
          </g>
        );
      case 'block_escape':
        return (
          <g transform="translate(56, 18)">
            <rect width="168" height="104" rx="8" fill={isLight ? '#DCE6E2' : '#142331'} stroke={tileBorder} strokeWidth="2" />
            <rect x="12" y="42" width="66" height="22" rx="4" fill={coral} />
            <rect x="96" y="14" width="22" height="58" rx="4" fill={sky} />
            <rect x="132" y="46" width="22" height="46" rx="4" fill={tileBg} stroke={tileBorder} strokeWidth="1.5" />
            <path d="M154 53H184M176 46L184 53L176 60" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 'number_path':
        return (
          <g>
            <polyline points="54,96 104,44 156,88 224,36" fill="none" stroke={sky} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {[
              { x: 54, y: 96, n: '1', active: true },
              { x: 104, y: 44, n: '2', active: true },
              { x: 156, y: 88, n: '3', active: true },
              { x: 224, y: 36, n: '4', active: false },
            ].map((pt) => (
              <g key={pt.n} transform={`translate(${pt.x}, ${pt.y})`}>
                <circle r="16" fill={pt.active ? highlightBg : accent} stroke={pt.active ? sky : accent} strokeWidth="2.5" />
                <text y="5" textAnchor="middle" fill={pt.active ? ink : '#FFFFFF'} fontSize="14" fontFamily="sans-serif" fontWeight="800">{pt.n}</text>
              </g>
            ))}
          </g>
        );
      case 'rotating_tiles':
        return (
          <g transform="translate(86, 16)">
            {[0, 1, 2, 3].map((i) => {
              const x = (i % 2) * 56;
              const y = Math.floor(i / 2) * 56;
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <rect width="50" height="50" rx="7" fill={i === 1 ? highlightBg : tileBg} stroke={i === 1 ? accent : tileBorder} strokeWidth="2" />
                  <path d="M25 10V25H40" fill="none" stroke={i === 1 ? accent : sky} strokeWidth="4.5" strokeLinecap="round" transform={`rotate(${i * 90} 25 25)`} />
                </g>
              );
            })}
          </g>
        );
      case 'word_grid':
        return (
          <g transform="translate(64, 16)">
            <rect width="152" height="108" rx="8" fill={tileBg} stroke={tileBorder} strokeWidth="2" />
            <line x1="28" y1="24" x2="124" y2="86" stroke={mint} strokeWidth="16" strokeLinecap="round" opacity="0.5" />
            {['W', 'O', 'R', 'D', 'S'].map((l, i) => (
              <text key={l} x={28 + i * 24} y={29 + i * 15} textAnchor="middle" fill={accent} fontSize="14" fontFamily="sans-serif" fontWeight="800">
                {l}
              </text>
            ))}
            {['A', 'M', 'X', 'T', 'Q', 'Z', 'B', 'K'].map((l, i) => (
              <text key={i} x={126 - (i % 4) * 28} y={24 + Math.floor(i / 4) * 64} textAnchor="middle" fill={muted} fontSize="11" fontFamily="sans-serif" fontWeight="700">
                {l}
              </text>
            ))}
          </g>
        );
      case 'arrow_path':
        return (
          <g transform="translate(46, 28)">
            {[
              { x: 0, y: 0, rot: 0, active: true },
              { x: 64, y: 0, rot: 90, active: true },
              { x: 128, y: 0, rot: 180, active: false },
              { x: 64, y: 46, rot: 0, active: true },
              { x: 128, y: 46, rot: 0, active: true },
            ].map((a, idx) => (
              <g key={idx} transform={`translate(${a.x}, ${a.y})`}>
                <rect width="52" height="38" rx="7" fill={a.active ? highlightBg : tileBg} stroke={a.active ? accent : tileBorder} strokeWidth="2" />
                <path d="M18 19H34M28 13L34 19L28 25" fill="none" stroke={a.active ? accent : muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform={`rotate(${a.rot} 26 19)`} />
              </g>
            ))}
          </g>
        );
      case 'maze_escape':
        return (
          <g transform="translate(56, 18)">
            <rect width="168" height="104" rx="8" fill={isLight ? '#1C2D3B' : '#142331'} stroke={tileBorder} strokeWidth="2" />
            <path d="M36 0V68H84V28H128V80H60" fill="none" stroke="#4A6A7B" strokeWidth="5" strokeLinecap="square" />
            <path d="M18 18V86H146V24" fill="none" stroke="#38C6BA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="18" cy="18" r="6" fill="#A8E5D5" />
            <polygon points="146,16 158,22 146,28" fill="#EF6C57" />
          </g>
        );
      case 'laser_mirror':
        return (
          <g>
            <polyline points="44,100 132,100 132,36 234,36" fill="none" stroke={gold} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="120" y1="112" x2="144" y2="88" stroke={sky} strokeWidth="5" strokeLinecap="round" />
            <line x1="120" y1="48" x2="144" y2="24" stroke={sky} strokeWidth="5" strokeLinecap="round" />
            <circle cx="44" cy="100" r="9" fill={accent} />
            <polygon points="234,24 246,36 234,48 222,36" fill={gold} stroke={ink} strokeWidth="1.5" />
          </g>
        );
      case 'challenge_mode':
      default:
        return (
          <g>
            <circle cx="140" cy="70" r="42" fill={highlightBg} stroke={accent} strokeWidth="3.5" />
            <path d="M140 70L140 42M140 70L162 82" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
            <rect x="122" y="18" width="36" height="8" rx="3" fill={coral} />
            <text x="206" y="76" fill={coral} fontSize="18" fontFamily="sans-serif" fontWeight="800">2x</text>
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 280 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`w-full h-full select-none ${className}`}
    >
      <rect width="280" height="140" fill={bg} />
      <pattern id={`grid-${variant}-${type}`} width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridLine} strokeWidth="0.75" />
      </pattern>
      <rect width="280" height="140" fill={`url(#grid-${variant}-${type})`} />
      {renderScene()}
    </svg>
  );
};
