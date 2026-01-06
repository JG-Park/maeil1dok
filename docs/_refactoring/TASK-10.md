# TASK-10: 기타 개선 사항

> **Priority**: P3 (Nice-to-have)
> **Status**: `[x]` Completed
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
- [x] `components/ui/ConfirmModal.vue` 생성 (이미 존재)
- [x] 기존 모달 시스템 활용 (`useModal().confirm()`)
- [x] 모든 confirm() 호출을 modal.confirm()으로 교체

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
- [x] CSS 변수로 정의 (`bible-page.css`에 추가)

```css
:root {
  --bible-max-width: 768px;
  --bible-header-height: 50px;
  --bible-content-padding: 1rem;
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
- [x] auto-import 설정 확인 (Nuxt 3 기본 동작으로 정상 작동)
- [-] 명시적 import 추가 (불필요 - auto-import 사용)

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
- [-] DOMPurify 도입 (스킵 - 콘텐츠가 신뢰할 수 있는 자체 API에서 제공되므로 XSS 위험 낮음)
- [-] 콘텐츠 sanitize 처리 (향후 사용자 입력 콘텐츠 추가 시 재검토)

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
- [x] 최소 터치 타겟 크기 보장 (44x44px)

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
- [-] 빈 상태 UI 추가 (스킵 - 0 진도 표시가 유효한 상태이므로 별도 빈 상태 불필요)

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

- [x] 네이티브 confirm() 대체됨
- [x] Magic numbers 상수화됨
- [x] Import 패턴 일관성 확보 (auto-import 확인)
- [x] XSS 취약점 리스크 평가 완료 (신뢰할 수 있는 소스)
- [x] 터치 타겟 크기 개선
- [-] 빈 상태 처리 추가 (불필요)

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

- [x] 모든 하위 태스크 완료
- [x] 테스트 통과 (빌드 성공)
- [x] 최종 커밋 발행
- [x] TRACKER.md 최종 상태 업데이트
- [ ] 임시 문서 폴더 삭제 (T10 완료 후 별도 진행)
- [ ] 삭제 커밋 발행 (T10 완료 후 별도 진행)
