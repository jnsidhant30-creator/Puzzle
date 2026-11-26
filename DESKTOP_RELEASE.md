# PuzzleVerse Desktop Release & Update Architecture

**Current Desktop Release:** `v1.0.0` (2026-11-26)  
**GitHub Releases:** https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.0.0  
**Website Download Page:** https://puzzleverse-e16e4.web.app/download  

---

## 1. Release Artifacts (`v1.0.0`)

| Artifact | Byte Size | SHA-256 Checksum | Public URL |
|---|---|---|---|
| `PuzzleVerse-Setup-1.0.0-x64.exe` | `122,213,038` (`116.55 MB`) | `1971025ff689fd22007c0ed3d7fe61c917d99c8f80c7338a6a0471effe68368c` | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/PuzzleVerse-Setup-1.0.0-x64.exe |
| `PuzzleVerse-Portable-1.0.0-x64.exe` | `111,269,654` (`106.12 MB`) | `55847989047fde9e789e07f49e5ebdcd2507fc7f26c4b07981312be3106a2d2f` | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/PuzzleVerse-Portable-1.0.0-x64.exe |
| `latest.yml` | `359` bytes | — | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/latest.yml |
| `SHA256SUMS.txt` | — | — | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.0.0/SHA256SUMS.txt |

---

## 2. Hosting & Website Separation

- Desktop executables (`>100 MB` each) are hosted on public **GitHub Releases** rather than Firebase Hosting, avoiding Hosting asset limits and requiring zero user/developer credentials for public downloads.
- Website deployments (`firebase deploy --only hosting`) update the web app and `/download` page; they **do not** automatically update previously installed desktop executables.

---

## 3. Desktop Application Update Mechanism

1. Users open **Settings → Application → Check for Updates** (inside `PuzzleVerse.exe`).
2. Main process queries `https://api.github.com/repos/jnsidhant30-creator/Puzzle/releases/latest` over HTTPS and compares semver tags against `app.getVersion()`.
3. When a newer version is available:
   - Users can choose **Download** (streaming progress percentage + automatic SHA-256 / SHA-512 hash verification against `latest.yml` / GitHub digest before saving to Downloads), **Open Download Page**, or **Remind Me Later**.
   - Failures display actionable status with a **Retry Update Check** option.
   - **Active Gameplay Guard:** Clicking **Restart & Run Installer** is explicitly blocked while an active puzzle match is running so players never lose an active board mid-game.
   - Because releases are currently unsigned, automatic silent background self-patching without user SmartScreen confirmation is intentionally avoided (`signed: false`).

---

## 4. Windows Code-Signing Status & Upgrade Path

- **Current Status (`v1.0.0`):** **Unsigned** (`NotSigned` confirmed via `Get-AuthenticodeSignature`). No local certificate exists in Windows `CurrentUser\My` or `LocalMachine\My`, and no paid certificate was purchased.
- **Future Signed Release Workflow:** Once an OV/EV Authenticode certificate (or Azure Trusted Signing profile) is provisioned, configure `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD` in CI/build environment, set `verifyUpdateCodeSignature: true` in [electron-builder.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron-builder.json), sign & timestamp with `--tr`, and verify with `signtool verify /pa`.
