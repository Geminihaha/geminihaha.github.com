import { PRESET_STAGES, generateRandomStage } from './stages.js';

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

// --- 코어 규칙 검증 (Validator) ---
function validateBoard() {
  if (!currentStage) return { isValid: false, conflicts: {}, queenCount: 0 };
  const size = currentStage.size;
  const regions = currentStage.regions;

  // 퀸들의 위치 목록 [{r, c, region}]
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

  // 충돌 기록 객체 (key: "r-c", value: { row, col, region, adj })
  const conflicts = {};
  const markConflict = (r, c, type) => {
    const key = `${r}-${c}`;
    if (!conflicts[key]) {
      conflicts[key] = { row: false, col: false, region: false, adj: false };
    }
    conflicts[key][type] = true;
  };

  // 1. 행/열/구역별 퀸 카운팅
  const rowQueens = Array.from({ length: size }, () => []);
  const colQueens = Array.from({ length: size }, () => []);
  const regionQueens = {};

  queens.forEach(q => {
    rowQueens[q.r].push(q);
    colQueens[q.c].push(q);
    if (!regionQueens[q.region]) regionQueens[q.region] = [];
    regionQueens[q.region].push(q);
  });

  // 행 충돌 검사
  for (let r = 0; r < size; r++) {
    if (rowQueens[r].length > 1) {
      rowQueens[r].forEach(q => markConflict(q.r, q.c, 'row'));
    }
  }

  // 열 충돌 검사
  for (let c = 0; c < size; c++) {
    if (colQueens[c].length > 1) {
      colQueens[c].forEach(q => markConflict(q.r, q.c, 'col'));
    }
  }

  // 영역 충돌 검사
  Object.keys(regionQueens).forEach(regId => {
    if (regionQueens[regId].length > 1) {
      regionQueens[regId].forEach(q => markConflict(q.r, q.c, 'region'));
    }
  });

  // 2. 8방향 인접 검사
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

  // 3. 성공 여부 확인
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
  checkGameWin(); // 언두 할 때도 즉시 상태 체크
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

// --- 보드 렌더링 ---
function renderBoard() {
  const boardEl = document.getElementById("game-board");
  boardEl.innerHTML = "";

  const size = currentStage.size;
  const colors = currentStage.colors;
  const regions = currentStage.regions;

  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  const { conflicts } = validateBoard();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      const regionId = regions[r][c];
      const regionColor = colors[regionId];
      cell.style.backgroundColor = regionColor;

      if (r === 0 || regions[r - 1][c] !== regionId) {
        cell.classList.add("border-top-thick");
      }
      if (r === size - 1 || regions[r + 1][c] !== regionId) {
        cell.classList.add("border-bottom-thick");
      }
      if (c === 0 || regions[r][c - 1] !== regionId) {
        cell.classList.add("border-left-thick");
      }
      if (c === size - 1 || regions[r][c + 1] !== regionId) {
        cell.classList.add("border-right-thick");
      }

      const val = boardState[r][c];
      if (val === "Q") {
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
      } else if (val === "X") {
        cell.innerHTML = '<span class="x-mark">×</span>';
        cell.classList.add("has-x");
      }

      if (conflicts[`${r}-${c}`]) {
        cell.classList.add("conflict-blink");
      }

      cell.addEventListener("mousedown", handleCellStart);
      cell.addEventListener("mouseenter", handleCellEnter);
      cell.addEventListener("touchstart", handleTouchStart, { passive: false });

      boardEl.appendChild(cell);
    }
  }

  updateInfoDisplay();
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
  dragVal = boardState[row][col]; 
  triggerHaptic();
}

function handleCellEnter(e) {
  if (!dragActive || gameCleared) return;
  const row = parseInt(this.dataset.row);
  const col = parseInt(this.dataset.col);

  if (dragVal === "Q" || boardState[row][col] === "Q") return;

  if (boardState[row][col] !== dragVal) {
    boardState[row][col] = dragVal;
    renderBoard();
    checkGameWin(); // 드래그 상태가 변할 때도 퀸 충돌 검출 및 승리 즉시 검사
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
  dragVal = boardState[row][col];
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
    checkGameWin(); // 드래그 시 즉시 검사
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
  checkGameWin(); // 퀸이나 X 마크가 배치되거나 해제되는 순간 즉시 판단!
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
  
  // 모든 스크린 숨기고 게임판 보이기
  document.getElementById("screen-lobby").classList.add("hidden");
  document.getElementById("screen-stage-select").classList.add("hidden");
  document.getElementById("screen-game").classList.remove("hidden");

  document.getElementById("btn-hint").disabled = false;

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
  goBackToStages(); // 로비 대신 해당 난이도 스테이지 선택 화면으로 복귀
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

  // 각 난이도별 최단 클리어 기록 수집 및 표시
  const sizes = [5, 7, 9];
  sizes.forEach(size => {
    const stages = PRESET_STAGES[size] || [];
    const stageIds = stages.map(s => s.id);
    
    // 해당 크기의 프리셋 + 랜덤맵 레코드 중 최단 기록 필터링
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

    // 로비 최고기록 엘리먼트들 채우기
    const statBestEl = document.getElementById(`stat-best-${size}`);
    const lobbyBestEl = document.getElementById(`lobby-best-${size}`);
    
    if (statBestEl) statBestEl.textContent = bestStr;
    if (lobbyBestEl) lobbyBestEl.textContent = bestStr;
  });

  // 총 클리어 개수 계산
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

  // 난이도 타이틀 설정
  let titleStr = "";
  if (difficulty === 5) titleStr = "초급 보드 (5x5)";
  else if (difficulty === 7) titleStr = "중급 보드 (7x7)";
  else if (difficulty === 9) titleStr = "고급 보드 (9x9)";
  document.getElementById("selected-difficulty-title").textContent = titleStr;

  // 이 난이도의 최고 기록 표시
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

  // 스테이지 카드 동적 빌드
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

  // 무한 랜덤 맵 카드
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

  // 스크린 전환
  document.getElementById("screen-lobby").classList.add("hidden");
  document.getElementById("screen-game").classList.add("hidden");
  document.getElementById("screen-stage-select").classList.remove("hidden");
}

// --- 이벤트 바인딩 및 초기화 ---
document.addEventListener("DOMContentLoaded", () => {
  renderLobby();

  // 난이도 카드 선택 바인딩 (로비)
  document.querySelectorAll(".diff-select-card").forEach(card => {
    card.addEventListener("click", () => {
      const diff = parseInt(card.dataset.difficulty);
      renderStageSelect(diff);
      triggerHaptic();
    });
  });

  // 뒤로가기 버튼들 바인딩
  document.getElementById("btn-back-to-lobby").addEventListener("click", goBackToLobby);
  document.getElementById("btn-back-to-stages").addEventListener("click", goBackToStages);

  // 인게임 액션 버튼 바인딩
  document.getElementById("btn-restart").addEventListener("click", restartStage);
  document.getElementById("btn-undo").addEventListener("click", undo);
  document.getElementById("btn-hint").addEventListener("click", provideHint);

  // 툴 전환 버튼 바인딩
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

  // 모달 버튼 바인딩
  document.getElementById("btn-modal-close").addEventListener("click", closeWinModal);

  // 백그라운드 전환 시 타이머 일시정지
  document.addEventListener("visibilitychange", () => {
    isPaused = document.hidden;
  });
});
