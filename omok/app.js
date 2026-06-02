window.addEventListener('DOMContentLoaded', () => {
    const BOARD_SIZE = 11;
    const boardElement = document.getElementById('board');
    const resetBtn = document.getElementById('reset-btn');

    // Turn Indicator Elements
    const turnIndicator = document.getElementById('turn-indicator');
    const turnStone = document.getElementById('turn-stone');
    const turnText = document.getElementById('turn-text');

    // Segmented Mode Selector
    const segmentedControl = document.querySelector('.segmented-control');
    const btnModePvp = document.getElementById('btn-mode-pvp');
    const btnModePvb = document.getElementById('btn-mode-pvb');

    // Player Card Elements
    const playerBlackCard = document.getElementById('player-black');
    const playerWhiteCard = document.getElementById('player-white');

    // Modal Elements
    const victoryModal = document.getElementById('victory-modal');
    const modalIcon = document.getElementById('modal-icon');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let board = [];
    let currentPlayer = 'black'; // 'black' (Ink Stone) or 'white' (Shell Stone)
    let gameOver = false;
    let gameMode = 'pvp'; // 'pvp' or 'pvb'

    function initBoard() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        if (boardElement) {
            boardElement.innerHTML = '';
        }
        gameOver = false;
        currentPlayer = 'black';
        
        if (segmentedControl) {
            gameMode = segmentedControl.classList.contains('pvb-active') ? 'pvb' : 'pvp';
        } else {
            gameMode = 'pvp';
        }
        
        updateStatusUI();
        if (victoryModal) {
            victoryModal.classList.remove('show');
        }

        // Create cells
        if (boardElement) {
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    
                    // Add star points for traditional board layout
                    // For 11x11, we add star points at (2,2), (2,5), (2,8), (5,2), (5,5), (5,8), (8,2), (8,5), (8,8)
                    if ((r === 2 || r === 5 || r === 8) && (c === 2 || c === 5 || c === 8)) {
                        cell.classList.add('star-point');
                    }
                    
                    cell.addEventListener('click', handleCellClick);
                    boardElement.appendChild(cell);
                }
            }
        }
    }

    function updateStatusUI() {
        // Add turn-change animation
        if (turnIndicator) {
            turnIndicator.classList.remove('turn-change');
            void turnIndicator.offsetWidth; // Trigger reflow to restart animation
            turnIndicator.classList.add('turn-change');
        }

        if (currentPlayer === 'black') {
            if (turnText) turnText.textContent = "Black's Turn";
            if (turnStone) {
                turnStone.style.background = 'radial-gradient(circle at 35% 35%, #4a4e58 0%, #101012 100%)';
                turnStone.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.5)';
                turnStone.style.border = '1px solid #000';
            }
            
            if (playerBlackCard) playerBlackCard.classList.add('active');
            if (playerWhiteCard) playerWhiteCard.classList.remove('active');
        } else {
            if (turnText) turnText.textContent = "White's Turn";
            if (turnStone) {
                turnStone.style.background = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e4e8 100%)';
                turnStone.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3)';
                turnStone.style.border = '1px solid #b8bac0';
            }
            
            if (playerWhiteCard) playerWhiteCard.classList.add('active');
            if (playerBlackCard) playerBlackCard.classList.remove('active');
        }
    }

    function handleCellClick(e) {
        if (gameOver) return;
        if (gameMode === 'pvb' && currentPlayer === 'white') return; // Wait for bot

        let cell = e.target;
        // Handle click on cell pseudoelements or gridlines
        if (!cell.classList.contains('cell')) {
            cell = cell.closest('.cell');
            if (!cell) return;
        }
        
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);

        if (board[r][c]) return;

        makeMove(r, c);

        if (!gameOver && gameMode === 'pvb' && currentPlayer === 'white') {
            setTimeout(makeBotMove, 600);
        }
    }

    function makeMove(r, c) {
        placeStone(r, c, currentPlayer);

        const winCoords = getWinningStones(r, c, currentPlayer);
        if (winCoords) {
            highlightWin(winCoords);
            setTimeout(() => {
                showVictoryModal(currentPlayer);
            }, 800);
            gameOver = true;
            return;
        }

        if (isBoardFull()) {
            setTimeout(() => {
                showDrawModal();
            }, 800);
            gameOver = true;
            return;
        }

        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        updateStatusUI();
    }

    function placeStone(r, c, player) {
        board[r][c] = player;
        
        if (!boardElement) return;

        // Remove last-move class from any previous stone
        const previousLastMove = boardElement.querySelector('.stone.last-move');
        if (previousLastMove) {
            previousLastMove.classList.remove('last-move');
        }

        const cell = boardElement.children[r * BOARD_SIZE + c];
        if (cell) {
            const stone = document.createElement('div');
            stone.classList.add('stone', player, 'last-move');
            cell.appendChild(stone);
        }
    }

    function getWinningStones(r, c, player) {
        const directions = [
            [[0, 1], [0, -1]], // Horizontal
            [[1, 0], [-1, 0]], // Vertical
            [[1, 1], [-1, -1]], // Diagonal \
            [[1, -1], [-1, 1]]  // Diagonal /
        ];

        for (const dir of directions) {
            let coords = [[r, c]];
            for (const [dr, dc] of dir) {
                let nr = r + dr;
                let nc = c + dc;
                while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                    coords.push([nr, nc]);
                    nr += dr;
                    nc += dc;
                }
            }
            if (coords.length >= 5) return coords;
        }
        return null;
    }

    function highlightWin(coords) {
        if (!boardElement) return;
        coords.forEach(([r, c]) => {
            const cell = boardElement.children[r * BOARD_SIZE + c];
            if (cell) {
                cell.classList.add('win-highlight');
            }
        });
    }

    // Check if all spots on board are filled
    function isBoardFull() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === null) return false;
            }
        }
        return true;
    }

    function showVictoryModal(player) {
        if (victoryModal) {
            if (player === 'black') {
                if (modalIcon) {
                    modalIcon.textContent = 'workspace_premium';
                    modalIcon.style.color = '#deb887'; // Oak color glow
                }
                if (modalTitle) modalTitle.textContent = 'Black Victorious!';
                if (modalBody) modalBody.textContent = 'The Black Ink Stone has successfully aligned 5 stones to conquer the board.';
            } else {
                if (modalIcon) {
                    modalIcon.textContent = 'workspace_premium';
                    modalIcon.style.color = '#e9e1db'; // White stone theme color glow
                }
                if (modalTitle) modalTitle.textContent = 'White Victorious!';
                if (modalBody) modalBody.textContent = 'The White Shell Stone has successfully aligned 5 stones to conquer the board.';
            }
            if (turnText) turnText.textContent = `${player === 'black' ? 'Black' : 'White'} Wins!`;
            victoryModal.classList.add('show');
        }
    }

    function showDrawModal() {
        if (victoryModal) {
            if (modalIcon) {
                modalIcon.textContent = 'balance';
                modalIcon.style.color = 'var(--outline)';
            }
            if (modalTitle) modalTitle.textContent = 'Draw Match';
            if (modalBody) modalBody.textContent = 'The board is full. Neither player can claim victory.';
            if (turnText) turnText.textContent = 'Draw Match';
            victoryModal.classList.add('show');
        }
    }

    // Simple Bot Logic
    function makeBotMove() {
        if (gameOver) return;

        let bestScore = -1;
        let move = { r: 5, c: 5 }; // Center fallback

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
        const players = ['white', 'black']; // white is bot (Guardian/White), black is human (Black)

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

    if (resetBtn) resetBtn.addEventListener('click', initBoard);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', initBoard);

    // Battle Mode Segmented Button Controls
    if (btnModePvp) {
        btnModePvp.addEventListener('click', () => {
            if (segmentedControl && !segmentedControl.classList.contains('pvb-active')) return;
            if (segmentedControl) segmentedControl.classList.remove('pvb-active');
            initBoard();
        });
    }

    if (btnModePvb) {
        btnModePvb.addEventListener('click', () => {
            if (segmentedControl && segmentedControl.classList.contains('pvb-active')) return;
            if (segmentedControl) segmentedControl.classList.add('pvb-active');
            initBoard();
        });
    }

    initBoard();
});