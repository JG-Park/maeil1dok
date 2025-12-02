<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="close-button" @click="handleClose">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-content">
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UserAvatar from './UserAvatar.vue'
import EmptyState from './EmptyState.vue'

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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 1.25rem;
}

.close-button:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
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
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 1rem;
  color: var(--text-secondary);
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
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.user-item:hover {
  background: var(--gray-50);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-nickname {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-bio {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-normal);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform var(--transition-normal);
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .modal-container {
    max-height: 90vh;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .user-item {
    padding: 0.75rem 1rem;
  }
}
</style>
