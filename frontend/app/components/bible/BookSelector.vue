<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>성경 선택</h3>
          <button class="close-button" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <!-- 검색 섹션 -->
        <div class="search-section">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21L16.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="예: 창1:3, ㅊㅅㄱ, 요한 3:16"
              @keydown="handleSearchKeydown"
            />
            <button
              v-if="searchQuery"
              class="search-clear-button"
              @click="searchQuery = ''"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                <path d="M15 9L9 15M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- 검색 결과 미리보기 -->
          <div v-if="searchResults.length > 0" class="search-result-preview">
            <div class="ai-result-label">
              <svg class="ai-sparkle" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
                <path d="M18 14L18.55 16.45L21 17L18.55 17.55L18 20L17.45 17.55L15 17L17.45 16.45L18 14Z" fill="currentColor" opacity="0.7"/>
                <path d="M6 16L6.37 17.63L8 18L6.37 18.37L6 20L5.63 18.37L4 18L5.63 17.63L6 16Z" fill="currentColor" opacity="0.5"/>
              </svg>
              <span>{{ searchResults.length > 1 ? `${searchResults.length}개를 찾았어요` : 'AI가 찾았어요' }}</span>
            </div>

            <!-- 여러 후보가 있을 때 -->
            <div v-if="searchResults.length > 1" class="search-results-list">
              <button
                v-for="(result, index) in searchResults"
                :key="`${result.bookId}-${index}`"
                :class="['search-result-item', { selected: index === selectedResultIndex }]"
                @click="selectSearchResult(index)"
              >
                <span class="result-book">{{ result.bookName }}</span>
                <span v-if="result.chapter" class="result-chapter">{{ result.chapter }}장</span>
                <span v-if="result.verse" class="result-verse">{{ result.verse }}절</span>
              </button>
            </div>

            <!-- 선택된 결과로 이동 버튼 -->
            <button v-if="currentSearchResult" class="search-result-button" @click="goToSearchResult">
              <span class="result-book">{{ currentSearchResult.bookName }}</span>
              <span v-if="currentSearchResult.chapter" class="result-chapter">{{ currentSearchResult.chapter }}장</span>
              <span v-if="currentSearchResult.verse" class="result-verse">{{ currentSearchResult.verse }}절</span>
              <span v-else-if="!currentSearchResult.chapter" class="result-hint">장을 선택해주세요</span>
              <span class="result-action">바로가기</span>
              <svg class="result-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="modal-body">
          <div class="books-section" ref="booksSection">
            <div class="testament">
              <h4>구약</h4>
              <div class="books-list">
                <button
                  v-for="book in bibleBooks.old"
                  :key="book.id"
                  :data-id="book.id"
                  :class="['book-button', { active: selectedBookId === book.id }]"
                  @click="selectBook(book.id)"
                >
                  {{ book.name }}
                </button>
              </div>
            </div>
            <div class="testament">
              <h4>신약</h4>
              <div class="books-list">
                <button
                  v-for="book in bibleBooks.new"
                  :key="book.id"
                  :data-id="book.id"
                  :class="['book-button', { active: selectedBookId === book.id }]"
                  @click="selectBook(book.id)"
                >
                  {{ book.name }}
                </button>
              </div>
            </div>
          </div>
          <div class="chapters-section" ref="chaptersSection">
            <h4>장</h4>
            <div class="chapters-grid">
              <button
                v-for="chapter in chaptersArray"
                :key="chapter"
                :data-chapter="chapter"
                :class="[
                  'chapter-button',
                  { active: chapter === currentChapter && selectedBookId === currentBook },
                  { searched: currentSearchResult && currentSearchResult.chapter === chapter },
                ]"
                @click="selectChapter(chapter)"
              >
                {{ chapter }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useBibleData, type SearchResult } from '~/composables/useBibleData';

const props = defineProps<{
  modelValue: boolean;
  currentBook: string;
  currentChapter: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'select': [book: string, chapter: number, verse?: number];
}>();

const { bibleBooks, getChaptersArray, parseSearchQuery } = useBibleData();

// 상태
const searchQuery = ref('');
const selectedBookId = ref(props.currentBook);
const selectedResultIndex = ref(0);
const searchInputRef = ref<HTMLInputElement | null>(null);
const booksSection = ref<HTMLElement | null>(null);
const chaptersSection = ref<HTMLElement | null>(null);

// 선택된 책의 장 배열
const chaptersArray = computed(() => getChaptersArray(selectedBookId.value));

// 검색 결과
const searchResults = computed(() => parseSearchQuery(searchQuery.value));

// 현재 선택된 검색 결과
const currentSearchResult = computed<SearchResult | null>(() => {
  const results = searchResults.value;
  if (results.length === 0) return null;
  const index = Math.min(selectedResultIndex.value, results.length - 1);
  return results[index] ?? null;
});

// 검색어 변경 시 인덱스 리셋
watch(searchQuery, () => {
  selectedResultIndex.value = 0;
});

// 검색 결과 변경 시 책 선택 및 스크롤 연동
watch(currentSearchResult, (result) => {
  if (result && result.bookId) {
    selectedBookId.value = result.bookId;
    nextTick(() => {
      scrollToSelectedBook();
      if (result.chapter) {
        setTimeout(() => scrollToSearchedChapter(result.chapter!), 50);
      }
    });
  }
});

// 모달 열릴 때 초기화
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    searchQuery.value = '';
    selectedBookId.value = props.currentBook;
    nextTick(() => {
      searchInputRef.value?.focus();
      scrollToSelectedBook();
      scrollToSelectedChapter();
    });
  }
});

// 닫기
const close = () => {
  emit('update:modelValue', false);
};

// 책 선택
const selectBook = (bookId: string) => {
  selectedBookId.value = bookId;
  nextTick(() => scrollToSelectedChapter());
};

// 장 선택
const selectChapter = (chapter: number) => {
  emit('select', selectedBookId.value, chapter);
  close();
};

// 검색 결과 선택
const selectSearchResult = (index: number) => {
  selectedResultIndex.value = index;
};

// 검색 결과로 이동
const goToSearchResult = () => {
  const result = currentSearchResult.value;
  if (!result) return;

  if (result.chapter) {
    emit('select', result.bookId, result.chapter, result.verse ?? undefined);
    searchQuery.value = '';
    close();
  } else {
    // 책만 있으면 책 선택 후 장 선택 대기
    selectedBookId.value = result.bookId;
    searchQuery.value = '';
  }
};

// 검색 입력 핸들러
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    goToSearchResult();
  } else if (event.key === 'Escape') {
    searchQuery.value = '';
    searchInputRef.value?.blur();
  }
};

// 선택된 책으로 스크롤
const scrollToSelectedBook = () => {
  if (!booksSection.value) return;
  const selectedButton = booksSection.value.querySelector(`[data-id="${selectedBookId.value}"]`);
  if (selectedButton) {
    selectedButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// 선택된 장으로 스크롤
const scrollToSelectedChapter = () => {
  if (!chaptersSection.value) return;
  const currentChapterButton = chaptersSection.value.querySelector(`[data-chapter="${props.currentChapter}"]`);
  if (currentChapterButton) {
    currentChapterButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// 검색된 장으로 스크롤
const scrollToSearchedChapter = (chapter: number) => {
  if (!chaptersSection.value) return;
  const chapterButton = chaptersSection.value.querySelector(`[data-chapter="${chapter}"]`);
  if (chapterButton) {
    chapterButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-bg-card, #fff);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.close-button {
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

/* 검색 섹션 */
.search-section {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--text-tertiary, #9ca3af);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2.5rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  font-size: 0.9375rem;
  background: var(--color-bg-primary, #f9fafb);
  color: var(--text-primary, #1f2937);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  background: var(--color-bg-card, #fff);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-clear-button {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-tertiary, #9ca3af);
  cursor: pointer;
}

/* 검색 결과 미리보기 */
.search-result-preview {
  margin-top: 0.75rem;
}

.ai-result-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--primary-color, #6366f1);
  margin-bottom: 0.5rem;
}

.ai-sparkle {
  color: var(--primary-color, #6366f1);
}

.search-results-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.search-result-item {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: var(--color-bg-primary, #f9fafb);
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
}

.search-result-item.selected {
  border-color: var(--primary-color, #6366f1);
  background: var(--primary-light, #eef2ff);
  color: var(--primary-color, #6366f1);
}

.search-result-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: var(--primary-color, #6366f1);
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.search-result-button:hover {
  background: var(--primary-dark, #4f46e5);
}

.result-book {
  font-weight: 600;
}

.result-chapter,
.result-verse {
  font-weight: 400;
}

.result-hint {
  font-size: 0.8125rem;
  opacity: 0.8;
}

.result-action {
  margin-left: auto;
  font-size: 0.8125rem;
  opacity: 0.9;
}

.result-arrow {
  flex-shrink: 0;
}

/* 모달 바디 */
.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.books-section {
  width: 55%;
  border-right: 1px solid var(--color-border, #e5e7eb);
  overflow-y: auto;
  padding: 0.75rem;
}

.testament {
  margin-bottom: 1rem;
}

.testament:last-child {
  margin-bottom: 0;
}

.testament h4 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}

.books-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.book-button {
  padding: 0.5rem 0.625rem;
  border: none;
  border-radius: 8px;
  background: var(--color-bg-primary, #f9fafb);
  color: var(--text-secondary, #6b7280);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.book-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.book-button.active {
  background: var(--primary-color, #6366f1);
  color: white;
}

.chapters-section {
  width: 45%;
  overflow-y: auto;
  padding: 0.75rem;
}

.chapters-section h4 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.375rem;
}

.chapter-button {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: var(--color-bg-primary, #f9fafb);
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.chapter-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.chapter-button.active {
  background: var(--primary-color, #6366f1);
  color: white;
}

.chapter-button.searched {
  box-shadow: 0 0 0 2px var(--primary-color, #6366f1);
}
</style>
