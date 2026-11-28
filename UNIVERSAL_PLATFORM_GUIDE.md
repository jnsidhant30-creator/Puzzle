# PuzzleVerse Universal Platform Build, Deployment & Release Guide (`v1.3.0`)

## 1. Architecture Overview
PuzzleVerse uses a single React 19 + TypeScript + Vite 8 + Zustand + Firebase codebase (`src/` -> `dist/`):
- **Web & ChromeOS / Browser PWA:** `vite-plugin-pwa@2.0.0` (`dist/sw.js`, `85` Workbox precache entries / `1693.05 KiB`, live on [Firebase Hosting](https://puzzleverse-e16e4.web.app/) & [Netlify](https://puzzzleverse.netlify.app/)).
- **Desktop (`electron@45.5.0` & `electron-builder@26.18.0`):** `electron/main.cjs` & `electron/preload.cjs` serve `dist/` over hardened `app://puzzleverse/` with loopback PKCE+PNA Google OAuth, `F11` fullscreen, single-instance locking, active-game quit/update guards, and SHA-256/SHA-512 verified GitHub updates.
- **Mobile (`@capacitor/core@8.6.3` Android & iOS):** Shares `dist/` via `npx cap sync` with native Credential Manager sign-in (`@capawesome/capacitor-google-sign-in@0.1.4`), hardware back pause handling, and Ocean Navy status/navigation bars (`MainActivity.java`).

## 2. Version & Centralized Release Manifest Scripts
- Generate & validate `public/release-manifest.json` (`15` platform entries, `schemaVersion: 1`):
  ```bash
  npm run lint
  npm run manifest:generate
  node scripts/verify-release-manifest.mjs
  npm run build
  ```
- Verify live GitHub Release `v1.3.0` binaries (full anonymous download + SHA-256) and manage backups/cleanup cleanly:
  ```bash
  node scripts/manage-releases.mjs --verify --tag v1.3.0
  # Back up older releases outside the repo before pruning obsolete public GitHub releases:
  node scripts/manage-releases.mjs --prune --keep v1.3.0 --binary-tags v1.2.1
  ```

## 3. Native Build Commands
- **Windows x64 & ARM64 (`Setup` + `Portable`):**
  ```bash
  npx electron-builder --win nsis portable --x64 --publish never
  npx electron-builder --win nsis portable --arm64 --publish never
  ```
- **Android Signed Universal APK & Play AAB (`com.puzzleverse.app`):**
  - Requires external release keystore (`~/.puzzleverse-keys/puzzleverse-android-release.jks` referenced by gitignored `android/keystore.properties`).
  ```bash
  npx cap sync android
  cd android && ./gradlew assembleRelease bundleRelease --no-daemon
  ```
- **macOS / Linux / iOS Automated Builds:** Trigger [.github/workflows/universal-release.yml](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/.github/workflows/universal-release.yml) on `main`, tag `v*`, or `workflow_dispatch`. Unsigned builds automatically skip OS signing without bypassing Gatekeeper/Play Protect/SmartScreen; push `.github/workflows/universal-release.yml` using a token with `workflow` scope (or upload via GitHub web UI if local git PAT lacks `workflow` scope).

## 4. Verification Suites
- `node scripts/test-desktop-packaged.mjs unpacked` & `portable` — unpackaged/portable security, `secondRun` single-instance lock, `16/16` games, updater UI, and settings.
- `node scripts/test-desktop-extra.mjs` — live Firestore public leaderboard read & offline retry guard.
- Scratch verification scripts (in session brain `scratch/`): `verify_full_release_integrity.mjs`, `verify_updater_and_migration_desktop.mjs`, `verify_android_v130.mjs`, `verify_live_web_and_pwa.mjs`, `verify_updater_and_perf.mjs`, `verify_16_games_landscape.mjs`, `verify_16_games_e2e.mjs`.
