<template>
  <button
    :disabled="isLoading"
    :class="['follow-btn', { 'following': isFollowing, 'loading': isLoading }]"
    @click.stop="handleClick"
  >
    <span v-if="isLoading" class="btn-loading-spinner"></span>
    <span v-else>{{ buttonText }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  isFollowing: boolean
  isLoading?: boolean
  followText?: string
  followingText?: string
}>(), {
  isLoading: false,
  followText: '팔로우',
  followingText: '팔로잉'
})

const emit = defineEmits<{
  click: []
}>()

const buttonText = computed(() =>
  props.isFollowing ? props.followingText : props.followText
)

const handleClick = () => {
  if (!props.isLoading) {
    emit('click')
  }
}
</script>

<style scoped>
.follow-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  min-width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.follow-btn:hover {
  background: var(--primary-color);
  color: white;
}

.follow-btn.following {
  background: var(--primary-color);
  color: white;
}

.follow-btn.following:hover {
  background: white;
  color: var(--primary-color);
}

.follow-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.follow-btn.loading {
  pointer-events: none;
}

.btn-loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.75s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .follow-btn {
    padding: 0.4rem 0.875rem;
    font-size: 0.8125rem;
    min-width: 64px;
  }
}
</style>
