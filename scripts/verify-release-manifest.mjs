import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const manifestPath = path.join(process.cwd(), 'public', 'release-manifest.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error('Missing public/release-manifest.json — run npm run manifest:generate');
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.version !== pkg.version) {
  throw new Error(`Manifest version ${manifest.version} !== package.json ${pkg.version}`);
}
if (!Array.isArray(manifest.packages) || manifest.packages.length < 10) {
  throw new Error('Invalid manifest packages array');
}
for (const entry of manifest.packages) {
  if (!entry.platform || !entry.architecture || !entry.downloadUrl?.startsWith('https://')) {
    throw new Error(`Invalid package entry: ${JSON.stringify(entry)}`);
  }
  if (entry.available && entry.fileSize > 0 && !/^[a-f0-9]{64}$/i.test(entry.sha256)) {
    throw new Error(`Available binary ${entry.id} missing valid 64-char SHA-256: ${entry.sha256}`);
  }
}
console.log(`Verified public/release-manifest.json v${manifest.version} (${manifest.packages.length} entries OK)`);
