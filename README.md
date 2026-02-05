# Gemini Projects & Web Development Tests

이 레포지토리는 다양한 웹 기술 실험, 게임 프로토타입 개발 및 프론트엔드 라이브러리 테스트를 위한 개인용 공간입니다. 모든 프로젝트는 GitHub Pages를 통해 직접 테스트해 볼 수 있도록 구성되어 있습니다.

## 🚀 주요 프로젝트 (Main Projects)

- **[sudoku/](./sudoku/)**: EaselJS 기반의 고기능 수도쿠 게임. 9x9/6x6 모드, 시드 기반 퍼즐 생성(300개), 실시간 오답 체크 및 최고 기록 저장 기능을 지원합니다.
- **[tetris/](./tetris/)**: 자바스크립트로 구현된 클래식 테트리스 게임.
- **[birdgame/](./birdgame/)**: Flappy Bird 스타일의 간단한 아케이드 게임.
- **[bletrs/](./bletrs/)**: Web Bluetooth API를 활용한 BLE(Bluetooth Low Energy) 통신 및 Pixl.js 연동 테스트.

## 🛠️ 개발 및 테스트 공간 (Tests & Experiments)

- **[game/](./game/) / [nomaljs/](./nomaljs/) / [test/](./test/)**: 비행기 슈팅 및 이동 로직 등 게임 엔진 프로토타입과 기본적인 자바스크립트 기능 테스트 공간.
- **[lib/](./lib/)**: EaselJS 등 프로젝트 전반에서 공통으로 사용되는 외부 라이브러리 저장소.
- **[assets/](./assets/)**: 이미지, 오디오, 공통 CSS/JS 파일 등 전역 자산 관리.
- **Root HTML Files**: `globalToLocal.html`, `hitTest.html` 등 EaselJS의 특정 기능(좌표 변환, 충돌 감지 등)을 개별적으로 테스트하기 위한 단일 파일들.

## 📦 데이터 및 설정
- **[data/](./data/)**: 로또 번호 정보 등 JSON 형태의 테스트 데이터 저장소.
- **[.well-known/](./.well-known/)**: Apple App Site Association 및 Android Asset Links 등 웹-앱 연동을 위한 설정 파일.

---
각 디렉토리의 `index.html`을 통해 개별 프로젝트를 실행해 볼 수 있습니다.