<template>
  <div class="bible-toc">
    <header class="toc-header">
      <button class="back-btn" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18L9 12L15 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>성경 목차</h1>
      <button class="settings-btn" @click="$router.push('/bible/settings')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
    </header>

    <!-- 탭 -->
    <div class="testament-tabs">
      <button
        :class="{ active: activeTab === 'old' }"
        @click="activeTab = 'old'"
      >
        구약 (39권)
      </button>
      <button
        :class="{ active: activeTab === 'new' }"
        @click="activeTab = 'new'"
      >
        신약 (27권)
      </button>
    </div>

    <!-- 책 목록 -->
    <div class="books-list">
      <button
        v-for="book in currentBooks"
        :key="book.id"
        class="book-item"
        @click="handleSelectBook(book.id)"
      >
        <span class="book-name">{{ book.name }}</span>
        <span class="book-chapters">{{ book.chapters }}장</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBibleData } from '~/composables/useBibleData';

const emit = defineEmits<{
  (e: 'select-book', bookId: string, chapter?: number): void;
  (e: 'back'): void;
}>();

const router = useRouter();
const { bibleBooks } = useBibleData();

const activeTab = ref<'old' | 'new'>('old');

const currentBooks = computed(() => {
  return activeTab.value === 'old' ? bibleBooks.old : bibleBooks.new;
});

const handleSelectBook = (bookId: string) => {
  emit('select-book', bookId, 1);
};

const handleBack = () => {
  emit('back');
};
</script>

<style scoped>
.bible-toc {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--background-color);
}

.toc-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.toc-header h1 {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.back-btn,
.settings-btn {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover,
.settings-btn:hover {
  background: var(--primary-light);
}

.settings-btn {
  margin: -0.5rem -0.5rem -0.5rem 0;
}

.testament-tabs {
  display: flex;
  padding: 0.75rem 1rem;
  gap: 0.5rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}

.testament-tabs button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: var(--color-bg-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.testament-tabs button:hover {
  background: var(--color-bg-tertiary);
}

.testament-tabs button.active {
  background: var(--primary-color);
  color: white;
}

.books-list {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.book-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.book-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color);
}

.book-item:active {
  transform: translateY(0);
}

.book-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}

.book-chapters {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 다크모드 */
:root.dark .toc-header {
  background: var(--color-bg-card);
}

:root.dark .testament-tabs {
  background: var(--color-bg-card);
}

:root.dark .testament-tabs button {
  background: var(--color-bg-tertiary);
  color: var(--text-secondary);
}

:root.dark .testament-tabs button:hover {
  background: var(--color-bg-secondary);
}

:root.dark .testament-tabs button.active {
  background: var(--primary-color);
  color: white;
}

:root.dark .book-item {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .book-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .books-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .book-item {
    padding: 0.75rem;
  }

  .book-name {
    font-size: 0.875rem;
  }
}
</style>
