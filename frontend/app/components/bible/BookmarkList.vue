<template>
  <div class="bookmark-list">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p>북마크 불러오는 중...</p>
    </div>

    <div v-else-if="bookmarks.length === 0" class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>저장된 북마크가 없습니다</p>
    </div>

    <div v-else class="list">
      <div
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        @click="$emit('select', bookmark)"
      >
        <div class="color-bar" :style="{ backgroundColor: bookmark.color }"></div>

        <div class="content">
          <div class="reference">
            {{ bookmark.book_name }} {{ bookmark.chapter }}장
            <span v-if="bookmark.start_verse">
              {{ bookmark.start_verse }}
              <template v-if="bookmark.end_verse && bookmark.end_verse !== bookmark.start_verse">
                -{{ bookmark.end_verse }}
              </template>
              절
            </span>
          </div>

          <div v-if="bookmark.title" class="title">{{ bookmark.title }}</div>
          <div v-if="bookmark.memo" class="memo">{{ truncateMemo(bookmark.memo) }}</div>
        </div>

        <button class="delete-btn" @click.stop="handleDelete(bookmark.id)" title="삭제">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useBookmarkStore } from '~/stores/bookmark'
import { useBookmark } from '~/composables/useBookmark'

const emit = defineEmits<{
  (e: 'select', bookmark: any): void
}>()

const bookmarkStore = useBookmarkStore()
const { bookmarks, isLoading } = storeToRefs(bookmarkStore)
const { fetchBookmarks, removeBookmark } = useBookmark()

onMounted(() => {
  fetchBookmarks()
})

const truncateMemo = (memo: string, maxLength = 50) => {
  if (memo.length <= maxLength) return memo
  return memo.slice(0, maxLength) + '...'
}

const handleDelete = async (id: number) => {
  if (confirm('이 북마크를 삭제하시겠습니까?')) {
    await removeBookmark(id)
  }
}
</script>

<style scoped>
.bookmark-list {
  height: 100%;
  overflow-y: auto;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-secondary, #6b7280);
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.list {
  padding: 0.5rem;
}

.bookmark-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.bookmark-item:hover {
  background: var(--bg-hover, #f3f4f6);
}

.bookmark-item + .bookmark-item {
  margin-top: 0.25rem;
}

.color-bar {
  width: 4px;
  min-height: 40px;
  align-self: stretch;
  border-radius: 2px;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
}

.reference {
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.title {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin-top: 0.25rem;
}

.memo {
  font-size: 0.8rem;
  color: var(--text-tertiary, #9ca3af);
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  padding: 0.375rem;
  border: none;
  background: transparent;
  color: var(--text-tertiary, #9ca3af);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  flex-shrink: 0;
}

.bookmark-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #EF4444;
}
</style>
