export interface DesktopArtifactMeta {
  fileName: string;
  label: string;
  sizeBytes: number;
  sizeLabel: string;
  sha256: string;
  downloadUrl: string;
}

export const DESKTOP_RELEASE_META = {
  appName: 'PuzzleVerse',
  tagline: 'Challenge Your Mind. Beat Your Best.',
  version: '1.0.0',
  releaseDate: '2026-11-26',
  publisher: 'Sidhant Jain',
  supportedOS: 'Windows 10 & Windows 11 (64-bit x64)',
  requirements: [
    'Windows 10 (1903+) or Windows 11 — 64-bit (x64)',
    '4 GB RAM (8 GB recommended)',
    '~350 MB free disk space',
    'Optional internet connection for Firebase account sync, Daily Puzzle & global leaderboards',
  ],
  signedStatus:
    'Unsigned binary — no Authenticode code-signing certificate is attached. Windows SmartScreen may display a prompt on first launch; verify the SHA-256 checksum below before running.',
  releasePageUrl: 'https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.0.0',
  installer: {
    fileName: 'PuzzleVerse-Setup-1.0.0-x64.exe',
    label: 'Download Installer for Windows (.exe)',
    sizeBytes: 122213038,
    sizeLabel: '116.55 MB (122,213,038 bytes)',
    sha256: '1971025ff689fd22007c0ed3d7fe61c917d99c8f80c7338a6a0471effe68368c',
    downloadUrl:
      'https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/PuzzleVerse-Setup-1.0.0-x64.exe',
  } as DesktopArtifactMeta,
  portable: {
    fileName: 'PuzzleVerse-Portable-1.0.0-x64.exe',
    label: 'Download Portable Version (.exe)',
    sizeBytes: 111269654,
    sizeLabel: '106.12 MB (111,269,654 bytes)',
    sha256: '55847989047fde9e789e07f49e5ebdcd2507fc7f26c4b07981312be3106a2d2f',
    downloadUrl:
      'https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/PuzzleVerse-Portable-1.0.0-x64.exe',
  } as DesktopArtifactMeta,
  releaseNotes: [
    'Initial Windows Desktop 1.0.0 release built with Electron 45 + Chromium sandbox isolation (nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true).',
    'Bundles local dist/ assets cleanly into resources/app.asar (~1.94 MB) using custom app://puzzleverse protocol with zero dependency on Vite or Node.js at runtime.',
    'Full offline launch and Guest Practice support across all 16 puzzle modes with validated procedural generation, separate from verified online leaderboards.',
    'Unified Firebase Authentication (email/password + secure system-browser Google sign-in loopback flow) and Firestore cloud progression sync.',
    'Per-user Windows NSIS installer (no administrator privileges required) plus zero-install portable executable, window bounds persistence, F11 fullscreen, and unsaved-puzzle exit confirmation.',
  ],
};
