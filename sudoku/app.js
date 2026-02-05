var stage;
var grid = [];
var cellSize = 50;
var currentSize = 9;
var currentLevel = "easy";
var currentBoard = [];
var initialPuzzle = [];
var selectedNumber = 1; 
var errors = []; 

// 완벽하게 풀린 기본 정답판 (3x2 및 3x3 규격 준수)
var solvedBases = {
    "9": [
        [1, 2, 3, 4, 5, 6, 7, 8, 9], [4, 5, 6, 7, 8, 9, 1, 2, 3], [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 1, 5, 6, 4, 8, 9, 7], [5, 6, 4, 8, 9, 7, 2, 3, 1], [8, 9, 7, 2, 3, 1, 5, 6, 4],
        [3, 1, 2, 6, 4, 5, 9, 7, 8], [6, 4, 5, 9, 7, 8, 3, 1, 2], [9, 7, 8, 3, 1, 2, 6, 4, 5]
    ],
    "6": [
        [1, 2, 3, 4, 5, 6], [4, 5, 6, 1, 2, 3],
        [2, 3, 1, 5, 6, 4], [5, 6, 4, 2, 3, 1],
        [3, 1, 2, 6, 4, 5], [6, 4, 5, 3, 1, 2]
    ]
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
        initialPuzzle = data.initialBoard;
        
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
    var mode = document.getElementById("modeSelect").value;
    var seed = (mode === "select") ? (parseInt(document.getElementById("puzzleNum").value) || 1) : Math.random() * 1000000;
    
    // 1. 정답판 생성 및 셔플
    var fullBoard = shuffleSudoku(JSON.parse(JSON.stringify(solvedBases[currentSize])), seed);
    
    // 2. 난이도에 따라 숫자 가리기
    initialPuzzle = createPuzzle(fullBoard, currentLevel, seed);
    currentBoard = JSON.parse(JSON.stringify(initialPuzzle));
    errors = [];
    refreshGrid();
}

function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function shuffleArray(array, s) {
    var m = array.length, t, i;
    while (m) {
        i = Math.floor(seededRandom(s++) * m--);
        t = array[m]; array[m] = array[i]; array[i] = t;
    }
    return {array: array, seed: s};
}

function shuffleSudoku(board, seed) {
    var size = board.length;
    var s = seed || 1;
    var stepX = 3; 
    var stepY = (size === 9) ? 3 : 2;

    // 숫자 치환
    var nums = [];
    for(var i=1; i<=size; i++) nums.push(i);
    var shuffled = shuffleArray(nums, s);
    var map = {};
    for(var i=0; i<size; i++) map[i+1] = shuffled.array[i];
    s = shuffled.seed;

    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) board[r][c] = map[board[r][c]];
    }

    // 행/열 블록 내 셔플 및 블록 그룹 셔플 생략 (정답판 무결성 유지를 위해 최소화)
    return board;
}

function createPuzzle(fullBoard, level, seed) {
    var size = fullBoard.length;
    var s = seed;
    var puzzle = JSON.parse(JSON.stringify(fullBoard));
    
    var hideCount = 0;
    if (size === 9) {
        if (level === "easy") hideCount = 40;
        else if (level === "medium") hideCount = 50;
        else hideCount = 60;
    } else {
        if (level === "easy") hideCount = 15;
        else if (level === "medium") hideCount = 20;
        else hideCount = 25;
    }

    var positions = [];
    for(var r=0; r<size; r++) for(var c=0; c<size; c++) positions.push({r:r, c:c});
    
    // 위치 섞기
    for (var i = positions.length - 1; i > 0; i--) {
        var j = Math.floor(seededRandom(s++) * (i + 1));
        var temp = positions[i];
        positions[i] = positions[j];
        positions[j] = temp;
    }

    for(var i=0; i<hideCount; i++) {
        puzzle[positions[i].r][positions[positions[i].c].c] = 0;
    }
    return puzzle;
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
        size: currentSize, level: currentLevel, 
        mode: document.getElementById("modeSelect").value,
        puzzleNum: document.getElementById("puzzleNum").value,
        initialBoard: initialPuzzle, board: currentBoard 
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
        if (btn.innerText == num || (num === 0 && btn.innerText === "clear")) btn.classList.add("selected");
    });
}

function updateHints() { refreshGrid(); }

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
    var stepX = 3; var stepY = (currentSize === 9) ? 3 : 2;
    for (var i = 0; i <= currentSize; i += stepX) lines.graphics.moveTo(i * cellSize, 0).lineTo(i * cellSize, 450);
    for (var j = 0; j <= currentSize; j += stepY) lines.graphics.moveTo(0, j * cellSize).lineTo(450, j * cellSize);
    stage.addChild(lines);
}

function showAlert(message) {
    document.getElementById("alertMessage").innerText = message;
    document.getElementById("customAlert").style.display = "flex";
}

function closeAlert() { document.getElementById("customAlert").style.display = "none"; }

function checkWin() {
    var full = true;
    errors = [];
    for (var r = 0; r < currentSize; r++) {
        for (var c = 0; c < currentSize; c++) {
            if (currentBoard[r][c] === 0) full = false;
            else if (!isCellValid(r, c, currentBoard[r][c])) errors.push({r: r, c: c});
        }
    }
    if (full) {
        if (errors.length === 0) showAlert("축하합니다! 정답입니다!");
        else showAlert("틀린 부분이 있습니다. 빨간색 칸을 확인하세요.");
    }
}

function isCellValid(row, col, num) {
    for (var i = 0; i < currentSize; i++) {
        if (i !== col && currentBoard[row][i] === num) return false;
        if (i !== row && currentBoard[i][col] === num) return false;
    }
    var stepX = 3; var stepY = (currentSize === 9) ? 3 : 2;
    var startRow = Math.floor(row / stepY) * stepY;
    var startCol = Math.floor(col / stepX) * stepX;
    for (var r = 0; r < stepY; r++) {
        for (var c = 0; c < stepX; c++) {
            var currR = startRow + r; var currC = startCol + c;
            if ((currR !== row || currC !== col) && currentBoard[currR][currC] === num) return false;
        }
    }
    return true;
}

function createCell(row, col, value) {
    var container = new createjs.Container();
    container.x = col * cellSize; container.y = row * cellSize;
    var isError = errors.some(e => e.r === row && e.c === col);
    var bg = new createjs.Shape();
    bg.graphics.beginStroke("#ccc").beginFill(isError ? "#f8d7da" : "#fff").drawRect(0, 0, cellSize, cellSize);
    container.addChild(bg);
    if (value !== 0) {
        var fontSize = Math.floor(cellSize * 0.6);
        var textColor = isError ? "#dc3545" : (initialPuzzle[row][col] !== 0 ? "#000" : "#007bff");
        var text = new createjs.Text(value, "bold " + fontSize + "px Arial", textColor);
        text.textAlign = "center"; text.textBaseline = "middle"; text.x = text.y = cellSize / 2;
        container.addChild(text);
    } else if (document.getElementById("hintToggle").checked) {
        var possible = getPossibleNumbers(row, col);
        var hintFontSize = Math.floor(cellSize * 0.2);
        var hintCols = 3;
        possible.forEach(function(num) {
            var hText = new createjs.Text(num, hintFontSize + "px Arial", "#999");
            var r = Math.floor((num - 1) / hintCols);
            var c = (num - 1) % hintCols;
            hText.x = (c + 0.5) * (cellSize / hintCols);
            hText.y = (r + 0.5) * (cellSize / (currentSize / (9/hintCols) + 1));
            container.addChild(hText);
        });
    }
    if (initialPuzzle[row][col] === 0) {
        container.on("click", function() {
            currentBoard[row][col] = selectedNumber;
            checkWin(); refreshGrid();
        });
    }
    return container;
}

function getPossibleNumbers(row, col) {
    var possible = [];
    for (var n = 1; n <= currentSize; n++) if (isSafe(row, col, n)) possible.push(n);
    return possible;
}

function isSafe(row, col, num) {
    for (var i = 0; i < currentSize; i++) if (currentBoard[row][i] === num || currentBoard[i][col] === num) return false;
    var stepX = 3; var stepY = (currentSize === 9) ? 3 : 2;
    var startRow = Math.floor(row / stepY) * stepY;
    var startCol = Math.floor(col / stepX) * stepX;
    for (var r = 0; r < stepY; r++) for (var c = 0; c < stepX; c++) if (currentBoard[startRow + r][startCol + c] === num) return false;
    return true;
}