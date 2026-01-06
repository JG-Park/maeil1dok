# TASK-10: 기타 개선 사항

> **Priority**: P3 (Nice-to-have)
> **Status**: `[ ]` Pending
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

다양한 소규모 개선 사항들입니다.

---

## Tasks

### 1. 네이티브 confirm() 대체

현재 상태:
```typescript
if (!confirm('모든 북마크를 삭제하시겠습니까?')) return;
if (!confirm('묵상노트를 삭제하시겠습니까?')) return;
```

**문제**: 네이티브 confirm은 스타일 커스터마이징 불가, 앱 디자인과 불일치

**해결 방안**:
- [ ] `components/ui/ConfirmModal.vue` 생성
- [ ] 또는 기존 모달 시스템 활용
- [ ] `useConfirm()` composable 생성

```typescript
const { confirm } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: '북마크 삭제',
    message: '모든 북마크를 삭제하시겠습니까?',
    confirmText: '삭제',
    cancelText: '취소',
    variant: 'danger',
  });

  if (!confirmed) return;
  // ...
};
```

---

### 2. Magic Numbers 상수화

현재 상태:
```css
padding-bottom: 100px;  /* 왜 100px? */
bottom: 120px;          /* 왜 120px? */
min-height: calc(100vh - 120px);
max-width: 768px;
```

**해결 방안**:
- [ ] CSS 변수로 정의

```css
:root {
  --bible-bottom-nav-height: 80px;
  --bible-header-height: 50px;
  --bible-content-padding: 100px;
  --bible-max-width: 768px;
}

.bible-viewer {
  padding-bottom: var(--bible-content-padding);
}

.copy-menu {
  bottom: calc(var(--bible-bottom-nav-height) + 40px);
}
```

---

### 3. useDateFormat 명시적 import

현재 상태:
```typescript
// bookmarks.vue
const { formatRelativeDate } = useDateFormat();
// import 문 없음 - auto-import 의존
```

**해결 방안**:
- [ ] 명시적 import 추가 또는 auto-import 설정 확인
- [ ] 일관성 있는 패턴 적용

```typescript
import { useDateFormat } from '~/composables/useDateFormat';
```

---

### 4. v-html XSS 방지

현재 상태:
```vue
<div v-html="renderedContent"></div>
```

**해결 방안**:
- [ ] DOMPurify 또는 유사 라이브러리 도입
- [ ] 콘텐츠 sanitize 처리

```typescript
import DOMPurify from 'dompurify';

const sanitizedContent = computed(() => {
  return DOMPurify.sanitize(renderedContent.value);
});
```

---

### 5. 터치 타겟 크기 개선

현재 상태:
```css
.chapter-button {
  aspect-ratio: 1;
  /* 작은 화면에서 44x44 미만일 수 있음 */
}
```

**해결 방안**:
- [ ] 최소 터치 타겟 크기 보장

```css
.chapter-button {
  aspect-ratio: 1;
  min-width: 44px;
  min-height: 44px;
}
```

---

### 6. history.vue 빈 상태 처리

현재 상태:
- 데이터 없을 때 빈 그리드만 표시됨

**해결 방안**:
- [ ] 빈 상태 UI 추가 (T09와 연계)

---

## Files Affected

| File | Action | Task |
|------|--------|------|
| `components/ui/ConfirmModal.vue` | Create | 1 |
| `composables/useConfirm.ts` | Create | 1 |
| `assets/css/variables.css` | Create/Modify | 2 |
| 여러 파일 | Modify | 2 |
| `pages/bible/bookmarks.vue` | Modify | 3 |
| `components/bible/BibleViewer.vue` | Modify | 4 |
| `components/bible/BookSelector.vue` | Modify | 5 |
| `pages/bible/history.vue` | Modify | 6 |

---

## Acceptance Criteria

- [ ] 네이티브 confirm() 대체됨
- [ ] Magic numbers 상수화됨
- [ ] Import 패턴 일관성 확보
- [ ] XSS 취약점 해결 (또는 리스크 평가)
- [ ] 터치 타겟 크기 개선
- [ ] 빈 상태 처리 추가

---

## Dependencies

- T09 (로딩/빈 상태 컴포넌트) - 빈 상태 처리와 연계

## Dependent Tasks

- 없음 (마지막 태스크)

---

## Notes

이 태스크 완료 후:
1. 모든 변경사항 커밋
2. TRACKER.md 최종 업데이트
3. `docs/_refactoring/` 폴더 전체 삭제
4. 삭제 커밋 발행

---

## Completion

- [ ] 모든 하위 태스크 완료
- [ ] 테스트 통과
- [ ] 최종 커밋 발행
- [ ] TRACKER.md 최종 상태 업데이트
- [ ] 임시 문서 폴더 삭제
- [ ] 삭제 커밋 발행
