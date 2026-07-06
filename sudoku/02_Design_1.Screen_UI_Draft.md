# 화면별 구성 요소 및 레이아웃 (Screen UI Draft)

## 1. 메인 홈 화면 (Home Screen)
* **Layout:** 화면 중앙 정렬의 싱글 컬럼 구조. Minimalist Zen 테마 반영.
* **요소 리스트:**
  * `h1.title`: "SUDOKU ZEN" (세련된 고딕 계열 또는 Serif 폰트)
  * `div.best-records`: 난이도별 로컬 최고 기록 표시 영역
  * `button.btn-difficulty`: 초급, 중급, 고급 선택 세로 정렬 버튼
  * `button.btn-continue`: 이어서 하기 (조건부 활성화)
  * `button.btn-modal-trigger`: "게임 방법" 모달 열기 버튼

## 2. 게임 플레이 화면 (Game Screen)
* **상단 헤더:** Home 이동 버튼, 난이도 텍스트, `00:00` 형태의 타이머, 일시정지(Pause) 버튼.
* **중앙 스도쿠 보드:** * `div#sudoku-board`: CSS Grid (`grid-template-columns: repeat(9, 1fr)`) 구조.
  * 종횡비 1:1 유지를 위해 `aspect-ratio: 1 / 1` 설정.
  * 3x3 구역 경계면은 `border-right-width: 3px`, `border-bottom-width: 3px`로 두껍게 처리.
* **하단 컨트롤 바:** 실행 취소, 지우기, 메모(On/Off 토글 상태 표시), 힌트 버튼이 가로로 배치됨.
* **숫자 키패드:** 1부터 9까지의 큰 버튼 그리드 배치. 모바일 터치 미스를 방지하기 위해 각 버튼의 최소 높이는 48px 이상 확보.

## 3. 결과 팝업 모달 (Game Clear Modal)
* **CSS Overlay:** `position: fixed; top:0; left:0; width:100vw; height:100vh; background: rgba(0,0,0,0.5);`
* **콘텐츠 박스:** 중앙 정렬된 백그라운드 카드. "축하합니다!" 메시지, 최종 소요 시간, 최고 기록 달성 여부 뱃지, "다시 하기" 및 "메인으로" 버튼 포함.