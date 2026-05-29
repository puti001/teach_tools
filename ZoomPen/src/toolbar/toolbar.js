// ─── Button handlers ───────────────────────
document.getElementById('btn-zoom').addEventListener('click', () => {
  window.zoompen.enterMode('zoom');
});

document.getElementById('btn-draw').addEventListener('click', () => {
  window.zoompen.enterMode('draw');
});

document.getElementById('btn-livezoom').addEventListener('click', () => {
  window.zoompen.enterMode('livezoom');
});

document.getElementById('btn-close').addEventListener('click', () => {
  window.zoompen.quit();
});

// ─── Mode state sync ──────────────────────
const MODE_BTN_MAP = {
  ZOOM: 'btn-zoom',
  DRAW: 'btn-draw',
  LIVEZOOM: 'btn-livezoom',
};

window.zoompen.onModeChange((mode) => {
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  const btnId = MODE_BTN_MAP[mode];
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');
  }
});

// ─── Dynamic shortcut labels for macOS ────
if (window.zoompen.isMac) {
  const btnZoom = document.getElementById('btn-zoom');
  const btnDraw = document.getElementById('btn-draw');
  const btnLiveZoom = document.getElementById('btn-livezoom');
  if (btnZoom) btnZoom.title = '放大 (Cmd+1)';
  if (btnDraw) btnDraw.title = '畫筆 (Cmd+2)';
  if (btnLiveZoom) btnLiveZoom.title = '即時放大 (Cmd+4)';
}
