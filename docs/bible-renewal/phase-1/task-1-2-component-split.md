# Task 1-2: reading.vue 컴포넌트 분리

> **Phase**: 1 - 기반 작업
> **상태**: ⬜ 대기
> **예상 작업**: 76,000토큰 규모의 reading.vue를 재사용 가능한 컴포넌트로 분리

---

## 목표

- 기존 `reading.vue`의 핵심 로직을 재사용 가능한 컴포넌트로 추출
- 컴포넌트/composable 기반 아키텍처로 전환
- 기존 기능 100% 유지

---

## 서브태스크

### 1.2.1 Composables 추출
- [ ] `composables/useBibleData.ts` - 성경 책/장 데이터, 역본 정보
- [ ] `composables/useBibleContent.ts` - 성경 본문 fetch 로직
- [ ] `composables/useBibleNavigation.ts` - 책/장 이동 로직
- [ ] `composables/useReadingPosition.ts` - 마지막 읽기 위치 저장/복원
- [ ] `composables/useBookmark.ts` - 북마크 CRUD
- [ ] `composables/useNote.ts` - 묵상노트 CRUD
- [ ] `composables/useTongdokMode.ts` - 통독모드 상태 관리

### 1.2.2 UI 컴포넌트 추출
- [ ] `components/bible/BibleHeader.vue` - 상단 헤더 (책/장 선택, 역본)
- [ ] `components/bible/BibleContent.vue` - 성경 본문 표시
- [ ] `components/bible/BibleNavigation.vue` - 하단 네비게이션 (이전/다음)
- [ ] `components/bible/BookSelector.vue` - 책 선택 모달
- [ ] `components/bible/ChapterSelector.vue` - 장 선택 UI
- [ ] `components/bible/VersionSelector.vue` - 역본 선택 모달
- [ ] `components/bible/AudioButton.vue` - 오디오(YouTube) 링크 버튼

### 1.2.3 기존 reading.vue에서 분리된 컴포넌트 사용 확인
- [ ] 분리된 컴포넌트들을 기존 reading.vue에서 import하여 동작 확인
- [ ] 기존 기능 모두 정상 동작 확인

---

## 구현 상세

### useBibleData.ts 구조

```typescript
// composables/useBibleData.ts
export const useBibleData = () => {
  const bibleBooks = {
    old: [...],
    new: [...]
  };

  const bookNames: Record<string, string> = {};
  const bookChapters: Record<string, number> = {};

  const versionNames = {
    KNT: "새한글",
    GAE: "개역개정",
    // ...
  };

  const getBookName = (bookId: string) => bookNames[bookId] || bookId;
  const getChapterCount = (bookId: string) => bookChapters[bookId] || 1;

  return {
    bibleBooks,
    bookNames,
    bookChapters,
    versionNames,
    getBookName,
    getChapterCount
  };
};
```

### BibleHeader.vue 구조

```vue
<template>
  <div class="bible-header">
    <button class="back-button" @click="$emit('back')">
      <!-- back icon -->
    </button>

    <button class="book-chapter-btn" @click="$emit('openBookSelector')">
      {{ bookName }} {{ chapter }}장
    </button>

    <button class="version-btn" @click="$emit('openVersionSelector')">
      {{ versionName }}
    </button>

    <slot name="actions" />
  </div>
</template>

<script setup>
defineProps<{
  bookName: string;
  chapter: number;
  versionName: string;
}>();

defineEmits(['back', 'openBookSelector', 'openVersionSelector']);
</script>
```

---

## 파일 매핑

| 기존 reading.vue 위치 | 분리 대상 |
|----------------------|----------|
| line 1-200 (상태/데이터) | `useBibleData.ts`, `useBibleContent.ts` |
| line 200-500 (함수) | 각 composable로 분산 |
| line 2800-3000 (헤더 템플릿) | `BibleHeader.vue` |
| line 3000-3100 (네비게이션) | `BibleNavigation.vue` |
| line 3100-3500 (본문) | `BibleContent.vue` |
| line 3500-4000 (모달들) | 각 모달 컴포넌트 |

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)
- [ ] 기존 `/reading` 페이지 접속 (리다이렉트 후 `/bible`)
- [ ] 책 선택 모달 동작
- [ ] 장 이동 (이전/다음) 동작
- [ ] 역본 변경 동작
- [ ] 성경 본문 정상 표시
- [ ] 오디오 링크 동작
- [ ] 스크롤 동작
- [ ] 반응형 레이아웃

---

## 완료 기준

1. 모든 composable 생성 완료
2. 모든 컴포넌트 생성 완료
3. 기존 reading.vue 기능 100% 유지
4. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
