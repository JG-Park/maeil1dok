# Task 07: plans/index.vue 정리

## Goal
- 코드 품질 개선
- 중복 제거
- 에러 핸들링 개선

## Issues

### 1. 빈 catch 블록 (line 359-360)
```javascript
} catch (error) {
}  // 에러 무시
```

### 2. 중복 조건 체크 (line 23, 30)
```vue
<div v-else-if="!authStore.isAuthenticated" ...>
<div v-else-if="authStore.isAuthenticated" ...>
```
→ 두 번째는 `v-else`로 충분

### 3. 하드코딩된 색상
```css
background: white;  /* var(--color-bg-card) 사용해야 함 */
```

## Changes Required

### 1. 에러 핸들링 추가
```javascript
} catch (error) {
  console.error('Failed to initialize:', error);
}
```

### 2. 조건부 렌더링 단순화
```vue
<div v-else class="content-section ...">
```

### 3. CSS 변수 사용
```css
background: var(--color-bg-card);
```

## Status
- [ ] 에러 핸들링 추가
- [ ] v-else-if → v-else 변경
- [ ] 하드코딩 색상 변수화

## Commit Message
```
refactor(plans): improve code quality and error handling
```
