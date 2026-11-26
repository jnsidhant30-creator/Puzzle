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
  const strokeMain = '#B9B3C2';
  const accent = '#FF4696';
  const light = '#F5F3F7';

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
          <rect x="10" y="6" width="11" height="14" rx="2" fill="#1C1823" stroke={accent} strokeWidth="1.75" />
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

export const PUZZLE_CATEGORY_ACCENT: Record<string, { hex: string; border: string; badge: string }> = {
  Math: { hex: '#38BDF8', border: 'border-sky-400/35', badge: 'text-sky-300 bg-sky-400/10 border-sky-400/25' },
  Words: { hex: '#34D399', border: 'border-emerald-400/35', badge: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25' },
  Memory: { hex: '#A78BFA', border: 'border-violet-400/35', badge: 'text-violet-300 bg-violet-400/10 border-violet-400/25' },
  Logic: { hex: '#FBBF24', border: 'border-amber-400/35', badge: 'text-amber-300 bg-amber-400/10 border-amber-400/25' },
  'Spatial & Grid': { hex: '#FF4696', border: 'border-[#FF4696]/40', badge: 'text-[#FF82B8] bg-[#FF4696]/12 border-[#FF4696]/30' },
  Challenge: { hex: '#FB7185', border: 'border-rose-400/40', badge: 'text-rose-300 bg-rose-400/12 border-rose-400/30' },
};

interface PuzzleCoverArtProps {
  type: PuzzleType;
  className?: string;
}

export const PuzzleCoverArt: React.FC<PuzzleCoverArtProps> = ({ type, className = '' }) => {
  const renderScene = () => {
    switch (type) {
      case 'number':
        return (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${44 + i * 50}, 36)`}>
                <rect width="38" height="46" rx="6" fill={i === 1 ? '#1E1033' : '#24202C'} stroke={i === 1 ? '#38BDF8' : '#342D3D'} strokeWidth="1.75" />
                <text x="19" y="29" textAnchor="middle" fill={i === 1 ? '#38BDF8' : '#F5F3F7'} fontSize="16" fontFamily="monospace" fontWeight="700">
                  {['7', '+', '9', '16'][i]}
                </text>
              </g>
            ))}
            <text x="140" y="106" textAnchor="middle" fill="#9F97AB" fontSize="10" fontFamily="monospace" letterSpacing="2">
              EVALUATE SEQUENCE
            </text>
          </g>
        );
      case 'word':
        return (
          <g>
            {['C', 'I', 'P', 'H', 'E', 'R'].map((ch, idx) => (
              <g key={idx} transform={`translate(${34 + idx * 36}, ${idx % 2 === 0 ? 44 : 36})`}>
                <rect width="30" height="36" rx="5" fill={idx === 2 ? '#1E1033' : '#24202C'} stroke={idx === 2 ? '#34D399' : '#494052'} strokeWidth="1.5" />
                <text x="15" y="24" textAnchor="middle" fill={idx === 2 ? '#34D399' : '#F5F3F7'} fontSize="15" fontFamily="monospace" fontWeight="700">
                  {ch}
                </text>
              </g>
            ))}
            <rect x="60" y="96" width="160" height="4" rx="2" fill="#34D399" opacity="0.35" />
            <rect x="60" y="96" width="102" height="4" rx="2" fill="#34D399" />
          </g>
        );
      case 'memory':
        return (
          <g>
            <g transform="translate(52, 26)">
              {[0, 1, 2, 3].map((r) => (
                <rect
                  key={r}
                  x={(r % 2) * 92}
                  y={Math.floor(r / 2) * 44}
                  width="80"
                  height="36"
                  rx="6"
                  fill={r === 0 || r === 3 ? '#1E1033' : '#24202C'}
                  stroke={r === 0 || r === 3 ? '#A78BFA' : '#342D3D'}
                  strokeWidth="1.75"
                />
              ))}
              <circle cx="40" cy="18" r="8" fill="#A78BFA" />
              <polygon points="132,54 140,68 124,68" fill="#FF4696" />
              <line x1="80" y1="18" x2="92" y2="62" stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            </g>
          </g>
        );
      case 'sliding':
        return (
          <g transform="translate(86, 16)">
            <rect width="108" height="108" rx="8" fill="#110F15" stroke="#342D3D" strokeWidth="1.5" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const isMoved = n === 8;
              return (
                <g key={n} transform={`translate(${8 + col * 32}, ${8 + row * 32})`}>
                  <rect width="28" height="28" rx="4" fill={isMoved ? '#FF4696' : '#24202C'} stroke={isMoved ? '#FF82B8' : '#494052'} strokeWidth="1.2" />
                  <text x="14" y="19" textAnchor="middle" fill={isMoved ? '#110F15' : '#F5F3F7'} fontSize="12" fontFamily="monospace" fontWeight="700">
                    {n}
                  </text>
                </g>
              );
            })}
            <rect x="72" y="72" width="28" height="28" rx="4" fill="none" stroke="#494052" strokeWidth="1.4" strokeDasharray="3 3" />
          </g>
        );
      case 'logic':
        return (
          <g>
            <circle cx="80" cy="44" r="18" fill="#24202C" stroke="#FBBF24" strokeWidth="2" />
            <circle cx="200" cy="44" r="18" fill="#24202C" stroke="#494052" strokeWidth="2" />
            <circle cx="140" cy="96" r="18" fill="#1E1033" stroke="#FF4696" strokeWidth="2" />
            <path d="M95 54L126 84M185 54L154 84M98 44H182" stroke="#FBBF24" strokeWidth="1.75" opacity="0.7" />
            <text x="80" y="49" textAnchor="middle" fill="#FBBF24" fontSize="13" fontFamily="monospace" fontWeight="700">A</text>
            <text x="200" y="49" textAnchor="middle" fill="#C5BFD0" fontSize="13" fontFamily="monospace" fontWeight="700">B</text>
            <text x="140" y="101" textAnchor="middle" fill="#F5F3F7" fontSize="13" fontFamily="monospace" fontWeight="700">?</text>
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
                rx="5"
                fill="#24202C"
                stroke="#342D3D"
              />
            ))}
            <circle cx="15" cy="15" r="7" stroke="#FBBF24" strokeWidth="2" />
            <rect x="44" y="8" width="14" height="14" rx="2" stroke="#38BDF8" strokeWidth="2" />
            <polygon points="87,8 94,22 80,22" stroke="#34D399" strokeWidth="2" />
            <rect x="72" y="72" width="30" height="30" rx="5" fill="#1E1033" stroke="#FF4696" strokeWidth="2" strokeDasharray="4 3" />
            <text x="87" y="92" textAnchor="middle" fill="#FF82B8" fontSize="14" fontFamily="monospace" fontWeight="700">?</text>
          </g>
        );
      case 'pipe':
        return (
          <g>
            <path d="M36 42H106V98H176V42H244" fill="none" stroke="#342D3D" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M36 42H106V98H176V42H244" fill="none" stroke="#FF4696" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="36" cy="42" r="8" fill="#F5F3F7" />
            <circle cx="244" cy="42" r="8" fill="#FF4696" />
            <rect x="96" y="32" width="20" height="20" rx="4" fill="#24202C" stroke="#494052" strokeWidth="1.5" />
            <rect x="166" y="88" width="20" height="20" rx="4" fill="#24202C" stroke="#494052" strokeWidth="1.5" />
          </g>
        );
      case 'color_path':
        return (
          <g>
            <path d="M48 34H116V102H232" fill="none" stroke="#FF4696" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M48 102H82V66H198V34H232" fill="none" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="48" cy="34" r="10" fill="#FF4696" />
            <circle cx="232" cy="102" r="10" fill="#FF4696" />
            <circle cx="48" cy="102" r="10" fill="#38BDF8" />
            <circle cx="232" cy="34" r="10" fill="#38BDF8" />
          </g>
        );
      case 'block_escape':
        return (
          <g transform="translate(56, 18)">
            <rect width="168" height="104" rx="8" fill="#110F15" stroke="#494052" strokeWidth="2" />
            <line x1="168" y1="40" x2="168" y2="66" stroke="#110F15" strokeWidth="4" />
            <rect x="12" y="42" width="66" height="22" rx="4" fill="#FF4696" />
            <rect x="96" y="14" width="22" height="58" rx="4" fill="#2B2533" stroke="#494052" />
            <rect x="132" y="46" width="22" height="46" rx="4" fill="#24202C" stroke="#494052" />
            <path d="M154 53H182M174 46L182 53L174 60" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 'number_path':
        return (
          <g>
            <polyline points="54,96 104,44 156,88 224,36" fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {[
              { x: 54, y: 96, n: '1', active: true },
              { x: 104, y: 44, n: '2', active: true },
              { x: 156, y: 88, n: '3', active: true },
              { x: 224, y: 36, n: '4', active: false },
            ].map((pt) => (
              <g key={pt.n} transform={`translate(${pt.x}, ${pt.y})`}>
                <circle r="15" fill={pt.active ? '#1E1033' : '#24202C'} stroke={pt.active ? '#38BDF8' : '#FF4696'} strokeWidth="2" />
                <text y="5" textAnchor="middle" fill="#F5F3F7" fontSize="13" fontFamily="monospace" fontWeight="700">{pt.n}</text>
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
                  <rect width="50" height="50" rx="6" fill={i === 1 ? '#1E1033' : '#24202C'} stroke={i === 1 ? '#FF4696' : '#342D3D'} strokeWidth="1.75" />
                  <path d="M25 10V25H40" fill="none" stroke={i === 1 ? '#FF4696' : '#C5BFD0'} strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 90} 25 25)`} />
                </g>
              );
            })}
          </g>
        );
      case 'word_grid':
        return (
          <g transform="translate(64, 16)">
            <rect width="152" height="108" rx="6" fill="#110F15" stroke="#342D3D" strokeWidth="1.5" />
            <line x1="28" y1="24" x2="124" y2="86" stroke="#34D399" strokeWidth="16" strokeLinecap="round" opacity="0.28" />
            {['W', 'O', 'R', 'D', 'S'].map((l, i) => (
              <text key={l} x={28 + i * 24} y={28 + i * 15} textAnchor="middle" fill="#34D399" fontSize="13" fontFamily="monospace" fontWeight="700">
                {l}
              </text>
            ))}
            {['A', 'M', 'X', 'T', 'Q', 'Z', 'B', 'K'].map((l, i) => (
              <text key={i} x={126 - (i % 4) * 28} y={24 + Math.floor(i / 4) * 64} textAnchor="middle" fill="#756C82" fontSize="11" fontFamily="monospace">
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
                <rect width="52" height="38" rx="6" fill={a.active ? '#1E1033' : '#24202C'} stroke={a.active ? '#FF4696' : '#342D3D'} strokeWidth="1.5" />
                <path d="M18 19H34M28 13L34 19L28 25" fill="none" stroke={a.active ? '#FF82B8' : '#756C82'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform={`rotate(${a.rot} 26 19)`} />
              </g>
            ))}
          </g>
        );
      case 'maze_escape':
        return (
          <g transform="translate(56, 18)">
            <rect width="168" height="104" rx="6" fill="#110F15" stroke="#494052" strokeWidth="2" />
            <path d="M36 0V68H84V28H128V80H60" fill="none" stroke="#494052" strokeWidth="4" strokeLinecap="square" />
            <path d="M18 18V86H146V24" fill="none" stroke="#FF4696" strokeWidth="2.5" strokeDasharray="4 4" />
            <circle cx="18" cy="18" r="6" fill="#FF4696" />
            <rect x="140" y="18" width="12" height="12" rx="2" fill="#34D399" />
          </g>
        );
      case 'laser_mirror':
        return (
          <g>
            <polyline points="44,100 132,100 132,36 234,36" fill="none" stroke="#FF4696" strokeWidth="3" strokeLinecap="round" />
            <line x1="120" y1="112" x2="144" y2="88" stroke="#F5F3F7" strokeWidth="4" strokeLinecap="round" />
            <line x1="120" y1="48" x2="144" y2="24" stroke="#F5F3F7" strokeWidth="4" strokeLinecap="round" />
            <circle cx="44" cy="100" r="8" fill="#38BDF8" />
            <polygon points="234,24 246,36 234,48 222,36" fill="#FF4696" stroke="#F5F3F7" strokeWidth="1.5" />
          </g>
        );
      case 'challenge_mode':
      default:
        return (
          <g>
            <circle cx="140" cy="70" r="42" fill="#1E1033" stroke="#FB7185" strokeWidth="3" />
            <path d="M140 70L140 42M140 70L162 82" stroke="#F5F3F7" strokeWidth="3" strokeLinecap="round" />
            <rect x="122" y="18" width="36" height="8" rx="3" fill="#FB7185" />
            <text x="206" y="76" fill="#FB7185" fontSize="18" fontFamily="monospace" fontWeight="700">4x</text>
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
      <rect width="280" height="140" fill="#14111A" />
      <pattern id={`grid-${type}`} width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#24202C" strokeWidth="0.75" />
      </pattern>
      <rect width="280" height="140" fill={`url(#grid-${type})`} />
      {renderScene()}
    </svg>
  );
};
