import { PRESET_STAGES, generateRandomStage } from './stages.js';

// --- 앱 버전 관리 (캐시 무효화용) ---
const APP_VERSION = "1.0.4";
const STORAGE_KEY_VERSION = "queens_app_version_v1";

function checkAppVersion() {
  const savedVersion = localStorage.getItem(STORAGE_KEY_VERSION);
  if (savedVersion !== APP_VERSION) {
    localStorage.setItem(STORAGE_KEY_VERSION, APP_VERSION);
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  }
}

// --- 게임 상태 (State) ---
let currentStage = null;
let currentDifficulty = 5; // 5, 7, 9
let boardState = []; // NxN 2차원 배열. 값: "", "Q", "X"
let history = []; // 실행 취소(Undo) 스택
let secondsElapsed = 0;
let timerInterval = null;
let isPaused = false;
let currentTool = "Q"; // "Q" (퀸) 또는 "X" (메모)
let dragActive = false; // 드래그 드로잉 활성화 여부
let dragVal = ""; // 드래그 중 채울 값 ("X", "" 등)
let gameCleared = false;
let hintCount = 0;

// 로컬 스토리지 키
const STORAGE_KEY_RECORDS = "queens_puzzle_records_v1";

// --- 로컬 레코드 관리 ---
function loadRecords() {
  const data = localStorage.getItem(STORAGE_KEY_RECORDS);
  return data ? JSON.parse(data) : {};
}

function saveRecord(stageId, timeSec) {
  const records = loadRecords();
  if (!records[stageId] || records[stageId] > timeSec) {
    records[stageId] = timeSec;
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    return true; // 신기록 달성
  }
  return false;
}

// --- 데이터 백업 및 복원 기능 ---
function backupData() {
  const records = loadRecords();
  if (Object.keys(records).length === 0) {
    showToast("백업할 클리어 기록이 없습니다.");
    return;
  }
  
  try {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `queens_puzzle_backup_${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast("기록이 파일로 안전하게 백업되었습니다!");
    triggerHaptic();
  } catch (err) {
    showToast("백업 파일 생성에 실패했습니다.");
    console.error(err);
  }
}

function triggerRestore() {
  document.getElementById("file-restore").click();
}

function handleRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const importedData = JSON.parse(evt.target.result);
      
      if (typeof importedData !== "object" || importedData === null || Array.isArray(importedData)) {
        throw new Error("Invalid format");
      }

      const currentRecords = loadRecords();
      let mergedCount = 0;

      Object.keys(importedData).forEach(stageId => {
        const importedTime = importedData[stageId];
        if (typeof importedTime === "number") {
          if (!currentRecords[stageId] || currentRecords[stageId] > importedTime) {
            currentRecords[stageId] = importedTime;
            mergedCount++;
          }
        }
      });

      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(currentRecords));
      
      showToast(`${mergedCount}개의 신기록이 성공적으로 복원/병합되었습니다!`);
      triggerHaptic("success");
      renderLobby();
    } catch (err) {
      showToast("오류: 올바르지 않은 백업 파일 형식입니다.");
      triggerHaptic("error");
      console.error(err);
    }
    e.target.value = "";
  };
  reader.readAsText(file);
}

// --- 코어 규칙 검증 (Validator) ---
function validateBoard() {
  if (!currentStage) return { isValid: false, conflicts: {}, queenCount: 0 };
  const size = currentStage.size;
  const regions = currentStage.regions;

  const queens = [];
  let queenCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (boardState[r][c] === "Q") {
        queens.push({ r, c, region: regions[r][c] });
        queenCount++;
      }
    }
  }

  const conflicts = {};
  const markConflict = (r, c, type) => {
    const key = `${r}-${c}`;
    if (!conflicts[key]) {
      conflicts[key] = { row: false, col: false, region: false, adj: false };
    }
    conflicts[key][type] = true;
  };

  const rowQueens = Array.from({ length: size }, () => []);
  const colQueens = Array.from({ length: size }, () => []);
  const regionQueens = {};

  queens.forEach(q => {
    rowQueens[q.r].push(q);
    colQueens[q.c].push(q);
    if (!regionQueens[q.region]) regionQueens[q.region] = [];
    regionQueens[q.region].push(q);
  });

  for (let r = 0; r < size; r++) {
    if (rowQueens[r].length > 1) {
      rowQueens[r].forEach(q => markConflict(q.r, q.c, 'row'));
    }
  }

  for (let c = 0; c < size; c++) {
    if (colQueens[c].length > 1) {
      colQueens[c].forEach(q => markConflict(q.r, q.c, 'col'));
    }
  }

  Object.keys(regionQueens).forEach(regId => {
    if (regionQueens[regId].length > 1) {
      regionQueens[regId].forEach(q => markConflict(q.r, q.c, 'region'));
    }
  });

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const q1 = queens[i];
      const q2 = queens[j];
      if (Math.abs(q1.r - q2.r) <= 1 && Math.abs(q1.c - q2.c) <= 1) {
        markConflict(q1.r, q1.c, 'adj');
        markConflict(q2.r, q2.c, 'adj');
      }
    }
  }

  const hasConflict = Object.keys(conflicts).length > 0;
  const isValid = queenCount === size && !hasConflict;

  return {
    isValid,
    conflicts,
    queenCount
  };
}

// --- 상태 변경 내역 저장 (Undo) ---
function pushHistory() {
  history.push(JSON.stringify(boardState));
  if (history.length > 50) history.shift();
  updateUndoButtonState();
}

function undo() {
  if (history.length === 0 || gameCleared) return;
  const prevState = JSON.parse(history.pop());
  boardState = prevState;
  triggerHaptic();
  renderBoard();
  checkGameWin();
  updateUndoButtonState();
}

function updateUndoButtonState() {
  const btn = document.getElementById("btn-undo");
  if (btn) btn.disabled = history.length === 0;
}

// --- 진동 피드백 ---
function triggerHaptic(type = "light") {
  if (navigator.vibrate) {
    if (type === "light") navigator.vibrate(10);
    else if (type === "success") navigator.vibrate([50, 30, 50]);
    else if (type === "error") navigator.vibrate(100);
  }
}

// --- 타이머 관련 ---
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused && !gameCleared) {
      secondsElapsed++;
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.getElementById("timer-display").textContent = timeStr;
}

// --- 보드판 최초 생성 (격자 틀 1회만 그리기 - 성능 최적화 및 터치 드래그 감도 보장) ---
function createBoardDOM() {
  const boardEl = document.getElementById("game-board");
  boardEl.innerHTML = "";

  const size = currentStage.size;
  const colors = currentStage.colors;
  const regions = currentStage.regions;

  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      const regionId = regions[r][c];
      const regionColor = colors[regionId];
      cell.style.backgroundColor = regionColor;

      // 영역 구분선 굵게 표시
      if (r === 0 || regions[r - 1][c] !== regionId) cell.classList.add("border-top-thick");
      if (r === size - 1 || regions[r + 1][c] !== regionId) cell.classList.add("border-bottom-thick");
      if (c === 0 || regions[r][c - 1] !== regionId) cell.classList.add("border-left-thick");
      if (c === size - 1 || regions[r][c + 1] !== regionId) cell.classList.add("border-right-thick");

      // 이벤트 리스너 바인딩
      cell.addEventListener("mousedown", handleCellStart);
      cell.addEventListener("mouseenter", handleCellEnter);
      cell.addEventListener("touchstart", handleTouchStart, { passive: false });

      boardEl.appendChild(cell);
    }
  }
}

// --- 부분 DOM 업데이트 (Partial Rendering) ---
function updateBoardStateUI() {
  if (!currentStage) return;
  const size = currentStage.size;
  const { conflicts } = validateBoard();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.querySelector(`.board-cell[data-row="${r}"][data-col="${c}"]`);
      if (!cell) continue;

      const val = boardState[r][c];
      const hasQueen = cell.classList.contains("has-queen");
      const hasX = cell.classList.contains("has-x");
      const isConflict = cell.classList.contains("conflict-blink");

      // 값에 맞게 HTML 내용 갱신 (불필요한 DOM 쓰기 방지)
      if (val === "Q") {
        if (!hasQueen) {
          cell.innerHTML = `
            <svg class="queen-svg" viewBox="0 0 100 100">
              <path d="M15,85 L85,85 L80,70 L20,70 Z" fill="currentColor"/>
              <path d="M22,70 L15,35 L33,55 L50,25 L67,55 L85,35 L78,70 Z" fill="currentColor"/>
              <circle cx="15" cy="31" r="5" fill="currentColor"/>
              <circle cx="33" cy="51" r="5" fill="currentColor"/>
              <circle cx="50" cy="21" r="5" fill="currentColor"/>
              <circle cx="67" cy="51" r="5" fill="currentColor"/>
              <circle cx="85" cy="31" r="5" fill="currentColor"/>
            </svg>
          `;
          cell.classList.add("has-queen");
          cell.classList.remove("has-x");
        }
      } else if (val === "X") {
        if (!hasX) {
          cell.innerHTML = '<span class="x-mark">×</span>';
          cell.classList.add("has-x");
          cell.classList.remove("has-queen");
        }
      } else {
        if (hasQueen || hasX || cell.innerHTML !== "") {
          cell.innerHTML = "";
          cell.classList.remove("has-queen", "has-x");
        }
      }

      // 규칙 충돌 갱신
      const shouldConflict = !!conflicts[`${r}-${c}`];
      if (shouldConflict !== isConflict) {
        if (shouldConflict) {
          cell.classList.add("conflict-blink");
        } else {
          cell.classList.remove("conflict-blink");
        }
      }
    }
  }

  updateInfoDisplay();
}

function renderBoard() {
  updateBoardStateUI();
}

function updateInfoDisplay() {
  const size = currentStage.size;
  let qCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (boardState[r][c] === "Q") qCount++;
    }
  }
  document.getElementById("queen-counter").textContent = `${qCount} / ${size}`;
}

// --- 사용자 터치/마우스 이벤트 핸들러 ---
function handleCellStart(e) {
  if (gameCleared) return;
  e.preventDefault();
  const row = parseInt(this.dataset.row);
  const col = parseInt(this.dataset.col);

  let activeTool = currentTool;
  if (e.button === 2) {
    activeTool = currentTool === "Q" ? "X" : "Q";
  }

  pushHistory();
  toggleCell(row, col, activeTool);

  dragActive = true;
  
  // 사용자가 "X 드래그로 쭉 채우기"를 원할 때:
  // 도구가 X 모드라면, 첫 터치로 토글되어 지워지거나 생기더라도 
  // 드래그 시에는 "무조건 X를 칠하는(Painting)" 동작을 수행하게 유도
  if (activeTool === "X") {
    dragVal = "X";
  } else {
    // 퀸 모드 등 일반적인 드래그 토글 보존
    dragVal = boardState[row][col];
  }
  
  triggerHaptic();
}

function handleCellEnter(e) {
  if (!dragActive || gameCleared) return;
  const row = parseInt(this.dataset.row);
  const col = parseInt(this.dataset.col);

  // 퀸은 드래그로 연속 배치할 수 없음 (퀸 중복 오류 방지)
  if (dragVal === "Q" || boardState[row][col] === "Q") return;

  if (boardState[row][col] !== dragVal) {
    boardState[row][col] = dragVal;
    renderBoard();
    checkGameWin();
  }
}

function handleTouchStart(e) {
  if (gameCleared) return;
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  const cell = target.closest(".board-cell");
  if (!cell) return;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  pushHistory();
  toggleCell(row, col, currentTool);

  dragActive = true;
  
  // 터치 드래그 시 X 모드이면 라인에 쭉 X가 칠해지도록 보정
  if (currentTool === "X") {
    dragVal = "X";
  } else {
    dragVal = boardState[row][col];
  }
  
  triggerHaptic();
}

function handleTouchMove(e) {
  if (!dragActive || gameCleared) return;
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  
  const cell = target.closest(".board-cell");
  if (!cell) return;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  if (dragVal === "Q" || boardState[row][col] === "Q") return;

  if (boardState[row][col] !== dragVal) {
    boardState[row][col] = dragVal;
    renderBoard();
    checkGameWin();
  }
}

window.addEventListener("mouseup", () => {
  if (dragActive) {
    dragActive = false;
    checkGameWin();
  }
});
window.addEventListener("touchend", () => {
  if (dragActive) {
    dragActive = false;
    checkGameWin();
  }
});
document.addEventListener("touchmove", handleTouchMove, { passive: false });

document.addEventListener("contextmenu", e => {
  const target = e.target.closest(".board-cell");
  if (target) e.preventDefault();
});

function toggleCell(r, c, tool) {
  const current = boardState[r][c];

  if (tool === "Q") {
    if (current === "Q") {
      boardState[r][c] = "";
    } else {
      boardState[r][c] = "Q";
    }
  } else {
    if (current === "X") {
      boardState[r][c] = "";
    } else {
      boardState[r][c] = "X";
    }
  }

  renderBoard();
  checkGameWin();
}

// --- 게임 클리어 확인 ---
function checkGameWin() {
  const { isValid } = validateBoard();
  if (isValid && !gameCleared) {
    gameCleared = true;
    clearInterval(timerInterval);
    triggerHaptic("success");

    const isNewRecord = saveRecord(currentStage.id, secondsElapsed);
    showWinModal(isNewRecord);
  }
}

// --- 힌트 제공 ---
function provideHint() {
  if (gameCleared || !currentStage) return;

  const size = currentStage.size;
  const solution = currentStage.solution;

  const missingQueens = [];
  solution.forEach(([sr, sc]) => {
    if (boardState[sr][sc] !== "Q") {
      missingQueens.push([sr, sc]);
    }
  });

  const incorrectQueens = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (boardState[r][c] === "Q") {
        const isCorrect = solution.some(([sr, sc]) => sr === r && sc === c);
        if (!isCorrect) {
          incorrectQueens.push([r, c]);
        }
      }
    }
  }

  pushHistory();

  if (incorrectQueens.length > 0) {
    const [ir, ic] = incorrectQueens[Math.floor(Math.random() * incorrectQueens.length)];
    boardState[ir][ic] = "X";
    showToast("잘못 배치된 퀸이 있어 정정했습니다.");
  } else if (missingQueens.length > 0) {
    const [mr, mc] = missingQueens[Math.floor(Math.random() * missingQueens.length)];
    boardState[mr][mc] = "Q";

    const regId = currentStage.regions[mr][mc];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (r === mr && c === mc) continue;
        if (r === mr || c === mc) {
          if (boardState[r][c] === "") boardState[r][c] = "X";
        }
        if (currentStage.regions[r][c] === regId) {
          if (boardState[r][c] === "") boardState[r][c] = "X";
        }
        if (Math.abs(r - mr) <= 1 && Math.abs(c - mc) <= 1) {
          if (boardState[r][c] === "") boardState[r][c] = "X";
        }
      }
    }

    hintCount++;
    showToast("정답 위치에 퀸을 하나 배치했습니다!");
  }

  renderBoard();
  checkGameWin();
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

// --- 게임 시작 및 화면 제어 ---
function initGame(stage) {
  currentStage = stage;
  currentDifficulty = stage.size;
  const size = stage.size;
  
  boardState = Array.from({ length: size }, () => Array(size).fill(""));
  history = [];
  secondsElapsed = 0;
  gameCleared = false;
  hintCount = 0;
  isPaused = false;

  updateUndoButtonState();
  updateTimerDisplay();
  
  document.getElementById("stage-title").textContent = stage.name;
  document.getElementById("stage-size-badge").textContent = `${size}x${size}`;
  
  document.getElementById("screen-lobby").classList.add("hidden");
  document.getElementById("screen-stage-select").classList.add("hidden");
  document.getElementById("screen-game").classList.remove("hidden");

  document.getElementById("btn-hint").disabled = false;

  // 보드판의 DOM 틀을 1회 최초 생성 (이후 값 변경 시 파괴하지 않고 상태 업데이트만 유도)
  createBoardDOM();
  renderBoard();
  startTimer();
}

function restartStage() {
  if (!currentStage) return;
  initGame(currentStage);
}

function goBackToLobby() {
  clearInterval(timerInterval);
  document.getElementById("screen-game").classList.add("hidden");
  document.getElementById("screen-stage-select").classList.add("hidden");
  document.getElementById("screen-lobby").classList.remove("hidden");
  renderLobby();
}

function goBackToStages() {
  clearInterval(timerInterval);
  document.getElementById("screen-game").classList.add("hidden");
  document.getElementById("screen-lobby").classList.add("hidden");
  document.getElementById("screen-stage-select").classList.remove("hidden");
  renderStageSelect(currentDifficulty);
}

// --- 우승 모달 ---
function showWinModal(isNewRecord) {
  const modal = document.getElementById("win-modal");
  const finalTimeStr = document.getElementById("timer-display").textContent;
  
  document.getElementById("modal-time").textContent = finalTimeStr;
  
  const recordBadge = document.getElementById("new-record-badge");
  if (isNewRecord) {
    recordBadge.classList.remove("hidden");
    triggerHaptic("success");
  } else {
    recordBadge.classList.add("hidden");
  }

  const hintNotice = document.getElementById("modal-hint-notice");
  if (hintCount > 0) {
    hintNotice.textContent = `(힌트를 ${hintCount}회 사용했습니다)`;
    hintNotice.style.color = "rgba(255,255,255,0.4)";
  } else {
    hintNotice.textContent = "🏆 힌트 없이 깨끗하게 클리어!";
    hintNotice.style.color = "#FCC419";
  }

  modal.classList.remove("hidden");
  createConfetti();
}

function closeWinModal() {
  document.getElementById("win-modal").classList.add("hidden");
  goBackToStages();
}

function createConfetti() {
  const container = document.getElementById("confetti-container");
  container.innerHTML = "";
  const colors = ["#FF6B6B", "#4DABF7", "#51CF66", "#FCC419", "#FF922B", "#845EF7"];

  for (let i = 0; i < 60; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `-10px`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 1.5;
    p.style.animation = `fall ${duration}s linear ${delay}s infinite`;
    p.style.setProperty('--drift', `${-50 + Math.random() * 100}px`);

    container.appendChild(p);
  }
}

// --- 메인 로비 렌더링 (난이도 선택) ---
function renderLobby() {
  const records = loadRecords();

  const sizes = [5, 7, 9];
  sizes.forEach(size => {
    const stages = PRESET_STAGES[size] || [];
    const stageIds = stages.map(s => s.id);
    
    const diffTimes = Object.keys(records)
      .filter(id => id.startsWith(`rand-${size}-`) || stageIds.includes(id))
      .map(id => records[id]);

    let bestStr = "--:--";
    if (diffTimes.length > 0) {
      const minTime = Math.min(...diffTimes);
      const mins = Math.floor(minTime / 60);
      const secs = minTime % 60;
      bestStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const statBestEl = document.getElementById(`stat-best-${size}`);
    const lobbyBestEl = document.getElementById(`lobby-best-${size}`);
    
    if (statBestEl) statBestEl.textContent = bestStr;
    if (lobbyBestEl) lobbyBestEl.textContent = bestStr;
  });

  const clearedCount = Object.keys(records).length;
  document.getElementById("stat-clears").textContent = `${clearedCount}회`;
}

// --- 스테이지 선택 화면 렌더링 ---
function renderStageSelect(difficulty) {
  currentDifficulty = difficulty;
  const records = loadRecords();
  const stages = PRESET_STAGES[difficulty] || [];
  const container = document.getElementById("stages-list-container");
  container.innerHTML = "";

  let titleStr = "";
  if (difficulty === 5) titleStr = "초급 보드 (5x5)";
  else if (difficulty === 7) titleStr = "중급 보드 (7x7)";
  else if (difficulty === 9) titleStr = "고급 보드 (9x9)";
  document.getElementById("selected-difficulty-title").textContent = titleStr;

  const stageIds = stages.map(s => s.id);
  const diffTimes = Object.keys(records)
    .filter(id => id.startsWith(`rand-${difficulty}-`) || stageIds.includes(id))
    .map(id => records[id]);

  let bestStr = "최고기록: --:--";
  if (diffTimes.length > 0) {
    const minTime = Math.min(...diffTimes);
    const mins = Math.floor(minTime / 60);
    const secs = minTime % 60;
    bestStr = `최고기록: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  document.getElementById("selected-difficulty-best").textContent = bestStr;

  stages.forEach((stage, idx) => {
    const card = document.createElement("div");
    card.className = "stage-card";
    
    const recordTime = records[stage.id];
    let recordStr = "기록 없음";
    let isCleared = false;
    
    if (recordTime !== undefined) {
      isCleared = true;
      const mins = Math.floor(recordTime / 60);
      const secs = recordTime % 60;
      recordStr = `⏱️ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    card.innerHTML = `
      <div class="stage-card-header">
        <span class="stage-name">${stage.name}</span>
        ${isCleared ? '<span class="clear-badge">★ 클리어</span>' : '<span class="play-badge">도전</span>'}
      </div>
      <div class="stage-card-body">
        <span class="stage-num">Level ${idx + 1}</span>
        <span class="stage-record">${recordStr}</span>
      </div>
    `;

    card.addEventListener("click", () => {
      initGame(stage);
    });

    container.appendChild(card);
  });

  const randCard = document.createElement("div");
  randCard.className = "stage-card random-card";
  randCard.innerHTML = `
    <div class="stage-card-header">
      <span class="stage-name">무한 랜덤 맵</span>
      <span class="play-badge random">생성</span>
    </div>
    <div class="stage-card-body">
      <span class="stage-num">실시간 생성</span>
      <span class="stage-record">새로운 도전!</span>
    </div>
  `;
  randCard.addEventListener("click", () => {
    const newStage = generateRandomStage(difficulty, `rand-${difficulty}-${Date.now()}`);
    newStage.name = `${difficulty}x${difficulty} 랜덤 미션`;
    initGame(newStage);
  });
  container.appendChild(randCard);

  document.getElementById("screen-lobby").classList.add("hidden");
  document.getElementById("screen-game").classList.add("hidden");
  document.getElementById("screen-stage-select").classList.remove("hidden");
}

// --- 이벤트 바인딩 및 초기화 ---
document.addEventListener("DOMContentLoaded", () => {
  checkAppVersion();

  renderLobby();

  document.querySelectorAll(".diff-select-card").forEach(card => {
    card.addEventListener("click", () => {
      const diff = parseInt(card.dataset.difficulty);
      renderStageSelect(diff);
      triggerHaptic();
    });
  });

  document.getElementById("btn-backup").addEventListener("click", backupData);
  document.getElementById("btn-restore").addEventListener("click", triggerRestore);
  document.getElementById("file-restore").addEventListener("change", handleRestoreFile);

  document.getElementById("btn-back-to-lobby").addEventListener("click", goBackToLobby);
  document.getElementById("btn-back-to-stages").addEventListener("click", goBackToStages);

  document.getElementById("btn-restart").addEventListener("click", restartStage);
  document.getElementById("btn-undo").addEventListener("click", undo);
  document.getElementById("btn-hint").addEventListener("click", provideHint);

  const toolQ = document.getElementById("tool-q");
  const toolX = document.getElementById("tool-x");

  toolQ.addEventListener("click", () => {
    currentTool = "Q";
    toolQ.classList.add("active");
    toolX.classList.remove("active");
    triggerHaptic();
  });

  toolX.addEventListener("click", () => {
    currentTool = "X";
    toolX.classList.add("active");
    toolQ.classList.remove("active");
    triggerHaptic();
  });

  document.getElementById("btn-modal-close").addEventListener("click", closeWinModal);

  document.addEventListener("visibilitychange", () => {
    isPaused = document.hidden;
  });
});
