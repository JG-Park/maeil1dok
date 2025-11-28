<template>
  <div class="profile-achievements fade-in">
    <div v-if="achievements.length > 0" class="achievements-grid">
      <div
        v-for="achievement in achievements"
        :key="achievement.id"
        class="achievement-card"
        :class="{ unlocked: achievement.unlocked }"
        :title="achievement.description"
      >
        <div class="achievement-icon">
          <span class="icon-emoji">{{ achievement.icon }}</span>
        </div>
        <h4 class="achievement-title">{{ achievement.title }}</h4>
        <p class="achievement-description">{{ achievement.description }}</p>
        <div v-if="achievement.unlocked" class="unlock-date">
          {{ formatDate(achievement.unlockedAt) }}
        </div>
        <div v-else class="locked-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      title="아직 획득한 업적이 없습니다"
      description="성경 통독을 완료하여 업적을 획득하세요!"
    >
      <template #icon>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </template>
    </EmptyState>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from '../common/EmptyState.vue'

const props = defineProps({
  achievementsData: {
    type: Array,
    default: () => []
  }
})

// Mock achievements data
const mockAchievements = [
  {
    id: 1,
    title: '첫 걸음',
    description: '첫 번째 성경 읽기 완료',
    icon: '🎯',
    unlocked: true,
    unlockedAt: '2024-01-15'
  },
  {
    id: 2,
    title: '일주일 연속',
    description: '7일 연속 성경 읽기',
    icon: '🔥',
    unlocked: true,
    unlockedAt: '2024-01-22'
  },
  {
    id: 3,
    title: '한 달 완주',
    description: '30일 연속 성경 읽기',
    icon: '⭐',
    unlocked: true,
    unlockedAt: '2024-02-14'
  },
  {
    id: 4,
    title: '꾸준함의 달인',
    description: '100일 연속 성경 읽기',
    icon: '🏆',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 5,
    title: '완독 달성',
    description: '성경 전체 읽기 완료',
    icon: '📖',
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 6,
    title: '소셜 리더',
    description: '10명 이상의 팔로워 확보',
    icon: '👥',
    unlocked: false,
    unlockedAt: null
  }
]

const achievements = computed(() => {
  return props.achievementsData.length > 0 ? props.achievementsData : mockAchievements
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.profile-achievements {
  padding: 1rem;
  min-height: 300px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.achievement-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background: white;
  border-radius: var(--radius-lg);
  border: 2px solid var(--gray-200);
  text-align: center;
  transition: all var(--transition-normal);
}

.achievement-card.unlocked {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, white 0%, var(--primary-light) 100%);
}

.achievement-card.unlocked:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.achievement-card:not(.unlocked) {
  opacity: 0.5;
  filter: grayscale(100%);
}

.achievement-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gray-100);
  margin-bottom: 1rem;
}

.achievement-card.unlocked .achievement-icon {
  background: var(--primary-color);
}

.icon-emoji {
  font-size: 2rem;
}

.achievement-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.achievement-description {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.unlock-date {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 500;
}

.locked-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .achievements-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .achievement-card {
    padding: 1.25rem 0.75rem;
  }

  .achievement-icon {
    width: 56px;
    height: 56px;
  }

  .icon-emoji {
    font-size: 1.75rem;
  }
}
</style>
