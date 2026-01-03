<template>
  <div class="bible-reader">
    <!-- 헤더: 책/장 선택, 역본 선택 -->
    <header class="reader-header">
      <div class="book-chapter-selector">
        <button class="selector-btn" @click="showBookModal = true">
          {{ currentBookName }} {{ currentChapter }}{{ chapterSuffix }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="header-right">
        <div class="version-selector">
          <select v-model="currentVersion" @change="loadContent">
            <option v-for="v in versions" :key="v.code" :value="v.code">
              {{ v.name }}
            </option>
          </select>
        </div>

        <button @click="showOptions = true" class="options-btn" title="보기 설정">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- 본문 -->
    <main class="reader-content" ref="contentRef" @scroll="onScroll">
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>본문을 불러오는 중...</p>
      </div>

      <div v-else-if="error" class="error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>{{ error }}</p>
        <button @click="loadContent" class="retry-btn">다시 시도</button>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        이전
      </button>

      <span class="current-position">
        {{ currentBookName }} {{ currentChapter }}{{ chapterSuffix }}
      </span>

      <button
        @click="goNext"
        :disabled="!canGoNext"
        class="nav-btn next"
      >
        다음
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </footer>

    <!-- 책/장 선택 모달 -->
    <Teleport to="body">
      <div v-if="showBookModal" class="book-modal-overlay" @click.self="showBookModal = false">
        <div class="book-modal">
          <div class="modal-header">
            <h3>성경 선택</h3>
            <button @click="showBookModal = false" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-content">
            <div class="books-section">
              <h4>구약</h4>
              <div class="books-grid">
                <button
                  v-for="book in oldTestament"
                  :key="book.code"
                  :class="['book-btn', { active: selectedBook === book.code }]"
                  @click="selectBook(book.code)"
                >
                  {{ book.name }}
                </button>
              </div>

              <h4>신약</h4>
              <div class="books-grid">
                <button
                  v-for="book in newTestament"
                  :key="book.code"
                  :class="['book-btn', { active: selectedBook === book.code }]"
                  @click="selectBook(book.code)"
                >
                  {{ book.name }}
                </button>
              </div>
            </div>

            <div class="chapters-section">
              <h4>{{ selectedBookName }} - 장 선택</h4>
              <div class="chapters-grid">
                <button
                  v-for="ch in selectedBookChapters"
                  :key="ch"
                  :class="['chapter-btn', { active: selectedBook === currentBook && ch === currentChapter }]"
                  @click="selectChapter(ch)"
                >
                  {{ ch }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 보기 옵션 모달 -->
    <Teleport to="body">
      <div v-if="showOptions" class="options-modal-overlay" @click.self="showOptions = false">
        <div class="options-modal">
          <div class="modal-header">
            <h3>보기 설정</h3>
            <button @click="showOptions = false" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="options-content">
            <label class="option-item">
              <input type="checkbox" v-model="viewOptions.showDescription">
              <span>시편 머리말 표시</span>
            </label>

            <label class="option-item">
              <input type="checkbox" v-model="viewOptions.showCrossRef">
              <span>교차 참조 표시</span>
            </label>

            <label class="option-item">
              <input type="checkbox" v-model="viewOptions.highlightNames">
              <span>인명/지명 강조</span>
            </label>

            <label class="option-item">
              <input type="checkbox" v-model="viewOptions.showFootnotes">
              <span>각주 표시</span>
            </label>
          </div>
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
import { BIBLE_BOOKS, BOOK_CHAPTERS, BOOK_NAMES, BIBLE_VERSIONS } from '~/constants/bible'

// Props
const props = defineProps<{
  initialBook?: string
  initialChapter?: number
  tongdokMode?: boolean
  schedule?: {
    id: number
    book: string
    start_chapter: number
    end_chapter: number
    is_complete: boolean
  } | null
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
const { fetchKntContent, fetchStandardContent, getFallbackUrl } = useBibleFetch()
const { savePosition } = useBibleReader()

// Refs
const contentRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const bibleContent = ref('')
const showOptions = ref(false)
const showBookModal = ref(false)

// State
const currentBook = ref(props.initialBook || bibleStore.currentBook)
const currentChapter = ref(props.initialChapter || bibleStore.currentChapter)
const currentVersion = ref(bibleStore.currentVersion)
const selectedBook = ref(currentBook.value)
const viewOptions = ref({ ...bibleStore.viewOptions })

// Computed
const oldTestament = computed(() => BIBLE_BOOKS.filter(b => b.testament === 'old'))
const newTestament = computed(() => BIBLE_BOOKS.filter(b => b.testament === 'new'))
const maxChapters = computed(() => BOOK_CHAPTERS[currentBook.value] || 1)
const currentBookName = computed(() => BOOK_NAMES[currentBook.value] || '')
const selectedBookName = computed(() => BOOK_NAMES[selectedBook.value] || '')
const selectedBookChapters = computed(() => {
  const chapters = BOOK_CHAPTERS[selectedBook.value] || 1
  return Array.from({ length: chapters }, (_, i) => i + 1)
})
const chapterSuffix = computed(() => currentBook.value === 'psa' ? '편' : '장')

const versions = BIBLE_VERSIONS

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
    let content = ''

    if (currentVersion.value === 'KNT') {
      // 새한글성경(KNT) 로드
      const result = await fetchKntContent(currentBook.value, currentChapter.value)

      if (result.source === 'error') {
        throw new Error('성경 본문을 불러올 수 없습니다.')
      }

      // JSON 파싱 및 HTML 추출
      const jsonData = JSON.parse(result.content)
      if (jsonData.found && jsonData.content) {
        content = parseKntContent(jsonData)
      } else {
        throw new Error('성경 본문을 찾을 수 없습니다.')
      }
    } else {
      // 표준 역본 (GAE, HAN 등) 로드
      const result = await fetchStandardContent(currentVersion.value, currentBook.value, currentChapter.value)

      if (result.source === 'error') {
        throw new Error('성경 본문을 불러올 수 없습니다.')
      }

      content = parseStandardContent(result.content)
    }

    bibleContent.value = content

    // Store 업데이트
    bibleStore.setCurrentPosition(currentBook.value, currentChapter.value)
    bibleStore.setVersion(currentVersion.value)

    // 위치 변경 이벤트
    emit('position-change', {
      book: currentBook.value,
      chapter: currentChapter.value
    })

    // 서버에 위치 저장 (debounced)
    savePosition({
      book: currentBook.value,
      chapter: currentChapter.value,
      version: currentVersion.value,
    })

    // 스크롤 초기화
    if (contentRef.value) {
      contentRef.value.scrollTop = 0
    }
  } catch (e: any) {
    error.value = e.message || '성경 본문을 불러오는데 실패했습니다.'
    console.error('[BibleReader]', e)
  } finally {
    isLoading.value = false
  }
}

// KNT (새한글성경) 콘텐츠 파싱
const parseKntContent = (jsonData: any): string => {
  if (!jsonData.content) return ''

  // 기본 HTML 콘텐츠 반환 (스타일 적용을 위해 클래스 추가)
  let html = jsonData.content

  // 장 번호 제거 (중복 방지)
  html = html.replace(/<h2[^>]*class="c"[^>]*>\d+<\/h2>/g, '')

  return `<div class="knt-content">${html}</div>`
}

// 표준 역본 콘텐츠 파싱
const parseStandardContent = (htmlText: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, 'text/html')
  const bibleElement = doc.getElementById('tdBible1')

  if (!bibleElement) {
    // tdBible1이 없으면 원본 반환
    return `<div class="standard-content">${htmlText}</div>`
  }

  // 불필요한 요소 제거
  const unwantedElements = bibleElement.querySelectorAll('script, style, .ad, .advertisement')
  unwantedElements.forEach(el => el.remove())

  return `<div class="standard-content">${bibleElement.innerHTML}</div>`
}

const selectBook = (bookCode: string) => {
  selectedBook.value = bookCode
}

const selectChapter = (chapter: number) => {
  currentBook.value = selectedBook.value
  currentChapter.value = chapter
  showBookModal.value = false
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

// Watch view options
watch(viewOptions, (newOptions) => {
  bibleStore.setViewOptions(newOptions)
}, { deep: true })

// Watch props changes
watch(() => props.initialBook, (newBook) => {
  if (newBook && newBook !== currentBook.value) {
    currentBook.value = newBook
    selectedBook.value = newBook
    loadContent()
  }
})

watch(() => props.initialChapter, (newChapter) => {
  if (newChapter && newChapter !== currentChapter.value) {
    currentChapter.value = newChapter
    loadContent()
  }
})

// Lifecycle
onMounted(() => {
  bibleStore.loadViewOptionsFromStorage()
  viewOptions.value = { ...bibleStore.viewOptions }
  loadContent()
})

// 외부에서 호출 가능한 메서드 노출
defineExpose({
  loadContent,
  goTo: (book: string, chapter: number) => {
    currentBook.value = book
    selectedBook.value = book
    currentChapter.value = chapter
    loadContent()
  }
})
</script>

<style scoped>
.bible-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color, #fff);
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--header-bg, #fff);
  position: sticky;
  top: 0;
  z-index: 10;
}

.selector-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--bg-color, #fff);
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.version-selector select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  background: var(--bg-color, #fff);
  font-size: 0.875rem;
}

.options-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: 1rem;
  color: var(--text-secondary, #6b7280);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: 1rem;
  color: var(--text-secondary, #6b7280);
  text-align: center;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.bible-text {
  line-height: 1.8;
  font-size: 1rem;
}

.bible-text :deep(p) {
  margin-bottom: 0.5rem;
}

.bible-text :deep(sup) {
  font-size: 0.75em;
  color: var(--primary-color, #3b82f6);
  margin-right: 0.25rem;
}

.reader-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background: var(--footer-bg, #fff);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--bg-color, #fff);
  cursor: pointer;
  font-size: 0.875rem;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-position {
  font-weight: 500;
  color: var(--text-primary, #111827);
}

/* Book Modal */
.book-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.book-modal {
  background: white;
  border-radius: 1rem;
  max-width: 90vw;
  max-height: 80vh;
  width: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.close-btn {
  padding: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
}

.modal-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.books-section {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  border-right: 1px solid var(--border-color, #e5e7eb);
}

.books-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

.books-section h4:not(:first-child) {
  margin-top: 1rem;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
}

.book-btn {
  padding: 0.5rem 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  border-radius: 0.25rem;
}

.book-btn:hover {
  background: var(--hover-bg, #f3f4f6);
}

.book-btn.active {
  background: var(--primary-color, #3b82f6);
  color: white;
}

.chapters-section {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.chapters-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
}

.chapter-btn {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #e5e7eb);
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  border-radius: 0.25rem;
}

.chapter-btn:hover {
  background: var(--hover-bg, #f3f4f6);
}

.chapter-btn.active {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

/* Options Modal */
.options-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.options-modal {
  background: white;
  border-radius: 1rem;
  min-width: 280px;
  max-width: 90vw;
}

.options-content {
  padding: 1rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  cursor: pointer;
}

.option-item input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .modal-content {
    flex-direction: column;
  }

  .books-section {
    border-right: none;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    max-height: 40vh;
  }

  .chapters-section {
    max-height: 30vh;
  }

  .books-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .chapters-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>
