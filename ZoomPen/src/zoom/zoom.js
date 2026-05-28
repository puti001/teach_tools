(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const cursorEl = document.getElementById('cursor');
  const hudEl = document.getElementById('zoom-hud');

  let img = null;
  let zoom = 2.0;
  let cursorX = 0;
  let cursorY = 0;
  let mode = 'navigate'; // 'navigate' | 'draw'
  let isMouseDown = false;

  // Drawing states aligned with draw.js
  const shapes = [];
  let activeShape = null;
  let tool = 'pen'; // pen | line | rect | ellipse | arrow | eraser | text
  let penColor = '#ff4444';
  let penWidth = 4;
  let startX = 0;
  let startY = 0;

  // Active keyboard modifier states
  const activeModifiers = { shift: false, ctrl: false, tab: false };
  let currentBgMode = 'screenshot'; // screenshot | white | black
  let activeTextarea = null;
  let nextTextAlign = 'left';

  // Frozen viewport for draw mode
  let frozenSx = 0;
  let frozenSy = 0;
  let frozenVw = 0;
  let frozenVh = 0;

  let hudTimeout = null;

  // ─── Init ────────────────────────────────
  window.zoompen.onScreenData((dataUrl) => {
    img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);

      cursorX = window.innerWidth / 2;
      cursorY = window.innerHeight / 2;
      showHud();
      updateCursorColor();
      render();
    };
    img.src = dataUrl;
  });

  // ─── Viewport calculation ────────────────
  function getViewport() {
    if (mode === 'draw') {
      return { sx: frozenSx, sy: frozenSy, vw: frozenVw, vh: frozenVh };
    }

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    const vw = (img.width / dpr) / zoom;
    const vh = (img.height / dpr) / zoom;

    const normX = cursorX / cw;
    const normY = cursorY / ch;
    let sx = normX * (img.width / dpr) - vw / 2;
    let sy = normY * (img.height / dpr) - vh / 2;

    sx = Math.max(0, Math.min((img.width / dpr) - vw, sx));
    sy = Math.max(0, Math.min((img.height / dpr) - vh, sy));

    return { sx, sy, vw, vh };
  }

  // ─── Render ──────────────────────────────
  function render() {
    if (!img) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const { sx, sy, vw, vh } = getViewport();
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, cw, ch);
    
    if (currentBgMode === 'screenshot') {
      ctx.drawImage(
        img,
        sx * dpr, sy * dpr, vw * dpr, vh * dpr,
        0, 0, cw, ch
      );
    } else if (currentBgMode === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
    } else if (currentBgMode === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cw, ch);
    }

    // Draw completed shapes
    for (const s of shapes) {
      drawShape(ctx, s);
    }

    // Draw active shape preview
    if (activeShape) {
      drawShape(ctx, activeShape);
    }
  }

  // ─── HUD ─────────────────────────────────
  function showHud() {
    hudEl.textContent = zoom.toFixed(1) + 'x';
    hudEl.classList.add('visible');
    clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => hudEl.classList.remove('visible'), 1200);
  }

  // ─── Drawing Helpers Aligned with draw.js ─
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
      render();
    }
    if (activeTextarea.el.parentNode) {
      document.body.removeChild(activeTextarea.el);
    }
    activeTextarea = null;
    tool = 'pen';
    updateCursorColor();
  }

  // ─── Visual feedback for cursor ─────────
  function updateCursorColor() {
    if (mode === 'draw') {
      if (tool === 'eraser') {
        cursorEl.className = '';
        cursorEl.style.background = 'transparent';
        cursorEl.style.border = '2px dashed #ffffff';
        cursorEl.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
        cursorEl.style.width = '14px';
        cursorEl.style.height = '14px';
        cursorEl.style.borderRadius = '50%';
      } else if (tool === 'text') {
        cursorEl.className = '';
        cursorEl.style.background = 'transparent';
        cursorEl.style.border = '1px solid ' + penColor;
        cursorEl.style.borderWidth = '0 1px 0 1px';
        cursorEl.style.width = '3px';
        cursorEl.style.height = '16px';
        cursorEl.style.borderRadius = '0';
        cursorEl.style.boxShadow = 'none';
      } else {
        cursorEl.className = 'cursor-draw';
        cursorEl.style.borderRadius = '50%';
        cursorEl.style.background = penColor;
        cursorEl.style.border = '1px solid #ffffff';
        const dSize = Math.max(6, Math.min(20, penWidth + 2));
        cursorEl.style.width = dSize + 'px';
        cursorEl.style.height = dSize + 'px';
        cursorEl.style.boxShadow = `0 0 6px ${penColor}88`;
      }
    } else {
      cursorEl.className = 'cursor-nav';
      cursorEl.style.background = 'transparent';
      cursorEl.style.border = '2px solid rgba(255,255,255,0.7)';
      cursorEl.style.width = '24px';
      cursorEl.style.height = '24px';
      cursorEl.style.borderRadius = '50%';
      cursorEl.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
    }
  }

  // ─── Mouse events ───────────────────────
  canvas.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursorEl.style.left = cursorX + 'px';
    cursorEl.style.top = cursorY + 'px';

    if (mode === 'navigate') {
      render();
    } else if (isMouseDown && activeShape) {
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
      render();
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    if (mode === 'navigate') {
      const vp = getViewport();
      frozenSx = vp.sx;
      frozenSy = vp.sy;
      frozenVw = vp.vw;
      frozenVh = vp.vh;
      mode = 'draw';
      updateCursorColor();
    }

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
          render();
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
          updateCursorColor();
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

    isMouseDown = true;

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

  canvas.addEventListener('mouseup', (e) => {
    if (!isMouseDown || !activeShape) return;
    isMouseDown = false;

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
    render();
  });

  canvas.addEventListener(
    'wheel',
    (e) => {
      if (mode === 'navigate') {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        zoom = Math.max(1, Math.min(12, zoom + delta));
        showHud();
        render();
      } else if (mode === 'draw' && e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          penWidth = Math.min(50, penWidth + 1);
        } else {
          penWidth = Math.max(1, penWidth - 1);
        }
        updateCursorColor();
      }
    },
    { passive: false }
  );

  // ─── Keyboard Shortcuts ──────────────────
  document.addEventListener('keydown', (e) => {
    if (activeTextarea) return;

    if (e.key === 'Escape') {
      window.zoompen.exitMode();
      return;
    }

    if (mode !== 'draw') return;

    // Tab key tracking
    if (e.key === 'Tab') {
      e.preventDefault();
      activeModifiers.tab = true;
      return;
    }

    // Ctrl+Z = undo last shape
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      shapes.pop();
      render();
      return;
    }

    // Ctrl+E = clear all shapes
    if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      shapes.length = 0;
      render();
      return;
    }

    // Ctrl+ArrowUp/Down = adjust brush size
    if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        penWidth = Math.min(50, penWidth + 1);
      } else {
        penWidth = Math.max(1, penWidth - 1);
      }
      updateCursorColor();
      return;
    }

    // W = Whiteboard, K = Blackboard
    if (!e.ctrlKey) {
      if (e.key === 'w' || e.key === 'W') {
        currentBgMode = (currentBgMode === 'white') ? 'screenshot' : 'white';
        render();
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        currentBgMode = (currentBgMode === 'black') ? 'screenshot' : 'black';
        render();
        return;
      }
    }

    // T / Shift+T = Text input mode
    if ((e.key === 't' || e.key === 'T') && !e.ctrlKey) {
      tool = 'text';
      nextTextAlign = e.shiftKey ? 'left' : 'right';
      updateCursorColor();
      return;
    }

    // E = Eraser mode
    if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey) {
      tool = 'eraser';
      updateCursorColor();
      return;
    }

    // P = Pen mode
    if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey) {
      tool = 'pen';
      updateCursorColor();
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
      updateCursorColor();
      return;
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Tab') {
      activeModifiers.tab = false;
    }
  });
})();
