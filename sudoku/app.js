var stage;
var grid = [];
var cellSize = 50;
var currentSize = 9;
var currentLevel = "easy";
var currentBoard = [];
var initialPuzzle = [];
var selectedNumber = 1; 
var errors = []; 

// 타이머 변수
var seconds = 0;
var timerInterval = null;
var isPaused = false;

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
        seconds = data.seconds || 0;
        
        if (data.mode) document.getElementById("modeSelect").value = data.mode;
        if (data.puzzleNum) document.getElementById("puzzleNum").value = data.puzzleNum;
        
        document.getElementById("sizeSelect").value = currentSize;
        document.getElementById("levelSelect").value = currentLevel;
        
        updateTimerDisplay();
        createKeypad();
        refreshGrid();
        startTimer();
    } else {
        openNewGameModal();
    }
}

// 새 게임 모달 관련 함수
function openNewGameModal() {
    isPaused = true;
    document.getElementById("newGameModal").style.display = "flex";
    toggleModeUIInModal();
}

function closeNewGameModal() {
    document.getElementById("newGameModal").style.display = "none";
    if (currentBoard.length > 0) isPaused = false;
}

function toggleModeUIInModal() {
    var mode = document.getElementById("modeSelect").value;
    document.getElementById("puzzleNum").style.display = (mode === "select") ? "inline-block" : "none";
}

function confirmNewGame() {
    currentSize = parseInt(document.getElementById("sizeSelect").value);
    currentLevel = document.getElementById("levelSelect").value;
    closeNewGameModal();
    resetGame();
}

function resetGame() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
    localStorage.removeItem("sudoku_state_v2");
    
    var mode = document.getElementById("modeSelect").value;
    var seed = (mode === "select") ? (parseInt(document.getElementById("puzzleNum").value) || 1) : Math.random() * 1000000;
    
    var fullBoard = shuffleSudoku(JSON.parse(JSON.stringify(solvedBases[currentSize])), seed);
    initialPuzzle = createPuzzle(fullBoard, currentLevel, seed);
    currentBoard = JSON.parse(JSON.stringify(initialPuzzle));
    errors = [];
    isPaused = false;
    createKeypad();
    refreshGrid();
    startTimer();
}

// 타이머 로직
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
        if (!isPaused) {
            seconds++;
            updateTimerDisplay();
            if (seconds % 5 === 0) saveState();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerDisplay() {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    document.getElementById("timerDisplay").innerText = 
        (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
}

function togglePause() {
    if (currentBoard.length === 0) return;
    isPaused = !isPaused;
    document.getElementById("pauseModal").style.display = isPaused ? "flex" : "none";
    document.getElementById("pauseBtn").innerText = isPaused ? "Resume" : "Pause";
    if (!isPaused) refreshGrid(); // 다시 그리기
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

    var nums = [];
    for(var i=1; i<=size; i++) nums.push(i);
    var shuffled = shuffleArray(nums, s);
    var map = {};
    for(var i=0; i<size; i++) map[i+1] = shuffled.array[i];
    s = shuffled.seed;

    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) board[r][c] = map[board[r][c]];
    }
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
    
    for (var i = positions.length - 1; i > 0; i--) {
        var j = Math.floor(seededRandom(s++) * (i + 1));
        var temp = positions[i];
        positions[i] = positions[j];
        positions[j] = temp;
    }

    for(var i=0; i<hideCount; i++) {
        puzzle[positions[i].r][positions[i].c] = 0;
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
        initialBoard: initialPuzzle, board: currentBoard,
        seconds: seconds
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
    if (isPaused) return;
    selectedNumber = num;
    var btns = document.querySelectorAll(".key-btn");
    btns.forEach(function(btn) {
        btn.classList.remove("selected");
        if (btn.innerText == num || (num === 0 && btn.innerText === "clear")) btn.classList.add("selected");
    });
}

function updateHints() { refreshGrid(); }

function drawGrid() {
    if (isPaused) {
        var bg = new createjs.Shape();
        bg.graphics.beginFill("#eee").drawRect(0, 0, 450, 450);
        stage.addChild(bg);
        var t = new createjs.Text("PAUSED", "30px Arial", "#999");
        t.textAlign = "center"; t.x = 225; t.y = 210;
        stage.addChild(t);
        return;
    }
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
    if (full && errors.length === 0) {
        stopTimer();
        saveRecord();
        showAlert("🏆 정답입니다! 기록: " + document.getElementById("timerDisplay").innerText);
    } else if (full && errors.length > 0) {
        showAlert("틀린 부분이 있습니다. 빨간색 칸을 확인하세요.");
    }
}

function saveRecord() {
    var records = JSON.parse(localStorage.getItem("sudoku_records") || "[]");
    var newRecord = {
        date: new Date().toLocaleString(),
        size: currentSize + "x" + currentSize,
        level: currentLevel,
        time: document.getElementById("timerDisplay").innerText,
        seconds: seconds
    };
    records.push(newRecord);
    records.sort((a, b) => a.seconds - b.seconds);
    localStorage.setItem("sudoku_records", JSON.stringify(records.slice(0, 10)));
}

function showRecords() {
    var records = JSON.parse(localStorage.getItem("sudoku_records") || "[]");
    var list = document.getElementById("recordsList");
    list.innerHTML = "";
    if (records.length === 0) {
        list.innerHTML = "<p>기록이 없습니다.</p>";
    } else {
        records.forEach(r => {
            var div = document.createElement("div");
            div.className = "record-item";
            div.innerHTML = `<span>${r.date} (${r.size}/${r.level})</span> <strong>${r.time}</strong>`;
            list.appendChild(div);
        });
    }
    document.getElementById("recordsModal").style.display = "flex";
}

function closeRecords() {
    document.getElementById("recordsModal").style.display = "none";
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
            if (isPaused) return;
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