<template>
  <div class="empty-state fade-in">
    <div class="empty-icon">
      <slot name="icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </slot>
    </div>

    <h3 class="empty-title">{{ title }}</h3>

    <p v-if="description" class="empty-description">{{ description }}</p>

    <div v-if="actionText || $slots.action" class="empty-action">
      <slot name="action">
        <button v-if="actionText" @click="handleAction" class="empty-button">
          {{ actionText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '데이터가 없습니다'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['action'])

const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  min-height: 300px;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--gray-100);
  color: var(--gray-400);
  margin-bottom: 1.5rem;
}

.empty-icon :deep(svg) {
  width: 48px;
  height: 48px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  line-height: 1.5;
}

.empty-action {
  margin-top: 0.5rem;
}

.empty-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary-color);
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.empty-button:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.empty-button:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .empty-state {
    padding: 2rem 1rem;
    min-height: 250px;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
  }

  .empty-icon :deep(svg) {
    width: 40px;
    height: 40px;
  }

  .empty-title {
    font-size: 1.125rem;
  }

  .empty-description {
    font-size: 0.875rem;
  }
}
</style>
