const PALETTE = [
  { bg: '#233D4A', fg: '#38C6BA', accent: '#F5F2E9' },
  { bg: '#1C2D3B', fg: '#93D1F2', accent: '#38C6BA' },
  { bg: '#2C4654', fg: '#A8E5D5', accent: '#93D1F2' },
  { bg: '#087F8C', fg: '#F5F2E9', accent: '#A8E5D5' },
  { bg: '#142331', fg: '#38C6BA', accent: '#93D1F2' },
  { bg: '#233D4A', fg: '#F5F2E9', accent: '#38C6BA' },
  { bg: '#1C2D3B', fg: '#A8E5D5', accent: '#F5F2E9' },
  { bg: '#2C4654', fg: '#38C6BA', accent: '#F5F2E9' },
];

const PATTERNS = [
  (fg: string, accent: string) =>
    `<rect x="14" y="14" width="14" height="14" rx="3" fill="${fg}"/><rect x="36" y="14" width="14" height="14" rx="3" fill="${accent}" opacity="0.9"/><rect x="14" y="36" width="14" height="14" rx="3" fill="${accent}" opacity="0.55"/><rect x="36" y="36" width="14" height="14" rx="3" fill="${fg}"/>`,
  (fg: string, accent: string) =>
    `<polygon points="32,12 52,32 32,52 12,32" fill="none" stroke="${fg}" stroke-width="3.5"/><circle cx="32" cy="32" r="7" fill="${accent}"/>`,
  (fg: string, accent: string) =>
    `<path d="M16 44V20L32 34L48 20V44" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="28" y="13" width="8" height="8" rx="2" fill="${fg}"/>`,
  (fg: string, accent: string) =>
    `<rect x="14" y="14" width="36" height="36" rx="6" fill="none" stroke="${fg}" stroke-width="3"/><line x1="32" y1="14" x2="32" y2="50" stroke="${accent}" stroke-width="2.5"/><line x1="14" y1="32" x2="50" y2="32" stroke="${accent}" stroke-width="2.5"/><circle cx="32" cy="32" r="5" fill="${fg}"/>`,
  (fg: string, accent: string) =>
    `<polygon points="32,12 50,22 50,42 32,52 14,42 14,22" fill="none" stroke="${fg}" stroke-width="3.5"/><polygon points="32,22 41,27 41,37 32,42 23,37 23,27" fill="${accent}" opacity="0.9"/>`,
  (fg: string, accent: string) =>
    `<path d="M16 20H48M16 32H38M16 44H48" stroke="${accent}" stroke-width="4" stroke-linecap="round"/><rect x="42" y="28" width="8" height="8" rx="2" fill="${fg}"/>`,
  (fg: string, accent: string) =>
    `<circle cx="24" cy="24" r="8" fill="${fg}"/><circle cx="40" cy="40" r="8" fill="${accent}"/><path d="M24 40H32V24H40" fill="none" stroke="#F5F7F8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  (fg: string, accent: string) =>
    `<path d="M16 18L32 18L32 32L48 32L48 46" fill="none" stroke="${fg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="44" r="5" fill="${accent}"/><rect x="41" y="14" width="8" height="8" rx="2" fill="${accent}"/>`,
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getAvatarDataUri(seed: string): string {
  const hash = hashSeed(seed || 'puzzleverse');
  const colors = PALETTE[hash % PALETTE.length];
  const draw = PATTERNS[(hash >>> 3) % PATTERNS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="10" fill="${colors.bg}"/><rect x="1.5" y="1.5" width="61" height="61" rx="8.5" fill="none" stroke="#36515F" stroke-width="2"/>${draw(colors.fg, colors.accent)}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AVATAR_PRESETS: string[] = Array.from({ length: 8 }, (_, idx) => {
  const colors = PALETTE[idx % PALETTE.length];
  const draw = PATTERNS[idx % PATTERNS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="10" fill="${colors.bg}"/><rect x="1.5" y="1.5" width="61" height="61" rx="8.5" fill="none" stroke="#36515F" stroke-width="2"/>${draw(colors.fg, colors.accent)}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
});

export function resolveAvatarUrl(avatarUrl: string | undefined | null, seed: string): string {
  if (!avatarUrl || avatarUrl.includes('api.dicebear.com')) {
    return getAvatarDataUri(seed);
  }
  return avatarUrl;
}
