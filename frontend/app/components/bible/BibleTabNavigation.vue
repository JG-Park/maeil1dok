<template>
  <nav class="bible-tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab-btn', { active: activeTab === tab.id }]"
      @click="$emit('change', tab.id)"
    >
      <svg v-if="tab.id === 'reading'" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: 'reading' | 'plan'
}>()

defineEmits<{
  (e: 'change', tab: 'reading' | 'plan'): void
}>()

const tabs = [
  { id: 'reading' as const, label: '성경읽기' },
  { id: 'plan' as const, label: '통독플랜' },
]
</script>

<style scoped>
.bible-tab-nav {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-color, #fff);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  background: var(--bg-hover, #f9fafb);
}

.tab-btn.active {
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color, #3b82f6);
}

.tab-btn svg {
  flex-shrink: 0;
}
</style>
