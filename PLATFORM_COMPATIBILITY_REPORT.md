# PuzzleVerse Universal Cross-Platform Compatibility Report (`v1.2.1`)

**Application:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Version:** `1.2.1`  
**Audit & Test Date:** 2026-11-28 (`RELEASE_DATE: 2026-11-28`)  
**Website & PWA Production:** https://puzzleverse-e16e4.web.app/ (Mirror: https://puzzzleverse.netlify.app/)  
**Universal Download Portal:** https://puzzleverse-e16e4.web.app/download  
**Public Release Assets:** https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.2.1  

---

## 1. Platform Matrix (`PASS` / `FAIL` / `NOT TESTED`)

| Platform / Target | Package / Artifact | Build Status | Runtime Test Status | Honest Scope & Notes |
|---|---|---|---|---|
| **Windows 10/11 (x64)** | `PuzzleVerse-Setup-1.2.1-x64.exe` (`122,377,604` B) & `PuzzleVerse-Portable-1.2.1-x64.exe` (`111,410,021` B) | **PASS** | **PASS** | Tested `win-unpacked\PuzzleVerse.exe` (`singleInstanceBlocked: true`), `PuzzleVerse-Portable-1.2.1-x64.exe`, and `test-desktop-extra.mjs`: `version: "1.2.1"`, all 16 games `true`, desktop gaming sidebar, `noDownloadPromotionsInDesktop: true`, `/download` blocked (`downloadRouteRedirected: true`), `exitConfirmWorked: true`, `escapePauseWorked: true`, `mazeArrowWorked: true`, Firestore REST read `200`, offline Leaderboard guard + online recovery (`onlineLeaderboardLoaded: true`), `reloadMounted: true`, `consoleErrors: []`, anonymous HTTP `206` (`bytes 0-15/122377604`) verified (`NotSigned`). *(Note: portable self-extracting wrapper timed out on 8s `secondRun` single-instance check, whereas unpacked EXE passed `singleInstanceBlocked: true`. Interactive human Google login round-trip inside external browser + loopback remains `NOT TESTED`.)* |
| **Windows 11 (ARM64)** | `PuzzleVerse-Setup-1.2.1-arm64.exe` (`116,369,498` B) & `PuzzleVerse-Portable-1.2.1-arm64.exe` (`106,078,004` B) | **PASS** | **NOT TESTED** | Cross-compiled on Windows x64, SHA-256 verified, published on GitHub Release `v1.2.1` (`NotSigned`); ARM64 Windows hardware unavailable locally. |
| **Android (Capacitor 8 APK & AAB)** | `PuzzleVerse-v1.2.1-Android.apk` (`4,913,100` B) & `PuzzleVerse-v1.2.1-Android.aab` (`4,586,902` B) | **PASS** | **PASS** (Emulator + Live Android Web + Shared 16/16 E2E) | Signed (`apksigner` v2 verified, `minSdk 24` / `targetSdk 36`, `versionCode 121`), registered Firebase Android app & SHA-1/SHA-256 fingerprints, published to GitHub Release `v1.2.1` (HTTP `206`: `bytes 0-15/4913100`), verified in-place upgrade (`1.2.0` -> `1.2.1`) and **Portrait -> Landscape -> Portrait** rotation on Android 14 API 34 emulator (`pid 4717` zero restart, timer `1s -> 6s -> 10s`, mirror preserved, white status-bar icons preserved, `overflowX: false`; compact `364px` landscape requires vertical scroll to bottom buttons) + ColorPath `Connect Pair` hint fix, alongside `16/16` individual game lifecycle tests on live shared bundle. Physical phone sideload & interactive Google account selection remain `NOT TESTED`. |
| **iPhone & iPad (iOS / iPadOS)** | `ios/` Xcode project (`MARKETING_VERSION = 1.2.1`, `CURRENT_PROJECT_VERSION = 121`, Firebase iOS app + `GoogleService-Info.plist` + `Info.plist`) | **SYNCED** | **NOT TESTED** | Configured `com.puzzleverse.app`, `@capawesome/capacitor-google-sign-in@0.1.4`, `GIDClientID`, `GIDServerClientID`, and URL scheme in `ios/App/App/Info.plist`; native Xcode compile & `.ipa` signing require macOS + Apple Developer membership (`NOT TESTED` on Windows). Safari PWA remains playable immediately. |
| **macOS (Apple Silicon / Intel / Universal)** | `electron-builder.json` & `.github/workflows/universal-release.yml` | **CI CONFIGURED ONLY** | **NOT TESTED** | Requires macOS CI runner (`macos-latest`) and Apple Developer ID for `.dmg` Gatekeeper notarization; Web/PWA playable today. |
| **Linux (`x64` & `ARM64`)** | `.AppImage`, `.deb`, `.rpm` + icons in `build/icons/` | **CI CONFIGURED ONLY** | **NOT TESTED** | Configured for Ubuntu CI runner; kept disabled on `/download` until built and published. Web/PWA playable today. |
| **Web & Installed PWA (`ChromeOS` / Desktop / Mobile)** | `dist/` (`sw.js`, `manifest.json`, `87` Workbox precache entries / `1746.30 KiB`) | **PASS** | **PASS** | Deployed `v1.2.1` to Firebase Hosting (`https://puzzleverse-e16e4.web.app`) & Netlify (`https://puzzzleverse.netlify.app`); headless Chrome CDP verified desktop & Android `/download` detection (`1.2.1`, `116.71 MB`, `4.69 MB`), valid `/desktop-auth` (`Continue with Google` visible, `overflowX: false`), `16/16` individual interactive game completions (`consoleErrors: []`), live `workbox-precache-v2` registration, and emulated `display-mode: standalone` Installed PWA redirecting `/download` -> `/login` with zero download promotions (`hasAnyDownloadPromo: false`). Interactive human Google OAuth consent remains `NOT TESTED`. |

---

## 2. Verified Firebase Auth Config (`puzzleverse-e16e4`)

- **Registered Apps (`firebase_list_apps`):** Android (`1:473636983543:android:3a790666582f4f808eb9f2`, `com.puzzleverse.app`), iOS (`1:473636983543:ios:afce5358441e728d8eb9f2`, `com.puzzleverse.app`), Web (`1:473636983543:web:e1859d1e939e80e68eb9f2`).
- **Authorized Domains (`identitytoolkit` `getProjectConfig` `200 OK`):** `localhost`, `puzzleverse-e16e4.firebaseapp.com`, `puzzleverse-e16e4.web.app`, `puzzleverse-e16e4--test-0nn9a615.web.app`, `puzzzleverse.netlify.app`.
- **Android Release Certificate Fingerprints (`firebase apps:android:sha:list`):** SHA-1 `9319cb1bb11df0f29e66f1262534b20bab5cd109` & SHA-256 `38ecc6bd01f992e93a75e721fb9364182ef72c0b1e28f2ed81d54d7b912c73f7`.

---

## 3. Repository Build Scope Note (`root dist/` vs legacy `client/`)

Firebase Hosting (`firebase.json` -> `"public": "dist"`) and Netlify (`netlify.toml` -> `publish = "dist"`) deploy directly from the root React 19 + TypeScript + Vite 8 workspace (`src/` -> `dist/`), which powers the Electron desktop builds, Capacitor Android/iOS bundles, PWA service worker, authentication adapters, and public `/download` portal. The older `client/` folder predates project flattening and was left untouched.
