# PuzzleVerse Cross-Platform Security Audit Report (`v1.2.0`)

**Application:** PuzzleVerse  
**Audit Date:** 2026-11-28  
**Scope:** Centralized Auth Adapters (`src/services/authService.ts`, `src/services/firebase.ts`), Electron Desktop (`electron/`), Capacitor Android/iOS (`android/`, `ios/`), Vite PWA (`vite.config.ts`, `dist/`), Shared Adapter Layer (`src/platform/`), and Firebase Integrations.

---

## 1. Cross-Platform Google OAuth & Session Hardening (`v1.2.0`)

- **Atomic Firebase Auth Persistence ([firebase.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/services/firebase.ts)):**
  - Uses `initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })` at module boot rather than async post-init `setPersistence`, preventing login drops after Installed PWA reloads or redirects.
- **Desktop Loopback OAuth Security ([main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs), [DesktopAuthPage.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/pages/DesktopAuthPage.tsx)):**
  - Binds an ephemeral `127.0.0.1` loopback listener with a 24-byte random `state` nonce AND `S256` PKCE `codeChallenge` validation.
  - Emits exact allowlisted `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods: POST, OPTIONS`, and `Access-Control-Allow-Private-Network: true` preflight headers for Chrome/Edge Private Network Access compliance, alongside a same-payload `application/x-www-form-urlencoded` `<form method="POST">` HTML fallback response and `32 KB` payload size limit.
  - Never leaks raw OAuth tokens in redirect URLs or logs.
- **Native Mobile Credential Manager ([authService.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/services/authService.ts)):**
  - Replaced legacy `com.puzzleverse.app://auth` Chrome Custom Tab fragment redirects with `@capawesome/capacitor-google-sign-in@0.1.4` (`GetSignInWithGoogleOption` / Credential Manager) exchanging the Google ID token via `GoogleAuthProvider.credential(idToken)` against registered Firebase Android (`1:473636983543:android:3a790666582f4f808eb9f2` + release SHA-1/SHA-256) and iOS (`1:473636983543:ios:afce5358441e728d8eb9f2`) apps.

---

## 2. Electron Desktop Security Controls ([main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs), [preload.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/preload.cjs))

- **Renderer Isolation:** `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`, `webviewTag: false`, `allowRunningInsecureContent: false`, `devTools: !app.isPackaged`. Runtime tests on `v1.2.0` packaged executables verified `hasNodeRequire: false`, `hasNodeProcess: false`, `hasDesktopBridge: true`.
- **Custom Scheme & Path Traversal Protection:** Static production assets load strictly from `resources/app.asar/dist` via `app://puzzleverse/` with canonical path enforcement blocking traversal.
- **CSP & Navigation Controls:** Dynamic `onHeadersReceived` CSP (`script-src 'self' app://puzzleverse`, `frame-src 'none'`, `object-src 'none'`), IPC sender origin checks (`assertTrustedSender`), and allowlisted external HTTPS links (`isApprovedExternalUrl`).
- **Update Integrity:** Downloads restricted to GitHub Releases domains with SHA-256/SHA-512 hash verification before saving.

---

## 3. Mobile, Installed PWA & Signing Hygiene

- **Android Manifest & Network Security:** Declares `android:allowBackup="false"`, `android:usesCleartextTraffic="false"`, and `androidScheme: 'https'`, verified via `aapt2`.
- **Installed App Isolation (`detectPlatform.ts`, `App.tsx`):** Strictly hides all download/install promotions inside Electron, Capacitor, and Installed standalone PWA (`canShowDownloadOptions === false`) and redirects direct `/download` visits away from the download portal.
- **Keystore Custody:** Developer Android release keystore lives strictly outside the repository at `C:\Users\jnsid\.puzzleverse-keys\puzzleverse-android-release.jks` with `android/keystore.properties` gitignored. Zero Admin SDK credentials or private keys exist anywhere in client code.
- **Code Signing Transparency:** Windows desktop executables (`Setup` & `Portable` `x64`/`arm64`) remain unsigned (`NotSigned`); Android `.apk` and `.aab` are legitimately signed (`apksigner` v2 verified, Cert SHA-256 `38ecc6bd...f7`). OS security prompts (SmartScreen, Gatekeeper, Play Protect) are never bypassed or disabled.
