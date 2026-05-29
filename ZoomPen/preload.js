const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zoompen', {
  isMac: process.platform === 'darwin',
  // Invoke (returns Promise)
  captureScreen: () => ipcRenderer.invoke('zoompen:capture-screen'),
  getScreenSourceId: () => ipcRenderer.invoke('zoompen:get-source-id'),
  getCursorPos: () => ipcRenderer.invoke('zoompen:get-cursor-pos'),
  getScreenInfo: () => ipcRenderer.invoke('zoompen:get-screen-info'),

  // Send (fire-and-forget)
  enterMode: (mode) => ipcRenderer.send('zoompen:enter-mode', mode),
  exitMode: () => ipcRenderer.send('zoompen:exit-mode'),
  quit: () => ipcRenderer.send('zoompen:quit'),

  // Listeners (main → renderer)
  onModeChange: (cb) => ipcRenderer.on('zoompen:mode-changed', (_, mode) => cb(mode)),
  onScreenData: (cb) => ipcRenderer.on('zoompen:screen-data', (_, data) => cb(data)),
  onSourceId: (cb) => ipcRenderer.on('zoompen:source-id', (_, id) => cb(id)),
  onZoomChange: (cb) => ipcRenderer.on('zoompen:zoom-change', (_, dir) => cb(dir)),
});
