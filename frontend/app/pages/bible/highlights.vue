<template>
  <div class="highlights-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>하이라이트</h1>
    </header>

    <div class="placeholder">
      <i class="fa-solid fa-highlighter placeholder-icon"></i>
      <p>Task 3-3에서 구현 예정</p>
    </div>
  </div>
</template>

<script setup>
// Task 3-3에서 구현 예정
definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
.highlights-page {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--background-color);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}

.back-btn:hover {
  background: var(--primary-light);
}

.page-header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.placeholder p {
  font-size: 0.875rem;
}
</style>
