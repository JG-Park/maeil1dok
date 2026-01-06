# TASK-07: API 호출 최적화

> **Priority**: P2 (Minor)
> **Status**: `[ ]` Pending
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

비효율적인 API 호출 패턴이 존재합니다.

### 문제 1: 전체 데이터 fetch 후 count만 사용

`BibleHome.vue`:
```typescript
const [bookmarksRes, notesRes, highlightsRes, recordsRes] = await Promise.all([
  api.get('/api/v1/todos/bible/bookmarks/'),
  api.get('/api/v1/todos/bible/notes/'),
  api.get('/api/v1/todos/bible/highlights/'),
  api.get('/api/v1/todos/bible/personal-records/?limit=5')
]);

bookmarkCount.value = bookmarksRes.data?.length || 0;
noteCount.value = notesRes.data?.length || 0;
highlightCount.value = highlightsRes.data?.length || 0;
```

**문제**: 북마크/노트/하이라이트 전체를 받아서 `.length`만 사용. 데이터가 많아지면 불필요한 네트워크 비용.

### 문제 2: 동적 import 불일관

`bookmarks.vue`:
```typescript
const handleDelete = async (bookmark: Bookmark) => {
  const { useApi } = await import('~/composables/useApi');
  const api = useApi();
  await api.delete(...);
};
```

**문제**: 다른 곳에서는 정적 import, 여기만 동적 import.

---

## Goal

API 호출 효율화 및 일관성 확보

---

## Tasks

### 1. 카운트 전용 API 활용/생성

#### Option A: 기존 API에 count 파라미터 추가

```typescript
// 프론트엔드
api.get('/api/v1/todos/bible/bookmarks/?count_only=true')
// 백엔드 응답: { count: 15 }
```

#### Option B: 통합 stats 엔드포인트 활용

```typescript
// 이미 있을 수 있음
api.get('/api/v1/todos/bible/stats/')
// 응답: { bookmarks: 15, notes: 8, highlights: 23 }
```

- [ ] 백엔드 API 확인 또는 요청
- [ ] 프론트엔드에서 효율적인 API 사용

### 2. 동적 import 정리

- [ ] `bookmarks.vue`의 동적 import → 정적 import로 변경
- [ ] 다른 파일들도 일관된 패턴으로 통일

### 3. 데이터 페칭 최적화

- [ ] 불필요한 중복 호출 제거
- [ ] 캐싱 전략 검토 (선택)

---

## Backend API Check Required

확인 필요 사항:

1. `/api/v1/todos/bible/stats/` 엔드포인트 존재 여부
2. 기존 엔드포인트에 `count_only` 파라미터 지원 여부
3. 백엔드 수정 필요 시 별도 태스크 생성

---

## Proposed Solution

```typescript
// BibleHome.vue - 개선된 버전

// Option 1: 통합 stats API 사용 (권장)
onMounted(async () => {
  const lastPos = await loadReadingPosition();
  // ...

  if (authStore.isAuthenticated) {
    try {
      // 단일 API 호출로 모든 카운트 가져오기
      const statsRes = await api.get('/api/v1/todos/bible/home-stats/');
      if (statsRes.data) {
        bookmarkCount.value = statsRes.data.bookmarks || 0;
        noteCount.value = statsRes.data.notes || 0;
        highlightCount.value = statsRes.data.highlights || 0;
        recentRecords.value = statsRes.data.recent_records || [];
      }
    } catch (error) {
      console.error('홈 데이터 로드 실패:', error);
    }
  }
});

// Option 2: 기존 API + count_only 파라미터
const [bookmarksCount, notesCount, highlightsCount, recordsRes] = await Promise.all([
  api.get('/api/v1/todos/bible/bookmarks/?count_only=true'),
  api.get('/api/v1/todos/bible/notes/?count_only=true'),
  api.get('/api/v1/todos/bible/highlights/?count_only=true'),
  api.get('/api/v1/todos/bible/personal-records/?limit=5')
]);
```

---

## Files Affected

| File | Action |
|------|--------|
| `components/bible/BibleHome.vue` | Modify |
| `pages/bible/bookmarks.vue` | Modify |
| (백엔드) | 확인/수정 필요 |

---

## Acceptance Criteria

- [ ] 카운트만 필요할 때 전체 데이터 fetch 안 함
- [ ] import 패턴 일관성 확보
- [ ] 기존 기능 정상 동작
- [ ] 네트워크 요청 수/크기 감소

---

## Dependencies

- 백엔드 API 수정이 필요할 수 있음

## Dependent Tasks

- 없음

---

## Completion

- [ ] 백엔드 API 확인
- [ ] 코드 변경 완료
- [ ] 테스트 통과
- [ ] 커밋 발행
- [ ] TRACKER.md 상태 업데이트
