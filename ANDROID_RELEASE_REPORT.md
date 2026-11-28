# PuzzleVerse Android Release Report (`v1.3.0` Android / `com.puzzleverse.app`)

**Application Name:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Android Package ID:** `com.puzzleverse.app`  
**Android Version:** `1.3.0` (`versionCode: 130`, upgraded in place from `1.2.1` / `versionCode: 121`)  
**Release Date:** 2026-11-28  
**Direct Public APK Download:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.3.0/PuzzleVerse-v1.3.0-Android.apk  
**Public Play Store AAB:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.3.0/PuzzleVerse-v1.3.0-Android.aab  
**Public Android Checksums:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.3.0/ANDROID_SHA256SUMS.txt  
**Centralized Release Manifest:** https://puzzleverse-e16e4.web.app/release-manifest.json  
**Public Download Portal:** https://puzzleverse-e16e4.web.app/download (Mirror: https://puzzzleverse.netlify.app/download)

---

## 1. Signed Release Artifacts & Full-Download Checksums

| Artifact | Local Path | Size | SHA-256 | Public HTTPS Status |
|---|---|---|---|---|
| **Signed Universal APK (`v1.3.0`)** | `release/PuzzleVerse-v1.3.0-Android.apk` | `4,856,365 bytes` (`4.63 MB`) | `c64cf3344aef776366da3edaf1d9a95a245fb41368b78655c365aaca8802f3c4` | **PASS** (100% unauthenticated HTTP `200` download + SHA-256 + manifest + `apksigner` v2 match) |
| **Signed Google Play AAB (`v1.3.0`)** | `release/PuzzleVerse-v1.3.0-Android.aab` | `4,539,876 bytes` (`4.33 MB`) | `0b9560c79ba44cc937a91c692a112134c9e0b67e0c4ad5441c13ec3ec68ce072` | **PASS** (100% unauthenticated HTTP `200` download + SHA-256 + `jarsigner` verified) |
| **Android SHA-256 Sums** | `release/ANDROID_SHA256SUMS.txt` | `212 bytes` | Verified | **PASS** (`HTTP 200`) |

*(Previous public releases `v1.0.0`–`v1.2.1` were pruned from GitHub Releases only after full `v1.3.0` verification, with private backups preserved outside the repository at `~/.puzzleverse-backups/releases/` and Git tags kept intact. `v1.3.0` preserves `com.puzzleverse.app` and the same release signing certificate.)*

### Signing & Firebase Authentication Registration
- **APK Signature Verification (`apksigner`):** `Verifies` (`Verified using v2 scheme (APK Signature Scheme v2): true`), confirmed on both the local build and the full anonymous GitHub download copy.
- **AAB Signature Verification:** `jarsigner -verify` passed cleanly.
- **Certificate SHA-256 Digest (`apksigner`):** `38ecc6bd01f992e93a75e721fb9364182ef72c0b1e28f2ed81d54d7b912c73f7` (SHA-1 `9319cb1bb11df0f29e66f1262534b20bab5cd109`).
- **Native Google Sign-In Flow:** [authService.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/services/authService.ts) preserves `@capawesome/capacitor-google-sign-in@0.1.4` and `initializeAuth` persistence (`indexedDBLocalPersistence`, `browserLocalPersistence`).
- **Keystore Custody:** External developer keystore outside repo (`android/keystore.properties` gitignored; no security or Play Protect bypasses).

---

## 2. Android `v1.3.0` Changes

- **Compact Phone/Tablet Landscape Grid Across All 16 Games ([index.css](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/index.css), `src/games/*.tsx`, [GameHudBar.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/components/ui/GameHudBar.tsx)):** Side-by-side 2-column compact landscape grid (`@media (orientation: landscape) and (max-height: 560px)`) keeps HUD metrics, action/hint controls, and interactive boards above the fold without vertical or horizontal scrolling; pause and completion dialogs in [GamePlayPage.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/pages/GamePlayPage.tsx) constrain height (`max-h-[92dvh] overflow-y-auto`) so buttons never clip in landscape.
- **Verified APK Update Flow & Offline Fast-Fail ([adapter.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/platform/adapter.ts), [SettingsPage.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/pages/SettingsPage.tsx)):** `Settings -> Check for Updates` queries live centralized [release-manifest.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/public/release-manifest.json) with GitHub Releases fallback, surfaces signed APK download CTA + expected SHA-256, and fast-fails cleanly when `navigator.onLine === false` with `Retry Update Check`.
- **Leaner APK/AAB Bundle:** Excluded build-only `1024x1024` icon from `public/` (`-56,735` B APK vs `v1.2.1`: `4,913,100` B -> `4,856,365` B; `-47,026` B AAB vs `v1.2.1`: `4,586,902` B -> `4,539,876` B).
- **Version Specs:** `minSdkVersion 24` (Android 7.0+) through `targetSdkVersion 36`, `versionCode 130`, `versionName 1.3.0`.

---

## 3. Verification Results (`PASS` / `FAIL` / `NOT TESTED`)

| Check | Status | Observed Evidence & Honest Scope |
|---|---|---|
| TypeScript & Vite Bundle (`dist/`) | **PASS** | `tsc --noEmit` & `vite build` exited `0`; `dist/` = `1,786,395` B (`85` Workbox precache entries / `1693.05 KiB`). |
| Gradle Signed APK + AAB Build (`v1.3.0`) | **PASS** | `assembleRelease bundleRelease` exited `0`; `apksigner` (`v2`, SHA-256 `38ecc6bd...f7`) & `jarsigner -verify` passed cleanly. |
| Full Anonymous Release Download Integrity | **PASS** | Downloaded complete `PuzzleVerse-v1.3.0-Android.apk` (`4,856,365` B) & `.aab` (`4,539,876` B) anonymously (`HTTP 200`), matching SHA-256, `release-manifest.json`, and `apksigner`. |
| `v1.2.1 -> v1.3.0` Migration & Update Check (Android 14 Emulator) | **PASS** | Installed `v1.2.1` (`versionCode 121`) -> verified `v1.2.1` `Check for Updates` detected `1.3.0` (`v121DetectedUpdate: true`) -> seeded `450` XP, `9` games, sound off pref, and sentinel -> `adb install -r` to `v1.3.0` (`versionCode 130`, `firstInstallTime` preserved) -> `upgradedDataPreserved: true`, `hasVersion130: true`, `updateStatusVisible: true`, `fatalCount: 0`. |
| Compact Landscape & Rotation Stability (Android 14 Emulator) | **PASS** | Live rotation `412x842 -> 866x364 -> 412x842` kept app PID `4355` (`pidUnchanged: true`), timer & mirror intact, `landscape.controlsBottom: 211`, `landscape.boardBottom: 337` (`<= 364`, `fitsControlsWithinLandscape: true`, `overflowX: false`), `backPaused: true`, `offlineColdStart.mounted: true`. |
| All 16 Games Responsive Landscape & Live E2E (`dist/`) | **PASS** | `16/16` games passed `866x364` landscape (`maxBottom` `238`–`358/364`, `overflowX: false`) & `412x842` portrait (`546`–`837/842`), and `16/16` solved end-to-end against `https://puzzleverse-e16e4.web.app` (`consoleErrors: []`). |
| Download Promotion Removal & `/download` Block | **PASS** | `hasDownloadPromo: false`, `hasDownloadPromoOnLogin: false`, `gamesCount: 16`. |
| Live `/download` Automatic Android Detection | **PASS** | Emulated Android Chrome on `https://puzzleverse-e16e4.web.app/download` auto-selected Android APK (`4.63 MB (4,856,365 bytes)`, `PuzzleVerse-v1.3.0-Android.apk`, `Android 7.0+`, PWA fallback, `overflowX: false`). |
| Native Google Sign-In Interactive Account Flow (`v1.3.0`) | **NOT TESTED** | Emulator Credential Manager trigger displayed friendly `No Google account is configured on this device yet`; developer previously signed off interactive Google account login on physical device for baseline `v1.2.1`, while `v1.3.0` physical-device login remains `NOT TESTED`. |
| Physical Android Device Sideload (`v1.3.0`) & Play Console Upload | **NOT TESTED** | Automated verification ran on official Android 14 API 34 emulator; physical phone sideload & Play Store upload remain pending user/Play Console action. |

---

## 4. Shared 16-Game Live E2E Verification (`all16_report.json` against `https://puzzleverse-e16e4.web.app`)

| # | Game | Launch & Tick | Pause & Resume | Hint / Action | Reset (`0s`/`30s`) | Real Solve (`pts` / `+50 XP`) | Offline Saved |
|---|---|---|---|---|---|---|---|
| 1 | Number Puzzle | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`590 pts`) | PASS |
| 2 | Word Puzzle | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`648 pts`) | PASS |
| 3 | Memory Puzzle | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`810 pts`) | PASS |
| 4 | Sliding Puzzle | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`817 pts`) | PASS |
| 5 | Logic Puzzle | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`735 pts`) | PASS |
| 6 | Pattern Puzzle | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`652 pts`) | PASS |
| 7 | Pipe Connect | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1035 pts`) | PASS |
| 8 | Color Path | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`992 pts`) | PASS |
| 9 | Block Escape | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`875 pts`) | PASS |
| 10 | Number Path | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1000 pts`) | PASS |
| 11 | Rotating Tiles | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`820 pts`) | PASS |
| 12 | Word Grid | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`995 pts`) | PASS |
| 13 | Arrow Path | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1000 pts`) | PASS |
| 14 | Maze Escape | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`994 pts`) | PASS |
| 15 | Laser Mirror | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1190 pts`) | PASS |
| 16 | Challenge Mode | PASS (`30s->28s`) | `true` (`No Pause` rule) | PASS | PASS (`30s`) | PASS (`600 pts`) | PASS |
