<template>
  <div v-if="isActive && schedule" class="tongdok-indicator">
    <div class="indicator-content">
      <span class="mode-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        통독모드
      </span>

      <span class="schedule-info">
        {{ bookName }} {{ schedule.start_chapter }}<template v-if="schedule.start_chapter !== schedule.end_chapter">-{{ schedule.end_chapter }}</template>장
      </span>

      <span class="progress-info">
        {{ currentProgress }}/{{ totalChapters }}장
      </span>

      <button class="exit-btn" @click="$emit('exit')" title="통독모드 종료">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BOOK_NAMES } from '~/constants/bible'

const props = defineProps<{
  isActive: boolean
  schedule: {
    book: string
    start_chapter: number
    end_chapter: number
    is_complete: boolean
  } | null
  currentChapter: number
}>()

defineEmits<{
  (e: 'exit'): void
}>()

const bookName = computed(() =>
  props.schedule ? BOOK_NAMES[props.schedule.book] || '' : ''
)

const totalChapters = computed(() =>
  props.schedule ? props.schedule.end_chapter - props.schedule.start_chapter + 1 : 0
)

const currentProgress = computed(() => {
  if (!props.schedule) return 0
  return Math.min(
    props.currentChapter - props.schedule.start_chapter + 1,
    totalChapters.value
  )
})

const progressPercent = computed(() => {
  if (!props.schedule || totalChapters.value === 0) return 0
  return Math.min(100, (currentProgress.value / totalChapters.value) * 100)
})
</script>

<style scoped>
.tongdok-indicator {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: white;
  padding: 0.625rem 1rem 0.5rem;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
}

.mode-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.75rem;
}

.schedule-info {
  flex: 1;
  font-weight: 500;
}

.progress-info {
  font-weight: 500;
  opacity: 0.9;
}

.exit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
