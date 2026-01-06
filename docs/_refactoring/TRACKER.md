# Bible Page Refactoring Tracker

> 임시 문서: 모든 태스크 완료 후 이 폴더(`docs/_refactoring/`)는 삭제됩니다.

## Overview

- **생성일**: 2026-01-06
- **대상**: `/bible` 페이지 및 서브페이지
- **목표**: 코드 품질, 유지보수성, 성능, UX 개선

---

## Task Status

| ID | Task | Priority | Status | Document |
|----|------|----------|--------|----------|
| T01 | index.vue 분해 (모놀리스 해체) | P0 | `[x]` Completed | [TASK-01.md](./TASK-01.md) |
| T02 | 공통 로직 추출 (DRY 원칙) | P0 | `[x]` Completed | [TASK-02.md](./TASK-02.md) |
| T03 | SVG 아이콘 컴포넌트화 | P1 | `[x]` Completed | [TASK-03.md](./TASK-03.md) |
| T04 | CSS 공통화 및 중복 제거 | P1 | `[x]` Completed | [TASK-04.md](./TASK-04.md) |
| T05 | 타입 정의 중앙화 | P1 | `[x]` Completed | [TASK-05.md](./TASK-05.md) |
| T06 | BibleViewer 선택 시스템 통합 | P1 | `[x]` Completed | [TASK-06.md](./TASK-06.md) |
| T07 | API 호출 최적화 | P2 | `[ ]` Pending | [TASK-07.md](./TASK-07.md) |
| T08 | 에러 핸들링 표준화 | P2 | `[ ]` Pending | [TASK-08.md](./TASK-08.md) |
| T09 | 로딩/빈 상태 컴포넌트 통일 | P2 | `[ ]` Pending | [TASK-09.md](./TASK-09.md) |
| T10 | 기타 개선 (confirm, magic numbers 등) | P3 | `[ ]` Pending | [TASK-10.md](./TASK-10.md) |

---

## Priority Legend

- **P0**: Critical - 반드시 먼저 해결
- **P1**: Major - 중요, P0 완료 후 진행
- **P2**: Minor - 개선 권장
- **P3**: Nice-to-have - 시간 여유 시 진행

## Status Legend

- `[ ]` Pending - 미시작
- `[~]` In Progress - 진행 중
- `[x]` Completed - 완료
- `[-]` Skipped - 건너뜀

---

## Commit History

| Task ID | Commit Hash | Date | Message |
|---------|-------------|------|---------|
| T01 | 9142834 | 2026-01-06 | refactor(bible): extract BibleReaderView component from index.vue |
| T02 | d306c6e | 2026-01-06 | refactor(bible): extract common logic into helper functions (DRY) |
| T03 | 866c9d0 | 2026-01-06 | refactor(bible): extract inline SVG icons to reusable components |
| T04 | 2af35fe | 2026-01-06 | refactor(bible): consolidate duplicated CSS into global stylesheet |
| T05 | f19d8f6 | 2026-01-06 | refactor(bible): centralize type definitions into types/bible.ts |
| T06 | ab6a76f | 2026-01-06 | refactor(bible): integrate BibleViewer selection systems with conflict prevention |

---

## Notes

- 각 태스크 완료 시 커밋 발행
- 마지막 태스크 완료 후 이 폴더 전체 삭제
- 의존성이 있는 태스크는 순서대로 진행 (T01 → T02 순)
