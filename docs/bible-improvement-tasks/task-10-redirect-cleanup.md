# Task 10: URL 리다이렉트 및 정리

> **상태**: ⬜ 대기
> **의존성**: Task 9 완료 필요
> **최종 태스크**

---

## 목표

기존 URL에서 새 URL로 리다이렉트를 설정하고, 임시 문서를 정리한다.

---

## 작업 내용

### 1. URL 리다이렉트 설정

| 기존 URL | 새 URL | 상태 코드 |
|---------|--------|----------|
| `/reading` | `/bible` | 301 |
| `/reading-plan` | `/bible/plan` | 301 |

### 2. 기존 파일 정리

- `reading.vue` → 리다이렉트 전용으로 변경
- `reading-plan.vue` → 리다이렉트 전용으로 변경

### 3. 임시 문서 삭제

- `docs/bible-improvement-tasks/` 폴더 전체 삭제

---

## 수정/생성 파일

| 파일 | 작업 |
|------|------|
| `frontend/app/middleware/redirect.global.ts` | 리다이렉트 미들웨어 생성 |
| `frontend/app/pages/reading.vue` | 리다이렉트로 변경 (또는 삭제) |
| `frontend/app/pages/reading-plan.vue` | 리다이렉트로 변경 (또는 삭제) |

---

## 구현 상세

### redirect.global.ts

```typescript
// frontend/app/middleware/redirect.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // /reading -> /bible 리다이렉트
  if (to.path === '/reading') {
    return navigateTo(
      {
        path: '/bible',
        query: to.query,
      },
      { redirectCode: 301 }
    )
  }

  // /reading-plan -> /bible/plan 리다이렉트
  if (to.path === '/reading-plan') {
    return navigateTo(
      {
        path: '/bible/plan',
        query: to.query,
      },
      { redirectCode: 301 }
    )
  }
})
```

### reading.vue (옵션 1: 리다이렉트 전용)

```vue
<!-- frontend/app/pages/reading.vue -->
<template>
  <div>리다이렉트 중...</div>
</template>

<script setup lang="ts">
// 미들웨어에서 처리하므로 이 페이지는 실행되지 않음
// 혹시 미들웨어가 실패할 경우를 대비한 fallback
const route = useRoute()

onMounted(() => {
  navigateTo({
    path: '/bible',
    query: route.query,
  })
})
</script>
```

### reading.vue (옵션 2: 삭제)

파일 삭제 후 미들웨어에서만 처리

---

## 테스트 체크리스트

- [ ] `/reading` 접속 시 `/bible`로 리다이렉트
- [ ] `/reading?plan=1` 접속 시 `/bible?plan=1`로 리다이렉트
- [ ] `/reading-plan` 접속 시 `/bible/plan`으로 리다이렉트
- [ ] 301 상태 코드 반환 확인
- [ ] 기존 북마크/링크 정상 동작
- [ ] SEO 영향 없음 (301은 검색엔진에 영구 이동 알림)

---

## Chrome DevTools 테스트

```
1. Network 탭 열기
2. localhost:3000/reading 접속
3. 301 리다이렉트 확인
4. /bible 페이지로 이동 확인
5. Query 파라미터 유지 확인
```

---

## 마무리 작업

### 임시 문서 삭제

```bash
rm -rf docs/bible-improvement-tasks/
```

### 최종 확인

- [ ] 모든 기능 정상 동작
- [ ] 빌드 성공
- [ ] 개발 서버 테스트 완료
- [ ] 커밋 완료

---

## 완료 조건

1. 리다이렉트 정상 동작
2. 기존 URL 사용자 영향 없음
3. 임시 문서 삭제 완료
4. **전체 프로젝트 완료**

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -

---

## 프로젝트 완료 체크리스트

모든 태스크가 완료되었는지 최종 확인:

- [ ] Task 1: Backend 모델 추가
- [ ] Task 2: Backend API 구현
- [ ] Task 3: Frontend 기반 구조
- [ ] Task 4: BibleReader 컴포넌트 추출
- [ ] Task 5: 탭 UI 및 통독모드
- [ ] Task 6: 마지막 위치 저장
- [ ] Task 7: 북마크 기능
- [ ] Task 8: 묵상노트 기능
- [ ] Task 9: 개인 읽기 기록
- [ ] Task 10: URL 리다이렉트 및 정리

**전체 커밋 목록:**
| 태스크 | 커밋 해시 | 메시지 |
|--------|----------|--------|
| 1 | - | - |
| 2 | - | - |
| 3 | - | - |
| 4 | - | - |
| 5 | - | - |
| 6 | - | - |
| 7 | - | - |
| 8 | - | - |
| 9 | - | - |
| 10 | - | - |
