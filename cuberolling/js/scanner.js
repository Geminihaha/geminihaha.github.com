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
            clearBtn: document.getElementById('btn-scanner-clear'),
            status: document.getElementById('scanner-status'),
        };

        this.initEvents();
    }

    initEvents() {
        this.el.tabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.face-tab');
            if (!tab) return;
            this.setFace(tab.dataset.face);
        });

        this.el.palette.addEventListener('click', (e) => {
            const swatch = e.target.closest('.palette-swatch');
            if (!swatch) return;
            if (swatch.dataset.key === '__clear') {
                this.selectedColor = null;
            } else {
                this.selectedColor = swatch.dataset.key;
            }
            this.updatePaletteSelection();
        });

        // Sticker grid tap-to-fill (event delegation on the grid)
        this.el.grid.addEventListener('click', (e) => {
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
        });

        this.el.captureBtn.addEventListener('click', () => this.captureFrame());
        this.el.clearBtn.addEventListener('click', () => this.clearCurrentFace());
        this.el.startBtn.addEventListener('click', () => this.finish());

        document.getElementById('btn-scanner-close').addEventListener('click', () => this.close());
        document.getElementById('scanner-modal').addEventListener('click', (e) => {
            if (e.target.id === 'scanner-modal') this.close();
        });
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
    }

    setFace(face) {
        this.currentFace = face;
        this.el.hint.textContent = FACE_HINTS[face] || '';
        this.el.tabs.querySelectorAll('.face-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.face === face)
        );
        this.renderGrid();
    }

    // Build the NxN sticker cells for the current face
    buildGrid() {
        const n = this.size;
        this.el.grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        this.el.grid.style.gridTemplateRows = `repeat(${n}, 1fr)`;
        this.renderGrid();
    }

    renderGrid() {
        const n = this.size;
        const face = this.currentFace;
        const cells = [];

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'scanner-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                const key = this.pattern[face] && this.pattern[face][r][c];
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
        if (!this.pattern[this.currentFace]) {
            this.pattern[this.currentFace] = Array.from({ length: n }, () => Array(n).fill(null));
        }
        this.pattern[this.currentFace][r][c] = cell.dataset.key || null;
    }

    clearCurrentFace() {
        if (this.pattern[this.currentFace]) {
            const n = this.size;
            this.pattern[this.currentFace] = Array.from({ length: n }, () => Array(n).fill(null));
        }
        this.renderGrid();
        this.updateStatus();
    }

    // Capture the current camera frame as a reference behind the grid
    captureFrame() {
        const video = this.el.video;
        if (!video.videoWidth) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        this.el.grid.style.backgroundImage = `url(${dataUrl})`;
        this.el.grid.classList.add('has-capture');
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
