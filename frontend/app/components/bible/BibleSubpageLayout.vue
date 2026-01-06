<template>
  <div class="bible-subpage">
    <header class="page-header">
      <button class="back-btn" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>{{ title }}</h1>
      <div class="header-actions">
        <slot name="actions" />
      </div>
    </header>

    <!-- 필터 슬롯 -->
    <slot name="filter" />

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ loadingText }}</p>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="empty" class="empty-state">
      <slot name="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </slot>
      <p>{{ emptyText }}</p>
      <span v-if="emptyHint" class="empty-hint">{{ emptyHint }}</span>
      <slot name="empty-action" />
    </div>

    <!-- 컨텐츠 -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Props {
  title: string;
  loading?: boolean;
  loadingText?: string;
  empty?: boolean;
  emptyText?: string;
  emptyHint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: '불러오는 중...',
  empty: false,
  emptyText: '데이터가 없습니다',
  emptyHint: '',
});

const router = useRouter();

const handleBack = () => {
  router.back();
};
</script>

<style scoped>
.bible-subpage {
  min-height: 100vh;
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
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.page-header h1 {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  gap: 1rem;
  color: var(--text-secondary, #6b7280);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 0.9375rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem;
  color: var(--text-secondary, #6b7280);
  text-align: center;
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
  margin-bottom: 1rem;
}

/* 다크모드 */
:root.dark .bible-subpage {
  background: var(--color-bg-primary);
}

:root.dark .page-header {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .back-btn {
  color: var(--text-primary);
}

:root.dark .back-btn:hover {
  background: var(--color-bg-hover);
}

:root.dark .page-header h1 {
  color: var(--text-primary);
}

:root.dark .loading-state,
:root.dark .empty-state {
  color: var(--text-secondary);
}

:root.dark .loading-spinner {
  border-color: var(--color-border);
  border-top-color: var(--color-primary);
}
</style>
