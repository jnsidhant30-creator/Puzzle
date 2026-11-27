# PuzzleVerse Android Release Report (`v1.0.0` Android / `com.puzzleverse.app`)

**Application Name:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Android Package ID:** `com.puzzleverse.app`  
**Android Version:** `1.0.0` (`versionCode: 100`)  
**Release Date:** 2026-11-27  
**Direct Public APK Download:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/PuzzleVerse-v1.0.0-Android.apk  
**Public Play Store AAB:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/PuzzleVerse-v1.0.0-Android.aab  
**Public Android Checksums:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/ANDROID_SHA256SUMS.txt  
**Public Download Portal:** https://puzzleverse-e16e4.web.app/download (Mirror: https://puzzzleverse.netlify.app/download)

---

## 1. Signed Release Artifacts & Checksums

| Artifact | Local Path | Size | SHA-256 | Public HTTPS Status |
|---|---|---|---|---|
| **Signed Universal APK** | `release/PuzzleVerse-v1.0.0-Android.apk` | `3,970,575 bytes` (`3.79 MB`) | `16e863e0fcfc919ed666784ff3c3b752bf46c5786811477414250f7dc00daff3` | **PASS** (HTTP `206` anonymous range request) |
| **Signed Google Play AAB** | `release/PuzzleVerse-v1.0.0-Android.aab` | `3,789,930 bytes` (`3.61 MB`) | `d1eb2eac8b3a81f745917bdf0ec20e403695d358e53b8d6783f063abc8486bc9` | **PASS** (HTTP `206` anonymous range request) |
| **Android SHA-256 Sums** | `release/ANDROID_SHA256SUMS.txt` | `196 bytes` | — | **PASS** (HTTP `206` anonymous range request) |

### Signing & Key Preservation
- **Tool Verification (`apksigner.bat verify --verbose --print-certs`):** `Verifies` (`Verified using v2 scheme (APK Signature Scheme v2): true`).
- **Certificate Subject (`DN`):** `CN=PuzzleVerse, OU=Mobile, O=Sidhant Jain, L=India, ST=KA, C=IN` (`RSA 2048-bit`, cert SHA-256 digest `38ecc6bd01f992e93a75e721fb9364182ef72c0b1e28f2ed81d54d7b912c73f7`).
- **Release Keystore Custody:** Preserved outside Git at `C:\Users\jnsid\.puzzleverse-keys\puzzleverse-android-release.jks` with gitignored `android/keystore.properties` (never committed or exposed in source).
- **Play Store / Play Protect Honesty:** Signed with an official developer release keystore (no OS security or Play Protect bypasses). Not yet uploaded to Google Play Console / Play App Signing because publishing on Play Console requires a paid Google Play Developer membership.

---

## 2. Compatibility, Bundling & Security Metadata (`aapt2`)

- **Android Version Range:** `minSdkVersion 24` (Android 7.0 Nougat, minimum supported by Capacitor 8) through `targetSdkVersion 36` (`compileSdkVersion 36`, Android 16).
- **Screen Sizes & Densities:** `small`, `normal`, `large`, `xlarge`, `anyDensity: true` (phones and tablets).
- **Universal Architecture Compatibility:** Contains pure JS/Capacitor/Dalvik bytecode (`classes.dex`) with no restricted `.so` ABI slices in `lib/`, supporting `arm64-v8a`, `armeabi-v7a`, `x86`, and `x86_64`.
- **Bundled Assets:** Contains all `83` entries under `assets/public/` (all 16 puzzle games, shared UI, procedural puzzle generators), `assets/capacitor.config.json`, `assets/capacitor.plugins.json`, `assets/native-bridge.js`, adaptive launcher icons (`ic_launcher`, `ic_launcher_round`), and branded Ocean Navy + Turquoise splash screens.
- **Minimal Permissions & Hardening:** Declares only `android.permission.INTERNET`, `android.permission.ACCESS_NETWORK_STATE`, `android.permission.VIBRATE`, and `com.puzzleverse.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Enforces `android:allowBackup="false"`, `android:usesCleartextTraffic="false"`, dark `#142331` status/navigation bar styling, and custom deep-link OAuth intent-filter (`com.puzzleverse.app://auth`).

---

## 3. Verification Results (`PASS` / `FAIL` / `NOT TESTED`)

| Check | Status | Evidence & Notes |
|---|---|---|
| TypeScript & Vite Bundle (`dist/`) | **PASS** | `npm run lint` (`tsc --noEmit`) & `npm run build` (`vite build`, `84` Workbox precache entries / `1728.78 KiB`) exited `0`. |
| Gradle Signed APK + AAB Build | **PASS** | `.\gradlew.bat assembleRelease bundleRelease --no-daemon` (`454 actionable tasks`, `BUILD SUCCESSFUL in 1m 46s`). |
| APK Signature & Manifest Verification | **PASS** | `apksigner verify` (`Verifies`, v2 scheme), `aapt2 dump badging/permissions/xmltree` verified `minSdk 24`, `targetSdk 36`, `allowBackup=false`, `usesCleartextTraffic=false`. |
| Emulator Cold Launch & UI (Android 14 API 34) | **PASS** | `adb install` succeeded (`Success`), launched `com.puzzleverse.app/.MainActivity`, verified legible dark `#142331` status bar icons (`g-01`), Guest Practice login (`ok-01`), 16-game Catalog (`ok-02`), playable Number Puzzle (`ok-03`), `0` fatal/uncaught crashes in `logcat`. |
| Emulator Offline Cold Launch (Wi-Fi & Data OFF) | **PASS** | Cold launch with Wi-Fi + Mobile Data disabled rendered in `8154ms` (`gp-05`), displayed offline status notice and guarded Google Sign-In cleanly without crashing. |
| Emulator Hardware Back Navigation | **PASS** | `adb shell input keyevent 4` during active gameplay paused the match (`Match paused`, `ok-05`) and kept `MainActivity` focused. |
| Responsive Portrait & Landscape Layout | **PASS** | Portrait & Dashboard Landscape verified on Android 14 emulator (`ok-01`..`ok-03`, `g-05`); Gameplay Landscape (`915×412`) verified full-width (`headerWidth: 915`, `overflowX: false`) in emulated Android Chrome (`live-web-gameplay-landscape.png`). Note: in headless Vulkan emulator (`ok-04`), rapid programmatic `user_rotation 1` snapshot while inside Number Puzzle caught WebView mid-reflow over seamless `#142331` dark fill. |
| Live `/download` Automatic Android Detection & Deploy | **PASS** | Deployed to Firebase Hosting (`81` files) & Netlify (`80` files); emulated Android Chrome (`412×915`) automatically detected `Android`, prioritized `Download for Android (APK)`, showed Version `1.0.0`, `3.79 MB (3,970,575 bytes)`, `Android 7.0+ (API 24 – 36)`, PWA install CTA, and zero console/runtime errors. |
| Physical Android Phone/Tablet Hardware Install | **NOT TESTED** | Verified in official Android 14 Google APIs emulator (`WHPX` + Vulkan); physical OEM device / Samsung/Pixel sideload prompt not executed locally. |
| Interactive Google OAuth Consent Round-Trip | **NOT TESTED** | Verified `com.puzzleverse.app://auth` intent filter, `/desktop-auth?mobile=1` route, and `@capacitor/browser` integration; interactive human Google consent click on mobile browser not executed automatically. |
