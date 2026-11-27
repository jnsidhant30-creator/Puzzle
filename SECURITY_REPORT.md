# PuzzleVerse Cross-Platform Security Audit Report (`v1.1.0`)

**Application:** PuzzleVerse  
**Audit Date:** 2026-11-27  
**Scope:** Electron Desktop (`electron/`), Capacitor Android/iOS (`android/`, `ios/`), Vite PWA (`vite.config.ts`, `dist/`), Shared Adapter Layer (`src/platform/`), and Firebase Integrations (`src/services/firebase.ts`, `firestore.rules`).

---

## 1. Electron Desktop Security Controls ([main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs), [preload.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/preload.cjs))

- **Renderer Process Isolation:**
  - `nodeIntegration: false`
  - `contextIsolation: true`
  - `sandbox: true`
  - `webSecurity: true`
  - `webviewTag: false`, `allowRunningInsecureContent: false`
  - `devTools: !app.isPackaged` (DevTools and DevTools shortcuts disabled in packaged builds)
  - Automated runtime check on packaged EXEs confirmed `typeof window.require === 'undefined'` and `typeof window.process === 'undefined'`.
- **Custom Scheme & Path Traversal Protection:**
  - Static assets are served strictly from `resources/app.asar/dist` under privileged custom scheme `app://puzzleverse/`.
  - Paths are canonically resolved (`path.resolve`) with explicit directory prefix enforcement (`targetPath.startsWith(distDir + path.sep)`) blocking directory-traversal requests (`403 Forbidden`).
- **Strict Content Security Policy (CSP):**
  - Applied dynamically via `session.defaultSession.webRequest.onHeadersReceived`:
    - `default-src 'self' app://puzzleverse`
    - `script-src 'self' app://puzzleverse` (zero `'unsafe-inline'` scripts in packaged mode)
    - `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`
    - `connect-src` limited to official Firebase Auth/Firestore, Google Fonts, and GitHub Releases HTTPS endpoints.
- **IPC Sender & URL Allowlist Enforcement:**
  - `assertTrustedSender(event)` validates `event.senderFrame.url` starts with `app://puzzleverse/` (or `http://localhost:3000` in unpacked dev).
  - `will-navigate` and `setWindowOpenHandler` deny untrusted origins; external links pass through `isApprovedExternalUrl` (`https://` allowlist covering Firebase Hosting, Netlify, GitHub repo, and Google Auth).
- **Update Integrity & Active Game Guard:**
  - `check-updates` & `download-update` restrict downloads strictly to `github.com`, `objects.githubusercontent.com`, and `release-assets.githubusercontent.com`, allow only verified installer extensions (`.exe`, `.dmg`, `.AppImage`, `.deb`, `.rpm`), verify SHA-256 and SHA-512 hashes before finalizing in `Downloads`, and block update restarts while a match is active.
- **Google OAuth Loopback Security:**
  - Desktop Google Sign-In opens `https://puzzleverse-e16e4.web.app/desktop-auth` in the user's system browser using a cryptographically random 24-byte `state` nonce and a short-lived `127.0.0.1` HTTP callback with exact CORS origin checks and payload size cap (`32 KB`).

---

## 2. Mobile Security Controls (Capacitor Android & iOS)

- **Network & WebView Scheme:**
  - Android enforces `android:usesCleartextTraffic="false"` and `androidScheme: 'https'` ([capacitor.config.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/capacitor.config.ts), [AndroidManifest.xml](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/android/app/src/main/AndroidManifest.xml)).
  - iOS uses `capacitor` scheme with `ITSAppUsesNonExemptEncryption = false` ([Info.plist](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/ios/App/App/Info.plist)).
  - `allowNavigation` explicitly restricts in-app WebView navigation to official PuzzleVerse Hosting domains and Google auth domains.
- **Minimum Permissions:**
  - Android declares only `INTERNET`, `ACCESS_NETWORK_STATE`, and `VIBRATE` (no camera, microphone, contacts, coarse/fine location, or external storage permissions) and sets `android:allowBackup="false"`.
- **Embedded WebView OAuth Compliance:**
  - Because Google OAuth rejects embedded mobile WebViews (`disallowed_useragent`), [AuthModal.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/components/AuthModal.tsx) explicitly detects `Capacitor.isNativePlatform()` and avoids triggering broken WebView popups, guiding mobile users to native Email/Password or Guest Practice cleanly.
- **Signing Secret Hygiene:**
  - [android/app/build.gradle](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/android/app/build.gradle) reads keystore paths and passwords solely from environment variables (`ANDROID_KEYSTORE_*`), and `.gitignore` excludes `*.keystore`, `*.jks`, and `.env*`.

---

## 3. Firebase Backend, PWA & Offline Isolation

- **Zero Server Credentials in Clients:** No Firebase Admin SDK credentials, service-account JSON files, private keys, or API signing secrets are bundled into `dist/`, `electron/`, `android/`, or `ios/`.
- **Firestore Security & Leaderboard Integrity:**
  - Existing [firestore.rules](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/firestore.rules) and [functions/](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/functions) remain unmodified.
  - Offline Guest Practice stores data exclusively under local browser storage (`puzzleverse_guest_user`, `puzzleverse_offline_practice_v1`) and explicitly skips global `saveLeaderboardEntry` / `saveGameSession` cloud writes.
- **PWA Scope Safety:** Service Worker precaching (`sw.js`) registers strictly on `http:` / `https:` web origins and never runs inside packaged Electron (`app://`) or native Capacitor WebViews.

---

## 4. Transparent Unsigned Status Notice (OS Trust Mechanisms Respected)

PuzzleVerse **never** disables, bypasses, or tampers with Windows SmartScreen, macOS Gatekeeper, Android Play Protect, or Apple iOS App Store code-signing requirements. Because no paid certificates or developer memberships were purchased without approval, published desktop `v1.1.0` `.exe` binaries report `Status: NotSigned` (`Get-AuthenticodeSignature`), and macOS/iOS CI release signing remains optional until valid organization certificates are supplied via CI secrets.
