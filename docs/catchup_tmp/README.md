# 따라잡기 기능 구현 - 태스크 추적

> 시작일: 2026-01-03
> 상태: 진행 중

## 개요

성경통독 플랜 따라잡기 기능 구현을 위한 태스크 추적 문서입니다.
설계 문서: [`docs/catchup-feature-design.md`](../catchup-feature-design.md)

---

## 태스크 현황

| ID | 태스크 | 상태 | 커밋 |
|----|--------|------|------|
| T001 | [백엔드 모델 생성](./tasks/T001-models.md) | `pending` | - |
| T002 | [밀린 현황 조회 API](./tasks/T002-status-api.md) | `pending` | - |
| T003 | [따라잡기 미리보기 API](./tasks/T003-preview-api.md) | `pending` | - |
| T004 | [따라잡기 세션 생성 API](./tasks/T004-create-api.md) | `pending` | - |
| T005 | [스케줄 완료 처리 API](./tasks/T005-complete-api.md) | `pending` | - |
| T006 | [프론트엔드 설정 모달](./tasks/T006-settings-modal.md) | `pending` | - |
| T007 | [미리보기 화면](./tasks/T007-preview-ui.md) | `pending` | - |
| T008 | [진행 중 표시 UI](./tasks/T008-progress-ui.md) | `pending` | - |
| T009 | [완료 축하 화면](./tasks/T009-celebration-ui.md) | `pending` | - |

---

## 진행 규칙

1. 각 태스크 순서대로 진행
2. 태스크 완료 후:
   - 빌드 테스트 실행
   - localhost:3000에서 기능 테스트
   - 계약대로 동작 확인
   - 커밋 발행
   - 태스크 문서 상태 업데이트
3. 마지막 태스크 완료 시:
   - 이 임시 폴더 삭제
   - 설계 문서만 유지

---

## 의존성

```
T001 (모델)
  ├── T002 (현황 API)
  ├── T003 (미리보기 API)
  ├── T004 (생성 API)
  │     └── T005 (완료 API)
  └────────────────────────┐
                           ▼
                    T006 (설정 모달)
                      └── T007 (미리보기 UI)
                            └── T008 (진행 UI)
                                  └── T009 (축하 화면)
```

---

## 완료 로그

| 날짜 | 태스크 | 비고 |
|------|--------|------|
| - | - | - |
