<template>
  <div class="bible-page">
    <div class="placeholder">
      <h1>성경</h1>
      <p>Task 1-3에서 구현 예정</p>
    </div>
  </div>
</template>

<script setup>
// Task 1-3에서 구현 예정
definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
.bible-page {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--background-color);
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.placeholder h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.placeholder p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
