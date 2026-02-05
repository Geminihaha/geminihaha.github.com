const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const birdImg = new Image();
const bgImg = new Image();
const pipeNorth = new Image();
const pipeSouth = new Image();

birdImg.src = './assets/bird_ca.png';
bgImg.src = '../assets/art/sky.png';
pipeNorth.src = './assets/tree_top.png';
pipeSouth.src = './assets/tree_bottom.png';

let scale = 1;
let birdScale = 1;
let birdX, birdY, velocityY;
let gravity, jump, pipeGap;
let score = 0;
let gameLoop;
let isGameOver = false;
let isStarted = false;
let pipe = [];

function resize() {
    const container = document.getElementById('canvasWrapper');
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    canvas.width = width;
    canvas.height = height;
    scale = width / 180;
    birdScale = Math.min(Math.max(scale, 0.8), 1.8);
    
    gravity = 0.20 * scale;
    jump = -3.5 * scale;
    pipeGap = 140 * scale;
    
    birdX = 30 * scale;
    if (!isStarted) {
        birdY = canvas.height / 2;
        render();
    }
}

window.addEventListener('resize', resize);

function startGame() {
    if (isStarted && !isGameOver) return;
    
    isStarted = true;
    isGameOver = false;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverModal').style.display = 'none';
    
    pipe = [];
    const pScale = Math.max(scale, 1.0);
    pipe.push({
        x: canvas.width * 1.5,
        y: Math.floor(Math.random() * (pipeNorth.height * pScale * 0.6)) - pipeNorth.height * pScale + (50 * scale)
    });
    
    score = 0;
    document.getElementById('scoreDisplay').innerText = 'Score: 0';
    birdY = canvas.height / 2;
    velocityY = 0;
    
    if (gameLoop) cancelAnimationFrame(gameLoop);
    update();
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoop);
    saveHighScore();
    
    const scores = JSON.parse(localStorage.getItem('birdgame_scores') || '[]');
    const best = scores.length > 0 ? scores[0].score : score;

    document.getElementById('gameOverModal').style.display = 'flex';
    document.getElementById('finalScore').innerText = score;
    document.getElementById('bestScore').innerText = best;
}

function restartGame() {
    isStarted = false;
    isGameOver = false;
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('gameOverModal').style.display = 'none';
    resize();
}

function jumpBird() {
    if (isStarted && !isGameOver) {
        velocityY = jump;
    } else if (!isStarted && document.getElementById('highScoresModal').style.display === 'none') {
        startGame();
    }
}

function saveHighScore() {
    if (score === 0) return;
    let scores = JSON.parse(localStorage.getItem('birdgame_scores') || '[]');
    const newRecord = {
        score: score,
        date: new Date().toLocaleDateString()
    };
    scores.push(newRecord);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('birdgame_scores', JSON.stringify(scores.slice(0, 5)));
}

function showHighScores() {
    const scores = JSON.parse(localStorage.getItem('birdgame_scores') || '[]');
    const list = document.getElementById('highScoresList');
    list.innerHTML = '';
    if (scores.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">No records yet.</p>';
    } else {
        scores.forEach((s, i) => {
            const item = document.createElement('div');
            item.className = 'record-item';
            item.innerHTML = `<span>#${i+1} ${s.date}</span> <strong>${s.score}</strong>`;
            list.appendChild(item);
        });
    }
    document.getElementById('highScoresModal').style.display = 'flex';
}

function closeHighScores() {
    document.getElementById('highScoresModal').style.display = 'none';
}

// 입력 리스너
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jumpBird();
    }
});
canvas.addEventListener('mousedown', (e) => { e.preventDefault(); jumpBird(); });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jumpBird(); }, {passive: false});
document.getElementById('jumpButton').addEventListener('mousedown', (e) => { e.preventDefault(); jumpBird(); });
document.getElementById('jumpButton').addEventListener('touchstart', (e) => { e.preventDefault(); jumpBird(); }, {passive: false});

function update() {
    if (!isStarted || isGameOver) return;

    velocityY += gravity;
    birdY += velocityY;

    let collisionDetected = false;
    const pScale = Math.max(scale, 1.0);

    for (let i = 0; i < pipe.length; i++) {
        pipe[i].x -= (2.5 * scale);

        if (pipe[i].x < canvas.width * 0.5 && pipe[i].added !== true) {
            pipe[i].added = true;
            pipe.push({
                x: canvas.width,
                y: Math.floor(Math.random() * (pipeNorth.height * pScale * 0.6)) - pipeNorth.height * pScale + (50 * scale)
            });
        }

        if (!pipe[i].scored && pipe[i].x + pipeNorth.width * pScale < birdX) {
            pipe[i].scored = true;
            score++;
            document.getElementById('scoreDisplay').innerText = 'Score: ' + score;
        }

        const p = 6 * scale;
        const bW = birdImg.width * birdScale;
        const bH = birdImg.height * birdScale;
        const pW = pipeNorth.width * pScale;
        const pH = pipeNorth.height * pScale;

        if (
            (birdX + bW - p >= pipe[i].x && birdX + p <= pipe[i].x + pW &&
            (birdY + p <= pipe[i].y + pH || birdY + bH - p >= pipe[i].y + pH + pipeGap)) ||
            birdY + bH >= canvas.height || birdY <= 0
        ) {
            collisionDetected = true;
        }
    }

    pipe = pipe.filter(p => p.x > -pipeNorth.width * pScale * 2);

    render();

    if (collisionDetected) {
        gameOver();
    } else {
        gameLoop = requestAnimationFrame(update);
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    const pScale = Math.max(scale, 1.0);
    for (let i = 0; i < pipe.length; i++) {
        ctx.drawImage(pipeNorth, pipe[i].x, pipe[i].y, pipeNorth.width * pScale, pipeNorth.height * pScale);
        ctx.drawImage(pipeSouth, pipe[i].x, pipe[i].y + (pipeNorth.height * pScale) + pipeGap, pipeSouth.width * pScale, pipeSouth.height * pScale);
    }

    ctx.drawImage(birdImg, birdX, birdY, birdImg.width * birdScale, birdImg.height * birdScale);
}

let imageCount = 0;
const totalImages = 4;
function onImageLoad() {
    imageCount++;
    if (imageCount === totalImages) {
        resize();
    }
}

birdImg.onload = onImageLoad;
bgImg.onload = onImageLoad;
pipeNorth.onload = onImageLoad;
pipeSouth.onload = onImageLoad;