# TASK-03: SVG 아이콘 컴포넌트화

> **Priority**: P1 (Major)
> **Status**: `[ ]` Pending
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

인라인 SVG가 여러 파일에 중복으로 존재합니다.

### 현재 상태

- `index.vue`: 아이콘 컴포넌트 사용 (`ChevronLeftIcon.vue` 등)
- `BibleHome.vue`: 인라인 SVG (20줄짜리 설정 아이콘 등)
- `history.vue`: 인라인 SVG
- `settings.vue`: 인라인 SVG
- `notes/*.vue`: 인라인 SVG
- `bookmarks.vue`: 인라인 SVG

### 문제점

1. 같은 아이콘이 여러 파일에 복사됨
2. 아이콘 수정 시 모든 파일 수정 필요
3. 파일 크기 불필요하게 증가
4. 일관성 없는 아이콘 사용 패턴

---

## Goal

모든 SVG 아이콘을 컴포넌트로 통일

---

## Tasks

### 1. 누락된 아이콘 컴포넌트 생성

현재 `components/icons/`에 없는 아이콘:

- [ ] `SettingsIcon.vue` (톱니바퀴)
- [ ] `BookIcon.vue` (책)
- [ ] `StarIcon.vue` (별)
- [ ] `TrashIcon.vue` (휴지통)
- [ ] `LockIcon.vue` (자물쇠)
- [ ] `ArrowRightIcon.vue` (오른쪽 화살표)
- [ ] `ListIcon.vue` (목록)
- [ ] `EyeIcon.vue` (눈)
- [ ] `DocumentIcon.vue` (문서)
- [ ] `LayersIcon.vue` (레이어)
- [ ] `RefreshIcon.vue` (새로고침)
- [ ] `WarningIcon.vue` (경고)

### 2. 파일별 인라인 SVG 교체

- [ ] `BibleHome.vue` - 인라인 SVG → 아이콘 컴포넌트
- [ ] `history.vue` - 인라인 SVG → 아이콘 컴포넌트
- [ ] `settings.vue` - 인라인 SVG → 아이콘 컴포넌트
- [ ] `notes/index.vue` - 인라인 SVG → 아이콘 컴포넌트
- [ ] `notes/[id].vue` - 인라인 SVG → 아이콘 컴포넌트
- [ ] `bookmarks.vue` - 인라인 SVG → 아이콘 컴포넌트
- [ ] `BibleViewer.vue` - 인라인 SVG → 아이콘 컴포넌트
- [ ] `BookSelector.vue` - 인라인 SVG → 아이콘 컴포넌트

### 3. 아이콘 컴포넌트 표준화

- [ ] 모든 아이콘에 `size` prop 추가 (기본값: 20)
- [ ] 모든 아이콘에 `color` prop 추가 (기본값: currentColor)

---

## Icon Component Template

```vue
<!-- components/icons/SettingsIcon.vue -->
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l..." />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number;
  color?: string;
}>(), {
  size: 20,
  color: 'currentColor',
});
</script>
```

---

## Files Affected

| File | Action |
|------|--------|
| `components/icons/*.vue` | Create (다수) |
| `BibleHome.vue` | Modify |
| `history.vue` | Modify |
| `settings.vue` | Modify |
| `notes/index.vue` | Modify |
| `notes/[id].vue` | Modify |
| `bookmarks.vue` | Modify |
| `BibleViewer.vue` | Modify |
| `BookSelector.vue` | Modify |

---

## Acceptance Criteria

- [ ] 모든 인라인 SVG가 컴포넌트로 대체됨
- [ ] 아이콘 컴포넌트가 일관된 API 제공
- [ ] 기존 UI 동일하게 렌더링
- [ ] 빌드 에러 없음

---

## Dependencies

- 없음

## Dependent Tasks

- 없음

---

## Completion

- [ ] 코드 변경 완료
- [ ] 테스트 통과
- [ ] 커밋 발행
- [ ] TRACKER.md 상태 업데이트
