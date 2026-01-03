# Task 4: BibleReader 컴포넌트 추출

> **상태**: ✅ 완료
> **의존성**: Task 3 완료 필요
> **예상 파일**: `components/bible/BibleReader.vue`

---

## 목표

기존 `reading.vue`에서 성경 본문 표시 핵심 로직을 `BibleReader.vue` 컴포넌트로 추출한다.

---

## 수정/생성 파일

| 파일 | 작업 |
|------|------|
| `frontend/app/components/bible/BibleReader.vue` | 새로 생성 |
| `frontend/app/pages/reading.vue` | 참조용 (수정 안함) |

---

## 추출 대상 기능

### reading.vue에서 추출할 핵심 로직

1. **성경 본문 로드** (`useBibleFetch` 활용)
2. **역본 선택** (GAE, KNT, HAN 등)
3. **책/장 네비게이션**
4. **보기 옵션** (시편 머리말, 교차참조 등)
5. **스크롤 처리**

### 추출하지 않을 로직 (별도 처리)

- Plan 관련 로직 → 탭 UI에서 처리
- 완료/취소 버튼 → 통독모드에서 처리
- 캘린더 관련 → plan.vue에서 처리

---

## 구현 상세

### BibleReader.vue 구조

```vue
<!-- frontend/app/components/bible/BibleReader.vue -->
<template>
  <div class="bible-reader">
    <!-- 헤더: 책/장 선택, 역본 선택 -->
    <header class="reader-header">
      <div class="book-chapter-selector">
        <select v-model="currentBook" @change="onBookChange">
          <optgroup label="구약">
            <option v-for="book in oldTestament" :key="book.code" :value="book.code">
              {{ book.name }}
            </option>
          </optgroup>
          <optgroup label="신약">
            <option v-for="book in newTestament" :key="book.code" :value="book.code">
              {{ book.name }}
            </option>
          </optgroup>
        </select>

        <select v-model="currentChapter" @change="loadContent">
          <option v-for="ch in maxChapters" :key="ch" :value="ch">
            {{ ch }}장
          </option>
        </select>
      </div>

      <div class="version-selector">
        <select v-model="currentVersion" @change="loadContent">
          <option v-for="v in versions" :key="v.code" :value="v.code">
            {{ v.name }}
          </option>
        </select>
      </div>

      <div class="view-options">
        <button @click="toggleOptions" class="options-btn">
          <i class="fa-solid fa-gear"></i>
        </button>
      </div>
    </header>

    <!-- 본문 -->
    <main class="reader-content" ref="contentRef" @scroll="onScroll">
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="error" class="error">
        <p>성경 본문을 불러오는데 실패했습니다.</p>
        <button @click="loadContent">다시 시도</button>
      </div>

      <div v-else class="bible-text" v-html="bibleContent"></div>
    </main>

    <!-- 하단 네비게이션 -->
    <footer class="reader-footer">
      <button
        @click="goPrev"
        :disabled="!canGoPrev"
        class="nav-btn prev"
      >
        <i class="fa-solid fa-chevron-left"></i>
        이전
      </button>

      <span class="current-position">
        {{ currentBookName }} {{ currentChapter }}장
      </span>

      <button
        @click="goNext"
        :disabled="!canGoNext"
        class="nav-btn next"
      >
        다음
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </footer>

    <!-- 보기 옵션 모달 -->
    <Teleport to="body">
      <div v-if="showOptions" class="options-modal" @click.self="showOptions = false">
        <div class="options-content">
          <h3>보기 설정</h3>

          <label>
            <input type="checkbox" v-model="viewOptions.showDescription">
            시편 머리말 표시
          </label>

          <label>
            <input type="checkbox" v-model="viewOptions.showCrossRef">
            교차 참조 표시
          </label>

          <label>
            <input type="checkbox" v-model="viewOptions.highlightNames">
            인명/지명 강조
          </label>

          <label>
            <input type="checkbox" v-model="viewOptions.showFootnotes">
            각주 표시
          </label>

          <button @click="showOptions = false">닫기</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBibleFetch } from '~/composables/useBibleFetch'
import { useBibleReader } from '~/composables/useBibleReader'
import { useBibleStore } from '~/stores/bible'
import { BIBLE_BOOKS, BOOK_CHAPTERS } from '~/constants/bible'

// Props
const props = defineProps<{
  initialBook?: string
  initialChapter?: number
  tongdokMode?: boolean
  schedule?: any
}>()

// Emits
const emit = defineEmits<{
  (e: 'position-change', position: { book: string, chapter: number }): void
  (e: 'chapter-complete', schedule: any): void
  (e: 'scroll-end'): void
}>()

// Store
const bibleStore = useBibleStore()

// Composables
const { loadBibleContent: fetchBible } = useBibleFetch()
const { savePosition } = useBibleReader()

// Refs
const contentRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const bibleContent = ref('')
const showOptions = ref(false)

// State
const currentBook = ref(props.initialBook || bibleStore.currentBook)
const currentChapter = ref(props.initialChapter || bibleStore.currentChapter)
const currentVersion = ref(bibleStore.currentVersion)
const viewOptions = ref({ ...bibleStore.viewOptions })

// Computed
const oldTestament = computed(() => BIBLE_BOOKS.filter(b => b.testament === 'old'))
const newTestament = computed(() => BIBLE_BOOKS.filter(b => b.testament === 'new'))
const maxChapters = computed(() => BOOK_CHAPTERS[currentBook.value] || 1)
const currentBookName = computed(() =>
  BIBLE_BOOKS.find(b => b.code === currentBook.value)?.name || ''
)
const versions = [
  { code: 'GAE', name: '개역개정' },
  { code: 'KNT', name: '새한글성경' },
  { code: 'HAN', name: '한글킹제임스' },
]

const canGoPrev = computed(() => {
  if (currentChapter.value > 1) return true
  const bookIndex = BIBLE_BOOKS.findIndex(b => b.code === currentBook.value)
  return bookIndex > 0
})

const canGoNext = computed(() => {
  if (currentChapter.value < maxChapters.value) return true
  const bookIndex = BIBLE_BOOKS.findIndex(b => b.code === currentBook.value)
  return bookIndex < BIBLE_BOOKS.length - 1
})

// Methods
const loadContent = async () => {
  isLoading.value = true
  error.value = null

  try {
    const content = await fetchBible(currentBook.value, currentChapter.value, currentVersion.value)
    bibleContent.value = content

    // Store 업데이트
    bibleStore.setCurrentPosition(currentBook.value, currentChapter.value)
    bibleStore.setVersion(currentVersion.value)

    // 위치 변경 이벤트
    emit('position-change', {
      book: currentBook.value,
      chapter: currentChapter.value
    })

    // 서버에 위치 저장
    savePosition({
      book: currentBook.value,
      chapter: currentChapter.value,
      version: currentVersion.value,
    })

    // 스크롤 초기화
    if (contentRef.value) {
      contentRef.value.scrollTop = 0
    }
  } catch (e) {
    error.value = '성경 본문을 불러오는데 실패했습니다.'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const onBookChange = () => {
  currentChapter.value = 1
  loadContent()
}

const goPrev = () => {
  if (currentChapter.value > 1) {
    currentChapter.value--
  } else {
    const bookIndex = BIBLE_BOOKS.findIndex(b => b.code === currentBook.value)
    if (bookIndex > 0) {
      currentBook.value = BIBLE_BOOKS[bookIndex - 1].code
      currentChapter.value = BOOK_CHAPTERS[currentBook.value]
    }
  }
  loadContent()
}

const goNext = async () => {
  // 통독모드: 현재 일정의 마지막 장이면 완료 처리
  if (props.tongdokMode && props.schedule) {
    const { end_chapter } = props.schedule
    if (currentChapter.value === end_chapter) {
      emit('chapter-complete', props.schedule)
    }
  }

  if (currentChapter.value < maxChapters.value) {
    currentChapter.value++
  } else {
    const bookIndex = BIBLE_BOOKS.findIndex(b => b.code === currentBook.value)
    if (bookIndex < BIBLE_BOOKS.length - 1) {
      currentBook.value = BIBLE_BOOKS[bookIndex + 1].code
      currentChapter.value = 1
    }
  }
  loadContent()
}

const onScroll = () => {
  if (!contentRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = contentRef.value
  const scrollRatio = scrollTop / (scrollHeight - clientHeight)

  // 스크롤 끝 감지
  if (scrollRatio > 0.95) {
    emit('scroll-end')
  }

  // 위치 저장
  savePosition({
    book: currentBook.value,
    chapter: currentChapter.value,
    scrollPosition: scrollRatio,
    version: currentVersion.value,
  })
}

const toggleOptions = () => {
  showOptions.value = !showOptions.value
}

// Watch view options
watch(viewOptions, (newOptions) => {
  bibleStore.setViewOptions(newOptions)
}, { deep: true })

// Lifecycle
onMounted(() => {
  bibleStore.loadViewOptionsFromStorage()
  viewOptions.value = { ...bibleStore.viewOptions }
  loadContent()
})
</script>

<style scoped>
/* 스타일은 기존 reading.vue에서 추출 */
.bible-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.reader-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-color);
  cursor: pointer;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.options-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.options-content {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  min-width: 280px;
}

.options-content label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
}
</style>
```

---

## 테스트 체크리스트

- [ ] 컴포넌트가 정상 렌더링됨
- [ ] 책/장 선택 동작
- [ ] 역본 변경 동작
- [ ] 이전/다음 네비게이션 동작
- [ ] 보기 옵션 동작
- [ ] 빌드 에러 없음

---

## 완료 조건

1. BibleReader 컴포넌트가 독립적으로 동작
2. 기존 reading.vue의 핵심 기능 포함
3. Props/Emits로 외부와 통신 가능

---

## 완료 기록

- **완료일**: 2026-01-03
- **커밋**: (pending)
- **비고**: constants/bible.ts와 BibleReader.vue 생성
