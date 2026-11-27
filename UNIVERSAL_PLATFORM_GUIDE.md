# PuzzleVerse Universal Cross-Platform Architecture & Distribution Guide (`v1.1.0`)

**Application:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Version:** `1.1.0`  
**Publisher:** Sidhant Jain  
**Website / PWA Production URL:** https://puzzleverse-e16e4.web.app/  
**Universal Download Portal:** https://puzzleverse-e16e4.web.app/download  

---

## 1. Single Shared Codebase Architecture

PuzzleVerse runs a single shared React 19 + TypeScript + Vite 8 + Tailwind CSS + Zustand + Firebase codebase (`src/`) across all desktop, mobile, and browser targets — with **zero duplicated game logic**:

- **Shared Puzzle Engine & 16 Games:** `src/games/*` + `src/pages/GamePlayPage.tsx` + `src/data/puzzles.ts` + deterministic PRNG (`src/utils/prng.ts`).
- **Centralized Platform Detection:** [detectPlatform.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/platform/detectPlatform.ts) detects:
  - Operating System (`windows`, `macos`, `linux`, `android`, `ios` including iPadOS desktop UA, `chromeos`, `unknown`).
  - CPU Architecture (`x64`, `arm64`, `arm`, `unknown`) via Electron main info or `navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness'])`, avoiding blind assumptions when browsers omit architecture hints.
  - Runtime container (`electron`, `capacitor`, `pwa`, `web`), device category (`mobile`, `tablet`, `desktop`, `unknown`), touchscreen capability, PWA install prompt availability (`beforeinstallprompt`), and live network status.
- **Shared Platform Adapter Layer:** [adapter.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/platform/adapter.ts) exposes one unified interface (`getAppVersion`, `storage`, `network`, `notifications`, `fullscreen`, `openExternal`, `updates`, `exitApp`, `share`, `haptics`, `promptPwaInstall`, `setActiveGameState`) backed by three environment-specific implementations:
  1. **Electron Desktop Adapter:** wraps hardened `window.puzzleverseDesktop` IPC channels ([preload.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/preload.cjs), [main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs)).
  2. **Capacitor Mobile Adapter:** wraps `@capacitor/app`, `@capacitor/browser`, `@capacitor/haptics`, `@capacitor/network`, `@capacitor/share`, `@capacitor/status-bar`, and `@capacitor/toast`.
  3. **Web / Vite PWA Adapter:** integrates DOM Fullscreen, browser Notifications, Web Share API (with clipboard fallback), Workbox Service Worker updates, and Chrome/ChromeOS/Edge PWA install prompts.

---

## 2. Build & Packaging Configurations

> [!IMPORTANT]
> **Active Web Source Root:** The live production application builds from the **repository root** (`src/` → `dist/`, `npm run build`), matching [firebase.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/firebase.json) (`"public": "dist"`) and [netlify.toml](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/netlify.toml). The older `client/` directory in the repository is a legacy pre-flatten artifact and is intentionally not used for production deploys.

| Platform | Runtime Tooling | Package Targets | Build Script / Config |
|---|---|---|---|
| **Windows (`x64` & `ARM64`)** | Electron `45.5.0` + Electron Builder `26.18.0` | NSIS Installer (`.exe`, per-user) + Portable (`.exe`) | `npm run desktop:win-all` / [electron-builder.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron-builder.json) |
| **macOS (`arm64`, `x64`, `universal`)** | Electron Builder `mac` | `.dmg` + `.zip` + `entitlements.mac.plist` | `npm run desktop:mac` (requires macOS runner) |
| **Linux (`x64` & `ARM64`)** | Electron Builder `linux` | `.AppImage`, `.deb`, `.rpm` + freedesktop PNG icons (`build/icons/`) | `npm run desktop:linux` (requires Linux runner with `rpm` & `fakeroot`) |
| **Android** | Capacitor `8.6.3` (`android/`) | Signed Release `.apk` & `.aab` (`versionCode 110`, `versionName "1.1.0"`) | `npm run mobile:android` + Gradle (`./gradlew assembleRelease bundleRelease`) |
| **iOS / iPadOS** | Capacitor `8.6.3` (`ios/`) + Safari PWA | Universal iPhone/iPad Xcode workspace + Safari Add to Home Screen | `npm run mobile:ios` + macOS `xcodebuild` |
| **Web / ChromeOS** | Vite `8.3.0` + `vite-plugin-pwa@2.0.0` | Offline Workbox `sw.js`, `manifest.json`, 64/180/192/512/maskable PNG icons | `npm run build` |

---

## 3. End-User Installation Summary (Zero Developer Tools Required)

1. **Windows 10/11 (x64 & ARM64):** Download the verified `Setup` or `Portable` `.exe` directly from https://puzzleverse-e16e4.web.app/download, verify SHA-256 checksums, click **More info → Run anyway** on the unsigned Windows SmartScreen prompt, and launch without Node.js or administrator rights.
2. **ChromeOS, Windows, macOS & Linux Browsers:** Visit https://puzzleverse-e16e4.web.app/ and click **Install Web App** (or the browser address-bar install icon) to install PuzzleVerse offline via Service Worker.
3. **iPhone & iPad:** Open https://puzzleverse-e16e4.web.app/ in Safari → tap **Share** → **Add to Home Screen** (`apple-touch-icon-180x180.png` + safe-area UI).
4. **Android:** Install immediately via Chrome **Install App** (PWA), or compile the `android/` Gradle project in CI for `.apk` / `.aab` distribution.

---

## 4. Automated CI/CD Matrix ([universal-release.yml](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/.github/workflows/universal-release.yml))

The multi-platform workflow defines parallel jobs gated on TypeScript lint + Vite PWA build verification (`verify`):
- `build-windows` (`windows-latest`): builds separate `--arm64` and `--x64` Installers + Portable EXEs.
- `build-macos` (`macos-latest`): builds Apple Silicon, Intel, and Universal `.dmg` / `.zip`.
- `build-linux` (`ubuntu-latest`): installs `rpm` + `fakeroot` and builds x64 & ARM64 `.AppImage`, `.deb`, `.rpm`.
- `build-android` (`ubuntu-latest`, Java 21): syncs Capacitor Android and builds `.apk` & `.aab` with optional CI keystore secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).
- `build-ios` (`macos-latest`): syncs Capacitor iOS and runs signed `xcodebuild archive` when Apple CI secrets (`IOS_CERT_BASE64`, `IOS_CERT_PASSWORD`, `IOS_PROVISION_BASE64`) exist, falling back to unsigned `iphonesimulator` build check otherwise.
- `publish-release`: aggregates verified artifacts and unified `SHA256SUMS.txt` on `v*` tag releases.

> [!NOTE]
> The local Git HTTPS credential helper carries `repo` scope only (without `workflow` OAuth scope), so pushing `.github/workflows/universal-release.yml` directly requires pushing with a GitHub token that includes `workflow` scope or uploading via GitHub web UI.
