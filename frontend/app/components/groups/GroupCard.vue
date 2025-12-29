<template>
  <div class="group-card" @click="handleCardClick">
    <div class="card-header">
      <div class="header-top">
        <span
          :class="[
            'status-badge',
            group.is_public ? 'status-public' : 'status-private'
          ]"
        >
          {{ group.is_public ? '공개' : '비공개' }}
        </span>
        <span class="member-count">
          {{ group.member_count }}/{{ group.max_members }}명
        </span>
      </div>
      <h3 class="group-name">
        {{ group.name }}
      </h3>
    </div>

    <p class="group-description">
      {{ group.description || '설명이 없습니다.' }}
    </p>

    <div class="group-meta">
      <div class="meta-row">
        <span class="meta-label">리더</span>
        <span class="meta-value">{{ group.creator?.nickname || '관리자' }}</span>
      </div>
      <div class="meta-row" v-if="group.plans && group.plans.length > 0">
        <span class="meta-label">읽기표</span>
        <div class="plans-wrapper">
          <span class="plan-text" v-if="group.plans.length === 1">{{ group.plans[0].name }}</span>
          <span class="plan-text" v-else>
            {{ group.plans[0].name }} 외 {{ group.plans.length - 1 }}개
          </span>
        </div>
      </div>
    </div>

    <div class="card-actions" @click.stop>
      <NuxtLink
        :to="`/groups/${group.id}`"
        class="btn-action btn-secondary"
      >
        상세보기
      </NuxtLink>

      <button
        v-if="isAuthenticated && !group.is_member && !group.is_full"
        @click="handleJoin"
        class="btn-action btn-primary"
      >
        가입하기
      </button>

      <button
        v-else-if="group.is_member"
        disabled
        class="btn-action btn-disabled"
      >
        가입됨
      </button>

      <button
        v-else-if="group.is_full"
        disabled
        class="btn-action btn-disabled"
      >
        정원 초과
      </button>
    </div>
  </div>
</template>

<script setup>
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
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.group-card:hover {
  border-color: #CBD5E1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
}

.status-public {
  background-color: #F0FDF4;
  color: #15803D;
  border: 1px solid #DCFCE7;
}

.status-private {
  background-color: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.member-count {
  font-size: 0.8125rem;
  color: #64748B;
  font-family: 'Pretendard', sans-serif;
}

.group-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1E293B;
  margin: 0;
  line-height: 1.4;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: -0.02em;
}

.group-description {
  font-size: 0.875rem;
  color: #475569;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.625rem; /* 2 lines height */
}

.group-meta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-top: 0.75rem;
  border-top: 1px solid #F1F5F9;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
}

.meta-label {
  color: #94A3B8;
  min-width: 2.5rem;
}

.meta-value, .plan-text {
  color: #334155;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-action {
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'Pretendard', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-secondary {
  background: white;
  border: 1px solid #E2E8F0;
  color: #475569;
}

.btn-secondary:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  color: #1E293B;
}

.btn-primary {
  background: #1E293B;
  border: 1px solid #1E293B;
  color: white;
}

.btn-primary:hover {
  background: #334155;
  border-color: #334155;
}

.btn-disabled {
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  color: #94A3B8;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .group-card {
    padding: 1rem;
  }
}
</style>
