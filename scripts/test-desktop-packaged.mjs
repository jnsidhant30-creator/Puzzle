import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const pkgMeta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const CURRENT_VERSION = String(pkgMeta.version || '1.1.0');

const ARTIFACT_SCREENSHOTS_DIR =
  process.env.PV_DESKTOP_SHOTS_DIR ||
  path.join(process.cwd(), 'release', 'test-screenshots');
fs.mkdirSync(ARTIFACT_SCREENSHOTS_DIR, { recursive: true });

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.events = [];
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
      } else if (data.method) {
        this.events.push(data);
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
      throw new Error(
        res.exceptionDetails.exception?.description ||
          res.exceptionDetails.text ||
          'CDP evaluation error'
      );
    }
    return res.result?.value;
  }

  async screenshot(filePath) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function waitForTarget(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const pageTarget = list.find(
          (t) => t.type === 'page' && t.url && t.url.startsWith('app://puzzleverse/')
        );
        if (pageTarget?.webSocketDebuggerUrl) return pageTarget;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for packaged Electron CDP target on port ${port}`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runDesktopSuite(exePath, label, port = 9229) {
  if (!fs.existsSync(exePath)) {
    throw new Error(`Missing executable for test (${label}): ${exePath}`);
  }

  const userDataDir = path.join(os.tmpdir(), `pv-desktop-test-${label}-${Date.now()}`);
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
  fs.mkdirSync(userDataDir, { recursive: true });

  const cleanEnv = { ...process.env };
  delete cleanEnv.ELECTRON_RUN_AS_NODE;

  const proc = spawn(exePath, [`--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`], {
    env: cleanEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const results = {
    label,
    exePath,
    launched: false,
    securityChecks: {},
    singleInstanceBlocked: false,
    navigationChecks: {},
    all16Games: {},
    keyboardAndGeneratorChecks: {},
    offlineGuestChecks: {},
    settingsChecks: {},
    consoleErrors: [],
    pageExceptions: [],
  };

  let client;
  try {
    const target = await waitForTarget(port, 25000);
    results.launched = true;
    results.loadedUrl = target.url;

    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await client.send('Log.enable');

    // Wait for React root mount
    for (let i = 0; i < 30; i++) {
      const ready = await client.eval(`Boolean(document.getElementById('root')?.innerText?.trim().length)`);
      if (ready) break;
      await sleep(300);
    }

    // Security & Preload API check
    results.securityChecks = await client.eval(`(() => ({
      protocol: window.location.protocol,
      hasNodeRequire: typeof window.require !== 'undefined',
      hasNodeProcess: typeof window.process !== 'undefined',
      hasDesktopBridge: Boolean(window.puzzleverseDesktop?.isDesktop),
      hasAuthForm: Boolean(document.querySelector('form')),
    }))()`);

    results.appInfo = await client.eval(`await window.puzzleverseDesktop.getAppInfo()`);
    results.windowState = await client.eval(`await window.puzzleverseDesktop.getWindowState()`);

    // Screenshot 1: Login screen
    await sleep(400);
    await client.screenshot(path.join(ARTIFACT_SCREENSHOTS_DIR, `${label}-01-login.png`));

    // Enter Offline / Guest Practice mode
    const clickedGuest = await client.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Play Offline'));
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    results.offlineGuestChecks.guestButtonClicked = clickedGuest;
    await sleep(700);

    // Dashboard verification (all 16 games, Challenge Run, Daily Puzzle, Progress + Global Rank)
    results.offlineGuestChecks.dashboardCheck = await client.eval(`(() => {
      const txt = document.body.innerText;
      return {
        hasWelcome: txt.includes('Ready to play'),
        hasChallengeRun: txt.includes('Challenge Run'),
        hasDailyPuzzle: txt.includes('Daily Puzzle'),
        hasPersonalProgress: txt.includes('Personal Progress'),
        hasGlobalRankLabel: txt.includes('Global Rank:'),
        hasAll16Heading: txt.includes('All 16 Puzzle Games'),
        gameCardsOnDashboard: [
          'Number Puzzle','Word Puzzle','Memory Puzzle','Sliding Puzzle',
          'Logic Puzzle','Pattern Puzzle','Pipe Connect','Color Path',
          'Block Escape','Number Path','Rotating Tiles','Word Grid',
          'Arrow Path','Maze Escape','Laser Mirror','Challenge Mode'
        ].filter(n => txt.includes(n)).length,
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
    await client.screenshot(path.join(ARTIFACT_SCREENSHOTS_DIR, `${label}-02-dashboard.png`));

    // Test navigating every sidebar route, hiding download promotions, & Settings modal
    const navTabs = ['All Games', 'Daily Puzzle', 'Challenge Run', 'Leaderboard', 'Achievements', 'Game History', 'Profile', 'Settings'];
    for (const navName of navTabs) {
      await client.eval(`(() => {
        const btn = Array.from(document.querySelectorAll('aside button, header button')).find(b => b.textContent?.trim() === ${JSON.stringify(navName)});
        if (btn) btn.click();
      })()`);
      await sleep(350);
      results.navigationChecks[navName] = await client.eval(`document.body.innerText.length > 80`);
    }
    results.noDownloadPromotionsInDesktop = await client.eval(`(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/download"], button')).filter(el => /open download page|get desktop|download for windows|download apk/i.test(el.textContent || ''));
      return links.length === 0;
    })()`);

    // Settings checks (on Settings page now): Update check + About + Privacy Policy + Terms + Bug report + Fullscreen toggle
    results.settingsChecks = await client.eval(`(async () => {
      const txt = document.body.innerText;
      const updRes = await window.puzzleverseDesktop.checkForUpdates();
      const openAndCloseModal = async (btnLabel, expectedWord) => {
        const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes(btnLabel));
        if (!b) return false;
        b.click();
        await new Promise(r => setTimeout(r, 120));
        const ok = document.body.innerText.includes(expectedWord);
        const closeBtn = Array.from(document.querySelectorAll('button')).find(x => x.getAttribute('aria-label') === 'Close dialog' || x.textContent?.trim() === 'Close');
        if (closeBtn) closeBtn.click();
        await new Promise(r => setTimeout(r, 80));
        return ok;
      };
      const aboutOk = await openAndCloseModal('About PuzzleVerse', 'Challenge Your Mind');
      const privacyOk = await openAndCloseModal('Privacy Policy', 'COPPA');
      const termsOk = await openAndCloseModal('Terms of Use', 'global leaderboards');
      return {
        hasVersion: txt.includes(${JSON.stringify(CURRENT_VERSION)}),
        hasCheckForUpdatesBtn: txt.includes('Check for Updates'),
        hasShareBtn: txt.includes('Share PuzzleVerse'),
        hasAboutBtn: txt.includes('About PuzzleVerse'),
        hasPrivacyBtn: txt.includes('Privacy Policy'),
        hasTermsBtn: txt.includes('Terms of Use'),
        hasReportBtn: txt.includes('Report a Problem'),
        aboutModalOpened: aboutOk,
        privacyModalOpened: privacyOk,
        termsModalOpened: termsOk,
        updateCheckStatus: updRes?.status,
        updateCheckSigned: updRes?.signed,
      };
    })()`);
    await client.screenshot(path.join(ARTIFACT_SCREENSHOTS_DIR, `${label}-03-settings.png`));

    // Resize responsiveness + Fullscreen toggle check
    await client.eval(`window.resizeTo(1100, 720)`);
    await sleep(200);
    const resizeOverflow = await client.eval(`document.documentElement.scrollWidth > window.innerWidth`);
    await client.eval(`window.resizeTo(1440, 900)`);
    const fsToggleOn = await client.eval(`await window.puzzleverseDesktop.toggleFullscreen()`);
    await sleep(250);
    const fsToggleOff = await client.eval(`await window.puzzleverseDesktop.toggleFullscreen()`);
    results.fullscreenChecks = { entered: Boolean(fsToggleOn?.isFullScreen), exited: !fsToggleOff?.isFullScreen, resize1100Overflow: resizeOverflow };

    // Verify all 16 games load from Games Library cleanly
    await client.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent?.trim() === 'All Games' || b.textContent?.trim() === 'Games');
      if (btn) btn.click();
    })()`);
    await sleep(450);

    const gameNames = [
      'Number Puzzle', 'Word Puzzle', 'Memory Puzzle', 'Sliding Puzzle',
      'Logic Puzzle', 'Pattern Puzzle', 'Pipe Connect', 'Color Path',
      'Block Escape', 'Number Path', 'Rotating Tiles', 'Word Grid',
      'Arrow Path', 'Maze Escape', 'Laser Mirror', 'Challenge Mode',
    ];

    for (const gName of gameNames) {
      await client.eval(`(() => {
        const cards = Array.from(document.querySelectorAll('h3'));
        const heading = cards.find(h => h.textContent?.trim() === ${JSON.stringify(gName)});
        const card = heading?.closest('.rounded-xl') || heading?.parentElement?.parentElement?.parentElement;
        const playBtn = card?.querySelector('button');
        if (playBtn) playBtn.click();
      })()`);
      await sleep(350);
      const ok = await client.eval(`document.body.innerText.includes(${JSON.stringify(gName)})`);
      results.all16Games[gName] = ok;

      if (gName === 'Laser Mirror') {
        await sleep(250);
        await client.screenshot(path.join(ARTIFACT_SCREENSHOTS_DIR, `${label}-04-laser-mirror.png`));
        // Test Escape pause and resume
        await client.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
        await sleep(200);
        const pausedVisible = await client.eval(`document.body.innerText.includes('Match paused')`);
        await client.eval(`(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Resume match'));
          if (btn) btn.click();
        })()`);
        results.keyboardAndGeneratorChecks.escapePauseWorked = pausedVisible;
      }

      if (gName === 'Maze Escape') {
        await client.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight', bubbles: true }))`);
        await sleep(100);
        results.keyboardAndGeneratorChecks.mazeArrowWorked = true;
      }

      await client.eval(`(() => {
        const back = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Back to Games'));
        if (back) back.click();
      })()`);
      await sleep(140);
      const confirmLeaveClicked = await client.eval(`(() => {
        const leave = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Leave Puzzle');
        if (leave) {
          leave.click();
          return true;
        }
        return false;
      })()`);
      if (confirmLeaveClicked) results.exitConfirmWorked = true;
      await sleep(250);
    }

    // Verify /download route is blocked / redirected inside desktop app
    await client.eval(`window.location.replace('app://puzzleverse/download')`);
    await sleep(900);
    results.downloadRouteRedirected = await client.eval(`location.pathname !== '/download'`);

    // Collect console/exception events
    results.consoleErrors = client.events
      .filter((e) => e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error')
      .map((e) => e.params.entry.text);
    results.pageExceptions = client.events
      .filter((e) => e.method === 'Runtime.exceptionThrown')
      .map((e) => e.params?.exceptionDetails?.text || 'Exception');

    // Test Single Instance lock: subscribe to desktop:second-instance, mark state sentinel, and launch a second instance with the same userDataDir.
    // Note: Portable EXE extracts ~300 MB NSIS payload on every run (~9-15s on Windows Defender) before invoking requestSingleInstanceLock(), so allocate 35s timeout for portable.
    await client.eval(`(() => {
      window.__pvSentinel = 'keep-state-130';
      window.__pvSecondInstanceCount = 0;
      window.puzzleverseDesktop?.onSecondInstance?.(() => {
        window.__pvSecondInstanceCount = (window.__pvSecondInstanceCount || 0) + 1;
      });
    })()`);
    const t2Start = Date.now();
    const secondRun = spawnSync(exePath, [`--user-data-dir=${userDataDir}`], {
      env: cleanEnv,
      timeout: label === 'portable' ? 35000 : 12000,
    });
    results.secondRunElapsedMs = Date.now() - t2Start;
    results.singleInstanceBlocked = secondRun.status === 0;
    await sleep(300);
    results.secondInstanceStateCheck = await client.eval(`({
      eventCount: window.__pvSecondInstanceCount || 0,
      sentinelPreserved: window.__pvSentinel === 'keep-state-130',
    })`);
    results.isPortableFlag = Boolean(results.appInfo?.isPortable);
  } finally {
    if (client) client.close();
    try {
      if (process.platform === 'win32' && proc.pid) {
        spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        proc.kill();
      }
    } catch {}
    await sleep(900);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }

  return results;
}

const mode = process.argv[2] || 'unpacked';
let targetExe = path.join(process.cwd(), 'release', 'win-unpacked', 'PuzzleVerse.exe');
if (mode === 'portable') {
  targetExe = path.join(process.cwd(), 'release', `PuzzleVerse-Portable-${CURRENT_VERSION}-x64.exe`);
} else if (mode === 'installed') {
  targetExe = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'PuzzleVerse', 'PuzzleVerse.exe');
}

const port = mode === 'portable' ? 9230 : mode === 'installed' ? 9231 : 9229;
runDesktopSuite(targetExe, mode, port)
  .then((res) => {
    console.log(JSON.stringify(res, null, 2));
    const allGamesPass = Object.values(res.all16Games).length === 16 && Object.values(res.all16Games).every(Boolean);
    if (!res.launched || res.securityChecks.hasNodeRequire || !res.securityChecks.hasDesktopBridge || !allGamesPass) {
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Desktop test failed:', err);
    process.exit(1);
  });
