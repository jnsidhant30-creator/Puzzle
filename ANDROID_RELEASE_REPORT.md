# PuzzleVerse Android Release Report (`v1.2.1` Android / `com.puzzleverse.app`)

**Application Name:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Android Package ID:** `com.puzzleverse.app`  
**Android Version:** `1.2.1` (`versionCode: 121`, upgraded cleanly in place from `1.2.0` / `versionCode: 120`)  
**Release Date:** 2026-11-28  
**Direct Public APK Download:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.2.1/PuzzleVerse-v1.2.1-Android.apk  
**Public Play Store AAB:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.2.1/PuzzleVerse-v1.2.1-Android.aab  
**Public Android Checksums:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.2.1/ANDROID_SHA256SUMS.txt  
**Public Download Portal:** https://puzzleverse-e16e4.web.app/download (Mirror: https://puzzzleverse.netlify.app/download)

---

## 1. Signed Release Artifacts & Checksums

| Artifact | Local Path | Size | SHA-256 | Public HTTPS Status |
|---|---|---|---|---|
| **Signed Universal APK (`v1.2.1`)** | `release/PuzzleVerse-v1.2.1-Android.apk` | `4,913,100 bytes` (`4.69 MB`) | `b3a7acba7836e145a4d16832b1969a95924c5b23ecfd9786389f18c2be1aa9fd` | **PASS** (GitHub Release `v1.2.1`, HTTP `206` anonymous range `bytes 0-15/4913100`) |
| **Signed Google Play AAB (`v1.2.1`)** | `release/PuzzleVerse-v1.2.1-Android.aab` | `4,586,902 bytes` (`4.37 MB`) | `1ab8d3be4481633c14913fb46399b4c456fa40bf79d0df6b0638baa2f39a19ff` | **PASS** (GitHub Release `v1.2.1`) |
| **Android SHA-256 Sums** | `release/ANDROID_SHA256SUMS.txt` | — | Verified | **PASS** (GitHub Release `v1.2.1`) |

*(Baseline `v1.2.0` (`versionCode 120`) and initial `v1.0.0` (`versionCode 100`) remain archived under earlier GitHub releases; `v1.2.1` preserves package ID `com.puzzleverse.app` and the same developer release signing certificate.)*

### Signing & Firebase Authentication Registration
- **APK Signature Verification (`apksigner`):** `Verifies` (`Verified using v2 scheme (APK Signature Scheme v2): true`).
- **AAB Signature Verification:** `jarsigner -verify` passed cleanly.
- **Certificate Fingerprints:** SHA-1 `9319cb1bb11df0f29e66f1262534b20bab5cd109` · SHA-256 `38ecc6bd01f992e93a75e721fb9364182ef72c0b1e28f2ed81d54d7b912c73f7`.
- **Firebase Android App (`puzzleverse-e16e4`):** Verified via Firebase CLI (`firebase apps:android:sha:list 1:473636983543:android:3a790666582f4f808eb9f2`), matching both SHA-1 & SHA-256 fingerprints alongside Android OAuth client (`473636983543-ghvbk3bdo1rovoct38ql39oiadh8q8jt.apps.googleusercontent.com`) and Web Server Client ID (`473636983543-e094a8bra4gf92g6s0pl4hrnmito0f2q.apps.googleusercontent.com`) in [google-services.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/android/app/google-services.json).
- **Native Google Sign-In Flow:** [authService.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/services/authService.ts) invokes `@capawesome/capacitor-google-sign-in@0.1.4` (`GoogleSignIn.initialize({ clientId: GOOGLE_WEB_CLIENT_ID })` -> `GoogleSignIn.signIn()`) and exchanges the returned `idToken` via `GoogleAuthProvider.credential(nativeRes.idToken)` + `signInWithCredential(auth, credential)` with atomic `initializeAuth` persistence (`indexedDBLocalPersistence`, `browserLocalPersistence`).
- **Keystore Custody:** External developer keystore at `C:\Users\jnsid\.puzzleverse-keys\puzzleverse-android-release.jks` (`android/keystore.properties` gitignored; no Play Protect or security bypasses).

---

## 2. Android `v1.2.1` Fixes & Capabilities

- **Landscape Orientation & System Bar Preservation:**
  - [MainActivity.java](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/android/app/src/main/java/com/puzzleverse/app/MainActivity.java) overrides `onCreate`, `onConfigurationChanged`, and `onWindowFocusChanged` with `applyOceanNavySystemBars()` (`0xFF142331`, `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`, `setAppearanceLightStatusBars(false)`, `setAppearanceLightNavigationBars(false)`) so status and navigation icons remain white across portrait and landscape transitions.
  - [adapter.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/platform/adapter.ts) adds an `orientationchange` listener re-applying `StatusBar.setStyle({ style: StatusBarStyle.Dark })` + `#142331`.
  - [index.css](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/index.css), [Navbar.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/components/Navbar.tsx), [App.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/App.tsx), and [GamePlayPage.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/pages/GamePlayPage.tsx) apply display-cutout safe padding (`env(safe-area-inset-left/right)`) and compact landscape sizing (`@media (orientation: landscape) and (max-height: 560px)`).
- **Color Path Solver & Hint Fix:** [ColorPath.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/games/ColorPath.tsx) replaces heuristic checks with `findPairSolutionPaths(size, pairs)` and adds interactive `Connect Pair ({hintsLeft})` hints.
- **Version Specs (`aapt2`):** `minSdkVersion 24` (Android 7.0+) through `targetSdkVersion 36`, `versionCode 121`, `versionName 1.2.1`, universal ABIs (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`), `android:allowBackup="false"`, `android:usesCleartextTraffic="false"`.

---

## 3. Verification Results (`PASS` / `FAIL` / `NOT TESTED`)

| Check | Status | Observed Evidence & Honest Notes |
|---|---|---|
| TypeScript & Vite Bundle (`dist/`) | **PASS** | `npm run lint` (`tsc --noEmit`) & `npm run build` (`vite build`, `87` Workbox precache entries / `1746.30 KiB`) exited `0`. |
| Gradle Signed APK + AAB Build (`v1.2.1`) | **PASS** | `assembleRelease bundleRelease` exited `0`; `apksigner` (`v2`) & `jarsigner -verify` passed cleanly. |
| In-Place Upgrade & Cold Launch (Android 14 Emulator) | **PASS** | `adb install -r` upgraded `versionCode 120` (`1.2.0`) -> `versionCode 121` (`1.2.1`) cleanly (`firstInstallTime` preserved); `0` fatal exceptions in `logcat`. |
| Android Rotation Stability (`Portrait -> Landscape -> Portrait`) | **PASS** | Rotated live inside **Laser Mirror** via `cmd window user-rotation lock 1` -> `lock 0`: app PID stayed `4717` (`stay-alive` sentinel unchanged, zero Activity restart/blank screen), timer preserved (`1s -> 6s -> 10s`), placed mirror preserved (`hasMirrorGlyph: true`), `gridRect.height` resized `309px -> 175px`, `overflowX: false`, white status bar icons preserved (`v121-rot-portrait.png`, `v121-rot-landscape.png`, `v121-rot-back-portrait.png`). *Note: on extreme `364px`-tall phone landscape viewport, bottom hint/reset controls sit below the fold (`y=500`) and require vertical scrolling.* |
| ColorPath Hint & Board Interaction (Android 14 Emulator) | **PASS** | Tapping `Connect Pair (5)` decremented to `Connect Pair (4)` and visually connected Pair 1 (`v121-colorpath.png`). |
| Individual 16-Game Lifecycle E2E Suite | **PASS** | Executed against the identical shared production bundle (`https://puzzleverse-e16e4.web.app`) across all 16 games individually: Launch, Puzzle Generation, Real Input, Hint/Action, Timer Advance, Pause Timer-Freeze + Resume, Reset (`0s` / `30s`), Full Completion, Scoring/XP Results Dialog, and `puzzleverse_offline_practice_v1` persistence (`16/16` passed, `consoleErrors: []`). *(Android-specific shell behaviors—in-place APK upgrade, rotation preservation, `KEYCODE_BACK`, offline cold launch, hidden mobile bottom nav, and ColorPath `Connect Pair`—were verified directly on the Android 14 emulator.)* |
| Download Promotion Removal & `/download` Block | **PASS** | Zero download links or banners in Login, Dashboard, or Settings inside Capacitor APK; `/download` redirects away; Settings reports `v1.2.1`. |
| Live `/download` Automatic Android Detection | **PASS** | Emulated Android Chrome on `https://puzzleverse-e16e4.web.app/download` auto-selected `Download for Android (APK)` showing `Version 1.2.1`, `4.69 MB (4,913,100 bytes)`, `Android 7.0+ (API 24 – 36)`, PWA fallback, and `overflowX: false`. |
| Native Google Sign-In Interactive Account Flow | **NOT TESTED** | Registered Firebase Android/iOS/Web apps, verified SHA-1/SHA-256 certificates, verified `authorizedDomains` via Firebase IdentityToolkit (`200`), and verified GMS Credential Manager trigger on emulator (friendly guidance shown when no OS Google account is signed in). End-to-end interactive Google consent & profile load still requires a device logged into a Google account (see step-by-step instructions). |
| Physical Android Device Sideload & Play Console Upload | **NOT TESTED** | Verified on official Android 14 Google APIs emulator; physical OEM phone sideload & Play Store Console upload remain pending user/Play Console action. |

---

## 4. Shared 16-Game Individual E2E Matrix (`all16_report.json`)

Every game below passed all checks independently against the live shared `dist/` production bundle with `0` console errors:

| # | Game | Launch & Gen | Timer Tick | Pause Freeze & Resume | Hint / Action | Reset (`0s`/`30s`) | Real Solve & Results (`pts` / `+50 XP`) | Offline Saved |
|---|---|---|---|---|---|---|---|---|
| 1 | Number Puzzle | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`590 pts`) | PASS |
| 2 | Word Puzzle | PASS | PASS (`1s->3s`) | PASS | PASS | PASS (`0s`) | PASS (`648 pts`) | PASS |
| 3 | Memory Puzzle | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`780 pts`) | PASS |
| 4 | Sliding Puzzle | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`937 pts`) | PASS |
| 5 | Logic Puzzle | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`735 pts`) | PASS |
| 6 | Pattern Puzzle | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`652 pts`) | PASS |
| 7 | Pipe Connect | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1130 pts`) | PASS |
| 8 | Color Path | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`992 pts`) | PASS |
| 9 | Block Escape | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`880 pts`) | PASS |
| 10 | Number Path | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`994 pts`) | PASS |
| 11 | Rotating Tiles | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`868 pts`) | PASS |
| 12 | Word Grid | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`995 pts`) | PASS |
| 13 | Arrow Path | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1000 pts`) | PASS |
| 14 | Maze Escape | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1000 pts`) | PASS |
| 15 | Laser Mirror | PASS | PASS (`0s->2s`) | PASS | PASS | PASS (`0s`) | PASS (`1190 pts`) | PASS |
| 16 | Challenge Mode | PASS | PASS (`30s->28s`) | N/A (`No Pause` rule) | N/A (Timed Rush) | PASS (`30s`) | PASS (`600 pts`) | PASS |
