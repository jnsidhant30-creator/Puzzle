# PuzzleVerse Desktop Build & Packaging Guide

## 1. Prerequisites (Developers Only)

- **Node.js:** v20+ / v24 LTS (`v24.22.3` verified)
- **npm:** v10+ (`11.19.1` verified)
- **OS:** Windows 10 or Windows 11 (x64) for native NSIS & Portable packaging
- **Note on IDE/Electron Terminals:** Subshells launched inside VS Code / Electron-based IDEs may define `ELECTRON_RUN_AS_NODE=1`. Use the repository helper [run-electron.mjs](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/scripts/run-electron.mjs) (wired automatically in `package.json` scripts) so Electron clears that flag before starting.

---

## 2. Package Scripts Reference ([package.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/package.json))

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Start Vite web development server |
| `npm run build` | `vite build` | Build production web bundle into `dist/` |
| `npm run lint` | `tsc --noEmit` | Run strict TypeScript typechecking |
| `npm run desktop:icons` | `node scripts/run-electron.mjs scripts/generate-desktop-assets.cjs` | Render multi-res `build/icon.ico`, PNG icons, and NSIS `.bmp` assets |
| `npm run desktop:dev` | Vite + Electron dev runner | Hot-reload Vite renderer inside Electron |
| `npm run desktop:build` | Build + Icons + `--dir` | Build unpacked executable into `release/win-unpacked/PuzzleVerse.exe` |
| `npm run desktop:dist` | Build + Icons + `nsis` | Build per-user installer `release/PuzzleVerse-Setup-1.0.0-x64.exe` |
| `npm run desktop:portable` | Build + Icons + `portable` | Build standalone `release/PuzzleVerse-Portable-1.0.0-x64.exe` |
| `npm run desktop:all` | Build + Icons + NSIS & Portable | Build both EXEs and `release/latest.yml` in one pass |
| `npm run desktop:test` | `node scripts/test-desktop-packaged.mjs` | Run automated CDP verification against packaged EXEs |

---

## 3. Electron Builder Configuration ([electron-builder.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron-builder.json))

- **Application ID:** `com.puzzleverse.desktop`
- **Product Name:** `PuzzleVerse`
- **Excluded Bloat (`!**/node_modules/**/*` & `npmRebuild: false`):** Since Vite bundles all React, Tailwind, Lucide, Zustand, and Firebase SDK dependencies into `dist/` and Electron's `main.cjs` / `preload.cjs` use only Electron + Node built-ins, `resources/app.asar` contains only `dist/`, `electron/`, `build/icon.ico`, `build/icon-256.png`, and `package.json` (`~1.94 MB` instead of `~185 MB`).
- **NSIS Installer Options:** `perMachine: false`, `oneClick: false`, `allowElevation: false`, `allowToChangeInstallationDirectory: true`, `createDesktopShortcut: true`, `createStartMenuShortcut: true`, `runAfterFinish: true`.

---

## 4. Step-by-Step Build Commands

```powershell
# 1. Install dependencies (if Electron binary was skipped by npm allowScripts, run install.js)
npm install
node node_modules/electron/install.js

# 2. Verify TypeScript
npm run lint

# 3. Generate branding icons and compile Vite + NSIS Installer + Portable EXE
npm run desktop:all

# 4. Generate SHA-256 checksums
Get-FileHash release\PuzzleVerse-Setup-1.0.0-x64.exe, release\PuzzleVerse-Portable-1.0.0-x64.exe -Algorithm SHA256
```

All generated release installers are written to `release/` (gitignored).
