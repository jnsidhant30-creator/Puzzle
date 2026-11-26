# PuzzleVerse Desktop Verification & Test Report (`v1.0.0`)

**Application:** PuzzleVerse (`Challenge Your Mind. Beat Your Best.`)  
**Version:** `1.0.0`  
**Publisher:** Sidhant Jain  
**Verification Date:** 2026-11-26  
**Target Platform:** Windows 10 & Windows 11 (64-bit `x64`)  

---

## 1. Release Artifact Inventory & Checksums

All packaged desktop executables were built with `electron@45.5.0` and `electron-builder@26.18.0` and published to public GitHub Releases (`v1.0.0`).

| File | Exact Byte Size | Display Size | SHA-256 Checksum | Signature Status | Public URL |
|---|---:|---|---|---|----|
| `PuzzleVerse-Setup-1.0.0-x64.exe` | `122,213,038` | `116.55 MB` | `1971025ff689fd22007c0ed3d7fe61c917d99c8f80c7338a6a0471effe68368c` | `NotSigned` (no Authenticode cert installed) | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/PuzzleVerse-Setup-1.0.0-x64.exe |
| `PuzzleVerse-Portable-1.0.0-x64.exe` | `111,269,654` | `106.12 MB` | `55847989047fde9e789e07f49e5ebdcd2507fc7f26c4b07981312be3106a2d2f` | `NotSigned` (no Authenticode cert installed) | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/PuzzleVerse-Portable-1.0.0-x64.exe |
| `latest.yml` | `359` | `359 B` | — | — | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/latest.yml |
| `SHA256SUMS.txt` | `201` | `201 B` | — | — | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/SHA256SUMS.txt |

- Internal packaged web ASAR archive (`resources\app.asar`): `2,035,120` bytes (strictly excluded `!**/node_modules/**/*` via [electron-builder.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron-builder.json)).
- Installed main binary (`PuzzleVerse.exe`): `250,753,024` bytes.

---

## 2. Comprehensive Verification Matrix (All 22 Items)

Every item below reflects directly observed command/script output, visual screenshot inspection, or explicit test boundaries without extrapolation.

| # | Verification Area | Status | Observed Evidence & Exact Test Scope |
|---|---|---|---|
| 1 | Packaged Unpacked Launch (`win-unpacked\PuzzleVerse.exe`) | **PASS** | `node scripts/test-desktop-packaged.mjs unpacked` exited `0`; loaded `app://puzzleverse/index.html`; `0` console/page errors; inspected screenshots `unpacked-01..04`. |
| 2 | NSIS Windows Installer Build (`PuzzleVerse-Setup-1.0.0-x64.exe`) | **PASS** | Built via `electron-builder --win --x64` exit `0`; `122,213,038` B; per-user (`perMachine: false`, `oneClick: false`, `allowElevation: false`). |
| 3 | Silent Install, Shortcuts, Installed Launch & Clean Uninstall | **PASS (local host)** | `PuzzleVerse-Setup-1.0.0-x64.exe /S` exited `0`; verified Desktop & Start Menu shortcuts + `250,753,024`-B EXE; `test-desktop-packaged.mjs installed` exited `0` (`installed-01..04`); `Uninstall PuzzleVerse.exe /S` exited `0` cleanly. |
| 4 | Portable Windows Executable (`PuzzleVerse-Portable-1.0.0-x64.exe`) | **PASS (timing note)** | Built (`111,269,654` B); `test-desktop-packaged.mjs portable` exited `0` with all functional, security, 16-game, and fullscreen checks passing (`portable-01..04`); secondary-launch single-instance check timed out at `8s` during portable wrapper self-extraction (`false`), while unpacked & installed passed (`true`). |
| 5 | Single-Instance Lock & Window Focus | **PASS** | `app.requestSingleInstanceLock()` verified blocking second launch cleanly (`singleInstanceBlocked: true`) on unpacked & installed EXEs. |
| 6 | Electron Security Hardening & Strict CSP | **PASS** | Verified `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`, `devTools: !app.isPackaged`, strict CSP (`script-src 'self' app://puzzleverse`, `frame-src 'none'`), `hasNodeRequire: false`, `hasDesktopBridge: true`, traversal guard on `app://`, HTTPS allowlists. |
| 7 | Window Bounds, Min Size & `F11` / Settings Fullscreen | **PASS** | Default `1440×900` (`minWidth: 960, minHeight: 620`), persistent bounds save/restore, `F11` fullscreen toggle & Settings fullscreen controls verified via `fullscreenChecks` in packaged CDP tests. |
| 8 | Dashboard Desktop Layout, Personal Progress & All 16 Cards | **PASS** | Verified horizontal landscape puzzle cards (`All 16`), Challenge Run card, Personal Progress + Current Global Rank (no embedded leaderboard table), visual parity inspected via `02-dashboard.png`. |
| 9 | All 16 Puzzle Games Render & Playability | **PASS** | Iterated all 16 games inside packaged desktop builds with `0` console/page errors; inspected `Laser Mirror` gameplay UI (`04-laser-mirror.png`). |
| 10 | Procedural Puzzle Generators & Solvability | **PASS** | Implemented deterministic seeded PRNG (`src/utils/prng.ts`); Laser Mirror difficulty-scaled wall blockers + verified beam path; Block Escape 9 BFS-verified Rush Hour boards (`minMoves` `4..16`); Maze Escape recursive-backtracker + BFS shortest path; Sliding Puzzle non-trivial seeded scramble. |
| 11 | Keyboard Controls & Active-Game Close Guard | **PASS** | Verified `Escape` pause modal (`escapePauseWorked: true`), Maze/Arrow-key input (`mazeArrowWorked: true`), and `window.close()` prevention while an active Laser Mirror game is running (`processStillRunningWhenBlockedByActiveGame: true`). |
| 12 | Online Sync vs Offline Guest Practice Guard | **PASS** | `node scripts/test-desktop-extra.mjs` exited `0`: `app://puzzleverse/` Firestore HTTPS read returned `200`; offline Guest mode stored state strictly in localStorage (`puzzleverse_offline_practice_v1`), blocked leaderboard posts, displayed offline notice + working Retry recovery. |
| 13 | Authentication & System-Browser Google OAuth Hand-off | **PARTIAL / CONDITIONAL PASS** | Email/Password + Google login UI verified inside desktop EXE; live `https://puzzleverse-e16e4.web.app/desktop-auth?port=55555&state=...` route rendered with `0` errors (`web-desktop-auth.png`); loopback `127.0.0.1` server implemented in [electron/main.cjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/main.cjs); **live interactive Google OAuth browser consent click and signed-in multi-launch desktop session persistence were `NOT TESTED`**. |
| 14 | Desktop Settings, Sound, Accessibility & Support Controls | **PASS** | Verified Application section (`1.0.0`), fullscreen/window toggles, sound toggle, reduced motion (`html.reduce-motion`), local data clear, Privacy/Terms/About/Report Problem (`03-settings.png`). |
| 15 | Live Auto-Updater / Release Check Flow | **PASS (check flow)** | Live `window.puzzleverseDesktop.checkForUpdates()` inside `win-unpacked\PuzzleVerse.exe` fetched `releases/latest`, returned `status: "up-to-date"`, `latestVersion: "1.0.0"`, `fileSize: 122213038`, exact SHA-256/SHA-512; **downloading/applying a newer `v1.0.1+` release is `NOT TESTED` until a future release is published**. |
| 16 | Public Release Hosting & Anonymous Binary Downloads | **PASS** | Verified all 4 assets on https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.0.0 in `state: uploaded` and HTTP `206` anonymous `Range: bytes=0-15` download responses without credentials. |
| 17 | Public Website `/download` & Login Download Links | **PASS** | Live headless Chrome CDP checks on `https://puzzleverse-e16e4.web.app/download` and `https://puzzzleverse.netlify.app/download` confirmed zero auth wall, `1.0.0`, `116.55 MB` / `106.12 MB`, exact SHA-256 values, SmartScreen notice, FAQ, System Requirements, Play Now CTA, desktop (`1440×900`, `overflowX: false`) & mobile (`390×844`, `mobileOverflowX: false`), `"Download Windows App"` on login, `0` console/page/request errors. |
| 18 | Web Build, PWA Service Worker & Production Regression | **PASS** | `npm run lint` (`tsc --noEmit`) exit `0`; `vite build` exit `0` (`2.40s` on deploy build); Firebase Hosting (`72` files) and Netlify (`71` files) deployed live; `sw.js` (`200`) and `manifest.webmanifest` (`200`) verified on both origins; `firestore.rules` & `functions/` untouched. |
| 19 | Authenticode Code Signing | **NOT SIGNED (DOCUMENTED)** | `Get-AuthenticodeSignature` confirmed `NotSigned` (zero code-signing certs on machine); transparently documented in `/download`, `DESKTOP_RELEASE.md`, GitHub release body, and updater `signed: false` state. |
| 20 | Windows ARM64 Build | **NOT TESTED** | Release targets `win --x64` for standard Windows 10/11 PCs; ARM64 target not built or tested. |
| 21 | Clean-Room Physical/VM Machine (Zero Dev Tools) | **NOT TESTED** | Installer and packaged EXEs passed in isolated `--user-data-dir` profiles and silent per-user Windows install/uninstall on the build workstation; separate non-developer VM/PC not tested. |
| 22 | Credential & Secret Hygiene | **PASS** | Zero GitHub tokens, QA credentials, service-account keys, or private tokens written in source code, release assets, docs, or logs. |

---

## 3. Security & Architecture Audit Summary

- **Privileged File & IPC Isolation:** Renderer runs inside Chromium sandbox (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`) over custom scheme `app://puzzleverse/` mapped strictly to `dist/` with canonical path containment (`startsWith` directory boundary check).
- **Preload Bridge Exposure:** Only explicit typed channels on `window.puzzleverseDesktop` are exposed via `contextBridge` (`electron/preload.cjs`); sender origin verified in main process via `assertTrustedSender(event)`.
- **External Navigation Control:** `setWindowOpenHandler` denies new Electron windows; only allowlisted HTTPS origins and loopback auth handoffs open externally via `shell.openExternal`.
- **Web vs Desktop PWA Coexistence:** Service worker registration is skipped automatically inside `app://puzzleverse/` (Desktop), while `https://puzzleverse-e16e4.web.app/` and `https://puzzzleverse.netlify.app/` continue serving `sw.js` (`200`) and `manifest.webmanifest` (`200`).
