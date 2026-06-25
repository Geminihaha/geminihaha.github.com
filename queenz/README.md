# 👑 Queens Puzzle 웹앱 개발 완료 보고서 (README)

본 프로젝트는 `AGENT.md`에 기술된 안드로이드 Kotlin(MVVM/Room DB) 명세를 바탕으로, 사용성과 이식성이 뛰어난 **Vanilla HTML + CSS + JavaScript (Single Page Application)** 형태의 고품격 웹앱으로 재설계 및 개발을 완료하였습니다.

안드로이드 단말기(Termux) 환경에서 외부 바이너리 및 심볼릭 링크 생성 제한(EACCES)을 완벽히 우회하기 위해, 외부 의존성(esbuild, vite 등) 없이 순수 Node.js만으로 동작하는 **경량 정적 파일 웹 서버(`server.js`)**를 구축하여 개발 편의성을 보장했습니다.

---

## 📂 프로젝트 파일 구조

* 📄 **[index.html](file:///data/data/com.termux/files/home/workspace/geminihaha.github.com/queenz/index.html)**: 마크업 골격, 모바일 최적화 뷰포트 설정, SEO 최적화 및 팝업 모달 마크업
* 🎨 **[styles.css](file:///data/data/com.termux/files/home/workspace/geminihaha.github.com/queenz/styles.css)**: 딥 블루 다크모드, 글래스모피즘 계열 로비 카드, 영역 구분 굵은 보더 시스템, 충돌 시 네온 레드 점멸 깜빡임 애니메이션 및 클리어 폭죽 이펙트
* 🧠 **[app.js](file:///data/data/com.termux/files/home/workspace/geminihaha.github.com/queenz/app.js)**: N-Queen 및 구역 충돌 실시간 검출 논리, 50단계 실행 취소(Undo), 모바일 터치 및 드래그 스와이프를 이용한 X 마크 페인팅 제스처, 영리한 정답 가이드 힌트(Hint) 시스템, LocalStorage 연동 및 화면 전환 제어
* 🗄️ **[stages.js](file:///data/data/com.termux/files/home/workspace/geminihaha.github.com/queenz/stages.js)**: 난이도별 프리셋(5x5, 7x7, 9x9) 맵 데이터 및 **백트래킹 N-Queen + BFS 구역 팽창** 기반 실시간 무작위 맵 생성 알고리즘
* 🌐 **[server.js](file:///data/data/com.termux/files/home/workspace/geminihaha.github.com/queenz/server.js)**: 안드로이드 Termux 환경 맞춤형 zero-dependency 정적 파일 웹 서버

---

## 🧠 핵심 로직 및 알고리즘 구현 완료

### 1. 실시간 3대 규칙 검증기 (Validator)
보드에 배치된 모든 퀸(Queen)들의 위치를 실시간으로 탐색하여 충돌을 검출합니다.
* **행/열 중복 방지**: 하나의 행(Row)과 열(Column)에 단 1개의 퀸만 위치해야 함.
* **색상 구역(Region) 제한**: 불규칙하게 분포된 각 색상 영역 내에 단 1개의 퀸만 위치해야 함.
* **8방향 인접 제한**: 퀸이 놓인 칸을 기준으로 **바로 인접한 이웃 8칸**에는 다른 퀸이 존재할 수 없음.
* **시각적 피드백**: 규칙 위반을 일으키는 퀸 셀에는 `conflict-blink` 클래스를 실시간으로 부여하여 빨간색으로 점멸(Blink)하도록 처리.

### 2. 무한 랜덤 맵 생성기 (Generator)
기본 프리셋 스테이지 이외에 무한히 새로운 도전을 할 수 있도록 실시간 맵 제네레이터를 완벽 구현했습니다.
* **N-Queen 백트래킹**: 8방향 인접 제한과 행/열 중복 방지를 만족하는 $N$개의 퀸 좌표를 백트래킹으로 신속하게 검색.
* **BFS 구역 팽창**: 생성된 퀸 좌표를 씨앗(Seed)으로 삼아, $N$개의 큐에서 임의의 방향으로 칸을 확장하여 영역(Region)을 분할. 이를 통해 **항상 유효한 해가 최소 1개 보장된 연결성 맵**을 무한히 자동 생성합니다.

---

## 🎨 UI/UX 디자인 시스템 및 편의 기능

* **시각적 인지성 극대화**: 영역 구분을 한눈에 할 수 있도록, 인접한 셀의 영역 ID가 다를 경우에만 `3px solid rgba(255, 255, 255, 0.85)`의 굵은 테두리를 렌더링하도록 렌더러 설계.
* **스마트 드로잉 (X 마크 브러시)**: 모바일 터치 스와이프나 마우스 드래그를 통해 빈칸에 X(메모) 마크를 쓱 문질러 칠할 수 있는 페인팅 기능 적용.
* **지능형 힌트 (💡)**: 오답 퀸이 있으면 오답 위치를 정정해주고, 오답이 없으면 정답 퀸 위치를 보드에 자동으로 올바르게 배치해주며 주변 영역에 유도적인 X 마킹 서비스 제공.
* **로컬 신기록 저장**: 유저가 스테이지를 클리어하면 `LocalStorage`에 영구 기록되어 로비 화면의 레코드 및 통계에 즉시 반영.

---

## 🚀 로컬 실행 방법

현재 개발 서버가 3000번 포트로 가동되고 있습니다.

1. **프로젝트 폴더로 이동**:
   ```bash
   cd /data/data/com.termux/files/home/workspace/geminihaha.github.com/queenz
   ```
2. **개발 서버 구동 (최초 실행 시)**:
   ```bash
   npm run dev
   ```
3. **게임 플레이**:
   * 브라우저를 열어 **`http://localhost:3000`** 주소로 접속하면 즉시 게임을 즐길 수 있습니다.
