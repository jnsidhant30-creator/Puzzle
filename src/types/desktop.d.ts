export interface DesktopAppInfo {
  name: string;
  tagline: string;
  version: string;
  publisher: string;
  isPackaged: boolean;
  isPortable: boolean;
  platform: string;
  arch: string;
  signed: boolean;
  downloadPageUrl: string;
  releaseRepoUrl: string;
}

export interface DesktopWindowState {
  isFullScreen: boolean;
  isMaximized: boolean;
  width: number;
  height: number;
  rememberBounds: boolean;
  defaultFullscreen: boolean;
}

export interface DesktopUpdateCheckResult {
  status: 'available' | 'up-to-date' | 'error';
  currentVersion: string;
  latestVersion?: string;
  signed: boolean;
  isPortable?: boolean;
  manualOnly?: boolean;
  releaseUrl?: string;
  downloadPageUrl: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  expectedSha256?: string;
  expectedSha512?: string;
  releaseNotes?: string;
  message?: string;
  error?: string;
}

export interface DesktopUpdateDownloadResult {
  status: 'downloaded' | 'error';
  filePath?: string;
  sha256?: string;
  verified?: boolean;
  signed?: boolean;
  error?: string;
}

export interface DesktopUpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

export interface PuzzleVerseDesktopAPI {
  isDesktop: boolean;
  platform: string;
  arch: string;
  getAppInfo: () => Promise<DesktopAppInfo>;
  getWindowState: () => Promise<DesktopWindowState>;
  toggleFullscreen: () => Promise<{ isFullScreen: boolean }>;
  setWindowPreferences: (prefs: { rememberBounds?: boolean; defaultFullscreen?: boolean }) => Promise<boolean>;
  onFullscreenChange: (callback: (isFullScreen: boolean) => void) => () => void;
  onNavigate: (callback: (tab: string) => void) => () => void;
  setActiveGameState: (state: { inActiveGame: boolean; gameName?: string }) => void;
  startGoogleAuth: () => Promise<{ ok: boolean; idToken?: string; accessToken?: string; error?: string }>;
  openExternal: (url: string) => Promise<boolean>;
  checkForUpdates: () => Promise<DesktopUpdateCheckResult>;
  downloadUpdate: (releaseInfo: DesktopUpdateCheckResult) => Promise<DesktopUpdateDownloadResult>;
  installUpdateAndRestart: (filePath: string) => Promise<{ ok: boolean; reason?: string }>;
  revealDownloadedFile?: (filePath: string) => Promise<boolean>;
  onSecondInstance?: (callback: () => void) => () => void;
  quitApp?: () => Promise<{ ok: boolean; reason?: string }>;
  onUpdateProgress: (callback: (progress: DesktopUpdateProgress) => void) => () => void;
  checkOnline: () => Promise<boolean>;
}

declare global {
  interface Window {
    puzzleverseDesktop?: PuzzleVerseDesktopAPI;
  }
}
