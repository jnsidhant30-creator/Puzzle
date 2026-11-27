import React, { useEffect, useMemo, useState } from 'react';
import {
  DESKTOP_RELEASE_META,
  RELEASE_DATE,
  RELEASE_VERSION,
  UNIVERSAL_PACKAGES,
  UniversalPackageMeta,
} from '../data/releaseMeta';
import {
  CpuArch,
  PlatformOS,
  detectPlatformAsync,
  detectPlatformSync,
  formatArchLabel,
  formatOsLabel,
  getRecommendedTargetFor,
  subscribePwaInstallPrompt,
} from '../platform/detectPlatform';
import { getPlatformAdapter } from '../platform/adapter';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PuzzleCoverArt } from '../components/PuzzleArt';
import {
  Download,
  Monitor,
  Smartphone,
  Laptop,
  Globe,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Play,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

interface DownloadPageProps {
  onPlayWeb?: () => void;
  embedded?: boolean;
}

const MANUAL_OS_OPTIONS: Array<{ id: 'auto' | PlatformOS; label: string }> = [
  { id: 'auto', label: 'Auto-Detected' },
  { id: 'windows', label: 'Windows' },
  { id: 'macos', label: 'macOS' },
  { id: 'linux', label: 'Linux' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iPhone / iPad' },
  { id: 'chromeos', label: 'ChromeOS & PWA' },
];

const MANUAL_ARCH_OPTIONS: Array<{ id: 'auto' | CpuArch; label: string }> = [
  { id: 'auto', label: 'Auto Architecture' },
  { id: 'x64', label: '64-bit (x64)' },
  { id: 'arm64', label: 'ARM64' },
];

const FAQS = [
  {
    q: 'Do I need Node.js, Java, Python, Xcode, or developer tools installed?',
    a: 'No. Every released desktop installer, portable executable, Android package, and PWA runs standalone for end users without installing Node.js, npm, Java, Firebase CLI, or VS Code.',
  },
  {
    q: 'What is the difference between the Windows Installer and Portable version?',
    a: 'The NSIS Installer sets up PuzzleVerse per-user (no Administrator prompt needed) with Desktop and Start Menu shortcuts plus a standard Uninstaller. The Portable .exe runs standalone from any folder or USB drive.',
  },
  {
    q: 'Why are some desktop or mobile packages marked "Pending CI / Signing" instead of showing a download button?',
    a: 'This portal strictly enables downloads only for build targets actually compiled, verified, and uploaded publicly with real SHA-256 checksums. Windows x64/ARM64 EXEs and the signed Android Universal APK are available now, while macOS, Linux, and iOS binaries stay disabled cleanly until built on their target toolchains.',
  },
  {
    q: 'How can ChromeOS, macOS, Linux, Android, and iPhone/iPad users install PuzzleVerse right now?',
    a: 'All platforms can immediately launch the Web App or install the offline-capable Progressive Web App (PWA): Chrome/Edge/ChromeOS users can click Install Web App; iPhone & iPad Safari users can tap Share → Add to Home Screen.',
  },
  {
    q: 'Can I play offline in Guest mode without an account?',
    a: 'Yes! Launch any package or installed PWA and pick Play Offline (Guest Practice) across all 16 games. Offline practice stats save locally and stay separate from competitive online leaderboards.',
  },
];

export const DownloadPage: React.FC<DownloadPageProps> = ({ onPlayWeb, embedded = false }) => {
  const [detected, setDetected] = useState(() => detectPlatformSync());
  const [manualOs, setManualOs] = useState<'auto' | PlatformOS>('auto');
  const [manualArch, setManualArch] = useState<'auto' | CpuArch>('auto');
  const [pwaPromptReady, setPwaPromptReady] = useState(false);
  const [pwaStatusMsg, setPwaStatusMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    detectPlatformAsync().then(setDetected).catch(() => {});
    const unsubPwa = subscribePwaInstallPrompt(setPwaPromptReady);
    return () => unsubPwa();
  }, []);

  const effectiveOs: PlatformOS = manualOs === 'auto' ? detected.os : manualOs;
  const effectiveArch: CpuArch = manualArch === 'auto' ? detected.arch : manualArch;

  const recommendedPackage = useMemo((): UniversalPackageMeta => {
    const recId = getRecommendedTargetFor(effectiveOs, effectiveArch);
    const preferred = UNIVERSAL_PACKAGES.find((p) => p.id === recId);
    if (preferred && preferred.available) return preferred;
    // Fallback cleanly to any available package for that OS, or PWA / Web App
    const osAvailable = UNIVERSAL_PACKAGES.find((p) => p.os === effectiveOs && p.available);
    if (osAvailable) return osAvailable;
    return UNIVERSAL_PACKAGES.find((p) => p.id === 'pwa_install') || UNIVERSAL_PACKAGES[UNIVERSAL_PACKAGES.length - 1];
  }, [effectiveOs, effectiveArch]);

  const visiblePackages = useMemo(() => {
    if (manualOs === 'auto') return UNIVERSAL_PACKAGES;
    if (manualOs === 'chromeos') {
      return UNIVERSAL_PACKAGES.filter((p) => p.id === 'pwa_install' || p.id === 'web_play');
    }
    return UNIVERSAL_PACKAGES.filter(
      (p) => p.os === manualOs || p.id === 'pwa_install' || p.id === 'web_play'
    );
  }, [manualOs]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard fallback unavailable
    }
  };

  const handleOpenWebPlay = () => {
    if (onPlayWeb) {
      onPlayWeb();
      return;
    }
    window.location.href = '/login';
  };

  const handleInstallPwa = async () => {
    const res = await getPlatformAdapter().promptPwaInstall();
    if (res.outcome === 'accepted') {
      setPwaStatusMsg('PuzzleVerse Web App installation accepted!');
    } else if (res.outcome === 'dismissed') {
      setPwaStatusMsg('Installation prompt dismissed. You can trigger Install App from your browser address bar anytime.');
    } else if (effectiveOs === 'ios') {
      setPwaStatusMsg('On iPhone/iPad Safari: tap the Share button at the bottom bar, then choose "Add to Home Screen".');
    } else {
      setPwaStatusMsg('Open this site in Chrome, Edge, or Safari and select "Install App" / "Add to Home Screen" from the browser menu.');
    }
  };

  const handleExternalClick = (url: string) => {
    getPlatformAdapter().openExternal(url);
  };

  const primaryWinInstaller = UNIVERSAL_PACKAGES.find((p) => p.id === 'win_x64_installer')!;

  return (
    <div
      className={
        embedded
          ? 'space-y-6 animate-fade-in'
          : 'min-h-[100dvh] bg-[#142331] text-[#F5F7F8] font-sans pb-[env(safe-area-inset-bottom)]'
      }
    >
      {!embedded && (
        <header className="border-b border-[#36515F] bg-[#1C2D3B] pt-[env(safe-area-inset-top)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <a
              href="/"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA] rounded-lg"
            >
              <BrandLogo size={30} />
            </a>
            <div className="flex items-center gap-2.5">
              {pwaPromptReady && (
                <Button variant="secondary" size="sm" onClick={handleInstallPwa}>
                  <Download className="w-3.5 h-3.5 text-[#38C6BA]" />
                  <span>Install Web App</span>
                </Button>
              )}
              <Button variant="accent" size="sm" onClick={handleOpenWebPlay}>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play in Browser</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? 'max-w-6xl mx-auto space-y-6' : 'max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8'}>
        {/* Hero Overview + Automatic Platform Detection */}
        <Card surface="ivory" padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#D7F1EC] border border-[#087F8C] text-[#142331]">
                    Version {RELEASE_VERSION} · {RELEASE_DATE}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#E9EEE8] border border-[#D5DEDB] text-[#526575]">
                    Detected: {formatOsLabel(effectiveOs)} · {formatArchLabel(effectiveArch)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-[#142331] tracking-tight leading-tight">
                  Download PuzzleVerse for Your Device
                </h1>
                <p className="text-sm sm:text-base text-[#526575] leading-relaxed">
                  {DESKTOP_RELEASE_META.tagline} One shared PuzzleVerse experience across Windows, macOS, Linux, Android, iOS, and ChromeOS Web App — play all 16 games online or offline.
                </p>

                {effectiveArch === 'unknown' && (effectiveOs === 'windows' || effectiveOs === 'macos') && (
                  <div className="p-3 rounded-lg bg-[#E0F2FE] border border-[#38BDF8]/60 text-[#0C4A6E] text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Your browser did not expose CPU architecture details. Select <strong>64-bit (x64)</strong> or <strong>ARM64</strong> below instead of assuming your processor type.
                    </span>
                  </div>
                )}

                {pwaStatusMsg && (
                  <div className="p-3 rounded-lg bg-[#D7F1EC] border border-[#087F8C]/50 text-[#142331] text-xs font-semibold">
                    {pwaStatusMsg}
                  </div>
                )}
              </div>

              {/* Primary Recommended Action + Web / PWA Actions */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  {recommendedPackage.id !== 'pwa_install' && recommendedPackage.id !== 'web_play' && recommendedPackage.available ? (
                    <a
                      href={recommendedPackage.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 px-5 rounded-lg bg-[#087F8C] hover:bg-[#066B75] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>{recommendedPackage.title}</span>
                    </a>
                  ) : (
                    <Button variant="primary" size="lg" onClick={handleInstallPwa}>
                      <Globe className="w-4 h-4" />
                      <span>{detected.isPwaInstalled ? 'Web App Installed' : 'Install Web App (PWA)'}</span>
                    </Button>
                  )}

                  {recommendedPackage.id !== 'pwa_install' && (
                    <Button variant="outlineLight" size="lg" onClick={handleInstallPwa}>
                      <Globe className="w-4 h-4 text-[#087F8C]" />
                      <span>{detected.isPwaInstalled ? 'Web App Installed' : 'Install Web App (PWA)'}</span>
                    </Button>
                  )}

                  {effectiveOs !== 'android' &&
                    effectiveOs !== 'ios' &&
                    primaryWinInstaller.available &&
                    recommendedPackage.id !== primaryWinInstaller.id && (
                      <a
                        href={primaryWinInstaller.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-4 rounded-lg bg-white hover:bg-[#E9EEE8] text-[#142331] border border-[#C3D0CB] text-sm font-bold inline-flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4 text-[#087F8C]" />
                        <span>Windows x64</span>
                      </a>
                    )}

                  <Button variant="outlineLight" size="lg" onClick={handleOpenWebPlay}>
                    <Play className="w-4 h-4 fill-current text-[#087F8C]" />
                    <span>Play in Browser</span>
                  </Button>
                </div>

                {recommendedPackage.id === 'android_apk' && (
                  <p className="text-xs font-semibold text-[#3B5263]">
                    Version {recommendedPackage.version ?? RELEASE_VERSION} · {recommendedPackage.sizeLabel} · {recommendedPackage.requirements}
                  </p>
                )}
              </div>
            </div>

            {/* Platform Detection & Preview Card */}
            <div className="lg:col-span-5 bg-[#1C2D3B] border-t lg:border-t-0 lg:border-l border-[#D5DEDB] p-5 flex flex-col justify-between gap-4">
              <div className="rounded-xl bg-[#142331] border border-[#4A6A7B] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A8E5D5]">Automatic Platform Detection</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#233D4A] border border-[#36515F] text-[#93D1F2]">
                    {detected.runtimeLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-[#1C2D3B] rounded-lg p-2.5 border border-[#36515F]">
                    <span className="text-[#98AAB8] block text-[11px]">Operating System</span>
                    <span className="font-bold text-[#F5F7F8]">{formatOsLabel(detected.os)}</span>
                  </div>
                  <div className="bg-[#1C2D3B] rounded-lg p-2.5 border border-[#36515F]">
                    <span className="text-[#98AAB8] block text-[11px]">CPU Architecture</span>
                    <span className="font-bold text-[#F5F7F8]">{formatArchLabel(detected.arch)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['laser_mirror', 'block_escape'] as const).map((t) => (
                    <div key={t} className="rounded-lg bg-[#233D4A] border border-[#36515F] overflow-hidden h-14">
                      <PuzzleCoverArt type={t} variant="light" className="w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Override Controls */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="manual-os-select" className="block text-[11px] font-semibold text-[#B4C3CE] mb-1">
                    Manual Platform Selection
                  </label>
                  <select
                    id="manual-os-select"
                    value={manualOs}
                    onChange={(e) => setManualOs(e.target.value as 'auto' | PlatformOS)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#142331] border border-[#36515F] text-xs font-semibold text-[#F5F7F8]"
                  >
                    {MANUAL_OS_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="manual-arch-select" className="block text-[11px] font-semibold text-[#B4C3CE] mb-1">
                    CPU Architecture
                  </label>
                  <select
                    id="manual-arch-select"
                    value={manualArch}
                    onChange={(e) => setManualArch(e.target.value as 'auto' | CpuArch)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#142331] border border-[#36515F] text-xs font-semibold text-[#F5F7F8]"
                  >
                    {MANUAL_ARCH_OPTIONS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cross-Platform Download Matrix */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F7F8]">
                All Platform Packages (v{RELEASE_VERSION})
              </h2>
              <p className="text-xs sm:text-sm text-[#B4C3CE]">
                Only builds compiled, SHA-256 verified, and uploaded publicly enable direct binary download links.
              </p>
            </div>
            {manualOs !== 'auto' && (
              <Button variant="ghost" size="sm" onClick={() => setManualOs('auto')}>
                Show All Platforms
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visiblePackages.map((pkg) => {
              const Icon =
                pkg.os === 'android' || pkg.os === 'ios'
                  ? Smartphone
                  : pkg.os === 'macos'
                  ? Laptop
                  : pkg.os === 'chromeos' || pkg.os === 'all'
                  ? Globe
                  : Monitor;

              return (
                <Card
                  key={pkg.id}
                  surface="primary"
                  padding="md"
                  className={`flex flex-col justify-between gap-3.5 ${
                    recommendedPackage.id === pkg.id ? 'border-[#38C6BA]' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#1C2D3B] border border-[#36515F] text-[#A8E5D5]">
                            {pkg.badge}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              pkg.available
                                ? 'bg-[#10B981]/15 text-[#6EE7B7] border border-[#10B981]/40'
                                : 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/40'
                            }`}
                          >
                            {pkg.available ? 'Verified Available' : 'Pending CI / Signing'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#F5F7F8] leading-snug">{pkg.title}</h3>
                        <p className="text-[11px] text-[#93D1F2] font-mono truncate">{pkg.fileName}</p>
                      </div>
                      <Icon className="w-5 h-5 text-[#93D1F2] shrink-0 mt-0.5" />
                    </div>

                    <p className="text-xs text-[#B4C3CE] leading-relaxed">{pkg.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#1C2D3B] border border-[#36515F] rounded-lg p-2.5">
                      <div>
                        <span className="text-[#98AAB8] block text-[10px]">Version · Date</span>
                        <span className="font-bold text-[#F5F7F8] font-tabular">
                          {pkg.version ?? RELEASE_VERSION} · {RELEASE_DATE}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#98AAB8] block text-[10px]">Size</span>
                        <span className="font-bold text-[#F5F7F8] font-tabular">{pkg.sizeLabel}</span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-[#36515F]/70">
                        <span className="text-[#98AAB8] block text-[10px]">Supported Platforms &amp; Versions</span>
                        <span className="font-semibold text-[#A8E5D5]">{pkg.requirements}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#B4C3CE] font-semibold">SHA-256 / Trust</span>
                        {pkg.available && pkg.sha256.length === 64 && (
                          <button
                            type="button"
                            onClick={() => handleCopy(pkg.id, pkg.sha256)}
                            className="inline-flex items-center gap-1 text-[#A8E5D5] hover:text-[#38C6BA] font-semibold"
                          >
                            {copiedId === pkg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === pkg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      <code className="block w-full bg-[#142331] border border-[#36515F] rounded px-2.5 py-1.5 text-[10px] font-mono text-[#93D1F2] break-all">
                        {pkg.sha256}
                      </code>
                      <p className="text-[11px] text-[#98AAB8] leading-snug">{pkg.signingNote}</p>
                    </div>
                  </div>

                  <div className="pt-1">
                    {pkg.id === 'pwa_install' ? (
                      <Button variant="primary" size="sm" className="w-full" onClick={handleInstallPwa}>
                        <Download className="w-3.5 h-3.5" />
                        <span>Install Web App (PWA)</span>
                      </Button>
                    ) : pkg.id === 'web_play' ? (
                      <Button variant="accent" size="sm" className="w-full" onClick={handleOpenWebPlay}>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play in Browser</span>
                      </Button>
                    ) : pkg.available ? (
                      <a
                        href={pkg.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-9 px-3 rounded-lg bg-[#087F8C] hover:bg-[#066B75] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Verified Package</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="w-full h-9 px-3 rounded-lg bg-[#1C2D3B] border border-[#36515F] text-[#98AAB8] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <span>Unavailable Here — Use Web / PWA or CI</span>
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Code Signing Transparency & Universal Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card surface="primary" padding="lg" className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-[#FBBF24]">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold text-[#F5F7F8]">Code-Signing &amp; OS Trust Status</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#B4C3CE] leading-relaxed">
              {DESKTOP_RELEASE_META.signedStatus}
            </p>
            <div className="bg-[#1C2D3B] border border-[#36515F] rounded-lg p-3 text-xs text-[#B4C3CE] space-y-1.5">
              <p className="font-semibold text-[#F5F7F8]">Verify checksum on Windows PowerShell:</p>
              <code className="block font-mono text-[11px] text-[#A8E5D5] break-all">
                Get-FileHash .\PuzzleVerse-Setup-{RELEASE_VERSION}-x64.exe -Algorithm SHA256
              </code>
            </div>
            <button
              type="button"
              onClick={() => handleExternalClick(DESKTOP_RELEASE_META.releasePageUrl)}
              className="text-xs font-bold text-[#A8E5D5] hover:text-[#38C6BA] inline-flex items-center gap-1.5"
            >
              <span>Inspect GitHub Release v{RELEASE_VERSION}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Card>

          <Card surface="primary" padding="lg" className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-[#38C6BA]">
              <Cpu className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold text-[#F5F7F8]">Cross-Platform Support Matrix</h2>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-[#B4C3CE]">
              {DESKTOP_RELEASE_META.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#38C6BA] shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Installation Guide & Release Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card surface="primary" padding="lg" className="lg:col-span-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F8]">Platform Installation Instructions</h2>
            <ul className="space-y-2 text-xs sm:text-sm text-[#B4C3CE]">
              <li>
                <strong className="text-[#F5F7F8]">Windows:</strong> Run the x64 or ARM64 Setup EXE (per-user install) or Portable EXE directly without Node.js. Verify SHA-256 before dismissing SmartScreen.
              </li>
              <li>
                <strong className="text-[#F5F7F8]">macOS &amp; Linux:</strong> Install immediately as a Chrome/Edge/Safari Web App, or build `.dmg` / `.AppImage` / `.deb` / `.rpm` via the GitHub Actions macOS/Linux workflows.
              </li>
              <li>
                <strong className="text-[#F5F7F8]">Android &amp; ChromeOS:</strong> Download <strong>PuzzleVerse-v1.0.0-Android.apk</strong> directly (Android 7.0+ / API 24+, signed release keystore), or click <strong>Install Web App (PWA)</strong> for instant browser installation.
              </li>
              <li>
                <strong className="text-[#F5F7F8]">iPhone &amp; iPad:</strong> Open in Safari → tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for full-screen standalone play.
              </li>
            </ul>
          </Card>

          <Card surface="primary" padding="lg" className="lg:col-span-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F8]">
              Release Notes — v{RELEASE_VERSION}
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-[#B4C3CE]">
              {DESKTOP_RELEASE_META.releaseNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#38C6BA] font-bold">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Frequently Asked Questions */}
        <Card surface="primary" padding="lg" className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#93D1F2]" />
            <h2 className="text-base font-bold text-[#F5F7F8]">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-[#36515F]">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 text-left text-xs sm:text-sm font-bold text-[#F5F7F8] hover:text-[#38C6BA] transition-colors"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-[#B4C3CE] leading-relaxed">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
};
