import { soundManager } from './audio.js';

export class CanvasEngine {
  constructor(bgCanvas, drawCanvas, container) {
    this.bgCanvas = bgCanvas;
    this.drawCanvas = drawCanvas;
    this.bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
    this.drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });
    this.container = container;

    // State
    this.tool = 'pen'; // pen, brush, crayon, fill, eraser
    this.color = '#FF3B30';
    this.brushSize = 12;
    this.isDrawing = false;

    // Line smoothing coordinates
    this.points = [];

    // History stack for Undo / Redo
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 20;

    // Background Image/Template
    this.currentBgImage = null;

    // Pre-generate Crayon Pattern
    this.crayonPatternCanvas = this.createCrayonPattern();

    // Event Bindings
    this.initEvents();
  }

  // Generate a procedural noise texture canvas for Crayon brush
  createCrayonPattern() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');

    const imgData = pCtx.createImageData(64, 64);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.floor(Math.random() * 255);
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = Math.random() > 0.4 ? Math.floor(Math.random() * 180) : 0;
    }
    pCtx.putImageData(imgData, 0, 0);
    return pCanvas;
  }

  initEvents() {
    const el = this.drawCanvas;

    el.addEventListener('pointerdown', this.onPointerDown.bind(this));
    el.addEventListener('pointermove', this.onPointerMove.bind(this));
    el.addEventListener('pointerup', this.onPointerUp.bind(this));
    el.addEventListener('pointerleave', this.onPointerUp.bind(this));
    el.addEventListener('pointercancel', this.onPointerUp.bind(this));

    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width - 32));
    const height = Math.max(300, Math.floor(rect.height - 32));

    // Save current drawing state before resize
    let savedDrawData = null;
    if (this.drawCanvas.width > 0 && this.drawCanvas.height > 0) {
      savedDrawData = this.drawCtx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    }

    this.bgCanvas.width = width;
    this.bgCanvas.height = height;
    this.drawCanvas.width = width;
    this.drawCanvas.height = height;

    this.drawCanvas.style.width = `${width}px`;
    this.drawCanvas.style.height = `${height}px`;
    this.bgCanvas.style.width = `${width}px`;
    this.bgCanvas.style.height = `${height}px`;

    // Redraw Background template
    this.renderBackground();

    // Restore user drawings
    if (savedDrawData) {
      this.drawCtx.putImageData(savedDrawData, 0, 0);
    }
  }

  setTemplateImage(imgOrNull) {
    this.currentBgImage = imgOrNull;
    this.renderBackground();
    this.clearDrawingCanvas(false);
  }

  renderBackground() {
    const width = this.bgCanvas.width;
    const height = this.bgCanvas.height;
    this.bgCtx.clearRect(0, 0, width, height);

    // Default white background
    this.bgCtx.fillStyle = '#FFFFFF';
    this.bgCtx.fillRect(0, 0, width, height);

    if (this.currentBgImage) {
      // Draw image in aspect contain mode
      const imgWidth = this.currentBgImage.width;
      const imgHeight = this.currentBgImage.height;

      const scale = Math.min((width * 0.9) / imgWidth, (height * 0.9) / imgHeight);
      const drawW = imgWidth * scale;
      const drawH = imgHeight * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;

      this.bgCtx.drawImage(this.currentBgImage, dx, dy, drawW, drawH);
    }
  }

  saveState() {
    const data = this.drawCtx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    this.undoStack.push(data);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // Clear redo on new action
    this.redoStack = [];
    this.onStateChange();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const currentState = this.drawCtx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    this.redoStack.push(currentState);

    const previousState = this.undoStack.pop();
    this.drawCtx.putImageData(previousState, 0, 0);
    this.onStateChange();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const currentState = this.drawCtx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop();
    this.drawCtx.putImageData(nextState, 0, 0);
    this.onStateChange();
  }

  clearDrawingCanvas(saveUndo = true) {
    if (saveUndo) {
      this.saveState();
    }
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
  }

  onStateChange() {
    // Callback to update UI undo/redo button states
    if (this.onHistoryChange) {
      this.onHistoryChange(this.undoStack.length > 0, this.redoStack.length > 0);
    }
  }

  // Pointer Event Handlers
  getCanvasCoords(e) {
    const rect = this.drawCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onPointerDown(e) {
    e.preventDefault();
    this.drawCanvas.setPointerCapture(e.pointerId);

    const pt = this.getCanvasCoords(e);

    if (this.tool === 'fill') {
      this.saveState();
      this.floodFill(Math.round(pt.x), Math.round(pt.y), this.color);
      soundManager.playPopSound(500);
      return;
    }

    this.isDrawing = true;
    this.saveState();

    this.points = [pt];
    this.drawPoint(pt);
  }

  onPointerMove(e) {
    if (!this.isDrawing) return;
    e.preventDefault();

    const pt = this.getCanvasCoords(e);
    this.points.push(pt);

    soundManager.playDrawSound();

    if (this.tool === 'pen' || this.tool === 'eraser') {
      this.drawSmoothLine();
    } else if (this.tool === 'brush') {
      this.drawWatercolor(pt);
    } else if (this.tool === 'crayon') {
      this.drawCrayonLine(pt);
    }
  }

  onPointerUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.points = [];
  }

  // Brush Implementation: 1. Pen & Eraser
  drawSmoothLine() {
    const ctx = this.drawCtx;
    const len = this.points.length;
    if (len < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = this.brushSize;

    if (this.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.color;
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < len - 1; i++) {
      const xc = (this.points[i].x + this.points[i + 1].x) / 2;
      const yc = (this.points[i].y + this.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
    }

    if (len >= 2) {
      ctx.lineTo(this.points[len - 1].x, this.points[len - 1].y);
    }

    ctx.stroke();
    ctx.restore();
  }

  // Brush Implementation: 2. Watercolor Brush (수채화 붓)
  drawWatercolor(pt) {
    const ctx = this.drawCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    const radius = this.brushSize * 1.2;
    const radgrad = ctx.createRadialGradient(pt.x, pt.y, radius * 0.1, pt.x, pt.y, radius);
    
    // Hex to RGBA
    const rgb = this.hexToRgb(this.color);
    radgrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
    radgrad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
    radgrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

    ctx.fillStyle = radgrad;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Brush Implementation: 3. Crayon (크레파스 거친 질감)
  drawCrayonLine(pt) {
    const ctx = this.drawCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    const radius = this.brushSize * 0.8;
    const numParticles = Math.floor(radius * 3);

    ctx.fillStyle = this.color;

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const px = pt.x + r * Math.cos(angle);
      const py = pt.y + r * Math.sin(angle);

      // Random particle size & alpha for textured effect
      const pSize = 1 + Math.random() * 2.5;
      ctx.globalAlpha = 0.4 + Math.random() * 0.5;

      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawPoint(pt) {
    if (this.tool === 'pen' || this.tool === 'eraser') {
      const ctx = this.drawCtx;
      ctx.save();
      ctx.fillStyle = this.color;
      if (this.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      }
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, this.brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.tool === 'brush') {
      this.drawWatercolor(pt);
    } else if (this.tool === 'crayon') {
      this.drawCrayonLine(pt);
    }
  }

  // Flood Fill Algorithm (페인트통 툴)
  floodFill(startX, startY, fillColorHex) {
    const width = this.drawCanvas.width;
    const height = this.drawCanvas.height;
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    const bgImgData = this.bgCtx.getImageData(0, 0, width, height);
    const drawImgData = this.drawCtx.getImageData(0, 0, width, height);

    const bgData = bgImgData.data;
    const drawData = drawImgData.data;

    const targetColor = this.getPixelColor(drawData, startX, startY, width);
    const fillColor = this.hexToRgb(fillColorHex);

    // Don't fill if same color
    if (
      targetColor.r === fillColor.r &&
      targetColor.g === fillColor.g &&
      targetColor.b === fillColor.b &&
      targetColor.a === 255
    ) {
      return;
    }

    // Stack based non-recursive BFS
    const pixelStack = [[startX, startY]];

    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop();
      let currentY = y;

      // Move up to finding top edge
      while (currentY >= 0 && this.matchColor(drawData, bgData, x, currentY, width, targetColor)) {
        currentY--;
      }
      currentY++;

      let reachLeft = false;
      let reachRight = false;

      while (currentY < height && this.matchColor(drawData, bgData, x, currentY, width, targetColor)) {
        this.setPixelColor(drawData, x, currentY, width, fillColor);

        // Check left neighbor
        if (x > 0) {
          if (this.matchColor(drawData, bgData, x - 1, currentY, width, targetColor)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, currentY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        // Check right neighbor
        if (x < width - 1) {
          if (this.matchColor(drawData, bgData, x + 1, currentY, width, targetColor)) {
            if (!reachRight) {
              pixelStack.push([x + 1, currentY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        currentY++;
      }
    }

    this.drawCtx.putImageData(drawImgData, 0, 0);
  }

  matchColor(drawData, bgData, x, y, width, targetColor) {
    const idx = (y * width + x) * 4;

    // Check background black outline (stop flood fill at thick dark lines)
    const bgR = bgData[idx];
    const bgG = bgData[idx + 1];
    const bgB = bgData[idx + 2];
    const bgLuma = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
    if (bgLuma < 80) { // Black or dark boundary line
      return false;
    }

    // Match drawing layer pixel
    const r = drawData[idx];
    const g = drawData[idx + 1];
    const b = drawData[idx + 2];
    const a = drawData[idx + 3];

    // Tolerance
    const tol = 30;
    return (
      Math.abs(r - targetColor.r) <= tol &&
      Math.abs(g - targetColor.g) <= tol &&
      Math.abs(b - targetColor.b) <= tol &&
      Math.abs(a - targetColor.a) <= tol
    );
  }

  getPixelColor(data, x, y, width) {
    const idx = (y * width + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3]
    };
  }

  setPixelColor(data, x, y, width, rgb) {
    const idx = (y * width + x) * 4;
    data[idx] = rgb.r;
    data[idx + 1] = rgb.g;
    data[idx + 2] = rgb.b;
    data[idx + 3] = 255;
  }

  hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  // Export merged image (Background + Drawing Layer)
  exportImage() {
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = this.bgCanvas.width;
    mergedCanvas.height = this.bgCanvas.height;

    const mCtx = mergedCanvas.getContext('2d');
    // Draw background
    mCtx.drawImage(this.bgCanvas, 0, 0);
    // Draw user artwork on top
    mCtx.drawImage(this.drawCanvas, 0, 0);

    return mergedCanvas.toDataURL('image/png');
  }
}
