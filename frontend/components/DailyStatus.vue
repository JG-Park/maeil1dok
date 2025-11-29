<template>
  <div class="daily-status section">
    <div class="date">
      {{ currentDate }}
    </div>
    <div class="message">
      {{ welcomeMessage }}
    </div>
    <div class="progress-text">성경일독 진도율: {{ progressPercentage }}%</div>
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
    2: '오늘도 주님의 은혜 안에 안온하시길 기도합니다 🙏🏻',
    3: '오늘도 주님과 동행하며 달려가요 🏃',
    4: '오늘도 주님의 인도하심을 따라가요 👊',
    5: '기쁜 금요일! 말씀 안에서 마무리해요 🌟',
    6: '이번 주 받은 은혜를 돌아보며 감사해보아요 🤗'
  }

  // 시간대별 수식어
  let timePrefix = ''
  if (hour >= 5 && hour < 11) {
    timePrefix = ''
  } else if (hour >= 11 && hour < 14) {
    timePrefix = ''
  } else if (hour >= 14 && hour < 17) {
    timePrefix = ''
  } else if (hour >= 17 && hour < 21) {
    timePrefix = ''
  } else {
    timePrefix = ''
  }

  return `${timePrefix} ${dayMessages[day]}`
})

function getDayOfWeek(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

const startDate = new Date('2025-02-03')
const endDate = new Date('2025-12-27')
const totalWeeks = 45
const readingsPerWeek = 6

const progressPercentage = computed(() => {
  const today = new Date()
  
  // 시작일 이전이면 0% 반환
  if (today < startDate) return 0
  
  // 종료일 이후면 100% 반환
  if (today > endDate) return 100
  
  // 전체 읽기 횟수 계산
  const totalReadings = totalWeeks * readingsPerWeek
  
  // 현재까지 진행된 주차 계산
  const timeElapsed = today - startDate
  const weeksElapsed = Math.floor(timeElapsed / (7 * 24 * 60 * 60 * 1000))
  
  // 현재 주차의 진행된 일수 계산
  const daysInCurrentWeek = Math.floor((timeElapsed % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
  
  // 완료된 읽기 횟수 계산
  const completedReadings = (weeksElapsed * readingsPerWeek) + Math.min(daysInCurrentWeek, readingsPerWeek)
  
  // 진도율 계산 및 소숫점 2자리까지 표현
  const percentage = (completedReadings / totalReadings) * 100
  return Number(percentage.toFixed(2))
})

// 진도율을 store에 반영
const updateProgress = computed(() => {
  const progress = progressPercentage.value
  // store의 progress 업데이트 로직이 있다면 여기에 추가
  return progress
})
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

.progress-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: none; /* 상단의 진도율 텍스트 숨김 */
}

/* Tablet: Increased spacing and font sizes */
@media (min-width: 768px) {
  .daily-status {
    margin: 1.5rem;
    padding: 1.5rem;
    border-radius: 0.75rem;
  }

  .date {
    font-size: 1rem;
  }

  .message {
    margin-top: 0.75rem;
    font-size: 1.3rem;
    line-height: 1.5;
  }

  .progress-text {
    margin-top: 1.25rem;
    font-size: 1rem;
  }
}

/* Tablet Large: Even more spacing and larger fonts */
@media (min-width: 1024px) {
  .daily-status {
    margin: 2rem;
    padding: 2rem;
    border-radius: 1rem;
  }

  .date {
    font-size: 1.125rem;
  }

  .message {
    margin-top: 1rem;
    font-size: 1.5rem;
    line-height: 1.6;
  }

  .progress-text {
    margin-top: 1.5rem;
    font-size: 1.125rem;
  }
}
</style> 