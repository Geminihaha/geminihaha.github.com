
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const bird = new Image();
const bg = new Image();
const pipeNorth = new Image();
const pipeSouth = new Image();

bird.src = './assets/bird_ca.png';
bg.src = '../assets/art/sky.png';
pipeNorth.src = './assets/tree_top.png';
pipeSouth.src = './assets/tree_bottom.png';

let birdX = 10;
let birdY = 150;
let velocityY = 0;
const gravity = 0.1;
const jump = -2;

let score = 0;
let gameLoop;

const pipe = [];

function gameOver() {
    cancelAnimationFrame(gameLoop);
    if (confirm('Game over! Play again?')) {
        location.reload();
    }
}

function jumpBird() {
    velocityY = jump;
}

document.addEventListener('keydown', jumpBird);
document.getElementById('jumpButton').addEventListener('click', jumpBird);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    for (let i = 0; i < pipe.length; i++) {
        ctx.drawImage(pipeNorth, pipe[i].x, pipe[i].y);
        ctx.drawImage(pipeSouth, pipe[i].x, pipe[i].y + pipeNorth.height + 80);

        pipe[i].x--;

        if (pipe[i].x === 125) {
            pipe.push({
                x: canvas.width,
                y: Math.floor(Math.random() * pipeNorth.height) - pipeNorth.height
            });
        }

        if (pipe[i] && pipe[i].x < -pipeNorth.width) {
            pipe.splice(i, 1);
            i--;
            continue;
        }

        if ((birdX + bird.width >= pipe[i].x && birdX <= pipe[i].x + pipeNorth.width &&
            (birdY <= pipe[i].y + pipeNorth.height || birdY + bird.height >= pipe[i].y + pipeNorth.height + 80)) ||
            birdY + bird.height >= canvas.height) {
            gameOver();
            return;
        }

        if (pipe[i] && pipe[i].x === 5) {
            score++;
        }
    }

    ctx.drawImage(bird, birdX, birdY);

    velocityY += gravity;
    birdY += velocityY;

    ctx.fillStyle = '#000';
    ctx.font = '20px Verdana';
    ctx.fillText('Score: ' + score, 10, canvas.height - 20);

    gameLoop = requestAnimationFrame(draw);
}

let imageCount = 0;
const totalImages = 4;

function onImageLoad() {
    imageCount++;
    if (imageCount === totalImages) {
        pipe.push({
            x: canvas.width,
            y: 0
        });
        draw();
    }
}

bird.onload = onImageLoad;
bg.onload = onImageLoad;
pipeNorth.onload = onImageLoad;
pipeSouth.onload = onImageLoad;
