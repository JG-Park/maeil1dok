<template>
  <div class="daily-status section">
    <div class="date">
      {{ currentDate }}
    </div>
    <div class="message">
      {{ welcomeMessage }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const currentDate = computed(() => {
  const date = new Date();
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${getDayOfWeek(date)})`;
});

const welcomeMessage = computed(() => {
  const hour = new Date().getHours()
  const day = new Date().getDay()

  // 요일별 기본 메시지
  const dayMessages = {
    0: '주님의 날, 예배로 나아가요 ⛪',
    1: '새로운 한 주, 말씀과 함께 시작해요 📖',
    2: '화요일도 주님의 은혜 안에서 힘차게! 💪',
    3: '수요일, 주님과 동행하며 달려가요 🏃',
    4: '목요일입니다. 주님의 인도하심을 따라가요 👊',
    5: '금요일이에요. 말씀 안에서 마무리해요 🌟',
    6: '토요일, 이번 주 받은 은혜를 돌아보세요 🤗'
  }

  // 시간대별 수식어
  let timePrefix = ''
  if (hour >= 5 && hour < 11) {
    timePrefix = '새 아침의 은혜,'
  } else if (hour >= 11 && hour < 14) {
    timePrefix = '은혜로운 점심,'
  } else if (hour >= 14 && hour < 17) {
    timePrefix = '주님과 함께하는 오후,'
  } else if (hour >= 17 && hour < 21) {
    timePrefix = '평안한 저녁,'
  } else {
    timePrefix = '고요한 밤,'
  }

  return `${timePrefix} ${dayMessages[day]}`
})

function getDayOfWeek(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}
</script>

<style scoped>
.daily-status {
  background: white;
  margin: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
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
  line-height: 1.4;
}
</style> 