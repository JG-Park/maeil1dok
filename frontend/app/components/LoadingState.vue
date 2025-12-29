<template>
  <div class="loading-state">
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: '로딩 중...'
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  min-height: 200px;
}

.spinner-container {
  position: relative;
  width: 40px;
  height: 40px;
  margin-bottom: 1rem;
}

.spinner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 3px solid #E5E7EB;
  border-top-color: var(--primary-color, #617475);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  color: var(--text-secondary, #666666);
  font-size: 0.875rem;
  margin: 0;
  text-align: center;
}
</style>