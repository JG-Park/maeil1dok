<template>
  <div class="daily-status section">
    <div class="date">
      {{ currentDate }}
    </div>
    <div class="message">
      활기찬 월요일 기도로 열어보아요 😀
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const currentDate = computed(() => {
  const date = new Date();
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${getDayOfWeek(date)})`;
});

function getDayOfWeek(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}
</script>

<style scoped>
.daily-status {
  background: white;
  margin: 1rem;
}

.date {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.message {
  margin-top: 0.5rem;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 500;
}
</style> 