# Bible 페이지 리팩토링 태스크 트래커

> 생성일: 2026-01-06  
> 기반 문서: `docs/bible-pages-review.md`

---

## 진행 상황

| # | 태스크 | 상태 | 파일 |
|---|--------|------|------|
| 1 | [메모리 누수 수정](./task-01-memory-leak-fix.md) | ⬜ pending | `notes/[id].vue` |
| 2 | [동적 import 제거](./task-02-dynamic-import-fix.md) | ⬜ pending | `bookmarks.vue` |
| 3 | [BibleSubpageLayout 적용](./task-03-subpage-layout.md) | ⬜ pending | 서브페이지 전체 |
| 4 | [index.vue 분할](./task-04-index-split.md) | ⬜ pending | `index.vue` |
| 5 | [공통 타입 정의](./task-05-common-types.md) | ⬜ pending | `types/*.ts` |
| 6 | [중복 함수 통합](./task-06-duplicate-functions.md) | ⬜ pending | `index.vue` |

**상태 범례:**
- ⬜ pending: 대기
- 🔄 in-progress: 진행 중
- ✅ completed: 완료

---

## 워크플로우

```
각 태스크:
1. 태스크 문서 확인
2. 코드 변경 수행
3. npm run build 실행
4. localhost:3000 테스트 (Chrome DevTools MCP)
5. 기능 정상 동작 확인
6. 커밋 발행
7. 태스크 상태 업데이트
```

---

## 완료 기준

- [ ] 모든 태스크 ✅ completed
- [ ] 빌드 에러 없음
- [ ] 기존 기능 정상 동작
- [ ] 임시 문서 폴더 삭제

---

## 커밋 히스토리

| 태스크 | 커밋 해시 | 메시지 |
|--------|-----------|--------|
| - | - | - |

---

## 참고

- 원본 리뷰: `docs/bible-pages-review.md`
- 완료 시 이 폴더(`docs/refactor/`) 삭제
