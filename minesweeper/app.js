/**
 * Premium Minesweeper Game Core Logic & UI Interactions
 */

// Game Constants & Configuration
const CONFIG = {
    easy: { rows: 10, cols: 10, mines: 10, name: '초급' },
    medium: { rows: 16, cols: 16, mines: 40, name: '중급' },
    hard: { rows: 30, cols: 16, mines: 99, name: '고급' }
};

// State Variables
let board = [];
let currentRows = 10;
let currentCols = 10;
let targetMines = 10;
let remainingMines = 10;
let difficultyMode = 'easy'; // 'easy' | 'medium' | 'hard' | 'custom'

let isGameOver = false;
let isGameWon = false;
let firstClick = true;
let timerInterval = null;
let timerSeconds = 0;
let soundEnabled = true;
let zoomFactor = 1.0;

// Audio Context Synthesizer
let audioCtx = null;

// Confetti Canvas Emitter
let confettiCanvas = null;
let confettiCtx = null;
let confettiParticles = [];
let confettiAnimationId = null;

// Drag Scrolling Viewport State
let isViewportDragging = false;
let isMouseDownOnViewport = false;
let viewportStartX, viewportStartY;
let viewportScrollLeft, viewportScrollTop;

// DOM Elements
const boardElement = document.getElementById('minesweeper-board');
const mineCountElement = document.getElementById('mine-count');
const timerCountElement = document.getElementById('timer-count');
const faceIconElement = document.getElementById('face-icon');
const restartBtn = document.getElementById('restart-btn');
const soundBtn = document.getElementById('sound-btn');
const viewportElement = document.getElementById('board-viewport');

const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomResetBtn = document.getElementById('zoom-reset-btn');
const zoomTextElement = document.getElementById('zoom-text');

const customSettingsPanel = document.getElementById('custom-settings-panel');
const inputRows = document.getElementById('input-rows');
const inputCols = document.getElementById('input-cols');
const inputMines = document.getElementById('input-mines');
const btnApplyCustom = document.getElementById('btn-apply-custom');

// Modals
const gameModal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const statTime = document.getElementById('stat-time');
const statDifficulty = document.getElementById('stat-difficulty');
const btnModalClose = document.getElementById('btn-modal-close');

// Initialize Web Audio
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Synthesize dynamic sound effects using Web Audio API
function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    switch (type) {
        case 'click': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(650, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            
            osc.start(now);
            osc.stop(now + 0.06);
            break;
        }
        case 'flag': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.setValueAtTime(450, now + 0.04);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            osc.start(now);
            osc.stop(now + 0.08);
            break;
        }
        case 'explode': {
            // Exploding noise synthesis
            const bufferSize = audioCtx.sampleRate * 0.8;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(40, now + 0.8);
            
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            
            noise.start(now);
            break;
        }
        case 'win': {
            // Retro winning fanfare chord arpeggio
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major
            notes.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                const noteTime = now + idx * 0.08;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.1, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
                
                osc.start(noteTime);
                osc.stop(noteTime + 0.4);
            });
            break;
        }
    }
}

// Custom Confetti Particle System
class ConfettiParticle {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = Math.random() * confettiCanvas.height - confettiCanvas.height;
        this.size = Math.random() * 8 + 6;
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 5 + 3;
        this.color = `hsl(${Math.random() * 360}, 90%, 55%)`;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 8 - 4;
    }
    
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        this.x += Math.sin(this.y / 25) * 0.4; // drifting wind
    }
    
    draw() {
        confettiCtx.save();
        confettiCtx.translate(this.x, this.y);
        confettiCtx.rotate((this.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = this.color;
        confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        confettiCtx.restore();
    }
}

function initConfetti() {
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    
    function resizeCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function startCelebration() {
    stopCelebration();
    confettiParticles = [];
    // Spawn initial pool
    for (let i = 0; i < 180; i++) {
        confettiParticles.push(new ConfettiParticle());
    }
    animateConfetti();
}

function stopCelebration() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    if (confettiCtx) {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    let activeCount = 0;
    confettiParticles.forEach(p => {
        if (p.y < confettiCanvas.height) {
            p.update();
            p.draw();
            activeCount++;
        }
    });
    
    // Periodically spawn new particles to keep celebration alive for a bit
    if (activeCount < 80 && Math.random() < 0.1) {
        for (let i = 0; i < 15; i++) {
            const p = new ConfettiParticle();
            p.y = -10; // restart from top
            confettiParticles.push(p);
        }
    }
    
    confettiAnimationId = requestAnimationFrame(animateConfetti);
}

// Drag & Pan scrolling for large board grids
function initViewportDrag() {
    viewportElement.addEventListener('mousedown', (e) => {
        // Drag scrolling only happens on Left mouse button click
        if (e.button !== 0) return;
        
        isMouseDownOnViewport = true;
        isViewportDragging = false;
        viewportStartX = e.pageX - viewportElement.offsetLeft;
        viewportStartY = e.pageY - viewportElement.offsetTop;
        viewportScrollLeft = viewportElement.scrollLeft;
        viewportScrollTop = viewportElement.scrollTop;
    });

    viewportElement.addEventListener('mousemove', (e) => {
        if (!isMouseDownOnViewport) return;
        
        const x = e.pageX - viewportElement.offsetLeft;
        const y = e.pageY - viewportElement.offsetTop;
        const walkX = (x - viewportStartX) * 1.3;
        const walkY = (y - viewportStartY) * 1.3;
        
        // Threshold check to distinguish click vs drag scroll
        if (Math.abs(walkX) > 6 || Math.abs(walkY) > 6) {
            isViewportDragging = true;
        }
        
        viewportElement.scrollLeft = viewportScrollLeft - walkX;
        viewportElement.scrollTop = viewportScrollTop - walkY;
    });

    // Handle mouse release
    const endDrag = () => {
        isMouseDownOnViewport = false;
        // Keep dragging flag for a tiny moment so cell reveal knows it was dragged
        setTimeout(() => {
            isViewportDragging = false;
        }, 50);
    };

    viewportElement.addEventListener('mouseup', endDrag);
    viewportElement.addEventListener('mouseleave', endDrag);
}

// Format digits (e.g. 10 -> '010', -3 -> '-03' or '000')
function formatDigits(num) {
    if (num < 0) {
        const absStr = String(Math.abs(num)).padStart(2, '0');
        return `-${absStr}`;
    }
    return String(num).padStart(3, '0');
}

// Game Board Engine Initialization
function initGame(rows, cols, mines) {
    // Bound inputs to prevent extreme load or crash
    currentRows = Math.max(10, Math.min(100, rows));
    currentCols = Math.max(10, Math.min(100, cols));
    
    // Safety check: mines must leave at least a 3x3 (9 cells) area safe
    const maxMines = (currentRows * currentCols) - 9;
    targetMines = Math.max(1, Math.min(maxMines, mines));
    
    remainingMines = targetMines;
    isGameOver = false;
    isGameWon = false;
    firstClick = true;
    
    stopTimer();
    timerSeconds = 0;
    timerCountElement.textContent = '000';
    mineCountElement.textContent = formatDigits(remainingMines);
    faceIconElement.textContent = '🙂';
    
    stopCelebration();
    
    // Configure dynamic board variables
    boardElement.style.setProperty('--rows', currentRows);
    boardElement.style.setProperty('--cols', currentCols);
    
    // Show drag instruction hint for large grids
    const dragHint = document.getElementById('drag-hint');
    if (currentRows > 18 || currentCols > 18) {
        dragHint.style.display = 'block';
    } else {
        dragHint.style.display = 'none';
    }
    
    buildBoardDOM();
    
    // Auto-fit zoom to screensize on game start
    setTimeout(() => {
        autoFitZoom();
    }, 80);
}

// Build empty/unrevealed board HTML elements
function buildBoardDOM() {
    boardElement.innerHTML = '';
    board = [];
    
    const totalCells = currentRows * currentCols;
    
    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / currentCols);
        const col = i % currentCols;
        
        const cellObj = {
            index: i,
            row: row,
            col: col,
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0
        };
        board.push(cellObj);
        
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell unrevealed';
        cellDiv.id = `cell-${i}`;
        
        // Left click handler
        cellDiv.addEventListener('click', (e) => {
            if (isViewportDragging) return; // Prevent action if dragging viewport
            handleCellLeftClick(i);
        });
        
        // Right click handler (flags)
        cellDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (isViewportDragging) return;
            handleCellRightClick(i);
        });
        
        // Smart Chording (wheel click & double click)
        cellDiv.addEventListener('mousedown', (e) => {
            if (isViewportDragging) return;
            // Middle wheel click (button 1)
            if (e.button === 1) {
                e.preventDefault();
                handleChording(i);
            }
            // Dual click test (left + right buttons both pressed = buttons is 3)
            if (e.buttons === 3) {
                e.preventDefault();
                handleChording(i);
            }
        });
        
        cellDiv.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (isViewportDragging) return;
            handleChording(i);
        });
        
        boardElement.appendChild(cellDiv);
    }
}

// Generate mines after the first click for 100% safety
function generateMines(firstClickedIdx) {
    const totalCells = currentRows * currentCols;
    const safeZone = new Set();
    
    // First clicked cell and its 8 surrounding neighbors are 100% safe
    const firstRow = Math.floor(firstClickedIdx / currentCols);
    const firstCol = firstClickedIdx % currentCols;
    
    for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
            const targetR = firstRow + r;
            const targetC = firstCol + c;
            if (targetR >= 0 && targetR < currentRows && targetC >= 0 && targetC < currentCols) {
                safeZone.add(targetR * currentCols + targetC);
            }
        }
    }
    
    // Candidate pool
    const candidates = [];
    for (let i = 0; i < totalCells; i++) {
        if (!safeZone.has(i)) {
            candidates.push(i);
        }
    }
    
    // Shuffle candidate indices (Fisher-Yates)
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    
    // Place target number of mines
    const minesToPlace = Math.min(targetMines, candidates.length);
    for (let i = 0; i < minesToPlace; i++) {
        const mineIdx = candidates[i];
        board[mineIdx].isMine = true;
    }
    
    // Compute adjacent mines for all cells
    for (let i = 0; i < totalCells; i++) {
        if (board[i].isMine) continue;
        
        const neighbors = getNeighbors(i);
        let mineCount = 0;
        neighbors.forEach(nIdx => {
            if (board[nIdx].isMine) mineCount++;
        });
        
        board[i].adjacentMines = mineCount;
    }
}

// Find neighbor indices of a cell
function getNeighbors(idx) {
    const row = Math.floor(idx / currentCols);
    const col = idx % currentCols;
    const neighbors = [];
    
    for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
            if (r === 0 && c === 0) continue;
            
            const targetR = row + r;
            const targetC = col + c;
            
            if (targetR >= 0 && targetR < currentRows && targetC >= 0 && targetC < currentCols) {
                neighbors.push(targetR * currentCols + targetC);
            }
        }
    }
    
    return neighbors;
}

// Left Click: Reveal Cell
function handleCellLeftClick(idx) {
    if (isGameOver || isGameWon) return;
    
    const cell = board[idx];
    if (cell.isRevealed || cell.isFlagged) return;
    
    // Safe first-click generation
    if (firstClick) {
        firstClick = false;
        generateMines(idx);
        startTimer();
    }
    
    playSound('click');
    
    // If stepped on a mine
    if (cell.isMine) {
        triggerGameOver(idx);
        return;
    }
    
    // Otherwise, reveal cell
    revealCells(idx);
    checkWinCondition();
}

// Stack-based BFS flood fill to prevent browser stack overflow on 100x100 boards
function revealCells(startIdx) {
    const queue = [startIdx];
    const visited = new Set();
    visited.add(startIdx);
    
    while (queue.length > 0) {
        const currentIdx = queue.shift();
        const cell = board[currentIdx];
        
        if (cell.isFlagged || cell.isRevealed) continue;
        
        cell.isRevealed = true;
        const cellDiv = document.getElementById(`cell-${currentIdx}`);
        cellDiv.className = 'cell revealed';
        
        if (cell.adjacentMines > 0) {
            cellDiv.textContent = cell.adjacentMines;
            cellDiv.setAttribute('data-mines', cell.adjacentMines);
        } else {
            // Empty space: trigger adjacent cells expansion
            const neighbors = getNeighbors(currentIdx);
            neighbors.forEach(nIdx => {
                if (!visited.has(nIdx) && !board[nIdx].isRevealed && !board[nIdx].isFlagged) {
                    visited.add(nIdx);
                    queue.push(nIdx);
                }
            });
        }
    }
}

// Right Click: Toggle Flag
function handleCellRightClick(idx) {
    if (isGameOver || isGameWon) return;
    
    const cell = board[idx];
    if (cell.isRevealed) return;
    
    cell.isFlagged = !cell.isFlagged;
    const cellDiv = document.getElementById(`cell-${idx}`);
    
    if (cell.isFlagged) {
        cellDiv.classList.add('flagged');
        remainingMines--;
        playSound('flag');
    } else {
        cellDiv.classList.remove('flagged');
        remainingMines++;
        playSound('click');
    }
    
    mineCountElement.textContent = formatDigits(remainingMines);
}

// Smart Chording (Auto-clear surrounding cells)
function handleChording(idx) {
    if (isGameOver || isGameWon) return;
    
    const cell = board[idx];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;
    
    const neighbors = getNeighbors(idx);
    let flaggedCount = 0;
    
    neighbors.forEach(nIdx => {
        if (board[nIdx].isFlagged) flaggedCount++;
    });
    
    // If flagged neighbors match the value of the cell, auto-reveal non-flagged ones
    if (flaggedCount === cell.adjacentMines) {
        let hitMine = false;
        let explodedMineIdx = null;
        
        neighbors.forEach(nIdx => {
            const neighborCell = board[nIdx];
            if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
                if (neighborCell.isMine) {
                    hitMine = true;
                    explodedMineIdx = nIdx;
                } else {
                    revealCells(nIdx);
                }
            }
        });
        
        if (hitMine && explodedMineIdx !== null) {
            triggerGameOver(explodedMineIdx);
        } else {
            playSound('click');
            checkWinCondition();
        }
    }
}

// Timer Controls
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        timerSeconds++;
        if (timerSeconds > 999) {
            // Keep counting but cap displayed numbers gracefully
            timerCountElement.textContent = '999';
        } else {
            timerCountElement.textContent = formatDigits(timerSeconds);
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Victory Condition Check
function checkWinCondition() {
    const totalCells = currentRows * currentCols;
    let revealedCount = 0;
    
    for (let i = 0; i < totalCells; i++) {
        if (board[i].isRevealed) revealedCount++;
    }
    
    // Win if all non-mine cells are revealed
    if (revealedCount + targetMines === totalCells) {
        isGameWon = true;
        stopTimer();
        faceIconElement.textContent = '😎';
        playSound('win');
        
        // Auto flag all remaining mines
        for (let i = 0; i < totalCells; i++) {
            if (board[i].isMine && !board[i].isFlagged) {
                board[i].isFlagged = true;
                const cellDiv = document.getElementById(`cell-${i}`);
                cellDiv.classList.add('flagged');
            }
        }
        remainingMines = 0;
        mineCountElement.textContent = '000';
        
        startCelebration();
        
        // Display modal after a slight celebratory delay
        setTimeout(() => {
            showModal(true);
        }, 600);
    }
}

// Defeat / Game Over Trigger
function triggerGameOver(explodedIdx) {
    isGameOver = true;
    stopTimer();
    faceIconElement.textContent = '😵';
    playSound('explode');
    
    const totalCells = currentRows * currentCols;
    
    for (let i = 0; i < totalCells; i++) {
        const cell = board[i];
        const cellDiv = document.getElementById(`cell-${i}`);
        
        if (i === explodedIdx) {
            cellDiv.className = 'cell mine exploded';
        } else if (cell.isMine) {
            if (!cell.isFlagged) {
                cellDiv.className = 'cell mine';
            }
        } else if (cell.isFlagged && !cell.isMine) {
            cellDiv.classList.add('wrong-flag');
        }
    }
    
    // Display failure modal
    setTimeout(() => {
        showModal(false);
    }, 1000);
}

// Game Result Modals
function showModal(isVictory) {
    if (isVictory) {
        modalTitle.textContent = '임무 완료! 🏆';
        modalTitle.style.background = 'linear-gradient(135deg, hsl(142, 76%, 50%), hsl(190, 95%, 48%))';
        modalTitle.style.webkitBackgroundClip = 'text';
        modalMessage.textContent = '훌륭합니다! 모든 지뢰를 완벽하게 탐지했습니다.';
    } else {
        modalTitle.textContent = '지뢰 폭발... 💥';
        modalTitle.style.background = 'linear-gradient(135deg, hsl(354, 84%, 57%), hsl(25, 95%, 50%))';
        modalTitle.style.webkitBackgroundClip = 'text';
        modalMessage.textContent = '앗! 지뢰를 밟고 말았습니다. 다음 기회에 도전하세요!';
    }
    
    statTime.textContent = `${timerSeconds}초`;
    
    let diffName = '커스텀';
    if (difficultyMode !== 'custom') {
        diffName = CONFIG[difficultyMode].name;
    } else {
        diffName = `커스텀 (${currentRows}x${currentCols})`;
    }
    statDifficulty.textContent = diffName;
    
    gameModal.classList.add('show');
}

function closeModal() {
    gameModal.classList.remove('show');
    initGame(currentRows, currentCols, targetMines);
}

// Utility zoom manager
function updateZoom(factor) {
    // Clamped between 0.15 for extremely large boards on mobile and 2.5 for accessibility
    zoomFactor = Math.max(0.15, Math.min(2.5, factor));
    boardElement.style.setProperty('--zoom-factor', zoomFactor);
    zoomTextElement.textContent = `${Math.round(zoomFactor * 100)}%`;
}

// Automatically calculate and set zoom factor to fit the grid perfectly inside the viewport
function autoFitZoom() {
    const viewportWidth = viewportElement.clientWidth;
    const viewportHeight = viewportElement.clientHeight;
    
    if (viewportWidth === 0 || viewportHeight === 0) return;
    
    // Pad slightly to give breathing room on edges
    const isMobile = window.innerWidth <= 768;
    const padding = isMobile ? 12 : 32; 
    const availableWidth = viewportWidth - padding;
    const availableHeight = viewportHeight - padding;
    
    // Base cell and grid configuration
    const baseCellSize = 38;
    const baseGap = 3;
    const basePadding = 12 + 3; // padding (6px*2) + border (1.5px*2)
    
    // Calculate total board dimensions at zoom = 1.0
    const boardWidthAtZoom1 = currentCols * baseCellSize + (currentCols - 1) * baseGap + basePadding;
    const boardHeightAtZoom1 = currentRows * baseCellSize + (currentRows - 1) * baseGap + basePadding;
    
    // Compute target zoom to fit either dimension
    const targetZoomX = availableWidth / boardWidthAtZoom1;
    const targetZoomY = availableHeight / boardHeightAtZoom1;
    
    let optimalZoom = Math.min(targetZoomX, targetZoomY);
    
    // Clamping values:
    // Minimum 0.15 to prevent huge boards (100x100) from overflowing
    // Maximum 1.3 to keep easy/medium modes looking sharp and readable
    optimalZoom = Math.max(0.15, Math.min(1.3, optimalZoom));
    
    updateZoom(optimalZoom);
}

// Difficulty switch click events
function setupDifficultySelectors() {
    const diffButtons = document.querySelectorAll('.btn-diff');
    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const diff = btn.getAttribute('data-difficulty');
            
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            difficultyMode = diff;
            playSound('click');
            
            if (diff === 'custom') {
                customSettingsPanel.classList.remove('collapsed');
                // Fill defaults in settings panel
                inputRows.value = currentRows;
                inputCols.value = currentCols;
                inputMines.value = targetMines;
            } else {
                customSettingsPanel.classList.add('collapsed');
                const cfg = CONFIG[diff];
                initGame(cfg.rows, cfg.cols, cfg.mines);
            }
        });
    });
}

// Bind interactive event listeners
function bindEvents() {
    // Restart smiley face button
    restartBtn.addEventListener('click', () => {
        playSound('click');
        initGame(currentRows, currentCols, targetMines);
    });
    
    // Modal action close/restart button
    btnModalClose.addEventListener('click', () => {
        playSound('click');
        closeModal();
    });
    
    // Apply custom parameters action button
    btnApplyCustom.addEventListener('click', () => {
        playSound('click');
        const rows = parseInt(inputRows.value) || 10;
        const cols = parseInt(inputCols.value) || 10;
        const mines = parseInt(inputMines.value) || 10;
        initGame(rows, cols, mines);
    });
    
    // Zoom control click events
    zoomInBtn.addEventListener('click', () => {
        playSound('click');
        updateZoom(zoomFactor + 0.15);
    });
    
    zoomOutBtn.addEventListener('click', () => {
        playSound('click');
        updateZoom(zoomFactor - 0.15);
    });
    
    zoomResetBtn.addEventListener('click', () => {
        playSound('click');
        autoFitZoom();
    });
    
    // Sound control switch toggle
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundBtn.classList.remove('muted');
            soundBtn.querySelector('.icon').textContent = '🔊';
            soundBtn.querySelector('.text').textContent = '소리 켬';
            playSound('click');
        } else {
            soundBtn.classList.add('muted');
            soundBtn.querySelector('.icon').textContent = '🔇';
            soundBtn.querySelector('.text').textContent = '소리 끔';
        }
    });
    
    // Limit mines input based on custom rows/cols boundaries
    const syncMaxMines = () => {
        const rows = parseInt(inputRows.value) || 10;
        const cols = parseInt(inputCols.value) || 10;
        const maxMines = (rows * cols) - 9;
        inputMines.max = maxMines;
        if (parseInt(inputMines.value) > maxMines) {
            inputMines.value = maxMines;
        }
    };
    
    inputRows.addEventListener('input', syncMaxMines);
    inputCols.addEventListener('input', syncMaxMines);
}

// Window OnLoad Startup Trigger
window.addEventListener('DOMContentLoaded', () => {
    setupDifficultySelectors();
    bindEvents();
    initViewportDrag();
    initConfetti();
    
    // Default load: Easy Difficulty
    initGame(CONFIG.easy.rows, CONFIG.easy.cols, CONFIG.easy.mines);
    
    // Auto-fit board on screen orientation change or resize
    window.addEventListener('resize', () => {
        autoFitZoom();
    });
});
