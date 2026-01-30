
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);

function drawGrid() {
    context.strokeStyle = '#333'; // Dark gray color
    context.lineWidth = 0.05; // Thin line relative to scale
    context.beginPath();

    // Vertical lines
    for (let x = 1; x < 12; x++) {
        context.moveTo(x, 0);
        context.lineTo(x, 20);
    }

    // Horizontal lines
    for (let y = 1; y < 20; y++) {
        context.moveTo(0, y);
        context.lineTo(12, y);
    }

    context.stroke();
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        player.lines++; // Track lines
        rowCount *= 2;
    }
    
    // Level Up Logic: Every 20 lines
    const newLevel = Math.floor(player.lines / 20) + 1;
    if (newLevel > player.level) {
        player.level = newLevel;
        // Increase speed: decrease interval by 100ms per level, min 100ms
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}


function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type)
{
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    if (isGameOver) return;
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--; // Back up one step
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

// High Score Logic
function saveHighScore(score) {
    const now = new Date();
    const dateString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const newScore = { score: score, date: dateString };
    
    let highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
    highScores.push(newScore);
    
    // Sort descending by score
    highScores.sort((a, b) => b.score - a.score);
    
    // Keep top 10
    highScores.splice(10);
    
    localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
    updateHighScoresList();
}

function updateHighScoresList() {
    const highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
    const list = document.getElementById('highScoreList');
    
    list.innerHTML = highScores.map(score => {
        return `<li><span>${score.score}</span><span class="date">${score.date}</span></li>`;
    }).join('');
}

function toggleHighScores() {
    const modal = document.getElementById('highScoreModal');
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        updateHighScoresList(); // Ensure list is up to date when opening
        modal.style.display = "block";
    }
}

// Close modal if clicked outside content
window.onclick = function(event) {
    const modal = document.getElementById('highScoreModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameOver = false;

function update(time = 0) {
    if (isGameOver) return; // Stop update loop logic if game over

    const deltaTime = time - lastTime;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    lastTime = time;

    draw();
    requestAnimationFrame(update);
}


function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        isGameOver = true;
        if (player.score > 0) {
             saveHighScore(player.score);
        }
        // Show Game Over Overlay
        document.getElementById('finalScore').innerText = player.score;
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }
}

function resetGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    
    isGameOver = false;
    document.getElementById('gameOverOverlay').style.display = 'none';
    
    playerReset();
    updateScore();
    lastTime = performance.now();
    update(); 
}

// ... saveHighScore and updateHighScoresList ...

function updateScore() {
    document.getElementById('score').innerText = 'Score: ' + player.score;
    document.getElementById('level').innerText = 'Level: ' + player.level;
}

// Button controls
function moveLeft() {
    playerMove(-1);
}

function moveRight() {
    playerMove(1);
}

function drop() {
    playerDrop();
}

function hardDrop() {
    playerHardDrop();
}

function rotateClockwise() {
    playerRotate(1);
}

function rotateCounterClockwise() {
    playerRotate(-1);
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    } else if (event.keyCode === 38) { // Up Arrow
        playerHardDrop();
    }
});

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    lines: 0,
    level: 1,
};

playerReset();
updateScore();
update();
