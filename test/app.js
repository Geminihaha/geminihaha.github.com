var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 100;

var dino = {
    x : 10,
    y : 200,
    width : 50,
    height : 50,
    draw(){
        ctx.fillStyle = 'green'
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}
dino.x += 1
dino.draw();

class Cactus {
    constructor(){
    this.x = 500;
    this.y = 200;
    this.width = 50;
    this.height = 50;
    }
    draw()
    {
        ctx.fillStyle = 'red'
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}

var cactus = new Cactus();


function callFrames(){
    requestAnimationFrame(callFrames);
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    cactus.x -= 1
    cactus.draw();
    dino.draw();
}

callFrames();

