<template>
  <div class="profile-groups fade-in">
    <div v-if="groups.length > 0" class="groups-list">
      <div
        v-for="group in groups"
        :key="group.id"
        class="group-item"
        @click="navigateToGroup(group.id)"
      >
        <div class="group-header">
          <div class="group-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="group-info">
            <h4 class="group-name">{{ group.name }}</h4>
            <p class="group-plan">{{ group.plan?.name || '계획 없음' }}</p>
          </div>
          <span
            :class="[
              'status-badge',
              group.is_public ? 'status-public' : 'status-private'
            ]"
          >
            {{ group.is_public ? '공개' : '비공개' }}
          </span>
        </div>

        <p v-if="group.description" class="group-description">
          {{ group.description }}
        </p>

        <div class="group-footer">
          <div class="member-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>{{ group.member_count }}/{{ group.max_members }}명</span>
          </div>
          <div class="group-role">
            {{ group.role === 'creator' ? '그룹장' : '멤버' }}
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      title="가입된 그룹이 없습니다"
      description="다른 사용자들과 함께 성경을 읽어보세요!"
      action-text="그룹 둘러보기"
      @action="navigateToGroups"
    >
      <template #icon>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </template>
    </EmptyState>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from '../common/EmptyState.vue'

const props = defineProps({
  groupsData: {
    type: Array,
    default: () => []
  }
})

// Mock groups data
const mockGroups = [
  {
    id: 1,
    name: '푸른교회 청년부',
    description: '함께 성경을 읽고 나누는 청년 모임입니다.',
    is_public: false,
    plan: { name: '45주 통독' },
    member_count: 12,
    max_members: 20,
    role: 'creator'
  },
  {
    id: 2,
    name: '성경통독 스터디',
    description: '매일 아침 성경을 읽고 서로 격려하는 그룹',
    is_public: true,
    plan: { name: '1년 통독' },
    member_count: 8,
    max_members: 15,
    role: 'member'
  },
  {
    id: 3,
    name: '새벽 기도 모임',
    description: null,
    is_public: false,
    plan: { name: '45주 통독' },
    member_count: 5,
    max_members: 10,
    role: 'member'
  }
]

const groups = computed(() => {
  return props.groupsData.length > 0 ? props.groupsData : mockGroups
})

const navigateToGroup = (groupId) => {
  navigateTo(`/groups/${groupId}`)
}

const navigateToGroups = () => {
  navigateTo('/groups')
}
</script>

<style scoped>
.profile-groups {
  padding: 1rem;
  min-height: 300px;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-item {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.group-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.group-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-color);
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-plan {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
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
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.group-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-200);
}

.member-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.member-count svg {
  width: 16px;
  height: 16px;
}

.group-role {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--primary-color);
  background: var(--primary-light);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
}

@media (max-width: 640px) {
  .group-item {
    padding: 1rem;
  }

  .group-header {
    flex-wrap: wrap;
  }

  .status-badge {
    order: 3;
    margin-left: auto;
  }
}
</style>
