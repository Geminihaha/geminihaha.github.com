// SUDOKU ZEN - Core Application Script
const APP_VERSION = "2.1.0";

// 홈 화면에서 선택된 게임 모드 (9: 3x3 블록 9x9, 6: 2x3 블록 6x6)
var homeSelectedMode = 9;

// 1. 전역 게임 상태 정의 (State Management)
var gameState = {
    boardSize: 9,       // 9 (3x3 블록) 또는 6 (2x3 블록)
    boxRows: 3,         // 6x6일 때 2, 9x9일 때 3
    boxCols: 3,         // 항상 3 (6x6: 2x3, 9x9: 3x3)
    difficulty: 'easy',
    solutionBoard: [],  // 정답판 (완성 보드)
    initialBoard: [],   // 최초 퍼즐 보드 (고정값)
    currentBoard: [],   // 실시간 플레이어 보드 (객체 배열)
    history: [],        // 실행 취소(Undo) 히스토리 스택
    hintsLeft: 3,       // 힌트 제한 (게임당 3회)
    seconds: 0,         // 소요 시간 (초)
    isPaused: false,    // 일시정지 여부
    selectedCell: null, // 현재 선택된 셀 좌표 { r: row, c: col }
    selectedNumber: 0,  // 현재 강조 선택된 숫자 (키패드 또는 셀 값 기반)
    warnings: 0,        // 오답 기입 경고 횟수
    pencilMode: false,  // 메모 모드 활성화 여부
    isCleared: false    // 게임 완료 여부
};

var timerInterval = null;

// 스마트 논리 힌트 활성 상태 관리
var activeSmartHint = null;
var smartHintTimeout = null;

// 숫자 잠금(선택) 입력 상태 (숫자 키 터치 → 셀 터치 입력)
var numberLock = {
    active: false,   // 숫자 잠금 모드 활성 여부
    num: 0           // 잠금된 숫자
};

// 지우기 잠금 상태 (지우기 버튼 터치 → 셀 터치 지우기)
var eraseLock = {
    active: false    // 지우기 잠금 모드 활성 여부
};

// ==========================================
// 2. 초기화 (Application Initializer)
// ==========================================
function init() {
    loadTheme();
    loadBestRecords();
    checkSavedGame();
    generateHTMLBoard();
    applyTimerSetting();
    updateSettingsUI();
    
    // 히스토리 초기 상태 설정
    if (!window.location.hash || window.location.hash !== '#home') {
        history.replaceState({ screen: 'home' }, '', '#home');
    }
    
    // 브라우저 영구 저장소 보존 요청 (PWA 삭제나 브라우저 자동 캐시 클리어 방어)
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(function(granted) {
            if (granted) {
                console.log("Sudoku Zen: Persistent storage granted.");
            } else {
                console.log("Sudoku Zen: Persistent storage not granted.");
            }
        }).catch(function(err) {
            console.warn("Persistent storage request failed: ", err);
        });
    }
}

window.onload = init;

// 홈 화면 모드 선택 탭 (9: 3x3 블록 9x9, 6: 2x3 블록 6x6)
function setHomeMode(size) {
    homeSelectedMode = size;
    var tab9 = document.getElementById("mode-tab-9");
    var tab6 = document.getElementById("mode-tab-6");
    var titleEl = document.getElementById("new-game-title");
    
    if (size === 6) {
        if (tab6) tab6.classList.add("active");
        if (tab9) tab9.classList.remove("active");
        if (titleEl) titleEl.innerText = "새 게임 시작 (2x3 블록 6x6)";
    } else {
        if (tab9) tab9.classList.add("active");
        if (tab6) tab6.classList.remove("active");
        if (titleEl) titleEl.innerText = "새 게임 시작 (3x3 블록 9x9)";
    }
}

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
    updateSettingsUI();
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
        hard: null,
        easy6: null,
        medium6: null,
        hard6: null
    };
    
    // 3x3 블록 (9x9) 기록
    updateRecordDisplay("best-easy", records.easy);
    updateRecordDisplay("best-medium", records.medium);
    updateRecordDisplay("best-hard", records.hard);
    
    // 2x3 블록 (6x6) 기록
    updateRecordDisplay("best-easy-6", records.easy6);
    updateRecordDisplay("best-medium-6", records.medium6);
    updateRecordDisplay("best-hard-6", records.hard6);
}

function updateRecordDisplay(elementId, seconds) {
    var el = document.getElementById(elementId);
    if (!el) return;
    if (seconds === null || seconds === undefined) {
        el.innerText = "--:--";
    } else {
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        el.innerText = (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }
}

function isGameCompleted() {
    if (!gameState.currentBoard || !gameState.solutionBoard) return false;
    var size = gameState.boardSize || 9;
    if (gameState.currentBoard.length < size || gameState.solutionBoard.length < size) return false;
    
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
            var cell = gameState.currentBoard[r][c];
            if (!cell || cell.value === 0 || cell.value !== gameState.solutionBoard[r][c]) {
                return false;
            }
        }
    }
    return true;
}

function checkSavedGame() {
    var btn = document.getElementById("continue-btn");
    if (!btn) return;
    
    var saved = localStorage.getItem("SUDOKU_SAVE_GAME");
    if (saved) {
        try {
            var data = JSON.parse(saved);
            if (data && data.currentBoard && data.solutionBoard) {
                var size = data.boardSize || 9;
                var isCompleted = true;
                for (var r = 0; r < size; r++) {
                    for (var c = 0; c < size; c++) {
                        var cell = data.currentBoard[r][c];
                        if (!cell || cell.value === 0 || cell.value !== data.solutionBoard[r][c]) {
                            isCompleted = false;
                            break;
                        }
                    }
                    if (!isCompleted) break;
                }
                
                if (!isCompleted) {
                    btn.removeAttribute("disabled");
                    return;
                }
            }
        } catch (e) {}
    }
    
    // 유효한 진행 중인 게임이 없을 때
    localStorage.removeItem("SUDOKU_SAVE_GAME");
    btn.setAttribute("disabled", "true");
}

// ==========================================
// 4. 스도쿠 솔버 및 생성 알고리즘 (Algorithm Engine)
// ==========================================

// 보드 내 특정 위치에 특정 값을 넣어도 규칙상 안전한지 검사 (솔버용)
function isValidForSolver(b, r, c, val, size, boxRows, boxCols) {
    size = size || b.length;
    boxRows = boxRows || (size === 6 ? 2 : 3);
    boxCols = boxCols || 3;
    
    // 행 & 열 검사
    for (var i = 0; i < size; i++) {
        if (b[r][i] === val) return false;
        if (b[i][c] === val) return false;
    }
    
    // 블록 검사
    var startRow = Math.floor(r / boxRows) * boxRows;
    var startCol = Math.floor(c / boxCols) * boxCols;
    for (var i = 0; i < boxRows; i++) {
        for (var j = 0; j < boxCols; j++) {
            if (b[startRow + i][startCol + j] === val) return false;
        }
    }
    return true;
}

// 스도쿠 솔버: 해의 개수를 카운트 (2개 이상 시 조기 종료)
function countSolutions(board, size, boxRows, boxCols) {
    size = size || board.length;
    boxRows = boxRows || (size === 6 ? 2 : 3);
    boxCols = boxCols || 3;
    
    var count = 0;
    var tempBoard = board.map(row => [...row]); // 복사본 생성하여 원본 오염 방지
    
    var emptyCells = [];
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
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
        
        for (var val = 1; val <= size; val++) {
            if (isValidForSolver(tempBoard, r, c, val, size, boxRows, boxCols)) {
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

// 스도쿠 제너레이터 객체 (6x6 2x3블록 및 9x9 3x3블록 범용 지원)
var sudokuGenerator = {
    // 정답판 생성 (Backtracking)
    generateSolution: function(size) {
        size = size || 9;
        var boxRows = (size === 6) ? 2 : 3;
        var boxCols = 3;
        var board = Array.from({ length: size }, () => new Array(size).fill(0));
        
        // 9x9 모드일 경우 대각선 독립 3x3 박스 3개 먼저 채우기 (연산 가속)
        if (size === 9) {
            for (var i = 0; i < 9; i += 3) {
                var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
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
        }
        
        function solve(r, c) {
            if (c === size) {
                r++;
                c = 0;
            }
            if (r === size) return true;
            if (board[r][c] !== 0) return solve(r, c + 1);
            
            var nums = [];
            for (var n = 1; n <= size; n++) nums.push(n);
            for (var idx = nums.length - 1; idx > 0; idx--) {
                var j = Math.floor(Math.random() * (idx + 1));
                var t = nums[idx]; nums[idx] = nums[j]; nums[j] = t;
            }
            
            for (var i = 0; i < size; i++) {
                var val = nums[i];
                if (isValidForSolver(board, r, c, val, size, boxRows, boxCols)) {
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
    generatePuzzle: function(solution, difficulty, size) {
        size = size || 9;
        var boxRows = (size === 6) ? 2 : 3;
        var boxCols = 3;
        var puzzle = solution.map(row => [...row]);
        var totalCells = size * size;
        var targetHoles = 35; // 기본값
        
        if (size === 6) {
            if (difficulty === 'easy') targetHoles = 13;        // 약 23개 단서
            else if (difficulty === 'medium') targetHoles = 17;  // 약 19개 단서
            else if (difficulty === 'hard') targetHoles = 21;    // 약 15개 단서
        } else {
            if (difficulty === 'easy') targetHoles = 35;
            else if (difficulty === 'medium') targetHoles = 46;
            else if (difficulty === 'hard') targetHoles = 54;
        }
        
        var cellIndices = [];
        for (var i = 0; i < totalCells; i++) cellIndices.push(i);
        
        // 무작위 셔플
        for (var i = cellIndices.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = cellIndices[i];
            cellIndices[i] = cellIndices[j];
            cellIndices[j] = temp;
        }
        
        var holes = 0;
        for (var i = 0; i < totalCells; i++) {
            var idx = cellIndices[i];
            var r = Math.floor(idx / size);
            var c = idx % size;
            
            var backup = puzzle[r][c];
            puzzle[r][c] = 0;
            
            // 제거 후 솔버를 돌렸을 때 해의 개수가 유일한지(1개) 검증
            if (countSolutions(puzzle, size, boxRows, boxCols) === 1) {
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
    var size = gameState.boardSize || 9;
    var boardContainer = document.getElementById("sudoku-board");
    boardContainer.innerHTML = "";
    
    if (size === 6) {
        boardContainer.classList.add("size-6");
    } else {
        boardContainer.classList.remove("size-6");
    }
    
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
            var cell = document.createElement("div");
            cell.className = "sudoku-cell";
            cell.setAttribute("data-row", r);
            cell.setAttribute("data-col", c);
            
            // 경계선 처리
            if (size === 6) {
                // 2x3 블록: 가로 2행마다(r=1, r=3), 세로 3열마다(c=2)
                if (r === 1 || r === 3) cell.classList.add("border-bottom-thick");
                if (c === 2) cell.classList.add("border-right-thick");
            } else {
                // 3x3 블록: 가로 3행마다(r=2, r=5), 세로 3열마다(c=2, c=5)
                if (r === 2 || r === 5) cell.classList.add("border-bottom-thick");
                if (c === 2 || c === 5) cell.classList.add("border-right-thick");
            }
            
            // 포인터 이벤트(즉시 입력) 리스너 연결
            cell.onpointerdown = (function(row, col) {
                return function(e) {
                    e.preventDefault(); // 더블탭 줌 등 브라우저 지연 조작 제어 방지
                    // 잠금 모드: 잠금된 숫자 입력 또는 지우기 (메모 모드 포함)
                    if (numberLock.active) {
                        inputNumberToCell(row, col, numberLock.num);
                    } else if (eraseLock.active) {
                        eraseCell(row, col);
                    }
                    selectCell(row, col);
                };
            })(r, c);
            
            boardContainer.appendChild(cell);
        }
    }
}

// 보드 상태 그리기 (gameState -> DOM) - 실제 드로잉 로직
function _renderBoard() {
    var size = gameState.boardSize || 9;
    var boxRows = gameState.boxRows || (size === 6 ? 2 : 3);
    var boxCols = gameState.boxCols || 3;
    var cells = document.querySelectorAll(".sudoku-cell");
    
    cells.forEach(function(cellEl) {
        var r = parseInt(cellEl.getAttribute("data-row"));
        var c = parseInt(cellEl.getAttribute("data-col"));
        var stateCell = gameState.currentBoard[r][c];
        
        cellEl.innerHTML = ""; // 기존 내용 클리어
        
        // CSS 스타일 초기화
        cellEl.className = "sudoku-cell";
        if (size === 6) {
            if (r === 1 || r === 3) cellEl.classList.add("border-bottom-thick");
            if (c === 2) cellEl.classList.add("border-right-thick");
        } else {
            if (r === 2 || r === 5) cellEl.classList.add("border-bottom-thick");
            if (c === 2 || c === 5) cellEl.classList.add("border-right-thick");
        }
        
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
                if (size === 6) {
                    pencilGrid.classList.add("size-6");
                }
                for (var i = 1; i <= size; i++) {
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
        
        // 숫자 잠금 모드에서는 잠금된 숫자를 우선 하이라이트
        if (numberLock.active) {
            activeNum = numberLock.num;
        }
        
        if (sel) {
            // 3.1 선택 상태
            if (sel.r === r && sel.c === c) {
                cellEl.classList.add("selected");
            } 
            // 3.2 동일 행 / 동일 열 / 동일 블록 하이라이트
            else if (r === sel.r || c === sel.c || 
                    (Math.floor(r / boxRows) === Math.floor(sel.r / boxRows) && 
                     Math.floor(c / boxCols) === Math.floor(sel.c / boxCols))) {
                cellEl.classList.add("highlighted");
            }
            if (activeNum === 0) {
                activeNum = gameState.currentBoard[sel.r][sel.c].value;
            }
        }
        
        // 지우기 잠금 모드에서는 숫자 하이라이트 끔
        if (eraseLock.active) {
            activeNum = 0;
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
        
        // 3.4 스마트 논리 힌트 타겟 및 스코프 하이라이트
        if (activeSmartHint) {
            if (activeSmartHint.target.r === r && activeSmartHint.target.c === c) {
                cellEl.classList.add("hint-target");
            } else if (activeSmartHint.scope) {
                var inScopeRow = (activeSmartHint.scope.r === r);
                var inScopeCol = (activeSmartHint.scope.c === c);
                var inScopeBox = (Math.floor(r / boxRows) === activeSmartHint.scope.boxRow && Math.floor(c / boxCols) === activeSmartHint.scope.boxCol);
                if (inScopeRow || inScopeCol || inScopeBox) {
                    cellEl.classList.add("hint-scope");
                }
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

// 렌더 프레임 디바운스 래퍼 (연타 시 렌더링 스레드 차단으로 인한 유실 전면 해결)
var renderPending = false;
function renderBoard() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(function() {
        _renderBoard();
        renderPending = false;
    });
}

// ==========================================
// 6. 플레이 비즈니스 로직
// ==========================================

// 게임 시작 및 보드 마스킹 가동
function startNewGame(difficulty, size) {
    size = size || homeSelectedMode || 9;
    gameState.boardSize = size;
    gameState.boxRows = (size === 6) ? 2 : 3;
    gameState.boxCols = 3;
    gameState.difficulty = difficulty;
    
    // 1단계: 정답 보드 생성
    gameState.solutionBoard = sudokuGenerator.generateSolution(size);
    
    // 2단계: 유일해 보장 구멍 뚫기
    var masked = sudokuGenerator.generatePuzzle(gameState.solutionBoard, difficulty, size);
    gameState.initialBoard = masked;
    
    // 3단계: 플레이 보드 세팅
    gameState.currentBoard = [];
    for (var r = 0; r < size; r++) {
        var row = [];
        for (var c = 0; c < size; c++) {
            var val = masked[r][c];
            row.push({
                value: val,
                pencilMarks: new Array(size).fill(false),
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
    gameState.isCleared = false;
    
    cancelAllLocks(); // 새 게임 시작 시 잠금 상태 초기화
    clearActiveSmartHint();
    closeHintModal();
    
    updateWarningUI();
    document.getElementById("pencil-btn").classList.remove("active");
    document.getElementById("pencil-btn").querySelector("span").innerText = "메모 Off";
    updateHintButtonUI();
    
    var diffText = difficulty === 'easy' ? '초급' : (difficulty === 'medium' ? '중급' : '고급');
    var modeBadgeText = (size === 6) ? ("2x3 " + diffText) : ("3x3 " + diffText);
    document.getElementById("difficulty-badge").innerText = modeBadgeText;
    
    history.pushState({ screen: 'game' }, '', '#game');
    switchScreen("game-screen");
    generateHTMLBoard();
    renderBoard();
    startTimer();
    saveGame();
}

function continueGame() {
    var saved = localStorage.getItem("SUDOKU_SAVE_GAME");
    if (!saved) return;
    
    var data = JSON.parse(saved);
    gameState.boardSize = data.boardSize || 9;
    gameState.boxRows = data.boxRows || (gameState.boardSize === 6 ? 2 : 3);
    gameState.boxCols = data.boxCols || 3;
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
    gameState.isCleared = false;
    
    clearActiveSmartHint();
    closeHintModal();
    
    updateWarningUI();
    document.getElementById("pencil-btn").classList.remove("active");
    document.getElementById("pencil-btn").querySelector("span").innerText = "메모 Off";
    updateHintButtonUI();
    
    var diffText = gameState.difficulty === 'easy' ? '초급' : (gameState.difficulty === 'medium' ? '중급' : '고급');
    var modeBadgeText = (gameState.boardSize === 6) ? ("2x3 " + diffText) : ("3x3 " + diffText);
    document.getElementById("difficulty-badge").innerText = modeBadgeText;
    
    history.pushState({ screen: 'game' }, '', '#game');
    switchScreen("game-screen");
    generateHTMLBoard();
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
    cancelAllLocks(); // 홈 화면 이동 시 잠금 상태 해제
    clearActiveSmartHint();
    closeHintModal();
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
    var isCorrect = (cell.value !== 0 && cell.value === gameState.solutionBoard[row][col]);
    
    if (isInitial || isHint || isCorrect) {
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
    
    inputNumberToCell(gameState.selectedCell.r, gameState.selectedCell.c, num);
}

// 특정 셀에 숫자 입력 (홀딩 입력 & 기존 입력 공용)
function inputNumberToCell(r, c, num) {
    var cell = gameState.currentBoard[r][c];
    var isCorrect = (cell.value !== 0 && cell.value === gameState.solutionBoard[r][c]);
    
    // 고정값 또는 이미 제공된 힌트 셀 또는 확정된 정답 셀은 변경 불가
    if (gameState.initialBoard[r][c] !== 0 || cell.isHint || isCorrect) return;
    
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
                
                // 동일 행, 열, 블록의 메모에서 입력한 숫자 자동 소거
                removePencilMarksInScope(r, c, num);
            } else {
                playSFX('input');
            }
            
            gameState.selectedNumber = num;
            clearActiveSmartHint();
        }
    }
    
    updateErrors();
    renderBoard();
    saveGame();
    checkWinCondition();
}

// ==========================================
// 6-2. 숫자 잠금 입력 (키패드 숫자 터치 → 셀 터치 입력)
// ==========================================

// 숫자 키 터치: 같은 숫자를 다시 터치하면 잠금 해제, 다른 숫자를 터치하면 교체
function toggleNumberLock(num) {
    if (gameState.isPaused) return;
    
    // 같은 숫자 재터치 → 잠금 해제
    if (numberLock.active && numberLock.num === num) {
        cancelNumberLock();
        return;
    }
    
    // 다른 숫자 터치 또는 새 잠금 → 기존 잠금들 해제 후 새 숫자 잠금
    cancelAllLocks();
    numberLock.active = true;
    numberLock.num = num;
    
    // 잠금된 숫자로 보드 하이라이트 즉시 갱신
    gameState.selectedNumber = num;
    renderBoard();
    
    var btn = getKeyBtn(num);
    if (btn) btn.classList.add("locking");
    showLockBanner("숫자 " + num + " 입력 중 — 셀을 터치하세요");
    playSFX('pencil');
}

// 지우기 버튼 터치: 다시 터치하면 잠금 해제
function toggleEraseLock() {
    if (gameState.isPaused) return;
    
    if (eraseLock.active) {
        cancelEraseLock();
        return;
    }
    
    cancelAllLocks();
    eraseLock.active = true;
    
    // 지우기 모드에서는 숫자 하이라이트 해제
    gameState.selectedNumber = 0;
    renderBoard();
    
    var btn = document.getElementById("erase-btn");
    if (btn) {
        btn.classList.add("active");
        btn.querySelector("span").innerText = "지우는 중";
    }
    showLockBanner("지우기 모드 — 셀을 터치하세요");
    playSFX('pencil');
}

// 숫자 잠금 상태 해제
function cancelNumberLock() {
    var btn = numberLock.num ? getKeyBtn(numberLock.num) : null;
    if (btn) btn.classList.remove("locking");
    hideLockBanner();
    numberLock.active = false;
    numberLock.num = 0;
}

// 지우기 잠금 상태 해제
function cancelEraseLock() {
    var btn = document.getElementById("erase-btn");
    if (btn) {
        btn.classList.remove("active");
        btn.querySelector("span").innerText = "지우기";
    }
    hideLockBanner();
    eraseLock.active = false;
}

// 숫자/지우기 잠금 전체 해제
function cancelAllLocks() {
    cancelNumberLock();
    cancelEraseLock();
}

function getKeyBtn(num) {
    return document.querySelector('.keypad .key-btn[data-num="' + num + '"]');
}

function showLockBanner(message) {
    var banner = document.getElementById("lock-banner");
    if (banner) {
        document.getElementById("lock-banner-text").innerText = message;
        banner.classList.add("visible");
    }
}

function hideLockBanner() {
    var banner = document.getElementById("lock-banner");
    if (banner) banner.classList.remove("visible");
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
    eraseCell(gameState.selectedCell.r, gameState.selectedCell.c);
}

// 특정 셀 지우기 (지우기 잠금 입력 & 키보드 지우기 공용)
function eraseCell(r, c) {
    var cell = gameState.currentBoard[r][c];
    var isCorrect = (cell.value !== 0 && cell.value === gameState.solutionBoard[r][c]);
    
    if (gameState.initialBoard[r][c] !== 0 || cell.isHint || isCorrect) return;
    
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

function updateHintButtonUI() {
    var hintBtn = document.getElementById("hint-btn");
    if (!hintBtn) return;
    var span = hintBtn.querySelector("span");
    if (!span) return;
    if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.isNativeApp === 'function') {
        span.innerText = "힌트 (광고)";
    } else {
        span.innerText = "힌트 (" + (gameState.hintsLeft !== undefined ? gameState.hintsLeft : 3) + ")";
    }
}

function clearActiveSmartHint() {
    activeSmartHint = null;
    if (smartHintTimeout) {
        clearTimeout(smartHintTimeout);
        smartHintTimeout = null;
    }
}

// 스마트 논리 힌트 탐색 엔진 (풀 수 있는 지점 및 풀이 논리 자동 탐색)
function findSmartHint() {
    var size = gameState.boardSize || 9;
    var boxRows = gameState.boxRows || (size === 6 ? 2 : 3);
    var boxCols = gameState.boxCols || 3;
    var blockName = (size === 6) ? "2x3 블록" : "3x3 블록";
    
    // 1. 각 빈 칸에 들어갈 수 있는 후보 숫자(Candidates)와 배제된 숫자 계산
    var candidates = Array.from({ length: size }, () => new Array(size).fill(null));
    var excludedMap = Array.from({ length: size }, () => new Array(size).fill(null));
    var emptyCells = [];
    
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
            var cell = gameState.currentBoard[r][c];
            if (cell.value === 0) {
                var possible = [];
                var excluded = [];
                
                for (var num = 1; num <= size; num++) {
                    if (isSafe(r, c, num)) {
                        possible.push(num);
                    } else {
                        excluded.push(num);
                    }
                }
                candidates[r][c] = possible;
                excludedMap[r][c] = excluded;
                emptyCells.push({ r: r, c: c, possibleCount: possible.length, possible: possible });
            }
        }
    }
    
    if (emptyCells.length === 0) {
        return null;
    }
    
    // 만약 사용자가 이미 특정 빈 칸을 선택한 상태라면, 그 칸을 우선적으로 검토!
    if (gameState.selectedCell) {
        var sr = gameState.selectedCell.r;
        var sc = gameState.selectedCell.c;
        var sCell = gameState.currentBoard[sr][sc];
        if (sCell.value === 0 && gameState.initialBoard[sr][sc] === 0 && !sCell.isHint) {
            var sAns = gameState.solutionBoard[sr][sc];
            var sPossible = candidates[sr][sc] || [];
            var sExcluded = excludedMap[sr][sc] || [];
            
            if (sPossible.length === 1 && sPossible[0] === sAns) {
                return {
                    target: { r: sr, c: sc },
                    val: sAns,
                    technique: "단일 후보수 (Naked Single)",
                    badgeText: "유일한 숫자",
                    explanation: "선택하신 【" + (sr + 1) + "행 " + (sc + 1) + "열】을 살펴보세요!\n같은 가로줄, 세로줄, " + blockName + "에 이미 다른 숫자들 [" + sExcluded.join(', ') + "]이 모두 채워져 있어서, 이 칸에 들어갈 수 있는 숫자는 오직 [" + sAns + "]뿐입니다.",
                    scope: { r: sr, c: sc, boxRow: Math.floor(sr / boxRows), boxCol: Math.floor(sc / boxCols) },
                    reasonTags: sExcluded.map(n => ({ text: n + " 제외", isTarget: false })).concat([{ text: sAns + " 확정!", isTarget: true }])
                };
            }
        }
    }
    
    // 기법 1: Naked Single (단일 후보수) 자동 탐색
    for (var i = 0; i < emptyCells.length; i++) {
        var ec = emptyCells[i];
        if (ec.possibleCount === 1) {
            var ans = ec.possible[0];
            var correctAns = gameState.solutionBoard[ec.r][ec.c];
            if (ans === correctAns) {
                var excludedNums = excludedMap[ec.r][ec.c] || [];
                return {
                    target: { r: ec.r, c: ec.c },
                    val: ans,
                    technique: "단일 후보수 (Naked Single)",
                    badgeText: "유일한 숫자",
                    explanation: "【" + (ec.r + 1) + "행 " + (ec.c + 1) + "열】 칸을 주목해 보세요!\n같은 가로줄, 세로줄, " + blockName + "에 이미 다른 숫자들 [" + excludedNums.join(', ') + "]이 모두 채워져 있어서, 이 칸에는 오직 [" + ans + "]만 들어갈 수 있습니다.",
                    scope: { r: ec.r, c: ec.c, boxRow: Math.floor(ec.r / boxRows), boxCol: Math.floor(ec.c / boxCols) },
                    reasonTags: excludedNums.map(n => ({ text: n + " 제외", isTarget: false })).concat([{ text: ans + " 확정!", isTarget: true }])
                };
            }
        }
    }
    
    // 기법 2-A: Hidden Single (블록 내 유일 위치)
    var numBoxesRow = Math.floor(size / boxRows);
    var numBoxesCol = Math.floor(size / boxCols);
    for (var bRow = 0; bRow < numBoxesRow; bRow++) {
        for (var bCol = 0; bCol < numBoxesCol; bCol++) {
            var startR = bRow * boxRows;
            var startC = bCol * boxCols;
            
            for (var num = 1; num <= size; num++) {
                var alreadyInBox = false;
                for (var r = 0; r < boxRows; r++) {
                    for (var c = 0; c < boxCols; c++) {
                        if (gameState.currentBoard[startR + r][startC + c].value === num) {
                            alreadyInBox = true;
                            break;
                        }
                    }
                    if (alreadyInBox) break;
                }
                if (alreadyInBox) continue;
                
                var possiblePositions = [];
                for (var r = 0; r < boxRows; r++) {
                    for (var c = 0; c < boxCols; c++) {
                        var currR = startR + r;
                        var currC = startC + c;
                        if (gameState.currentBoard[currR][currC].value === 0 && candidates[currR][currC].includes(num)) {
                            possiblePositions.push({ r: currR, c: currC });
                        }
                    }
                }
                
                if (possiblePositions.length === 1) {
                    var target = possiblePositions[0];
                    if (gameState.solutionBoard[target.r][target.c] === num) {
                        return {
                            target: target,
                            val: num,
                            technique: "블록 내 유일 자리 (Hidden Single)",
                            badgeText: blockName + " 유일수",
                            explanation: "【" + (target.r + 1) + "행 " + (target.c + 1) + "열】이 속한 " + blockName + "을 확인해 보세요!\n주변 가로줄과 세로줄의 제약으로 인해, 이 블록 안에서 숫자 [" + num + "]이 들어갈 수 있는 빈 자리는 오직 이 칸 하나뿐입니다.",
                            scope: { r: target.r, c: target.c, boxRow: bRow, boxCol: bCol },
                            reasonTags: [{ text: blockName + " 구역", isTarget: false }, { text: "숫자 " + num + " 자리 확정!", isTarget: true }]
                        };
                    }
                }
            }
        }
    }
    
    // 기법 2-B: Hidden Single (가로줄 내 유일 위치)
    for (var r = 0; r < size; r++) {
        for (var num = 1; num <= size; num++) {
            var alreadyInRow = false;
            for (var c = 0; c < size; c++) {
                if (gameState.currentBoard[r][c].value === num) {
                    alreadyInRow = true;
                    break;
                }
            }
            if (alreadyInRow) continue;
            
            var possibleCols = [];
            for (var c = 0; c < size; c++) {
                if (gameState.currentBoard[r][c].value === 0 && candidates[r][c].includes(num)) {
                    possibleCols.push(c);
                }
            }
            
            if (possibleCols.length === 1) {
                var targetC = possibleCols[0];
                if (gameState.solutionBoard[r][targetC] === num) {
                    return {
                        target: { r: r, c: targetC },
                        val: num,
                        technique: "가로줄 내 유일 자리 (Hidden Single)",
                        badgeText: "가로줄 유일수",
                        explanation: "【" + (r + 1) + "행 " + (targetC + 1) + "열】이 속한 가로줄을 살펴보세요!\n세로줄과 블록의 간섭으로 인해, " + (r + 1) + "번째 가로줄에서 숫자 [" + num + "]이 들어갈 수 있는 자리는 오직 이 칸뿐입니다.",
                        scope: { r: r, c: targetC, boxRow: Math.floor(r / boxRows), boxCol: Math.floor(targetC / boxCols) },
                        reasonTags: [{ text: (r + 1) + "행 가로줄", isTarget: false }, { text: "숫자 " + num + " 자리 확정!", isTarget: true }]
                    };
                }
            }
        }
    }
    
    // 기법 2-C: Hidden Single (세로줄 내 유일 위치)
    for (var c = 0; c < size; c++) {
        for (var num = 1; num <= size; num++) {
            var alreadyInCol = false;
            for (var r = 0; r < size; r++) {
                if (gameState.currentBoard[r][c].value === num) {
                    alreadyInCol = true;
                    break;
                }
            }
            if (alreadyInCol) continue;
            
            var possibleRows = [];
            for (var r = 0; r < size; r++) {
                if (gameState.currentBoard[r][c].value === 0 && candidates[r][c].includes(num)) {
                    possibleRows.push(r);
                }
            }
            
            if (possibleRows.length === 1) {
                var targetR = possibleRows[0];
                if (gameState.solutionBoard[targetR][c] === num) {
                    return {
                        target: { r: targetR, c: c },
                        val: num,
                        technique: "세로줄 내 유일 자리 (Hidden Single)",
                        badgeText: "세로줄 유일수",
                        explanation: "【" + (targetR + 1) + "행 " + (c + 1) + "열】이 속한 세로줄을 살펴보세요!\n가로줄과 블록의 간섭으로 인해, " + (c + 1) + "번째 세로줄에서 숫자 [" + num + "]이 들어갈 수 있는 자리는 오직 이 칸뿐입니다.",
                        scope: { r: targetR, c: c, boxRow: Math.floor(targetR / boxRows), boxCol: Math.floor(c / boxCols) },
                        reasonTags: [{ text: (c + 1) + "열 세로줄", isTarget: false }, { text: "숫자 " + num + " 자리 확정!", isTarget: true }]
                    };
                }
            }
        }
    }
    
    // 기법 3: Fallback (최소 후보수 칸 추천)
    emptyCells.sort((a, b) => a.possibleCount - b.possibleCount);
    for (var i = 0; i < emptyCells.length; i++) {
        var ec = emptyCells[i];
        var ans = gameState.solutionBoard[ec.r][ec.c];
        if (ec.possible.includes(ans)) {
            var candStr = ec.possible.join(', ');
            return {
                target: { r: ec.r, c: ec.c },
                val: ans,
                technique: "최소 후보수 추천 지점",
                badgeText: "핵심 추천",
                explanation: "현재 판에서 후보가 가장 좁혀진 핵심 칸인 【" + (ec.r + 1) + "행 " + (ec.c + 1) + "열】을 확인해 보세요!\n가능한 후보 숫자가 [" + candStr + "]뿐이며, 논리적인 정답은 [" + ans + "]입니다.",
                scope: { r: ec.r, c: ec.c, boxRow: Math.floor(ec.r / boxRows), boxCol: Math.floor(ec.c / boxCols) },
                reasonTags: ec.possible.map(n => ({ text: "후보 " + n, isTarget: (n === ans) }))
            };
        }
    }
    
    // 최종 Fallback: 첫 번째 빈 칸
    var firstEmpty = emptyCells[0];
    var firstAns = gameState.solutionBoard[firstEmpty.r][firstEmpty.c];
    return {
        target: { r: firstEmpty.r, c: firstEmpty.c },
        val: firstAns,
        technique: "추천 풀이 지점",
        badgeText: "추천 칸",
        explanation: "【" + (firstEmpty.r + 1) + "행 " + (firstEmpty.c + 1) + "열】을 살펴보세요. 가로줄, 세로줄 및 블록의 단서들을 종합하면 정답은 [" + firstAns + "]입니다.",
        scope: { r: firstEmpty.r, c: firstEmpty.c, boxRow: Math.floor(firstEmpty.r / boxRows), boxCol: Math.floor(firstEmpty.c / boxCols) },
        reasonTags: [{ text: "정답 " + firstAns, isTarget: true }]
    };
}

function openHintModal(hint) {
    activeSmartHint = hint;
    
    var posText = (hint.target.r + 1) + "행 " + (hint.target.c + 1) + "열 추천";
    var posEl = document.getElementById("hint-target-pos");
    var badgeEl = document.getElementById("hint-technique-badge");
    var expEl = document.getElementById("hint-explanation-text");
    var tagsContainer = document.getElementById("hint-reason-tags");
    
    if (posEl) posEl.innerText = posText;
    if (badgeEl) badgeEl.innerText = hint.badgeText || hint.technique;
    if (expEl) expEl.innerText = hint.explanation;
    
    if (tagsContainer) {
        tagsContainer.innerHTML = "";
        if (hint.reasonTags && hint.reasonTags.length > 0) {
            hint.reasonTags.forEach(function(tag) {
                var tagEl = document.createElement("span");
                tagEl.className = "hint-reason-tag" + (tag.isTarget ? " target-val" : "");
                tagEl.innerText = tag.text;
                tagsContainer.appendChild(tagEl);
            });
        }
    }
    
    // 추천된 셀로 포커스 자동 선택
    gameState.selectedCell = { r: hint.target.r, c: hint.target.c };
    gameState.selectedNumber = 0;
    
    // 보드 렌더링 (타겟 펄스 및 스코프 하이라이트 반영)
    renderBoard();
    
    // 모달 표시
    var modal = document.getElementById("hint-modal");
    if (modal) modal.style.display = "flex";
}

function closeHintModal() {
    var modal = document.getElementById("hint-modal");
    if (modal) modal.style.display = "none";
}

function solveHintManually() {
    closeHintModal();
    // 사용자가 해당 칸을 직접 채울 수 있도록 15초 동안 힌트 타겟 펄스 유지
    if (smartHintTimeout) clearTimeout(smartHintTimeout);
    smartHintTimeout = setTimeout(function() {
        activeSmartHint = null;
        renderBoard();
    }, 15000);
}

function autoFillHintAnswer() {
    closeHintModal();
    if (!activeSmartHint) return;
    
    var r = activeSmartHint.target.r;
    var c = activeSmartHint.target.c;
    var ans = activeSmartHint.val;
    
    saveActionToHistory();
    
    var cell = gameState.currentBoard[r][c];
    cell.value = ans;
    cell.isHint = true;
    cell.pencilMarks.fill(false);
    gameState.selectedNumber = ans;
    
    removePencilMarksInScope(r, c, ans);
    
    if (gameState.hintsLeft > 0) {
        gameState.hintsLeft--;
    }
    updateHintButtonUI();
    
    clearActiveSmartHint();
    gameState.selectedCell = null;
    
    playSFX('input');
    updateErrors();
    renderBoard();
    saveGame();
    checkWinCondition();
}

function executeSmartHintFlow() {
    var hint = findSmartHint();
    if (!hint) {
        showZenAlert("알림 💡", "현재 풀 수 있는 빈 칸이 없거나 이미 모든 칸이 채워졌습니다.", "info");
        return;
    }
    
    openHintModal(hint);
}

function triggerHint() {
    if (gameState.isPaused) return;
    
    // 네이티브 앱 환경: 보상형 전면 광고 호출
    if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.showRewardedAdForHint === 'function') {
        window.AndroidNativeBridge.showRewardedAdForHint();
        return;
    }
    
    // 웹 환경: 남은 힌트 횟수 검증
    if (gameState.hintsLeft <= 0) {
        showZenAlert("힌트 소진 💡", "남은 힌트가 없습니다.", "info");
        return;
    }
    
    executeSmartHintFlow();
}

// 레거시 호환용 함수
function executeHintOnSelectedCell() {
    executeSmartHintFlow();
}

// 네이티브 브릿지에서 보상형 광고 시청 완료 시 호출되는 글로벌 콜백
window.onHintRewardGranted = function() {
    executeSmartHintFlow();
};

// 실시간 에러(정답 대조) 마킹
function updateErrors() {
    var size = gameState.boardSize || 9;
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
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
    var size = gameState.boardSize || 9;
    var isFull = true;
    var hasError = false;
    
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
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
    var timerOn = isTimerEnabled();
    var timerStr = timerOn ? formatTime(gameState.seconds) : "--:--";
    document.getElementById("clear-time").innerText = timerStr;
    
    // 최고 기록 처리 (타이머를 사용할 때만 기록 갱신)
    var records = JSON.parse(localStorage.getItem("SUDOKU_BEST_RECORDS")) || {
        easy: null,
        medium: null,
        hard: null,
        easy6: null,
        medium6: null,
        hard6: null
    };
    
    var diff = gameState.difficulty;
    var recordKey = (gameState.boardSize === 6) ? (diff + "6") : diff;
    var isNewRecord = false;
    
    if (timerOn && (records[recordKey] === null || records[recordKey] === undefined || gameState.seconds < records[recordKey])) {
        records[recordKey] = gameState.seconds;
        localStorage.setItem("SUDOKU_BEST_RECORDS", JSON.stringify(records));
        isNewRecord = true;
    }
    
    document.getElementById("new-record-badge").style.display = isNewRecord ? "inline-block" : "none";
    document.getElementById("clear-modal").style.display = "flex";
    
    // 클리어 플래그 활성화 및 진행중 세션 영구 제거
    gameState.isCleared = true;
    localStorage.removeItem("SUDOKU_SAVE_GAME");
    checkSavedGame();
}

function restartFromClear() {
    document.getElementById("clear-modal").style.display = "none";
    startNewGame(gameState.difficulty, gameState.boardSize);
}

function exitToHomeFromClear() {
    document.getElementById("clear-modal").style.display = "none";
    exitToHome();
}

// ==========================================
// 8. 타이머 및 자동 저장 영속성
// ==========================================

// 타이머 사용 여부 (기본값: 사용 안 함)
function isTimerEnabled() {
    return localStorage.getItem("sudoku_timer_enabled") === "on";
}

function toggleTimerSetting() {
    var enabled = !isTimerEnabled();
    localStorage.setItem("sudoku_timer_enabled", enabled ? "on" : "off");
    applyTimerSetting();
    updateSettingsUI();
}

function isSFXEnabled() {
    var val = localStorage.getItem("sudoku_sfx_enabled");
    return val === null ? true : (val === "on");
}

function toggleSFXSetting() {
    var enabled = !isSFXEnabled();
    localStorage.setItem("sudoku_sfx_enabled", enabled ? "on" : "off");
    updateSettingsUI();
    if (enabled) playSFX('input');
}

function isVibrationEnabled() {
    var val = localStorage.getItem("sudoku_vibration_enabled");
    return val === null ? true : (val === "on");
}

function toggleVibrationSetting() {
    var enabled = !isVibrationEnabled();
    localStorage.setItem("sudoku_vibration_enabled", enabled ? "on" : "off");
    updateSettingsUI();
    if (enabled) triggerVibration('error');
}

function updateSettingsUI() {
    var timerToggle = document.getElementById("timer-toggle");
    if (timerToggle) timerToggle.checked = isTimerEnabled();

    var sfxToggle = document.getElementById("sfx-toggle");
    if (sfxToggle) sfxToggle.checked = isSFXEnabled();

    var vibToggle = document.getElementById("vibration-toggle");
    if (vibToggle) vibToggle.checked = isVibrationEnabled();

    var currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    var themeStatusText = document.getElementById("theme-status-text");
    var themeBtnLabel = document.getElementById("theme-btn-label");
    if (themeStatusText) {
        themeStatusText.innerText = (currentTheme === "dark") ? "다크 테마 사용 중" : "라이트 테마 사용 중";
    }
    if (themeBtnLabel) {
        themeBtnLabel.innerText = (currentTheme === "dark") ? "라이트 모드로" : "다크 모드로";
    }
}

function applyTimerSetting() {
    // 설정 모달 내 토글 스위치 상태 반영
    var toggle = document.getElementById("timer-toggle");
    if (toggle) toggle.checked = isTimerEnabled();

    // 게임 화면 타이머 배지 표시/숨김
    var timerEl = document.getElementById("timerDisplay");
    if (timerEl) timerEl.style.display = isTimerEnabled() ? "" : "none";

    if (isTimerEnabled()) {
        // 게임 진행 중에 켠 경우 0부터 다시 시작
        if (document.getElementById("game-screen").classList.contains("active") && !gameState.isPaused) {
            gameState.seconds = 0;
            updateTimerDisplay();
            startTimer();
        }
    } else {
        // 꺼지면 타이머 정지 및 시간 초기화
        stopTimer();
        gameState.seconds = 0;
        updateTimerDisplay();
    }
}

function startTimer() {
    if (!isTimerEnabled()) return;
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
        cancelAllLocks(); // 일시정지 시 잠금 상태 해제
    } else {
        modal.style.display = "none";
        startTimer();
    }
}

function saveGame() {
    // 게임이 이미 클리어되었거나 완성된 상태라면 저장하지 않고 세션 삭제
    if (gameState.isCleared || isGameCompleted()) {
        localStorage.removeItem("SUDOKU_SAVE_GAME");
        return;
    }
    
    if (!gameState.currentBoard || gameState.currentBoard.length === 0) {
        return;
    }

    var dataToSave = {
        boardSize: gameState.boardSize || 9,
        boxRows: gameState.boxRows || (gameState.boardSize === 6 ? 2 : 3),
        boxCols: gameState.boxCols || 3,
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

function openRecordsModal() {
    loadBestRecords();
    document.getElementById("records-modal").style.display = "flex";
}

function closeRecordsModal() {
    document.getElementById("records-modal").style.display = "none";
}

function resetBestRecordsPrompt() {
    if (confirm("정말 모든 난이도의 개인 최고 기록을 초기화하시겠습니까?")) {
        localStorage.removeItem("SUDOKU_BEST_RECORDS");
        loadBestRecords();
    }
}

function openSettingsModal() {
    updateSettingsUI();
    document.getElementById("settings-modal").style.display = "flex";
}

function closeSettingsModal() {
    document.getElementById("settings-modal").style.display = "none";
}

function openHelpModal() {
    document.getElementById("help-modal").style.display = "flex";
}

function closeHelpModal() {
    document.getElementById("help-modal").style.display = "none";
}

function handleModalOverlayClick(e, modalId) {
    if (e.target && e.target.id === modalId) {
        if (modalId === 'hint-modal') {
            solveHintManually();
            return;
        }
        var modal = document.getElementById(modalId);
        if (modal) modal.style.display = "none";
    }
}

// 물리 키보드 바인딩
document.onkeydown = function(e) {
    if (gameState.isPaused || !gameState.selectedCell) return;
    
    var size = gameState.boardSize || 9;
    // 1-size 숫자 키 대응
    if (e.key >= '1' && e.key <= String(size)) {
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
    var size = gameState.boardSize || 9;
    var boxRows = gameState.boxRows || (size === 6 ? 2 : 3);
    var boxCols = gameState.boxCols || 3;
    
    // 1. 행 검사 (가로)
    for (var i = 0; i < size; i++) {
        if (i !== col && gameState.currentBoard[row][i].value === num) {
            return false;
        }
    }
    // 2. 열 검사 (세로)
    for (var i = 0; i < size; i++) {
        if (i !== row && gameState.currentBoard[i][col].value === num) {
            return false;
        }
    }
    // 3. 블록 검사 (구역)
    var startRow = Math.floor(row / boxRows) * boxRows;
    var startCol = Math.floor(col / boxCols) * boxCols;
    for (var r = 0; r < boxRows; r++) {
        for (var c = 0; c < boxCols; c++) {
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
    var size = gameState.boardSize || 9;
    var boxRows = gameState.boxRows || (size === 6 ? 2 : 3);
    var boxCols = gameState.boxCols || 3;
    var idx = num - 1;
    
    // 1. 동일 행(Row) 메모 소거
    for (var c = 0; c < size; c++) {
        if (c !== col) {
            gameState.currentBoard[row][c].pencilMarks[idx] = false;
        }
    }
    
    // 2. 동일 열(Col) 메모 소거
    for (var r = 0; r < size; r++) {
        if (r !== row) {
            gameState.currentBoard[r][col].pencilMarks[idx] = false;
        }
    }
    
    // 3. 동일 블록(Box) 메모 소거
    var startRow = Math.floor(row / boxRows) * boxRows;
    var startCol = Math.floor(col / boxCols) * boxCols;
    for (var r = 0; r < boxRows; r++) {
        for (var c = 0; c < boxCols; c++) {
            var currR = startRow + r;
            var currC = startCol + c;
            if (currR !== row || currC !== col) {
                gameState.currentBoard[currR][currC].pencilMarks[idx] = false;
            }
        }
    }
}

function updateKeypad() {
    var size = gameState.boardSize || 9;
    var keypad = document.querySelector(".keypad");
    if (keypad) {
        if (size === 6) {
            keypad.classList.add("size-6");
        } else {
            keypad.classList.remove("size-6");
        }
    }
    
    // 1~size 숫자별 보드 위 존재 개수 집계
    var counts = new Array(size + 1).fill(0);
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
            var val = gameState.currentBoard[r][c].value;
            if (val >= 1 && val <= size) {
                counts[val]++;
            }
        }
    }
    
    // 키패드 버튼 제어 (6x6일 때는 7~9 숨김)
    var keyBtns = document.querySelectorAll(".keypad .key-btn");
    keyBtns.forEach(function(btn, idx) {
        var num = idx + 1;
        if (num > size) {
            btn.style.display = "none";
        } else {
            btn.style.display = "";
            var isCompleted = (counts[num] >= size);
            if (isCompleted) {
                btn.setAttribute("disabled", "true");
                btn.classList.add("completed");
            } else {
                btn.removeAttribute("disabled");
                btn.classList.remove("completed");
            }
        }
    });
}

// ==========================================
// 11. 사운드(Web Audio API) 및 햅틱 진동 효과 유틸리티
// ==========================================
var audioCtx = null;

function playSFX(type) {
    if (!isSFXEnabled()) return;
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
    if (!isVibrationEnabled()) return;
    if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.vibrate === 'function') {
        window.AndroidNativeBridge.vibrate(type === 'error' ? 120 : 50);
        return;
    }
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
    var size = gameState.boardSize || 9;
    var boxRows = gameState.boxRows || (size === 6 ? 2 : 3);
    var boxCols = gameState.boxCols || 3;
    
    var conflictCells = [];
    var conflictRows = new Set();
    var conflictCols = new Set();
    var conflictBoxes = false;
    
    // 1. 행 검사 (중복 원인 탐색)
    for (var i = 0; i < size; i++) {
        if (i !== col && gameState.currentBoard[row][i].value === num) {
            conflictCells.push({ r: row, c: i });
            conflictRows.add(row);
        }
    }
    
    // 2. 열 검사 (중복 원인 탐색)
    for (var i = 0; i < size; i++) {
        if (i !== row && gameState.currentBoard[i][col].value === num) {
            conflictCells.push({ r: i, c: col });
            conflictCols.add(col);
        }
    }
    
    // 3. 블록 검사 (중복 원인 탐색)
    var startRow = Math.floor(row / boxRows) * boxRows;
    var startCol = Math.floor(col / boxCols) * boxCols;
    for (var r = 0; r < boxRows; r++) {
        for (var c = 0; c < boxCols; c++) {
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
        var inBox = conflictBoxes && (Math.floor(r / boxRows) === Math.floor(row / boxRows) && Math.floor(c / boxCols) === Math.floor(col / boxCols));
        
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

// ==========================================
// 12. 백업 및 복구 매니저 (JSON 백업/가져오기)
// ==========================================

var zenAlertCallback = null;

function showZenAlert(title, message, iconType, onConfirm) {
    var modal = document.getElementById("zen-alert-modal");
    if (!modal) {
        alert(message);
        if (typeof onConfirm === 'function') onConfirm();
        return;
    }
    
    document.getElementById("zen-alert-title").innerText = title || "알림";
    document.getElementById("zen-alert-message").innerText = message || "";
    
    var iconEl = document.getElementById("zen-alert-icon");
    if (iconType === 'success') {
        iconEl.innerText = "✨";
    } else if (iconType === 'error') {
        iconEl.innerText = "⚠️";
    } else if (iconType === 'restore') {
        iconEl.innerText = "📂";
    } else if (iconType === 'backup') {
        iconEl.innerText = "🛡️";
    } else {
        iconEl.innerText = "💡";
    }
    
    zenAlertCallback = onConfirm || null;
    modal.style.display = "flex";
}

function closeZenAlert() {
    var modal = document.getElementById("zen-alert-modal");
    if (modal) {
        modal.style.display = "none";
    }
    if (typeof zenAlertCallback === 'function') {
        var cb = zenAlertCallback;
        zenAlertCallback = null;
        cb();
    }
}

function openBackupModal() {
    document.getElementById("backup-modal").style.display = "flex";
}

function closeBackupModal() {
    document.getElementById("backup-modal").style.display = "none";
}

function exportBackup() {
    try {
        var backupData = {
            version: APP_VERSION,
            timestamp: new Date().toISOString(),
            records: localStorage.getItem("SUDOKU_BEST_RECORDS"),
            saveGame: localStorage.getItem("SUDOKU_SAVE_GAME"),
            theme: localStorage.getItem("sudoku_theme"),
            timerEnabled: localStorage.getItem("sudoku_timer_enabled")
        };
        
        var jsonStr = JSON.stringify(backupData, null, 2);
        var fileName = "sudoku_zen_backup_" + new Date().toISOString().slice(0,10) + ".json";
        
        // 1. 안드로이드 하이브리드 앱 네이티브 환경
        if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.saveBackupFile === 'function') {
            var isSaved = window.AndroidNativeBridge.saveBackupFile(jsonStr, fileName);
            if (isSaved) {
                playSFX('input');
                closeBackupModal();
                showZenAlert(
                    "백업 완료 🛡️",
                    "다운로드(Download) 폴더에 백업 파일이 안전하게 저장되었습니다!\n\n파일명: " + fileName,
                    "backup"
                );
            } else {
                playSFX('error');
                showZenAlert(
                    "백업 실패 ⚠️",
                    "백업 파일을 기기에 저장하는 중 문제가 발생했습니다.",
                    "error"
                );
            }
            return;
        }
        
        // 2. 일반 웹 브라우저 환경 Fallback
        var blob = new Blob([jsonStr], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        
        var a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        playSFX('input');
        closeBackupModal();
        showZenAlert(
            "백업 완료 🛡️",
            "백업 파일 다운로드가 완료되었습니다.\n\n파일명: " + fileName,
            "backup"
        );
    } catch (e) {
        playSFX('error');
        showZenAlert(
            "백업 오류 ⚠️",
            "백업 파일 생성 중 에러가 발생했습니다:\n" + e.message,
            "error"
        );
    }
}

function importBackup(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            
            if (data.records === undefined || data.theme === undefined) {
                throw new Error("올바른 Sudoku Zen 백업 파일 형식이 아닙니다.");
            }
            
            if (data.records) {
                localStorage.setItem("SUDOKU_BEST_RECORDS", data.records);
            }
            if (data.saveGame) {
                localStorage.setItem("SUDOKU_SAVE_GAME", data.saveGame);
            } else {
                localStorage.removeItem("SUDOKU_SAVE_GAME");
            }
            if (data.theme) {
                localStorage.setItem("sudoku_theme", data.theme);
            }
            if (data.timerEnabled !== undefined && data.timerEnabled !== null) {
                localStorage.setItem("sudoku_timer_enabled", data.timerEnabled);
            }
            
            playSFX('input');
            closeBackupModal();
            showZenAlert(
                "복구 완료 🎉",
                "개인 최고 기록과 저장 데이터가 안전하게 복구되었습니다!\n\n확인을 누르면 화면이 새로고침됩니다.",
                "restore",
                function() {
                    location.reload();
                }
            );
        } catch (err) {
            playSFX('error');
            showZenAlert(
                "복구 실패 ⚠️",
                "기록 복구 중 오류가 발생했습니다:\n" + err.message,
                "error"
            );
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

// 두 손가락 이상 터치 시 브라우저 핀치 줌(확대/축소) 제스처 강제 차단 (iOS/PWA 대응)
document.addEventListener('touchmove', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

window.addEventListener('DOMContentLoaded', function() {
    updateHintButtonUI();
});