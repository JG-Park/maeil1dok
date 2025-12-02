<template>
  <div class="profile-achievements fade-in">
    <div v-if="achievements.length > 0" class="achievements-grid">
      <div
        v-for="achievement in achievements"
        :key="achievement.achievement_type"
        class="achievement-card"
        :class="{ unlocked: achievement.unlocked }"
        :title="achievement.description"
      >
        <div class="achievement-icon">
          <i :class="achievement.icon"></i>
        </div>
        <h4 class="achievement-title">{{ achievement.title }}</h4>
        <p class="achievement-description">{{ achievement.description }}</p>
        <div v-if="achievement.unlocked" class="unlock-date">
          {{ formatDate(achievement.unlockedAt) }}
        </div>
        <div v-else class="locked-overlay">
          <i class="fa-solid fa-lock"></i>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      title="업적 정보를 불러올 수 없습니다"
      description="잠시 후 다시 시도해주세요."
    >
      <template #icon>
        <i class="fa-solid fa-trophy empty-icon"></i>
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '../common/EmptyState.vue'

interface Achievement {
  id: number | null
  achievement_type: string
  title: string
  description: string
  icon: string
  order: number
  unlocked: boolean
  unlockedAt: string | null
  milestone_value: number
}

const props = defineProps<{
  achievementsData: Achievement[]
}>()

// 실제 API 데이터만 사용 (Mock 데이터 제거)
const achievements = computed(() => props.achievementsData)

const formatDate = (dateString: string | null) => {
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

.achievement-icon i {
  font-size: 1.75rem;
  color: var(--gray-400);
}

.achievement-card.unlocked .achievement-icon i {
  color: white;
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

.locked-overlay i {
  font-size: 1.25rem;
}

.empty-icon {
  font-size: 3rem;
  color: var(--gray-300);
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

  .achievement-icon i {
    font-size: 1.5rem;
  }
}
</style>
