# TASK-04: CSS 공통화 및 중복 제거

> **Priority**: P1 (Major)
> **Status**: `[ ]` Pending
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

- [ ] `assets/css/components/page-header.css` 생성
- [ ] `assets/css/components/buttons.css` 생성
- [ ] `assets/css/components/loading.css` 생성
- [ ] `assets/css/components/empty-state.css` 생성

### 2. BibleSubpageLayout 활용 확대

현재 `bookmarks.vue`만 `BibleSubpageLayout` 사용 중

- [ ] `history.vue` → `BibleSubpageLayout` 사용으로 전환
- [ ] `settings.vue` → `BibleSubpageLayout` 사용으로 전환
- [ ] `notes/index.vue` → 이미 직접 구현, Layout 전환 검토

### 3. 각 파일에서 중복 스타일 제거

- [ ] 글로벌 클래스 import 후 scoped 스타일 제거
- [ ] 파일별 고유 스타일만 유지

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

- [ ] 중복 CSS 제거됨
- [ ] 공통 스타일이 한 곳에서 관리됨
- [ ] 기존 UI 동일하게 렌더링
- [ ] 다크모드 정상 동작
- [ ] 빌드 에러 없음

---

## Dependencies

- 없음

## Dependent Tasks

- T09 (로딩/빈 상태 컴포넌트 통일) - 함께 진행 가능

---

## Completion

- [ ] 코드 변경 완료
- [ ] 테스트 통과
- [ ] 커밋 발행
- [ ] TRACKER.md 상태 업데이트
