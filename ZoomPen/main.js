const {
  app,
  BrowserWindow,
  globalShortcut,
  desktopCapturer,
  screen,
  ipcMain,
} = require('electron');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

// ─── State ─────────────────────────────────────────────────
let toolbarWin = null;
let modeWin = null;
let currentMode = 'IDLE'; // IDLE | ZOOM | DRAW | LIVEZOOM

// ─── Helpers ───────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function captureScreen() {
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
    fullscreen: true,
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
      globalShortcut.unregister('Ctrl+Up');
    } catch (_) {}
    try {
      globalShortcut.unregister('Ctrl+Down');
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
  globalShortcut.register('Ctrl+Up', () => {
    if (modeWin && !modeWin.isDestroyed())
      modeWin.webContents.send('zoompen:zoom-change', 'in');
  });
  globalShortcut.register('Ctrl+Down', () => {
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

  globalShortcut.register('Ctrl+1', () => {
    currentMode === 'ZOOM' ? exitCurrentMode() : enterZoom();
  });
  globalShortcut.register('Ctrl+2', () => {
    currentMode === 'DRAW' ? exitCurrentMode() : enterDraw();
  });
  globalShortcut.register('Ctrl+4', () => {
    currentMode === 'LIVEZOOM' ? exitCurrentMode() : enterLiveZoom();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
app.on('window-all-closed', () => app.quit());
