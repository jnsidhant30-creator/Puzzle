import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export type PlatformOS = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'chromeos' | 'unknown';
export type CpuArch = 'x64' | 'arm64' | 'arm' | 'unknown';
export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'unknown';
export type RuntimeContainer = 'electron' | 'capacitor' | 'pwa' | 'web';
export type PwaInstallState = 'installed' | 'installable' | 'unsupported' | 'unknown';

export type DownloadTargetId =
  | 'win_x64_installer'
  | 'win_arm64_installer'
  | 'win_x64_portable'
  | 'win_arm64_portable'
  | 'mac_apple_silicon'
  | 'mac_intel'
  | 'mac_universal'
  | 'linux_x64_appimage'
  | 'linux_arm64_appimage'
  | 'linux_x64_deb'
  | 'linux_x64_rpm'
  | 'android_apk'
  | 'android_aab'
  | 'ios_ipa'
  | 'pwa_install'
  | 'web_play';

export interface PlatformCapabilities {
  fullscreen: boolean;
  notifications: boolean;
  nativeShare: boolean;
  clipboardShare: boolean;
  externalLinks: boolean;
  nativeUpdates: boolean;
  pwaUpdates: boolean;
  appExit: boolean;
  haptics: boolean;
  offlineStorage: boolean;
  installPrompt: boolean;
}

export interface DetectedPlatformInfo {
  os: PlatformOS;
  arch: CpuArch;
  deviceCategory: DeviceCategory;
  runtime: RuntimeContainer;
  isWebBrowser: boolean;
  isNativeApp: boolean;
  isDesktopApp: boolean;
  isMobileApp: boolean;
  isInstalledPWA: boolean;
  isInstalledApp: boolean;
  canShowDownloadOptions: boolean;
  canShowInstallPrompt: boolean;
  isElectron: boolean;
  isCapacitor: boolean;
  isMobileNative: boolean;
  isPwaInstalled: boolean;
  pwaInstallState: PwaInstallState;
  isTouchCapable: boolean;
  isOnline: boolean;
  osLabel: string;
  archLabel: string;
  runtimeLabel: string;
  capabilities: PlatformCapabilities;
  recommendedTargetId: DownloadTargetId;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let pwaPromptInitialized = false;
const pwaListeners = new Set<(available: boolean) => void>();

export function initPwaPromptCapture(): void {
  if (pwaPromptInitialized || typeof window === 'undefined') return;
  pwaPromptInitialized = true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    if (window.puzzleverseDesktop?.isDesktop || Capacitor.isNativePlatform()) return;
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
    pwaListeners.forEach((cb) => cb(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    pwaListeners.forEach((cb) => cb(false));
  });
}

export function isPwaPromptAvailable(): boolean {
  return Boolean(deferredInstallPrompt);
}

export function subscribePwaInstallPrompt(cb: (available: boolean) => void): () => void {
  initPwaPromptCapture();
  pwaListeners.add(cb);
  cb(Boolean(deferredInstallPrompt));
  return () => {
    pwaListeners.delete(cb);
  };
}

export async function triggerPwaInstallPrompt(): Promise<{
  outcome: 'accepted' | 'dismissed' | 'unavailable';
}> {
  if (!deferredInstallPrompt) return { outcome: 'unavailable' };
  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  pwaListeners.forEach((cb) => cb(false));
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  return { outcome: choice.outcome };
}

function normalizeArch(rawArch?: string | null, rawBitness?: string | null, ua = ''): CpuArch {
  const clean = (rawArch || '').toLowerCase();
  const bit = (rawBitness || '').toLowerCase();
  if (clean === 'arm64' || clean === 'aarch64' || (clean === 'arm' && bit === '64')) return 'arm64';
  if (clean === 'arm') return bit === '64' ? 'arm64' : 'arm';
  if (clean === 'x64' || clean === 'amd64' || clean === 'x86_64' || (clean === 'x86' && bit === '64')) return 'x64';

  const uaLower = ua.toLowerCase();
  if (/\b(arm64|aarch64|woa64)\b/.test(uaLower)) return 'arm64';
  if (/\b(win64|wow64|x86_64|x64|amd64)\b/.test(uaLower)) return 'x64';
  if (/\b(armv7|arm)\b/.test(uaLower)) return 'arm';
  return 'unknown';
}

function detectOSSync(): PlatformOS {
  if (typeof window === 'undefined') return 'unknown';
  if (Capacitor.isNativePlatform()) {
    const capOs = Capacitor.getPlatform();
    if (capOs === 'android') return 'android';
    if (capOs === 'ios') return 'ios';
  }
  if (window.puzzleverseDesktop?.isDesktop) {
    const p = window.puzzleverseDesktop.platform;
    if (p === 'win32') return 'windows';
    if (p === 'darwin') return 'macos';
    if (p === 'linux') return 'linux';
  }

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const ua = nav?.userAgent || '';
  const platformHint = ((nav as { userAgentData?: { platform?: string } })?.userAgentData?.platform || nav?.platform || '').toLowerCase();

  if (/\bCrOS\b/i.test(ua) || platformHint.includes('chrome os') || platformHint.includes('chromeos')) {
    return 'chromeos';
  }
  if (/Android/i.test(ua) || platformHint.includes('android')) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) || platformHint.includes('ios')) return 'ios';
  // iPadOS Safari desktop-mode check (MacIntel + multi-touch)
  if (nav && platformHint.includes('mac') && (nav.maxTouchPoints || 0) > 1 && !window.puzzleverseDesktop?.isDesktop) {
    return 'ios';
  }
  if (/Mac OS X|Macintosh/i.test(ua) || platformHint.includes('mac')) return 'macos';
  if (/Windows/i.test(ua) || platformHint.includes('win')) return 'windows';
  if (/Linux|X11/i.test(ua) || platformHint.includes('linux')) return 'linux';
  return 'unknown';
}

function detectStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.puzzleverseDesktop?.isDesktop || Capacitor.isNativePlatform()) return false;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  } catch {
    // Ignore media query restriction
  }
  return false;
}

function detectDeviceCategory(os: PlatformOS): DeviceCategory {
  if (typeof window === 'undefined') return 'unknown';
  if (os === 'windows' || os === 'macos' || os === 'linux' || os === 'chromeos') {
    const hasTouch = (navigator.maxTouchPoints || 0) > 1;
    if (os === 'chromeos' && hasTouch && window.innerWidth <= 1024) return 'tablet';
    return 'desktop';
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const width = window.innerWidth || 0;
  if (os === 'ios') {
    if (/iPad/i.test(ua) || width >= 768) return 'tablet';
    return 'mobile';
  }
  if (os === 'android') {
    if (!/Mobile/i.test(ua) || width >= 768) return 'tablet';
    return 'mobile';
  }
  return width > 0 && width < 768 ? 'mobile' : 'desktop';
}

export function getRecommendedTargetFor(os: PlatformOS, arch: CpuArch): DownloadTargetId {
  switch (os) {
    case 'windows':
      return arch === 'arm64' ? 'win_arm64_installer' : 'win_x64_installer';
    case 'macos':
      if (arch === 'x64') return 'mac_intel';
      if (arch === 'arm64') return 'mac_apple_silicon';
      return 'mac_universal';
    case 'linux':
      return arch === 'arm64' ? 'linux_arm64_appimage' : 'linux_x64_appimage';
    case 'android':
      return 'android_apk';
    case 'ios':
      return 'ios_ipa';
    case 'chromeos':
      return 'pwa_install';
    default:
      return 'web_play';
  }
}

export function formatOsLabel(os: PlatformOS): string {
  switch (os) {
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    case 'android':
      return 'Android';
    case 'ios':
      return 'iOS / iPadOS';
    case 'chromeos':
      return 'ChromeOS';
    default:
      return 'Unknown Platform';
  }
}

export function formatArchLabel(arch: CpuArch): string {
  switch (arch) {
    case 'x64':
      return '64-bit (x64)';
    case 'arm64':
      return 'ARM64';
    case 'arm':
      return 'ARM';
    default:
      return 'Architecture Auto / Unknown';
  }
}

function buildInfo(os: PlatformOS, arch: CpuArch): DetectedPlatformInfo {
  initPwaPromptCapture();
  const isElectron = typeof window !== 'undefined' && (Boolean(window.puzzleverseDesktop?.isDesktop) || window.location.protocol === 'app:');
  const isCapacitor = Capacitor.isNativePlatform();
  const isPwaInstalled = detectStandalonePwa();
  const runtime: RuntimeContainer = isElectron
    ? 'electron'
    : isCapacitor
    ? 'capacitor'
    : isPwaInstalled
    ? 'pwa'
    : 'web';

  const hasSwSupport = typeof navigator !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http');
  const pwaInstallState: PwaInstallState = isElectron || isCapacitor
    ? 'unsupported'
    : isPwaInstalled
    ? 'installed'
    : isPwaPromptAvailable()
    ? 'installable'
    : hasSwSupport
    ? 'unknown'
    : 'unsupported';

  const isNativeApp = isElectron || isCapacitor;
  const isInstalledApp = isNativeApp || isPwaInstalled;
  const isWebBrowser = !isInstalledApp;

  const capabilities: PlatformCapabilities = {
    fullscreen: isElectron || (typeof document !== 'undefined' && Boolean(document.documentElement?.requestFullscreen)),
    notifications: isElectron || (typeof window !== 'undefined' && 'Notification' in window),
    nativeShare: isCapacitor || (typeof navigator !== 'undefined' && typeof navigator.share === 'function'),
    clipboardShare: typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText),
    externalLinks: isElectron || isCapacitor || typeof window !== 'undefined',
    nativeUpdates: isElectron,
    pwaUpdates: !isElectron && !isCapacitor && hasSwSupport,
    appExit: isElectron || isCapacitor,
    haptics: isCapacitor || (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'),
    offlineStorage: typeof localStorage !== 'undefined',
    installPrompt: !isInstalledApp && (isPwaPromptAvailable() || os === 'ios' || os === 'chromeos' || os === 'android'),
  };

  return {
    os,
    arch,
    deviceCategory: detectDeviceCategory(os),
    runtime,
    isWebBrowser,
    isNativeApp,
    isDesktopApp: isElectron,
    isMobileApp: isCapacitor,
    isInstalledPWA: isPwaInstalled,
    isInstalledApp,
    canShowDownloadOptions: !isInstalledApp,
    canShowInstallPrompt: !isInstalledApp && capabilities.installPrompt,
    isElectron,
    isCapacitor,
    isMobileNative: isCapacitor,
    isPwaInstalled,
    pwaInstallState,
    isTouchCapable: typeof navigator !== 'undefined' ? (navigator.maxTouchPoints || 0) > 0 : false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    osLabel: formatOsLabel(os),
    archLabel: formatArchLabel(arch),
    runtimeLabel:
      runtime === 'electron'
        ? 'Desktop App (Electron)'
        : runtime === 'capacitor'
        ? `Mobile App (${os === 'ios' ? 'iOS' : 'Android'})`
        : runtime === 'pwa'
        ? 'Installed Web App (PWA)'
        : 'Web Browser',
    capabilities,
    recommendedTargetId: getRecommendedTargetFor(os, arch),
  };
}

/**
 * Subscribe to runtime platform changes (PWA install state, display-mode transitions, network status).
 */
export function usePlatformInfo(): DetectedPlatformInfo {
  const [info, setInfo] = useState<DetectedPlatformInfo>(() => detectPlatformSync());

  useEffect(() => {
    let active = true;
    const refresh = () => {
      detectPlatformAsync()
        .then((next) => {
          if (active) setInfo(next);
        })
        .catch(() => {
          if (active) setInfo(detectPlatformSync());
        });
    };

    refresh();
    const unsubPwa = subscribePwaInstallPrompt(() => refresh());
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.addEventListener('appinstalled', refresh);

    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia('(display-mode: standalone)');
      mql.addEventListener?.('change', refresh);
    } catch {
      // Ignore matchMedia listener errors
    }

    return () => {
      active = false;
      unsubPwa();
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('appinstalled', refresh);
      mql?.removeEventListener?.('change', refresh);
    };
  }, []);

  return info;
}

export function detectPlatformSync(): DetectedPlatformInfo {
  const os = detectOSSync();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const desktopArch = typeof window !== 'undefined' ? window.puzzleverseDesktop?.arch : undefined;
  const arch = desktopArch ? normalizeArch(desktopArch, '64', ua) : normalizeArch(null, null, ua);
  return buildInfo(os, arch);
}

export async function detectPlatformAsync(): Promise<DetectedPlatformInfo> {
  const os = detectOSSync();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  let arch: CpuArch = 'unknown';

  if (typeof window !== 'undefined' && window.puzzleverseDesktop?.isDesktop) {
    try {
      const info = await window.puzzleverseDesktop.getAppInfo();
      arch = normalizeArch(info.arch || window.puzzleverseDesktop.arch, '64', ua);
    } catch {
      arch = normalizeArch(window.puzzleverseDesktop.arch, '64', ua);
    }
    return buildInfo(os, arch);
  }

  const uaData = (
    navigator as Navigator & {
      userAgentData?: {
        getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>;
      };
    }
  )?.userAgentData;

  if (uaData?.getHighEntropyValues) {
    try {
      const hints = await uaData.getHighEntropyValues(['architecture', 'bitness']);
      arch = normalizeArch(hints.architecture, hints.bitness, ua);
    } catch {
      arch = normalizeArch(null, null, ua);
    }
  } else {
    arch = normalizeArch(null, null, ua);
  }

  return buildInfo(os, arch);
}
