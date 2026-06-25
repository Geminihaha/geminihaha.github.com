/**
 * Queens Logic Puzzle - Stage Database & Generator
 */

// 사전 정의된 스테이지 프리셋 (5x5, 7x7, 9x9)
// 유효한 퀸 배치와 영역을 미리 수작업 또는 검증을 거쳐 정의한 맵
export const PRESET_STAGES = {
  5: [
    {
      id: "5-1",
      name: "새로운 시작",
      size: 5,
      // 퀸 솔루션 위치 (검증 및 힌트용): (0,1), (1,3), (2,0), (3,2), (4,4)
      solution: [[0,1], [1,3], [2,0], [3,2], [4,4]],
      regions: [
        [0, 0, 1, 1, 1],
        [0, 2, 2, 1, 3],
        [0, 2, 4, 4, 3],
        [2, 2, 4, 3, 3],
        [2, 4, 4, 4, 3]
      ],
      colors: ["#FF6B6B", "#4DABF7", "#51CF66", "#FCC419", "#FF922B"]
    },
    {
      id: "5-2",
      name: "지그재그",
      size: 5,
      // 퀸 솔루션 위치: (0,2), (1,0), (2,3), (3,1), (4,4)
      solution: [[0,2], [1,0], [2,3], [3,1], [4,4]],
      regions: [
        [0, 0, 0, 1, 1],
        [2, 2, 0, 1, 1],
        [2, 3, 3, 3, 1],
        [2, 4, 4, 3, 1],
        [4, 4, 4, 4, 1]
      ],
      colors: ["#845EF7", "#339AF0", "#20C997", "#FF922B", "#FF8787"]
    },
    {
      id: "5-3",
      name: "십자포화",
      size: 5,
      solution: [[0,3], [1,1], [2,4], [3,0], [4,2]],
      regions: [
        [0, 0, 0, 0, 1],
        [2, 2, 0, 1, 1],
        [2, 3, 3, 1, 4],
        [2, 3, 4, 4, 4],
        [2, 3, 3, 4, 4]
      ],
      colors: ["#22B8CF", "#20C997", "#94D82D", "#FCC419", "#FF8787"]
    }
  ],
  7: [
    {
      id: "7-1",
      name: "정원의 오솔길",
      size: 7,
      // Solution: (0,2), (1,5), (2,1), (3,6), (4,0), (5,3), (6,4)
      solution: [[0,2], [1,5], [2,1], [3,6], [4,0], [5,3], [6,4]],
      regions: [
        [0, 0, 0, 1, 1, 1, 1],
        [2, 0, 3, 3, 1, 1, 4],
        [2, 2, 3, 5, 5, 1, 4],
        [2, 6, 3, 5, 4, 4, 4],
        [2, 6, 6, 5, 5, 4, 4],
        [2, 6, 5, 5, 5, 4, 4],
        [6, 6, 6, 5, 4, 4, 4]
      ],
      colors: ["#FF6B6B", "#4DABF7", "#51CF66", "#FCC419", "#FF922B", "#845EF7", "#22B8CF"]
    },
    {
      id: "7-2",
      name: "무지개 분수",
      size: 7,
      // Solution: (0,4), (1,1), (2,6), (3,3), (4,0), (5,5), (6,2)
      solution: [[0,4], [1,1], [2,6], [3,3], [4,0], [5,5], [6,2]],
      regions: [
        [0, 0, 1, 1, 1, 2, 2],
        [0, 3, 3, 1, 2, 2, 2],
        [0, 3, 4, 4, 4, 2, 5],
        [0, 3, 4, 6, 4, 5, 5],
        [0, 3, 4, 4, 4, 5, 5],
        [0, 3, 3, 3, 5, 5, 5],
        [0, 0, 0, 5, 5, 5, 5]
      ],
      colors: ["#F06595", "#AE3EC9", "#7048E8", "#4263EB", "#1098AD", "#0CA678", "#37B24D"]
    }
  ],
  9: [
    {
      id: "9-1",
      name: "미궁의 성",
      size: 9,
      // Solution: (0,4), (1,1), (2,8), (3,5), (4,2), (5,7), (6,0), (7,3), (8,6)
      solution: [[0,4], [1,1], [2,8], [3,5], [4,2], [5,7], [6,0], [7,3], [8,6]],
      regions: [
        [0, 0, 0, 0, 0, 1, 1, 1, 1],
        [2, 2, 0, 3, 0, 1, 4, 4, 1],
        [2, 5, 5, 3, 3, 1, 4, 6, 6],
        [2, 5, 7, 7, 3, 1, 4, 6, 8],
        [2, 5, 7, 3, 3, 1, 4, 8, 8],
        [2, 5, 7, 7, 7, 1, 8, 8, 8],
        [2, 5, 5, 5, 7, 8, 8, 8, 8],
        [2, 2, 2, 7, 7, 8, 8, 8, 8],
        [2, 2, 7, 7, 7, 8, 8, 8, 8]
      ],
      colors: [
        "#FF6B6B", "#4DABF7", "#51CF66", "#FCC419", "#FF922B", 
        "#845EF7", "#22B8CF", "#E64980", "#94D82D"
      ]
    }
  ]
};

// 무작위 플랫/파스텔 톤 색상 세트 생성용 HSL 리스트
const PASTEL_HUES = [
  0,   // Red
  25,  // Orange
  45,  // Yellow-Orange
  80,  // Lime Green
  120, // Green
  160, // Mint
  190, // Cyan
  210, // Blue
  230, // Indigo
  260, // Purple
  280, // Violet
  325  // Pink
];

// Fisher-Yates 셔플 알고리즘
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 8방향 인접 제한 및 행/열 중복 방지를 만족하는 N-Queen 위치 리스트를 무작위로 생성 (백트래킹)
 * @param {number} n 보드 크기
 * @returns {Array<[number, number]>|null} 유효한 퀸 좌표 리스트
 */
function generateValidQueenPositions(n) {
  const maxAttempts = 2000;
  let attempts = 0;

  function solve(row, selectedCols, queens) {
    if (row === n) return queens;
    if (attempts++ > maxAttempts) return null;

    // 열을 무작위 순서로 시도
    const cols = shuffle(Array.from({ length: n }, (_, i) => i));

    for (const col of cols) {
      if (selectedCols.has(col)) continue;

      // 8방향 인접 체크 (이전 퀸들과 비교)
      let isAdjacent = false;
      for (const [r, c] of queens) {
        if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) {
          isAdjacent = true;
          break;
        }
      }
      if (isAdjacent) continue;

      queens.push([row, col]);
      selectedCols.add(col);

      const result = solve(row + 1, selectedCols, queens);
      if (result) return result;

      queens.pop();
      selectedCols.delete(col);
    }

    return null;
  }

  return solve(0, new Set(), []);
}

/**
 * 무작위 퀸 배치를 기준으로 BFS 확장을 수행하여 N개의 연결된 영역(Region)을 생성
 * @param {number} n 보드 크기
 * @param {Array<[number, number]>} solution 퀸 위치 배열
 * @returns {Array<Array<number>>} NxN 영역 2차원 배열
 */
function generateRegions(n, solution) {
  const board = Array.from({ length: n }, () => Array(n).fill(-1));
  const queue = [];

  // 각 퀸 위치를 고유 영역 ID(0 ~ N-1)의 Seed로 설정
  solution.forEach(([r, c], index) => {
    board[r][c] = index;
    queue.push([r, c, index]);
  });

  // BFS를 위한 무작위 방향 섞기 헬퍼
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1] // 상하좌우
  ];

  // 큐가 빌 때까지 무작위 BFS 확장
  while (queue.length > 0) {
    // 큐에서 무작위로 하나 꺼내서 확장 (완전한 BFS가 아닌 무작위 팽창 효과를 주기 위함)
    const randIdx = Math.floor(Math.random() * queue.length);
    const [r, c, regionId] = queue[randIdx];
    queue.splice(randIdx, 1);

    const shuffledDirs = shuffle(directions);
    for (const [dr, dc] of shuffledDirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < n && nc >= 0 && nc < n && board[nr][nc] === -1) {
        board[nr][nc] = regionId;
        queue.push([nr, nc, regionId]);
      }
    }
  }

  // 혹시 빈 칸이 남았다면 (고립된 칸 등), 인접 영역 중 가장 많이 겹치는 영역으로 할당
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === -1) {
        const neighborIds = [];
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && board[nr][nc] !== -1) {
            neighborIds.push(board[nr][nc]);
          }
        }
        if (neighborIds.length > 0) {
          // 최빈값 영역 선택
          board[r][c] = neighborIds[Math.floor(Math.random() * neighborIds.length)];
        } else {
          // 백업: 그냥 0번 영역
          board[r][c] = 0;
        }
      }
    }
  }

  return board;
}

/**
 * 임의의 HSL 색상들을 생성하고 Hex 코드로 반환
 * @param {number} count 생성할 색상 개수
 * @returns {Array<string>} Hex 색상 배열
 */
function generatePastelColors(count) {
  const shuffledHues = shuffle(PASTEL_HUES);
  const colors = [];
  for (let i = 0; i < count; i++) {
    // 색상 순환
    const hue = shuffledHues[i % shuffledHues.length];
    // 파스텔 톤에 맞는 채도(70-85%)와 명도(75-85%) 설정
    colors.push(`hsl(${hue}, 80%, 75%)`);
  }
  return colors;
}

/**
 * 완전히 새로운 랜덤 스테이지를 실시간으로 생성
 * @param {number} size 보드 크기 (5, 7, 9 등)
 * @param {string} id 스테이지 고유 ID
 * @returns {Object} 스테이지 정보 객체
 */
export function generateRandomStage(size, id) {
  let solution = null;
  let attempts = 0;

  // 유효한 퀸 배치 생성 시도 (간혹 실패할 경우 재시도)
  while (!solution && attempts < 10) {
    solution = generateValidQueenPositions(size);
    attempts++;
  }

  // 실패 시 기본 솔루션으로 폴백
  if (!solution) {
    if (size === 5) solution = [[0,1], [1,3], [2,0], [3,2], [4,4]];
    else if (size === 7) solution = [[0,2], [1,5], [2,1], [3,6], [4,0], [5,3], [6,4]];
    else solution = [[0,4], [1,1], [2,8], [3,5], [4,2], [5,7], [6,0], [7,3], [8,6]];
  }

  const regions = generateRegions(size, solution);
  const colors = generatePastelColors(size);

  return {
    id: id || `rand-${size}-${Date.now()}`,
    name: `랜덤 미션 ${size}x${size}`,
    size,
    solution,
    regions,
    colors,
    isRandom: true
  };
}
