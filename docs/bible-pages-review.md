# /bible 페이지 코드 리뷰 리포트

> 작성일: 2026-01-06  
> 대상: `frontend/app/pages/bible/` 전체

---

## 목차

1. [개요](#1-개요)
2. [아키텍처 & 코드 구조](#2-아키텍처--코드-구조)
3. [일관성 문제](#3-일관성-문제)
4. [타입 안전성](#4-타입-안전성)
5. [성능 & 메모리](#5-성능--메모리)
6. [UX/접근성](#6-ux접근성)
7. [CSS/디자인](#7-css디자인)
8. [보안](#8-보안)
9. [리팩토링 우선순위](#9-리팩토링-우선순위)

---

## 1. 개요

### 분석 대상 파일

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `index.vue` | 800+ | 메인 성경 페이지 (홈/목차/리더 뷰) |
| `settings.vue` | 400+ | 읽기 설정 |
| `history.vue` | 300+ | 읽기 기록/통계 |
| `bookmarks.vue` | 150+ | 북마크 목록 |
| `notes/index.vue` | 250+ | 묵상노트 목록 |
| `notes/[id].vue` | 300+ | 묵상노트 상세/편집 |
| `highlights/index.vue` | 300+ | 하이라이트 목록 |

### 종합 평가: D+

- 구현은 완료되었으나 기술 부채 심각
- 유지보수 비용이 높은 구조
- DRY 원칙 미준수로 인한 코드 중복 다수

---

## 2. 아키텍처 & 코드 구조

### 2.1 index.vue - God Component 문제

**현황:**
```
index.vue: 800+ lines
├── 10개 이상 composable import
├── 20개 이상 ref/computed
├── 15개 이상 함수
├── 300줄 이상 CSS
└── 복잡한 조건부 렌더링 (viewMode 기반)
```

**문제점:**
- 단일 책임 원칙(SRP) 위반
- 뷰 렌더링, 비즈니스 로직, 상태 관리, 네비게이션이 혼재
- 테스트 작성 어려움
- 새 기능 추가 시 사이드 이펙트 위험

**권장 구조:**
```
pages/bible/
├── index.vue              # 라우팅 컨테이너만
├── components/
│   ├── BibleReaderView.vue   # 리더 뷰
│   ├── BibleHomeView.vue     # 홈/대시보드 뷰
│   └── BibleTocView.vue      # 목차 뷰
```

### 2.2 중복 함수

**위치:** `index.vue:580-620`

```typescript
// 거의 동일한 로직이 3번 반복됨
const handleContinueReading = async () => { /* 위치 로드 → 뷰 변경 → 콘텐츠 로드 → fetch */ };
const handleHomeBookSelect = async () => { /* 뷰 변경 → 콘텐츠 로드 → fetch */ };
const handleTocBookSelect = async () => { /* 뷰 변경 → 콘텐츠 로드 → fetch */ };
```

**해결책:**
```typescript
const navigateToChapter = async (book: string, chapter: number, options?: {
  loadPosition?: boolean;
  scrollPosition?: number;
}) => {
  // 통합 로직
};
```

### 2.3 Composable 과다 사용

**현재 import 목록:**
- `useBibleData`
- `useTongdokMode`
- `usePersonalRecord`
- `useReadingPosition`
- `useBookmark`
- `useNote`
- `useHighlight`
- `useBibleModals`
- `useBibleContent`
- `useAuthStore`
- `useReadingSettingsStore`
- `useToast`

**문제:** Composable로 "분리"했지만 실제로는 높은 결합도 유지

---

## 3. 일관성 문제

### 3.1 BibleSubpageLayout 미사용

| 페이지 | BibleSubpageLayout 사용 | 비고 |
|--------|------------------------|------|
| `bookmarks.vue` | ✅ | 유일하게 사용 |
| `notes/index.vue` | ❌ | 직접 구현 |
| `highlights/index.vue` | ❌ | 직접 구현 |
| `history.vue` | ❌ | 직접 구현 |
| `settings.vue` | ❌ | 직접 구현 |

**결과:** 동일한 헤더/로딩/빈상태 CSS가 5개 파일에 복사됨

### 3.2 날짜 포맷 불일치

```typescript
// notes/[id].vue - 직접 구현
const formatDate = (dateStr: string): string => {
  return date.toLocaleDateString('ko-KR', { ... });
};

// 다른 파일들 - composable 사용
const { formatRelativeDate } = useDateFormat();
```

### 3.3 API 호출 패턴 불일치

```typescript
// bookmarks.vue - 동적 import (비권장)
const { useApi } = await import('~/composables/useApi');

// 다른 파일들 - 정적 import
import { useApi } from '~/composables/useApi';
```

---

## 4. 타입 안전성

### 4.1 인라인 인터페이스

**위치:** `index.vue:382`
```typescript
// 파일 내부에서 선언 - 재사용 불가
interface VerseSelection {
  start: number;
  end: number;
  text: string;
}
```

### 4.2 타입 정의 부재

**위치:** `history.vue:51`
```typescript
interface Stats {
  books_progress: Record<string, { read: number; total: number }>;
  // 백엔드 응답 타입과 동기화 필요
}
```

### 4.3 권장 타입 파일 구조

```
types/
├── bible.ts           # BibleLocation, VerseRange, BibleVersion 등
├── bookmark.ts        # Bookmark, BookmarkType 등
├── note.ts            # Note, NoteFilter 등
├── highlight.ts       # Highlight, HighlightColor 등
└── api-responses.ts   # API 응답 타입
```

---

## 5. 성능 & 메모리

### 5.1 메모리 누수 가능성

**위치:** `notes/[id].vue:172-179`
```typescript
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
watch([editContent, isPrivate], () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await handleSave();
  }, 3000);
});
// ⚠️ onBeforeUnmount에서 clearTimeout 누락
```

**수정:**
```typescript
onBeforeUnmount(() => {
  if (saveTimeout) clearTimeout(saveTimeout);
});
```

### 5.2 불필요한 리렌더링

**위치:** `index.vue`
```typescript
// 3개의 watch가 거의 동시에 트리거됨
watch(() => currentBook.value, ...);
watch([() => currentBook.value, () => currentChapter.value], ...);
watch([() => currentBook.value, () => currentChapter.value, () => currentVersion.value], ...);
```

**권장:** 단일 watchEffect 또는 통합 watch 사용

### 5.3 동적 import 오용

**위치:** `bookmarks.vue:67`
```typescript
const handleDelete = async (bookmark: Bookmark) => {
  const { useApi } = await import('~/composables/useApi');  // 매 삭제마다 import
};
```

---

## 6. UX/접근성

### 6.1 네이티브 confirm() 사용

**발생 위치:**
- `settings.vue` - 데이터 삭제
- `bookmarks.vue` - 북마크 삭제
- `notes/[id].vue` - 노트 삭제, 저장 안함 확인
- `highlights/index.vue` - 하이라이트 삭제

**문제:**
- 스타일 커스터마이징 불가
- 앱 디자인과 불일치
- 모바일에서 UX 저하

**권장:** 커스텀 ConfirmModal 컴포넌트 사용

### 6.2 접근성 속성 부재

```html
<!-- 현재 - 스크린리더 인식 불가 -->
<button class="back-btn" @click="$router.back()">
  <svg>...</svg>
</button>

<!-- 권장 -->
<button 
  class="back-btn" 
  @click="$router.back()"
  aria-label="뒤로 가기"
>
  <svg aria-hidden="true">...</svg>
</button>
```

### 6.3 누락된 접근성 요소

- [ ] `role` 속성
- [ ] `aria-label` / `aria-labelledby`
- [ ] 키보드 네비게이션 (Tab, Enter, Escape)
- [ ] 포커스 관리
- [ ] 스킵 네비게이션

### 6.4 로딩 UX 개선 필요

| 현재 | 권장 |
|------|------|
| 스피너만 표시 | 스켈레톤 로딩 |
| 동기 업데이트 | 옵티미스틱 업데이트 |
| 에러 시 빈 화면 | 에러 바운더리 + 재시도 |

---

## 7. CSS/디자인

### 7.1 매직 넘버

**위치:** `index.vue`
```css
z-index: 100;  /* 기준 불명확 */
z-index: 20;
height: 50px;  /* 디자인 토큰 미사용 */
border-radius: 20px;  /* 10px, 12px, 20px 혼재 */
```

### 7.2 CSS 변수 미사용

```css
/* 변수 정의됨 */
:root { --primary-color: #6366f1; }

/* 하드코딩 사용 */
.summary-card.streak .card-icon {
  background: #fef3c7;  /* 변수 사용 안 함 */
  color: #f59e0b;
}
```

### 7.3 다크모드 CSS 중복

모든 서브페이지에 다음 패턴 반복:
```css
:root.dark .page-header { background: var(--color-bg-card); }
:root.dark .back-btn { color: var(--text-primary); }
:root.dark .loading-state { color: var(--text-secondary); }
/* ... 30줄씩 */
```

### 7.4 권장 디자인 토큰

```css
:root {
  /* z-index 레이어 */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-toast: 400;
  
  /* 간격 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  
  /* 반경 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

---

## 8. 보안

### 8.1 v-html XSS 위험

**위치:** `settings.vue:74`
```typescript
const themeOptions = [
  { icon: '<svg>...</svg>' }  // 현재는 정적 데이터
];
```
```html
<span class="theme-icon" v-html="theme.icon"></span>
```

**위험:** 향후 동적 데이터 사용 시 XSS 취약점

**권장:** 아이콘 컴포넌트로 분리
```html
<component :is="getIconComponent(theme.icon)" />
```

---

## 9. 리팩토링 우선순위

### Phase 1: 긴급 (1-2주)

| # | 작업 | 파일 | 효과 |
|---|------|------|------|
| 1 | 메모리 누수 수정 | `notes/[id].vue` | 안정성 ↑ |
| 2 | 동적 import 제거 | `bookmarks.vue` | 성능 ↑ |
| 3 | BibleSubpageLayout 적용 | 모든 서브페이지 | CSS 500줄 ↓ |

### Phase 2: 중요 (2-4주)

| # | 작업 | 파일 | 효과 |
|---|------|------|------|
| 4 | index.vue 분할 | `index.vue` | 가독성 3배 ↑ |
| 5 | 공통 타입 정의 | `types/*.ts` | 타입 안전성 ↑ |
| 6 | 중복 함수 통합 | `index.vue` | 유지보수성 ↑ |

### Phase 3: 개선 (4-6주)

| # | 작업 | 파일 | 효과 |
|---|------|------|------|
| 7 | ConfirmModal 도입 | 전체 | UX 일관성 ↑ |
| 8 | CSS 디자인 토큰 정리 | 전체 | 유지보수성 ↑ |
| 9 | 접근성 속성 추가 | 전체 | a11y 점수 ↑ |
| 10 | notes/highlights 통합 | 목록 페이지 | 중복 70% ↓ |

### Phase 4: 고도화 (선택)

| # | 작업 | 효과 |
|---|------|------|
| 11 | 스켈레톤 로딩 | UX ↑ |
| 12 | 옵티미스틱 업데이트 | 체감 속도 ↑ |
| 13 | 에러 바운더리 | 안정성 ↑ |
| 14 | 무한 스크롤 | 대용량 처리 ↑ |

---

## 부록: 코드 스멜 요약

| 패턴 | 위치 | 설명 |
|------|------|------|
| God Component | `index.vue` | 800줄 단일 컴포넌트 |
| Feature Envy | `index.vue` | authStore 과다 참조 |
| Copy-Paste | `notes/`, `highlights/` | 90% 동일 코드 |
| Primitive Obsession | 전체 | (book, chapter) 쌍 반복 전달 |
| Magic Numbers | CSS 전체 | z-index, 크기값 하드코딩 |

---

## 참고 문서

- [Vue 3 Composition API Best Practices](https://vuejs.org/guide/reusability/composables.html)
- [WCAG 2.1 접근성 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Nuxt 3 디렉토리 구조](https://nuxt.com/docs/guide/directory-structure)
