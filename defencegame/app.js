const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const messageEl = document.getElementById('message');

// 게임 설정
canvas.width = 800;
canvas.height = 400;

let score = 0;
let lives = 10;
let enemies = [];
let missiles = [];
let spawnRate = 2000; // ms
let lastSpawn = 0;
let isGameActive = false;
let animationId;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

class Enemy {
    constructor() {
        this.radius = 15 + Math.random() * 10;
        this.x = -this.radius;
        this.y = Math.random() * (canvas.height - 40) + 20;
        this.speed = 1 + Math.random() * 2;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        this.health = Math.ceil(this.radius / 10);
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    update() {
        this.x += this.speed;
    }
}

class Missile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.speed = 10;
        this.radius = 4;
        this.color = '#f1c40f';
        
        const angle = Math.atan2(targetY - y, targetX - x);
        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#e67e22';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

function spawnEnemy() {
    const now = Date.now();
    if (now - lastSpawn > spawnRate) {
        enemies.push(new Enemy());
        lastSpawn = now;
        
        if (spawnRate > 500) spawnRate -= 10;
    }
}

function update() {
    if (!isGameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 'Castle' 구역 표시 (오른쪽 끝)
    ctx.fillStyle = 'rgba(192, 57, 43, 0.3)';
    ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
    ctx.strokeStyle = '#c0392b';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width - 50, 0);
    ctx.lineTo(canvas.width - 50, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cannon 그리기 (마우스를 따라가는 발사대)
    const originX = canvas.width - 50;
    const originY = canvas.height / 2;
    const angle = Math.atan2(mouseY - originY, mouseX - originX);
    
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, -10, 30, 20); // 발사구
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    spawnEnemy();

    // 미사일 업데이트 및 그리기
    for (let i = missiles.length - 1; i >= 0; i--) {
        const missile = missiles[i];
        missile.update();
        missile.draw();

        // 화면 밖으로 나간 미사일 제거
        if (missile.x < 0 || missile.x > canvas.width || missile.y < 0 || missile.y > canvas.height) {
            missiles.splice(i, 1);
            continue;
        }

        // 미사일과 적의 충돌 확인
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = Math.hypot(missile.x - enemy.x, missile.y - enemy.y);
            if (dist < missile.radius + enemy.radius) {
                enemies.splice(j, 1);
                missiles.splice(i, 1);
                score += 10;
                scoreEl.textContent = `Score: ${score}`;
                break;
            }
        }
    }

    // 적 업데이트 및 그리기
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.draw();

        if (enemy.x - enemy.radius > canvas.width - 50) {
            enemies.splice(i, 1);
            lives--;
            livesEl.textContent = `Lives: ${lives}`;
            
            if (lives <= 0) {
                gameOver();
            }
        }
    }

    animationId = requestAnimationFrame(update);
}

function initGame() {
    score = 0;
    lives = 10;
    enemies = [];
    missiles = [];
    spawnRate = 2000;
    scoreEl.textContent = `Score: ${score}`;
    livesEl.textContent = `Lives: ${lives}`;
    overlay.style.display = 'none';
    isGameActive = true;
    lastSpawn = Date.now();
    update();
}

function gameOver() {
    isGameActive = false;
    cancelAnimationFrame(animationId);
    overlay.style.display = 'flex';
    messageEl.textContent = 'GAME OVER';
    startBtn.textContent = 'Restart Game';
}

canvas.addEventListener('mousedown', (e) => {
    if (!isGameActive) return;

    const rect = canvas.getBoundingClientRect();
    const currentMouseX = e.clientX - rect.left;
    const currentMouseY = e.clientY - rect.top;

    // 성벽에서 미사일 발사 (오른쪽에서 왼쪽/클릭 방향으로)
    const originX = canvas.width - 50;
    const originY = canvas.height / 2;
    missiles.push(new Missile(originX, originY, currentMouseX, currentMouseY));
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

startBtn.addEventListener('click', initGame);

// 초기 화면 설정
messageEl.textContent = 'Defense the Castle!';
