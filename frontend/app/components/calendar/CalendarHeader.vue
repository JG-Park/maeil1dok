<template>
  <div class="calendar-header">
    <div class="header-top">
      <h2 class="month-title">{{ year }}년 {{ month }}월</h2>
      <div v-if="!readonly" class="header-actions">
        <button
          class="action-btn"
          :disabled="isLoading"
          @click="$emit('go-incomplete')"
          title="미완료 위치로 이동"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>
        <button
          class="action-btn"
          :disabled="isLoading"
          @click="$emit('settings')"
          title="캘린더 설정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="nav-controls">
      <button
        class="nav-btn"
        :disabled="isLoading"
        @click="$emit('prev')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <button
        class="today-btn"
        :disabled="isLoading"
        @click="$emit('today')"
      >
        오늘
      </button>

      <button
        class="nav-btn"
        :disabled="isLoading"
        @click="$emit('next')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  year: number
  month: number
  isLoading: boolean
  readonly?: boolean
}>()

defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'today'): void
  (e: 'go-incomplete'): void
  (e: 'settings'): void
}>()
</script>

<style scoped>
.calendar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-slate-200);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.month-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-slate-800);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--color-slate-100);
  border-radius: 8px;
  color: var(--color-slate-500);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-slate-200);
  color: var(--color-accent-secondary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--color-slate-100);
  border-radius: 8px;
  color: var(--color-slate-500);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: var(--color-slate-200);
  color: var(--color-slate-800);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.today-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-slate-200);
  background: var(--color-bg-card);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-accent-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.today-btn:hover:not(:disabled) {
  background: var(--color-info-bg);
  border-color: var(--color-accent-secondary);
}

.today-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .calendar-header {
    padding: 0.75rem;
  }

  .month-title {
    font-size: 1.125rem;
  }

  .action-btn,
  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .today-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>
