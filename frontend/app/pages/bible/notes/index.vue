<template>
  <div class="notes-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>묵상노트</h1>
    </header>

    <!-- 필터 -->
    <div class="filter-bar">
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
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>묵상노트를 불러오는 중...</p>
    </div>

    <!-- 로그인 필요 -->
    <div v-else-if="!authStore.isAuthenticated" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="14,2 14,8 20,8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>로그인 후 묵상노트를 확인할 수 있습니다</p>
      <NuxtLink to="/login" class="login-btn">로그인</NuxtLink>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="filteredNotes.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="14,2 14,8 20,8" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke-linecap="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke-linecap="round"/>
      </svg>
      <p>{{ filterBook ? '해당 책에 작성된 묵상노트가 없습니다' : '작성된 묵상노트가 없습니다' }}</p>
      <span class="empty-hint">성경을 읽으며 묵상을 기록해보세요</span>
    </div>

    <!-- 노트 목록 -->
    <ul v-else class="note-list">
      <li
        v-for="note in filteredNotes"
        :key="note.id"
        class="note-item"
        @click="goToNote(note.id)"
      >
        <div class="note-header">
          <span class="note-location">
            {{ note.book_name || getBookName(note.book) }} {{ note.chapter }}장
          </span>
          <span class="note-date">{{ formatDate(note.updated_at) }}</span>
        </div>
        <p class="note-preview">{{ truncate(note.content, 120) }}</p>
        <div class="note-meta">
          <span v-if="note.is_private" class="private-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            비공개
          </span>
        </div>
      </li>
    </ul>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNote, type Note } from '~/composables/useNote';
import { useBibleData, BIBLE_BOOKS } from '~/composables/useBibleData';
import { useAuthStore } from '~/stores/auth';
import Toast from '~/components/Toast.vue';

definePageMeta({
  layout: 'default'
});

const router = useRouter();
const authStore = useAuthStore();
const { notes, isNoteLoading: isLoading, fetchNotes } = useNote();
const { getBookName } = useBibleData();

const bibleBooks = BIBLE_BOOKS;
const filterBook = ref('');

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await fetchNotes();
  }
});

const filteredNotes = computed(() => {
  if (!filterBook.value) return notes.value;
  return notes.value.filter(n => n.book === filterBook.value);
});

const goToNote = (id: number) => {
  router.push(`/bible/notes/${id}`);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

const truncate = (text: string, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
</script>

<style scoped>
.notes-page {
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

.filter-select {
  width: 100%;
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

/* 로딩 상태 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
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
  min-height: calc(100vh - 120px);
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

/* 노트 목록 */
.note-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.note-item {
  padding: 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: background 0.2s;
}

.note-item:hover {
  background: var(--color-bg-hover, #f9fafb);
}

.note-item:last-child {
  border-bottom: none;
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.note-location {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--primary-color, #6366f1);
}

.note-date {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
}

.note-preview {
  font-size: 0.875rem;
  color: var(--text-primary, #1f2937);
  line-height: 1.5;
  margin: 0 0 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.private-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
}

/* 다크모드 */
:root.dark .notes-page {
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

:root.dark .note-item {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .note-item:hover {
  background: var(--color-bg-hover);
}
</style>
