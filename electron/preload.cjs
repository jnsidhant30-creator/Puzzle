const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('puzzleverseDesktop', Object.freeze({
  isDesktop: true,
  platform: process.platform,
  arch: process.arch,

  getAppInfo: () => ipcRenderer.invoke('desktop:get-app-info'),
  getWindowState: () => ipcRenderer.invoke('desktop:get-window-state'),
  toggleFullscreen: () => ipcRenderer.invoke('desktop:toggle-fullscreen'),
  setWindowPreferences: (prefs) => ipcRenderer.invoke('desktop:set-window-preferences', prefs),

  onFullscreenChange: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, isFullScreen) => callback(Boolean(isFullScreen));
    ipcRenderer.on('desktop:fullscreen-changed', handler);
    return () => ipcRenderer.removeListener('desktop:fullscreen-changed', handler);
  },

  onNavigate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, tab) => callback(String(tab || 'dashboard'));
    ipcRenderer.on('desktop:navigate', handler);
    return () => ipcRenderer.removeListener('desktop:navigate', handler);
  },

  setActiveGameState: (state) => {
    ipcRenderer.send('desktop:set-active-game-state', {
      inActiveGame: Boolean(state?.inActiveGame),
      gameName: typeof state?.gameName === 'string' ? state.gameName.slice(0, 64) : '',
    });
  },

  startGoogleAuth: () => ipcRenderer.invoke('desktop:start-google-auth'),

  openExternal: (url) => {
    if (typeof url !== 'string') return Promise.resolve(false);
    return ipcRenderer.invoke('desktop:open-external', url);
  },

  checkForUpdates: () => ipcRenderer.invoke('desktop:check-updates'),
  downloadUpdate: (releaseInfo) => ipcRenderer.invoke('desktop:download-update', releaseInfo),
  installUpdateAndRestart: (filePath) => ipcRenderer.invoke('desktop:install-update', filePath),
  revealDownloadedFile: (filePath) => ipcRenderer.invoke('desktop:reveal-downloaded', filePath),
  onSecondInstance: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = () => callback();
    ipcRenderer.on('desktop:second-instance', handler);
    return () => ipcRenderer.removeListener('desktop:second-instance', handler);
  },
  quitApp: () => ipcRenderer.invoke('desktop:quit'),

  onUpdateProgress: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop:update-progress', handler);
    return () => ipcRenderer.removeListener('desktop:update-progress', handler);
  },

  checkOnline: () => ipcRenderer.invoke('desktop:check-online'),
}));
