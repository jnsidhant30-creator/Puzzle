# PuzzleVerse Desktop Setup & Architecture Guide

**Application:** PuzzleVerse  
**Tagline:** Challenge Your Mind. Beat Your Best.  
**Version:** 1.0.0  
**Target Platform:** Windows 10 & Windows 11 (64-bit x64)  
**Publisher:** Sidhant Jain  

---

## 1. End-User Installation (No Developer Tools Required)

Ordinary Windows users **do not need Node.js, npm, Java, VS Code, or Firebase CLI**.

### Option A: Windows Installer (`PuzzleVerse-Setup-1.0.0-x64.exe`)
1. Download `PuzzleVerse-Setup-1.0.0-x64.exe` from the public [Download Page](https://puzzleverse-e16e4.web.app/download) or [GitHub Releases](https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.0.0).
2. Optionally verify SHA-256 integrity in PowerShell:
   ```powershell
   Get-FileHash .\PuzzleVerse-Setup-1.0.0-x64.exe -Algorithm SHA256
   ```
3. Double-click the installer. If Windows SmartScreen appears (since `v1.0.0` is unsigned), choose **More info → Run anyway** after verifying the SHA-256 checksum.
4. Choose your installation path (per-user install under `%LOCALAPPDATA%\Programs\PuzzleVerse` with no Administrator privileges required).
5. Shortcuts are added to your Desktop and Start Menu (`Games → PuzzleVerse`), with a clean per-user Uninstaller registered under Windows Installed Apps.

### Option B: Portable Executable (`PuzzleVerse-Portable-1.0.0-x64.exe`)
1. Download `PuzzleVerse-Portable-1.0.0-x64.exe`.
2. Verify SHA-256 (`55847989047fde9e789e07f49e5ebdcd2507fc7f26c4b07981312be3106a2d2f`).
3. Run directly from any folder or USB drive without modifying Start Menu or Registry entries.

---

## 2. Desktop Application Architecture

PuzzleVerse Desktop reuses the single Vite + React + TypeScript codebase (`src/`) wrapped in a hardened Electron runtime (`electron/`):

- **Main Process ([main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs)):**
  - Enforces a single application instance (`app.requestSingleInstanceLock()`).
  - Registers a privileged local scheme `app://puzzleverse/` serving bundled assets strictly from `resources/app.asar/dist` with path-traversal protection and SPA history fallback (`index.html`), requiring **no Vite dev server** in production.
  - Displays a frameless splash screen ([splash.html](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/splash.html)) while preparing the main window (`1440×900` default, persisted bounds in `userData/window-state.json`).
  - Guards active puzzle exits with a confirmation dialog (`Leave Puzzle & Quit` vs `Keep Playing`) when closing during gameplay.
  - Provides `F11` fullscreen toggling, `Escape` solo pause dispatch, system-browser loopback Google OAuth (`127.0.0.1` one-time nonce callback), and HTTPS GitHub Releases update verification.
- **Preload Script ([preload.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/preload.cjs)):**
  - Uses `contextBridge.exposeInMainWorld('puzzleverseDesktop', ...)` with strictly typed IPC channels ([desktop.d.ts](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/types/desktop.d.ts)).
- **Shared Renderer (`src/`):**
  - Service worker registration in [main.tsx](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/main.tsx) is automatically skipped on Electron (`app://` / `window.puzzleverseDesktop?.isDesktop`) while remaining active on web builds.

---

## 3. Desktop Security Configuration

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`
- `webviewTag: false`, `allowRunningInsecureContent: false`
- `devTools: !app.isPackaged` (DevTools and DevTools shortcuts disabled in packaged production executables)
- **Strict Content Security Policy (CSP):** Applied on `app://puzzleverse/*` responses (`script-src 'self' app://puzzleverse`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`) permitting only Firebase Auth, Firestore, Google Fonts, and GitHub Releases HTTPS endpoints.
- **Origin & URL Allowlisting:** Every IPC handler validates `event.senderFrame.url`, `will-navigate` prevents leaving `app://puzzleverse/`, and `openExternal` only permits explicitly allowlisted `https://` URLs.
- **Zero Embedded Server Secrets:** No Firebase Admin SDK credentials, service account JSON keys, or plain-text passwords are packaged in the desktop build.

---

## 4. Firebase Integration & Online/Offline Behavior

- **Online Mode:** Connects to Firebase project `puzzleverse-e16e4` using the same Email/Password and Google accounts as https://puzzleverse-e16e4.web.app/. Desktop Google sign-in opens the system browser to `/desktop-auth` (on `puzzleverse-e16e4.web.app`) and exchanges the Google OAuth token cleanly back over an ephemeral `127.0.0.1` loopback listener with a 32-byte `state` nonce before calling `signInWithCredential`.
- **Offline Mode & Limitations:** Users can launch offline and click **Play Offline (Guest Practice)**. All 16 puzzles launch locally, procedural puzzle generators create fresh solvable sessions offline, and local stats persist in `localStorage`. Offline/guest scores are kept strictly separate (`guest_offline_*` / `puzzleverse_offline_practice_v1`) and **cannot** be submitted to global leaderboards or Daily Puzzle cloud streaks. Online tabs (`Leaderboards`, `Friends`, `Clubs`, `Challenges`) display clear offline notices with a **Retry Connection** button.

---

## 5. Troubleshooting

- **Windows SmartScreen prompt appears:** Because `v1.0.0` is unsigned, Windows Defender SmartScreen displays "Windows protected your PC". Verify the SHA-256 hash matches `SHA256SUMS.txt` / `/download`, then select **More info → Run anyway**.
- **Google Sign-In does not return to Desktop:** Ensure your default browser completes sign-in on `https://puzzleverse-e16e4.web.app/desktop-auth` within 3 minutes and localhost firewall rules do not block `127.0.0.1` loopback connections.
- **Offline mode shows stale leaderboard:** Leaderboard and cloud features require active internet; click **Retry Connection** in Settings or the top header bar once reconnected.
