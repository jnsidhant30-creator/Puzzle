# PuzzleVerse Release & Update Architecture (`v1.1.0`)

**Current Universal Release:** `v1.1.0` (2026-11-27)  
**GitHub Releases:** https://github.com/jnsidhant30-creator/Puzzle/releases/tag/v1.1.0  
**Website Download Portal:** https://puzzleverse-e16e4.web.app/download  

---

## 1. Published Binary Inventory (`v1.1.0`)

All four Windows desktop executables below were built via `electron@45.5.0` & `electron-builder@26.18.0`. Code-signing status is `NotSigned` (zero Authenticode certificates configured locally).

| Artifact | Target Architecture | Exact Byte Size | SHA-256 Checksum | Public URL |
|---|---|---:|---|---|
| `PuzzleVerse-Setup-1.1.0-x64.exe` | Windows x64 (NSIS Setup) | `122,371,946` (`116.70 MB`) | `2e1693be0d64400deebe51c8122d7a6e9b896a811b85ca912aab2ad02722df26` | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/PuzzleVerse-Setup-1.1.0-x64.exe |
| `PuzzleVerse-Portable-1.1.0-x64.exe` | Windows x64 (Portable) | `111,403,405` (`106.24 MB`) | `cea4665264f0bcbdb458d6b37c98291ed04a163144d5931b604a576ce4aed0d1` | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/PuzzleVerse-Portable-1.1.0-x64.exe |
| `PuzzleVerse-Setup-1.1.0-arm64.exe` | Windows ARM64 (NSIS Setup) | `116,363,966` (`110.97 MB`) | `b720781939994c2e60150af9a67b241471887a587404a096caa30906f81a7716` | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/PuzzleVerse-Setup-1.1.0-arm64.exe |
| `PuzzleVerse-Portable-1.1.0-arm64.exe` | Windows ARM64 (Portable) | `106,075,894` (`101.16 MB`) | `821b8fed6557b5599bba09bc244b3dce304ddde696fed2b63cc725e499cd8428` | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/PuzzleVerse-Portable-1.1.0-arm64.exe |
| `latest.yml` | Update manifest | `359` bytes | — | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/latest.yml |
| `SHA256SUMS.txt` | Checksum list | `409` bytes | — | https://github.com/jnsidhant30-creator/Puzzle/releases/download/v1.1.0/SHA256SUMS.txt |

- **macOS (`.dmg`/`.zip`), Linux (`.AppImage`/`.deb`/`.rpm`), Android (`.apk`/`.aab`), & iOS (`.ipa`):** Configured in [electron-builder.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron-builder.json), [android/](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/android/app/build.gradle), [ios/](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/ios/App/App.xcodeproj/project.pbxproj), and [.github/workflows/universal-release.yml](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/.github/workflows/universal-release.yml). Kept disabled (`available: false`) on `/download` until built and uploaded by CI runners / signed environments.

---

## 2. Multi-Platform Update Mechanisms

1. **Desktop (Windows / macOS / Linux via Electron):**
   - **Settings → Application → Check for Updates** queries `https://api.github.com/repos/jnsidhant30-creator/Puzzle/releases/latest` over HTTPS and compares semver against `app.getVersion()`.
   - Matches OS & CPU architecture (`Setup-.*-arm64.exe`, `Setup-.*-x64.exe`, `-arm64.dmg`, `-x64.dmg`, `-universal.dmg`, `-arm64.AppImage`, `-x86_64.AppImage`), verifies SHA-256 & SHA-512 digests against `latest*.yml` / `SHA256SUMS.txt`, and prevents interrupting active gameplay.
2. **Web & ChromeOS PWA:**
   - Deployed via `npm run build` (`vite-plugin-pwa`) + `firebase deploy --only hosting`.
   - Service Worker checks for updated assets on reload or manual **Check for Updates** and shows a non-disruptive **Reload to Update** banner outside active gameplay.
3. **Mobile (Capacitor Android & iOS):**
   - Queries latest release version cleanly via the shared adapter and links users to the updated release / app distribution channel cleanly.

---

## 3. Code-Signing & Store Secrets Checklist (CI Secrets Only)

Never commit certificates or keys to git:
- **Windows:** `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` (Authenticode OV/EV or Azure Trusted Signing), then set `verifyUpdateCodeSignature: true` in [electron-builder.json](file:///c:/Users/jnsid/OneDrive/Documents/Puzzle/electron-builder.json).
- **macOS:** `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.
- **Android:** `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- **iOS:** `IOS_CERT_BASE64`, `IOS_CERT_PASSWORD`, `IOS_PROVISION_BASE64`.
