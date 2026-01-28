var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

const baseWidth = 500;
const baseHeight = 200;
let scaleX = 1;
let scaleY = 1;
let gameInitialized = false;

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    scaleX = canvas.width / baseWidth;
    scaleY = canvas.height / baseHeight;

    if (!gameInitialized) {
        initializeGame();
        gameInitialized = true;
    }
    // Redraw the scene after resizing
    callFrames(); // Or a dedicated redraw function
}

window.addEventListener('resize', resizeCanvas, false);


function scaleValue(value) {
    // Using scaleX as the primary scaling factor for simplicity
    return value * scaleX;
}

var cactusArr = [];
var airplaneArr = [];
var cloudArr = [];
var timer = 0.0;
var isJump = false;
var animId = 0;
var dino;

const countElId = document.getElementById("countNumber");

function initializeGame() {
    dino = {
        x: scaleValue(100),
        y: scaleValue(150),
        width: scaleValue(10),
        height: scaleValue(50),
        draw() {
            const Img = new Image(this.width, this.height);
            Img.src = "./img/main_airplane.png";
            ctx.drawImage(Img, this.x, this.y, this.width, this.height);
        }
    };
    // Restart ticker, etc.
    restartCallFrame();
}


class Airplane {
    constructor() {
        this.x = canvas.width;
        this.y = scaleValue(10);
        this.width = scaleValue(10);
        this.height = scaleValue(5);
    }
    draw() {
        const Img = new Image(this.width, this.height);
        Img.src = "./img/airplane.png";
        ctx.drawImage(Img, this.x, this.y, this.width, this.height);
    }
}

class Cactus {
    constructor() {
        this.x = canvas.width;
        this.y = scaleValue(150);
        this.width = scaleValue(10);
        this.height = scaleValue(10);
    }
    draw() {
        const Img = new Image(this.width, this.height);
        Img.src = "./img/transport.png";
        ctx.drawImage(Img, this.x, this.y, this.width, this.height);
    }
}

class Cloud {
    constructor() {
        this.x = canvas.width;
        this.y = scaleValue(10);
        this.width = scaleValue(10);
        this.height = scaleValue(50);
    }
    draw() {
        const Img = new Image(this.width, this.height);
        Img.src = "./img/cloud.png";
        ctx.drawImage(Img, this.x, this.y, this.width, this.height);
    }
}

function handleTick(event) {
    if (!event.paused) {
        callFrames();
    }
}

function callFrames() {
    if (!gameInitialized) return; // Don't draw until initialized
    timer++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (timer === 1 || timer % 480 === 0) {
        for (let t = 0; t < 2; t++) {
            let cloud = new Cloud();
            cloud.x = scaleValue(-100 + (t * 280));
            cloudArr.push(cloud);
        }
    }
    if (timer % 80 === 0) {
        cactusArr.push(new Cactus());
    }
    if (timer % 240 === 0) {
        airplaneArr.push(new Airplane());
    }

    let countNum = Number(countElId.value);

    cloudArr.forEach((cloud, index) => {
        cloud.x -= scaleValue(0.5);
        cloud.draw();
        if (cloud.x < -cloud.width) {
            cloudArr.splice(index, 1);
        }
    });

    dino.draw();

    airplaneArr.forEach((airplane, index) => {
        airplane.x -= scaleValue(1);
        airplane.draw();
        if (airplane.x < -airplane.width) {
            airplaneArr.splice(index, 1);
            countElId.value = countNum + 1;
        }
        if (isCollision(dino, airplane)) {
            crashEvent();
        }
    });

    cactusArr.forEach((cactus, index) => {
        cactus.x -= scaleValue(2);
        cactus.draw();
        if (cactus.x < -cactus.width) {
            cactusArr.splice(index, 1);
            countElId.value = countNum + 1;
        }
        if (isCollision(dino, cactus)) {
            crashEvent();
        }
    });

    if (isJump && dino.y > 0) {
        dino.y -= scaleValue(3);
        if (dino.y <= 0) {
            isJump = false;
        }
    } else {
        if (dino.y < scaleValue(150)) {
            dino.y += scaleValue(3);
        }
    }
}

function isCollision(rect1, rect2) {
    if (!rect1 || !rect2) return false;
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.height + rect1.y > rect2.y;
}

function crashEvent() {
    alert("아이구 부딪쳤네!!");
    countElId.value = 0;
    createjs.Ticker.removeAllEventListeners();
}

function eventJump() {
    if (dino && dino.y >= scaleValue(140)) { // Allow jumping only from the ground
        isJump = true;
    }
}

function eventStopJump() {
    isJump = false;
}

function restartCallFrame() {
    cactusArr = [];
    airplaneArr = [];
    cloudArr = [];
    timer = 0;
    if (dino) {
      dino.y = scaleValue(150);
    }
    countElId.value = 0;
    createjs.Ticker.removeAllEventListeners(); // remove existing ticker
    createjs.Ticker.addEventListener("tick", handleTick);
    createjs.Ticker.framerate = 60;
}

window.addEventListener('keydown', (event) => {
    if (/[j]/.test(event.key)) {
        eventJump();
    } else if (/[s]/.test(event.key)) {
        eventStopJump();
    } else if (/[r]/.test(event.key)) {
        restartCallFrame();
    }
});

// Finally, call resizeCanvas to start everything
resizeCanvas();