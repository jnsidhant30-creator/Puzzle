import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { DESKTOP_RELEASE_META } from '../data/releaseMeta';
import { PageHeader, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  DesktopAppInfo,
  DesktopUpdateCheckResult,
  DesktopUpdateProgress,
} from '../types/desktop';
import {
  getPlatformAdapter,
  subscribePwaUpdate,
} from '../platform/adapter';
import {
  DetectedPlatformInfo,
  detectPlatformSync,
  subscribePwaInstallPrompt,
} from '../platform/detectPlatform';
import {
  Settings,
  Monitor,
  Volume2,
  VolumeX,
  Palette,
  RefreshCw,
  Wifi,
  WifiOff,
  HardDrive,
  Info,
  ShieldCheck,
  FileText,
  Bug,
  Download,
  Maximize2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Share2,
  LogOut,
  X,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    user,
    isGuest,
    isOnline,
    retryConnection,
    soundMuted,
    toggleSound,
    theme,
    setTheme,
    reduceMotion,
    toggleReduceMotion,
    highContrast,
    toggleHighContrast,
    dyslexicFont,
    toggleDyslexicFont,
    fontSizeScale,
    setFontSizeScale,
    resetAdaptiveProfiles,
    setActiveTab,
    updateProfile,
  } = useStore();

  const isDesktop = Boolean(window.puzzleverseDesktop?.isDesktop);
  const [platformInfo, setPlatformInfo] = useState<DetectedPlatformInfo>(() => detectPlatformSync());
  const [pwaInstallReady, setPwaInstallReady] = useState(false);
  const [pwaUpdateReady, setPwaUpdateReady] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<DesktopAppInfo | null>(null);
  const [rememberBounds, setRememberBounds] = useState(true);
  const [defaultFullscreen, setDefaultFullscreen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [windowDims, setWindowDims] = useState<{ width: number; height: number } | null>(null);

  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<DesktopUpdateCheckResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DesktopUpdateProgress | null>(null);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [remindedLater, setRemindedLater] = useState(false);

  const [storageInfo, setStorageInfo] = useState<string>('Calculating...');
  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);

  const [legalDoc, setLegalDoc] = useState<'about' | 'privacy' | 'terms' | 'report' | null>(null);
  const [bugSubject, setBugSubject] = useState('');
  const [bugDetails, setBugDetails] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);

  const computeStorageSummary = () => {
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
      setStorageInfo(`${(bytes / 1024).toFixed(1)} KB (${localStorage.length} saved keys)`);
    } catch {
      setStorageInfo('Local browser storage unavailable');
    }
  };

  useEffect(() => {
    computeStorageSummary();
    const adapter = getPlatformAdapter();
    adapter.getPlatformInfo().then(setPlatformInfo).catch(() => {});
    const unsubPwaInstall = subscribePwaInstallPrompt(setPwaInstallReady);
    const unsubPwaUpdate = subscribePwaUpdate(setPwaUpdateReady);

    if (!window.puzzleverseDesktop?.isDesktop) {
      return () => {
        unsubPwaInstall();
        unsubPwaUpdate();
      };
    }

    window.puzzleverseDesktop.getAppInfo().then(setAppInfo).catch(() => {});
    window.puzzleverseDesktop
      .getWindowState()
      .then((ws) => {
        setIsFullScreen(ws.isFullScreen);
        setRememberBounds(ws.rememberBounds);
        setDefaultFullscreen(ws.defaultFullscreen);
        setWindowDims({ width: ws.width, height: ws.height });
      })
      .catch(() => {});

    const unsubFs = window.puzzleverseDesktop.onFullscreenChange((fs) => setIsFullScreen(fs));
    const unsubProg = window.puzzleverseDesktop.onUpdateProgress((prog) => setDownloadProgress(prog));
    return () => {
      unsubPwaInstall();
      unsubPwaUpdate();
      unsubFs();
      unsubProg();
    };
  }, []);

  const handleCheckUpdates = async () => {
    setRemindedLater(false);
    setUpdateMsg(null);
    if (!isDesktop || !window.puzzleverseDesktop) {
      setUpdateState('checking');
      try {
        const res = await fetch(`https://api.github.com/repos/jnsidhant30-creator/Puzzle/releases/latest`);
        if (res.status === 404) {
          setUpdateState('up-to-date');
          setUpdateMsg(`Latest published version is v${DESKTOP_RELEASE_META.version}.`);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const tag = String(json.tag_name || DESKTOP_RELEASE_META.version).replace(/^v/i, '');
        setUpdateInfo({
          status: tag === DESKTOP_RELEASE_META.version ? 'up-to-date' : 'available',
          currentVersion: DESKTOP_RELEASE_META.version,
          latestVersion: tag,
          signed: false,
          downloadPageUrl: '/download',
          releaseUrl: json.html_url,
          releaseNotes: json.body,
        });
        setUpdateState(tag === DESKTOP_RELEASE_META.version ? 'up-to-date' : 'available');
      } catch (err) {
        setUpdateState('error');
        setUpdateMsg(err instanceof Error ? err.message : 'Unable to reach GitHub Releases.');
      }
      return;
    }

    setUpdateState('checking');
    const result = await window.puzzleverseDesktop.checkForUpdates();
    setUpdateInfo(result);
    if (result.status === 'available') {
      setUpdateState('available');
      setUpdateMsg(`Version v${result.latestVersion} is available.`);
    } else if (result.status === 'up-to-date') {
      setUpdateState('up-to-date');
      setUpdateMsg(result.message || `You are running the latest version (v${result.currentVersion}).`);
    } else {
      setUpdateState('error');
      setUpdateMsg(result.error || 'Update check failed. Check your internet connection.');
    }
  };

  const handleDownloadUpdate = async () => {
    if (!window.puzzleverseDesktop || !updateInfo) return;
    setUpdateState('downloading');
    setDownloadProgress({ percent: 0, transferred: 0, total: updateInfo.fileSize || 0 });
    const res = await window.puzzleverseDesktop.downloadUpdate(updateInfo);
    if (res.status === 'downloaded' && res.filePath) {
      setDownloadedPath(res.filePath);
      setUpdateState('downloaded');
      setUpdateMsg(
        `Downloaded and verified (${res.sha256?.slice(0, 12)}...). Note: installer is unsigned; Windows SmartScreen may ask before running.`
      );
    } else {
      setUpdateState('error');
      setUpdateMsg(res.error || 'Download failed.');
    }
  };

  const handleRestartToInstall = async () => {
    if (!window.puzzleverseDesktop || !downloadedPath) return;
    const res = await window.puzzleverseDesktop.installUpdateAndRestart(downloadedPath);
    if (!res.ok) {
      setUpdateMsg(
        res.reason === 'ACTIVE_GAME'
          ? 'Finish or exit your active puzzle first before launching the installer.'
          : res.reason || 'Could not launch downloaded installer.'
      );
    }
  };

  const handleClearOfflineCache = () => {
    const keysToRemove = ['puzzleverse_offline_practice_v1', 'puzzleverse_guest_user'];
    keysToRemove.forEach((k) => {
      if (!isGuest || k !== 'puzzleverse_guest_user') {
        localStorage.removeItem(k);
      }
    });
    computeStorageSummary();
    setCacheClearedMsg('Offline practice cache cleared cleanly.');
    setTimeout(() => setCacheClearedMsg(null), 3000);
  };

  const handleSubmitBugReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugSubject.trim() || !bugDetails.trim()) return;
    const reports = JSON.parse(localStorage.getItem('puzzleverse_local_reports') || '[]');
    reports.unshift({
      subject: bugSubject.trim(),
      details: bugDetails.trim(),
      version: appInfo?.version || DESKTOP_RELEASE_META.version,
      platform: isDesktop ? 'Windows Desktop' : 'Web Browser',
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('puzzleverse_local_reports', JSON.stringify(reports.slice(0, 10)));
    setBugSubmitted(true);
    setBugSubject('');
    setBugDetails('');
    computeStorageSummary();
  };

  const currentVersion = appInfo?.version || DESKTOP_RELEASE_META.version;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Settings"
        description="Manage audio, theme, accessibility, desktop window behavior, offline storage, and application updates."
      />

      {/* Application Info, Updates & Connectivity */}
      <Card surface="primary" padding="lg" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#36515F] pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#38C6BA]" />
            <h2 className="text-base font-bold text-[#F5F7F8]">Application</h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border ${
                isOnline
                  ? 'bg-[#38C6BA]/15 border-[#38C6BA]/40 text-[#A8E5D5]'
                  : 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#FBBF24]'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Online · Cloud Sync Active' : 'Offline Mode · Local Practice'}</span>
            </span>
            {!isOnline && (
              <Button variant="secondary" size="sm" onClick={() => retryConnection()}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </Button>
            )}
          </div>
        </div>

        {/* Version & Update Status */}
        <div className="bg-[#1C2D3B] border border-[#36515F] rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#98AAB8] font-semibold">Application Version &amp; Runtime</p>
              <p className="text-sm font-bold text-[#F5F7F8] font-tabular">
                PuzzleVerse ({platformInfo.runtimeLabel}) v{currentVersion} · {platformInfo.osLabel} ({platformInfo.archLabel})
              </p>
              <p className="text-[11px] text-[#B4C3CE] mt-0.5">
                {isDesktop
                  ? 'Desktop updates verify SHA-256/SHA-512 against GitHub Releases (unsigned installer).'
                  : platformInfo.isCapacitor
                  ? 'Mobile app powered by Capacitor WebView + shared PuzzleVerse engine.'
                  : 'Web & ChromeOS PWA updates precache via Service Worker when redeployed.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                loading={updateState === 'checking'}
                onClick={handleCheckUpdates}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check for Updates</span>
              </Button>
              {pwaUpdateReady && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => getPlatformAdapter().updates.applyPwaUpdate?.()}
                >
                  <span>Reload PWA Update</span>
                </Button>
              )}
              {pwaInstallReady && !isDesktop && !platformInfo.isCapacitor && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => getPlatformAdapter().promptPwaInstall()}
                >
                  <Download className="w-3.5 h-3.5 text-[#38C6BA]" />
                  <span>Install Web App</span>
                </Button>
              )}
              {!isDesktop && !platformInfo.isCapacitor && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('download')}>
                  <Download className="w-3.5 h-3.5" />
                  <span>All Platforms</span>
                </Button>
              )}
            </div>
          </div>

          {updateState !== 'idle' && !remindedLater && (
            <div className="pt-3 border-t border-[#36515F] space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                {updateState === 'up-to-date' && <CheckCircle2 className="w-4 h-4 text-[#34D399]" />}
                {updateState === 'error' && <AlertTriangle className="w-4 h-4 text-[#F87171]" />}
                {(updateState === 'available' || updateState === 'downloaded') && (
                  <Download className="w-4 h-4 text-[#38C6BA]" />
                )}
                <span className="font-semibold text-[#F5F7F8]">
                  Status: <span className="capitalize">{updateState.replace('-', ' ')}</span>
                </span>
              </div>
              {updateMsg && <p className="text-[#B4C3CE]">{updateMsg}</p>}

              {updateState === 'downloading' && downloadProgress && (
                <div className="space-y-1">
                  <div className="w-full h-2 rounded bg-[#142331] overflow-hidden">
                    <div
                      className="h-full bg-[#38C6BA] transition-all"
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#98AAB8] font-tabular">
                    Downloading update: {downloadProgress.percent}%
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {updateState === 'available' && isDesktop && updateInfo?.downloadUrl && (
                  <Button variant="accent" size="sm" onClick={handleDownloadUpdate}>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download v{updateInfo.latestVersion}</span>
                  </Button>
                )}
                {updateState === 'available' && updateInfo?.downloadPageUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (window.puzzleverseDesktop?.isDesktop) {
                        window.puzzleverseDesktop.openExternal(updateInfo.downloadPageUrl);
                      } else {
                        setActiveTab('download');
                      }
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Download Page</span>
                  </Button>
                )}
                {updateState === 'downloaded' && (
                  <Button variant="primary" size="sm" onClick={handleRestartToInstall}>
                    <span>Restart &amp; Run Installer</span>
                  </Button>
                )}
                {(updateState === 'available' || updateState === 'downloaded') && (
                  <Button variant="ghost" size="sm" onClick={() => setRemindedLater(true)}>
                    <span>Remind Me Later</span>
                  </Button>
                )}
                {updateState === 'error' && (
                  <Button variant="secondary" size="sm" onClick={handleCheckUpdates}>
                    <span>Retry Update Check</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Window & Fullscreen Preferences (Live IPC when inside Electron) */}
        {isDesktop && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#1C2D3B] border border-[#36515F] rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-[#F5F7F8] flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-[#38C6BA]" /> Fullscreen Mode (F11)
                </h3>
                <p className="text-[11px] text-[#B4C3CE] mt-0.5">
                  Current state: {isFullScreen ? 'Fullscreen active' : 'Windowed'}
                </p>
                <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-[#B4C3CE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultFullscreen}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setDefaultFullscreen(val);
                      window.puzzleverseDesktop?.setWindowPreferences({ defaultFullscreen: val });
                    }}
                    className="rounded border-[#36515F]"
                  />
                  <span>Launch in fullscreen next time</span>
                </label>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const res = await window.puzzleverseDesktop?.toggleFullscreen();
                  if (res) setIsFullScreen(res.isFullScreen);
                }}
              >
                <span>{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
              </Button>
            </div>

            <div className="bg-[#1C2D3B] border border-[#36515F] rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-[#F5F7F8] flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-[#93D1F2]" /> Window Size &amp; Position
                </h3>
                <p className="text-[11px] text-[#B4C3CE] mt-0.5 font-tabular">
                  {windowDims ? `Current window: ${windowDims.width} × ${windowDims.height}` : 'Default: 1440 × 900'}
                </p>
                <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-[#B4C3CE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberBounds}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setRememberBounds(val);
                      window.puzzleverseDesktop?.setWindowPreferences({ rememberBounds: val });
                    }}
                    className="rounded border-[#36515F]"
                  />
                  <span>Remember size and screen position</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Sound, Theme & Accessibility */}
      <Card surface="primary" padding="lg" className="space-y-4">
        <h2 className="text-base font-bold text-[#F5F7F8] border-b border-[#36515F] pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#38C6BA]" /> Audio, Theme &amp; Accessibility
        </h2>

        <div className="divide-y divide-[#36515F]">
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-[#F5F7F8]">Sound Effects</h3>
              <p className="text-[11px] text-[#B4C3CE]">Synthesized board moves, warnings, and victory chimes.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleSound}>
              {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#38C6BA]" />}
              <span>{soundMuted ? 'Muted' : 'Enabled'}</span>
            </Button>
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-[#F5F7F8] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#93D1F2]" /> Interface Theme
              </h3>
              <p className="text-[11px] text-[#B4C3CE]">Ocean Navy palette active; customize accent tone.</p>
            </div>
            <select
              aria-label="Interface Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="h-8 px-3 rounded-lg bg-[#1C2D3B] border border-[#36515F] text-xs font-semibold text-[#F5F7F8]"
            >
              <option value="dark">Ocean Navy (Default)</option>
              <option value="light">Warm Light Contrast</option>
            </select>
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-[#F5F7F8]">Reduced Motion</h3>
              <p className="text-[11px] text-[#B4C3CE]">Minimize transitions and celebratory motion effects.</p>
            </div>
            <Button
              variant={reduceMotion ? 'accent' : 'secondary'}
              size="sm"
              onClick={() => {
                toggleReduceMotion();
                if (user) {
                  updateProfile({
                    preferences: { ...(user.preferences || {}), reduceAnimations: !reduceMotion },
                  }).catch(() => {});
                }
              }}
            >
              <span>{reduceMotion ? 'Reduced Motion On' : 'Standard Motion'}</span>
            </Button>
          </div>

          <div className="py-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-[#F5F7F8]">Readability &amp; Contrast</h3>
              <p className="text-[11px] text-[#B4C3CE]">High contrast borders, readable spacing, and text sizing.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={highContrast ? 'accent' : 'secondary'} size="sm" onClick={toggleHighContrast}>
                <span>{highContrast ? 'High Contrast On' : 'High Contrast Off'}</span>
              </Button>
              <Button variant={dyslexicFont ? 'accent' : 'secondary'} size="sm" onClick={toggleDyslexicFont}>
                <span>{dyslexicFont ? 'Dyslexic Font On' : 'Default Font'}</span>
              </Button>
              <select
                aria-label="Text scale"
                value={fontSizeScale}
                onChange={(e) => setFontSizeScale(e.target.value as any)}
                className="h-8 px-2.5 rounded-lg bg-[#1C2D3B] border border-[#36515F] text-xs font-semibold text-[#F5F7F8]"
              >
                <option value="sm">Text: Compact</option>
                <option value="md">Text: Default</option>
                <option value="lg">Text: Large</option>
                <option value="xl">Text: Extra Large</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Storage Management & Legal / About */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card surface="primary" padding="lg" className="space-y-4">
          <h2 className="text-base font-bold text-[#F5F7F8] flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#93D1F2]" /> Storage Management
          </h2>
          <p className="text-xs text-[#B4C3CE]">
            Local browser storage &amp; offline practice footprint: <strong className="text-[#F5F7F8]">{storageInfo}</strong>
          </p>
          {cacheClearedMsg && (
            <p className="text-xs font-semibold text-[#34D399]">{cacheClearedMsg}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleClearOfflineCache}>
              <span>Clear Offline Practice Cache</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await resetAdaptiveProfiles();
                setCacheClearedMsg('Adaptive difficulty profiles reset.');
                setTimeout(() => setCacheClearedMsg(null), 3000);
              }}
            >
              <span>Reset Adaptive Calibration</span>
            </Button>
          </div>
        </Card>

        <Card surface="primary" padding="lg" className="space-y-4">
          <h2 className="text-base font-bold text-[#F5F7F8] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#38C6BA]" /> About, Legal &amp; Support
          </h2>
          <p className="text-xs text-[#B4C3CE]">
            PuzzleVerse v{currentVersion} · Published by {DESKTOP_RELEASE_META.publisher}
          </p>
          {shareMsg && <p className="text-xs font-semibold text-[#34D399]">{shareMsg}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => setLegalDoc('about')}>
              <Info className="w-3.5 h-3.5" />
              <span>About PuzzleVerse</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setLegalDoc('privacy')}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setLegalDoc('terms')}>
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Use</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setLegalDoc('report'); setBugSubmitted(false); }}>
              <Bug className="w-3.5 h-3.5" />
              <span>Report a Problem</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const res = await getPlatformAdapter().share({
                  title: 'PuzzleVerse',
                  text: 'Challenge Your Mind. Beat Your Best. Play 16 puzzles on PuzzleVerse!',
                  url: 'https://puzzleverse-e16e4.web.app/',
                });
                setShareMsg(res.shared ? (res.method === 'clipboard' ? 'Share link copied to clipboard.' : 'Shared!') : 'Sharing unavailable on this browser.');
                setTimeout(() => setShareMsg(null), 3000);
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share PuzzleVerse</span>
            </Button>
            {platformInfo.capabilities.appExit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => getPlatformAdapter().exitApp()}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Application</span>
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Modal for About / Privacy / Terms / Report */}
      {legalDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-[#233D4A] border border-[#4A6A7B] rounded-xl max-w-lg w-full p-6 space-y-4 text-[#F5F7F8]">
            <div className="flex items-center justify-between border-b border-[#36515F] pb-3">
              <h3 className="text-base font-bold">
                {legalDoc === 'about'
                  ? 'About PuzzleVerse'
                  : legalDoc === 'privacy'
                  ? 'Privacy Policy'
                  : legalDoc === 'terms'
                  ? 'Terms of Use'
                  : 'Report a Problem'}
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setLegalDoc(null)}
                className="p-1 text-[#B4C3CE] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {legalDoc === 'about' && (
              <div className="space-y-2.5 text-xs sm:text-sm text-[#B4C3CE] leading-relaxed">
                <p className="text-[#F5F7F8] font-bold">PuzzleVerse — Challenge Your Mind. Beat Your Best.</p>
                <p>Version {currentVersion} · Publisher: {DESKTOP_RELEASE_META.publisher}</p>
                <p>Includes 16 interactive puzzle modes with procedural challenge generation, Daily Puzzle, Mastery, Clubs, and dual Online + Offline play.</p>
                <p className="text-[11px] text-[#98AAB8]">Code signing status: {appInfo?.signed ? 'Signed' : 'Unsigned open-release build (verify SHA-256 checksum on /download)'}.</p>
              </div>
            )}

            {legalDoc === 'privacy' && (
              <div className="space-y-2.5 text-xs sm:text-sm text-[#B4C3CE] leading-relaxed">
                <p>PuzzleVerse stores only gameplay stats, profile preferences, and optional Firebase Authentication identity needed to sync progression.</p>
                <p>Offline Guest Practice saves results locally on your device only and does not upload data until you sign in with an online account.</p>
                <p>No plain-text passwords are ever stored by PuzzleVerse Desktop. Before opening public self-signup to children under 13, parental consent controls apply under COPPA/GDPR-K rules.</p>
              </div>
            )}

            {legalDoc === 'terms' && (
              <div className="space-y-2.5 text-xs sm:text-sm text-[#B4C3CE] leading-relaxed">
                <p>PuzzleVerse is provided for personal, non-commercial cognitive entertainment and fair competitive play.</p>
                <p>Offline practice sessions and paused solo runs are excluded from verified global leaderboards to maintain ranking integrity.</p>
              </div>
            )}

            {legalDoc === 'report' && (
              <form onSubmit={handleSubmitBugReport} className="space-y-3">
                {bugSubmitted ? (
                  <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                    Saved locally in diagnostic log. You can also open an issue on GitHub Releases if connected online.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      value={bugSubject}
                      onChange={(e) => setBugSubject(e.target.value)}
                      placeholder="Short summary (e.g. Display issue or puzzle bug)"
                      className="w-full h-9 px-3 rounded-lg bg-[#1C2D3B] border border-[#36515F] text-xs text-white"
                    />
                    <textarea
                      required
                      rows={3}
                      value={bugDetails}
                      onChange={(e) => setBugDetails(e.target.value)}
                      placeholder="Steps to reproduce and expected behavior..."
                      className="w-full p-3 rounded-lg bg-[#1C2D3B] border border-[#36515F] text-xs text-white resize-none"
                    />
                    <Button type="submit" variant="primary" size="sm" className="w-full">
                      Save Problem Report
                    </Button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://github.com/jnsidhant30-creator/Puzzle/issues/new`;
                    if (window.puzzleverseDesktop?.isDesktop) {
                      window.puzzleverseDesktop.openExternal(url);
                    } else {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="text-xs font-semibold text-[#A8E5D5] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open GitHub Issue Tracker</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-[#36515F] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setLegalDoc(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
