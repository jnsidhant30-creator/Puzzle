# PuzzleVerse Desktop Test Report (`v1.3.0`)

**Test Date:** 2026-11-28  
**Tested Artifacts:**
- Unpacked Windows x64: `release/win-unpacked/PuzzleVerse.exe` (`v1.3.0`)
- Portable Windows x64: `release/PuzzleVerse-Portable-1.3.0-x64.exe` (`111,360,703` bytes, `106.20 MB`, SHA-256 `f094b3c982d515ec0db81c0e8a29616f660181c1a22b954c4c72699c319f2a76`)
- Setup Windows x64: `release/PuzzleVerse-Setup-1.3.0-x64.exe` (`122,328,814` bytes, `116.66 MB`, SHA-256 `dbe2ac1c09f8d30817821822a34a19d379313ba1043e7340a4b054e5d1970540`)
- Windows ARM64 (cross-built only): `PuzzleVerse-Setup-1.3.0-arm64.exe` (`116,320,841` bytes) & `PuzzleVerse-Portable-1.3.0-arm64.exe` (`106,028,867` bytes)

---

## 1. Automated Desktop Test Suites (`PASS` / `FAIL` / `NOT TESTED`)

| Test Suite / Check | Status | Observed Evidence |
|---|---|---|
| **`v1.2.1 -> v1.3.0` Live Auto-Updater & Migration** (`verify_updater_and_migration_desktop.mjs`) | **PASS** | Silently installed `v1.2.1` Setup -> seeded `totalXp: 780`, `gamesCompleted: 14`, sound/theme prefs & UID sentinel -> clicked **Check for Updates** in `v1.2.1` UI -> detected `v1.3.0` -> downloaded `122,328,814` B Setup to `Downloads` -> verified `Status: Downloaded` & SHA-256 `dbe2ac1c...` -> confirmed active-game block (`activeGameSafetyBlocked: true`) -> upgraded silently to `v1.3.0` -> confirmed `version: "1.3.0"`, `xpPreserved: true`, `settingsPreserved: true`, `uidSentinelPreserved: true`, `upToDateAfterMigration: true`, `errors: []`, and clean test uninstall. |
| **`test-desktop-packaged.mjs unpacked` (`v1.3.0`)** | **PASS** | `protocol: "app:"`, `hasNodeRequire: false`, `hasNodeProcess: false`, `hasDesktopBridge: true`, `singleInstanceBlocked: true` (`secondRunElapsedMs: 96`, `secondInstanceStateCheck: { eventCount: 1, sentinelPreserved: true }`, `isPortableFlag: false`), all `16/16` games `true`, `noDownloadPromotionsInDesktop: true`, `downloadRouteRedirected: true`, `fullscreenChecks` (`entered: true`, `exited: true`, `resize1100Overflow: false`), `exitConfirmWorked: true`, `updateCheckStatus: "up-to-date"`, `consoleErrors: []`. |
| **`test-desktop-packaged.mjs portable` (`v1.3.0`)** | **PASS** | Same security, `16/16` games, navigation, settings, and download-isolation pass + `isPortableFlag: true`, `singleInstanceBlocked: true` (`secondRunElapsedMs: 23523` reflecting NSIS SFX extraction before lock check, `secondInstanceStateCheck: { eventCount: 1, sentinelPreserved: true }`), `updateCheckStatus: "up-to-date"`, `consoleErrors: []`. |
| **`test-desktop-extra.mjs` (`v1.3.0`)** | **PASS** | `onlineFirebaseRead: { ok: true, status: 200 }`, `showsOfflineLbGuard: true`, `onlineLeaderboardLoaded: true`, `reloadMounted: true`. |
| **Full Anonymous GitHub Release Download Check** | **PASS** | Downloaded all `4` Windows EXEs completely from GitHub Release `v1.3.0` (`HTTP 200`), 100% matching byte lengths, `SHA256SUMS.txt`, and `release-manifest.json`. |
| **Windows ARM64 Hardware Runtime Execution** | **NOT TESTED** | Cross-built on `x64` Windows (`SHA-256` & full HTTP download verified); no Windows ARM64 machine locally. |
| **macOS & Linux Binary Builds / Execution** | **NOT TESTED** | Configured in `.github/workflows/universal-release.yml` for GitHub-hosted `macos-latest` and `ubuntu-latest` runners. |
| **Interactive Human Google OAuth Login Round-Trip (`v1.3.0`)** | **NOT TESTED** | Verified `hasAuthForm: true`, `hasContinueGoogleBtn: true` on live `/desktop-auth`, and `v1.2.1` baseline sign-off by user; human account consent in `v1.3.0` EXE remains `NOT TESTED`. |
