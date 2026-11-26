# Changelog

All notable releases of **PuzzleVerse** (Web, PWA, and Windows Desktop) are documented in this file.

## [1.0.0] - 2026-11-26 — Initial Windows Desktop Release & Website Download Portal

### Added
- **Windows Desktop Application (`electron@45.5.0` & `electron-builder@26.18.0`):**
  - Shared single-codebase desktop shell reusing existing React 19 + TypeScript + Vite 8 application without duplicating game logic.
  - Custom `app://puzzleverse/` static protocol serving the compiled production bundle securely from `resources/app.asar/dist` with directory-traversal protection and SPA route fallback.
  - Hardened Electron window & preload security (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, strict CSP, `devTools: !app.isPackaged`, allowlisted HTTPS external navigation, sender origin validation).
  - Ocean Navy frameless startup splash screen ([electron/splash.html](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron/splash.html)), generated multi-resolution Windows icon (`build/icon.ico`, `build/icon.png`, `build/icon-256.png`), and branded NSIS installer bitmaps (`build/installerHeader.bmp`, `build/installerSidebar.bmp`).
  - Persistent window size/position state (`1440×900` default, `960×620` minimum), `F11` fullscreen shortcut, Settings fullscreen controls, single-instance lock, and active-game close confirmation guard.
  - System-browser Google OAuth sign-in flow (`127.0.0.1` temporary loopback listener + `/desktop-auth` web handoff route) alongside email/password sign-in and Offline Guest Practice mode.
  - In-app GitHub Releases update checker & verified installer downloader (**Settings → Application**) with SHA-256/SHA-512 verification and active-gameplay restart protection.
- **Packaged Windows Executables Published (`GitHub Releases v1.0.0`):**
  - `PuzzleVerse-Setup-1.0.0-x64.exe` (`122,213,038` bytes / `116.55 MB`, per-user NSIS wizard, Desktop + Start Menu shortcuts, full uninstaller).
  - `PuzzleVerse-Portable-1.0.0-x64.exe` (`111,269,654` bytes / `106.12 MB`, standalone zero-install EXE).
  - `latest.yml` and `SHA256SUMS.txt` release verification metadata.
- **Public Website Download & Auth Support:**
  - Public `/download` page accessible without authentication across Firebase Hosting (`https://puzzleverse-e16e4.web.app/download`) and Netlify (`https://puzzzleverse.netlify.app/download`) displaying release version, real byte sizes, copyable SHA-256 checksums, SmartScreen unsigned transparency notice, system requirements, FAQs, and Web Play Now CTA.
  - `"Download Windows App"` / `"Download Desktop App"` navigation links on web login/sidebar/bottom-nav/settings views (hidden inside the installed desktop app).
  - Public `/desktop-auth` loopback browser handoff page for Windows desktop Google authentication.
- **Documentation & Test Automation:**
  - Added [DESKTOP_SETUP.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_SETUP.md), [DESKTOP_BUILD.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_BUILD.md), [DESKTOP_RELEASE.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_RELEASE.md), [DESKTOP_TEST_REPORT.md](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/DESKTOP_TEST_REPORT.md), and packaged EXE verification scripts (`scripts/test-desktop-packaged.mjs`, `scripts/test-desktop-extra.mjs`).

### Changed & Improved
- **Dashboard & Personal Stats:** Added Challenge Run highlight, Current Global Rank display in Personal Progress (without embedded leaderboard tables), and all 16 horizontal landscape puzzle cards cleanly ordered for desktop browsing.
- **Puzzle Engines & Generators:** Upgraded `Laser Mirror` (`5×5`/`6×6` wall blockers & verified ray paths), `Block Escape` (9 BFS-verified Rush-Hour boards + arrow sliding), `Maze Escape` (recursive backtracker + BFS shortest path + arrow navigation), `Sliding Puzzle` (seeded non-trivial scramble + arrow controls), `Arrow Path`, `Number Puzzle`, and `Challenge Mode` with deterministic PRNG seeding (`src/utils/prng.ts`) and unified `Escape` pause dispatch.
- **Accessibility & Offline Resilience:** Added `html.reduce-motion` support in [src/index.css](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/src/index.css), offline auth timeout (`1200ms`), offline local practice persistence (`puzzleverse_offline_practice_v1`), global leaderboard write isolation when offline/guest, and Retry recovery banners across community/leaderboard/daily routes.

### Known Limitations
- **Unsigned Executables (`v1.0.0`):** Neither `PuzzleVerse-Setup-1.0.0-x64.exe` nor `PuzzleVerse-Portable-1.0.0-x64.exe` carries an Authenticode code-signing certificate (`NotSigned`); Windows Defender SmartScreen may display an unknown-publisher prompt until an OV/EV or Azure Trusted Signing certificate is attached.
- **x64 Only:** Built and verified for Windows 10/11 64-bit (`x64`); ARM64 builds are not included in `v1.0.0`.
