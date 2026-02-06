const BOARD_SIZE = 11;
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const modeSelect = document.getElementById('mode-select');

let board = [];
let currentPlayer = 'black';
let gameOver = false;
let gameMode = 'pvp'; // 'pvp' or 'pvb'

function initBoard() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    boardElement.innerHTML = '';
    gameOver = false;
    currentPlayer = 'black';
    gameMode = modeSelect.value;
    statusElement.textContent = "Black's Turn";

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(e) {
    if (gameOver) return;
    if (gameMode === 'pvb' && currentPlayer === 'white') return; // Wait for bot

    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);

    if (board[r][c]) return;

    makeMove(r, c);

    if (!gameOver && gameMode === 'pvb' && currentPlayer === 'white') {
        setTimeout(makeBotMove, 500);
    }
}

function makeMove(r, c) {
    placeStone(r, c, currentPlayer);

    if (checkWin(r, c, currentPlayer)) {
        statusElement.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} Wins!`;
        gameOver = true;
        return;
    }

    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    statusElement.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
}

function placeStone(r, c, player) {
    board[r][c] = player;
    const cell = boardElement.children[r * BOARD_SIZE + c];
    const stone = document.createElement('div');
    stone.classList.add('stone', player);
    cell.appendChild(stone);
}

function checkWin(r, c, player) {
    const directions = [
        [[0, 1], [0, -1]], // Horizontal
        [[1, 0], [-1, 0]], // Vertical
        [[1, 1], [-1, -1]], // Diagonal \
        [[1, -1], [-1, 1]]  // Diagonal /
    ];

    for (const dir of directions) {
        let count = 1;
        for (const [dr, dc] of dir) {
            let nr = r + dr;
            let nc = c + dc;
            while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                count++;
                nr += dr;
                nc += dc;
            }
        }
        if (count >= 5) return true;
    }
    return false;
}

// Simple Bot Logic
function makeBotMove() {
    if (gameOver) return;

    let bestScore = -1;
    let move = { r: 7, c: 7 };

    // Find the best move by scoring each empty cell
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (!board[r][c]) {
                let score = evaluateMove(r, c);
                if (score > bestScore) {
                    bestScore = score;
                    move = { r, c };
                }
            }
        }
    }

    makeMove(move.r, move.c);
}

function evaluateMove(r, c) {
    let totalScore = 0;
    const players = ['white', 'black']; // white is bot, black is human

    for (const player of players) {
        const directions = [
            [[0, 1], [0, -1]], 
            [[1, 0], [-1, 0]], 
            [[1, 1], [-1, -1]], 
            [[1, -1], [-1, 1]]
        ];

        for (const dir of directions) {
            let count = 0;
            let openEnds = 0;
            for (const [dr, dc] of dir) {
                let nr = r + dr;
                let nc = c + dc;
                while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                    count++;
                    nr += dr;
                    nc += dc;
                }
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === null) {
                    openEnds++;
                }
            }

            // Simple heuristic scoring
            if (count >= 4) totalScore += (player === 'white' ? 10000 : 5000);
            else if (count === 3 && openEnds > 0) totalScore += (player === 'white' ? 1000 : 500);
            else if (count === 2 && openEnds > 0) totalScore += (player === 'white' ? 100 : 50);
            else if (count === 1 && openEnds > 0) totalScore += (player === 'white' ? 10 : 5);
        }
    }
    
    // Add small random factor for variety
    totalScore += Math.random() * 2;
    return totalScore;
}

resetBtn.addEventListener('click', initBoard);
modeSelect.addEventListener('change', initBoard);

initBoard();