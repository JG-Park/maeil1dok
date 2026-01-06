# TASK-02: 공통 로직 추출 (DRY 원칙)

> **Priority**: P0 (Critical)
> **Status**: `[x]` Completed
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

동일한 코드 블록이 여러 함수에서 반복됩니다.

### 예시 1: 사용자 데이터 로딩 (3회 반복)

```typescript
// handleContinueReading, handleHomeBookSelect, handleTocBookSelect 모두 동일
if (authStore.isAuthenticated) {
  await fetchReadChapters(currentBook.value);
  await fetchChapterNotes(currentBook.value, currentChapter.value);
  await fetchChapterHighlights(currentBook.value, currentChapter.value);
  await loadBookmarks(currentBook.value, currentChapter.value);
}
```

### 예시 2: 콘텐츠 로딩 후 처리

```typescript
viewMode.value = 'reader';
loadBibleContent(currentBook.value, currentChapter.value);
// + 사용자 데이터 로딩
```

---

## Goal

중복 코드를 헬퍼 함수로 추출하여 DRY 원칙 준수

---

## Tasks

### 1. 사용자 데이터 로딩 함수 추출

- [x] `loadUserDataForChapter(book, chapter, skipReadChapters)` 함수 생성
- [x] onMounted에서 해당 함수 사용

### 2. 리더 모드 진입 함수 추출

- [x] `enterReaderMode(book, chapter)` 함수 생성
- [x] `handleContinueReading`, `handleHomeBookSelect`, `handleTocBookSelect` 통합

### 3. 기타 중복 코드 검토

- [x] 중복 핸들러 통합 완료
- [-] 에러 핸들링 패턴 통일 - T08에서 진행

---

## Proposed Solution

```typescript
// composables/bible/useBibleReader.ts 또는 index.vue 내부

const loadUserDataForChapter = async (book: string, chapter: number) => {
  if (!authStore.isAuthenticated) return;

  await Promise.all([
    fetchReadChapters(book),
    fetchChapterNotes(book, chapter),
    fetchChapterHighlights(book, chapter),
    loadBookmarks(book, chapter),
  ]);
};

const enterReaderMode = async (book: string, chapter: number) => {
  currentBook.value = book;
  currentChapter.value = chapter;
  viewMode.value = 'reader';

  await loadBibleContent(book, chapter);
  await loadUserDataForChapter(book, chapter);
};
```

---

## Files Affected

| File | Action |
|------|--------|
| `pages/bible/index.vue` | Modify |
| `composables/bible/useBibleReader.ts` | Create (선택) |

---

## Acceptance Criteria

- [x] 중복 코드 제거됨 (3개 핸들러 → 1개 헬퍼 함수)
- [x] 새 헬퍼 함수가 올바르게 동작
- [x] 기존 기능 모두 정상 동작
- [x] 코드 라인 수 감소 (784줄 → 780줄)

---

## Dependencies

- T01 (index.vue 분해) - 완료됨

## Dependent Tasks

- 없음

---

## Completion

- [x] 코드 변경 완료
- [x] 테스트 통과
- [x] 커밋 발행
- [x] TRACKER.md 상태 업데이트
