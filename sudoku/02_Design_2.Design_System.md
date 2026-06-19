# 디자인 시스템 가이드라인 (Design System)

## 1. 컬러 팔레트 (Color Palette)
* **Primary Background:** `#0f172a` (Slate 900 - 다크 모드 베이스) 또는 `#f8fafc` (Slate 50 - 라이트 모드 베이스)
* **Surface/Board:** `#1e293b` (Slate 800) / `#ffffff`
* **Accent/Interactive:** `#4f46e5` (Indigo 600 - 활성화 및 선택 상태)
* **Highlight Tints:** `#312e81` (동일 행/열 서브 하이라이트 배경색)
* **Error State:** `#ef4444` (Red 500) 및 소프트 레드 배경 `#fef2f2`

## 2. 타이포그래피 (Typography)
* **Font Family:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Font Sizes:**
  * 타이틀: `24pt` (Bold)
  * 보드 고정 숫자: `16pt` (Font Weight 700)
  * 메모(연필) 숫자: `7pt` (Font Weight 400, Slate 400 칼라)
  * 일반 텍스트 및 버튼: `11pt`

## 3. 인터랙션 및 컴포넌트 규격
* **Transitions:** 모든 버튼 및 스도쿠 셀의 hover/focus 상태 전환 시 `transition: background-color 0.2s ease, transform 0.1s ease;` 적용.
* **Border Radius:** 대화상자 및 주요 버튼에 `border-radius: 8px;` 균일 적용하여 부드러운 분위기 연출.