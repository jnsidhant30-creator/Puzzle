# Changelog

All notable releases of **PuzzleVerse** (Web, PWA, Desktop, and Mobile) are documented in this file.

## [1.3.0] - 2026-11-28 — Stable Universal Platform, Compact Landscape, Auto-Update Verification & Release Lifecycle

### Added & Improved
- **Compact Phone/Tablet Landscape Layouts Across All 16 Games (`src/index.css`, `src/games/*.tsx`, `src/components/ui/GameHudBar.tsx`, `src/pages/GamePlayPage.tsx`):**
  - Added 2-column `.pv-game-grid` + `.pv-game-board` responsive layout (`@media (orientation: landscape) and (max-height: 560px)`) and compact HUD styling so metrics, boards, Hint, Pause, Rules, and Reset controls remain above the fold without horizontal or vertical scroll.
  - Added `max-h-[92dvh] overflow-y-auto` responsive modal containers on pause and completion dialogs so action buttons remain reachable on compact landscape screens.
- **Centralized Release Manifest & Platform-Aware Updater (`public/release-manifest.json`, `scripts/generate-release-manifest.mjs`, `scripts/verify-release-manifest.mjs`, `src/platform/adapter.ts`, `src/pages/SettingsPage.tsx`, `src/App.tsx`):**
  - Published centralized `release-manifest.json` (`15` platform entries) with `no-cache, no-store` headers on Firebase Hosting and Netlify, excluded from Workbox precaching.
  - Added `isPortable`, `manualOnly`, `revealDownloadedFile`, explicit unsigned installer approval checkboxes on Desktop Setup, Downloads-folder reveal for Portable EXEs, verified APK download prompts on Android, non-interruptive PWA Service Worker update banner (suppressed during `activeTab === 'game_play'`), and `navigator.onLine === false` + timeout fast-fail for offline update checks with `Retry Update Check` recovery.
- **Windows Portable Second-Instance Lock & State Preservation (`electron/main.cjs`, `electron/preload.cjs`, `scripts/test-desktop-packaged.mjs`):**
  - Diagnosed the prior `8s` portable `secondRun` timeout as NSIS self-extraction latency (`23.5s` observed on `PuzzleVerse-Portable-1.3.0-x64.exe`), raised portable `secondRun` test threshold to `35s`, and added Win32 focus restoration + `desktop:second-instance` event verification (`sentinelPreserved: true`).
- **Automated Release Management & Obsolete Release Cleanup (`scripts/manage-releases.mjs`, `.github/workflows/universal-release.yml`):**
  - Added full unauthenticated release stream verification, outside-repo private backup archival, and post-verification cleanup removing obsolete public GitHub Releases (`v1.0.0`–`v1.2.1`) while preserving git history/tags so `v1.3.0` is the sole active public release.
- **Bundle & Startup Optimization (`vite.config.ts`, `scripts/generate-desktop-assets.cjs`, `electron/main.cjs`):**
  - Relocated unused build-only `1024x1024` icon out of `public/icons/`, trimmed Workbox precache from `87` (`1746.30 KiB`) to `85` (`1693.05 KiB`), shrank signed APK by `56,735` B (`4,856,365` B), and shortened desktop splash delay (`220ms -> 120ms`).

### Verified
- **Full Integrity & Migration Matrix (`v1.3.0`):** `100%` unauthenticated HTTP `200` download SHA-256 verification of all `9` release assets (`10` total assets on GitHub Release `v1.3.0`); real `v1.2.1 -> v1.3.0` upgrade migration & auto-updater verification on Windows Desktop (`Setup`) and Android 14 Emulator (`APK`); `unpacked`, `portable`, and `extra` Desktop tests; `16/16` responsive landscape/portrait checks (`landFail: []`, `portFail: []`); and `16/16` live production E2E solves on `https://puzzleverse-e16e4.web.app`.

---

## [1.2.1] - 2026-11-28 — Android Landscape Rotation Fix, ColorPath Hints & Full E2E Verification

### Fixed
- **Android Landscape Rotation & System Bars (`MainActivity.java`, `src/platform/adapter.ts`, `src/index.css`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/pages/GamePlayPage.tsx`):**
  - Overrode `onCreate`, `onConfigurationChanged`, and `onWindowFocusChanged` with `applyOceanNavySystemBars()` (`0xFF142331`, `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`, light icons preserved on status & navigation bars) alongside an `orientationchange` listener in `initPlatformBridge()`.
  - Added display-cutout safe padding (`env(safe-area-inset-left/right)`) and compact landscape styling so board state, timer, placed tiles, white status bar icons, and horizontal bounds remain intact across `Portrait -> Landscape -> Portrait` rotation with zero Activity restarts.
- **Color Path Solver & Hints (`src/games/ColorPath.tsx`):**
  - Replaced solvability checks with `findPairSolutionPaths(size, pairs)` storing verified solution paths and wired `Connect Pair ({hintsLeft})` hints.
- **Download Portal Metadata (`src/pages/DownloadPage.tsx`):**
  - Updated Android APK filename reference to use dynamic `PuzzleVerse-v{RELEASE_VERSION}-Android.apk` instead of static `v1.0.0`.

### Verified & Published
- **Release `v1.2.1` (`versionCode 121`):** Built and published signed universal Android APK (`4,913,100` B, `apksigner` v2 verified), Google Play AAB (`4,586,902` B, `jarsigner` verified), Windows `x64`/`ARM64` Setup & Portable EXEs, `SHA256SUMS.txt`, `ANDROID_SHA256SUMS.txt`, and `latest.yml` to GitHub Release `v1.2.1`, plus deployed web/PWA updates to Firebase Hosting and Netlify.
- **Cross-Platform Test Coverage:** Passed `16/16` individual game E2E tests (Launch, Generation, Controls, Hints, Timer, Pause/Resume, Reset, Real Completion, Scoring/XP Results, Offline Save), Windows Unpacked & Portable Electron suites, `test-desktop-extra.mjs`, live Web/Netlify/SW/PWA standalone isolation checks, and real Android 14 emulator in-place upgrade + rotation tests (`0` console errors / `0` fatal exceptions).

---

## [1.2.0] - 2026-11-28 — Cross-Platform Auth Fix, Native Gaming UI & App Isolation

### Fixed
- **Cross-Platform Google Sign-In (`src/services/authService.ts`, `src/services/firebase.ts`):**
  - **Android & iOS:** Registered Firebase Android (`1:473636983543:android:3a790666582f4f808eb9f2`, release SHA-1 & SHA-256) and iOS (`1:473636983543:ios:afce5358441e728d8eb9f2`) apps, added `google-services.json` and `GoogleService-Info.plist`, and integrated `@capawesome/capacitor-google-sign-in@0.1.4` for native Credential Manager / Google Identity authentication instead of Chrome Custom Tab URL fragments.
  - **Electron Desktop (`electron/main.cjs`, `src/pages/DesktopAuthPage.tsx`):** Fixed Chrome/Edge Private Network Access (PNA) blocking on localhost OAuth callbacks by adding `Access-Control-Allow-Private-Network: true` on `OPTIONS`/`POST`, added `S256` PKCE challenge binding, hidden `<form method="POST">` HTML callback fallback, and popup-blocked `signInWithRedirect` fallback.
  - **Installed PWA (`src/App.tsx`, `src/services/firebase.ts`):** Switched to synchronous atomic `initializeAuth` (`indexedDBLocalPersistence`, `browserLocalPersistence`) and removed the premature 2-second redirect timeout race on startup.
- **Installed App Download Hiding (`src/platform/detectPlatform.ts`):** Extended strict hiding of all download buttons, banners, sidebar/bottom-nav links, search quick-actions, and `/download` route access to **all** installed runtimes (`Electron`, `Capacitor`, and `Installed standalone PWA`).

### Improved
- **Native Gaming Interface:** Added branded splash overlay during initial auth hydration, dedicated desktop gaming sidebar (`All Games`, `Daily Puzzle`, `Challenge Run`, `Leaderboard`, `Achievements`, `Game History`, `Profile`, `Settings`), 5-tab mobile `BottomNavigation` (hidden during active gameplay), compact mobile header (`Lv N · #Rank` chip), and active match exit confirmation (`Leave Active Puzzle?` / `Exit to Games`).
- **Release Artifacts (`v1.2.0`):** Published updated Windows `x64`/`ARM64` Setup & Portable EXEs (`latest.yml`, `SHA256SUMS.txt`), signed Universal Android APK (`PuzzleVerse-v1.2.0-Android.apk`, `versionCode 120`, `4,911,848` B) & Play AAB (`PuzzleVerse-v1.2.0-Android.aab`, `4,585,670` B) on GitHub Release `v1.2.0`, and deployed web + PWA updates to Firebase Hosting and Netlify.

---

## [1.1.0] - 2026-11-27 — Universal Cross-Platform Edition

### Added
- **Universal Platform Detection & Modular Adapters (`src/platform/`):**
  - Added [detectPlatform.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/platform/detectPlatform.ts) to detect operating system (`windows`, `macos`, `linux`, `android`, `ios` including iPadOS, `chromeos`, `unknown`), CPU architecture (`x64`, `arm64`, `arm`, `unknown`), container runtime (`electron`, `capacitor`, `pwa`, `web`), touchscreen support, PWA installability (`beforeinstallprompt`), and offline state without blind architecture assumptions.
  - Added [adapter.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/platform/adapter.ts) unifying version lookup, local storage, network monitoring, notifications, fullscreen, external links, updates, app exit, native sharing, PWA installation prompts, haptic feedback, and active-game tracking behind Electron, Capacitor, and Web adapters.
- **Installable Vite PWA (`vite-plugin-pwa@2.0.0`):**
  - Configured offline Workbox precaching (`dist/sw.js`, `84` entries / `1725.92 KiB`), `manifest.json` with raster PNG icons (`64x64`, `192x192`, `512x512`, maskable `512x512`, iOS `apple-touch-icon-180x180.png`), Chrome/ChromeOS install trigger, and safe non-disruptive web update prompt banner.
  - Service worker registration cleanly skipped inside Electron (`app://`) and Capacitor native mobile WebViews.
- **Windows x64 & ARM64 Desktop Releases + Multi-OS Electron Config:**
  - Built Windows `x64` Setup (`122,371,946` B), Windows `x64` Portable (`111,403,405` B), Windows `ARM64` Setup (`116,363,966` B), and Windows `ARM64` Portable (`106,075,894` B).
  - Expanded [electron-builder.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron-builder.json), [main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs), and [entitlements.mac.plist](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/entitlements.mac.plist) for macOS (`arm64`, `x64`, `universal` `.dmg`/`.zip`, Dock `activate`, `Ctrl+Cmd+F`) and Linux (`x64`/`arm64` `.AppImage`, `.deb`, `.rpm`, freedesktop icons in `build/icons/`), plus cross-OS release update asset resolution.
- **Capacitor 8 Signed Android Release (`PuzzleVerse-v1.0.0-Android.apk` & `.aab`):**
  - Built and signed the Universal Android APK (`3,970,575` B, `versionCode 100`, `versionName "1.0.0"`, `minSdkVersion 24` / Android 7.0+, `targetSdkVersion 36`, APK Signature Scheme v2 verified) and Google Play Store AAB (`3,789,930` B) alongside `ANDROID_SHA256SUMS.txt` on GitHub Release `v1.1.0`.
  - Configured `#142331` Ocean Navy system bars (`styles.xml`), adaptive launcher icons & splash assets, Chrome Custom Tab Google OAuth (`@capacitor/browser` + `com.puzzleverse.app://auth`), `allowBackup="false"`, `usesCleartextTraffic="false"`, hardware Back pause handling, and offline Guest launch.
  - Added [ANDROID_RELEASE_REPORT.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/ANDROID_RELEASE_REPORT.md) and updated `/download` automatic Android detection with direct APK link, real size, version `1.0.0`, supported Android versions, and PWA fallback.
- **Capacitor 8 Android & iOS Native Mobile Projects (`android/`, `ios/`):**
  - Scaffolded Capacitor 8 native Android and Universal iPhone/iPad Xcode projects sharing `dist/`, wired with `@capacitor/app` hardware back handling, `@capacitor/browser`, `@capacitor/haptics`, `@capacitor/network`, `@capacitor/share`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/toast`, HTTPS-only manifest rules (`usesCleartextTraffic="false"`), minimal permissions, safe-area inset CSS utilities, and native icons.
- **Universal `/download` Portal & Cross-Platform CI Workflow:**
  - Updated [DownloadPage.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/pages/DownloadPage.tsx) with auto-detection, manual OS/CPU architecture selectors, Install Web App CTA, verified package checksum cards, and strict disabled-until-published gating for CI-pending builds.
  - Added [universal-release.yml](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/.github/workflows/universal-release.yml) GitHub Actions build matrix across Windows, macOS, Linux, Android, and iOS runners.
  - Added [UNIVERSAL_PLATFORM_GUIDE.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/UNIVERSAL_PLATFORM_GUIDE.md), [SECURITY_REPORT.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/SECURITY_REPORT.md), and [PLATFORM_COMPATIBILITY_REPORT.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/PLATFORM_COMPATIBILITY_REPORT.md).

### Known Limitations (`v1.1.0`)
- Windows `x64` & `ARM64` desktop binaries remain unsigned (`NotSigned`); Windows `ARM64` execution was not run on ARM64 hardware (cross-compiled on `x64`).
- `PuzzleVerse-v1.0.0-Android.apk` & `.aab` are signed with the PuzzleVerse developer release keystore (`apksigner` v2 verified) and tested on Android 14 emulator; physical Android device sideload and Google Play Store / Play App Signing publication remain pending membership.
- macOS, Linux, and iOS `.ipa` binaries require macOS/Ubuntu runners in CI (`universal-release.yml`) and remain disabled on `/download` until compiled and uploaded publicly.

---

## [1.0.0] - 2026-11-26 — Initial Windows Desktop Release & Website Download Portal

### Added
- **Windows Desktop Application (`electron@45.5.0` & `electron-builder@26.18.0`):**
  - Shared single-codebase desktop shell reusing existing React 19 + TypeScript + Vite 8 application without duplicating game logic.
  - Custom `app://puzzleverse/` static protocol serving the compiled production bundle securely from `resources/app.asar/dist` with directory-traversal protection and SPA route fallback.
  - Hardened Electron window & preload security (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, strict CSP, `devTools: !app.isPackaged`, allowlisted HTTPS external navigation, sender origin validation).
  - Ocean Navy frameless startup splash screen ([electron/splash.html](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/splash.html)), generated multi-resolution Windows icon (`build/icon.ico`, `build/icon.png`, `build/icon-256.png`), and branded NSIS installer bitmaps (`build/installerHeader.bmp`, `build/installerSidebar.bmp`).
  - Persistent window size/position state (`1440×900` default, `960×620` minimum), `F11` fullscreen shortcut, Settings fullscreen controls, single-instance lock, and active-game close confirmation guard.
  - System-browser Google OAuth sign-in flow (`127.0.0.1` temporary loopback listener + `/desktop-auth` web handoff route) alongside email/password sign-in and Offline Guest Practice mode.
  - In-app GitHub Releases update checker & verified installer downloader (**Settings → Application**) with SHA-256/SHA-512 verification and active-gameplay restart protection.
- **Packaged Windows Executables Published (`GitHub Releases v1.0.0`):**
  - `PuzzleVerse-Setup-1.0.0-x64.exe` (`122,213,038` bytes / `116.55 MB`, per-user NSIS wizard, Desktop + Start Menu shortcuts, full uninstaller).
  - `PuzzleVerse-Portable-1.0.0-x64.exe` (`111,269,654` bytes / `106.12 MB`, standalone zero-install EXE).
  - `latest.yml` and `SHA256SUMS.txt` release verification metadata.
- **Public Website Download & Auth Support:**
  - Public `/download` page accessible without authentication across Firebase Hosting (`https://puzzleverse-e16e4.web.app/download`) and Netlify (`https://puzzzleverse.netlify.app/download`) displaying release version, real byte sizes, copyable SHA-256 checksums, SmartScreen unsigned transparency notice, system requirements, FAQs, and Web Play Now CTA.
  - `"Download Windows App"` / `"Download Desktop App"` navigation links on web login/sidebar/bottom-nav/settings views (hidden inside the installed desktop app).
  - Public `/desktop-auth` loopback browser handoff page for Windows desktop Google authentication.
- **Documentation & Test Automation:**
  - Added [DESKTOP_SETUP.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_SETUP.md), [DESKTOP_BUILD.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_BUILD.md), [DESKTOP_RELEASE.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_RELEASE.md), [DESKTOP_TEST_REPORT.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_TEST_REPORT.md), and packaged EXE verification scripts (`scripts/test-desktop-packaged.mjs`, `scripts/test-desktop-extra.mjs`).

### Changed & Improved
- **Dashboard & Personal Stats:** Added Challenge Run highlight, Current Global Rank display in Personal Progress (without embedded leaderboard tables), and all 16 horizontal landscape puzzle cards cleanly ordered for desktop browsing.
- **Puzzle Engines & Generators:** Upgraded `Laser Mirror` (`5×5`/`6×6` wall blockers & verified ray paths), `Block Escape` (9 BFS-verified Rush-Hour boards + arrow sliding), `Maze Escape` (recursive backtracker + BFS shortest path + arrow navigation), `Sliding Puzzle` (seeded non-trivial scramble + arrow controls), `Arrow Path`, `Number Puzzle`, and `Challenge Mode` with deterministic PRNG seeding (`src/utils/prng.ts`) and unified `Escape` pause dispatch.
- **Accessibility & Offline Resilience:** Added `html.reduce-motion` support in [src/index.css](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/index.css), offline auth timeout (`1200ms`), offline local practice persistence (`puzzleverse_offline_practice_v1`), global leaderboard write isolation when offline/guest, and Retry recovery banners across community/leaderboard/daily routes.

### Known Limitations
- **Unsigned Executables (`v1.0.0`):** Neither `PuzzleVerse-Setup-1.0.0-x64.exe` nor `PuzzleVerse-Portable-1.0.0-x64.exe` carries an Authenticode code-signing certificate (`NotSigned`); Windows Defender SmartScreen may display an unknown-publisher prompt until an OV/EV or Azure Trusted Signing certificate is attached.
- **x64 Only:** Built and verified for Windows 10/11 64-bit (`x64`); ARM64 builds are not included in `v1.0.0`.
