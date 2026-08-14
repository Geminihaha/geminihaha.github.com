import { CUBE_COLORS } from './cube.js';

const FACE_ORDER = ['U', 'D', 'L', 'R', 'F', 'B'];

// Sticker palette: matches the in-game sticker colors
const PALETTE = [
    { key: 'R', hex: CUBE_COLORS.R, label: '빨강' },
    { key: 'L', hex: CUBE_COLORS.L, label: '주황' },
    { key: 'U', hex: CUBE_COLORS.U, label: '흰색' },
    { key: 'D', hex: CUBE_COLORS.D, label: '노랑' },
    { key: 'F', hex: CUBE_COLORS.F, label: '초록' },
    { key: 'B', hex: CUBE_COLORS.B, label: '파랑' },
];

// How to orient the physical cube when entering each face
const FACE_HINTS = {
    U: '위에서 보기 · 그리드 위쪽 = 큐브 앞면(F)',
    D: '아래에서 보기 · 그리드 위쪽 = 큐브 앞면(F)',
    F: '정면에서 보기 · 그리드 위쪽 = 윗면(U)',
    B: '뒤에서 보기 · 그리드 위쪽 = 윗면(U)',
    R: '오른쪽에서 보기 · 그리드 위쪽 = 윗면(U)',
    L: '왼쪽에서 보기 · 그리드 위쪽 = 윗면(U)',
};

const hexToCss = (hex) => '#' + hex.toString(16).padStart(6, '0');

// Convert RGB (0-1) to HSV
function rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return [h, s, v];
}

/**
 * Semi-automatic cube scanner:
 * shows the camera feed, overlays an NxN sticker grid, and lets the user
 * tap each sticker to assign a color from the palette. Collects all 6 faces
 * and returns a pattern for CubeModel.applyPattern().
 */
export class CubeScanner {
    constructor(size, onStart) {
        this.size = size; // 2 or 3
        this.onStart = onStart; // callback(pattern)
        this.currentFace = 'U';
        this.selectedColor = 'R';
        this.autoDetect = true; // auto-fill sticker colors on capture
        this.capturedCanvas = null; // square-cropped capture for color detection
        this.stream = null;
        this.pattern = {};
        FACE_ORDER.forEach(f => { this.pattern[f] = null; });

        this.el = {
            modal: document.getElementById('scanner-modal'),
            video: document.getElementById('scanner-video'),
            grid: document.getElementById('scanner-grid'),
            hint: document.getElementById('scanner-face-hint'),
            tabs: document.getElementById('scanner-face-tabs'),
            palette: document.getElementById('scanner-palette'),
            startBtn: document.getElementById('btn-scanner-start'),
            captureBtn: document.getElementById('btn-scanner-capture'),
            autoBtn: document.getElementById('btn-scanner-auto'),
            clearBtn: document.getElementById('btn-scanner-clear'),
            status: document.getElementById('scanner-status'),
        };

        this.initEvents();
    }

    initEvents() {
        // Keep handler references so dispose() can remove them later
        this._handlers = {
            onTabClick: (e) => {
                const tab = e.target.closest('.face-tab');
                if (!tab) return;
                this.setFace(tab.dataset.face);
            },
            onPaletteClick: (e) => {
                const swatch = e.target.closest('.palette-swatch');
                if (!swatch) return;
                if (swatch.dataset.key === '__clear') {
                    this.selectedColor = null;
                } else {
                    this.selectedColor = swatch.dataset.key;
                }
                this.updatePaletteSelection();
            },
            onGridClick: (e) => {
                const cell = e.target.closest('.scanner-cell');
                if (!cell) return;
                if (this.selectedColor) {
                    cell.dataset.key = this.selectedColor;
                    cell.style.background = this.colorCss(this.selectedColor);
                    this.updatePatternCell(cell);
                } else {
                    // eraser selected: clear the cell
                    delete cell.dataset.key;
                    cell.style.background = '';
                    this.updatePatternCell(cell);
                }
                this.updateStatus();
            },
            onCapture: () => this.captureFrame(),
            onAuto: () => {
                this.autoDetect = !this.autoDetect;
                this.updateAutoUI();
            },
            onClear: () => this.clearCurrentFace(),
            onStart: () => this.finish(),
            onClose: () => this.close(),
            onOverlayClick: (e) => {
                if (e.target.id === 'scanner-modal') this.close();
            },
        };

        this.el.tabs.addEventListener('click', this._handlers.onTabClick);
        this.el.palette.addEventListener('click', this._handlers.onPaletteClick);
        this.el.grid.addEventListener('click', this._handlers.onGridClick);
        this.el.captureBtn.addEventListener('click', this._handlers.onCapture);
        this.el.autoBtn.addEventListener('click', this._handlers.onAuto);
        this.el.clearBtn.addEventListener('click', this._handlers.onClear);
        this.el.startBtn.addEventListener('click', this._handlers.onStart);
        document.getElementById('btn-scanner-close').addEventListener('click', this._handlers.onClose);
        document.getElementById('scanner-modal').addEventListener('click', this._handlers.onOverlayClick);
    }

    // Detach all event listeners and stop the camera.
    // MUST be called before creating a new scanner, otherwise stale
    // instances keep reacting to the same DOM events and overwrite the
    // pattern/grid with their own empty state.
    dispose() {
        this.close();
        if (this._handlers) {
            this.el.tabs.removeEventListener('click', this._handlers.onTabClick);
            this.el.palette.removeEventListener('click', this._handlers.onPaletteClick);
            this.el.grid.removeEventListener('click', this._handlers.onGridClick);
            this.el.captureBtn.removeEventListener('click', this._handlers.onCapture);
            this.el.autoBtn.removeEventListener('click', this._handlers.onAuto);
            this.el.clearBtn.removeEventListener('click', this._handlers.onClear);
            this.el.startBtn.removeEventListener('click', this._handlers.onStart);
            document.getElementById('btn-scanner-close').removeEventListener('click', this._handlers.onClose);
            document.getElementById('scanner-modal').removeEventListener('click', this._handlers.onOverlayClick);
            this._handlers = null;
        }
    }

    colorCss(key) {
        if (!key) return '';
        const p = PALETTE.find(c => c.key === key);
        return p ? '#' + p.hex.toString(16).padStart(6, '0') : '';
    }

    async open() {
        this.el.modal.classList.add('active');
        this.buildGrid();
        this.buildPalette();
        this.setFace('U');
        this.updateStatus();
        this.updateAutoUI();

        // Start the rear camera (best-effort; manual entry still works without it)
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            this.el.video.srcObject = this.stream;
            await this.el.video.play();
            this.el.video.classList.add('has-stream');
        } catch (err) {
            console.warn('[Scanner] Camera unavailable, manual entry only:', err);
        }
    }

    close() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        this.el.video.srcObject = null;
        this.el.video.classList.remove('has-stream');
        this.el.modal.classList.remove('active');
        this.clearCapture();
    }

    setFace(face) {
        this.currentFace = face;
        this.el.hint.textContent = FACE_HINTS[face] || '';
        this.el.tabs.querySelectorAll('.face-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.face === face)
        );
        // A captured frame belongs to the previously selected face - clear it
        // so the live camera feed is visible for the new face.
        this.clearCapture();
        this.renderGrid();
    }

    // Build the NxN sticker cells for the current face
    buildGrid() {
        const n = this.size;
        this.el.grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        this.el.grid.style.gridTemplateRows = `repeat(${n}, 1fr)`;
        this.renderGrid();
    }

    // Ensure the given face has a complete NxN pattern array and return it
    ensureFacePattern(face) {
        const n = this.size;
        if (!this.pattern[face]) {
            this.pattern[face] = Array.from({ length: n }, () => Array(n).fill(null));
        }
        return this.pattern[face];
    }

    renderGrid() {
        const n = this.size;
        const face = this.currentFace;
        const pattern = this.ensureFacePattern(face);
        const cells = [];

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'scanner-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                const key = pattern[r][c];
                if (key) {
                    cell.dataset.key = key;
                    cell.style.background = this.colorCss(key);
                }
                cells.push(cell);
            }
        }
        this.el.grid.replaceChildren(...cells);
    }

    updatePatternCell(cell) {
        const n = this.size;
        const r = parseInt(cell.dataset.row, 10);
        const c = parseInt(cell.dataset.col, 10);
        const pattern = this.ensureFacePattern(this.currentFace);
        pattern[r][c] = cell.dataset.key || null;
    }

    clearCurrentFace() {
        if (this.pattern[this.currentFace]) {
            const n = this.size;
            this.pattern[this.currentFace] = Array.from({ length: n }, () => Array(n).fill(null));
        }
        this.renderGrid();
        this.updateStatus();
    }

    // Capture the current camera frame as a reference behind the grid,
    // or go back to the live camera feed if a capture is already shown.
    captureFrame() {
        const video = this.el.video;
        const grid = this.el.grid;

        // Already showing a captured frame -> return to live view
        if (grid.classList.contains('has-capture')) {
            this.clearCapture();
            return;
        }

        if (!video.videoWidth) {
            // No camera frame available yet; still allow entering capture mode
            grid.classList.add('has-capture');
            grid.style.backgroundImage = '';
            this.updateCaptureUI();
            return;
        }

        // Square center-crop of the frame so it maps 1:1 onto the square grid
        const vw = video.videoWidth, vh = video.videoHeight;
        const size = Math.min(vw, vh);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, (vw - size) / 2, (vh - size) / 2, size, size, 0, 0, size, size);

        this.capturedCanvas = canvas;
        grid.style.backgroundImage = `url(${canvas.toDataURL('image/jpeg', 0.85)})`;
        grid.classList.add('has-capture');
        this.updateCaptureUI();

        // Auto-fill sticker colors if the toggle is on
        if (this.autoDetect) {
            this.detectColors();
        }
    }

    // Drop the captured frame and show the live camera feed again
    clearCapture() {
        const grid = this.el.grid;
        grid.style.backgroundImage = '';
        grid.classList.remove('has-capture');
        this.capturedCanvas = null;
        this.updateCaptureUI();
    }

    updateCaptureUI() {
        const captured = this.el.grid.classList.contains('has-capture');
        this.el.captureBtn.innerHTML = captured ? '🔄 다시 촬영' : '📷 캡처';
        this.el.captureBtn.classList.toggle('active', captured);
    }

    updateAutoUI() {
        this.el.autoBtn.classList.toggle('active', this.autoDetect);
    }

    // Sample each sticker cell of the captured frame and assign the nearest
    // palette color (HSV-based so it tolerates lighting differences).
    detectColors() {
        if (!this.capturedCanvas) return;
        const n = this.size;
        const ctx = this.capturedCanvas.getContext('2d');
        const cell = this.capturedCanvas.width / n;
        // Sample the inner 45% of each cell to avoid sticker borders
        const pad = cell * 0.275;
        const sample = cell * 0.45;

        const pattern = this.ensureFacePattern(this.currentFace);

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const x = c * cell + pad;
                const y = r * cell + pad;
                const data = ctx.getImageData(x, y, sample, sample).data;
                let R = 0, G = 0, B = 0, cnt = 0;
                for (let i = 0; i < data.length; i += 4) {
                    R += data[i]; G += data[i + 1]; B += data[i + 2]; cnt++;
                }
                R /= cnt; G /= cnt; B /= cnt;

                const key = this.nearestColorKey(R, G, B);
                if (key) pattern[r][c] = key;
            }
        }
        this.renderGrid();
        this.updateStatus();
    }

    nearestColorKey(r, g, b) {
        const [h, s, v] = rgbToHsv(r / 255, g / 255, b / 255);
        // Too dark -> ignore (leave the cell as-is)
        if (v < 0.16) return null;
        // Low saturation: bright -> white (U), otherwise grey -> ignore
        if (s < 0.22) return v > 0.55 ? 'U' : null;

        // Representative hues for the colored stickers (red, orange, yellow, green, blue)
        const hues = { R: 0, L: 28, D: 52, F: 125, B: 215 };
        let best = null, bestD = 1e9;
        for (const [key, hue] of Object.entries(hues)) {
            let d = Math.abs(h - hue);
            if (d > 180) d = 360 - d; // wrap around for red near 0°
            if (d < bestD) { bestD = d; best = key; }
        }
        return bestD < 42 ? best : null;
    }

    buildPalette() {
        const frag = document.createDocumentFragment();
        PALETTE.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'palette-swatch';
            btn.dataset.key = p.key;
            btn.title = p.label;
            btn.style.background = this.colorCss(p.key);
            frag.appendChild(btn);
        });
        // Eraser
        const eraser = document.createElement('button');
        eraser.className = 'palette-swatch palette-eraser';
        eraser.dataset.key = '__clear';
        eraser.title = '지우기';
        eraser.textContent = '✕';
        frag.appendChild(eraser);
        this.el.palette.replaceChildren(frag);
        this.updatePaletteSelection();
    }

    updatePaletteSelection() {
        this.el.palette.querySelectorAll('.palette-swatch').forEach(s =>
            s.classList.toggle('selected', s.dataset.key === (this.selectedColor || '__clear'))
        );
    }

    // Count filled stickers / check all 6 faces complete
    updateStatus() {
        const n = this.size;
        const total = 6 * n * n;
        let filled = 0;
        FACE_ORDER.forEach(f => {
            const face = this.pattern[f];
            if (face) {
                face.forEach(row => row.forEach(k => { if (k) filled++; }));
            }
        });
        const done = filled === total;
        this.el.status.textContent = `스티커 ${filled}/${total} · ${done ? '완성! 시작할 수 있어요' : '6면 모두 입력하면 시작 가능'}`;
        this.el.startBtn.disabled = !done;
        this.el.startBtn.classList.toggle('ready', done);
    }

    finish() {
        const n = this.size;
        // Validate: every face must be fully filled
        for (const f of FACE_ORDER) {
            const face = this.pattern[f];
            if (!face) return;
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    if (!face[r][c]) return;
                }
            }
        }
        // Hand the completed pattern to the game
        if (this.onStart) this.onStart(this.pattern);
    }
}
