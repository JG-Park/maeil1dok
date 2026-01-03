<template>
  <button
    :class="['bookmark-btn', { active: isBookmarked }]"
    @click="handleClick"
    :title="isBookmarked ? '북마크 제거' : '북마크 추가'"
  >
    <svg v-if="isBookmarked" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"/>
    </svg>
    <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBookmarkStore } from '~/stores/bookmark'

const props = defineProps<{
  book: string
  chapter: number
  verse?: number
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'add'): void
  (e: 'remove', id: number): void
}>()

const bookmarkStore = useBookmarkStore()

const isBookmarked = computed(() =>
  bookmarkStore.hasBookmark(props.book, props.chapter, props.verse)
)

const handleClick = () => {
  emit('toggle')
}
</script>

<style scoped>
.bookmark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
}

.bookmark-btn:hover {
  color: var(--primary-color, #3b82f6);
}

.bookmark-btn.active {
  color: #F59E0B;
}
</style>
