const {
  app,
  BrowserWindow,
  globalShortcut,
  desktopCapturer,
  screen,
  ipcMain,
  systemPreferences,
  dialog,
} = require('electron');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

// ─── State ─────────────────────────────────────────────────
let toolbarWin = null;
let modeWin = null;
let currentMode = 'IDLE'; // IDLE | ZOOM | DRAW | LIVEZOOM

// ─── Helpers ───────────────────────────────────────────────

const isMac = process.platform === 'darwin';
const shortcutModifier = isMac ? 'Cmd' : 'Ctrl';

const keyZoom = `${shortcutModifier}+1`;
const keyDraw = `${shortcutModifier}+2`;
const keyLiveZoom = `${shortcutModifier}+4`;
const keyZoomIn = `${shortcutModifier}+Up`;
const keyZoomOut = `${shortcutModifier}+Down`;

function checkMacScreenPermission() {
  if (!isMac) return true;
  try {
    const status = systemPreferences.getMediaAccessStatus('screen');
    if (status === 'denied') {
      dialog.showMessageBoxSync({
        type: 'warning',
        title: '需要螢幕錄製權限',
        message: 'ZoomPen 需要螢幕錄製權限才能進行畫面放大與畫筆標記。\n\n請前往「系統設定」->「隱私權與安全性」->「螢幕錄製」，將「Puti-AI Z-Pen」勾選啟用，並重新啟動應用程式。',
        buttons: ['確定']
      });
      return false;
    }
  } catch (e) {
    console.error('Failed to check screen media access status:', e);
  }
  return true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function captureScreen() {
  if (!checkMacScreenPermission()) return null;
  const { size, scaleFactor } = screen.getPrimaryDisplay();
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: Math.floor(size.width * scaleFactor),
      height: Math.floor(size.height * scaleFactor),
    },
  });
  return sources.length > 0 ? sources[0].thumbnail.toDataURL() : null;
}

async function getScreenSourceId() {
  if (!checkMacScreenPermission()) return null;
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.length > 0 ? sources[0].id : null;
}

function createModeWindow(opts = {}) {
  const { size } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: 0,
    y: 0,
    frame: false,
    fullscreen: !isMac,
    enableLargerThanScreen: isMac,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: !!opts.transparent,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  if (isMac) {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  return win;
}

// ─── Toolbar ───────────────────────────────────────────────

function createToolbar() {
  if (toolbarWin) {
    toolbarWin.focus();
    return;
  }

  const { workAreaSize } = screen.getPrimaryDisplay();

  toolbarWin = new BrowserWindow({
    width: 56,
    height: 290,
    x: workAreaSize.width - 76,
    y: Math.floor(workAreaSize.height / 2 - 134),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  toolbarWin.setAlwaysOnTop(true, 'screen-saver');
  if (isMac) {
    toolbarWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  toolbarWin.loadFile(path.join(__dirname, 'src', 'toolbar', 'toolbar.html'));
  toolbarWin.on('closed', () => {
    toolbarWin = null;
  });
}

// ─── Mode Management ──────────────────────────────────────

function notifyToolbar() {
  if (toolbarWin && !toolbarWin.isDestroyed()) {
    toolbarWin.webContents.send('zoompen:mode-changed', currentMode);
  }
}

function exitCurrentMode() {
  if (currentMode === 'IDLE') return;

  const wasLiveZoom = currentMode === 'LIVEZOOM';
  currentMode = 'IDLE';

  // Unregister mode-specific shortcuts
  try {
    globalShortcut.unregister('Escape');
  } catch (_) {}
  if (wasLiveZoom) {
    try {
      globalShortcut.unregister(keyZoomIn);
    } catch (_) {}
    try {
      globalShortcut.unregister(keyZoomOut);
    } catch (_) {}
  }

  if (modeWin && !modeWin.isDestroyed()) {
    modeWin.removeAllListeners('closed');
    modeWin.close();
  }
  modeWin = null;

  if (toolbarWin && !toolbarWin.isDestroyed()) toolbarWin.show();
  notifyToolbar();
}

// ─── Zoom (Ctrl+1) ────────────────────────────────────────

async function enterZoom() {
  if (currentMode !== 'IDLE') exitCurrentMode();
  if (toolbarWin) toolbarWin.hide();
  await sleep(80);

  const screenshot = await captureScreen();
  if (!screenshot) {
    if (toolbarWin) toolbarWin.show();
    return;
  }

  currentMode = 'ZOOM';
  globalShortcut.register('Escape', exitCurrentMode);

  modeWin = createModeWindow();
  modeWin.loadFile(path.join(__dirname, 'src', 'zoom', 'zoom.html'));
  modeWin.webContents.on('did-finish-load', () => {
    if (modeWin && !modeWin.isDestroyed()) {
      modeWin.webContents.send('zoompen:screen-data', screenshot);
    }
  });
  modeWin.on('closed', () => {
    modeWin = null;
    if (currentMode !== 'IDLE') exitCurrentMode();
  });

  notifyToolbar();
}

// ─── Draw (Ctrl+2) ────────────────────────────────────────

async function enterDraw() {
  if (currentMode !== 'IDLE') exitCurrentMode();
  if (toolbarWin) toolbarWin.hide();
  await sleep(80);

  const screenshot = await captureScreen();
  if (!screenshot) {
    if (toolbarWin) toolbarWin.show();
    return;
  }

  currentMode = 'DRAW';
  globalShortcut.register('Escape', exitCurrentMode);

  modeWin = createModeWindow();
  modeWin.loadFile(path.join(__dirname, 'src', 'draw', 'draw.html'));
  modeWin.webContents.on('did-finish-load', () => {
    if (modeWin && !modeWin.isDestroyed()) {
      modeWin.webContents.send('zoompen:screen-data', screenshot);
    }
  });
  modeWin.on('closed', () => {
    modeWin = null;
    if (currentMode !== 'IDLE') exitCurrentMode();
  });

  notifyToolbar();
}

// ─── Live Zoom (Ctrl+4) ──────────────────────────────────

async function enterLiveZoom() {
  if (currentMode !== 'IDLE') exitCurrentMode();

  const sourceId = await getScreenSourceId();
  if (!sourceId) return;

  if (toolbarWin) toolbarWin.hide();
  currentMode = 'LIVEZOOM';

  globalShortcut.register('Escape', exitCurrentMode);
  globalShortcut.register(keyZoomIn, () => {
    if (modeWin && !modeWin.isDestroyed())
      modeWin.webContents.send('zoompen:zoom-change', 'in');
  });
  globalShortcut.register(keyZoomOut, () => {
    if (modeWin && !modeWin.isDestroyed())
      modeWin.webContents.send('zoompen:zoom-change', 'out');
  });

  modeWin = createModeWindow({ transparent: true });
  modeWin.setContentProtection(true); // WDA_EXCLUDEFROMCAPTURE on Win10 2004+
  modeWin.setIgnoreMouseEvents(true, { forward: true });

  modeWin.loadFile(path.join(__dirname, 'src', 'livezoom', 'livezoom.html'));
  modeWin.webContents.on('did-finish-load', () => {
    if (modeWin && !modeWin.isDestroyed()) {
      modeWin.webContents.send('zoompen:source-id', sourceId);
    }
  });
  modeWin.on('closed', () => {
    modeWin = null;
    if (currentMode !== 'IDLE') exitCurrentMode();
  });

  notifyToolbar();
}

// ─── IPC Handlers ─────────────────────────────────────────

ipcMain.handle('zoompen:capture-screen', captureScreen);
ipcMain.handle('zoompen:get-source-id', getScreenSourceId);
ipcMain.handle('zoompen:get-cursor-pos', () => screen.getCursorScreenPoint());
ipcMain.handle('zoompen:get-screen-info', () => {
  const d = screen.getPrimaryDisplay();
  return {
    width: d.size.width,
    height: d.size.height,
    scaleFactor: d.scaleFactor,
  };
});

ipcMain.on('zoompen:enter-mode', (_, mode) => {
  switch (mode) {
    case 'zoom':
      enterZoom();
      break;
    case 'draw':
      enterDraw();
      break;
    case 'livezoom':
      enterLiveZoom();
      break;
  }
});

ipcMain.on('zoompen:exit-mode', () => exitCurrentMode());
ipcMain.on('zoompen:quit', () => app.quit());

// ─── App Lifecycle ────────────────────────────────────────

app.whenReady().then(() => {
  createToolbar();

  globalShortcut.register(keyZoom, () => {
    currentMode === 'ZOOM' ? exitCurrentMode() : enterZoom();
  });
  globalShortcut.register(keyDraw, () => {
    currentMode === 'DRAW' ? exitCurrentMode() : enterDraw();
  });
  globalShortcut.register(keyLiveZoom, () => {
    currentMode === 'LIVEZOOM' ? exitCurrentMode() : enterLiveZoom();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
app.on('window-all-closed', () => app.quit());
