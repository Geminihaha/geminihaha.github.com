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
    const s = cellSize * 0.42;
    if (type === BLACK) {
        color = '#3498db'; accent = '#2980b9'; detail = '#a9d0f5';
    } else if (type === WHITE) {
        color = '#e67e22'; accent = '#d35400'; detail = '#f5cba7';
    } else { // NEUTRAL_CASTLE
        color = '#f1c40f'; accent = '#d4ac0d'; detail = '#fcf3cf';
    }
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = accent;
    ctx.fillRect(-s, -s, s*2, s*2);
    ctx.fillStyle = color;
    ctx.fillRect(-s+1, -s+1, s*2-2, s*2-2);
    const ts = s * 0.45;
    [[-s, -s], [s-ts, -s], [-s, s-ts], [s-ts, s-ts]].forEach(([tx, ty]) => {
        ctx.fillStyle = accent; ctx.fillRect(tx, ty, ts, ts);
        ctx.fillStyle = color; ctx.fillRect(tx+1, ty+1, ts-2, ts-2);
        ctx.fillStyle = detail; ctx.fillRect(tx+ts*0.2, ty+ts*0.2, ts*0.6, ts*0.6);
    });
    const ks = s * 0.7;
    ctx.fillStyle = accent; ctx.fillRect(-ks/2, -ks/2, ks, ks);
    ctx.fillStyle = color; ctx.fillRect(-ks/2+1, -ks/2+1, ks-2, ks-2);
    ctx.strokeStyle = detail; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-ks*0.3, 0); ctx.lineTo(ks*0.3, 0);
    ctx.moveTo(0, -ks*0.3); ctx.lineTo(0, ks*0.3); ctx.stroke();
    if (type === NEUTRAL_CASTLE) {
        ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.arc(0, 0, ks*0.15, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function render() {
    const size = canvas.width / (window.devicePixelRatio || 1);
    const cellSize = size / (GRID_SIZE + 1);
    const margin = cellSize;
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = '#2c1e10'; ctx.lineWidth = 1;
    for (let i = 0; i < GRID_SIZE; i++) {
        ctx.beginPath(); ctx.moveTo(margin, margin + i * cellSize);
        ctx.lineTo(margin + (GRID_SIZE - 1) * cellSize, margin + i * cellSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin + i * cellSize, margin);
        ctx.lineTo(margin + i * cellSize, margin + (GRID_SIZE - 1) * cellSize); ctx.stroke();
    }
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const val = board[y][x];
            const px = margin + x * cellSize, py = margin + y * cellSize;
            if (val === BLACK_TERRITORY || val === WHITE_TERRITORY) {
                ctx.fillStyle = val === BLACK_TERRITORY ? 'rgba(52, 152, 219, 0.3)' : 'rgba(230, 126, 34, 0.35)';
                ctx.fillRect(px - cellSize/2 + 2, py - cellSize/2 + 2, cellSize - 4, cellSize - 4);
            }
            if (val === BLACK || val === WHITE || val === NEUTRAL_CASTLE) {
                drawCastle(px, py, cellSize, val);
            }
            if (lastMove && lastMove.x === x && lastMove.y === y) {
                ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.arc(px, py, cellSize * 0.52, 0, Math.PI * 2); ctx.stroke();
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
                } else if (nVal === EMPTY) {
                    liberties.add(key);
                }
            }
        }
    }
    return { group, libertyCount: liberties.size };
}

function canPlace(x, y, color) {
    if (board[y][x] !== EMPTY) return false;
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
    board[y][x] = EMPTY;
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
        turnIndicator.textContent = currentPlayer === BLACK ? "파랑(Blue)의 차례" : "주황(Orange)의 차례";
        turnIndicator.style.color = currentPlayer === BLACK ? "#3498db" : "#e67e22";
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

    // 현재 단수(Atari)인 백돌 그룹 찾기
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
        let score = Math.random() * 5; // 점수 동점 시 무작위성 부여

        // 가상으로 돌을 놓아봄
        board[move.y][move.x] = WHITE;
        
        // 1순위: 즉시 승리 (상대 돌 따내기)
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

        // 2순위: 내 돌 살리기 (단수인 그룹의 활로 늘리기)
        const info = getGroup(move.x, move.y, WHITE);
        const newLiberties = info.libertyCount;
        
        let savesGroup = false;
        for (const atariGroup of whiteGroupsInAtari) {
            // 이 수로 인해 기존 단수였던 그룹과 연결되거나 활로가 늘어나는지 확인
            const isConnected = atariGroup.group.some(([gx, gy]) => 
                Math.abs(gx - move.x) + Math.abs(gy - move.y) === 1
            );
            if (isConnected && newLiberties > 1) {
                savesGroup = true;
                break;
            }
        }
        if (savesGroup) score += 500;

        // 3순위: 상대방 돌을 단수로 만들기
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

        // 4순위: 자살수 방지 및 활로 확보
        if (newLiberties === 1) score -= 200; // 스스로 단수가 되는 수는 피함
        else score += newLiberties * 10;

        // 5순위: 중앙 및 요충지 점수
        const distToCenter = Math.abs(move.x - 4) + Math.abs(move.y - 4);
        score += (10 - distToCenter) * 2;

        // 주변에 돌이 있는 경우 가중치 (연결성)
        for (const [dx, dy] of neighbors) {
            const nx = move.x + dx, ny = move.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                if (board[ny][nx] === WHITE) score += 20;
                if (board[ny][nx] === BLACK) score += 15;
            }
        }

        board[move.y][move.x] = EMPTY; // 복구

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
    resultMessage.textContent = `게임 종료\n${winnerMsg}\n\nBlue: ${bScore} 점 / Orange: ${wScore} 점`;
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
