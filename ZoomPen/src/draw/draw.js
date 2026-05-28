(() => {
  const bgCanvas = document.getElementById('bg-canvas');
  const drawCanvas = document.getElementById('draw-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  const drawCtx = drawCanvas.getContext('2d');

  let img = null;
  let tool = 'pen'; // pen | line | rect | ellipse | arrow | eraser | text
  let penColor = '#ff4444';
  let penWidth = 4;
  let isDrawing = false;
  let startX = 0;
  let startY = 0;

  const shapes = []; // completed shapes
  let dpr = 1;

  // Active keyboard modifier states
  const activeModifiers = { shift: false, ctrl: false, tab: false };
  let currentBgMode = 'screenshot'; // screenshot | white | black
  let activeTextarea = null;
  let nextTextAlign = 'left';

  // ─── Init ────────────────────────────────
  window.zoompen.onScreenData((dataUrl) => {
    img = new Image();
    img.onload = () => {
      dpr = window.devicePixelRatio || 1;
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      bgCanvas.width = drawCanvas.width = cw * dpr;
      bgCanvas.height = drawCanvas.height = ch * dpr;
      bgCanvas.style.width = drawCanvas.style.width = cw + 'px';
      bgCanvas.style.height = drawCanvas.style.height = ch + 'px';

      bgCtx.scale(dpr, dpr);
      drawCtx.scale(dpr, dpr);

      updateBackground();
    };
    img.src = dataUrl;
  });

  // ─── Background Management ───────────────
  function updateBackground() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    bgCtx.clearRect(0, 0, cw, ch);
    if (currentBgMode === 'screenshot') {
      if (img) bgCtx.drawImage(img, 0, 0, cw, ch);
    } else if (currentBgMode === 'white') {
      bgCtx.fillStyle = '#ffffff';
      bgCtx.fillRect(0, 0, cw, ch);
    } else if (currentBgMode === 'black') {
      bgCtx.fillStyle = '#000000';
      bgCtx.fillRect(0, 0, cw, ch);
    }
  }

  // ─── Drawing Helpers ─────────────────────

  function drawShape(ctx, shape) {
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape.tool) {
      case 'pen':
        if (shape.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.sx, shape.sy);
        ctx.lineTo(shape.ex, shape.ey);
        ctx.stroke();
        break;

      case 'rect':
        ctx.beginPath();
        ctx.strokeRect(shape.sx, shape.sy, shape.ex - shape.sx, shape.ey - shape.sy);
        break;

      case 'ellipse': {
        const cx = (shape.sx + shape.ex) / 2;
        const cy = (shape.sy + shape.ey) / 2;
        const rx = Math.abs(shape.ex - shape.sx) / 2;
        const ry = Math.abs(shape.ey - shape.sy) / 2;
        if (rx < 1 || ry < 1) return;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'arrow':
        drawArrow(ctx, shape.sx, shape.sy, shape.ex, shape.ey, shape.width);
        break;

      case 'text':
        ctx.fillStyle = shape.color;
        const fontSize = 16 + shape.width * 3;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.textAlign = shape.align;
        const lines = shape.text.split('\n');
        let currentY = shape.y;
        for (const line of lines) {
          ctx.fillText(line, shape.x, currentY);
          currentY += fontSize * 1.2;
        }
        break;
    }
  }

  function drawArrow(ctx, x1, y1, x2, y2, lineW) {
    const headLen = Math.max(lineW * 4, 14);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  function redraw() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    drawCtx.clearRect(0, 0, cw, ch);
    for (const s of shapes) {
      drawShape(drawCtx, s);
    }
  }

  // ─── Eraser Hit Test Algorithms ──────────

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function pointToEllipseDistance(px, py, sx, sy, ex, ey) {
    const cx = (sx + ex) / 2;
    const cy = (sy + ey) / 2;
    const rx = Math.abs(ex - sx) / 2;
    const ry = Math.abs(ey - sy) / 2;
    if (rx < 1 || ry < 1) return Math.hypot(px - cx, py - cy);
    const angle = Math.atan2(py - cy, px - cx);
    const ellipseX = cx + rx * Math.cos(angle);
    const ellipseY = cy + ry * Math.sin(angle);
    return Math.hypot(px - ellipseX, py - ellipseY);
  }

  function isPointInText(px, py, shape) {
    const fontSize = 16 + shape.width * 3;
    const lines = shape.text.split('\n');
    const heightEst = fontSize * 1.2 * lines.length;
    let maxLen = 0;
    for (const line of lines) {
      maxLen = Math.max(maxLen, line.length);
    }
    const widthEst = maxLen * fontSize * 0.6;
    
    let minX = shape.x;
    let maxX = shape.x + widthEst;
    if (shape.align === 'right') {
      minX = shape.x - widthEst;
      maxX = shape.x;
    }
    return px >= minX && px <= maxX && py >= shape.y && py <= shape.y + heightEst;
  }

  function hitTest(shape, px, py) {
    const threshold = shape.width / 2 + 10;
    
    switch (shape.tool) {
      case 'pen':
        if (shape.points.length < 2) return false;
        for (let i = 0; i < shape.points.length - 1; i++) {
          const d = pointToSegmentDistance(px, py, shape.points[i].x, shape.points[i].y, shape.points[i+1].x, shape.points[i+1].y);
          if (d < threshold) return true;
        }
        return false;
        
      case 'line':
      case 'arrow':
        return pointToSegmentDistance(px, py, shape.sx, shape.sy, shape.ex, shape.ey) < threshold;
        
      case 'rect': {
        const d1 = pointToSegmentDistance(px, py, shape.sx, shape.sy, shape.ex, shape.sy);
        const d2 = pointToSegmentDistance(px, py, shape.ex, shape.sy, shape.ex, shape.ey);
        const d3 = pointToSegmentDistance(px, py, shape.ex, shape.ey, shape.sx, shape.ey);
        const d4 = pointToSegmentDistance(px, py, shape.sx, shape.ey, shape.sx, shape.sy);
        return Math.min(d1, d2, d3, d4) < threshold;
      }
      
      case 'ellipse':
        return pointToEllipseDistance(px, py, shape.sx, shape.sy, shape.ex, shape.ey) < threshold;
        
      case 'text':
        return isPointInText(px, py, shape);
    }
    return false;
  }

  // ─── Text Input Helper ───────────────────
  function commitText() {
    if (!activeTextarea) return;
    const text = activeTextarea.el.value.trim();
    if (text) {
      shapes.push({
        tool: 'text',
        color: activeTextarea.color,
        width: activeTextarea.width,
        x: activeTextarea.x,
        y: activeTextarea.y,
        text: text,
        align: activeTextarea.align
      });
      redraw();
    }
    if (activeTextarea.el.parentNode) {
      document.body.removeChild(activeTextarea.el);
    }
    activeTextarea = null;
    tool = 'pen';
    drawCanvas.style.cursor = 'crosshair';
    // Sync UI active tool
    document.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
    const btn = document.querySelector('[data-tool="pen"]');
    if (btn) btn.classList.add('active');
  }

  // ─── Draw Toolbar Drag ──────────────────

  const dtToolbar = document.getElementById('draw-toolbar');
  const dtDrag = document.getElementById('dt-drag');
  let dtDragging = false;
  let dtOffsetX = 0;
  let dtOffsetY = 0;

  dtDrag.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dtDragging = true;
    const rect = dtToolbar.getBoundingClientRect();
    dtOffsetX = e.clientX - rect.left;
    dtOffsetY = e.clientY - rect.top;
    dtToolbar.style.left = rect.left + 'px';
    dtToolbar.style.top = rect.top + 'px';
    dtToolbar.style.bottom = 'auto';
  });

  // ─── Mouse Interactions ──────────────────
  let activeShape = null;

  drawCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    if (activeTextarea) {
      commitText();
      return;
    }

    startX = e.clientX;
    startY = e.clientY;

    if (tool === 'eraser') {
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (hitTest(shapes[i], startX, startY)) {
          shapes.splice(i, 1);
          redraw();
          break;
        }
      }
      return;
    }

    if (tool === 'text') {
      const textarea = document.createElement('textarea');
      textarea.className = 'canvas-text-input';
      const fontSize = 16 + penWidth * 3;
      textarea.style.position = 'fixed';
      textarea.style.left = startX + 'px';
      textarea.style.top = startY + 'px';
      textarea.style.font = `bold ${fontSize}px sans-serif`;
      textarea.style.color = penColor;
      textarea.style.textAlign = nextTextAlign;
      
      if (nextTextAlign === 'right') {
        textarea.style.transform = 'translateX(-100%)';
      }

      document.body.appendChild(textarea);
      textarea.focus();

      textarea.addEventListener('blur', () => {
        commitText();
      });

      textarea.addEventListener('keydown', (tk) => {
        if (tk.key === 'Escape') {
          if (activeTextarea && activeTextarea.el.parentNode) {
            document.body.removeChild(activeTextarea.el);
          }
          activeTextarea = null;
          tool = 'pen';
          drawCanvas.style.cursor = 'crosshair';
          document.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
          const btn = document.querySelector('[data-tool="pen"]');
          if (btn) btn.classList.add('active');
        } else if (tk.key === 'Enter' && !tk.shiftKey) {
          tk.preventDefault();
          commitText();
        }
      });

      activeTextarea = {
        el: textarea,
        x: startX,
        y: startY,
        align: nextTextAlign,
        color: penColor,
        width: penWidth
      };
      return;
    }

    isDrawing = true;

    let currentTool = tool;
    if (tool === 'pen') {
      if (e.ctrlKey && e.shiftKey) currentTool = 'arrow';
      else if (e.shiftKey) currentTool = 'line';
      else if (e.ctrlKey) currentTool = 'rect';
      else if (activeModifiers.tab) currentTool = 'ellipse';
    }

    activeShape = {
      tool: currentTool,
      color: penColor,
      width: penWidth,
      points: [{ x: startX, y: startY }],
      sx: startX,
      sy: startY,
      ex: startX,
      ey: startY
    };
  });

  window.addEventListener('mousemove', (e) => {
    if (dtDragging) {
      e.preventDefault();
      dtToolbar.style.left = (e.clientX - dtOffsetX) + 'px';
      dtToolbar.style.top = (e.clientY - dtOffsetY) + 'px';
      return;
    }
    if (!isDrawing || !activeShape) return;

    let currentTool = tool;
    if (tool === 'pen') {
      if (e.ctrlKey && e.shiftKey) currentTool = 'arrow';
      else if (e.shiftKey) currentTool = 'line';
      else if (e.ctrlKey) currentTool = 'rect';
      else if (activeModifiers.tab) currentTool = 'ellipse';
    }

    activeShape.tool = currentTool;
    activeShape.color = penColor;
    activeShape.width = penWidth;
    activeShape.ex = e.clientX;
    activeShape.ey = e.clientY;

    if (currentTool === 'pen') {
      activeShape.points.push({ x: e.clientX, y: e.clientY });
    }

    redraw();
    drawShape(drawCtx, activeShape);
  });

  window.addEventListener('mouseup', (e) => {
    if (dtDragging) {
      dtDragging = false;
      return;
    }
    if (!isDrawing || !activeShape) return;
    isDrawing = false;

    let currentTool = tool;
    if (tool === 'pen') {
      if (e.ctrlKey && e.shiftKey) currentTool = 'arrow';
      else if (e.shiftKey) currentTool = 'line';
      else if (e.ctrlKey) currentTool = 'rect';
      else if (activeModifiers.tab) currentTool = 'ellipse';
    }

    activeShape.tool = currentTool;
    activeShape.ex = e.clientX;
    activeShape.ey = e.clientY;

    shapes.push(activeShape);
    activeShape = null;
    redraw();
  });

  // ─── Toolbar Interactions ─────────────────

  // Tool selection
  document.querySelectorAll('[data-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tool = btn.dataset.tool;
      document.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (tool === 'text') {
        drawCanvas.style.cursor = 'text';
      } else if (tool === 'eraser') {
        drawCanvas.style.cursor = 'cell';
      } else {
        drawCanvas.style.cursor = 'crosshair';
      }
    });
  });

  // Color selection
  document.querySelectorAll('[data-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      penColor = btn.dataset.color;
      document.querySelectorAll('[data-color]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Width selection
  document.querySelectorAll('[data-width]').forEach((btn) => {
    btn.addEventListener('click', () => {
      penWidth = parseInt(btn.dataset.width, 10);
      document.querySelectorAll('[data-width]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Undo
  document.getElementById('btn-undo').addEventListener('click', () => {
    shapes.pop();
    redraw();
  });

  // Clear
  document.getElementById('btn-clear').addEventListener('click', () => {
    shapes.length = 0;
    redraw();
  });

  // Width UI Sync Helper
  function updateWidthUI() {
    document.querySelectorAll('[data-width]').forEach((b) => {
      if (parseInt(b.dataset.width, 10) === penWidth) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // ─── Keyboard & Wheel Shortcuts ──────────

  // Brush width adjustment by mouse wheel
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        penWidth = Math.min(50, penWidth + 1);
      } else {
        penWidth = Math.max(1, penWidth - 1);
      }
      updateWidthUI();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (activeTextarea) return;

    if (e.key === 'Escape') {
      window.zoompen.exitMode();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      activeModifiers.tab = true;
      return;
    }

    // Ctrl+Z = undo
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      shapes.pop();
      redraw();
      return;
    }

    // Ctrl+E = clear all
    if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      shapes.length = 0;
      redraw();
      return;
    }

    // Ctrl + Up/Down Arrow = brush width
    if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        penWidth = Math.min(50, penWidth + 1);
      } else {
        penWidth = Math.max(1, penWidth - 1);
      }
      updateWidthUI();
      return;
    }

    // W = Whiteboard, K = Blackboard
    if (!e.ctrlKey) {
      if (e.key === 'w' || e.key === 'W') {
        currentBgMode = (currentBgMode === 'white') ? 'screenshot' : 'white';
        updateBackground();
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        currentBgMode = (currentBgMode === 'black') ? 'screenshot' : 'black';
        updateBackground();
        return;
      }
    }

    // T / Shift+T = Text input mode
    if ((e.key === 't' || e.key === 'T') && !e.ctrlKey) {
      tool = 'text';
      nextTextAlign = e.shiftKey ? 'left' : 'right';
      document.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
      drawCanvas.style.cursor = 'text';
      return;
    }

    // E = Eraser mode
    if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey) {
      tool = 'eraser';
      document.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
      const btn = document.querySelector('[data-tool="eraser"]');
      if (btn) btn.classList.add('active');
      drawCanvas.style.cursor = 'cell';
      return;
    }

    // P = Pen mode
    if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey) {
      tool = 'pen';
      document.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
      const btn = document.querySelector('[data-tool="pen"]');
      if (btn) btn.classList.add('active');
      drawCanvas.style.cursor = 'crosshair';
      return;
    }

    // Colors mapping: R, G, B, Y, O, P
    const colorMap = {
      r: '#ff4444', R: '#ff4444',
      g: '#44ff44', G: '#44ff44',
      b: '#4488ff', B: '#4488ff',
      y: '#ffdd00', Y: '#ffdd00',
      o: '#ff8800', O: '#ff8800',
      p: '#ff44bb', P: '#ff44bb'
    };
    if (colorMap[e.key] && !e.ctrlKey) {
      penColor = colorMap[e.key];
      document.querySelectorAll('[data-color]').forEach((b) => b.classList.remove('active'));
      const btn = document.querySelector(`[data-color="${penColor}"]`);
      if (btn) btn.classList.add('active');
      return;
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Tab') {
      activeModifiers.tab = false;
    }
  });
})();
