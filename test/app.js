var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 200;
var cactusArr = [];
var timer = 0.0;
var isJump = false;
var animId = 0;

var dino = {
    x : 100,
    y : 100,
    width : 10,
    height : 50,
    draw(){
        // ctx.fillStyle = 'green'
        // ctx.fillRect(this.x, this.y, this.width, this.height)
        const Img = new Image(this.width, this.height);
        Img.src = "ball.png";
        // Img.addEventListener("load", (e) => {
            // ctx.drawImage(Img, this.x, this.y);
        //   });
        ctx.drawImage(Img, this.x, this.y);
    }
}

class Cactus {
    constructor(){
    this.x = 500;
    this.y = 100;
    this.width = 10;
    this.height = 50;
    }
    draw()
    {
        // ctx.fillStyle = 'red'
        // ctx.fillRect(this.x, this.y, this.width, this.height)
        const Img = new Image(this.width, this.height);
        Img.src = "wall.png";
        // Img.addEventListener("load", (e) => {
            // ctx.drawImage(Img, this.x, this.y);
        //   });
        ctx.drawImage(Img, this.x, this.y);
        
    }
}

function callFrames(){
    animId = requestAnimationFrame(callFrames);
    timer++

    if (timer % 240 === 0){
        var cactus = new Cactus();
        cactusArr.push(cactus)
    }

    if (timer % 4/*  */ === 0){
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        dino.draw();
        var i = 0;
        for (i = 0 ; i < cactusArr.length; i++){
            cactusArr[i].x -= 2;
            cactusArr[i].draw();
            if (cactusArr[i].x == 0.0){
                cactusArr.splice(0, 1)
            }
            if (dino.x >= cactusArr[i].x && dino.x <= cactusArr[i].x + 10
                && dino.y >= cactusArr[i].y && dino.y <= cactusArr[i].y + 50 
                )
                {
                    console.error("crash!!");
                    cancelAnimationFrame(animId);
                    break;
                }

        }
    }

    if (isJump && dino.y >= -0.01){
        dino.y -= 3
        if (dino.y <= -0.01){
            isJump = false
        }
    } else {
        if (dino.y < 100){
            dino.y += 3
        }
    }
}

function eventJump(){
    isJump = true
}

function restartCallFrame(){
    cactusArr.splice(0, cactusArr.length)
    callFrames();
}

callFrames();

//    cactusArr.forEach((cactusItem)=>{
//        cactusItem.x--;
//        cactusItem.draw();

//         if (cactusItem.x == 0.0){
//             cactusArr.splice
//         }
//    })

