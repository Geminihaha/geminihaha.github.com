var stage;
var grid = [];
var cellSize = 50;
var currentSize = 9;
var currentLevel = "easy";
var currentBoard = [];
var initialPuzzle = [];
var selectedNumber = 1; // 기본 선택 숫자
var errors = []; // 틀린 칸 좌표 저장 [{r, c}, ...]

var puzzles = {
    "9": {
        "easy": [
            [5, 3, 0, 0, 7, 0, 0, 0, 0], [6, 0, 0, 1, 9, 5, 0, 0, 0], [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3], [4, 0, 0, 8, 0, 3, 0, 0, 1], [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0], [0, 0, 0, 4, 1, 9, 0, 0, 5], [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ],
        "medium": [
            [0, 0, 0, 6, 0, 0, 4, 0, 0], [7, 0, 0, 0, 0, 3, 6, 0, 0], [0, 0, 0, 0, 9, 1, 0, 8, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 0, 1, 8, 0, 0, 0, 3], [0, 0, 0, 3, 0, 6, 0, 4, 5],
            [0, 4, 0, 2, 0, 0, 0, 6, 0], [9, 0, 3, 0, 0, 0, 0, 0, 0], [0, 2, 0, 0, 0, 0, 1, 0, 0]
        ],
        "hard": [
            [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 3, 0, 8, 5], [0, 0, 1, 0, 2, 0, 0, 0, 0],
            [0, 0, 0, 5, 0, 7, 0, 0, 0], [0, 0, 4, 0, 0, 0, 1, 0, 0], [0, 9, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 7, 3], [0, 0, 2, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 4, 0, 0, 0, 9]
        ]
    },
    "6": {
        "easy": [
            [0, 4, 0, 0, 2, 0], [2, 0, 0, 0, 0, 1], [0, 0, 4, 1, 0, 0],
            [0, 0, 3, 2, 0, 0], [1, 0, 0, 0, 0, 5], [0, 5, 0, 0, 4, 0]
        ],
        "medium": [
            [0, 0, 0, 4, 0, 0], [0, 1, 0, 0, 6, 0], [0, 0, 1, 0, 0, 0],
            [0, 0, 0, 5, 0, 0], [0, 2, 0, 0, 4, 0], [0, 0, 3, 0, 0, 0]
        ],
        "hard": [
            [0, 0, 0, 0, 0, 0], [0, 0, 2, 0, 1, 0], [3, 0, 0, 0, 0, 5],
            [6, 0, 0, 0, 0, 4], [0, 5, 0, 4, 0, 0], [0, 0, 0, 0, 0, 0]
        ]
    }
};

function init() {
    stage = new createjs.Stage("gameCanvas");
    stage.enableMouseOver();
    createjs.Touch.enable(stage);

    var saved = localStorage.getItem("sudoku_state_v2");
    if (saved) {
        var data = JSON.parse(saved);
        currentSize = data.size || 9;
        currentLevel = data.level || "easy";
        currentBoard = data.board;
        initialPuzzle = data.initialBoard || JSON.parse(JSON.stringify(currentBoard));
        
        if (data.mode) document.getElementById("modeSelect").value = data.mode;
        if (data.puzzleNum) document.getElementById("puzzleNum").value = data.puzzleNum;
        
        document.getElementById("sizeSelect").value = currentSize;
        document.getElementById("levelSelect").value = currentLevel;
        
        toggleModeUI();
        createKeypad();
        refreshGrid();
    } else {
        changeConfig();
    }
}

function changeConfig() {
    currentSize = parseInt(document.getElementById("sizeSelect").value);
    currentLevel = document.getElementById("levelSelect").value;
    createKeypad();
    resetGame();
}

function toggleModeUI() {
    var mode = document.getElementById("modeSelect").value;
    document.getElementById("puzzleNum").style.display = (mode === "select") ? "inline-block" : "none";
}

function toggleMode() {
    toggleModeUI();
    changeConfig();
}

function resetGame() {
    localStorage.removeItem("sudoku_state_v2");
    var basePuzzle = puzzles[currentSize][currentLevel];
    var mode = document.getElementById("modeSelect").value;
    
    if (mode === "select") {
        var num = parseInt(document.getElementById("puzzleNum").value) || 1;
        initialPuzzle = shuffleSudoku(JSON.parse(JSON.stringify(basePuzzle)), num);
    } else {
        initialPuzzle = shuffleSudoku(JSON.parse(JSON.stringify(basePuzzle)), Math.random() * 1000000);
    }
    
    currentBoard = JSON.parse(JSON.stringify(initialPuzzle));
    errors = [];
    refreshGrid();
}

function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function shuffleSudoku(board, seed) {
    var size = board.length;
    var s = seed || 1;
    
    var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, size);
    var shuffledNums = JSON.parse(JSON.stringify(nums)).sort(() => seededRandom(s++) - 0.5);
    var map = {};
    nums.forEach((n, i) => map[n] = shuffledNums[i]);

    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
            if (board[r][c] !== 0) board[r][c] = map[board[r][c]];
        }
    }

    var stepY = (size === 9) ? 3 : 2;
    for (var i = 0; i < size; i += stepY) {
        var group = board.slice(i, i + stepY);
        group.sort(() => seededRandom(s++) - 0.5);
        for (var j = 0; j < stepY; j++) board[i + j] = group[j];
    }

    var stepX = 3;
    for (var i = 0; i < size; i += stepX) {
        for (var n = 0; n < 2; n++) {
            var c1 = i + Math.floor(seededRandom(s++) * stepX);
            var c2 = i + Math.floor(seededRandom(s++) * stepX);
            for (var r = 0; r < size; r++) {
                var temp = board[r][c1];
                board[r][c1] = board[r][c2];
                board[r][c2] = temp;
            }
        }
    }
    return board;
}

function refreshGrid() {
    stage.removeAllChildren();
    grid = [];
    cellSize = 450 / currentSize;
    drawGrid();
    saveState();
    stage.update();
}

function saveState() {
    var data = { 
        size: currentSize, 
        level: currentLevel, 
        mode: document.getElementById("modeSelect").value,
        puzzleNum: document.getElementById("puzzleNum").value,
        initialBoard: initialPuzzle,
        board: currentBoard 
    };
    localStorage.setItem("sudoku_state_v2", JSON.stringify(data));
}

function createKeypad() {
    var keypad = document.getElementById("numberKeypad");
    keypad.innerHTML = "";
    for (var i = 1; i <= currentSize; i++) {
        var btn = document.createElement("button");
        btn.className = "key-btn" + (selectedNumber === i ? " selected" : "");
        btn.innerText = i;
        btn.onclick = (function(num) { return function() { selectNumber(num); }; })(i);
        keypad.appendChild(btn);
    }
    var eraser = document.createElement("button");
    eraser.className = "key-btn eraser" + (selectedNumber === 0 ? " selected" : "");
    eraser.innerText = "clear";
    eraser.onclick = function() { selectNumber(0); };
    keypad.appendChild(eraser);
}

function selectNumber(num) {
    selectedNumber = num;
    var btns = document.querySelectorAll(".key-btn");
    btns.forEach(function(btn) {
        btn.classList.remove("selected");
        if (btn.innerText == num || (num === 0 && btn.innerText === "clear")) {
            btn.classList.add("selected");
        }
    });
}

function updateHints() {
    refreshGrid();
}

function drawGrid() {
    for (var row = 0; row < currentSize; row++) {
        grid[row] = [];
        for (var col = 0; col < currentSize; col++) {
            var cell = createCell(row, col, currentBoard[row][col]);
            grid[row][col] = cell;
            stage.addChild(cell);
        }
    }
    var lines = new createjs.Shape();
    lines.graphics.setStrokeStyle(3).beginStroke("#000");
    var stepX = 3;
    var stepY = (currentSize === 9) ? 3 : 2;
    for (var i = 0; i <= currentSize; i += stepX) {
        lines.graphics.moveTo(i * cellSize, 0).lineTo(i * cellSize, 450);
    }
    for (var j = 0; j <= currentSize; j += stepY) {
        lines.graphics.moveTo(0, j * cellSize).lineTo(450, j * cellSize);
    }
    stage.addChild(lines);
}

function checkWin() {
    var full = true;
    errors = [];
    for (var r = 0; r < currentSize; r++) {
        for (var c = 0; c < currentSize; c++) {
            if (currentBoard[r][c] === 0) {
                full = false;
            } else {
                if (!isCellValid(r, c, currentBoard[r][c])) {
                    errors.push({r: r, c: c});
                }
            }
        }
    }
    if (full) {
        if (errors.length === 0) alert("축하합니다! 정답입니다!");
        else {
            alert("틀린 부분이 있습니다. 빨간색 칸을 확인하세요.");
            refreshGrid();
        }
    }
}

function isCellValid(row, col, num) {
    for (var i = 0; i < currentSize; i++) {
        if (i !== col && currentBoard[row][i] === num) return false;
        if (i !== row && currentBoard[i][col] === num) return false;
    }
    var stepX = 3;
    var stepY = (currentSize === 9) ? 3 : 2;
    var startRow = Math.floor(row / stepY) * stepY;
    var startCol = Math.floor(col / stepX) * stepX;
    for (var r = 0; r < stepY; r++) {
        for (var c = 0; c < stepX; c++) {
            var currR = startRow + r;
            var currC = startCol + c;
            if ((currR !== row || currC !== col) && currentBoard[currR][currC] === num) return false;
        }
    }
    return true;
}

function createCell(row, col, value) {
    var container = new createjs.Container();
    container.x = col * cellSize;
    container.y = row * cellSize;
    var isError = errors.some(e => e.r === row && e.c === col);
    var bgColor = isError ? "#f8d7da" : "#fff";
    var bg = new createjs.Shape();
    bg.graphics.beginStroke("#ccc").beginFill(bgColor).drawRect(0, 0, cellSize, cellSize);
    container.addChild(bg);
    if (value !== 0) {
        var fontSize = Math.floor(cellSize * 0.6);
        var textColor = isError ? "#dc3545" : (initialPuzzle[row][col] !== 0 ? "#000" : "#007bff");
        var text = new createjs.Text(value, "bold " + fontSize + "px Arial", textColor);
        text.textAlign = "center";
        text.textBaseline = "middle";
        text.x = cellSize / 2;
        text.y = cellSize / 2;
        container.addChild(text);
    } else if (document.getElementById("hintToggle").checked) {
        var possible = getPossibleNumbers(row, col);
        var hintFontSize = Math.floor(cellSize * 0.2);
        var cols = 3;
        possible.forEach(function(num) {
            var hText = new createjs.Text(num, hintFontSize + "px Arial", "#999");
            var r = Math.floor((num - 1) / cols);
            var c = (num - 1) % cols;
            hText.x = (c + 0.5) * (cellSize / cols);
            hText.y = (r + 0.5) * (cellSize / (currentSize/cols + 1));
            container.addChild(hText);
        });
    }
    if (initialPuzzle[row][col] === 0) {
        container.on("click", function() {
            currentBoard[row][col] = selectedNumber;
            refreshGrid();
            checkWin();
        });
    }
    return container;
}

function getPossibleNumbers(row, col) {
    var possible = [];
    for (var n = 1; n <= currentSize; n++) {
        if (isSafe(row, col, n)) possible.push(n);
    }
    return possible;
}

function isSafe(row, col, num) {
    for (var i = 0; i < currentSize; i++) {
        if (currentBoard[row][i] === num || currentBoard[i][col] === num) return false;
    }
    var stepX = 3;
    var stepY = (currentSize === 9) ? 3 : 2;
    var startRow = Math.floor(row / stepY) * stepY;
    var startCol = Math.floor(col / stepX) * stepX;
    for (var r = 0; r < stepY; r++) {
        for (var c = 0; c < stepX; c++) {
            if (currentBoard[startRow + r][startCol + c] === num) return false;
        }
    }
    return true;
}