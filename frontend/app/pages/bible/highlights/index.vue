<template>
  <div class="highlights-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>하이라이트</h1>
    </header>

    <!-- 필터 -->
    <div class="filter-bar">
      <div class="filter-row">
        <select v-model="filterBook" class="filter-select">
          <option value="">전체</option>
          <optgroup label="구약">
            <option v-for="book in bibleBooks.old" :key="book.id" :value="book.id">
              {{ book.name }}
            </option>
          </optgroup>
          <optgroup label="신약">
            <option v-for="book in bibleBooks.new" :key="book.id" :value="book.id">
              {{ book.name }}
            </option>
          </optgroup>
        </select>
        <select v-model="filterColor" class="filter-select color-filter">
          <option value="">모든 색상</option>
          <option v-for="color in DEFAULT_HIGHLIGHT_COLORS" :key="color.value" :value="color.value">
            {{ color.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>하이라이트를 불러오는 중...</p>
    </div>

    <!-- 로그인 필요 -->
    <div v-else-if="!authStore.isAuthenticated" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>로그인 후 하이라이트를 확인할 수 있습니다</p>
      <NuxtLink to="/login" class="login-btn">로그인</NuxtLink>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="filteredHighlights.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>{{ filterBook || filterColor ? '해당 조건의 하이라이트가 없습니다' : '하이라이트가 없습니다' }}</p>
      <span class="empty-hint">성경을 읽으며 중요한 구절을 하이라이트해보세요</span>
    </div>

    <!-- 하이라이트 목록 -->
    <ul v-else class="highlight-list">
      <li
        v-for="highlight in filteredHighlights"
        :key="highlight.id"
        class="highlight-item"
        @click="goToHighlight(highlight)"
      >
        <div class="highlight-header">
          <span class="highlight-location">
            <span class="color-dot" :style="{ background: highlight.color }"></span>
            {{ highlight.book_name || getBookName(highlight.book) }} {{ highlight.chapter }}:{{ highlight.start_verse }}<template v-if="highlight.end_verse !== highlight.start_verse">-{{ highlight.end_verse }}</template>
          </span>
          <span class="highlight-date">{{ formatRelativeDate(highlight.created_at) }}</span>
        </div>
        <p v-if="highlight.memo" class="highlight-memo">{{ truncate(highlight.memo, 100) }}</p>
        <div class="highlight-actions">
          <button class="action-btn delete" @click.stop="handleDelete(highlight)" title="삭제">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </li>
    </ul>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHighlight, DEFAULT_HIGHLIGHT_COLORS, type Highlight } from '~/composables/useHighlight';
import { useBibleData, BIBLE_BOOKS } from '~/composables/useBibleData';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import Toast from '~/components/Toast.vue';

definePageMeta({
  layout: 'default'
});

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const { highlights, isHighlightLoading: isLoading, fetchHighlights, deleteHighlight } = useHighlight();
const { getBookName } = useBibleData();

const bibleBooks = BIBLE_BOOKS;
const filterBook = ref('');
const filterColor = ref('');

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await fetchHighlights();
  }
});

const filteredHighlights = computed(() => {
  let result = highlights.value;
  if (filterBook.value) {
    result = result.filter(h => h.book === filterBook.value);
  }
  if (filterColor.value) {
    result = result.filter(h => h.color === filterColor.value);
  }
  return result;
});

const goToHighlight = (highlight: Highlight) => {
  router.push({
    path: '/bible',
    query: {
      book: highlight.book,
      chapter: String(highlight.chapter),
      verse: String(highlight.start_verse)
    }
  });
};

const handleDelete = async (highlight: Highlight) => {
  if (!confirm('하이라이트를 삭제하시겠습니까?')) return;

  try {
    const success = await deleteHighlight(highlight.id);
    if (success) {
      toast.success('삭제되었습니다');
    } else {
      toast.error('삭제에 실패했습니다');
    }
  } catch (error) {
    toast.error('삭제에 실패했습니다');
  }
};

const { formatRelativeDate } = useDateFormat();

const truncate = (text: string, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
</script>

<style scoped>
.highlights-page {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg-primary, #f9fafb);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}

.back-btn:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.page-header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

/* 필터 */
.filter-bar {
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.filter-row {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
  background: var(--color-bg-card, #fff);
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
}

.color-filter {
  flex: 0 0 auto;
  min-width: 100px;
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 140px);
  padding: 2rem;
  color: var(--text-secondary, #6b7280);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 140px);
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.8125rem;
  opacity: 0.7;
}

.login-btn {
  margin-top: 1rem;
  padding: 0.625rem 1.25rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}

.login-btn:hover {
  background: var(--primary-dark, #4f46e5);
}

/* 하이라이트 목록 */
.highlight-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.highlight-item {
  padding: 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: background 0.2s;
}

.highlight-item:hover {
  background: var(--color-bg-hover, #f9fafb);
}

.highlight-item:last-child {
  border-bottom: none;
}

.highlight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.highlight-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.highlight-date {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
}

.highlight-memo {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.5;
  margin: 0 0 0.5rem;
}

.highlight-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.375rem;
  background: transparent;
  border: none;
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

.action-btn.delete:hover {
  background: var(--color-error-light, #fef2f2);
  color: var(--color-error, #ef4444);
}

/* 다크모드 */
:root.dark .highlights-page {
  background: var(--color-bg-primary);
}

:root.dark .page-header {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .filter-bar {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .filter-select {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
  color: var(--text-primary);
}

:root.dark .highlight-item {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .highlight-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
}
</style>
