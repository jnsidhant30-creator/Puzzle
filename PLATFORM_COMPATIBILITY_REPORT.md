# PuzzleVerse Universal Cross-Platform Compatibility Report (`v1.3.0`)

**Application:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Version:** `1.3.0`  
**Audit & Test Date:** 2026-11-28 (`RELEASE_DATE: 2026-11-28`)  
**Website & PWA Production:** https://puzzleverse-e16e4.web.app/ (Mirror: https://puzzzleverse.netlify.app/)  
**Centralized Release Manifest:** https://puzzleverse-e16e4.web.app/release-manifest.json  
**Universal Download Portal:** https://puzzleverse-e16e4.web.app/download  
**Public Release Assets (Only Active Release):** https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.3.0

---

## 1. Platform Matrix (`PASS` / `FAIL` / `NOT TESTED`)

| Platform / Target | Package / Artifact | Build Status | Runtime / Integrity Status | Honest Scope & Notes |
|---|---|---|---|---|
| **Windows 10/11 (x64)** | `PuzzleVerse-Setup-1.3.0-x64.exe` (`122,328,814` B, SHA-256 `dbe2ac1c...540`) & `PuzzleVerse-Portable-1.3.0-x64.exe` (`111,360,703` B, SHA-256 `f094b3c9...a76`) | **PASS** | **PASS** (`unpacked`, `portable`, `extra`, `v1.2.1 -> v1.3.0` auto-updater & migration) | Full HTTP `200` unauthenticated download + SHA-256 verified. Tested `win-unpacked` (`secondRunElapsedMs: 96`), `Portable` (`singleInstanceBlocked: true`, `secondRunElapsedMs: 23523`, `isPortableFlag: true`, `secondInstanceStateCheck.sentinelPreserved: true`), `test-desktop-extra.mjs`, and real `v1.2.1 -> v1.3.0` auto-updater download/SHA-256 verify/safety-gate/silent-upgrade preserving XP (`780`), settings, and sentinels (`consoleErrors: []`). Unsigned (`NotSigned`). Interactive `v1.3.0` Google OAuth consent on Desktop remains `NOT TESTED`. |
| **Windows 11 (ARM64)** | `PuzzleVerse-Setup-1.3.0-arm64.exe` (`116,320,841` B, SHA-256 `f4abd990...df`) & `PuzzleVerse-Portable-1.3.0-arm64.exe` (`106,028,867` B, SHA-256 `f34fe4b5...0a3`) | **PASS** | **NOT TESTED** (Full download & SHA-256 **PASS**) | Cross-compiled on Windows x64, full HTTP `200` download + SHA-256 verified, published on GitHub Release `v1.3.0` (`NotSigned`); Windows ARM64 hardware unavailable locally. |
| **Android (Capacitor 8 APK & AAB)** | `PuzzleVerse-v1.3.0-Android.apk` (`4,856,365` B, SHA-256 `c64cf334...3c4`) & `PuzzleVerse-v1.3.0-Android.aab` (`4,539,876` B, SHA-256 `0b9560c7...72`) | **PASS** | **PASS** (Emulator `v1.2.1 -> v1.3.0` + Landscape + Live 16/16 E2E) | Signed (`apksigner` v2 verified, `minSdk 24` / `targetSdk 36`, `versionCode 130`), full HTTP `200` download + SHA-256 + `apksigner` verified. On Android 14 API 34 emulator: `v1.2.1` detected `v1.3.0` update -> `adb install -r` upgraded cleanly preserving seeded XP (`450`), sound setting & sentinel -> PID `4355` preserved across rotation -> `controlsBottom: 211`, `boardBottom: 337` (`<= 364`), `backPaused: true`, `offlineColdStart.mounted: true`, `fatalCount: 0`. Physical phone sideload & interactive Google account consent on `v1.3.0` remain `NOT TESTED`. |
| **iPhone & iPad (iOS / iPadOS)** | `ios/` Xcode project (`MARKETING_VERSION = 1.3.0`, `CURRENT_PROJECT_VERSION = 130`) | **SYNCED** | **NOT TESTED** | Synced with Capacitor plugins (`capawesome/capacitor-google-sign-in`, Firebase config); `.ipa` signing & compilation require macOS CI runner / Apple Developer membership. Safari PWA remains playable today. |
| **macOS (Apple Silicon / Intel / Universal)** | `electron-builder.json` & `.github/workflows/universal-release.yml` | **CI CONFIGURED ONLY** | **NOT TESTED** | Requires `macos-latest` CI runner & Apple Developer ID for Gatekeeper notarization; disabled on `/download` until published. |
| **Linux (`x64` & `ARM64`)** | `.AppImage`, `.deb`, `.rpm` (`universal-release.yml`) | **CI CONFIGURED ONLY** | **NOT TESTED** | Configured for `ubuntu-latest` CI runner (`AppImage`, `deb`, `rpm`, verification & release publishing); disabled on `/download` until published. |
| **Web & Installed PWA (`ChromeOS` / Desktop / Mobile)** | `dist/` (`1,786,395` B / `84` files, `sw.js` `85` Workbox precache entries / `1693.05 KiB`, `release-manifest.json` `15` entries) | **PASS** | **PASS** | Deployed live `v1.3.0` to Firebase Hosting (`https://puzzleverse-e16e4.web.app`) & Netlify (`https://puzzzleverse.netlify.app`). Verified `release-manifest.json` (`200 OK`, `1.3.0`), `16/16` compact `866x364` landscape + `412x842` portrait layouts, `16/16` live E2E solves (`consoleErrors: []`), PWA non-interruptive banner hidden in gameplay & shown on exit, offline update-check error fast-fail + `Retry Update Check` recovery, and standalone PWA `/download -> /login` isolation. |

---

## 2. Bundle Optimization & Lifecycle Metrics

| Metric | `v1.2.1` Baseline | `v1.3.0` Final | Delta |
|---|---|---|---|
| `dist/` Total Bytes (`84` files) | `1,817,323 B` (`1774.73 KiB`) | `1,786,395 B` (`1744.53 KiB`) | `-30,928 B` (while adding `release-manifest.json`) |
| `public/icons/` Total Bytes | `119,020 B` | `57,692 B` | `-61,328 B` (`icon-1024x1024.png` relocated to `build/`) |
| Workbox Precache Entries | `87` (`1746.30 KiB`) | `85` (`1693.05 KiB`) | `-2` entries (`-53.25 KiB`, manifest excluded from precache) |
| Signed Android APK Size | `4,913,100 B` | `4,856,365 B` | `-56,735 B` |
| Signed Play Store AAB Size | `4,586,902 B` | `4,539,876 B` | `-47,026 B` |
| Live Cold Load (`verify_updater_and_perf.mjs`) | — | `downloadReadyMs: 1175` · `domContentLoadedMs: 761` · `loadEventMs: 1069` · `jsHeapMB: 5.05` | Measured on live CDN |

---

## 3. Obsolete Release Cleanup & Future Automation

- Verified only `v1.3.0` (`10` assets) remains publicly listed on GitHub Releases (`PUBLIC_RELEASES_REMAINING: [{"tag":"v1.3.0","assets":10}]`) and `releases/latest` resolves to `v1.3.0`.
- Archived private recovery backups outside the repository (`~/.puzzleverse-backups/releases/`): full binaries & checksums for `v1.2.1` plus metadata/checksums/`latest.yml` for `v1.2.0`, `v1.1.0`, and `v1.0.0`. All Git tags (`v1.0.0`–`v1.3.0`) remain intact.
- Automated verification & cleanup in [manage-releases.mjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/scripts/manage-releases.mjs) and [.github/workflows/universal-release.yml](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/.github/workflows/universal-release.yml).
