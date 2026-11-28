import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser as CapBrowser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network as CapNetwork } from '@capacitor/network';
import { Share as CapShare } from '@capacitor/share';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { Toast as CapToast } from '@capacitor/toast';
import {
  DetectedPlatformInfo,
  RuntimeContainer,
  detectPlatformSync,
  detectPlatformAsync,
  triggerPwaInstallPrompt,
  initPwaPromptCapture,
} from './detectPlatform';

export interface AppVersionInfo {
  version: string;
  buildPlatform: string;
  arch: string;
  runtime: RuntimeContainer;
  signed: boolean;
}

export interface StorageSummary {
  keys: number;
  bytes: number;
  sizeKb: string;
}

export interface UpdateStatusPayload {
  status: 'up-to-date' | 'available' | 'error' | 'unsupported';
  currentVersion: string;
  latestVersion?: string;
  releaseUrl?: string;
  downloadPageUrl: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  expectedSha256?: string;
  expectedSha512?: string;
  signed: boolean;
  message?: string;
  error?: string;
  releaseNotes?: string;
}

export interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

export interface ShareResult {
  shared: boolean;
  method: 'native' | 'clipboard' | 'unsupported';
}

export interface PlatformAdapter {
  readonly runtime: RuntimeContainer;
  getPlatformInfo(): Promise<DetectedPlatformInfo>;
  getAppVersion(): Promise<AppVersionInfo>;
  storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    getSummary(): StorageSummary;
  };
  network: {
    isOnline(): Promise<boolean>;
    subscribe(cb: (online: boolean) => void): () => void;
  };
  notifications: {
    notify(title: string, body: string): Promise<boolean>;
  };
  fullscreen: {
    isSupported(): boolean;
    getState(): Promise<boolean>;
    toggle(): Promise<boolean>;
    subscribe(cb: (isFullscreen: boolean) => void): () => void;
  };
  openExternal(url: string): Promise<boolean>;
  updates: {
    checkForUpdates(): Promise<UpdateStatusPayload>;
    applyPwaUpdate?(): Promise<boolean>;
  };
  exitApp(): Promise<{ exited: boolean; reason?: string }>;
  share(payload: SharePayload): Promise<ShareResult>;
  haptics(style?: 'light' | 'medium' | 'heavy'): Promise<void>;
  promptPwaInstall(): Promise<{ outcome: 'accepted' | 'dismissed' | 'unavailable' }>;
  setActiveGameState(inActiveGame: boolean, gameName?: string): void;
}

const APP_FALLBACK_VERSION = '1.2.1';
const GITHUB_RELEASES_API = 'https://api.github.com/repos/jnsidhant30-creator/Puzzle/releases/latest';
const DOWNLOAD_PAGE_URL = 'https://puzzleverse-e16e4.web.app/download';

let pwaSwRegistration: ServiceWorkerRegistration | null = null;
let pwaUpdateAvailableFlag = false;
const pwaUpdateListeners = new Set<(available: boolean) => void>();

export function setPwaSwRegistration(reg: ServiceWorkerRegistration | null, updateReady = false): void {
  pwaSwRegistration = reg;
  pwaUpdateAvailableFlag = updateReady;
  pwaUpdateListeners.forEach((cb) => cb(updateReady));
}

export function isPwaUpdateAvailable(): boolean {
  return pwaUpdateAvailableFlag;
}

export function subscribePwaUpdate(cb: (available: boolean) => void): () => void {
  pwaUpdateListeners.add(cb);
  cb(pwaUpdateAvailableFlag);
  return () => {
    pwaUpdateListeners.delete(cb);
  };
}

function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

const sharedStorageAdapter: PlatformAdapter['storage'] = {
  getItem(key: string): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {
      // Graceful storage quota fallback
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {
      // Ignore removal error
    }
  },
  getSummary(): StorageSummary {
    try {
      let bytes = 0;
      const keys = localStorage.length;
      for (let i = 0; i < keys; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
      return { keys, bytes, sizeKb: `${(bytes / 1024).toFixed(1)} KB (${keys} saved keys)` };
    } catch {
      return { keys: 0, bytes: 0, sizeKb: 'Local storage unavailable' };
    }
  },
};

function createSafeUrlCheck(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl, typeof window !== 'undefined' ? window.location.origin : 'https://puzzleverse-e16e4.web.app');
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
    return null;
  } catch {
    return null;
  }
}

async function copyShareFallback(payload: SharePayload): Promise<ShareResult> {
  const combined = payload.url ? `${payload.text} — ${payload.url}` : payload.text;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(combined);
      return { shared: true, method: 'clipboard' };
    }
  } catch {
    // Ignore clipboard rejection
  }
  return { shared: false, method: 'unsupported' };
}

async function fetchLatestReleaseStatus(currentVersion: string): Promise<UpdateStatusPayload> {
  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (res.status === 404) {
      return {
        status: 'up-to-date',
        currentVersion,
        latestVersion: currentVersion,
        signed: false,
        downloadPageUrl: DOWNLOAD_PAGE_URL,
        message: `Running latest available version (v${currentVersion}).`,
      };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const latest = String(data.tag_name || currentVersion).replace(/^v/i, '');
    const newer = compareSemver(latest, currentVersion) > 0;
    return {
      status: newer ? 'available' : 'up-to-date',
      currentVersion,
      latestVersion: latest,
      signed: false,
      releaseUrl: data.html_url || DOWNLOAD_PAGE_URL,
      downloadPageUrl: DOWNLOAD_PAGE_URL,
      releaseNotes: typeof data.body === 'string' ? data.body.slice(0, 1500) : '',
      message: newer
        ? `PuzzleVerse v${latest} is available.`
        : `You are running the latest version (v${currentVersion}).`,
    };
  } catch (err) {
    return {
      status: 'error',
      currentVersion,
      signed: false,
      downloadPageUrl: DOWNLOAD_PAGE_URL,
      error: err instanceof Error ? err.message : 'Unable to check updates right now.',
    };
  }
}

function createElectronAdapter(): PlatformAdapter {
  const bridge = window.puzzleverseDesktop!;
  return {
    runtime: 'electron',
    getPlatformInfo: () => detectPlatformAsync(),
    async getAppVersion(): Promise<AppVersionInfo> {
      try {
        const info = await bridge.getAppInfo();
        return {
          version: info.version || APP_FALLBACK_VERSION,
          buildPlatform: info.platform || bridge.platform,
          arch: info.arch || bridge.arch,
          runtime: 'electron',
          signed: Boolean(info.signed),
        };
      } catch {
        return {
          version: APP_FALLBACK_VERSION,
          buildPlatform: bridge.platform,
          arch: bridge.arch,
          runtime: 'electron',
          signed: false,
        };
      }
    },
    storage: sharedStorageAdapter,
    network: {
      isOnline: async () => {
        try {
          return await bridge.checkOnline();
        } catch {
          return typeof navigator !== 'undefined' ? navigator.onLine : true;
        }
      },
      subscribe(cb: (online: boolean) => void) {
        const on = () => cb(true);
        const off = () => cb(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
          window.removeEventListener('online', on);
          window.removeEventListener('offline', off);
        };
      },
    },
    notifications: {
      async notify(title: string, body: string) {
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
            return true;
          }
        } catch {
          // Graceful no-op
        }
        return false;
      },
    },
    fullscreen: {
      isSupported: () => true,
      async getState() {
        try {
          const s = await bridge.getWindowState();
          return Boolean(s.isFullScreen);
        } catch {
          return false;
        }
      },
      async toggle() {
        try {
          const res = await bridge.toggleFullscreen();
          return Boolean(res.isFullScreen);
        } catch {
          return false;
        }
      },
      subscribe(cb) {
        return bridge.onFullscreenChange(cb);
      },
    },
    async openExternal(url: string) {
      const safe = createSafeUrlCheck(url);
      if (!safe) return false;
      return bridge.openExternal(safe);
    },
    updates: {
      async checkForUpdates() {
        const res = await bridge.checkForUpdates();
        return {
          status: res.status,
          currentVersion: res.currentVersion,
          latestVersion: res.latestVersion,
          releaseUrl: res.releaseUrl,
          downloadPageUrl: res.downloadPageUrl,
          downloadUrl: res.downloadUrl,
          fileName: res.fileName,
          fileSize: res.fileSize,
          expectedSha256: res.expectedSha256,
          expectedSha512: res.expectedSha512,
          signed: Boolean(res.signed),
          message: res.message,
          error: res.error,
          releaseNotes: res.releaseNotes,
        };
      },
    },
    async exitApp() {
      if (typeof bridge.quitApp === 'function') {
        const res = await bridge.quitApp();
        return { exited: Boolean(res?.ok), reason: res?.reason };
      }
      window.close();
      return { exited: true };
    },
    async share(payload: SharePayload) {
      return copyShareFallback(payload);
    },
    async haptics() {
      // Desktop hardware haptics not supported — intentional graceful no-op
    },
    async promptPwaInstall() {
      return { outcome: 'unavailable' };
    },
    setActiveGameState(inActiveGame: boolean, gameName = '') {
      bridge.setActiveGameState({ inActiveGame, gameName });
    },
  };
}

function createCapacitorAdapter(): PlatformAdapter {
  const capOs = Capacitor.getPlatform();
  return {
    runtime: 'capacitor',
    getPlatformInfo: () => detectPlatformAsync(),
    async getAppVersion(): Promise<AppVersionInfo> {
      try {
        const info = await CapApp.getInfo();
        return {
          version: info.version || APP_FALLBACK_VERSION,
          buildPlatform: capOs,
          arch: 'arm64',
          runtime: 'capacitor',
          signed: false,
        };
      } catch {
        return {
          version: APP_FALLBACK_VERSION,
          buildPlatform: capOs,
          arch: 'unknown',
          runtime: 'capacitor',
          signed: false,
        };
      }
    },
    storage: sharedStorageAdapter,
    network: {
      async isOnline() {
        try {
          const st = await CapNetwork.getStatus();
          return st.connected;
        } catch {
          return typeof navigator !== 'undefined' ? navigator.onLine : true;
        }
      },
      subscribe(cb: (online: boolean) => void) {
        let removeHandle: (() => void) | null = null;
        let disposed = false;
        CapNetwork.addListener('networkStatusChange', (st) => {
          cb(Boolean(st.connected));
        })
          .then((h) => {
            if (disposed) h.remove().catch(() => {});
            else removeHandle = () => h.remove().catch(() => {});
          })
          .catch(() => {});
        return () => {
          disposed = true;
          removeHandle?.();
        };
      },
    },
    notifications: {
      async notify(title: string, body: string) {
        try {
          await CapToast.show({ text: `${title}: ${body}`, duration: 'short' });
          return true;
        } catch {
          return false;
        }
      },
    },
    fullscreen: {
      isSupported: () => false,
      getState: async () => false,
      toggle: async () => false,
      subscribe: () => () => {},
    },
    async openExternal(url: string) {
      const safe = createSafeUrlCheck(url);
      if (!safe) return false;
      try {
        await CapBrowser.open({ url: safe });
        return true;
      } catch {
        window.open(safe, '_blank', 'noopener,noreferrer');
        return true;
      }
    },
    updates: {
      async checkForUpdates() {
        let vInfo = APP_FALLBACK_VERSION;
        try {
          const info = await CapApp.getInfo();
          vInfo = info.version || APP_FALLBACK_VERSION;
        } catch {
          vInfo = APP_FALLBACK_VERSION;
        }
        return fetchLatestReleaseStatus(vInfo);
      },
    },
    async exitApp() {
      try {
        if (capOs === 'android') {
          await CapApp.exitApp();
          return { exited: true };
        }
        return { exited: false, reason: 'IOS_NO_PROGRAMMATIC_EXIT' };
      } catch {
        return { exited: false, reason: 'UNSUPPORTED' };
      }
    },
    async share(payload: SharePayload) {
      try {
        const can = await CapShare.canShare();
        if (can.value) {
          await CapShare.share({
            title: payload.title,
            text: payload.text,
            url: payload.url || DOWNLOAD_PAGE_URL,
            dialogTitle: payload.title,
          });
          return { shared: true, method: 'native' };
        }
      } catch {
        // User cancelled or share unsupported -> fallback cleanly
      }
      return copyShareFallback(payload);
    },
    async haptics(style = 'light') {
      try {
        const map = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };
        await Haptics.impact({ style: map[style] });
      } catch {
        // Fallback no-op on emulators
      }
    },
    async promptPwaInstall() {
      return { outcome: 'unavailable' };
    },
    setActiveGameState() {
      // Handled via Android back button listener in initPlatformBridge
    },
  };
}

function createWebAdapter(): PlatformAdapter {
  const initial = detectPlatformSync();
  return {
    runtime: initial.runtime,
    getPlatformInfo: () => detectPlatformAsync(),
    async getAppVersion(): Promise<AppVersionInfo> {
      const info = await detectPlatformAsync();
      return {
        version: APP_FALLBACK_VERSION,
        buildPlatform: info.os,
        arch: info.arch,
        runtime: info.runtime,
        signed: true,
      };
    },
    storage: sharedStorageAdapter,
    network: {
      isOnline: async () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
      subscribe(cb: (online: boolean) => void) {
        const on = () => cb(true);
        const off = () => cb(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
          window.removeEventListener('online', on);
          window.removeEventListener('offline', off);
        };
      },
    },
    notifications: {
      async notify(title: string, body: string) {
        if (typeof window === 'undefined' || !('Notification' in window)) return false;
        try {
          if (Notification.permission === 'default') {
            await Notification.requestPermission();
          }
          if (Notification.permission === 'granted') {
            new Notification(title, { body });
            return true;
          }
        } catch {
          // Graceful fallback
        }
        return false;
      },
    },
    fullscreen: {
      isSupported: () =>
        typeof document !== 'undefined' && Boolean(document.documentElement?.requestFullscreen),
      async getState() {
        return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
      },
      async toggle() {
        if (typeof document === 'undefined') return false;
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            return false;
          }
          await document.documentElement.requestFullscreen();
          return true;
        } catch {
          return Boolean(document.fullscreenElement);
        }
      },
      subscribe(cb: (isFs: boolean) => void) {
        if (typeof document === 'undefined') return () => {};
        const handler = () => cb(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
      },
    },
    async openExternal(url: string) {
      const safe = createSafeUrlCheck(url);
      if (!safe) return false;
      window.open(safe, '_blank', 'noopener,noreferrer');
      return true;
    },
    updates: {
      async checkForUpdates() {
        if (pwaSwRegistration) {
          try {
            await pwaSwRegistration.update();
          } catch {
            // Non-fatal SW update check
          }
        }
        return fetchLatestReleaseStatus(APP_FALLBACK_VERSION);
      },
      async applyPwaUpdate() {
        if (!pwaSwRegistration?.waiting) return false;
        pwaSwRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
        return true;
      },
    },
    async exitApp() {
      return { exited: false, reason: 'BROWSER_TAB_CONTROLLED_BY_USER' };
    },
    async share(payload: SharePayload) {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: payload.title,
            text: payload.text,
            url: payload.url || window.location.href,
          });
          return { shared: true, method: 'native' };
        } catch {
          // User cancelled native share sheet or unsupported desktop WebShare
        }
      }
      return copyShareFallback(payload);
    },
    async haptics(style = 'light') {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(style === 'heavy' ? 28 : style === 'medium' ? 16 : 8);
        }
      } catch {
        // Ignore unsupported browser vibration
      }
    },
    async promptPwaInstall() {
      return triggerPwaInstallPrompt();
    },
    setActiveGameState() {
      // Handled via Escape / navigation UI on Web
    },
  };
}

let cachedAdapter: PlatformAdapter | null = null;

export function getPlatformAdapter(): PlatformAdapter {
  if (cachedAdapter) return cachedAdapter;
  if (typeof window !== 'undefined' && window.puzzleverseDesktop?.isDesktop) {
    cachedAdapter = createElectronAdapter();
    return cachedAdapter;
  }
  if (Capacitor.isNativePlatform()) {
    cachedAdapter = createCapacitorAdapter();
    return cachedAdapter;
  }
  cachedAdapter = createWebAdapter();
  return cachedAdapter;
}

export async function initPlatformBridge(options?: {
  onBackButton?: () => boolean;
}): Promise<() => void> {
  initPwaPromptCapture();
  const cleanups: Array<() => void> = [];

  if (Capacitor.isNativePlatform()) {
    const syncNativeStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: StatusBarStyle.Dark });
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#142331' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch {
        // Safe no-op on web/unsupported simulator
      }
    };
    await syncNativeStatusBar();
    const handleOrient = () => {
      setTimeout(() => {
        void syncNativeStatusBar();
      }, 60);
    };
    window.addEventListener('orientationchange', handleOrient);
    cleanups.push(() => window.removeEventListener('orientationchange', handleOrient));

    try {
      const listener = await CapApp.addListener('backButton', ({ canGoBack }) => {
        if (options?.onBackButton && options.onBackButton()) {
          return;
        }
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp().catch(() => {});
        }
      });
      cleanups.push(() => {
        listener.remove().catch(() => {});
      });
    } catch {
      // Ignore listener failure
    }
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
