# PuzzleVerse Universal Cross-Platform Compatibility Report (`v1.2.0`)

**Application:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Version:** `1.2.0`  
**Audit & Test Date:** 2026-11-28 (`RELEASE_DATE: 2026-11-27`)  
**Website & PWA Production:** https://puzzleverse-e16e4.web.app/ (Mirror: https://puzzzleverse.netlify.app/)  
**Universal Download Portal:** https://puzzleverse-e16e4.web.app/download  
**Public Release Assets:** https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.2.0  

---

## 1. Platform Matrix (`PASS` / `FAIL` / `NOT TESTED`)

| Platform / Target | Package / Artifact | Build Status | Runtime Test Status | Honest Scope & Notes |
|---|---|---|---|---|
| **Windows 10/11 (x64)** | `PuzzleVerse-Setup-1.2.0-x64.exe` (`122,376,942` B) & `PuzzleVerse-Portable-1.2.0-x64.exe` (`111,408,349` B) | **PASS** | **PASS** | Tested `win-unpacked\PuzzleVerse.exe` and `PuzzleVerse-Portable-1.2.0-x64.exe` via `test-desktop-packaged.mjs` & `test-desktop-extra.mjs`: all 16 games `true`, desktop gaming sidebar, `noDownloadPromotionsInDesktop: true`, `/download` blocked (`downloadRouteRedirected: true`), `exitConfirmWorked: true`, `escapePauseWorked: true`, `mazeArrowWorked: true`, Firestore REST read `200`, `consoleErrors: []`, anonymous HTTP `206` verified (`NotSigned`). Interactive human Google login round-trip inside external Chrome + loopback remains `NOT TESTED`. |
| **Windows 11 (ARM64)** | `PuzzleVerse-Setup-1.2.0-arm64.exe` (`116,369,122` B) & `PuzzleVerse-Portable-1.2.0-arm64.exe` (`106,079,317` B) | **PASS** | **NOT TESTED** | Cross-compiled on Windows x64, SHA-256 verified, published on GitHub Release `v1.2.0` (`NotSigned`); ARM64 Windows CPU hardware unavailable locally. |
| **Android (Capacitor 8 APK & AAB)** | `PuzzleVerse-v1.2.0-Android.apk` (`4,911,848` B) & `PuzzleVerse-v1.2.0-Android.aab` (`4,585,670` B) | **PASS** | **PASS** (Emulator + Live Android Web) | Signed (`apksigner` v2 verified, `minSdk 24` / `targetSdk 36`), registered Firebase Android app & SHA-1/SHA-256 fingerprints, published to GitHub Release `v1.2.0` (HTTP `206`), verified upgrade (`v1.0.0` -> `v1.2.0`) on Android 14 API 34 emulator (native Credential Manager invocation, zero download promos, `/download` blocked, 5-tab mobile nav hidden in gameplay, back pause modal, all 16 games, offline cold launch, `0` fatal errors). Physical phone sideload & interactive Google account selection remain `NOT TESTED`. |
| **iPhone & iPad (iOS / iPadOS)** | `ios/` Xcode project (`MARKETING_VERSION = 1.2.0`, `CURRENT_PROJECT_VERSION = 120`, Firebase iOS app + `GoogleService-Info.plist` + `Info.plist`) | **SYNCED (`cap sync`)** | **NOT TESTED** | Configured `@capawesome/capacitor-google-sign-in@0.1.4` and Google OAuth URL types via `npx cap sync ios`; native Xcode compile & `.ipa` signing require macOS + Apple Developer membership (`NOT TESTED` on Windows). Safari PWA remains playable immediately. |
| **macOS (Apple Silicon / Intel / Universal)** | `electron-builder.json` & `.github/workflows/universal-release.yml` | **CI CONFIGURED ONLY** | **NOT TESTED** | Requires macOS CI runner (`macos-latest`) and Apple Developer ID for `.dmg` Gatekeeper notarization; Web/PWA playable today. |
| **Linux (`x64` & `ARM64`)** | `.AppImage`, `.deb`, `.rpm` + icons in `build/icons/` | **CI CONFIGURED ONLY** | **NOT TESTED** | Configured for Ubuntu CI runner; kept disabled on `/download` until built and published. Web/PWA playable today. |
| **Web & Installed PWA (`ChromeOS` / Desktop / Mobile)** | `dist/` (`sw.js`, `manifest.json`, `87` Workbox precache entries / `1743.56 KiB`) | **PASS** | **PASS** | Deployed to Firebase Hosting (`84` files) & Netlify (`https://puzzzleverse.netlify.app`); headless Chrome CDP verified desktop & Android UA `/download` detection, valid `/desktop-auth` session UI, live `workbox-precache-v2` registration, and emulated `display-mode: standalone` Installed PWA hiding all downloads and redirecting `/download` -> `/login` with `0` console errors. |

---

## 2. Repository Build Scope Note (`root dist/` vs legacy `client/`)

Firebase Hosting (`firebase.json` -> `"public": "dist"`) and Netlify (`netlify.toml` -> `publish = "dist"`) deploy directly from the root React 19 + TypeScript + Vite 8 workspace (`src/` -> `dist/`), which powers the Electron desktop builds, Capacitor Android/iOS bundles, PWA service worker, authentication adapters, and public `/download` portal. The older `client/` folder predates project flattening and was left untouched.
