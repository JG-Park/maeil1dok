# Task 03: SVG 아이콘 컴포넌트화

## Goal
- 반복되는 인라인 SVG를 재사용 가능한 컴포넌트로 추출

## Icons to Extract

### 1. BackIcon (뒤로가기 화살표)
```html
<svg width="20" height="20" viewBox="0 0 24 24">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" .../>
</svg>
```
사용처: `plan/index.vue`, `plans/index.vue`

### 2. CloseIcon (X 버튼)
```html
<svg width="20" height="20" viewBox="0 0 24 24">
  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" .../>
</svg>
```
사용처: `plans/index.vue` (모달 2곳)

### 3. ChevronDownIcon (드롭다운 화살표)
```html
<svg width="16" height="16" viewBox="0 0 24 24">
  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" .../>
</svg>
```
사용처: `BibleScheduleContent.vue`

## Changes Required

### 1. 아이콘 컴포넌트 생성
- `components/icons/BackIcon.vue`
- `components/icons/CloseIcon.vue`

### 2. 기존 인라인 SVG 교체

## Status
- [ ] BackIcon.vue 생성
- [ ] CloseIcon.vue 생성
- [ ] 인라인 SVG 교체

## Commit Message
```
refactor(components): extract inline SVGs to icon components
```
