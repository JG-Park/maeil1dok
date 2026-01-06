# Task 01: 메모리 누수 수정

> 상태: ⬜ pending  
> 우선순위: 긴급  
> 예상 소요: 10분

---

## 목표

`notes/[id].vue`에서 자동저장 타이머의 cleanup 누락으로 인한 메모리 누수 수정

---

## 대상 파일

- `frontend/app/pages/bible/notes/[id].vue`

---

## 문제 코드

```typescript
// 라인 172-179
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
watch([editContent, isPrivate], () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  if (hasChanges.value && !isSaving.value) {
    saveTimeout = setTimeout(async () => {
      await handleSave();
    }, 3000);
  }
});
// ⚠️ onBeforeUnmount에서 clearTimeout 누락
```

---

## 변경 사항

### 1. onBeforeUnmount 추가

```typescript
onBeforeUnmount(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
});
```

---

## 테스트 방법

1. `npm run build` - 빌드 성공 확인
2. 개발 서버 실행: `npm run dev`
3. Chrome DevTools MCP로 테스트:
   - `/bible/notes/[id]` 페이지 접속
   - 노트 내용 수정 (자동저장 트리거)
   - 3초 내에 다른 페이지로 이동
   - 콘솔에 에러 없음 확인
   - 메모리 프로파일러에서 누수 없음 확인

---

## 완료 체크리스트

- [ ] 코드 변경 완료
- [ ] 빌드 성공
- [ ] 테스트 통과
- [ ] 커밋 발행

---

## 커밋 메시지 템플릿

```
fix(bible): add cleanup for autosave timer in note detail

- Add onBeforeUnmount to clear saveTimeout
- Prevents memory leak when navigating away during autosave delay
```

---

← [트래커로 돌아가기](./_index.md)
