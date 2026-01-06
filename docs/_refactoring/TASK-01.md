# TASK-01: index.vue 분해 (모놀리스 해체)

> **Priority**: P0 (Critical)
> **Status**: `[x]` Completed
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

`/frontend/app/pages/bible/index.vue`가 **1,283줄**로 거대한 모놀리스입니다.

- 템플릿: ~200줄
- 스크립트: ~600줄
- 스타일: ~400줄
- 13개 composable import
- 13개 컴포넌트 import
- 4개의 다른 뷰 모드가 한 파일에 혼재 (home, toc, reader, tongdok)

---

## Goal

`index.vue`를 논리적 단위로 분해하여 각 뷰 모드별 컴포넌트 분리

---

## Tasks

### 1. 뷰 컴포넌트 분리

- [x] `BibleReaderView.vue` 생성 - reader 모드 전용
- [x] `index.vue`는 라우터/뷰 전환만 담당하도록 축소

### 2. 통독 모드 로직 분리

- [x] 통독 관련 상태/핸들러는 이미 `useTongdokMode.ts`에 분리되어 있음
- [-] `useTongdokReader.ts` 추가 분리 - 불필요 (기존 구조 유지)

### 3. 이벤트 핸들러 정리

- [-] 중복 핸들러 통합 - T02에서 진행
- [-] 핸들러 네이밍 일관성 확보 - T02에서 진행

---

## Files Affected

| File | Action | Result |
|------|--------|--------|
| `pages/bible/index.vue` | Modify (축소) | 1,283줄 → 784줄 (39% 감소) |
| `components/bible/BibleReaderView.vue` | Create | 635줄 (새 컴포넌트) |

---

## Acceptance Criteria

- [x] `index.vue` 축소 (1,283줄 → 784줄, 39% 감소)
- [x] `BibleReaderView.vue`가 reader 모드 전담
- [x] 기존 기능 모두 정상 동작
- [x] 빌드 에러 없음

---

## Dependencies

- 없음 (첫 번째 태스크)

## Dependent Tasks

- T02 (공통 로직 추출) - T01 완료 후 진행 권장

---

## Completion

- [x] 코드 변경 완료
- [x] 테스트 통과
- [x] 커밋 발행
- [x] TRACKER.md 상태 업데이트
