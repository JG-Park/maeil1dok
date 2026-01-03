# Task 6: 마지막 위치 저장/불러오기

> **상태**: ⬜ 대기
> **의존성**: Task 5 완료 필요
> **예상 파일**: composables, BibleReader 수정

---

## 목표

사용자의 마지막 읽기 위치를 서버에 저장하고, 재접속 시 불러오는 기능을 구현한다.

---

## 기능 스펙

### 저장 정보
- 책 코드 (book)
- 장 번호 (chapter)
- 절 번호 (verse) - 선택
- 스크롤 위치 (scroll_position) - 0~1 비율
- 역본 (version)

### 저장 시점
- 장 이동 시
- 스크롤 시 (debounce 3초)
- 역본 변경 시

### 불러오기 시점
- `/bible` 페이지 접속 시
- URL에 book/chapter 파라미터가 없는 경우에만

---

## 수정 파일

| 파일 | 작업 |
|------|------|
| `frontend/app/composables/useBibleReader.ts` | 이미 구현됨 (확인) |
| `frontend/app/components/bible/BibleReader.vue` | 위치 저장/불러오기 연동 |
| `frontend/app/pages/bible/index.vue` | 초기 위치 불러오기 |

---

## 구현 확인 사항

### useBibleReader.ts (Task 3에서 구현)

```typescript
// 이미 구현된 내용 확인
export function useBibleReader() {
  // savePosition - debounce 3초로 서버에 저장
  // loadLastPosition - 서버에서 마지막 위치 불러오기
}
```

### BibleReader.vue 수정

```vue
<script setup>
// 스크롤 이벤트에서 위치 저장
const onScroll = () => {
  if (!contentRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = contentRef.value
  const scrollRatio = scrollTop / (scrollHeight - clientHeight)

  // 위치 저장 (debounce 적용됨)
  savePosition({
    book: currentBook.value,
    chapter: currentChapter.value,
    scrollPosition: scrollRatio,
    version: currentVersion.value,
  })
}

// 장 이동 시 위치 저장
const loadContent = async () => {
  // ... 본문 로드 ...

  // 서버에 위치 저장
  savePosition({
    book: currentBook.value,
    chapter: currentChapter.value,
    version: currentVersion.value,
  })
}
</script>
```

### bible/index.vue 수정

```vue
<script setup>
onMounted(async () => {
  // URL에 book 파라미터가 없으면 마지막 위치 불러오기
  if (authStore.isAuthenticated && !route.query.book) {
    const position = await loadLastPosition()
    if (position) {
      // 마지막 위치로 이동
      bibleStore.setCurrentPosition(position.book, position.chapter)
      bibleStore.setVersion(position.version)

      // BibleReader에 전달할 초기값 설정
      initialBook.value = position.book
      initialChapter.value = position.chapter
    }
  }
})
</script>
```

---

## 테스트 체크리스트

- [ ] 장 이동 시 서버에 위치 저장됨
- [ ] 스크롤 시 위치 저장됨 (3초 debounce)
- [ ] 역본 변경 시 저장됨
- [ ] 재접속 시 마지막 위치 불러옴
- [ ] URL 파라미터가 있으면 불러오기 스킵
- [ ] 비로그인 시 저장/불러오기 스킵

---

## Chrome DevTools 테스트

```
1. 로그인 상태로 /bible 접속
2. 창세기 3장으로 이동
3. Network 탭에서 reading-position POST 확인
4. 페이지 새로고침
5. 창세기 3장으로 자동 이동 확인
6. /bible?book=exo&chapter=1 접속
7. 출애굽기 1장 표시 (불러오기 스킵)
```

---

## 완료 조건

1. 위치 저장이 서버에 정상 반영
2. 재접속 시 마지막 위치로 복원
3. debounce가 정상 동작

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -
