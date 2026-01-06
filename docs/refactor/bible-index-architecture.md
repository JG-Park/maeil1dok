# Bible Index.vue - Target Architecture Design

> 작성일: 2026-01-06
> 목적: God Component 리팩토링 목표 구조 정의

---

## 1. 현재 vs 목표 구조 비교

### 1.1 현재 구조

```
pages/bible/index.vue (1,683줄)
├── Template: 3개 view mode 분기
├── Script: 모든 로직 집중
│   ├── 8개 composable 사용
│   ├── 5개 modal state 개별 관리
│   ├── ~280줄 HTML 파싱 로직
│   ├── ~50개 함수
│   └── 4개 watcher
└── Styles: 434줄
```

### 1.2 목표 구조

```
pages/bible/index.vue (~200줄)
├── Template: 순수 컴포넌트 스위처
├── Script: 조립(orchestration)만
└── Styles: 최소 wrapper 스타일만

composables/bible/
├── useBiblePageState.ts (NEW)
│   └── viewMode, navigation, entry point 관리
├── useBibleContent.ts (NEW)
│   └── 콘텐츠 로딩/파싱 로직 통합
├── useBibleModals.ts (NEW)
│   └── 모달 상태 단일 관리
└── (기존 composables 유지)
    ├── useBibleData.ts
    ├── useBibleFetch.ts
    ├── useTongdokMode.ts
    ├── usePersonalRecord.ts
    ├── useReadingPosition.ts
    ├── useBookmark.ts
    ├── useNote.ts
    └── useHighlight.ts

components/bible/
├── views/ (NEW directory)
│   └── BibleReaderView.vue (NEW)
│       └── Header + BibleViewer + Navigation 통합
└── (기존 components 유지)
    ├── BibleHome.vue
    ├── BibleTOC.vue
    ├── BibleViewer.vue
    └── modals/...
```

---

## 2. 새로운 Composables 설계

### 2.1 useBiblePageState.ts

**책임**: View mode 전이, 현재 위치 상태, 네비게이션 로직

```typescript
// composables/bible/useBiblePageState.ts

interface BiblePageState {
  viewMode: Ref<'reader' | 'home' | 'toc'>;
  currentBook: Ref<string>;
  currentChapter: Ref<number>;
  currentVersion: Ref<string>;
  isLoading: Ref<boolean>;
}

interface BiblePageActions {
  // Navigation
  goHome(): void;
  goToc(): void;
  goReader(book: string, chapter: number): void;
  goBack(): void;

  // Chapter navigation
  goToPrevChapter(): void;
  goToNextChapter(): void;

  // Selection
  selectBook(book: string, chapter: number): void;
  selectVersion(version: string): void;

  // Query init
  initFromQuery(query: LocationQuery): void;
}

interface UseBiblePageStateReturn extends BiblePageState, BiblePageActions {
  // Computed
  currentBookName: ComputedRef<string>;
  currentVersionName: ComputedRef<string>;
  maxChapters: ComputedRef<number>;
  chapterSuffix: ComputedRef<string>;
  hasPrevChapter: ComputedRef<boolean>;
  hasNextChapter: ComputedRef<boolean>;
}

export function useBiblePageState(): UseBiblePageStateReturn;
```

**의존성**:
- `useBibleData` (bookNames, bookChapters, versionNames)
- `useRouter`, `useRoute`
- `useReadingSettingsStore` (entryPoint 설정)

**주요 로직**:
- View mode 전이 함수 (`goHome`, `goToc`, `goReader`)
- 이전/다음 장 네비게이션 (책 경계 처리 포함)
- URL 쿼리 파라미터 초기화
- 공유 URL 생성

### 2.2 useBibleContent.ts

**책임**: 성경 본문 로딩, 파싱, 정규화

```typescript
// composables/bible/useBibleContent.ts

interface BibleContentState {
  content: Ref<string>;
  chapterTitle: Ref<string>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
}

interface UseBibleContentReturn extends BibleContentState {
  loadContent(book: string, chapter: number, version: string): Promise<void>;
  clearContent(): void;
}

export function useBibleContent(): UseBibleContentReturn;
```

**의존성**:
- `useBibleFetch` (fetchKntContent, fetchStandardContent, getFallbackUrl)
- `useBibleData` (bookNames)

**이관될 로직** (index.vue에서 이동):
- `loadBibleContent()`
- `loadKntContent()`
- `loadStandardContent()`
- `parseKntContent()`
- `preprocessFontTags()`
- `cleanupBibleElement()`
- `cleanVerseText()`
- `parseStandardContent()`
- `showErrorContent()`

### 2.3 useBibleModals.ts

**책임**: 모달 상태 단일 관리, 상호 배타성 정책

```typescript
// composables/bible/useBibleModals.ts

type ModalName =
  | 'bookSelector'
  | 'versionSelector'
  | 'tongdokComplete'
  | 'note'
  | 'highlight'
  | 'settings';

interface HighlightSelection {
  start: number;
  end: number;
}

interface ModalState {
  activeModal: Ref<ModalName | null>;
  highlightSelection: Ref<HighlightSelection | null>;
}

interface ModalActions {
  openModal(name: ModalName, data?: any): void;
  closeModal(): void;
  openHighlightModal(selection: HighlightSelection): void;
}

interface UseBibleModalsReturn extends ModalState, ModalActions {
  // Computed for template bindings
  isBookSelectorOpen: ComputedRef<boolean>;
  isVersionSelectorOpen: ComputedRef<boolean>;
  isTongdokCompleteOpen: ComputedRef<boolean>;
  isNoteModalOpen: ComputedRef<boolean>;
  isHighlightModalOpen: ComputedRef<boolean>;
  isSettingsModalOpen: ComputedRef<boolean>;
}

export function useBibleModals(): UseBibleModalsReturn;
```

**설계 결정**:
- 단일 `activeModal` 상태로 관리 (배타성 자동 보장)
- 또는 기존 방식 유지하되 `closeAllModals()` 함수 추가
- 하이라이트 선택 상태는 모달과 함께 관리

---

## 3. 새로운 Components 설계

### 3.1 BibleReaderView.vue

**책임**: Reader 모드의 전체 UI 조립

```vue
<!-- components/bible/views/BibleReaderView.vue -->
<template>
  <div class="bible-reader-view">
    <!-- 헤더 -->
    <BibleReaderHeader
      :book-name="bookName"
      :chapter="chapter"
      :chapter-suffix="chapterSuffix"
      :version-name="versionName"
      :note-count="noteCount"
      :is-bookmarked="isBookmarked"
      @back="$emit('back')"
      @open-book-selector="$emit('open-modal', 'bookSelector')"
      @open-version-selector="$emit('open-modal', 'versionSelector')"
      @open-settings="$emit('open-modal', 'settings')"
      @toggle-bookmark="$emit('toggle-bookmark')"
      @open-note="$emit('open-modal', 'note')"
    />

    <!-- 통독 인디케이터 -->
    <TongdokIndicator
      v-if="isTongdokMode"
      :schedule-range="tongdokScheduleRange"
      @exit="$emit('exit-tongdok')"
    />

    <!-- 본문 뷰어 -->
    <BibleViewer
      ref="viewerRef"
      :content="content"
      :book="bookName"
      :chapter="chapter"
      :is-loading="isLoading"
      :initial-scroll-position="scrollPosition"
      @scroll="$emit('scroll', $event)"
      @bookmark="$emit('bookmark', $event)"
      @highlight="$emit('highlight', $event)"
      @copy="$emit('copy', $event)"
      @share="$emit('share', $event)"
    >
      <template #bottom>
        <slot name="bottom" />
      </template>
    </BibleViewer>

    <!-- 하단 네비게이션 -->
    <BibleBottomNav
      :is-tongdok-mode="isTongdokMode"
      :is-completing="isCompleting"
      :book-name="bookName"
      :chapter="chapter"
      :chapter-suffix="chapterSuffix"
      :has-prev="hasPrevChapter"
      :has-next="hasNextChapter"
      @prev="$emit('prev')"
      @next="$emit('next')"
      @complete-tongdok="$emit('open-modal', 'tongdokComplete')"
    />
  </div>
</template>
```

**Props**:
- `content`, `bookName`, `chapter`, `chapterSuffix`
- `versionName`, `isLoading`, `scrollPosition`
- `isTongdokMode`, `tongdokScheduleRange`, `isCompleting`
- `noteCount`, `isBookmarked`
- `hasPrevChapter`, `hasNextChapter`

**Emits**:
- `back`, `prev`, `next`
- `open-modal`, `toggle-bookmark`, `exit-tongdok`
- `scroll`, `bookmark`, `highlight`, `copy`, `share`

### 3.2 Sub-components (선택적)

리팩토링 범위에 따라 추가 분리 가능:

```
components/bible/
├── views/
│   ├── BibleReaderView.vue
│   ├── BibleReaderHeader.vue (optional)
│   ├── BibleBottomNav.vue (optional)
│   └── TongdokIndicator.vue (optional)
```

**결정**: 이번 리팩토링에서는 `BibleReaderView.vue`만 생성하고, 내부 sub-components는 향후 필요 시 분리.

---

## 4. 리팩토링 후 index.vue 예상 구조

```vue
<!-- pages/bible/index.vue (목표: ~200줄) -->
<template>
  <div class="bible-page">
    <!-- 홈 뷰 -->
    <BibleHome
      v-if="pageState.viewMode.value === 'home'"
      @continue-reading="handleContinueReading"
      @select-book="handleSelectBook"
      @show-toc="pageState.goToc()"
    />

    <!-- 목차 뷰 -->
    <BibleTOC
      v-else-if="pageState.viewMode.value === 'toc'"
      @select-book="handleSelectBook"
      @back="handleTocBack"
    />

    <!-- 리더 뷰 -->
    <BibleReaderView
      v-else
      :content="contentState.content.value"
      :book-name="pageState.currentBookName.value"
      :chapter="pageState.currentChapter.value"
      :chapter-suffix="pageState.chapterSuffix.value"
      :version-name="pageState.currentVersionName.value"
      :is-loading="contentState.isLoading.value"
      :scroll-position="scrollPosition"
      :is-tongdok-mode="isTongdokMode"
      :tongdok-schedule-range="tongdokScheduleRange"
      :is-completing="isCompleting"
      :note-count="noteCount"
      :is-bookmarked="isBookmarked"
      :has-prev-chapter="pageState.hasPrevChapter.value"
      :has-next-chapter="pageState.hasNextChapter.value"
      @back="pageState.goBack()"
      @prev="handlePrevChapter"
      @next="handleNextChapter"
      @open-modal="modals.openModal"
      @toggle-bookmark="handleBookmarkToggle"
      @exit-tongdok="handleExitTongdok"
      @scroll="handleScroll"
      @bookmark="handleBookmarkAction"
      @highlight="handleHighlightAction"
      @copy="handleCopyAction"
      @share="handleShareAction"
    >
      <template #bottom>
        <!-- 읽음 표시 버튼 (기존 로직 유지) -->
      </template>
    </BibleReaderView>

    <!-- 모달들 -->
    <BookSelector
      :model-value="modals.isBookSelectorOpen.value"
      @update:model-value="modals.closeModal()"
      :current-book="pageState.currentBook.value"
      :current-chapter="pageState.currentChapter.value"
      @select="handleBookSelect"
    />

    <!-- ... 기타 모달들 ... -->

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';

// New composables
import { useBiblePageState } from '~/composables/bible/useBiblePageState';
import { useBibleContent } from '~/composables/bible/useBibleContent';
import { useBibleModals } from '~/composables/bible/useBibleModals';

// Existing composables
import { useTongdokMode } from '~/composables/useTongdokMode';
import { usePersonalRecord } from '~/composables/usePersonalRecord';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useBookmark } from '~/composables/useBookmark';
import { useNote } from '~/composables/useNote';
import { useHighlight } from '~/composables/useHighlight';

// Components
import BibleHome from '~/components/bible/BibleHome.vue';
import BibleTOC from '~/components/bible/BibleTOC.vue';
import BibleReaderView from '~/components/bible/views/BibleReaderView.vue';
// ... modals ...

// Composables initialization
const pageState = useBiblePageState();
const contentState = useBibleContent();
const modals = useBibleModals();

// ... 기존 composables ...

// Event handlers (얇은 래퍼들)
const handleSelectBook = async (book: string, chapter: number) => {
  pageState.selectBook(book, chapter);
  await contentState.loadContent(book, chapter, pageState.currentVersion.value);
  // fetch user data...
};

// ... 기타 handlers ...

// Lifecycle & Watchers
onMounted(async () => {
  // 초기화 로직
});
</script>
```

---

## 5. 의존성 방향 규칙

```
                    ┌─────────────────────┐
                    │    index.vue        │
                    │   (Orchestrator)    │
                    └─────────┬───────────┘
                              │ uses
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ BibleHome     │ │ BibleTOC      │ │BibleReaderView│
    └───────────────┘ └───────────────┘ └───────┬───────┘
                                                │ uses
                                                ▼
                                        ┌───────────────┐
                                        │ BibleViewer   │
                                        └───────────────┘

    ┌─────────────────────────────────────────────────────┐
    │                   Composables                        │
    ├─────────────────┬─────────────────┬────────────────┤
    │ useBiblePage    │ useBibleContent │ useBibleModals │
    │ State           │                 │                │
    └────────┬────────┴────────┬────────┴────────────────┘
             │ uses            │ uses
             ▼                 ▼
    ┌─────────────────────────────────────────────────────┐
    │              Base Composables                        │
    │ useBibleData, useBibleFetch, useReadingPosition,    │
    │ useBookmark, useNote, useHighlight, useTongdokMode  │
    └─────────────────────────────────────────────────────┘
```

**규칙**:
1. `index.vue`는 views/modals/composables만 의존
2. Views는 composables에 의존 가능, 다른 views에 의존 불가
3. Composables는 UI 컴포넌트에 의존 불가
4. Base composables 간 순환 의존 금지

---

## 6. 파일 생성 계획

### 6.1 새로 생성할 파일

| 파일 | 예상 줄 수 | 우선순위 |
|------|----------|---------|
| `composables/bible/useBibleModals.ts` | ~80 | 1 (먼저) |
| `composables/bible/useBibleContent.ts` | ~300 | 2 |
| `composables/bible/useBiblePageState.ts` | ~200 | 3 |
| `components/bible/views/BibleReaderView.vue` | ~250 | 4 |

### 6.2 수정할 파일

| 파일 | 변경 내용 |
|------|----------|
| `pages/bible/index.vue` | 로직 제거, composable 사용으로 전환 |

### 6.3 변경하지 않을 파일

- `components/bible/BibleViewer.vue` - 이미 잘 분리됨
- `components/bible/BibleHome.vue` - 유지
- `components/bible/BibleTOC.vue` - 유지
- 모든 modal 컴포넌트들 - 유지
- 기존 base composables - 유지

---

## 7. 단계별 마이그레이션 계획

### Step C-1: 모달 분리 (useBibleModals)

1. `useBibleModals.ts` 생성
2. 5개 modal state를 composable로 이관
3. index.vue에서 composable 사용으로 변경
4. 빌드 & 테스트

### Step C-2: 뷰 분리 (BibleReaderView)

1. `components/bible/views/` 디렉토리 생성
2. `BibleReaderView.vue` 생성 (Reader 뷰 템플릿 이동)
3. index.vue 템플릿 단순화
4. 빌드 & 테스트

### Step C-3: 콘텐츠 로직 분리 (useBibleContent)

1. `useBibleContent.ts` 생성
2. 파싱 로직 이관 (~280줄)
3. index.vue에서 composable 사용
4. 빌드 & 테스트

### Step C-4: 페이지 상태 분리 (useBiblePageState)

1. `useBiblePageState.ts` 생성
2. viewMode, navigation 로직 이관
3. index.vue에서 composable 사용
4. 빌드 & 테스트

### Step C-5: 정리 및 검증

1. index.vue 최종 정리
2. 불필요한 코드 제거
3. 스타일 정리 (필요시 컴포넌트로 이동)
4. 전체 시나리오 테스트

---

## 8. 위험 요소 및 완화 전략

### 8.1 위험: Watcher 타이밍 변경

**문제**: Composable로 이관 시 watcher 실행 순서가 달라질 수 있음

**완화**:
- 각 watcher의 의존성과 side effect를 문서화
- 이관 후 동일한 순서로 실행되는지 검증
- 필요시 `flush: 'post'` 또는 `flush: 'sync'` 명시

### 8.2 위험: Ref 반응성 손실

**문제**: Composable 반환값을 잘못 구조분해하면 반응성 손실

**완화**:
- Composable은 Ref를 직접 반환
- 구조분해 시 `toRefs()` 사용 또는 `.value` 접근
- TypeScript 타입으로 반환 타입 명시

### 8.3 위험: 순환 의존성

**문제**: Composable 간 상호 참조 시 순환 의존성 발생

**완화**:
- 의존성 방향 규칙 엄격히 준수
- 필요시 이벤트/콜백 패턴으로 역방향 통신

### 8.4 위험: BibleViewer와의 연동

**문제**: BibleReaderView 도입으로 BibleViewer ref 접근 방식 변경

**완화**:
- `defineExpose`로 BibleViewer 메서드 노출
- BibleReaderView에서 ref 전달 (expose 또는 emit)

---

## 9. 성공 기준

리팩토링이 성공으로 간주되려면:

1. **기능 동일성**: 모든 기존 기능이 동일하게 동작
2. **코드 줄 수**: index.vue가 ~200줄 이하로 감소
3. **책임 분리**: 각 파일이 단일 책임을 가짐
4. **빌드 성공**: TypeScript 에러 없이 빌드 완료
5. **런타임 에러 없음**: 콘솔 에러/워닝 0
6. **성능 유지**: 렌더링 성능 저하 없음

---

## 10. 의사결정 기록

| 결정 | 이유 | 대안 |
|------|------|------|
| 모달 상태를 단일 composable로 | 배타성 관리 용이, 상태 분산 방지 | 개별 ref 유지 |
| BibleReaderView 생성 | Reader 뷰 로직 격리, index.vue 단순화 | Header/Nav만 분리 |
| 파싱 로직을 useBibleContent로 | 관심사 분리, 테스트 용이 | useBibleFetch에 통합 |
| 기존 composables 유지 | 이미 잘 분리됨, 변경 범위 최소화 | 구조 변경 |
| 점진적 마이그레이션 | 각 단계 검증 가능, 위험 분산 | 일괄 변경 |
