<template>
  <BaseModal
    :model-value="isOpen"
    :title="title"
    size="lg"
    :close-on-overlay="true"
    :close-on-esc="true"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <div class="user-list-content">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">로딩 중...</p>
      </div>
      <div v-else-if="users.length > 0" class="users-list">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-item"
          @click="navigateToProfile(user.id)"
        >
          <UserAvatar
            :src="user.profile_image"
            :alt="user.nickname"
            size="md"
          />
          <div class="user-info">
            <div class="user-nickname">{{ user.nickname }}</div>
            <div v-if="user.bio" class="user-bio">{{ user.bio }}</div>
          </div>
          <slot name="action" :user="user" :loading="loadingIds[user.id]">
            <!-- 기본 액션 버튼 슬롯 -->
          </slot>
        </div>
      </div>

      <EmptyState
        v-else
        :title="emptyTitle"
        :description="emptyDescription"
      />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserAvatar from './UserAvatar.vue'
import EmptyState from './EmptyState.vue'
import BaseModal from '~/components/ui/modal/BaseModal.vue'

export interface UserItem {
  id: number
  nickname: string
  profile_image?: string | null
  bio?: string
  is_following?: boolean
  is_me?: boolean
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  title: string
  users: UserItem[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
}>(), {
  isLoading: false,
  emptyTitle: '목록이 비어있습니다',
  emptyDescription: ''
})

const emit = defineEmits<{
  close: []
  userClick: [user: UserItem]
  action: [user: UserItem]
}>()

const loadingIds = ref<Record<number, boolean>>({})

const handleClose = () => {
  emit('close')
}

const navigateToProfile = (userId: number) => {
  handleClose()
  navigateTo(`/profile/${userId}`)
}

// 외부에서 로딩 상태 제어
const setUserLoading = (userId: number, loading: boolean) => {
  loadingIds.value[userId] = loading
}

// 외부 노출
defineExpose({
  setUserLoading,
  loadingIds
})
</script>

<style scoped>
.user-list-content {
  min-height: 200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #E2E8F0);
  border-top-color: var(--primary-color, #617475);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 1rem;
  color: var(--text-secondary, #64748B);
  font-size: 0.875rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.users-list {
  display: flex;
  flex-direction: column;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  cursor: pointer;
  transition: background var(--transition-fast, 0.15s);
  border-radius: 8px;
  margin: 0 -0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.user-item:hover {
  background: var(--color-bg-hover, #F8FAFC);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-nickname {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-bio {
  font-size: 0.8125rem;
  color: var(--text-secondary, #64748B);
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dark mode support */
:root.dark .user-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .user-nickname {
  color: var(--text-primary);
}

:root.dark .user-bio {
  color: var(--text-secondary);
}
</style>
