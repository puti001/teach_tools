(() => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const hudEl = document.getElementById('hud');

  let zoom = 2.0;
  let running = false;
  let screenInfo = null;
  let hudTimeout = null;


  // ─── Init ────────────────────────────────
  window.zoompen.onSourceId(async (sourceId) => {
    const dpr = window.devicePixelRatio || 1;
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.scale(dpr, dpr);

    screenInfo = await window.zoompen.getScreenInfo();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1,
            minHeight: 1,
          },
        },
      });

      video.srcObject = stream;
      await video.play();
      running = true;
      showHud();
      renderLoop();
    } catch (err) {
      console.error('LiveZoom capture failed:', err);
    }
  });

  // ─── Render Loop ─────────────────────────
  async function renderLoop() {
    if (!running) return;

    const pos = await window.zoompen.getCursorPos();
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    // Map cursor to video coordinates
    const vw_video = video.videoWidth;
    const vh_video = video.videoHeight;

    if (vw_video === 0 || vh_video === 0) {
      requestAnimationFrame(renderLoop);
      return;
    }

    // Viewport in video coordinates
    const viewW = vw_video / zoom;
    const viewH = vh_video / zoom;

    // Cursor in video coordinates
    const cx = (pos.x / screenInfo.width) * vw_video;
    const cy = (pos.y / screenInfo.height) * vh_video;

    // Map cursor to viewpoint where cursor aligned with real physical position
    let sx = cx * (1 - 1 / zoom);
    let sy = cy * (1 - 1 / zoom);
    sx = Math.max(0, Math.min(vw_video - viewW, sx));
    sy = Math.max(0, Math.min(vh_video - viewH, sy));

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(video, sx, sy, viewW, viewH, 0, 0, cw, ch);

    requestAnimationFrame(renderLoop);
  }

  // ─── Zoom Change ─────────────────────────
  window.zoompen.onZoomChange((dir) => {
    if (dir === 'in') zoom = Math.min(12, zoom + 0.5);
    else zoom = Math.max(1.0, zoom - 0.5);
    showHud();
  });

  // ─── HUD ─────────────────────────────────
  function showHud() {
    hudEl.textContent = zoom.toFixed(1) + 'x';
    hudEl.classList.add('visible');
    clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => hudEl.classList.remove('visible'), 1500);
  }

  // ─── Cleanup ─────────────────────────────
  window.addEventListener('beforeunload', () => {
    running = false;
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
  });
})();
