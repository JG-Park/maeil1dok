# Task 1-3: /bible 페이지 기본 구조

> **Phase**: 1 - 기반 작업
> **상태**: ⬜ 대기
> **예상 작업**: 분리된 컴포넌트를 조합하여 /bible 페이지 구축

---

## 목표

- Task 1-2에서 분리한 컴포넌트를 사용하여 `/bible/index.vue` 구현
- 기존 reading.vue와 동일한 기능 제공
- 쿼리 파라미터 처리 (book, chapter, plan, schedule)

---

## 서브태스크

### 1.3.1 /bible/index.vue 기본 구조
- [ ] 페이지 레이아웃 구성
- [ ] 분리된 컴포넌트 조합 (Header, Content, Navigation)
- [ ] 쿼리 파라미터 파싱 및 초기 상태 설정

### 1.3.2 쿼리 파라미터 처리
- [ ] `book` - 성경책 코드 (기본: gen)
- [ ] `chapter` - 장 번호 (기본: 1)
- [ ] `plan` - 플랜 ID (있으면 통독모드)
- [ ] `schedule` - 일정 ID (통독모드 시)

### 1.3.3 모드 구분 로직
- [ ] `plan` 파라미터 유무로 읽기모드/통독모드 구분
- [ ] 모드별 UI 차이 준비 (Phase 2에서 상세 구현)

### 1.3.4 /plan/index.vue 기본 구조
- [ ] 기존 reading-plan.vue 내용 이관
- [ ] 통독모드 진입 링크를 `/bible?plan=x&schedule=y`로 변경

---

## 구현 상세

### /bible/index.vue 구조

```vue
<template>
  <div class="bible-page">
    <BibleHeader
      :book-name="currentBookName"
      :chapter="currentChapter"
      :version-name="currentVersionName"
      @back="goBack"
      @open-book-selector="showBookSelector = true"
      @open-version-selector="showVersionSelector = true"
    >
      <template #actions>
        <!-- 북마크, 노트 버튼 등 (Phase 3에서 구현) -->
      </template>
    </BibleHeader>

    <BibleContent
      :content="bibleContent"
      :is-loading="isLoading"
      :font-size="fontSize"
    />

    <BibleNavigation
      :book="currentBook"
      :chapter="currentChapter"
      :has-prev="hasPrevChapter"
      :has-next="hasNextChapter"
      @prev="goToPrevChapter"
      @next="goToNextChapter"
    >
      <template #tongdok v-if="isTongdokMode">
        <!-- 통독모드 인디케이터 (Phase 2에서 구현) -->
      </template>
    </BibleNavigation>

    <!-- 모달들 -->
    <BookSelector v-model="showBookSelector" @select="handleBookSelect" />
    <VersionSelector v-model="showVersionSelector" @select="handleVersionSelect" />
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useBibleData } from '~/composables/useBibleData';
import { useBibleContent } from '~/composables/useBibleContent';
import { useBibleNavigation } from '~/composables/useBibleNavigation';

const route = useRoute();
const router = useRouter();

// 쿼리 파라미터
const initialBook = computed(() => route.query.book as string || 'gen');
const initialChapter = computed(() => parseInt(route.query.chapter as string) || 1);
const planId = computed(() => route.query.plan as string || null);
const scheduleId = computed(() => route.query.schedule as string || null);

// 모드 구분
const isTongdokMode = computed(() => !!planId.value);

// Composables
const { bibleBooks, getBookName, versionNames } = useBibleData();
const { bibleContent, isLoading, fetchContent } = useBibleContent();
const { currentBook, currentChapter, goToPrevChapter, goToNextChapter } = useBibleNavigation();

// ... 나머지 로직
</script>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)
- [ ] `/bible` 접속 시 창세기 1장 표시
- [ ] `/bible?book=mat&chapter=5` 접속 시 마태복음 5장 표시
- [ ] `/bible?plan=1` 접속 시 통독모드 인식 (UI는 Phase 2)
- [ ] 책 선택 → 해당 책으로 이동
- [ ] 장 이동 (이전/다음) 동작
- [ ] 역본 변경 동작
- [ ] URL 쿼리 파라미터 동기화
- [ ] `/plan` 접속 시 통독표 표시
- [ ] 통독표에서 일정 클릭 시 `/bible?plan=x&schedule=y`로 이동

---

## 완료 기준

1. `/bible` 페이지에서 성경 읽기 가능
2. 쿼리 파라미터로 특정 책/장 접근 가능
3. 기존 reading.vue와 동일한 UX
4. `/plan` 페이지 정상 동작
5. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
