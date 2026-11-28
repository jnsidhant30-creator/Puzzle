# PuzzleVerse Android Release Report (`v1.2.0` Android / `com.puzzleverse.app`)

**Application Name:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Android Package ID:** `com.puzzleverse.app`  
**Android Version:** `1.2.0` (`versionCode: 120`, cleanly upgraded from `1.0.0` / `versionCode: 100`)  
**Release Date:** 2026-11-28  
**Direct Public APK Download:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.2.0/PuzzleVerse-v1.2.0-Android.apk  
**Public Play Store AAB:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.2.0/PuzzleVerse-v1.2.0-Android.aab  
**Public Android Checksums:** https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.2.0/ANDROID_SHA256SUMS.txt  
**Public Download Portal:** https://puzzleverse-e16e4.web.app/download (Mirror: https://puzzzleverse.netlify.app/download)

---

## 1. Signed Release Artifacts & Checksums

| Artifact | Local Path | Size | SHA-256 | Public HTTPS Status |
|---|---|---|---|---|
| **Signed Universal APK (`v1.2.0`)** | `release/PuzzleVerse-v1.2.0-Android.apk` | `4,911,848 bytes` (`4.68 MB`) | `01b940057739c7ee0f949d53d67443167bdfd5e075a841a6a48f142cd12b489d` | **PASS** (HTTP `206` anonymous range: `bytes 0-15/4911848`) |
| **Signed Google Play AAB (`v1.2.0`)** | `release/PuzzleVerse-v1.2.0-Android.aab` | `4,585,670 bytes` (`4.37 MB`) | `3efd7e7f3191907b5fca0ae26cee503277e75a82cacb9617c9fe2a648d9b47` | **PASS** (GitHub Release `v1.2.0`) |
| **Android SHA-256 Sums** | `release/ANDROID_SHA256SUMS.txt` | `214 bytes` | — | **PASS** (GitHub Release `v1.2.0`) |

*(Note: Initial `v1.0.0` baseline `PuzzleVerse-v1.0.0-Android.apk` (`3,970,575` B) remains archived under release `v1.1.0`; `v1.2.0` upgrades seamlessly in place with identical package ID and release signing key.)*

### Signing & Firebase Authentication Registration
- **Tool Verification (`apksigner.bat verify --verbose --print-certs`):** `Verifies` (`Verified using v2 scheme (APK Signature Scheme v2): true`).
- **Certificate Subject (`DN`):** `CN=PuzzleVerse, OU=Mobile, O=Sidhant Jain, L=India, ST=KA, C=IN` (`RSA 2048-bit`, Cert SHA-1 `9319cb1bb11df0f29e66f1262534b20bab5cd109`, Cert SHA-256 `38ecc6bd01f992e93a75e721fb9364182ef72c0b1e28f2ed81d54d7b912c73f7`).
- **Firebase Android App Registration (`puzzleverse-e16e4`):** Registered Firebase Android App `1:473636983543:android:3a790666582f4f808eb9f2` (`com.puzzleverse.app`), attached both release SHA-1 and SHA-256 certificate fingerprints, and generated [google-services.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/android/app/google-services.json).
- **Native Google Sign-In Migration:** Replaced embedded Chrome Custom Tab redirect auth with `@capawesome/capacitor-google-sign-in@0.1.4` (`GetSignInWithGoogleOption` / Android Credential Manager) exchanging the Google ID token via Firebase `GoogleAuthProvider.credential(idToken)` in [authService.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/services/authService.ts).
- **Release Keystore Custody:** Preserved outside Git at `C:\Users\jnsid\.puzzleverse-keys\puzzleverse-android-release.jks` with gitignored `android/keystore.properties` (no Play Protect or OS security checks bypassed).

---

## 2. Compatibility, Bundling & Security Metadata (`aapt2`)

- **Android Version Range:** `minSdkVersion 24` (Android 7.0 Nougat) through `targetSdkVersion 36` (`compileSdkVersion 36`, Android 16).
- **Universal Architecture Support:** Supports `arm64-v8a`, `armeabi-v7a`, `x86`, and `x86_64` on smartphones and tablets (` Portrait` & `Landscape`).
- **Native UI & App Isolation (`v1.2.0`):**
  - Strictly hides all download/install promotions, banners, sidebar/bottom links, and `/download` route access inside the Capacitor Android app.
  - Added 5-tab mobile bottom navigation (`Home`, `Games`, `Challenges`, `Leaderboard`, `Profile`) automatically hidden during active gameplay, mobile level pill header, and unfinished match exit confirmation (`Leave Active Puzzle?` / `Match paused`).
- **Declared Permissions (`aapt2 dump badging`):** `android.permission.INTERNET`, `android.permission.VIBRATE`, `android.permission.ACCESS_NETWORK_STATE`, `android.permission.USE_BIOMETRIC`, `android.permission.USE_FINGERPRINT`, and `com.puzzleverse.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, with `android:allowBackup="false"` and `android:usesCleartextTraffic="false"`.

---

## 3. Verification Results (`PASS` / `FAIL` / `NOT TESTED`)

| Check | Status | Observed Evidence & Notes |
|---|---|---|
| TypeScript & Vite Bundle (`dist/`) | **PASS** | `npm run lint` (`tsc --noEmit`) & `npm run build` (`vite build`, `87` Workbox precache entries / `1743.56 KiB`) exited `0`. |
| Gradle Signed APK + AAB Build (`v1.2.0`) | **PASS** | `.\gradlew.bat assembleRelease bundleRelease --no-daemon` (`495 actionable tasks`, `BUILD SUCCESSFUL in 2m 24s`). |
| APK Signature & AAB Verification | **PASS** | `apksigner` verified (`v2 scheme: true`, SHA-1 `9319cb...`), `jarsigner -verify` verified on `.aab`. |
| In-Place Upgrade & Cold Launch (Android 14 Emulator) | **PASS** | `adb install -r release\PuzzleVerse-v1.2.0-Android.apk` cleanly upgraded `versionCode 100` (`1.0.0`) → `versionCode 120` (`1.2.0`), cold start `4665ms`, `0` `FATAL EXCEPTION` entries in `logcat`. |
| Native Credential Manager Google Sign-In Trigger | **PASS** (GMS Trigger) / **NOT TESTED** (Interactive Account Pick) | Tapping `Continue with Google` cleanly invoked GMS Credential Manager (`GoogleIdService` / `CredManProvService`); because the test emulator has no signed-in Google OS account (`cgi: No matching credentials`), the UI surfaced the friendly guidance alert without crashing. Full interactive Google account consent pick requires a device logged into a Google account. |
| Download Promotion Removal & `/download` Block | **PASS** | Verified `hasDownloadPromo: false` across Login/Dashboard/Settings and direct navigation to `/download` redirects cleanly (`pathAfterDirectDownloadUrl: "/login"`). |
| Mobile Gaming UI, 16 Games, Back Nav & Offline Launch | **PASS** | Verified 5-tab `BottomNavigation`, all `16` Play cards (`visiblePlayButtons: 16`), bottom nav hidden during gameplay (`visibleBottomNav: 0`, `overflowX: false`), `KEYCODE_BACK` opening `Match paused`, Settings showing `v1.2.0`, and offline cold launch (`svc wifi disable` & `svc data disable`). |
| Live `/download` Automatic Android Detection | **PASS** | Emulated Android Chrome on `https://puzzleverse-e16e4.web.app/download` automatically selected `Download for Android (APK)`, displaying `Version 1.2.0`, `4.68 MB (4,911,848 bytes)`, `Android 7.0+ (API 24 – 36)`, PWA install fallback, and `overflowX: false`. |
| Physical Android Device Sideload & Play Console Upload | **NOT TESTED** | Verified on official Android 14 Google APIs emulator; physical OEM phone installation and Play Store Console upload remain pending Google Play Developer registration. |
