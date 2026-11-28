import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OWNER = process.env.GITHUB_OWNER || 'jnsidhant30-creator';
const REPO = process.env.GITHUB_REPO || 'Puzzle';
const MANIFEST_URL =
  process.env.PV_MANIFEST_URL || 'https://puzzleverse-e16e4.web.app/release-manifest.json';

function parseArgs(argv) {
  const opts = {
    verify: argv.includes('--verify'),
    backup: argv.includes('--backup'),
    prune: argv.includes('--prune'),
    downloadBinaries: argv.includes('--download-binaries'),
    binaryTags: [],
    deleteTags: argv.includes('--delete-tags'),
    tag: null,
    backupDir: path.join(os.homedir(), '.puzzleverse-backups', 'releases'),
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tag' && argv[i + 1]) opts.tag = argv[++i];
    if (argv[i] === '--keep' && argv[i + 1]) opts.tag = argv[++i];
    if (argv[i] === '--backup-dir' && argv[i + 1]) opts.backupDir = argv[++i];
    if (argv[i] === '--binary-tags' && argv[i + 1]) {
      opts.binaryTags = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!opts.tag) {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    opts.tag = `v${pkg.version}`;
  }
  return opts;
}

function resolveGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  try {
    const filled = execFileSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
    });
    const m = filled.match(/password=(.+)/);
    if (m) return m[1].trim();
  } catch {
    // Public API calls can still proceed unauthenticated for verification
  }
  return '';
}

async function ghApi(apiPath, token, opts = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PuzzleVerse-ReleaseManager/1.3.0',
    ...(opts.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${apiPath}`, {
    ...opts,
    headers,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return { status: res.status, ok: res.ok, json, text };
}

async function downloadStreamWithHash(url, outFile = null) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const sha256 = crypto.createHash('sha256');
  let bytes = 0;
  if (outFile) fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const ws = outFile ? fs.createWriteStream(outFile) : null;
  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = Buffer.from(value);
    bytes += chunk.length;
    sha256.update(chunk);
    if (ws) ws.write(chunk);
  }
  if (ws) {
    await new Promise((resEnd, rejEnd) => {
      ws.on('finish', resEnd);
      ws.on('error', rejEnd);
      ws.end();
    });
  }
  return { status: res.status, bytes, sha256: sha256.digest('hex').toLowerCase() };
}

async function verifyTargetRelease(tag, token) {
  const relRes = await ghApi(`/releases/tags/${encodeURIComponent(tag)}`, token);
  if (!relRes.ok || !relRes.json) {
    throw new Error(`Release ${tag} not found (HTTP ${relRes.status})`);
  }
  const assets = relRes.json.assets || [];
  const sumsAsset = assets.find((a) => a.name === 'SHA256SUMS.txt');
  const ymlAsset = assets.find((a) => a.name === 'latest.yml');
  if (!sumsAsset || !ymlAsset) {
    throw new Error(`Release ${tag} missing required update metadata (SHA256SUMS.txt / latest.yml)`);
  }

  const sumsText = await (await fetch(sumsAsset.browser_download_url)).text();
  const entries = sumsText
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length >= 2);
  if (entries.length === 0) {
    throw new Error(`SHA256SUMS.txt in ${tag} is empty`);
  }

  const verified = [];
  for (const parts of entries) {
    const expectedHash = parts[0].toLowerCase();
    const fileName = parts[1];
    const expectedSize = parts[2] ? Number(parts[2]) : null;
    const asset = assets.find((a) => a.name === fileName);
    if (!asset) {
      throw new Error(`Missing release asset ${fileName} in ${tag}`);
    }
    const dl = await downloadStreamWithHash(asset.browser_download_url);
    if (dl.sha256 !== expectedHash) {
      throw new Error(`SHA-256 mismatch for ${fileName}: expected ${expectedHash}, got ${dl.sha256}`);
    }
    if (expectedSize && dl.bytes !== expectedSize) {
      throw new Error(`Size mismatch for ${fileName}: expected ${expectedSize}, got ${dl.bytes}`);
    }
    verified.push({ fileName, bytes: dl.bytes, sha256: dl.sha256 });
    console.log(`[VERIFY] ${tag}/${fileName}: ${dl.bytes} B · sha256 OK`);
  }

  const manifestRes = await fetch(`${MANIFEST_URL}?ts=${Date.now()}`);
  if (!manifestRes.ok) {
    throw new Error(`Live manifest ${MANIFEST_URL} returned HTTP ${manifestRes.status}`);
  }
  const manifest = await manifestRes.json();
  if (`v${manifest.version}` !== tag) {
    throw new Error(`Live manifest version v${manifest.version} !== target tag ${tag}`);
  }
  return { release: relRes.json, verified, manifestVersion: manifest.version };
}

async function backupRelease(rel, backupRoot, downloadBinaries) {
  const dir = path.join(backupRoot, rel.tag_name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'release-metadata.json'), JSON.stringify(rel, null, 2) + '\n', 'utf8');
  const backedAssets = [];
  for (const asset of rel.assets || []) {
    const isMeta = /\.(txt|yml|json)$/i.test(asset.name);
    if (isMeta || downloadBinaries) {
      const target = path.join(dir, asset.name);
      const dl = await downloadStreamWithHash(asset.browser_download_url, target);
      backedAssets.push({ name: asset.name, bytes: dl.bytes, sha256: dl.sha256, savedTo: target });
      console.log(`[BACKUP] Saved ${rel.tag_name}/${asset.name} (${dl.bytes} B) -> ${target}`);
    }
  }
  fs.writeFileSync(
    path.join(dir, 'backup-summary.json'),
    JSON.stringify({ backedUpAt: new Date().toISOString(), tag: rel.tag_name, releaseId: rel.id, backedAssets }, null, 2) + '\n',
    'utf8'
  );
  return dir;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const token = resolveGitHubToken();

  if (opts.verify) {
    const res = await verifyTargetRelease(opts.tag, token);
    console.log(JSON.stringify({ verifiedTag: opts.tag, assetCount: res.verified.length, manifestVersion: res.manifestVersion }, null, 2));
  }

  if (opts.backup || opts.prune) {
    if (!token) throw new Error('GitHub token required for backup/prune operations');
    // Mandatory pre-flight verification: never prune old releases unless target release passes full SHA-256 download check
    await verifyTargetRelease(opts.tag, token);

    const listRes = await ghApi('/releases?per_page=50', token);
    if (!listRes.ok || !Array.isArray(listRes.json)) {
      throw new Error(`Failed listing releases: HTTP ${listRes.status}`);
    }

    const older = listRes.json.filter((r) => r.tag_name !== opts.tag && !r.draft);
    const archived = [];
    for (const rel of older) {
      const includeBinaries =
        opts.downloadBinaries || opts.binaryTags.includes(rel.tag_name);
      const dir = await backupRelease(rel, opts.backupDir, includeBinaries);
      archived.push({ tag: rel.tag_name, id: rel.id, backupDir: dir, includeBinaries });
    }

    const deleted = [];
    if (opts.prune) {
      for (const rel of older) {
        const delRes = await ghApi(`/releases/${rel.id}`, token, { method: 'DELETE' });
        if (!delRes.ok) {
          throw new Error(`Failed deleting obsolete release ${rel.tag_name} (${rel.id}): HTTP ${delRes.status}`);
        }
        deleted.push({ tag: rel.tag_name, id: rel.id });
        console.log(`[PRUNE] Removed obsolete public release ${rel.tag_name} (ID ${rel.id}); git tag preserved for history.`);
        if (opts.deleteTags) {
          await ghApi(`/git/refs/tags/${encodeURIComponent(rel.tag_name)}`, token, { method: 'DELETE' });
        }
      }
    }

    console.log(JSON.stringify({ keepTag: opts.tag, archived, deleted }, null, 2));
  }
}

main().catch((err) => {
  console.error('RELEASE_MANAGER_ERROR:', err);
  process.exit(1);
});
