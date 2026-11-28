# PuzzleVerse Cross-Platform Security Audit Report (`v1.3.0`)

**Application:** PuzzleVerse  
**Audit Date:** 2026-11-28  
**Scope:** Centralized Auth Adapters (`src/services/authService.ts`, `src/services/firebase.ts`), Electron Desktop (`electron/`), Capacitor Android/iOS (`android/`, `ios/`), Vite PWA (`vite.config.ts`, `dist/`), Update Infrastructure (`src/platform/adapter.ts`, `public/release-manifest.json`, `scripts/manage-releases.mjs`), and Firebase Hosting/Netlify headers.

---

## 1. Cross-Platform Google OAuth & Session Hardening

- **Atomic Firebase Auth Persistence ([firebase.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/services/firebase.ts)):** `initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })` prevents session loss across redirects and restarts.
- **Desktop Loopback OAuth Security ([main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs), [DesktopAuthPage.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/pages/DesktopAuthPage.tsx)):** `127.0.0.1` ephemeral loopback server with 24-byte random `state` nonce, `S256` PKCE `codeChallenge`, exact allowlisted CORS + `Access-Control-Allow-Private-Network: true`, `32 KB` payload bound, and hidden `<form method="POST">` HTML callback fallback. Zero tokens in URLs or logs.
- **Native Mobile Credential Manager ([authService.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/services/authService.ts)):** `@capawesome/capacitor-google-sign-in@0.1.4` Google ID token exchanged via `GoogleAuthProvider.credential(idToken)` against registered Firebase Android & iOS apps.

---

## 2. Electron Desktop & Auto-Updater Integrity (`v1.3.0`)

- **Renderer Isolation:** `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`, `webviewTag: false`, `allowRunningInsecureContent: false`, `devTools: !app.isPackaged`. Runtime tests on both unpacked and portable `v1.3.0` binaries verified `hasNodeRequire: false`, `hasNodeProcess: false`, `hasDesktopBridge: true`.
- **Single-Instance & State Protection ([main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs)):** `second-instance` focuses existing window (`desktop:second-instance` event) and preserves active state across duplicate launches (`secondInstanceStateCheck.sentinelPreserved: true` verified on both unpacked and portable builds). Active-game update blocking verified (`activeGameSafetyBlocked: true`).
- **Cryptographic Update Verification & Explicit Consent ([main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs), [SettingsPage.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/pages/SettingsPage.tsx)):**
  - Restricted update downloads strictly to trusted GitHub Release HTTPS hosts (`github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`).
  - Streams to `.part` temporary file, verifies exact **SHA-256** and **SHA-512** before renaming (`v1.2.1` auto-updater verified `122,328,814` B `dbe2ac1c...` end-to-end).
  - Portable EXE builds set `manualOnly: true` (`revealDownloadedFile` / `shell.showItemInFolder` in Downloads); Setup builds require explicit user confirmation checkbox before launching unsigned NSIS installers.
- **Release Manifest Cache Hygiene ([firebase.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/firebase.json), [public/_headers](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/public/_headers), [vite.config.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/vite.config.ts)):** `/release-manifest.json` serves `Cache-Control: no-cache, no-store, must-revalidate` and is excluded from Workbox precaching (`SW_HAS_MANIFEST_PRECACHE: false`).

---

## 3. Mobile, Installed PWA, Signing & Release Hygiene

- **Android Manifest & Network Security:** `android:allowBackup="false"`, `android:usesCleartextTraffic="false"`, `androidScheme: 'https'`.
- **Installed App Isolation (`detectPlatform.ts`, `App.tsx`):** Strictly hides all download/install promotions inside Electron, Capacitor, and standalone PWA (`canShowDownloadOptions === false`) and redirects `/download` cleanly.
- **Keystore & Backup Custody:** Android release keystore (`~/.puzzleverse-keys/puzzleverse-android-release.jks`) and private rollback release archives (`~/.puzzleverse-backups/releases/`) stay completely outside git and `public/`. Zero credentials or private keys exist inside source or bundle files.
- **Code Signing Transparency:** Windows Setup & Portable executables remain unsigned (`NotSigned`; SmartScreen warnings are never bypassed and SHA-256 sums are published). Android APK (`c64cf334...3c4`) and AAB (`0b9560c7...72`) are legitimately signed with the developer release certificate (`apksigner` v2 Cert SHA-256 `38ecc6bd...f7`).
- **Pre-Prune Verification Gate ([manage-releases.mjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/scripts/manage-releases.mjs)):** Obsolete public releases are deleted only after the target release passes 100% stream download + SHA-256 verification and older metadata/checksums + rollback binaries are backed up safely outside the repo.
