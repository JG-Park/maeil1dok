# TASK-09: 로딩/빈 상태 컴포넌트 통일

> **Priority**: P2 (Minor)
> **Status**: `[x]` Completed
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

로딩 상태와 빈 상태 UI가 파일마다 다릅니다.

### 로딩 상태 불일치

#### `history.vue`
```html
<div v-if="isLoading" class="loading">
  <svg class="spinner" ...>...</svg>
</div>
```

#### `notes/index.vue`
```html
<div v-if="isLoading" class="loading-state">
  <div class="loading-spinner"></div>
  <p>묵상노트를 불러오는 중...</p>
</div>
```

#### `BibleViewer.vue`
```html
<div v-if="isLoading" class="loading-container">
  <div class="loading-spinner"></div>
  <p>성경을 불러오는 중...</p>
</div>
```

### 빈 상태 불일치

- `bookmarks.vue`: `BibleSubpageLayout` 슬롯 사용
- `notes/index.vue`: 직접 `.empty-state` 구현
- `history.vue`: 빈 상태 처리 없음 (빈 그리드만 표시)

---

## Goal

로딩/빈 상태를 위한 공통 컴포넌트 생성 및 통일

---

## Tasks

### 1. 공통 컴포넌트 생성

- [x] `components/ui/LoadingSpinner.vue` 생성
- [x] `components/ui/EmptyState.vue` 생성

### 2. 각 파일에서 공통 컴포넌트 사용

- [x] `pages/bible/history.vue`
- [x] `pages/bible/notes/index.vue`
- [x] `pages/bible/notes/[id].vue`
- [x] `components/bible/BibleViewer.vue`
- [x] `components/bible/BibleSubpageLayout.vue` (내부 개선)
- [x] `pages/bible/highlights/index.vue` (추가)

### 3. BibleSubpageLayout 개선

- [x] 더 많은 페이지에서 활용 가능하도록 유연성 강화
- [-] `history.vue`, `settings.vue`에서 활용 (history는 직접 컴포넌트 사용)

---

## Proposed Components

### LoadingSpinner.vue

```vue
<template>
  <div class="loading-container" :class="{ inline }">
    <div class="spinner" :style="{ width: `${size}px`, height: `${size}px` }"></div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number;
  text?: string;
  inline?: boolean;
}>(), {
  size: 32,
  text: '',
  inline: false,
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.loading-container:not(.inline) {
  min-height: 200px;
}

.spinner {
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

### EmptyState.vue

```vue
<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 15h8M9 9h.01M15 9h.01"/>
        </svg>
      </slot>
    </div>
    <p class="empty-text">{{ text }}</p>
    <span v-if="hint" class="empty-hint">{{ hint }}</span>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  hint?: string;
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.8125rem;
  opacity: 0.7;
}

.empty-action {
  margin-top: 1rem;
}
</style>
```

---

## Usage Examples

```vue
<!-- history.vue -->
<LoadingSpinner v-if="isLoading" text="읽기 기록을 불러오는 중..." />

<EmptyState
  v-else-if="!hasData"
  text="읽기 기록이 없습니다"
  hint="성경을 읽으면 자동으로 기록됩니다"
/>

<!-- notes/index.vue -->
<LoadingSpinner v-if="isLoading" text="묵상노트를 불러오는 중..." />

<EmptyState
  v-else-if="filteredNotes.length === 0"
  :text="filterBook ? '해당 책에 작성된 묵상노트가 없습니다' : '작성된 묵상노트가 없습니다'"
  hint="성경을 읽으며 묵상을 기록해보세요"
>
  <template #icon>
    <DocumentIcon :size="48" />
  </template>
</EmptyState>
```

---

## Files Affected

| File | Action |
|------|--------|
| `components/ui/LoadingSpinner.vue` | Create |
| `components/ui/EmptyState.vue` | Create |
| `pages/bible/history.vue` | Modify |
| `pages/bible/notes/index.vue` | Modify |
| `pages/bible/notes/[id].vue` | Modify |
| `components/bible/BibleViewer.vue` | Modify |
| `components/bible/BibleSubpageLayout.vue` | Modify |

---

## Acceptance Criteria

- [x] 공통 컴포넌트 생성됨
- [x] 모든 파일에서 일관된 로딩/빈 상태 UI
- [x] 기존 기능 정상 동작
- [x] 다크모드 정상 동작

---

## Dependencies

- T04 (CSS 공통화) - 함께 진행 권장

## Dependent Tasks

- 없음

---

## Completion

- [x] 코드 변경 완료
- [x] 테스트 통과 (빌드 성공)
- [x] 커밋 발행
- [x] TRACKER.md 상태 업데이트
