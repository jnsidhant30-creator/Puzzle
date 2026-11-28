const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  net,
  protocol,
  screen,
  session,
  shell,
} = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP_NAME = 'PuzzleVerse';
const APP_TAGLINE = 'Challenge Your Mind. Beat Your Best.';
const PUBLISHER_NAME = 'Sidhant Jain';
const GITHUB_OWNER = 'jnsidhant30-creator';
const GITHUB_REPO = 'Puzzle';
const OFFICIAL_WEB_ORIGIN = 'https://puzzleverse-e16e4.web.app';
const NETLIFY_WEB_ORIGIN = 'https://puzzzleverse.netlify.app';
const DEV_SERVER_URL = 'http://localhost:3000';

const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;
const MIN_WIDTH = 960;
const MIN_HEIGHT = 620;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.setAppUserModelId('com.puzzleverse.desktop');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let mainWindow = null;
let splashWindow = null;
let oauthServer = null;
let forceQuitRequested = false;
let activeGameState = { inActiveGame: false, gameName: '' };
const IS_PORTABLE = Boolean(process.env.PORTABLE_EXECUTABLE_FILE);

function getDistDir() {
  return path.resolve(app.getAppPath(), 'dist');
}

function getWindowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  const fallback = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    isMaximized: false,
    defaultFullscreen: false,
    rememberBounds: true,
  };
  try {
    const raw = fs.readFileSync(getWindowStatePath(), 'utf8');
    const parsed = JSON.parse(raw);
    const merged = {
      ...fallback,
      ...(typeof parsed === 'object' && parsed !== null ? parsed : {}),
    };
    const displays = screen.getAllDisplays();
    const targetDisplay =
      typeof merged.x === 'number' && typeof merged.y === 'number'
        ? screen.getDisplayNearestPoint({ x: merged.x, y: merged.y })
        : screen.getPrimaryDisplay();
    const area = (targetDisplay || displays[0] || screen.getPrimaryDisplay()).workArea;

    const width = Math.max(MIN_WIDTH, Math.min(Number(merged.width) || DEFAULT_WIDTH, area.width));
    const height = Math.max(MIN_HEIGHT, Math.min(Number(merged.height) || DEFAULT_HEIGHT, area.height));
    let x = typeof merged.x === 'number' ? merged.x : undefined;
    let y = typeof merged.y === 'number' ? merged.y : undefined;

    if (typeof x === 'number' && typeof y === 'number') {
      if (x < area.x - 100 || x > area.x + area.width - 120) x = undefined;
      if (y < area.y - 40 || y > area.y + area.height - 120) y = undefined;
    }

    return {
      width,
      height,
      x,
      y,
      isMaximized: Boolean(merged.isMaximized),
      defaultFullscreen: Boolean(merged.defaultFullscreen),
      rememberBounds: merged.rememberBounds !== false,
    };
  } catch {
    const primary = screen.getPrimaryDisplay().workArea;
    return {
      ...fallback,
      width: Math.min(DEFAULT_WIDTH, primary.width),
      height: Math.min(DEFAULT_HEIGHT, primary.height),
    };
  }
}

function saveWindowState(win, prefsOverride = {}) {
  if (!win || win.isDestroyed()) return;
  const current = loadWindowState();
  const rememberBounds =
    prefsOverride.rememberBounds !== undefined
      ? Boolean(prefsOverride.rememberBounds)
      : current.rememberBounds;
  const defaultFullscreen =
    prefsOverride.defaultFullscreen !== undefined
      ? Boolean(prefsOverride.defaultFullscreen)
      : current.defaultFullscreen;

  const isMaximized = win.isMaximized();
  const bounds = isMaximized || win.isFullScreen() ? { width: current.width, height: current.height, x: current.x, y: current.y } : win.getBounds();

  const next = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized,
    defaultFullscreen,
    rememberBounds,
  };

  try {
    fs.mkdirSync(path.dirname(getWindowStatePath()), { recursive: true });
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(next, null, 2));
  } catch {
    // Ignore non-fatal bounds persistence write failure
  }
}

function isTrustedOrigin(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl) return false;
  if (rawUrl.startsWith('app://puzzleverse/')) return true;
  if (!app.isPackaged && rawUrl.startsWith(DEV_SERVER_URL)) return true;
  return false;
}

function assertTrustedSender(event) {
  const frameUrl = event?.senderFrame?.url || event?.sender?.getURL?.() || '';
  if (!isTrustedOrigin(frameUrl)) {
    throw new Error('Untrusted IPC sender blocked');
  }
}

function isApprovedExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname === 'puzzleverse-e16e4.web.app') return true;
    if (parsed.hostname === 'puzzzleverse.netlify.app') return true;
    if (
      parsed.hostname === 'github.com' &&
      parsed.pathname.toLowerCase().startsWith(`/${GITHUB_OWNER.toLowerCase()}/${GITHUB_REPO.toLowerCase()}`)
    ) {
      return true;
    }
    if (parsed.hostname === 'accounts.google.com') return true;
    return false;
  } catch {
    return false;
  }
}

function buildDesktopCsp() {
  const devConnect = !app.isPackaged ? ' http://localhost:* ws://localhost:*' : '';
  const devScript = !app.isPackaged ? " 'unsafe-inline'" : '';
  return [
    "default-src 'self' app://puzzleverse",
    `script-src 'self' app://puzzleverse${devScript}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' app://puzzleverse data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
    `connect-src 'self' app://puzzleverse https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://api.github.com https://github.com https://objects.githubusercontent.com https://release-assets.githubusercontent.com${devConnect}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function setupProtocolAndCsp() {
  const distDir = getDistDir();

  protocol.handle('app', (request) => {
    try {
      const urlObj = new URL(request.url);
      if (urlObj.hostname !== 'puzzleverse') {
        return new Response('Forbidden', { status: 403 });
      }
      let pathname = decodeURIComponent(urlObj.pathname || '/');
      if (pathname === '/' || pathname === '') pathname = '/index.html';
      let targetPath = path.resolve(distDir, '.' + pathname);

      if (targetPath !== distDir && !targetPath.startsWith(distDir + path.sep)) {
        return new Response('Forbidden', { status: 403 });
      }

      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        targetPath = path.join(distDir, 'index.html');
      }
      return net.fetch(pathToFileURL(targetPath).toString());
    } catch {
      return net.fetch(pathToFileURL(path.join(distDir, 'index.html')).toString());
    }
  });

  const csp = buildDesktopCsp();
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isAppUrl =
      details.url.startsWith('app://puzzleverse/') ||
      (!app.isPackaged && details.url.startsWith(DEV_SERVER_URL));
    if (!isAppUrl) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }
    const headers = { ...(details.responseHeaders || {}) };
    headers['Content-Security-Policy'] = [csp];
    callback({ responseHeaders: headers });
  });
}

function setupApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const fsAccelerator = isMac ? 'Ctrl+Command+F' : 'F11';
  const template = [
    ...(isMac
      ? [
          {
            label: APP_NAME,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: isMac ? 'Navigate' : 'PuzzleVerse',
      submenu: [
        {
          label: 'Home',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('desktop:navigate', 'dashboard');
            }
          },
        },
        {
          label: 'Settings',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('desktop:navigate', 'settings');
            }
          },
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: fsAccelerator,
          click: () => toggleFullscreen(),
        },
        ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit', label: 'Exit PuzzleVerse' }]),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: fsAccelerator,
          click: () => toggleFullscreen(),
        },
        ...(!app.isPackaged ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Official Website',
          click: () => shell.openExternal(OFFICIAL_WEB_ORIGIN),
        },
        {
          label: 'Download Page & Release Notes',
          click: () => shell.openExternal(`${OFFICIAL_WEB_ORIGIN}/download`),
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function toggleFullscreen() {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  const next = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(next);
  return next;
}

function createSplashWindow(iconPath) {
  const splash = new BrowserWindow({
    width: 460,
    height: 320,
    frame: false,
    resizable: false,
    movable: true,
    transparent: false,
    backgroundColor: '#142331',
    icon: iconPath,
    show: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: false,
    },
  });
  splash.loadFile(path.join(__dirname, 'splash.html')).catch(() => {});
  return splash;
}

function resolveWindowIcon() {
  if (process.platform === 'win32') {
    const icoPath = path.join(app.getAppPath(), 'build', 'icon.ico');
    if (fs.existsSync(icoPath)) return icoPath;
  }
  const png512 = path.join(app.getAppPath(), 'build', 'icon-512.png');
  if (fs.existsSync(png512)) return png512;
  const pngPath = path.join(app.getAppPath(), 'build', 'icon-256.png');
  if (fs.existsSync(pngPath)) return pngPath;
  return undefined;
}

function createMainWindow() {
  const iconPath = resolveWindowIcon();
  splashWindow = createSplashWindow(iconPath);

  const winState = loadWindowState();
  const useSavedBounds = winState.rememberBounds;

  mainWindow = new BrowserWindow({
    width: useSavedBounds ? winState.width : DEFAULT_WIDTH,
    height: useSavedBounds ? winState.height : DEFAULT_HEIGHT,
    x: useSavedBounds ? winState.x : undefined,
    y: useSavedBounds ? winState.y : undefined,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    backgroundColor: '#142331',
    icon: iconPath,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: !app.isPackaged,
    },
  });

  if (winState.isMaximized && useSavedBounds) {
    mainWindow.maximize();
  }
  if (winState.defaultFullscreen) {
    mainWindow.setFullScreen(true);
  }

  let saveTimer = null;
  const queueSaveBounds = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveWindowState(mainWindow), 250);
  };

  mainWindow.on('resize', queueSaveBounds);
  mainWindow.on('move', queueSaveBounds);
  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('desktop:fullscreen-changed', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('desktop:fullscreen-changed', false);
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      event.preventDefault();
      toggleFullscreen();
    }
    if (
      app.isPackaged &&
      input.type === 'keyDown' &&
      (input.key === 'F12' || (input.control && input.shift && ['I', 'J', 'C'].includes(input.key.toUpperCase())))
    ) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isApprovedExternalUrl(url)) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (!isTrustedOrigin(targetUrl)) {
      event.preventDefault();
      if (isApprovedExternalUrl(targetUrl)) {
        shell.openExternal(targetUrl).catch(() => {});
      }
    }
  });

  mainWindow.on('close', (event) => {
    if (!forceQuitRequested && activeGameState.inActiveGame) {
      event.preventDefault();
      dialog
        .showMessageBox(mainWindow, {
          type: 'question',
          buttons: ['Keep Playing', 'Leave Puzzle & Quit'],
          defaultId: 0,
          cancelId: 0,
          title: 'Puzzle in Progress',
          message: `Exit ${activeGameState.gameName || 'Puzzle'}?`,
          detail: 'You currently have an active puzzle session running. Closing PuzzleVerse now will stop your timer and leave this round unfinished.',
        })
        .then(({ response }) => {
          if (response === 1) {
            forceQuitRequested = true;
            activeGameState.inActiveGame = false;
            saveWindowState(mainWindow);
            mainWindow?.close();
          }
        })
        .catch(() => {});
      return;
    }
    saveWindowState(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.close();
          splashWindow = null;
        }
      }, 120);
    }
    mainWindow?.show();
    mainWindow?.focus();
  });

  const devRequested = !app.isPackaged && process.env.PV_DESKTOP_DEV === '1';
  if (devRequested) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadURL('app://puzzleverse/index.html');
  }
}

function compareSemver(a, b) {
  const clean = (v) =>
    String(v || '0.0.0')
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const pa = clean(a);
  const pb = clean(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

function parseLatestYmlSha256Or512(ymlText) {
  const sha512Match = ymlText.match(/sha512:\s*([A-Za-z0-9+/=]+)/);
  const sha256Match = ymlText.match(/sha256:\s*([a-fA-F0-9]{64})/);
  return {
    sha512: sha512Match ? sha512Match[1] : undefined,
    sha256: sha256Match ? sha256Match[1].toLowerCase() : undefined,
  };
}

function registerIpcHandlers() {
  ipcMain.handle('desktop:get-app-info', (event) => {
    assertTrustedSender(event);
    return {
      name: APP_NAME,
      tagline: APP_TAGLINE,
      version: app.getVersion(),
      publisher: PUBLISHER_NAME,
      isPackaged: app.isPackaged,
      isPortable: IS_PORTABLE,
      platform: process.platform,
      arch: process.arch,
      signed: false,
      downloadPageUrl: `${OFFICIAL_WEB_ORIGIN}/download`,
      releaseRepoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
    };
  });

  ipcMain.handle('desktop:get-window-state', (event) => {
    assertTrustedSender(event);
    const saved = loadWindowState();
    const bounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : saved;
    return {
      isFullScreen: mainWindow ? mainWindow.isFullScreen() : false,
      isMaximized: mainWindow ? mainWindow.isMaximized() : saved.isMaximized,
      width: bounds.width,
      height: bounds.height,
      rememberBounds: saved.rememberBounds,
      defaultFullscreen: saved.defaultFullscreen,
    };
  });

  ipcMain.handle('desktop:toggle-fullscreen', (event) => {
    assertTrustedSender(event);
    return { isFullScreen: toggleFullscreen() };
  });

  ipcMain.handle('desktop:set-window-preferences', (event, prefs) => {
    assertTrustedSender(event);
    if (!prefs || typeof prefs !== 'object') return false;
    saveWindowState(mainWindow, {
      rememberBounds: prefs.rememberBounds !== undefined ? Boolean(prefs.rememberBounds) : undefined,
      defaultFullscreen: prefs.defaultFullscreen !== undefined ? Boolean(prefs.defaultFullscreen) : undefined,
    });
    return true;
  });

  ipcMain.on('desktop:set-active-game-state', (event, payload) => {
    try {
      assertTrustedSender(event);
      activeGameState = {
        inActiveGame: Boolean(payload?.inActiveGame),
        gameName: typeof payload?.gameName === 'string' ? payload.gameName.slice(0, 64) : '',
      };
    } catch {
      // Ignore untrusted sender
    }
  });

  ipcMain.handle('desktop:open-external', async (event, rawUrl) => {
    assertTrustedSender(event);
    if (!isApprovedExternalUrl(rawUrl)) return false;
    await shell.openExternal(rawUrl);
    return true;
  });

  ipcMain.handle('desktop:check-online', (event) => {
    assertTrustedSender(event);
    return net.isOnline();
  });

  ipcMain.handle('desktop:start-google-auth', async (event) => {
    assertTrustedSender(event);

    if (oauthServer) {
      try {
        oauthServer.close();
      } catch {}
      oauthServer = null;
    }

    const expectedState = crypto.randomBytes(24).toString('hex');
    const pkceVerifier = crypto.randomBytes(32).toString('base64url');
    const pkceChallenge = crypto.createHash('sha256').update(pkceVerifier).digest('base64url');

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        if (oauthServer) {
          try {
            oauthServer.close();
          } catch {}
          oauthServer = null;
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
        resolve(result);
      };

      const timeout = setTimeout(() => {
        finish({ ok: false, error: 'Google sign-in timed out after 3 minutes.' });
      }, 180000);

      oauthServer = http.createServer((req, res) => {
        const origin = req.headers.origin;
        const allowedCors = origin === OFFICIAL_WEB_ORIGIN || origin === NETLIFY_WEB_ORIGIN;

        if (allowedCors) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.setHeader('Access-Control-Allow-Private-Network', 'true');
          res.setHeader('Vary', 'Origin, Access-Control-Request-Private-Network');
        }
        res.setHeader('Cache-Control', 'no-store');

        if (req.method === 'OPTIONS') {
          res.writeHead(allowedCors ? 204 : 403);
          res.end();
          return;
        }

        const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
        if (reqUrl.pathname !== '/callback' || req.method !== 'POST') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }

        let bodyBytes = 0;
        const chunks = [];
        req.on('data', (chunk) => {
          bodyBytes += chunk.length;
          if (bodyBytes > 32768) {
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });

        req.on('end', () => {
          const isFormPost = String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded');
          const sendError = (status, msg) => {
            if (isFormPost) {
              res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`<!doctype html><html><body style="font-family:sans-serif;background:#142331;color:#F5F7F8;padding:40px;text-align:center;"><h2>Sign-in could not complete</h2><p>${msg}</p></body></html>`);
            } else {
              res.writeHead(status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: msg }));
            }
          };

          try {
            const rawBody = Buffer.concat(chunks).toString('utf8');
            let payload = {};
            if (isFormPost) {
              const form = new URLSearchParams(rawBody);
              payload = {
                state: form.get('state') || '',
                cc: form.get('cc') || '',
                idToken: form.get('idToken') || '',
                accessToken: form.get('accessToken') || '',
                error: form.get('error') || '',
              };
            } else {
              payload = JSON.parse(rawBody);
            }

            if (!payload || payload.state !== expectedState || payload.cc !== pkceChallenge) {
              sendError(400, 'Invalid OAuth state or PKCE challenge.');
              return;
            }
            if (!payload.idToken && !payload.accessToken) {
              sendError(400, 'Missing OAuth credentials.');
              clearTimeout(timeout);
              finish({ ok: false, error: payload.error || 'No OAuth token returned.' });
              return;
            }

            if (isFormPost) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#142331;color:#F5F7F8;padding:48px;text-align:center;"><h2>Signed in to PuzzleVerse Desktop</h2><p style="color:#A8E5D5;">Authentication complete. You can close this tab and return to PuzzleVerse.</p></body></html>');
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
            }

            clearTimeout(timeout);
            finish({
              ok: true,
              idToken: typeof payload.idToken === 'string' && payload.idToken ? payload.idToken : undefined,
              accessToken: typeof payload.accessToken === 'string' && payload.accessToken ? payload.accessToken : undefined,
            });
          } catch {
            sendError(400, 'Malformed payload.');
          }
        });
      });

      oauthServer.on('error', (err) => {
        clearTimeout(timeout);
        finish({ ok: false, error: err?.message || 'Failed to bind loopback auth server.' });
      });

      oauthServer.listen(0, '127.0.0.1', () => {
        const addr = oauthServer.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        if (!port) {
          clearTimeout(timeout);
          finish({ ok: false, error: 'Loopback port unavailable.' });
          return;
        }
        const authUrl = `${OFFICIAL_WEB_ORIGIN}/desktop-auth?port=${port}&state=${expectedState}&cc=${encodeURIComponent(pkceChallenge)}&ccm=S256`;
        shell.openExternal(authUrl).catch((err) => {
          clearTimeout(timeout);
          finish({ ok: false, error: err?.message || 'Could not open system browser.' });
        });
      });
    });
  });

function selectReleaseAssetsForPlatform(assets) {
  const plat = process.platform;
  const arch = process.arch;
  let primary;
  let ymlName = 'latest.yml';
  let manualOnly = false;
  if (plat === 'win32') {
    ymlName = 'latest.yml';
    if (IS_PORTABLE) {
      manualOnly = true;
      const portableRe = arch === 'arm64' ? /Portable-.*-arm64\.exe$/i : /Portable-.*-x64\.exe$/i;
      primary = assets.find((a) => portableRe.test(a.name)) || assets.find((a) => /Portable-.*\.exe$/i.test(a.name));
    } else {
      const setupRe = arch === 'arm64' ? /Setup-.*-arm64\.exe$/i : /Setup-.*-x64\.exe$/i;
      primary = assets.find((a) => setupRe.test(a.name)) || assets.find((a) => /Setup-.*\.exe$/i.test(a.name));
    }
  } else if (plat === 'darwin') {
    ymlName = 'latest-mac.yml';
    manualOnly = true;
    const dmgRe = arch === 'x64' ? /-x64\.dmg$/i : /-arm64\.dmg$/i;
    primary =
      assets.find((a) => dmgRe.test(a.name)) ||
      assets.find((a) => /-universal\.dmg$/i.test(a.name)) ||
      assets.find((a) => /\.dmg$/i.test(a.name));
  } else if (plat === 'linux') {
    ymlName = 'latest-linux.yml';
    manualOnly = true;
    const appImageRe = arch === 'arm64' ? /-arm64\.AppImage$/i : /-(x86_64|x64)\.AppImage$/i;
    primary = assets.find((a) => appImageRe.test(a.name)) || assets.find((a) => /\.AppImage$/i.test(a.name));
  }
  const ymlAsset = assets.find((a) => a.name.toLowerCase() === ymlName) || assets.find((a) => /^latest\.yml$/i.test(a.name));
  const sumsAsset = assets.find((a) => /SHA256SUMS\.txt$/i.test(a.name));
  return { setupAsset: primary, ymlAsset, sumsAsset, manualOnly };
}

  ipcMain.handle('desktop:check-updates', async (event) => {
    assertTrustedSender(event);
    const currentVersion = app.getVersion();
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await net.fetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': `PuzzleVerse-Desktop/${currentVersion}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 404) {
        return {
          status: 'up-to-date',
          currentVersion,
          latestVersion: currentVersion,
          signed: false,
          isPortable: IS_PORTABLE,
          manualOnly: IS_PORTABLE,
          downloadPageUrl: `${OFFICIAL_WEB_ORIGIN}/download`,
          message: 'No newer published release found yet.',
        };
      }
      if (!res.ok) {
        throw new Error(`Release check returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const latestVersion = String(data.tag_name || data.name || currentVersion).replace(/^v/i, '');
      const assets = Array.isArray(data.assets) ? data.assets : [];
      const { setupAsset, ymlAsset, sumsAsset, manualOnly } = selectReleaseAssetsForPlatform(assets);

      let expectedSha512;
      let expectedSha256;
      if (setupAsset && typeof setupAsset.digest === 'string' && setupAsset.digest.startsWith('sha256:')) {
        expectedSha256 = setupAsset.digest.replace(/^sha256:/i, '').toLowerCase();
      }
      if (!expectedSha512 && !IS_PORTABLE && ymlAsset?.browser_download_url) {
        try {
          const yRes = await net.fetch(ymlAsset.browser_download_url);
          if (yRes.ok) {
            const parsed = parseLatestYmlSha256Or512(await yRes.text());
            expectedSha512 = parsed.sha512;
            if (!expectedSha256 && parsed.sha256) expectedSha256 = parsed.sha256;
          }
        } catch {}
      }
      if (!expectedSha256 && setupAsset && sumsAsset?.browser_download_url) {
        try {
          const sRes = await net.fetch(sumsAsset.browser_download_url);
          if (sRes.ok) {
            const lines = (await sRes.text()).split(/\r?\n/);
            const match = lines.find((l) => l.includes(setupAsset.name));
            const hex = match?.trim().split(/\s+/)[0];
            if (hex && /^[a-f0-9]{64}$/i.test(hex)) expectedSha256 = hex.toLowerCase();
          }
        } catch {}
      }

      const updateAvailable = compareSemver(latestVersion, currentVersion) > 0;
      return {
        status: updateAvailable ? 'available' : 'up-to-date',
        currentVersion,
        latestVersion,
        signed: false,
        isPortable: IS_PORTABLE,
        manualOnly,
        releaseUrl: data.html_url || `${OFFICIAL_WEB_ORIGIN}/download`,
        downloadPageUrl: `${OFFICIAL_WEB_ORIGIN}/download`,
        downloadUrl: setupAsset?.browser_download_url || '',
        fileName: setupAsset?.name || '',
        fileSize: setupAsset?.size || 0,
        expectedSha256,
        expectedSha512,
        releaseNotes: typeof data.body === 'string' ? data.body.slice(0, 1500) : '',
      };
    } catch (err) {
      return {
        status: 'error',
        currentVersion,
        signed: false,
        isPortable: IS_PORTABLE,
        manualOnly: IS_PORTABLE,
        downloadPageUrl: `${OFFICIAL_WEB_ORIGIN}/download`,
        error: err instanceof Error ? err.message : 'Unable to check for updates.',
      };
    }
  });

  ipcMain.handle('desktop:download-update', async (event, releaseInfo) => {
    assertTrustedSender(event);
    try {
      const downloadUrl = String(releaseInfo?.downloadUrl || '');
      const rawName = path.basename(String(releaseInfo?.fileName || 'PuzzleVerse-Setup-latest.exe'));
      if (!downloadUrl.startsWith('https://github.com/') && !downloadUrl.startsWith('https://objects.githubusercontent.com/') && !downloadUrl.startsWith('https://release-assets.githubusercontent.com/')) {
        throw new Error('Untrusted update download host rejected.');
      }
      if (!/\.(exe|dmg|AppImage|deb|rpm)$/i.test(rawName)) {
        throw new Error('Invalid installer filename.');
      }

      const res = await net.fetch(downloadUrl, {
        headers: { 'User-Agent': `PuzzleVerse-Desktop/${app.getVersion()}` },
      });
      if (!res.ok || !res.body) {
        throw new Error(`Download failed with HTTP ${res.status}`);
      }

      const total = Number(res.headers.get('content-length')) || Number(releaseInfo?.fileSize) || 0;
      const destPath = path.join(app.getPath('downloads'), rawName);
      const tempPath = destPath + '.part';
      const out = fs.createWriteStream(tempPath);
      const hash256 = crypto.createHash('sha256');
      const hash512 = crypto.createHash('sha512');
      let transferred = 0;

      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const buf = Buffer.from(value);
        out.write(buf);
        hash256.update(buf);
        hash512.update(buf);
        transferred += buf.length;
        const percent = total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : 0;
        mainWindow?.webContents.send('desktop:update-progress', { percent, transferred, total });
      }
      await new Promise((resEnd, rejEnd) => {
        out.on('finish', resEnd);
        out.on('error', rejEnd);
        out.end();
      });

      const actualSha256 = hash256.digest('hex').toLowerCase();
      const actualSha512 = hash512.digest('base64');

      if (releaseInfo?.expectedSha256 && actualSha256 !== String(releaseInfo.expectedSha256).toLowerCase()) {
        fs.unlinkSync(tempPath);
        throw new Error('Installer SHA-256 checksum mismatch.');
      }
      if (releaseInfo?.expectedSha512 && actualSha512 !== String(releaseInfo.expectedSha512)) {
        fs.unlinkSync(tempPath);
        throw new Error('Installer SHA-512 integrity check mismatch.');
      }

      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      fs.renameSync(tempPath, destPath);

      return {
        status: 'downloaded',
        filePath: destPath,
        sha256: actualSha256,
        verified: Boolean(releaseInfo?.expectedSha256 || releaseInfo?.expectedSha512),
        signed: false,
      };
    } catch (err) {
      return {
        status: 'error',
        error: err instanceof Error ? err.message : 'Download failed.',
      };
    }
  });

  ipcMain.handle('desktop:install-update', async (event, filePath) => {
    assertTrustedSender(event);
    if (activeGameState.inActiveGame) {
      return { ok: false, reason: 'ACTIVE_GAME' };
    }
    const cleanPath = path.resolve(String(filePath || ''));
    const downloadsDir = path.resolve(app.getPath('downloads'));
    if (
      !cleanPath.startsWith(downloadsDir + path.sep) ||
      !/\.(exe|dmg|AppImage|deb|rpm)$/i.test(cleanPath) ||
      !fs.existsSync(cleanPath)
    ) {
      return { ok: false, reason: 'INVALID_PATH' };
    }
    const openErr = await shell.openPath(cleanPath);
    if (openErr) {
      return { ok: false, reason: openErr };
    }
    forceQuitRequested = true;
    setTimeout(() => app.quit(), 300);
    return { ok: true };
  });

  ipcMain.handle('desktop:reveal-downloaded', (event, filePath) => {
    assertTrustedSender(event);
    const cleanPath = path.resolve(String(filePath || ''));
    const downloadsDir = path.resolve(app.getPath('downloads'));
    if (!cleanPath.startsWith(downloadsDir + path.sep) || !fs.existsSync(cleanPath)) {
      return false;
    }
    shell.showItemInFolder(cleanPath);
    return true;
  });

  ipcMain.handle('desktop:quit', async (event) => {
    assertTrustedSender(event);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
      return { ok: true };
    }
    app.quit();
    return { ok: true };
  });
}

app.on('second-instance', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    if (process.platform === 'win32') {
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      app.focus({ steal: true });
      mainWindow.setAlwaysOnTop(false);
    } else {
      mainWindow.focus();
    }
    mainWindow.webContents.send('desktop:second-instance');
  }
});

app.whenReady().then(() => {
  setupProtocolAndCsp();
  setupApplicationMenu();
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  forceQuitRequested = true;
  if (oauthServer) {
    try {
      oauthServer.close();
    } catch {}
    oauthServer = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
