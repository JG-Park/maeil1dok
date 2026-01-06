# Task 02: CSS 변수 글로벌화

## Goal
- scoped 스타일 내 `:root` 변수 정의 제거
- 글로벌 CSS 파일로 통합

## Problem
현재 여러 파일에서 `:root` 변수를 scoped 스타일 내에 중복 정의:
- `reading-plan.vue:178-185` (리다이렉트로 변경 후 해당 없음)
- `plans/index.vue:615-621`

## Changes Required

### 1. 글로벌 CSS 확인
- `assets/css/` 또는 `app.vue`에서 기존 글로벌 변수 확인

### 2. 변수 통합
- 모든 페이지에서 사용하는 공통 변수를 글로벌로 이동

### 3. scoped 내 `:root` 제거
- `plans/index.vue`에서 `:root` 블록 삭제

## Status
- [ ] 글로벌 CSS 파일 확인
- [ ] 변수 통합
- [ ] scoped 내 :root 제거

## Commit Message
```
refactor(styles): move CSS variables to global scope
```
