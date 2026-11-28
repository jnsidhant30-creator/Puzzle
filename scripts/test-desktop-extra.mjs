import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
  }
  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (msg) => {
      const data = JSON.parse(String(msg.data));
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
        else resolve(data.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { return (${expression}); })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'CDP eval error');
    }
    return res.result?.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

async function waitForTarget(port) {
  const start = Date.now();
  while (Date.now() - start < 20000) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const t = list.find((x) => x.type === 'page' && x.url?.startsWith('app://puzzleverse/'));
        if (t?.webSocketDebuggerUrl) return t;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error('Timeout waiting for Electron target');
}

async function main() {
  const exePath = path.join(process.cwd(), 'release', 'win-unpacked', 'PuzzleVerse.exe');
  const userDataDir = path.join(os.tmpdir(), `pv-extra-${Date.now()}`);
  fs.mkdirSync(userDataDir, { recursive: true });
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const proc = spawn(exePath, ['--remote-debugging-port=9235', `--user-data-dir=${userDataDir}`], { env, stdio: 'ignore' });
  let client;
  try {
    const target = await waitForTarget(9235);
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    for (let i = 0; i < 30; i++) {
      if (await client.eval(`Boolean(document.getElementById('root')?.innerText?.trim())`)) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    // 1. Check online Firestore public leaderboard read from app://puzzleverse origin (no credentials needed for public read rule)
    const onlineFirebaseRead = await client.eval(`(async () => {
      try {
        const res = await fetch('https://firestore.googleapis.com/v1/projects/puzzleverse-e16e4/databases/(default)/documents/leaderboards?pageSize=2');
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    })()`);

    // 2. Enter Guest Practice mode, simulate true browser offline, verify Leaderboard offline UI & Retry recovery
    await client.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Play Offline'));
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    await client.send('Network.emulateNetworkConditions', {
      offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
    });
    await client.eval(`window.dispatchEvent(new Event('offline'))`);
    await new Promise((r) => setTimeout(r, 300));

    // Open Leaderboard while offline
    await client.eval(`(() => {
      const lb = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent?.trim() === 'Leaderboard');
      if (lb) lb.click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    const offlineLeaderboardText = await client.eval(`document.body.innerText`);
    const showsOfflineLbGuard =
      offlineLeaderboardText.includes('Global Leaderboard Requires Internet') &&
      offlineLeaderboardText.includes('Retry Connection');

    // Restore network & verify Retry Connection works
    await client.send('Network.emulateNetworkConditions', {
      offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
    });
    await client.eval(`window.dispatchEvent(new Event('online'))`);
    await new Promise((r) => setTimeout(r, 600));

    const onlineLeaderboardLoaded = await client.eval(`(() => {
      const txt = document.body.innerText;
      return !txt.includes('Global Leaderboard Requires Internet') && (txt.includes('RANK') || txt.includes('Verified Score') || txt.includes('Global Leaderboard'));
    })()`);

    // Verify Reload Recovery (window.location.reload on /leaderboard or /dashboard does NOT produce blank screen!)
    await client.eval(`window.location.reload()`);
    await new Promise((r) => setTimeout(r, 1500));
    const reloadMounted = await client.eval(`Boolean(document.getElementById('root')?.innerText?.trim().length > 20)`);

    console.log(JSON.stringify({
      onlineFirebaseRead,
      showsOfflineLbGuard,
      onlineLeaderboardLoaded,
      reloadMounted,
    }, null, 2));

    if (!onlineFirebaseRead.ok || !showsOfflineLbGuard || !onlineLeaderboardLoaded || !reloadMounted) {
      process.exit(1);
    }
  } finally {
    if (client) client.close();
    if (process.platform === 'win32' && proc.pid) {
      spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
    }
    await new Promise((r) => setTimeout(r, 700));
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
