# 상태 관리 및 영속성 설계 (State & Storage)

## 1. 단방향 데이터 흐름 원칙
바닐라 JS에서 스파게티 코드를 방지하기 위해, 모든 UI 변경은 `gameState` 객체의 변경을 거쳐 `board.js`의 `render()` 함수를 트리거하는 구조를 갖춘다.

## 2. 히스토리 스택을 활용한 Undo 시스템
* 사용자가 숫자를 정상적으로 입력하거나 지울 때마다, 이전 `currentBoard` 배열의 상태를 Deep Copy 하여 `history` 배열에 `push`한다.
```javascript
// 상태 기록 예시
function saveActionToHistory() {
  gameState.history.push(gameState.currentBoard.map(row => [...row]));
}
```
* Undo 버튼 클릭 시 `gameState.history.pop()`을 통해 직전 보드 상태를 꺼내어 `gameState.currentBoard`에 덮어씌운 뒤 재렌더링한다.

## 3. Storage를 이용한 자동 저장 자동화
* 게임 플레이 중 숫자가 입력되는 모든 이벤트 핸들러 마지막 단계에 `storage.saveCurrentGame(gameState)`를 호출한다.
* 앱 로드 시 `localStorage.getItem('SUDOKU_SAVE_GAME')`을 확인하여 데이터가 존재하면 복구 프로세스를 가동한다.