# TASK-04: CSS 공통화 및 중복 제거

> **Priority**: P1 (Major)
> **Status**: `[x]` Completed
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

동일한 CSS 스타일이 여러 파일에 복사-붙여넣기 되어 있습니다.

### 중복 스타일 목록

#### 1. 페이지 헤더 (5개 파일에서 중복)

```css
.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}
```

**존재 파일**: `history.vue`, `settings.vue`, `notes/index.vue`, `notes/[id].vue`, `bookmarks.vue` (일부 BibleSubpageLayout 사용)

#### 2. 뒤로가기 버튼 (5개 파일에서 중복)

```css
.back-btn {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}
```

#### 3. 로딩 스피너 (3개 파일에서 중복)

```css
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

#### 4. 빈 상태 (3개 파일에서 중복)

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}
```

---

## Goal

공통 CSS를 글로벌 스타일 또는 공유 컴포넌트로 추출

---

## Tasks

### 1. 글로벌 유틸리티 클래스 생성

- [x] `assets/css/bible-page.css` 생성 (통합 파일)
  - `.bible-page` - 페이지 컨테이너
  - `.bible-page-header` - 페이지 헤더
  - `.bible-back-btn` - 뒤로가기 버튼
  - `.bible-loading-state` - 로딩 상태
  - `.bible-loading-spinner` - 로딩 스피너
  - `.bible-empty-state` - 빈 상태
  - `.bible-login-btn` - 로그인 버튼
  - `.bible-header-actions` - 헤더 액션 버튼들
  - `.bible-header-btn` - 헤더 버튼

### 2. BibleSubpageLayout 업데이트

- [x] 인라인 SVG를 아이콘 컴포넌트로 교체 (ChevronLeftIcon, SpinnerIcon, InfoCircleIcon)
- [x] 전역 CSS 클래스 사용으로 전환
- [x] 중복 scoped CSS 제거

### 3. 각 파일에서 중복 스타일 제거

- [x] `history.vue` - page-header, back-btn, loading 스타일 제거
- [x] `settings.vue` - page-header, back-btn 스타일 제거
- [x] `notes/index.vue` - page-header, back-btn, loading, empty-state, login-btn 스타일 제거
- [x] `notes/[id].vue` - page-header, back-btn, loading, empty-state 스타일 제거
- [x] `bookmarks.vue` - login-btn 스타일 제거

---

## Proposed Structure

```
assets/css/
├── main.css (기존)
└── components/
    ├── page-header.css
    ├── buttons.css
    ├── loading.css
    └── empty-state.css
```

```css
/* assets/css/components/page-header.css */
.bible-page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.bible-page-header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.bible-back-btn {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}

.bible-back-btn:hover {
  background: var(--color-bg-hover, #f3f4f6);
}
```

---

## Files Affected

| File | Action |
|------|--------|
| `assets/css/components/*.css` | Create |
| `nuxt.config.ts` | Modify (CSS import 추가) |
| `history.vue` | Modify |
| `settings.vue` | Modify |
| `notes/index.vue` | Modify |
| `notes/[id].vue` | Modify |
| `bookmarks.vue` | Modify |

---

## Acceptance Criteria

- [x] 중복 CSS 제거됨
- [x] 공통 스타일이 한 곳에서 관리됨 (`bible-page.css`)
- [x] 기존 UI 동일하게 렌더링
- [x] 다크모드 정상 동작
- [x] 빌드 에러 없음

---

## Dependencies

- 없음

## Dependent Tasks

- T09 (로딩/빈 상태 컴포넌트 통일) - 함께 진행 가능

---

## Completion

- [x] 코드 변경 완료
- [x] 테스트 통과
- [x] 커밋 발행
- [x] TRACKER.md 상태 업데이트
