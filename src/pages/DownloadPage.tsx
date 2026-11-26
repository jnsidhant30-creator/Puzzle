import React, { useMemo, useState } from 'react';
import { DESKTOP_RELEASE_META } from '../data/releaseMeta';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PuzzleCoverArt } from '../components/PuzzleArt';
import {
  Download,
  Monitor,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Play,
  HardDrive,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

interface DownloadPageProps {
  onPlayWeb?: () => void;
  embedded?: boolean;
}

function detectVisitorPlatform(): {
  label: string;
  isWindows: boolean;
  isMobileOrNonWindowsDesktop: boolean;
} {
  if (typeof navigator === 'undefined') {
    return { label: 'Desktop Browser', isWindows: true, isMobileOrNonWindowsDesktop: false };
  }
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return { label: 'Android', isWindows: false, isMobileOrNonWindowsDesktop: true };
  if (/iPhone|iPad|iPod/i.test(ua)) return { label: 'iOS', isWindows: false, isMobileOrNonWindowsDesktop: true };
  if (/Mac OS X|Macintosh/i.test(ua)) return { label: 'macOS', isWindows: false, isMobileOrNonWindowsDesktop: true };
  if (/Linux/i.test(ua)) return { label: 'Linux', isWindows: false, isMobileOrNonWindowsDesktop: true };
  if (/Windows/i.test(ua)) return { label: 'Windows (64-bit)', isWindows: true, isMobileOrNonWindowsDesktop: false };
  return { label: 'Web Browser', isWindows: false, isMobileOrNonWindowsDesktop: true };
}

const FAQS = [
  {
    q: 'Do I need Node.js or developer tools installed?',
    a: 'No. Both the Windows Installer and Portable executable bundle everything needed to run PuzzleVerse immediately on Windows 10 and Windows 11 (64-bit).',
  },
  {
    q: 'What is the difference between the Installer and Portable version?',
    a: 'The Installer sets up PuzzleVerse under your Windows user profile with Start Menu and Desktop shortcuts plus a standard Uninstaller, requiring no Administrator rights. The Portable .exe runs standalone from any folder or USB drive without installation.',
  },
  {
    q: 'Why does Windows SmartScreen show a warning on an unsigned build?',
    a: 'Version 1.0.0 is published transparently as an unsigned binary because no paid Authenticode certificate is attached yet. You can verify the SHA-256 checksum on this page before opening and compare it with Get-FileHash in PowerShell.',
  },
  {
    q: 'Can I play offline and keep my progress across Web and Desktop?',
    a: 'Yes! You can launch and play offline in Guest Practice mode at any time. When connected to the internet, signing in with the same PuzzleVerse account syncs your level, XP, profile, and leaderboard records with the website.',
  },
  {
    q: 'Does the Windows download work on macOS, Linux, Android, or iOS?',
    a: 'No. These .exe executables target Windows 10 and Windows 11 (64-bit x64) only. On macOS, Linux, Android, or iOS, click Play on Web to play directly in your browser.',
  },
];

export const DownloadPage: React.FC<DownloadPageProps> = ({ onPlayWeb, embedded = false }) => {
  const [copiedHash, setCopiedHash] = useState<'installer' | 'portable' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const platformInfo = useMemo(() => detectVisitorPlatform(), []);

  const handleCopy = async (kind: 'installer' | 'portable', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(kind);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleOpenWebPlay = () => {
    if (onPlayWeb) {
      onPlayWeb();
      return;
    }
    window.location.href = '/login';
  };

  const handleExternalClick = (url: string) => {
    if (window.puzzleverseDesktop?.isDesktop) {
      window.puzzleverseDesktop.openExternal(url);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={embedded ? 'space-y-6 animate-fade-in' : 'min-h-screen bg-[#142331] text-[#F5F7F8] font-sans'}>
      {!embedded && (
        <header className="border-b border-[#36515F] bg-[#1C2D3B]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <a href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA] rounded-lg">
              <BrandLogo size={30} />
            </a>
            <div className="flex items-center gap-2.5">
              <Button variant="accent" size="sm" onClick={handleOpenWebPlay}>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Website Play Now</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? 'max-w-6xl mx-auto space-y-6' : 'max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8'}>
        {/* Hero Overview + Desktop App Preview */}
        <Card surface="ivory" padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#D7F1EC] border border-[#087F8C] text-[#142331]">
                    Version {DESKTOP_RELEASE_META.version} · {DESKTOP_RELEASE_META.releaseDate}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#E9EEE8] border border-[#D5DEDB] text-[#526575]">
                    {DESKTOP_RELEASE_META.supportedOS}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-[#142331] tracking-tight leading-tight">
                  Download PuzzleVerse for Windows
                </h1>
                <p className="text-sm sm:text-base text-[#526575] leading-relaxed">
                  {DESKTOP_RELEASE_META.tagline} Play all 16 handcrafted logic, word, math, memory, and spatial puzzles directly on your Windows PC — online with full cloud progression or offline anytime.
                </p>

                {platformInfo.isMobileOrNonWindowsDesktop && (
                  <div className="p-3 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/50 text-[#78350F] text-xs font-semibold">
                    Detected <strong>{platformInfo.label}</strong>: These <code>.exe</code> downloads are built exclusively for <strong>Windows 10 &amp; 11 (64-bit)</strong> and do not run natively on Android, iOS, macOS, or Linux. Use <strong>Website Play Now</strong> on this device.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={DESKTOP_RELEASE_META.installer.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 rounded-lg bg-[#087F8C] hover:bg-[#066B75] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#142331]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for Windows</span>
                </a>
                <a
                  href={DESKTOP_RELEASE_META.portable.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 rounded-lg bg-white hover:bg-[#E9EEE8] text-[#142331] border border-[#C3D0CB] text-sm font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <HardDrive className="w-4 h-4 text-[#087F8C]" />
                  <span>Download Portable Version</span>
                </a>
                <Button variant="outlineLight" size="lg" onClick={handleOpenWebPlay}>
                  <Play className="w-4 h-4 fill-current text-[#087F8C]" />
                  <span>Play Now in Browser</span>
                </Button>
              </div>
            </div>

            {/* Branded Desktop Window Preview */}
            <div className="lg:col-span-5 bg-[#1C2D3B] border-t lg:border-t-0 lg:border-l border-[#D5DEDB] p-5 flex items-center justify-center">
              <div className="w-full rounded-xl bg-[#142331] border border-[#4A6A7B] overflow-hidden shadow-lg">
                <div className="h-8 bg-[#1C2D3B] border-b border-[#36515F] px-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38C6BA]" />
                    <span className="text-[11px] font-bold text-[#F5F7F8]">PuzzleVerse Desktop v{DESKTOP_RELEASE_META.version}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#98AAB8] font-mono">
                    <span>—</span>
                    <span>□</span>
                    <span>✕</span>
                  </div>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="rounded-lg bg-[#F5F2E9] p-3 text-[#142331] flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-extrabold">16 Puzzles Ready</p>
                      <p className="text-[10px] text-[#526575]">Online Sync + Offline Mode</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-[#087F8C] text-white text-[10px] font-bold">
                      1440×900
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['laser_mirror', 'block_escape', 'maze_escape', 'word_grid'] as const).map((t) => (
                      <div key={t} className="rounded-lg bg-[#233D4A] border border-[#36515F] overflow-hidden">
                        <div className="h-14 bg-[#E9EEE8]">
                          <PuzzleCoverArt type={t} variant="light" className="w-full h-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Artifact Cards & SHA-256 Checksums */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { key: 'installer' as const, badge: 'Recommended · Per-User Wizard', artifact: DESKTOP_RELEASE_META.installer },
            { key: 'portable' as const, badge: 'Zero-Install · Standalone', artifact: DESKTOP_RELEASE_META.portable },
          ].map(({ key, badge, artifact }) => (
            <Card key={key} surface="primary" padding="lg" className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-[#38C6BA]/15 border border-[#38C6BA]/40 text-[#A8E5D5] mb-1.5">
                    {badge}
                  </span>
                  <h2 className="text-lg font-bold text-[#F5F7F8]">{artifact.fileName}</h2>
                </div>
                <Monitor className="w-5 h-5 text-[#93D1F2] shrink-0 mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#1C2D3B] border border-[#36515F] rounded-lg p-3">
                <div>
                  <span className="text-[#98AAB8] block">Version</span>
                  <span className="font-bold text-[#F5F7F8] font-tabular">{DESKTOP_RELEASE_META.version}</span>
                </div>
                <div>
                  <span className="text-[#98AAB8] block">File Size</span>
                  <span className="font-bold text-[#F5F7F8] font-tabular">{artifact.sizeLabel}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#B4C3CE] font-semibold">SHA-256 Checksum</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(key, artifact.sha256)}
                    className="inline-flex items-center gap-1 text-[#A8E5D5] hover:text-[#38C6BA] font-semibold"
                  >
                    {copiedHash === key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash === key ? 'Copied' : 'Copy SHA-256'}</span>
                  </button>
                </div>
                <code className="block w-full bg-[#142331] border border-[#36515F] rounded-lg px-3 py-2 text-[11px] font-mono text-[#93D1F2] break-all select-all">
                  {artifact.sha256}
                </code>
              </div>

              <a
                href={artifact.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 px-4 rounded-lg bg-[#087F8C] hover:bg-[#066B75] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{artifact.label}</span>
              </a>
            </Card>
          ))}
        </div>

        {/* Code Signing Transparency & System Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card surface="primary" padding="lg" className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-[#FBBF24]">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold text-[#F5F7F8]">Code-Signing &amp; SmartScreen Status</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#B4C3CE] leading-relaxed">
              {DESKTOP_RELEASE_META.signedStatus}
            </p>
            <div className="bg-[#1C2D3B] border border-[#36515F] rounded-lg p-3 text-xs text-[#B4C3CE] space-y-1.5">
              <p className="font-semibold text-[#F5F7F8]">Verify checksum on Windows PowerShell:</p>
              <code className="block font-mono text-[11px] text-[#A8E5D5] break-all">
                Get-FileHash .\PuzzleVerse-Setup-{DESKTOP_RELEASE_META.version}-x64.exe -Algorithm SHA256
              </code>
            </div>
            <button
              type="button"
              onClick={() => handleExternalClick(DESKTOP_RELEASE_META.releasePageUrl)}
              className="text-xs font-bold text-[#A8E5D5] hover:text-[#38C6BA] inline-flex items-center gap-1.5"
            >
              <span>Inspect GitHub Release v{DESKTOP_RELEASE_META.version}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Card>

          <Card surface="primary" padding="lg" className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-[#38C6BA]">
              <Cpu className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold text-[#F5F7F8]">System Requirements &amp; Supported OS</h2>
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
            <h2 className="text-base font-bold text-[#F5F7F8]">Installation Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[#B4C3CE]">
              <li>Download <strong>{DESKTOP_RELEASE_META.installer.fileName}</strong> above.</li>
              <li>Optionally verify the file SHA-256 against the checksum displayed above.</li>
              <li>If Windows SmartScreen appears, click <em>More info</em> and confirm <em>Run anyway</em>.</li>
              <li>Select your preferred install folder (per-user install, no Administrator prompt needed).</li>
              <li>Launch PuzzleVerse from the installer finish screen, Start Menu, or Desktop shortcut.</li>
            </ol>
          </Card>

          <Card surface="primary" padding="lg" className="lg:col-span-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F8]">
              Release Notes — v{DESKTOP_RELEASE_META.version}
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
