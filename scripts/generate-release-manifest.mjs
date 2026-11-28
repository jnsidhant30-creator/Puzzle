import fs from 'node:fs';
import path from 'node:path';
import {
  DESKTOP_RELEASE_META,
  RELEASE_DATE,
  RELEASE_DOWNLOAD_BASE,
  RELEASE_TAG_URL,
  RELEASE_VERSION,
  UNIVERSAL_PACKAGES,
} from '../src/data/releaseMeta.ts';

const manifest = {
  schemaVersion: 1,
  appName: DESKTOP_RELEASE_META.appName,
  tagline: DESKTOP_RELEASE_META.tagline,
  version: RELEASE_VERSION,
  releaseDate: RELEASE_DATE,
  releaseTagUrl: RELEASE_TAG_URL,
  downloadBaseUrl: RELEASE_DOWNLOAD_BASE,
  releaseNotes: DESKTOP_RELEASE_META.releaseNotes,
  packages: UNIVERSAL_PACKAGES.map((pkg) => ({
    id: pkg.id,
    version: pkg.version || RELEASE_VERSION,
    releaseDate: RELEASE_DATE,
    platform: pkg.os,
    architecture: pkg.arch,
    format: pkg.format,
    fileName: pkg.fileName,
    downloadUrl: pkg.downloadUrl,
    fileSize: pkg.sizeBytes,
    sizeLabel: pkg.sizeLabel,
    sha256: pkg.sha256,
    minOs: pkg.requirements,
    signed: pkg.signed,
    signingStatus: pkg.signingNote,
    available: pkg.available,
    releaseNotes: DESKTOP_RELEASE_META.releaseNotes,
  })),
};

const outPath = path.join(process.cwd(), 'public', 'release-manifest.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Generated ${outPath} for PuzzleVerse v${RELEASE_VERSION} (${manifest.packages.length} platform entries)`);
