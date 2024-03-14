var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 500;

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


var cactusArr = [];
var timer = 0.0;

function callFrames(){
    requestAnimationFrame(callFrames);
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    timer++

    if (timer % 120 === 0){
        var cactus = new Cactus();
        cactusArr.push(cactus)
    }

    dino.draw();
    var i = 0;
    for (i = 0 ; i < cactusArr.length; i++){
        cactusArr[i].x--;
        cactusArr[i].draw();
    }
//    cactusArr.forEach((cactusItem)=>{
//        cactusItem.x--;
//        cactusItem.draw();
//    })

}

callFrames();
