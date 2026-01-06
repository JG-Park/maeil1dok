# Task 01: 라우팅 통합

## Goal
- `/reading-plan` → `/plan`으로 리다이렉트
- `/plans/index.vue`에서 `/plan`으로 라우팅 변경
- `reading-plan.vue` 파일을 리다이렉트 전용으로 변환

## Changes Required

### 1. `pages/reading-plan.vue`
- 기존 내용 삭제
- `/plan`으로 리다이렉트하는 코드로 교체

### 2. `pages/plans/index.vue`
- Line 330: `path: '/reading-plan'` → `path: '/plan'`

### 3. 다른 파일에서 `/reading-plan` 참조 확인
- 홈페이지 등에서 `/reading-plan` 링크 검색 및 변경

## Status
- [ ] reading-plan.vue 리다이렉트로 변환
- [ ] plans/index.vue 라우팅 변경
- [ ] 기타 파일 참조 변경
- [ ] 테스트

## Commit Message
```
refactor(routes): redirect /reading-plan to /plan
```
