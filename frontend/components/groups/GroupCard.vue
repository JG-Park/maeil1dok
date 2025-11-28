<template>
  <Card clickable @click="handleCardClick" class="group-card">
    <div class="card-header">
      <h3 class="group-name">
        {{ group.name }}
      </h3>
      <span
        :class="[
          'status-badge',
          group.is_public ? 'status-public' : 'status-private'
        ]"
      >
        {{ group.is_public ? '공개' : '비공개' }}
      </span>
    </div>

    <p class="group-description">
      {{ group.description || '설명이 없습니다.' }}
    </p>

    <div class="group-info">
      <div class="info-item plans-item">
        <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        <div class="plans-list">
          <span v-if="!group.plans || group.plans.length === 0">계획 없음</span>
          <span v-else-if="group.plans.length === 1">{{ group.plans[0].name }}</span>
          <div v-else class="multiple-plans">
            <span class="plan-badge" v-for="plan in group.plans" :key="plan.id">{{ plan.name }}</span>
          </div>
        </div>
      </div>
      <div class="info-item">
        <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>{{ group.member_count }}/{{ group.max_members }}명</span>
      </div>
      <div class="info-item">
        <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>{{ group.creator?.nickname || '관리자' }}</span>
      </div>
    </div>

    <div class="card-actions" @click.stop>
      <NuxtLink
        :to="`/groups/${group.id}`"
        class="btn-secondary"
      >
        상세보기
      </NuxtLink>

      <button
        v-if="isAuthenticated && !group.is_member && !group.is_full"
        @click="handleJoin"
        class="btn-primary"
      >
        가입하기
      </button>

      <button
        v-else-if="group.is_member"
        disabled
        class="btn-joined"
      >
        가입됨
      </button>

      <button
        v-else-if="group.is_full"
        disabled
        class="btn-full"
      >
        정원 초과
      </button>
    </div>
  </Card>
</template>

<script setup>
import Card from '../common/Card.vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['join'])

const handleCardClick = () => {
  navigateTo(`/groups/${props.group.id}`)
}

const handleJoin = () => {
  emit('join', props.group.id)
}
</script>

<style scoped>
.group-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 240px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.group-name {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.status-public {
  background: #D1FAE5;
  color: #065F46;
}

.status-private {
  background: var(--gray-100);
  color: var(--gray-700);
}

.group-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.info-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.plans-item {
  align-items: flex-start;
}

.plans-list {
  flex: 1;
}

.multiple-plans {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.plan-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.btn-secondary,
.btn-primary,
.btn-joined,
.btn-full {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

.btn-secondary:hover {
  background: var(--gray-200);
}

.btn-primary {
  background: var(--blue-600);
  color: white;
}

.btn-primary:hover {
  background: var(--blue-700);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-joined {
  background: #D1FAE5;
  color: #065F46;
  cursor: default;
}

.btn-full {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .group-card {
    min-height: 220px;
  }

  .group-name {
    font-size: 1rem;
  }

  .card-actions {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-primary,
  .btn-joined,
  .btn-full {
    width: 100%;
  }
}
</style>
