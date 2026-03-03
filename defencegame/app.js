const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const missileInfoEl = document.getElementById('missile-info');
const overlay = document.getElementById('overlay');
const upgradeModal = document.getElementById('upgrade-modal');
const startBtn = document.getElementById('start-btn');
const messageEl = document.getElementById('message');
const upgradeBtns = document.querySelectorAll('.upgrade-btn');

// 게임 내부 논리 해상도 (고정)
const INTERNAL_WIDTH = 800;
const INTERNAL_HEIGHT = 400;

canvas.width = INTERNAL_WIDTH;
canvas.height = INTERNAL_HEIGHT;

let score = 0;
let lives = 10;
let enemies = [];
let missiles = [];
let spawnRate = 2000;
let lastSpawn = 0;
let isGameActive = false;
let isPaused = false;
let animationId;
let mouseX = INTERNAL_WIDTH / 2;
let mouseY = INTERNAL_HEIGHT / 2;

let missileLevel = 1;
let missileDamage = 1;
let missileRadius = 4;
let nextLevelScore = 100;
let weaponType = 'normal';
let fireCooldown = 400;
let lastFire = 0;
let isMouseDown = false;

// 좌표 변환 함수 (화면 터치 좌표 -> 게임 논리 좌표)
function getGameCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = INTERNAL_WIDTH / rect.width;
    const scaleY = INTERNAL_HEIGHT / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

class Enemy {
    constructor() {
        const baseHealth = Math.floor(score / 1500) + 1;
        this.maxHealth = Math.ceil(Math.random() * 3) + baseHealth;
        this.health = this.maxHealth;
        this.radius = 12 + this.health * 3;
        this.x = -this.radius;
        this.y = Math.random() * (INTERNAL_HEIGHT - 40) + 20;
        this.speed = (1.2 + Math.random() * 1.5) / (this.health * 0.3 + 0.7);
        const hue = Math.max(0, 120 - (this.health * 15));
        this.color = `hsl(${hue}, 80%, 50%)`;
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

        const barWidth = this.radius * 1.5;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 10, barWidth, barHeight);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 10, barWidth * healthPercent, barHeight);
    }

    update() {
        this.x += this.speed;
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
}

class Missile {
    constructor(x, y, targetX, targetY, angleOffset = 0) {
        this.x = x;
        this.y = y;
        this.speed = 10 + (missileLevel * 0.5);
        this.radius = missileRadius;
        this.damage = missileDamage;
        this.color = this.getColor();
        
        let angle = Math.atan2(targetY - y, targetX - x) + angleOffset;
        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };
    }

    getColor() {
        if (weaponType === 'rapid') return '#1abc9c';
        if (weaponType === 'power') return '#e74c3c';
        if (weaponType === 'multi') return '#9b59b6';
        return '#f1c40f';
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
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
        if (spawnRate > 600) spawnRate -= 10;
    }
}

function fireMissile() {
    if (!isGameActive || isPaused) return;
    const now = Date.now();
    if (now - lastFire < fireCooldown) return;

    const originX = INTERNAL_WIDTH - 50;
    const originY = INTERNAL_HEIGHT / 2;

    if (weaponType === 'multi') {
        missiles.push(new Missile(originX, originY, mouseX, mouseY, -0.2));
        missiles.push(new Missile(originX, originY, mouseX, mouseY, 0));
        missiles.push(new Missile(originX, originY, mouseX, mouseY, 0.2));
    } else {
        missiles.push(new Missile(originX, originY, mouseX, mouseY));
    }

    lastFire = now;
}

function updateMissileLevel() {
    if (score >= nextLevelScore) {
        isPaused = true;
        isMouseDown = false; 
        upgradeModal.style.display = 'block';
        nextLevelScore += 1000 + (missileLevel * 500);
    }
}

function selectUpgrade(type) {
    weaponType = type;
    missileLevel++;
    
    if (type === 'rapid') {
        missileDamage = Math.max(1, Math.floor(missileLevel / 3));
        fireCooldown = 150;
        missileRadius = 3;
    } else if (type === 'power') {
        missileDamage = missileLevel * 2;
        fireCooldown = 800;
        missileRadius = 8;
    } else if (type === 'multi') {
        missileDamage = Math.max(1, Math.floor(missileLevel / 2));
        fireCooldown = 600;
        missileRadius = 4;
    }

    upgradeModal.style.display = 'none';
    isPaused = false;
    updateMissileInfo();
}

function updateMissileInfo() {
    const typeNames = { normal: '기본', rapid: '속사', power: '강력', multi: '확산' };
    missileInfoEl.textContent = `Type: ${typeNames[weaponType]} | Lv: ${missileLevel} | Dmg: ${missileDamage}`;
}

function update() {
    if (!isGameActive) return;
    if (isPaused) {
        animationId = requestAnimationFrame(update);
        return;
    }

    ctx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

    // Castle 구역
    ctx.fillStyle = 'rgba(192, 57, 43, 0.3)';
    ctx.fillRect(INTERNAL_WIDTH - 50, 0, 50, INTERNAL_HEIGHT);

    // Cannon
    const originX = INTERNAL_WIDTH - 50;
    const originY = INTERNAL_HEIGHT / 2;
    const angle = Math.atan2(mouseY - originY, mouseX - originX);
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, -10, 30 + (missileLevel * 2), 20);
    ctx.restore();

    if (isMouseDown) fireMissile();
    spawnEnemy();
    updateMissileLevel();

    // 미사일 업데이트
    for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        m.update();
        m.draw();
        if (m.x < 0 || m.x > INTERNAL_WIDTH || m.y < 0 || m.y > INTERNAL_HEIGHT) {
            missiles.splice(i, 1);
            continue;
        }
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dist = Math.hypot(m.x - e.x, m.y - e.y);
            if (dist < m.radius + e.radius) {
                const isDead = e.takeDamage(m.damage);
                missiles.splice(i, 1);
                if (isDead) {
                    score += 10 * e.maxHealth;
                    enemies.splice(j, 1);
                    scoreEl.textContent = `Score: ${score}`;
                }
                break;
            }
        }
    }

    // 적 업데이트
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update();
        e.draw();
        if (e.x - e.radius > INTERNAL_WIDTH - 50) {
            enemies.splice(i, 1);
            lives--;
            livesEl.textContent = `Lives: ${lives}`;
            if (lives <= 0) gameOver();
        }
    }

    animationId = requestAnimationFrame(update);
}

function initGame() {
    score = 0;
    lives = 10;
    enemies = [];
    missiles = [];
    missileLevel = 1;
    missileDamage = 1;
    fireCooldown = 400;
    weaponType = 'normal';
    nextLevelScore = 100;
    scoreEl.textContent = `Score: ${score}`;
    livesEl.textContent = `Lives: ${lives}`;
    updateMissileInfo();
    overlay.style.display = 'none';
    upgradeModal.style.display = 'none';
    isGameActive = true;
    isPaused = false;
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

// 이벤트 리스너: 마우스 & 터치 통합
function handleDown(e) {
    isMouseDown = true;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const coords = getGameCoords(clientX, clientY);
    mouseX = coords.x;
    mouseY = coords.y;
    fireMissile();
}

function handleMove(e) {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX !== undefined && clientY !== undefined) {
        const coords = getGameCoords(clientX, clientY);
        mouseX = coords.x;
        mouseY = coords.y;
    }
}

function handleUp() {
    isMouseDown = false;
}

canvas.addEventListener('mousedown', handleDown);
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDown(e);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e);
}, { passive: false });

window.addEventListener('touchend', handleUp);

upgradeBtns.forEach(btn => {
    btn.addEventListener('click', () => selectUpgrade(btn.dataset.type));
});

startBtn.addEventListener('click', initGame);
messageEl.textContent = 'Defense the Castle!';
updateMissileInfo();
