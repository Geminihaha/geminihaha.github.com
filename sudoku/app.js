// SUDOKU ZEN - Core Application Script
const APP_VERSION = "1.2.11";

// 1. 전역 게임 상태 정의 (State Management)
var gameState = {
    difficulty: 'easy',
    solutionBoard: [],  // 9x9 정답판 (완성 보드)
    initialBoard: [],   // 9x9 최초 퍼즐 보드 (고정값)
    currentBoard: [],   // 9x9 실시간 플레이어 보드 (객체 배열)
                        // 각 셀: { value: 0, pencilMarks: [false*9], isHint: false, isError: false }
    history: [],        // 실행 취소(Undo) 히스토리 스택
    hintsLeft: 3,       // 힌트 제한 (게임당 3회)
    seconds: 0,         // 소요 시간 (초)
    isPaused: false,    // 일시정지 여부
    selectedCell: null, // 현재 선택된 셀 좌표 { r: row, c: col }
    selectedNumber: 0,  // 현재 강조 선택된 숫자 (키패드 또는 셀 값 기반)
    warnings: 0,        // 오답 기입 경고 횟수
    pencilMode: false   // 메모 모드 활성화 여부
};

var timerInterval = null;

// ==========================================
// 2. 초기화 (Application Initializer)
// ==========================================
function init() {
    loadTheme();
    loadBestRecords();
    checkSavedGame();
    generateHTMLBoard();
    
    // 히스토리 초기 상태 설정
    if (!window.location.hash || window.location.hash !== '#home') {
        history.replaceState({ screen: 'home' }, '', '#home');
    }
}

window.onload = init;

// ==========================================
// 3. 테마 및 최고 기록 매니저
// ==========================================
function loadTheme() {
    var savedTheme = localStorage.getItem("sudoku_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme");
    var next = (current === "dark") ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sudoku_theme", next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    var btns = document.querySelectorAll(".theme-toggle-btn");
    btns.forEach(function(btn) {
        if (theme === "dark") {
            btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            btn.setAttribute("title", "라이트 모드로 변경");
        } else {
            btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            btn.setAttribute("title", "다크 모드로 변경");
        }
    });
}

function loadBestRecords() {
    var records = JSON.parse(localStorage.getItem("SUDOKU_BEST_RECORDS")) || {
        easy: null,
        medium: null,
        hard: null
    };
    
    updateRecordDisplay("best-easy", records.easy);
    updateRecordDisplay("best-medium", records.medium);
    updateRecordDisplay("best-hard", records.hard);
}

function updateRecordDisplay(elementId, seconds) {
    var el = document.getElementById(elementId);
    if (seconds === null || seconds === undefined) {
        el.innerText = "--:--";
    } else {
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        el.innerText = (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }
}

function checkSavedGame() {
    var saved = localStorage.getItem("SUDOKU_SAVE_GAME");
    var btn = document.getElementById("continue-btn");
    if (saved) {
        btn.removeAttribute("disabled");
    } else {
        btn.setAttribute("disabled", "true");
    }
}

// ==========================================
// 4. 스도쿠 솔버 및 생성 알고리즘 (Algorithm Engine)
// ==========================================

// 보드 내 특정 위치에 특정 값을 넣어도 규칙상 안전한지 검사 (솔버용)
function isValidForSolver(b, r, c, val) {
    for (var i = 0; i < 9; i++) {
        if (b[r][i] === val) return false;
        if (b[i][c] === val) return false;
    }
    var startRow = Math.floor(r / 3) * 3;
    var startCol = Math.floor(c / 3) * 3;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (b[startRow + i][startCol + j] === val) return false;
        }
    }
    return true;
}

// 스도쿠 솔버: 해의 개수를 카운트 (2개 이상 시 조기 종료)
function countSolutions(board) {
    var count = 0;
    var tempBoard = board.map(row => [...row]); // 복사본 생성하여 원본 오염 방지
    
    var emptyCells = [];
    for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
            if (tempBoard[r][c] === 0) emptyCells.push({ r: r, c: c });
        }
    }
    
    function solve(cellIdx) {
        if (cellIdx === emptyCells.length) {
            count++;
            return count < 2; // 해가 2개 이상 검출되면 탐색 조기 중단
        }
        var cell = emptyCells[cellIdx];
        var r = cell.r;
        var c = cell.c;
        
        for (var val = 1; val <= 9; val++) {
            if (isValidForSolver(tempBoard, r, c, val)) {
                tempBoard[r][c] = val;
                if (!solve(cellIdx + 1)) return false;
                tempBoard[r][c] = 0;
            }
        }
        return true;
    }
    
    solve(0);
    return count;
}

// 스도쿠 제너레이터 객체 (명세 03_Development_2.Core_Algorithm_Specs.md 충족)
var sudokuGenerator = {
    // 9x9 정답판 생성 (Backtracking & 대각 박스 최적화)
    generateSolution: function() {
        var board = Array.from({ length: 9 }, () => new Array(9).fill(0));
        
        // 9x9 대각선 독립 3x3 박스 3개 먼저 채우기 (연산 시간 단축)
        for (var i = 0; i < 9; i += 3) {
            var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            // 셔플
            for (var idx = nums.length - 1; idx > 0; idx--) {
                var j = Math.floor(Math.random() * (idx + 1));
                var t = nums[idx]; nums[idx] = nums[j]; nums[j] = t;
            }
            var nIdx = 0;
            for (var r = 0; r < 3; r++) {
                for (var c = 0; c < 3; c++) {
                    board[i + r][i + c] = nums[nIdx++];
                }
            }
        }
        
        function solve(r, c) {
            if (c === 9) {
                r++;
                c = 0;
            }
            if (r === 9) return true;
            if (board[r][c] !== 0) return solve(r, c + 1);
            
            var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            // 셔플
            for (var idx = nums.length - 1; idx > 0; idx--) {
                var j = Math.floor(Math.random() * (idx + 1));
                var t = nums[idx]; nums[idx] = nums[j]; nums[j] = t;
            }
            
            for (var i = 0; i < 9; i++) {
                var val = nums[i];
                if (isValidForSolver(board, r, c, val)) {
                    board[r][c] = val;
                    if (solve(r, c + 1)) return true;
                    board[r][c] = 0;
                }
            }
            return false;
        }
        
        solve(0, 0);
        return board;
    },
    
    // 유일해 보장 마스킹 알고리즘
    generatePuzzle: function(solution, difficulty) {
        var puzzle = solution.map(row => [...row]);
        var targetHoles = 35; // Easy (초급)
        
        if (difficulty === 'medium') targetHoles = 46; // Medium (중급)
        else if (difficulty === 'hard') targetHoles = 54;   // Hard (고급)
        
        var cellIndices = [];
        for (var i = 0; i < 81; i++) cellIndices.push(i);
        
        // 무작위 셔플
        for (var i = cellIndices.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = cellIndices[i];
            cellIndices[i] = cellIndices[j];
            cellIndices[j] = temp;
        }
        
        var holes = 0;
        for (var i = 0; i < 81; i++) {
            var idx = cellIndices[i];
            var r = Math.floor(idx / 9);
            var c = idx % 9;
            
            var backup = puzzle[r][c];
            puzzle[r][c] = 0;
            
            // 제거 후 솔버를 돌렸을 때 해의 개수가 유일한지(1개) 검증
            if (countSolutions(puzzle) === 1) {
                holes++;
                if (holes >= targetHoles) break;
            } else {
                // 다중 해가 검출되면 원상 복구
                puzzle[r][c] = backup;
            }
        }
        return puzzle;
    }
};

// ==========================================
// 5. 스도쿠 보드 생성 및 렌더링 (DOM Board Renderer)
// ==========================================

function generateHTMLBoard() {
    var boardContainer = document.getElementById("sudoku-board");
    boardContainer.innerHTML = "";
    
    for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
            var cell = document.createElement("div");
            cell.className = "sudoku-cell";
            cell.setAttribute("data-row", r);
            cell.setAttribute("data-col", c);
            
            // 3x3 격자 구분선 적용 (2번째, 5번째 행/열 뒤에 두꺼운 경계선 세팅)
            if (r === 2 || r === 5) cell.classList.add("border-bottom-thick");
            if (c === 2 || c === 5) cell.classList.add("border-right-thick");
            
            // 클릭 리스너 연결
            cell.onclick = (function(row, col) {
                return function() { selectCell(row, col); };
            })(r, c);
            
            boardContainer.appendChild(cell);
        }
    }
}

// 보드 상태 그리기 (gameState -> DOM)
function renderBoard() {
    var cells = document.querySelectorAll(".sudoku-cell");
    
    cells.forEach(function(cellEl) {
        var r = parseInt(cellEl.getAttribute("data-row"));
        var c = parseInt(cellEl.getAttribute("data-col"));
        var stateCell = gameState.currentBoard[r][c];
        
        cellEl.innerHTML = ""; // 기존 내용 클리어
        
        // CSS 스타일 초기화
        cellEl.className = "sudoku-cell";
        if (r === 2 || r === 5) cellEl.classList.add("border-bottom-thick");
        if (c === 2 || c === 5) cellEl.classList.add("border-right-thick");
        
        // 1. 값 타입 클래스 부여
        if (stateCell.value !== 0) {
            var initialVal = gameState.initialBoard[r][c];
            if (initialVal !== 0) {
                cellEl.classList.add("initial");
            } else if (stateCell.isHint) {
                cellEl.classList.add("hint-filled");
            } else {
                cellEl.classList.add("user-input");
            }
            
            var valEl = document.createElement("span");
            valEl.className = "cell-value";
            valEl.innerText = stateCell.value;
            cellEl.appendChild(valEl);
        } else {
            // 2. 값이 없고 메모가 등록되어 있는 경우
            var hasPencil = stateCell.pencilMarks.some(v => v);
            if (hasPencil) {
                var pencilGrid = document.createElement("div");
                pencilGrid.className = "pencil-grid";
                for (var i = 1; i <= 9; i++) {
                    var pNum = document.createElement("span");
                    pNum.className = "pencil-num";
                    pNum.innerText = i;
                    if (stateCell.pencilMarks[i - 1]) {
                        pNum.classList.add("active");
                    }
                    pencilGrid.appendChild(pNum);
                }
                cellEl.appendChild(pencilGrid);
            }
        }
        
        // 3. 하이라이팅 처리
        var sel = gameState.selectedCell;
        var activeNum = 0;
        
        if (sel) {
            // 3.1 선택 상태
            if (sel.r === r && sel.c === c) {
                cellEl.classList.add("selected");
            } 
            // 3.2 동일 행 / 동일 열 / 동일 3x3 박스 하이라이트
            else if (r === sel.r || c === sel.c || (Math.floor(r/3) === Math.floor(sel.r/3) && Math.floor(c/3) === Math.floor(sel.c/3))) {
                cellEl.classList.add("highlighted");
            }
            activeNum = gameState.currentBoard[sel.r][sel.c].value;
        }
        
        // 선택된 셀이 없거나 빈 셀인 경우, 전역 활성화된 selectedNumber를 기준으로 하이라이팅 설정
        if (activeNum === 0 && gameState.selectedNumber !== 0) {
            activeNum = gameState.selectedNumber;
        }
        
        // 3.3 동일 숫자 강조 (메모 포함)
        if (activeNum !== 0) {
            var isSelectedSelf = (sel && sel.r === r && sel.c === c);
            if (stateCell.value === activeNum && !isSelectedSelf) {
                cellEl.classList.add("same-number");
            } else if (stateCell.value === 0 && stateCell.pencilMarks[activeNum - 1]) {
                cellEl.classList.add("same-number-memo");
            }
        }
        
        // 4. 에러 스타일링
        if (stateCell.isError) {
            cellEl.classList.add("error");
        }
    });
    
    // 키패드 활성/비활성 갱신
    updateKeypad();
}

// ==========================================
// 6. 플레이 비즈니스 로직
// ==========================================

// 게임 시작 및 보드 마스킹 가동
function startNewGame(difficulty) {
    gameState.difficulty = difficulty;
    
    // 1단계: 정답 보드 생성
    gameState.solutionBoard = sudokuGenerator.generateSolution();
    
    // 2단계: 유일해 보장 구멍 뚫기
    var masked = sudokuGenerator.generatePuzzle(gameState.solutionBoard, difficulty);
    gameState.initialBoard = masked;
    
    // 3단계: 플레이 보드 세팅
    gameState.currentBoard = [];
    for (var r = 0; r < 9; r++) {
        var row = [];
        for (var c = 0; c < 9; c++) {
            var val = masked[r][c];
            row.push({
                value: val,
                pencilMarks: new Array(9).fill(false),
                isHint: false,
                isError: false
            });
        }
        gameState.currentBoard.push(row);
    }
    
    // 4단계: 상태 리셋 및 화면 전환
    gameState.history = [];
    gameState.hintsLeft = 3;
    gameState.seconds = 0;
    gameState.warnings = 0;
    gameState.selectedNumber = 0;
    gameState.isPaused = false;
    gameState.selectedCell = null;
    gameState.pencilMode = false;
    
    updateWarningUI();
    document.getElementById("pencil-btn").classList.remove("active");
    document.getElementById("pencil-btn").querySelector("span").innerText = "메모 Off";
    document.getElementById("hint-btn").querySelector("span").innerText = "힌트 (3)";
    document.getElementById("difficulty-badge").innerText = 
        difficulty === 'easy' ? '초급' : (difficulty === 'medium' ? '중급' : '고급');
    
    history.pushState({ screen: 'game' }, '', '#game');
    switchScreen("game-screen");
    renderBoard();
    startTimer();
    saveGame();
}

function continueGame() {
    var saved = localStorage.getItem("SUDOKU_SAVE_GAME");
    if (!saved) return;
    
    var data = JSON.parse(saved);
    gameState.difficulty = data.difficulty;
    gameState.solutionBoard = data.solutionBoard;
    gameState.initialBoard = data.initialBoard;
    gameState.currentBoard = data.currentBoard;
    gameState.history = data.history || [];
    gameState.hintsLeft = (data.hintsLeft !== undefined) ? data.hintsLeft : 3;
    gameState.seconds = data.seconds || 0;
    gameState.warnings = data.warnings || 0;
    gameState.selectedNumber = data.selectedNumber || 0;
    gameState.isPaused = false;
    gameState.selectedCell = null;
    gameState.pencilMode = false;
    
    updateWarningUI();
    document.getElementById("pencil-btn").classList.remove("active");
    document.getElementById("pencil-btn").querySelector("span").innerText = "메모 Off";
    document.getElementById("hint-btn").querySelector("span").innerText = "힌트 (" + gameState.hintsLeft + ")";
    document.getElementById("difficulty-badge").innerText = 
        gameState.difficulty === 'easy' ? '초급' : (gameState.difficulty === 'medium' ? '중급' : '고급');
    
    history.pushState({ screen: 'game' }, '', '#game');
    switchScreen("game-screen");
    renderBoard();
    startTimer();
}

// 화면 전환 헬퍼
function switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

function exitToHome() {
    if (window.location.hash === '#game') {
        history.back();
    } else {
        exitToHomeNoPush();
    }
}

function exitToHomeNoPush() {
    stopTimer();
    saveGame();
    checkSavedGame();
    loadBestRecords();
    switchScreen("home-screen");
}

function selectCell(row, col) {
    if (gameState.isPaused) return;
    
    var cell = gameState.currentBoard[row][col];
    var isInitial = (gameState.initialBoard[row][col] !== 0);
    var isHint = cell.isHint;
    
    if (isInitial || isHint) {
        gameState.selectedCell = null;
        if (cell.value !== 0) {
            gameState.selectedNumber = cell.value;
        }
    } else {
        gameState.selectedCell = { r: row, c: col };
        if (cell.value !== 0) {
            gameState.selectedNumber = cell.value;
        }
    }
    renderBoard();
}

// 숫자 입력 코어 처리 (키패드 & 키보드 수신)
function pressNumber(num) {
    if (gameState.isPaused) return;
    
    if (!gameState.selectedCell) {
        gameState.selectedNumber = num;
        renderBoard();
        return;
    }
    
    var r = gameState.selectedCell.r;
    var c = gameState.selectedCell.c;
    
    // 고정값 또는 이미 제공된 힌트 셀은 변경 불가
    if (gameState.initialBoard[r][c] !== 0 || gameState.currentBoard[r][c].isHint) return;
    
    if (gameState.pencilMode) {
        // 메모 모드: 후보 숫자 토글
        // 규칙상 기입할 수 없는(이미 행, 열, 박스에 확정된) 숫자는 메모 기입 차단
        if (num !== 0 && !isSafe(r, c, num)) {
            highlightConflict(r, c, num);
            return;
        }
        
        saveActionToHistory();
        var cell = gameState.currentBoard[r][c];
        cell.value = 0; // 메모할 때는 기존 메인값 지움
        cell.pencilMarks[num - 1] = !cell.pencilMarks[num - 1];
        
        gameState.selectedNumber = num;
        playSFX('pencil');
    } else {
        // 일반 모드: 값 입력
        var cell = gameState.currentBoard[r][c];
        
        if (cell.value !== num) {
            saveActionToHistory();
            cell.value = num;
            cell.pencilMarks.fill(false); // 숫자 입력 시 메모는 지움
            
            if (num !== 0) {
                var correctAnswer = gameState.solutionBoard[r][c];
                if (num !== correctAnswer) {
                    gameState.warnings++;
                    updateWarningUI();
                    playSFX('error');
                    triggerVibration('error');
                } else {
                    playSFX('input');
                }
                
                // 동일 행, 열, 3x3 박스의 메모에서 입력한 숫자 자동 소거
                removePencilMarksInScope(r, c, num);
            } else {
                playSFX('input');
            }
            
            gameState.selectedNumber = num;
        }
    }
    
    updateErrors();
    renderBoard();
    saveGame();
    checkWinCondition();
}

// ==========================================
// 7. 유틸리티 액션 (Undo, Erase, Pencil, Hint)
// ==========================================

function saveActionToHistory() {
    // 딥 카피 진행
    var snapshot = gameState.currentBoard.map(row => 
        row.map(cell => ({
            value: cell.value,
            pencilMarks: [...cell.pencilMarks],
            isHint: cell.isHint,
            isError: cell.isError
        }))
    );
    gameState.history.push(snapshot);
}

function triggerUndo() {
    if (gameState.isPaused || gameState.history.length === 0) return;
    
    var prev = gameState.history.pop();
    gameState.currentBoard = prev;
    gameState.selectedCell = null;
    
    updateErrors();
    renderBoard();
    saveGame();
}

function triggerErase() {
    if (gameState.isPaused || !gameState.selectedCell) return;
    
    var r = gameState.selectedCell.r;
    var c = gameState.selectedCell.c;
    
    if (gameState.initialBoard[r][c] !== 0 || gameState.currentBoard[r][c].isHint) return;
    
    saveActionToHistory();
    
    var cell = gameState.currentBoard[r][c];
    cell.value = 0;
    cell.pencilMarks.fill(false);
    
    playSFX('input');
    
    updateErrors();
    renderBoard();
    saveGame();
}

function togglePencilMode() {
    if (gameState.isPaused) return;
    gameState.pencilMode = !gameState.pencilMode;
    var btn = document.getElementById("pencil-btn");
    if (gameState.pencilMode) {
        btn.classList.add("active");
        btn.querySelector("span").innerText = "메모 On";
    } else {
        btn.classList.remove("active");
        btn.querySelector("span").innerText = "메모 Off";
    }
}

function triggerHint() {
    if (gameState.isPaused) return;
    if (!gameState.selectedCell) return;
    
    var r = gameState.selectedCell.r;
    var c = gameState.selectedCell.c;
    
    // 고정 값이거나 이미 힌트로 채운 칸인 경우 패스
    if (gameState.initialBoard[r][c] !== 0 || gameState.currentBoard[r][c].isHint) return;
    
    if (gameState.hintsLeft <= 0) {
        alert("남은 힌트가 없습니다.");
        return;
    }
    
    // 이미 정답이 맞게 채워져 있다면
    if (gameState.currentBoard[r][c].value === gameState.solutionBoard[r][c]) return;
    
    saveActionToHistory();
    
    var cell = gameState.currentBoard[r][c];
    var ans = gameState.solutionBoard[r][c];
    cell.value = ans;
    cell.isHint = true;
    cell.pencilMarks.fill(false);
    gameState.selectedNumber = ans;
    
    // 힌트가 들어갔으므로 동일 행, 열, 3x3 박스의 메모에서 이 정답 소거
    removePencilMarksInScope(r, c, ans);
    
    gameState.hintsLeft--;
    document.getElementById("hint-btn").querySelector("span").innerText = "힌트 (" + gameState.hintsLeft + ")";
    
    gameState.selectedCell = null;
    
    updateErrors();
    renderBoard();
    saveGame();
    checkWinCondition();
}

// 실시간 에러(정답 대조) 마킹
function updateErrors() {
    for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
            var cell = gameState.currentBoard[r][c];
            if (cell.value !== 0 && cell.value !== gameState.solutionBoard[r][c]) {
                cell.isError = true;
            } else {
                cell.isError = false;
            }
        }
    }
}

// 클리어 검증
function checkWinCondition() {
    var isFull = true;
    var hasError = false;
    
    for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
            var cell = gameState.currentBoard[r][c];
            if (cell.value === 0) {
                isFull = false;
            }
            if (cell.isError) {
                hasError = true;
            }
        }
    }
    
    if (isFull && !hasError) {
        stopTimer();
        handleGameClear();
    }
}

function handleGameClear() {
    var timerStr = formatTime(gameState.seconds);
    document.getElementById("clear-time").innerText = timerStr;
    
    // 최고 기록 처리
    var records = JSON.parse(localStorage.getItem("SUDOKU_BEST_RECORDS")) || {
        easy: null,
        medium: null,
        hard: null
    };
    
    var diff = gameState.difficulty;
    var isNewRecord = false;
    
    if (records[diff] === null || gameState.seconds < records[diff]) {
        records[diff] = gameState.seconds;
        localStorage.setItem("SUDOKU_BEST_RECORDS", JSON.stringify(records));
        isNewRecord = true;
    }
    
    document.getElementById("new-record-badge").style.display = isNewRecord ? "inline-block" : "none";
    document.getElementById("clear-modal").style.display = "flex";
    
    // 클리어했으므로 진행중이던 세션은 지움
    localStorage.removeItem("SUDOKU_SAVE_GAME");
    checkSavedGame();
}

function restartFromClear() {
    document.getElementById("clear-modal").style.display = "none";
    startNewGame(gameState.difficulty);
}

function exitToHomeFromClear() {
    document.getElementById("clear-modal").style.display = "none";
    exitToHome();
}

// ==========================================
// 8. 타이머 및 자동 저장 영속성
// ==========================================

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
        if (!gameState.isPaused) {
            gameState.seconds++;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerDisplay() {
    var badgeSpan = document.getElementById("timerDisplay").querySelector("span");
    badgeSpan.innerText = formatTime(gameState.seconds);
}

function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    var modal = document.getElementById("pause-modal");
    if (gameState.isPaused) {
        modal.style.display = "flex";
        stopTimer();
    } else {
        modal.style.display = "none";
        startTimer();
    }
}

function saveGame() {
    var dataToSave = {
        difficulty: gameState.difficulty,
        solutionBoard: gameState.solutionBoard,
        initialBoard: gameState.initialBoard,
        currentBoard: gameState.currentBoard,
        history: gameState.history,
        hintsLeft: gameState.hintsLeft,
        seconds: gameState.seconds,
        warnings: gameState.warnings,
        selectedNumber: gameState.selectedNumber
    };
    localStorage.setItem("SUDOKU_SAVE_GAME", JSON.stringify(dataToSave));
}

function updateWarningUI() {
    var badge = document.getElementById("warning-badge");
    if (badge) {
        if (gameState.warnings > 0) {
            badge.style.display = "inline-block";
            badge.innerText = "경고 " + gameState.warnings;
        } else {
            badge.style.display = "none";
        }
    }
}

// ==========================================
// 9. 모달 매니저 & 키보드 단축키
// ==========================================

function openHelpModal() {
    document.getElementById("help-modal").style.display = "flex";
}

function closeHelpModal() {
    document.getElementById("help-modal").style.display = "none";
}

// 물리 키보드 바인딩
document.onkeydown = function(e) {
    if (gameState.isPaused || !gameState.selectedCell) return;
    
    // 1-9 숫자 키 대응
    if (e.key >= '1' && e.key <= '9') {
        pressNumber(parseInt(e.key));
    } 
    // Backspace 또는 Delete 키 -> 지우기 기능 실행
    else if (e.key === 'Backspace' || e.key === 'Delete') {
        triggerErase();
    }
    // 'p' 또는 'P' -> 메모 모드 토글
    else if (e.key.toLowerCase() === 'p') {
        togglePencilMode();
    }
    // Ctrl + Z -> Undo 작동
    else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        triggerUndo();
    }
};

// ==========================================
// 10. 스도쿠 입력 검증 및 연필 메모 자동 소거 유틸리티
// ==========================================

function isSafe(row, col, num) {
    // 1. 행 검사 (가로)
    for (var i = 0; i < 9; i++) {
        if (i !== col && gameState.currentBoard[row][i].value === num) {
            return false;
        }
    }
    // 2. 열 검사 (세로)
    for (var i = 0; i < 9; i++) {
        if (i !== row && gameState.currentBoard[i][col].value === num) {
            return false;
        }
    }
    // 3. 3x3 박스 검사 (구역)
    var startRow = Math.floor(row / 3) * 3;
    var startCol = Math.floor(col / 3) * 3;
    for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
            var currR = startRow + r;
            var currC = startCol + c;
            if ((currR !== row || currC !== col) && gameState.currentBoard[currR][currC].value === num) {
                return false;
            }
        }
    }
    return true;
}

function removePencilMarksInScope(row, col, num) {
    var idx = num - 1;
    
    // 1. 동일 행(Row) 메모 소거
    for (var c = 0; c < 9; c++) {
        if (c !== col) {
            gameState.currentBoard[row][c].pencilMarks[idx] = false;
        }
    }
    
    // 2. 동일 열(Col) 메모 소거
    for (var r = 0; r < 9; r++) {
        if (r !== row) {
            gameState.currentBoard[r][col].pencilMarks[idx] = false;
        }
    }
    
    // 3. 동일 3x3 박스(Box) 메모 소거
    var startRow = Math.floor(row / 3) * 3;
    var startCol = Math.floor(col / 3) * 3;
    for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
            var currR = startRow + r;
            var currC = startCol + c;
            if (currR !== row || currC !== col) {
                gameState.currentBoard[currR][currC].pencilMarks[idx] = false;
            }
        }
    }
}

function updateKeypad() {
    // 1~9 숫자별 보드 위 존재 개수 집계
    var counts = new Array(10).fill(0);
    for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
            var val = gameState.currentBoard[r][c].value;
            if (val >= 1 && val <= 9) {
                counts[val]++;
            }
        }
    }
    
    // 9개 다 쓰인 숫자는 비활성화(disabled) 및 클래스 토글
    var keyBtns = document.querySelectorAll(".keypad .key-btn");
    keyBtns.forEach(function(btn, idx) {
        var num = idx + 1;
        var isCompleted = (counts[num] >= 9);
        
        if (isCompleted) {
            btn.setAttribute("disabled", "true");
            btn.classList.add("completed");
        } else {
            btn.removeAttribute("disabled");
            btn.classList.remove("completed");
        }
    });
}

// ==========================================
// 11. 사운드(Web Audio API) 및 햅틱 진동 효과 유틸리티
// ==========================================
var audioCtx = null;

function playSFX(type) {
    try {
        if (audioCtx && (audioCtx.state === 'closed' || (audioCtx.state === 'suspended' && !audioCtx.resume))) {
            audioCtx = null;
        }
        
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(function() {
                runOscillator(type);
            }).catch(function(e) {
                console.warn("Failed to resume AudioContext: ", e);
                resetAudioContext();
            });
        } else {
            runOscillator(type);
        }
    } catch (e) {
        console.warn("Web Audio API is not supported or blocked: ", e);
    }
}

function resetAudioContext() {
    try {
        if (audioCtx) {
            audioCtx.close();
        }
    } catch (e) {}
    audioCtx = null;
}

function runOscillator(type) {
    if (!audioCtx || audioCtx.state === 'closed') return;
    
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    var filter = null;
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    var now = audioCtx.currentTime;
    var duration = 0.12;
    
    if (type === 'input') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        duration = 0.08;
    } else if (type === 'pencil') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        duration = 0.05;
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.22);
        gain.gain.setValueAtTime(0.40, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        
        filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 550;
        
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);
        duration = 0.25;
    }
    
    osc.start(now);
    osc.stop(now + duration);
    
    osc.onended = function() {
        try {
            osc.disconnect();
            gain.disconnect();
            if (filter) {
                filter.disconnect();
            }
        } catch (err) {}
    };
}

function triggerVibration(type) {
    if (navigator.vibrate) {
        if (type === 'error') {
            navigator.vibrate([100, 50, 100]); // 짧게 두 번 진동
        }
    }
}

window.addEventListener('popstate', function(event) {
    var state = event.state;
    var activeScreen = document.querySelector(".screen.active");
    
    if (activeScreen && activeScreen.id === "game-screen") {
        if (!state || state.screen === 'home') {
            exitToHomeNoPush();
        }
    }
});

function highlightConflict(row, col, num) {
    var conflictCells = [];
    var conflictRows = new Set();
    var conflictCols = new Set();
    var conflictBoxes = false;
    
    // 1. 행 검사 (중복 원인 탐색)
    for (var i = 0; i < 9; i++) {
        if (i !== col && gameState.currentBoard[row][i].value === num) {
            conflictCells.push({ r: row, c: i });
            conflictRows.add(row);
        }
    }
    
    // 2. 열 검사 (중복 원인 탐색)
    for (var i = 0; i < 9; i++) {
        if (i !== row && gameState.currentBoard[i][col].value === num) {
            conflictCells.push({ r: i, c: col });
            conflictCols.add(col);
        }
    }
    
    // 3. 3x3 박스 검사 (중복 원인 탐색)
    var startRow = Math.floor(row / 3) * 3;
    var startCol = Math.floor(col / 3) * 3;
    for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
            var currR = startRow + r;
            var currC = startCol + c;
            if ((currR !== row || currC !== col) && gameState.currentBoard[currR][currC].value === num) {
                conflictCells.push({ r: currR, c: currC });
                conflictBoxes = true;
            }
        }
    }
    
    // 중복 범위 내 모든 셀에 은은한 붉은색 하이라이트 일시 적용
    var allCellEls = document.querySelectorAll(".sudoku-cell");
    allCellEls.forEach(function(cellEl) {
        var r = parseInt(cellEl.getAttribute("data-row"));
        var c = parseInt(cellEl.getAttribute("data-col"));
        
        var inRow = conflictRows.has(r);
        var inCol = conflictCols.has(c);
        var inBox = conflictBoxes && (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3));
        
        if (inRow || inCol || inBox) {
            cellEl.classList.add("conflict-highlight");
        }
    });
    
    // 중복 충돌을 직접 일으킨 원인 숫자 셀에는 빨간색 펄스 플래시 부여
    conflictCells.forEach(function(coord) {
        var cellEl = document.querySelector('[data-row="' + coord.r + '"][data-col="' + coord.c + '"]');
        if (cellEl) {
            cellEl.classList.add("conflict-flash");
        }
    });
    
    // 햅틱 사운드 및 진동 피드백
    playSFX('error');
    triggerVibration('error');
    
    // 800ms 뒤 일괄 스타일 제거
    setTimeout(function() {
        allCellEls.forEach(function(cellEl) {
            cellEl.classList.remove("conflict-highlight");
            cellEl.classList.remove("conflict-flash");
        });
    }, 800);
}

// iOS PWA 백그라운드 전환 복귀 대응 오디오 복구 리스너
function handlePWARecovery() {
    if (document.visibilityState === 'visible' && audioCtx) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(function(e) {
                console.warn("Failed to resume audio on visibilitychange: ", e);
                resetAudioContext();
            });
        }
    }
}
document.addEventListener('visibilitychange', handlePWARecovery);
window.addEventListener('focus', handlePWARecovery);