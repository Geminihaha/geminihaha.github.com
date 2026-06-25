import { PRESET_STAGES, generateRandomStage } from './stages.js';

// --- 게임 상태 (State) ---
let currentStage = null;
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
  // 퀸의 개수가 보드 크기 N과 같고, 충돌이 없어야 함
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
  if (history.length > 50) history.shift(); // 최대 50단계 저장
  updateUndoButtonState();
}

function undo() {
  if (history.length === 0 || gameCleared) return;
  const prevState = JSON.parse(history.pop());
  boardState = prevState;
  triggerHaptic();
  renderBoard();
  updateUndoButtonState();
}

function updateUndoButtonState() {
  const btn = document.getElementById("btn-undo");
  if (btn) btn.disabled = history.length === 0;
}

// --- 진동 피드백 (모바일 지원용) ---
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

  // CSS Grid를 이용해 크기에 맞춰 격자 비율 동적 조절
  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  const { conflicts } = validateBoard();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      // 영역별 배경색 입히기 (파스텔 톤)
      const regionId = regions[r][c];
      const regionColor = colors[regionId];
      cell.style.backgroundColor = regionColor;

      // 경계선 그리기 (굵은 보더로 영역 경계구분)
      // 위쪽 칸과 영역이 다른가?
      if (r === 0 || regions[r - 1][c] !== regionId) {
        cell.classList.add("border-top-thick");
      }
      // 아래쪽 칸과 영역이 다른가?
      if (r === size - 1 || regions[r + 1][c] !== regionId) {
        cell.classList.add("border-bottom-thick");
      }
      // 왼쪽 칸과 영역이 다른가?
      if (c === 0 || regions[r][c - 1] !== regionId) {
        cell.classList.add("border-left-thick");
      }
      // 오른쪽 칸과 영역이 다른가?
      if (c === size - 1 || regions[r][c + 1] !== regionId) {
        cell.classList.add("border-right-thick");
      }

      // 셀 내용물 (퀸 또는 X 표시)
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

      // 충돌 발생 시 붉은색 깜빡임 처리
      if (conflicts[`${r}-${c}`]) {
        cell.classList.add("conflict-blink");
      }

      // 마우스 및 터치 이벤트 바인딩
      cell.addEventListener("mousedown", handleCellStart);
      cell.addEventListener("mouseenter", handleCellEnter);
      
      // 모바일 터치 드래그 지원을 위한 리스너
      cell.addEventListener("touchstart", handleTouchStart, { passive: false });

      boardEl.appendChild(cell);
    }
  }

  // 퀸 배치 개수 UI 업데이트
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

  // 마우스 오른쪽 버튼 클릭 시 반대 모드 강제 적용
  let activeTool = currentTool;
  if (e.button === 2) {
    activeTool = currentTool === "Q" ? "X" : "Q";
  }

  pushHistory();
  toggleCell(row, col, activeTool);

  // 드래그 페인팅 개시
  dragActive = true;
  // 첫 타겟의 최종 상태를 기반으로 드래그 시 칠할 값을 결정
  dragVal = boardState[row][col]; 
  triggerHaptic();
}

function handleCellEnter(e) {
  if (!dragActive || gameCleared) return;
  const row = parseInt(this.dataset.row);
  const col = parseInt(this.dataset.col);

  // 퀸은 드래그 드로잉에서 배제 (X 마크와 지우기만 드래그 가능하게 하여 오동작 방지)
  if (dragVal === "Q" || boardState[row][col] === "Q") return;

  if (boardState[row][col] !== dragVal) {
    boardState[row][col] = dragVal;
    renderBoard();
  }
}

// 모바일 터치 이벤트 핸들러 (드래그 매핑용)
function handleTouchStart(e) {
  if (gameCleared) return;
  e.preventDefault(); // 스크롤 방지
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
  }
}

// 전역 마우스/터치 업 이벤트 리스너 등록
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
// 모바일 터치 무브 등록
document.addEventListener("touchmove", handleTouchMove, { passive: false });

// 우클릭 메뉴 방지
document.addEventListener("contextmenu", e => {
  const target = e.target.closest(".board-cell");
  if (target) e.preventDefault();
});

/**
 * 특정 칸의 상태 토글
 * @param {number} r 행
 * @param {number} c 열
 * @param {string} tool "Q" 또는 "X"
 */
function toggleCell(r, c, tool) {
  const current = boardState[r][c];

  if (tool === "Q") {
    // 퀸 모드: 빈 칸 -> 퀸 -> 빈 칸 (X 무시 또는 덮어쓰기)
    if (current === "Q") {
      boardState[r][c] = "";
    } else {
      boardState[r][c] = "Q";
    }
  } else {
    // X 모드: 빈 칸 -> X -> 빈 칸 (퀸 무시 또는 덮어쓰기)
    if (current === "X") {
      boardState[r][c] = "";
    } else {
      boardState[r][c] = "X";
    }
  }

  renderBoard();
}

// --- 게임 클리어 확인 ---
function checkGameWin() {
  const { isValid } = validateBoard();
  if (isValid && !gameCleared) {
    gameCleared = true;
    clearInterval(timerInterval);
    triggerHaptic("success");

    // 최고 기록 저장 및 신기록 판별
    const isNewRecord = saveRecord(currentStage.id, secondsElapsed);
    showWinModal(isNewRecord);
  }
}

// --- 힌트 제공 시스템 ---
function provideHint() {
  if (gameCleared || !currentStage) return;

  const size = currentStage.size;
  const solution = currentStage.solution; // [[r, c], ...]

  // 아직 정답 위치에 퀸이 놓이지 않은 칸들 찾기
  const missingQueens = [];
  solution.forEach(([sr, sc]) => {
    if (boardState[sr][sc] !== "Q") {
      missingQueens.push([sr, sc]);
    }
  });

  // 이미 퀸이 엉뚱한 곳에 놓여있다면 해당 잘못된 퀸들을 제거하거나 알려줌
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
    // 1순위 힌트: 잘못 배치된 퀸을 경고하고 하나 제거
    const [ir, ic] = incorrectQueens[Math.floor(Math.random() * incorrectQueens.length)];
    boardState[ir][ic] = "X"; // 잘못 놓인 퀸은 X로 마킹해 유저가 인지하게 도움
    showToast("잘못 배치된 퀸이 있어 정정했습니다.");
  } else if (missingQueens.length > 0) {
    // 2순위 힌트: 누락된 정답 퀸 중 하나를 보드에 자동으로 배치
    const [mr, mc] = missingQueens[Math.floor(Math.random() * missingQueens.length)];
    
    // 배치할 자리를 방해하는 주변 X들을 제거하고 퀸 배치
    boardState[mr][mc] = "Q";

    // 퀸이 배치된 행, 열, 대각선 인접 및 같은 색상 구역에는 퀸이 들어갈 수 없으므로,
    // 정답 퀸을 돕기 위해 해당 행/열/영역에 자동으로 X 마킹을 적절히 서비스해 줌
    const regId = currentStage.regions[mr][mc];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (r === mr && c === mc) continue;
        // 같은 행, 열
        if (r === mr || c === mc) {
          if (boardState[r][c] === "") boardState[r][c] = "X";
        }
        // 같은 구역
        if (currentStage.regions[r][c] === regId) {
          if (boardState[r][c] === "") boardState[r][c] = "X";
        }
        // 8방향 인접
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
  const size = stage.size;
  
  // 보드 초기화
  boardState = Array.from({ length: size }, () => Array(size).fill(""));
  history = [];
  secondsElapsed = 0;
  gameCleared = false;
  hintCount = 0;
  isPaused = false;

  updateUndoButtonState();
  updateTimerDisplay();
  
  // UI 텍스트 설정
  document.getElementById("stage-title").textContent = stage.name;
  document.getElementById("stage-size-badge").textContent = `${size}x${size}`;
  
  // 로비 숨기고 게임판 보이기
  document.getElementById("screen-lobby").classList.add("hidden");
  document.getElementById("screen-game").classList.remove("hidden");

  // 힌트 버튼 리셋
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
  document.getElementById("screen-lobby").classList.remove("hidden");
  renderLobby();
}

// --- 우승 모달 렌더링 ---
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

  // 힌트 사용 여부 멘트
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
  goBackToLobby();
}

// 간단한 폭죽/스파크 생성
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
    
    // 무작위 흔들림 너비
    p.style.setProperty('--drift', `${-50 + Math.random() * 100}px`);

    container.appendChild(p);
  }
}

// --- 로비 렌더링 ---
function renderLobby() {
  const records = loadRecords();

  // 각 난이도 컨테이너들
  const sizes = [5, 7, 9];
  sizes.forEach(size => {
    const listEl = document.getElementById(`stages-${size}`);
    listEl.innerHTML = "";

    const stages = PRESET_STAGES[size] || [];
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

      listEl.appendChild(card);
    });

    // 랜덤 생성 카드 추가
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
      const newStage = generateRandomStage(size, `rand-${size}-${Date.now()}`);
      newStage.name = `${size}x${size} 랜덤 미션`;
      initGame(newStage);
    });
    listEl.appendChild(randCard);
  });

  // 전체 통계 렌더링
  renderStats(records);
}

function renderStats(records) {
  const totalStages = 5 + 7 + 9; // 대략적인 개수
  const clearedCount = Object.keys(records).filter(key => !key.startsWith("rand-")).length;
  
  document.getElementById("stat-clears").textContent = `${clearedCount}개 스테이지`;

  // 최단 시간 기록
  const times = Object.keys(records).map(key => records[key]);
  if (times.length > 0) {
    const minTime = Math.min(...times);
    const mins = Math.floor(minTime / 60);
    const secs = minTime % 60;
    document.getElementById("stat-best-time").textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    document.getElementById("stat-best-time").textContent = "--:--";
  }
}

// --- 이벤트 바인딩 및 초기화 ---
document.addEventListener("DOMContentLoaded", () => {
  renderLobby();

  // 상단 바 버튼 바인딩
  document.getElementById("btn-lobby").addEventListener("click", goBackToLobby);
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

  // 일시정지 처리 (페이지 백그라운드 전환 시 타이머 정지)
  document.addEventListener("visibilitychange", () => {
    isPaused = document.hidden;
  });
});
