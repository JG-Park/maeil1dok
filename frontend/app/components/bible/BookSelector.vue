<template>
  <UiModalBaseModal
    :model-value="modelValue"
    title="성경 선택"
    size="lg"
    :no-padding="true"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="close"
  >
    <template #header-extra>
      <!-- 검색 입력은 header-extra에 배치하지 않음 -->
    </template>

    <!-- 역본 선택 슬라이드 -->
    <div class="version-slide-section">
      <div class="version-scroll-container">
        <button
          v-for="(name, code) in VERSION_NAMES"
          :key="code"
          :class="['version-chip', { active: code === currentVersion }]"
          @click="$emit('version-select', String(code))"
        >
          {{ name }}<span v-if="code === 'SAENEW' || code === 'WOORI'" class="new-badge">N</span>
        </button>
      </div>
    </div>

    <!-- 검색 섹션 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <SearchIcon class="search-icon" :size="18" />
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
          <XCircleIcon :size="16" />
        </button>
      </div>

      <!-- 검색 결과 미리보기 -->
      <div v-if="searchResults.length > 0" class="search-result-preview">
        <div class="ai-result-label">
          <SparkleIcon class="ai-sparkle" :size="14" />
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
          <ArrowRightIcon class="result-arrow" :size="18" />
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
  </UiModalBaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useBibleData, type SearchResult, VERSION_NAMES } from '~/composables/useBibleData';
import SearchIcon from '~/components/icons/SearchIcon.vue';
import XCircleIcon from '~/components/icons/XCircleIcon.vue';
import SparkleIcon from '~/components/icons/SparkleIcon.vue';
import ArrowRightIcon from '~/components/icons/ArrowRightIcon.vue';

const props = defineProps<{
  modelValue: boolean;
  currentBook: string;
  currentChapter: number;
  currentVersion?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'select': [book: string, chapter: number, verse?: number];
  'version-select': [version: string];
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
/* 역본 선택 슬라이드 */
.version-slide-section {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  background-color: var(--color-bg-card, #fff);
  transition: background-color 0.2s, border-color 0.2s;
}

.version-scroll-container {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0 1rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.version-scroll-container::-webkit-scrollbar {
  display: none;
}

.version-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  background: var(--color-bg-primary, #f9fafb);
  border: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.version-chip:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
  border-color: var(--color-border, #d1d5db);
}

.version-chip:active {
  transform: scale(0.98);
}

.version-chip.active {
  background: var(--primary-color, #6366f1);
  color: white;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.version-chip .new-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.0625rem 0.2rem;
  font-size: 0.5rem;
  font-weight: 600;
  color: white;
  background: #dc6b6b;
  border-radius: 3px;
}

.version-chip.active .new-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* 검색 섹션 */
.search-section {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  transition: border-color 0.2s;
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
  transition: color 0.2s;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2.5rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  font-size: 0.9375rem;
  background: var(--color-bg-primary, #f9fafb);
  color: var(--text-primary, #1f2937);
  transition: all 0.2s ease;
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
  border-radius: 50%;
  transition: all 0.2s;
}

.search-clear-button:hover {
  background-color: var(--color-bg-hover, #f3f4f6);
  color: var(--text-secondary, #6b7280);
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
  font-weight: 500;
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

.search-result-item:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
  border-color: var(--color-border, #d1d5db);
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
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.search-result-button:hover {
  background: var(--primary-dark, #4f46e5);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);
}

.search-result-button:active {
  transform: translateY(0);
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
  background-color: var(--color-bg-card, #fff);
}

.books-section {
  width: 55%;
  border-right: 1px solid var(--color-border, #e5e7eb);
  overflow-y: auto;
  padding: 0.75rem;
  transition: border-color 0.2s;
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
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.chapters-section {
  width: 45%;
  overflow-x: hidden;
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
  min-height: 36px;
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
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.chapter-button.searched {
  box-shadow: 0 0 0 2px var(--primary-color, #6366f1);
}

/* Dark Mode Support */
:root.dark .version-slide-section,
[data-theme="dark"] .version-slide-section {
  background-color: var(--color-bg-card);
  border-bottom-color: var(--color-border);
}

:root.dark .version-chip,
[data-theme="dark"] .version-chip {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border);
  color: var(--text-secondary);
}

:root.dark .version-chip:hover,
[data-theme="dark"] .version-chip:hover {
  background-color: var(--color-bg-hover);
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}

:root.dark .version-chip.active,
[data-theme="dark"] .version-chip.active {
  background-color: var(--primary-color, #818cf8);
  border-color: var(--primary-color, #818cf8);
  color: #fff;
}

:root.dark .search-section,
[data-theme="dark"] .search-section {
  border-bottom-color: var(--color-border);
}

:root.dark .search-input,
[data-theme="dark"] .search-input {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border);
  color: var(--text-primary);
}

:root.dark .search-input:focus,
[data-theme="dark"] .search-input:focus {
  background-color: var(--color-bg-card);
  border-color: var(--primary-color, #818cf8);
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
}

:root.dark .search-icon,
[data-theme="dark"] .search-icon {
  color: var(--text-tertiary);
}

:root.dark .search-clear-button,
[data-theme="dark"] .search-clear-button {
  color: var(--text-tertiary);
}

:root.dark .search-clear-button:hover,
[data-theme="dark"] .search-clear-button:hover {
  background-color: var(--color-bg-hover);
  color: var(--text-primary);
}

:root.dark .search-result-item,
[data-theme="dark"] .search-result-item {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border);
  color: var(--text-secondary);
}

:root.dark .search-result-item:hover,
[data-theme="dark"] .search-result-item:hover {
  background-color: var(--color-bg-hover);
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}

:root.dark .search-result-item.selected,
[data-theme="dark"] .search-result-item.selected {
  background-color: rgba(99, 102, 241, 0.2);
  border-color: var(--primary-color, #818cf8);
  color: var(--primary-color, #818cf8);
}

:root.dark .search-result-button,
[data-theme="dark"] .search-result-button {
  background-color: var(--primary-color, #818cf8);
  color: #fff;
}

:root.dark .search-result-button:hover,
[data-theme="dark"] .search-result-button:hover {
  background-color: #6366f1;
}

:root.dark .modal-body,
[data-theme="dark"] .modal-body {
  background-color: var(--color-bg-card);
}

:root.dark .books-section,
[data-theme="dark"] .books-section {
  border-right-color: var(--color-border);
}

:root.dark .book-button,
[data-theme="dark"] .book-button,
:root.dark .chapter-button,
[data-theme="dark"] .chapter-button {
  background-color: var(--color-bg-secondary);
  color: var(--text-secondary);
}

:root.dark .book-button:hover,
[data-theme="dark"] .book-button:hover,
:root.dark .chapter-button:hover,
[data-theme="dark"] .chapter-button:hover {
  background-color: var(--color-bg-hover);
  color: var(--text-primary);
}

:root.dark .book-button.active,
[data-theme="dark"] .book-button.active,
:root.dark .chapter-button.active,
[data-theme="dark"] .chapter-button.active {
  background-color: var(--primary-color, #818cf8);
  color: #fff;
}

:root.dark .chapter-button.searched,
[data-theme="dark"] .chapter-button.searched {
  box-shadow: 0 0 0 2px var(--primary-color, #818cf8);
}

:root.dark .ai-result-label,
[data-theme="dark"] .ai-result-label,
:root.dark .ai-sparkle,
[data-theme="dark"] .ai-sparkle {
  color: var(--primary-color, #818cf8);
}

:root.dark .testament h4,
[data-theme="dark"] .testament h4,
:root.dark .chapters-section h4,
[data-theme="dark"] .chapters-section h4 {
  color: var(--text-tertiary);
}
</style>
