const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');
const turnIndicator = document.getElementById('turn-indicator');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const passBtn = document.getElementById('pass-btn');
const resetBtn = document.getElementById('reset-btn');
const overlay = document.getElementById('overlay');
const modeOverlay = document.getElementById('mode-overlay');
const resultMessage = document.getElementById('result-message');
const restartBtn = document.getElementById('restart-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

const GRID_SIZE = 9;
const EMPTY = 0;
const BLACK = 1; 
const WHITE = 2; 
const BLACK_TERRITORY = 3;
const WHITE_TERRITORY = 4;
const NEUTRAL_CASTLE = 5;

// Aurelian Stone Theme Colors
const COLORS = {
    background: '#0c0d18',
    gridLine: 'rgba(85, 67, 56, 0.4)',
    black: '#acc7ff', // Secondary color (Blue)
    blackAccent: '#004b9e',
    white: '#ffb68a', // Primary color (Orange)
    whiteAccent: '#dc7830',
    neutral: '#dfe2ef',
    neutralAccent: '#8e929e',
    blackTerritory: 'rgba(172, 199, 255, 0.15)',
    whiteTerritory: 'rgba(255, 182, 138, 0.15)',
    lastMove: '#ffb68a'
};

let board = [];
let currentPlayer = BLACK;
let blackCaptured = 0;
let whiteCaptured = 0;
let passCount = 0;
let lastMove = null;
let gameMode = null; // 'pvp' or 'ai'
let isGameActive = false;

function initBoard(mode) {
    gameMode = mode;
    board = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY));
    const center = Math.floor(GRID_SIZE / 2);
    board[center][center] = NEUTRAL_CASTLE;
    currentPlayer = BLACK;
    blackCaptured = 0;
    whiteCaptured = 0;
    passCount = 0;
    lastMove = null;
    isGameActive = true;
    
    modeOverlay.style.display = 'none';
    overlay.style.display = 'none';
    updateUI();
    render();
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    render();
}

function drawCastle(px, py, cellSize, type) {
    let color, accent, detail;
    const s = cellSize * 0.45;
    
    if (type === BLACK) {
        color = COLORS.black; accent = COLORS.blackAccent; detail = '#ffffff';
    } else if (type === WHITE) {
        color = COLORS.white; accent = COLORS.whiteAccent; detail = '#ffffff';
    } else { // NEUTRAL_CASTLE
        color = COLORS.neutral; accent = COLORS.neutralAccent; detail = '#ffffff';
    }

    ctx.save();
    ctx.translate(px, py);
    
    // Outer Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;

    // Gemstone Shape (Diamond-like)
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
    grad.addColorStop(0, color);
    grad.addColorStop(1, accent);
    ctx.fillStyle = grad;
    ctx.fill();

    // Metallic Shine
    ctx.shadowBlur = 0;
    ctx.strokeStyle = detail;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.stroke();

    // Inner details (Sigil)
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    if (type === NEUTRAL_CASTLE) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function render() {
    const size = canvas.width / (window.devicePixelRatio || 1);
    const cellSize = size / (GRID_SIZE + 1);
    const margin = cellSize;
    
    // Clear Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, size, size);

    // Stone Texture Simulation on Board
    ctx.globalAlpha = 0.05;
    for(let i=0; i<500; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
    ctx.globalAlpha = 1.0;

    // Grid Lines
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i < GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(margin, margin + i * cellSize);
        ctx.lineTo(margin + (GRID_SIZE - 1) * cellSize, margin + i * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(margin + i * cellSize, margin);
        ctx.lineTo(margin + i * cellSize, margin + (GRID_SIZE - 1) * cellSize);
        ctx.stroke();
    }

    // Grid Intersections (Dots)
    ctx.fillStyle = COLORS.gridLine;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            ctx.beginPath();
            ctx.arc(margin + x * cellSize, margin + y * cellSize, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Territories and Pieces
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const val = board[y][x];
            const px = margin + x * cellSize, py = margin + y * cellSize;
            
            if (val === BLACK_TERRITORY || val === WHITE_TERRITORY) {
                ctx.fillStyle = val === BLACK_TERRITORY ? COLORS.blackTerritory : COLORS.whiteTerritory;
                ctx.beginPath();
                // Simple rect for territories to feel integrated
                ctx.fillRect(px - cellSize/2 + 4, py - cellSize/2 + 4, cellSize - 8, cellSize - 8);
            }
            
            if (val === BLACK || val === WHITE || val === NEUTRAL_CASTLE) {
                drawCastle(px, py, cellSize, val);
            }
            
            if (lastMove && lastMove.x === x && lastMove.y === y) {
                ctx.strokeStyle = COLORS.white;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.beginPath();
                ctx.arc(px, py, cellSize * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
}

function getGroup(x, y, color) {
    const group = [];
    const liberties = new Set();
    const stack = [[x, y]];
    const visited = new Set();
    visited.add(`${x},${y}`);
    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        group.push([cx, cy]);
        const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of neighbors) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const nVal = board[ny][nx];
                const key = `${nx},${ny}`;
                if (nVal === color && !visited.has(key)) {
                    visited.add(key); stack.push([nx, ny]);
                } else if (nVal === EMPTY || nVal === BLACK_TERRITORY || nVal === WHITE_TERRITORY) {
                    liberties.add(key);
                }
            }
        }
    }
    return { group, libertyCount: liberties.size };
}

function canPlace(x, y, color) {
    const originalVal = board[y][x];
    if (originalVal !== EMPTY && originalVal !== BLACK_TERRITORY && originalVal !== WHITE_TERRITORY) return false;
    
    board[y][x] = color;
    const { libertyCount } = getGroup(x, y, color);
    let canCapture = false;
    const opponent = color === BLACK ? WHITE : BLACK;
    const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of neighbors) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && board[ny][nx] === opponent) {
            if (getGroup(nx, ny, opponent).libertyCount === 0) {
                canCapture = true; break;
            }
        }
    }
    board[y][x] = originalVal;
    return libertyCount > 0 || canCapture;
}

function checkCaptures(x, y, color) {
    const opponent = color === BLACK ? WHITE : BLACK;
    const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let capturedAny = false;
    for (const [dx, dy] of neighbors) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && board[ny][nx] === opponent) {
            const { group, libertyCount } = getGroup(nx, ny, opponent);
            if (libertyCount === 0) {
                group.forEach(([gx, gy]) => {
                    board[gy][gx] = EMPTY;
                    if (color === BLACK) blackCaptured++; else whiteCaptured++;
                });
                capturedAny = true;
            }
        }
    }
    return capturedAny;
}

function updateTerritories() {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (board[y][x] === BLACK_TERRITORY || board[y][x] === WHITE_TERRITORY) {
                board[y][x] = EMPTY;
            }
        }
    }

    let bE = false, wE = false;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (board[y][x] === BLACK) bE = true;
            if (board[y][x] === WHITE) wE = true;
        }
    }
    if (!bE || !wE) return;
    const visited = new Set();
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (board[y][x] === EMPTY && !visited.has(`${x},${y}`)) {
                const { region, borderColors } = getEmptyRegion(x, y);
                region.forEach(k => visited.add(k));
                if (borderColors.size === 1) {
                    const owner = borderColors.values().next().value;
                    const val = owner === BLACK ? BLACK_TERRITORY : WHITE_TERRITORY;
                    region.forEach(k => {
                        const [rx, ry] = k.split(',').map(Number); board[ry][rx] = val;
                    });
                }
            }
        }
    }
}

function getEmptyRegion(x, y) {
    const region = []; const borderColors = new Set();
    const stack = [[x, y]]; const visited = new Set(); visited.add(`${x},${y}`);
    while (stack.length > 0) {
        const [cx, cy] = stack.pop(); region.push(`${cx},${cy}`);
        const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of neighbors) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const val = board[ny][nx];
                if (val === EMPTY) {
                    if (!visited.has(`${nx},${ny}`)) { visited.add(`${nx},${ny}`); stack.push([nx, ny]); }
                } else if (val !== EMPTY && val !== NEUTRAL_CASTLE) {
                    borderColors.add((val === BLACK || val === BLACK_TERRITORY) ? BLACK : WHITE);
                }
            }
        }
    }
    return { region, borderColors };
}

function updateUI() {
    let bT = 0, wT = 0;
    board.forEach(row => row.forEach(v => {
        if (v === BLACK_TERRITORY) bT++; if (v === WHITE_TERRITORY) wT++;
    }));
    blackScoreEl.textContent = bT + blackCaptured;
    whiteScoreEl.textContent = wT + whiteCaptured;
    if (isGameActive) {
        const colorName = currentPlayer === BLACK ? "파랑(Blue)" : "주황(Orange)";
        const colorHex = currentPlayer === BLACK ? COLORS.black : COLORS.white;
        turnIndicator.innerHTML = `<span style="color: ${colorHex}">${colorName}</span>의 전략적 이동`;
    }
}

function processMove(x, y) {
    board[y][x] = currentPlayer;
    lastMove = { x, y };
    const isDestructionWin = checkCaptures(x, y, currentPlayer);
    if (isDestructionWin) {
        render(); setTimeout(() => endGame(true), 100); return true;
    }
    updateTerritories();
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    passCount = 0;
    updateUI();
    render();
    
    if (gameMode === 'ai' && currentPlayer === WHITE && isGameActive) {
        setTimeout(aiMove, 600);
    }
    return false;
}

function handleEvent(e) {
    if (!isGameActive || (gameMode === 'ai' && currentPlayer === WHITE)) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const clientX = touch.clientX, clientY = touch.clientY;
    const cellSize = rect.width / (GRID_SIZE + 1);
    const margin = cellSize;
    const x = Math.round((clientX - rect.left - margin) / cellSize);
    const y = Math.round((clientY - rect.top - margin) / cellSize);
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        if (canPlace(x, y, currentPlayer)) processMove(x, y);
    }
}

// AI 로직
function aiMove() {
    if (!isGameActive) return;
    
    const validMoves = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (canPlace(x, y, WHITE)) validMoves.push({ x, y });
        }
    }

    if (validMoves.length === 0) { pass(); return; }

    let bestMove = null;
    let maxScore = -Infinity;

    const whiteGroupsInAtari = [];
    const visited = new Set();
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (board[y][x] === WHITE && !visited.has(`${x},${y}`)) {
                const g = getGroup(x, y, WHITE);
                g.group.forEach(([gx, gy]) => visited.add(`${gx},${gy}`));
                if (g.libertyCount === 1) whiteGroupsInAtari.push(g);
            }
        }
    }

    for (const move of validMoves) {
        let score = Math.random() * 5;

        const originalVal = board[move.y][move.x];
        board[move.y][move.x] = WHITE;
        
        let canCapture = false;
        const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of neighbors) {
            const nx = move.x + dx, ny = move.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && board[ny][nx] === BLACK) {
                if (getGroup(nx, ny, BLACK).libertyCount === 0) {
                    canCapture = true;
                    break;
                }
            }
        }
        if (canCapture) score += 10000;

        const info = getGroup(move.x, move.y, WHITE);
        const newLiberties = info.libertyCount;
        
        let savesGroup = false;
        for (const atariGroup of whiteGroupsInAtari) {
            const isConnected = atariGroup.group.some(([gx, gy]) => 
                Math.abs(gx - move.x) + Math.abs(gy - move.y) === 1
            );
            if (isConnected && newLiberties > 1) {
                savesGroup = true;
                break;
            }
        }
        if (savesGroup) score += 500;

        let putsInAtari = false;
        for (const [dx, dy] of neighbors) {
            const nx = move.x + dx, ny = move.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && board[ny][nx] === BLACK) {
                if (getGroup(nx, ny, BLACK).libertyCount === 1) {
                    putsInAtari = true;
                    break;
                }
            }
        }
        if (putsInAtari) score += 100;

        if (newLiberties === 1) score -= 200;
        else score += newLiberties * 10;

        const distToCenter = Math.abs(move.x - 4) + Math.abs(move.y - 4);
        score += (10 - distToCenter) * 2;

        for (const [dx, dy] of neighbors) {
            const nx = move.x + dx, ny = move.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                if (board[ny][nx] === WHITE) score += 20;
                if (board[ny][nx] === BLACK) score += 15;
            }
        }

        board[move.y][move.x] = originalVal;

        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        }
    }

    if (bestMove) {
        processMove(bestMove.x, bestMove.y);
    } else {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        processMove(randomMove.x, randomMove.y);
    }
}

function pass() {
    passCount++;
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    updateUI();
    if (passCount >= 2) { endGame(false); return; }
    if (gameMode === 'ai' && currentPlayer === WHITE) setTimeout(aiMove, 600);
}

function endGame(destructionWin = false) {
    isGameActive = false;
    const bScore = parseInt(blackScoreEl.textContent);
    const wScore = parseInt(whiteScoreEl.textContent);
    let winnerMsg = "";
    if (destructionWin) {
        const winnerColor = currentPlayer === BLACK ? "파랑(Blue)" : "주황(Orange)";
        winnerMsg = `성 파괴!\n${winnerColor} 즉시 승리!`;
    } else {
        winnerMsg = bScore > wScore ? "파랑(Blue) 승리!" : (wScore > bScore ? "주황(Orange) 승리!" : "무승부!");
    }
    resultMessage.textContent = `제국 결산\n${winnerMsg}\n\nBlue: ${bScore} / Orange: ${wScore}`;
    overlay.style.display = 'flex';
}

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => initBoard(btn.dataset.mode));
});

passBtn.addEventListener('click', pass);
resetBtn.addEventListener('click', () => { 
    isGameActive = false;
    modeOverlay.style.display = 'flex'; 
    overlay.style.display = 'none';
});
restartBtn.addEventListener('click', () => initBoard(gameMode));
canvas.addEventListener('mousedown', handleEvent);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleEvent(e); }, { passive: false });
window.addEventListener('resize', resize);

setTimeout(resize, 0);
