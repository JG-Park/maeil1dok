# Task 02: 동적 import 제거

> 상태: ⬜ pending  
> 우선순위: 긴급  
> 예상 소요: 5분

---

## 목표

`bookmarks.vue`에서 불필요한 동적 import를 정적 import로 변경하여 성능 개선

---

## 대상 파일

- `frontend/app/pages/bible/bookmarks.vue`

---

## 문제 코드

```typescript
// 라인 67-70
const handleDelete = async (bookmark: Bookmark) => {
  // ...
  const { useApi } = await import('~/composables/useApi');  // 매 삭제마다 import
  const api = useApi();
  // ...
};
```

---

## 변경 사항

### 1. 상단에 정적 import 추가

```typescript
// script setup 상단
import { useApi } from '~/composables/useApi';
```

### 2. handleDelete 함수 수정

```typescript
const api = useApi();  // 컴포넌트 레벨에서 한 번만 호출

const handleDelete = async (bookmark: Bookmark) => {
  if (!confirm('이 북마크를 삭제하시겠습니까?')) return;

  try {
    await api.delete(`/api/v1/todos/bible/bookmarks/${bookmark.id}/`);
    bookmarks.value = bookmarks.value.filter(b => b.id !== bookmark.id);
    toast.success('북마크가 삭제되었습니다');
  } catch (error) {
    console.error('북마크 삭제 실패:', error);
    toast.error('북마크 삭제에 실패했습니다');
  }
};
```

---

## 테스트 방법

1. `npm run build` - 빌드 성공 확인
2. 개발 서버 실행: `npm run dev`
3. Chrome DevTools MCP로 테스트:
   - 로그인 후 `/bible/bookmarks` 접속
   - 북마크 삭제 버튼 클릭
   - 삭제 정상 동작 확인
   - Network 탭에서 불필요한 chunk 로드 없음 확인

---

## 완료 체크리스트

- [ ] 코드 변경 완료
- [ ] 빌드 성공
- [ ] 테스트 통과
- [ ] 커밋 발행

---

## 커밋 메시지 템플릿

```
refactor(bible): replace dynamic import with static import in bookmarks

- Move useApi import to top-level static import
- Initialize api instance at component level
- Improves performance by avoiding repeated dynamic imports
```

---

← [트래커로 돌아가기](./_index.md)
