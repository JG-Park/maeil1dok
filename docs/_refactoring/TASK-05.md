# TASK-05: 타입 정의 중앙화

> **Priority**: P1 (Major)
> **Status**: `[ ]` Pending
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

타입/인터페이스 정의가 여러 파일에 분산되어 있습니다.

### 현재 분산된 타입들

#### `pages/bible/index.vue`
```typescript
interface VerseSelection {
  start: number;
  end: number;
  text: string;
}
```

#### `pages/bible/history.vue`
```typescript
interface Stats {
  total_chapters_read: number;
  books_read: number;
  books_completed: number;
  current_streak: number;
  books_progress: Record<string, { read: number; total: number }>;
}
```

#### `components/bible/BibleHome.vue`
```typescript
interface LastPosition {
  book: string;
  chapter: number;
  book_name: string;
}

interface RecentRecord {
  book: string;
  chapter: number;
  book_name: string;
  read_date: string;
}
```

#### 각 composable 내부
- `useBookmark.ts` → `Bookmark` 타입
- `useNote.ts` → `Note` 타입
- `useHighlight.ts` → `Highlight` 타입 (추정)

---

## Goal

모든 Bible 관련 타입을 `~/types/bible.ts`에 중앙 집중화

---

## Tasks

### 1. 타입 정의 파일 생성

- [ ] `types/bible.ts` 생성
- [ ] 모든 Bible 관련 타입 이동

### 2. 각 파일에서 import로 전환

- [ ] `pages/bible/index.vue` 수정
- [ ] `pages/bible/history.vue` 수정
- [ ] `components/bible/BibleHome.vue` 수정
- [ ] `composables/useBookmark.ts` 수정
- [ ] `composables/useNote.ts` 수정
- [ ] `composables/useHighlight.ts` 수정

### 3. API 응답 타입 추가 (선택)

- [ ] API 응답 타입 정의
- [ ] 타입 안정성 강화

---

## Proposed Type Definitions

```typescript
// types/bible.ts

// ============================================
// Core Types
// ============================================

export interface VerseSelection {
  start: number;
  end: number;
  text: string;
}

export interface BiblePosition {
  book: string;
  chapter: number;
  verse?: number;
  book_name?: string;
}

export interface ReadingPosition extends BiblePosition {
  version?: string;
  scroll_position?: number;
}

// ============================================
// Reading Stats
// ============================================

export interface BookProgress {
  read: number;
  total: number;
}

export interface ReadingStats {
  total_chapters_read: number;
  books_read: number;
  books_completed: number;
  current_streak: number;
  books_progress: Record<string, BookProgress>;
}

export interface RecentRecord extends BiblePosition {
  read_date: string;
}

// ============================================
// User Data Types
// ============================================

export interface Bookmark {
  id: number;
  bookmark_type: 'chapter' | 'verse';
  book: string;
  book_name?: string;
  chapter: number;
  start_verse?: number;
  end_verse?: number;
  title: string;
  color?: string;
  memo?: string;
  created_at: string;
}

export interface Note {
  id: number;
  book: string;
  book_name?: string;
  chapter: number;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface Highlight {
  id: number;
  book: string;
  book_name?: string;
  chapter: number;
  start_verse: number;
  end_verse: number;
  color: string;
  memo?: string;
  created_at: string;
}

// ============================================
// View Types
// ============================================

export type ViewMode = 'reader' | 'home' | 'toc';

export type ThemeMode = 'light' | 'dark' | 'system';

export type DefaultEntryPoint = 'last-position' | 'home' | 'toc';
```

---

## Files Affected

| File | Action |
|------|--------|
| `types/bible.ts` | Create |
| `pages/bible/index.vue` | Modify |
| `pages/bible/history.vue` | Modify |
| `components/bible/BibleHome.vue` | Modify |
| `composables/useBookmark.ts` | Modify |
| `composables/useNote.ts` | Modify |
| `composables/useHighlight.ts` | Modify |
| `composables/bible/useBiblePageState.ts` | Modify |

---

## Acceptance Criteria

- [ ] `types/bible.ts` 파일 생성됨
- [ ] 모든 분산된 타입이 중앙화됨
- [ ] 각 파일에서 import로 사용
- [ ] TypeScript 컴파일 에러 없음
- [ ] 기존 기능 정상 동작

---

## Dependencies

- 없음

## Dependent Tasks

- 없음

---

## Completion

- [ ] 코드 변경 완료
- [ ] 테스트 통과
- [ ] 커밋 발행
- [ ] TRACKER.md 상태 업데이트
