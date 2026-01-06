# Task 1-1: 라우트 구조 및 리다이렉트

> **Phase**: 1 - 기반 작업
> **상태**: ⬜ 대기
> **예상 작업**: 라우트 파일 생성 + 리다이렉트 미들웨어

---

## 목표

- 새로운 `/bible`, `/plan` 라우트 구조 설정
- 기존 `/reading`, `/reading-plan` URL 호환성을 위한 리다이렉트

---

## 서브태스크

### 1.1.1 페이지 파일 구조 생성
- [ ] `frontend/app/pages/bible/index.vue` 생성 (빈 템플릿)
- [ ] `frontend/app/pages/bible/bookmarks.vue` 생성 (빈 템플릿)
- [ ] `frontend/app/pages/bible/notes/index.vue` 생성 (빈 템플릿)
- [ ] `frontend/app/pages/bible/notes/[id].vue` 생성 (빈 템플릿)
- [ ] `frontend/app/pages/bible/highlights.vue` 생성 (빈 템플릿)
- [ ] `frontend/app/pages/bible/history.vue` 생성 (빈 템플릿)
- [ ] `frontend/app/pages/bible/settings.vue` 생성 (빈 템플릿)
- [ ] `frontend/app/pages/plan/index.vue` 생성 (빈 템플릿)

### 1.1.2 리다이렉트 미들웨어 구현
- [ ] `frontend/server/middleware/legacy-routes.ts` 생성
- [ ] `/reading` → `/bible` 리다이렉트 (쿼리 파라미터 유지)
- [ ] `/reading-plan` → `/plan` 리다이렉트

### 1.1.3 기존 페이지 리다이렉트 처리
- [ ] `frontend/app/pages/reading.vue` → 리다이렉트 전용으로 변경
- [ ] `frontend/app/pages/reading-plan.vue` → 리다이렉트 전용으로 변경

---

## 구현 상세

### 빈 템플릿 예시

```vue
<template>
  <div class="container">
    <h1>페이지 준비 중</h1>
    <p>이 페이지는 곧 구현됩니다.</p>
  </div>
</template>

<script setup>
// Task X-X에서 구현 예정
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
</style>
```

### 리다이렉트 미들웨어

```typescript
// frontend/server/middleware/legacy-routes.ts
export default defineEventHandler((event) => {
  const url = getRequestURL(event);

  // /reading → /bible
  if (url.pathname === '/reading') {
    const params = url.searchParams.toString();
    const redirectUrl = params ? `/bible?${params}` : '/bible';
    return sendRedirect(event, redirectUrl, 301);
  }

  // /reading-plan → /plan
  if (url.pathname === '/reading-plan') {
    return sendRedirect(event, '/plan', 301);
  }
});
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)
- [ ] `/bible` 접속 시 빈 페이지 정상 표시
- [ ] `/bible/bookmarks` 접속 시 빈 페이지 정상 표시
- [ ] `/bible/notes` 접속 시 빈 페이지 정상 표시
- [ ] `/bible/highlights` 접속 시 빈 페이지 정상 표시
- [ ] `/bible/history` 접속 시 빈 페이지 정상 표시
- [ ] `/bible/settings` 접속 시 빈 페이지 정상 표시
- [ ] `/plan` 접속 시 빈 페이지 정상 표시
- [ ] `/reading` 접속 시 `/bible`로 리다이렉트
- [ ] `/reading?book=gen&chapter=1` 접속 시 `/bible?book=gen&chapter=1`로 리다이렉트
- [ ] `/reading?book=gen&chapter=1&plan=1` 접속 시 `/bible?book=gen&chapter=1&plan=1`로 리다이렉트
- [ ] `/reading-plan` 접속 시 `/plan`으로 리다이렉트

---

## 완료 기준

1. 모든 새 라우트 접근 가능
2. 기존 URL 리다이렉트 정상 동작
3. 쿼리 파라미터 유지됨
4. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
