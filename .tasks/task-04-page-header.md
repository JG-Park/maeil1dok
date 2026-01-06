# Task 04: 공통 헤더 컴포넌트

## Goal
- 반복되는 페이지 헤더를 재사용 가능한 컴포넌트로 추출

## Current Pattern
```vue
<div class="header fade-in">
  <button class="back-button" @click="$router.push('/')">
    <BackIcon />
  </button>
  <h1>페이지 제목</h1>
  <div class="right-slot">...</div>
</div>
```

## Component Design

### Props
- `title: string` - 페이지 제목
- `backPath: string` - 뒤로가기 경로 (default: '/')
- `showBack: boolean` - 뒤로가기 버튼 표시 여부 (default: true)

### Slots
- `right` - 오른쪽 영역 (버튼 등)

### Usage
```vue
<PageHeader title="성경통독표">
  <template #right>
    <button @click="toggleEdit">일괄수정</button>
  </template>
</PageHeader>
```

## Changes Required

### 1. 컴포넌트 생성
- `components/PageHeader.vue`

### 2. 기존 헤더 교체
- `plan/index.vue`
- `plans/index.vue`

## Status
- [ ] PageHeader.vue 생성
- [ ] plan/index.vue 적용
- [ ] plans/index.vue 적용

## Commit Message
```
refactor(components): extract PageHeader component
```
