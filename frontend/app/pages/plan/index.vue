<template>
  <div class="plan-page">
    <div class="placeholder">
      <h1>통독표</h1>
      <p>Task 1-3에서 기존 reading-plan.vue 이관 예정</p>
      <NuxtLink to="/reading-plan" class="temp-link">
        기존 통독표로 이동
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
// Task 1-3에서 기존 reading-plan.vue 내용 이관 예정
definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
.plan-page {
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
  margin-bottom: 1rem;
}

.temp-link {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.temp-link:hover {
  background: var(--primary-dark);
}
</style>
