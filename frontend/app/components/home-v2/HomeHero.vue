<template>
  <section class="hero-section">
    <div class="greeting">{{ greetingMessage }}</div>
    <h1 class="hero-title">
      {{ timeGreeting }}<br>
      <strong>말씀과 동행하세요</strong>
    </h1>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthService } from '~/composables/useAuthService';

const auth = useAuthService();

const greetingMessage = computed(() => {
  if (auth.isAuthenticated.value && auth.user.value) {
    const name = auth.user.value.nickname || auth.user.value.username || '성도';
    return `${name}님, 안녕하세요`;
  }
  return '방문자님, 환영합니다';
});

const timeGreeting = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '새로운 아침,';
  if (hour >= 12 && hour < 18) return '나른한 오후,';
  if (hour >= 18 && hour < 22) return '하루를 마무리하며';
  return '평안한 밤,';
});
</script>

<style scoped>
.hero-section {
  margin: 1rem 0 0.5rem;
}

.greeting {
  font-size: min(0.875rem, 14px);
  color: var(--text-sub);
  margin-bottom: 0.25rem;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: min(2rem, 32px);
  font-weight: 300;
  line-height: 1.25;
  color: var(--text-main);
}

.hero-title strong {
  font-weight: 700;
  position: relative;
}

@media (max-width: 480px) {
  .hero-title {
    font-size: min(1.75rem, 28px);
  }
}
</style>