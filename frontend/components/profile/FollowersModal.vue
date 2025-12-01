<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">팔로워</h3>
            <button class="close-button" @click="handleClose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-content">
            <div v-if="isLoading" class="loading-container">
              <div class="loading-spinner"></div>
              <p class="loading-text">로딩 중...</p>
            </div>
            <div v-else-if="followers.length > 0" class="followers-list">
              <div
                v-for="follower in followers"
                :key="follower.id"
                class="follower-item"
                @click="navigateToProfile(follower.id)"
              >
                <img
                  v-if="follower.profile_image && !avatarErrors[follower.id]"
                  :src="follower.profile_image"
                  :alt="follower.nickname"
                  class="follower-avatar"
                  @error="() => handleImageError(follower.id)"
                >
                <div v-else class="follower-avatar-placeholder">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="follower-info">
                  <div class="follower-nickname">{{ follower.nickname }}</div>
                  <div v-if="follower.bio" class="follower-bio">{{ follower.bio }}</div>
                </div>
                <button
                  v-if="!follower.is_me"
                  :class="['follow-button', follower.is_following ? 'following' : '']"
                  @click.stop="toggleFollow(follower)"
                >
                  {{ follower.is_following ? '팔로잉' : '팔로우' }}
                </button>
              </div>
            </div>

            <EmptyState
              v-else
              title="팔로워가 없습니다"
              description="다른 사용자들과 교류해보세요!"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import EmptyState from '../common/EmptyState.vue'

const avatarErrors = ref({})

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  followersData: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'toggleFollow'])

// Mock followers data
const mockFollowers = [
  {
    id: 1,
    nickname: '김철수',
    profile_image: null,
    bio: '매일 성경을 읽는 청년입니다',
    is_following: true,
    is_me: false
  },
  {
    id: 2,
    nickname: '이영희',
    profile_image: null,
    bio: null,
    is_following: false,
    is_me: false
  },
  {
    id: 3,
    nickname: '박민수',
    profile_image: null,
    bio: '함께 성경을 읽어요!',
    is_following: true,
    is_me: false
  }
]

const followers = computed(() => {
  return props.followersData.length > 0 ? props.followersData : mockFollowers
})

const handleClose = () => {
  emit('close')
}

const navigateToProfile = (userId) => {
  handleClose()
  navigateTo(`/profile/${userId}`)
}

const toggleFollow = (follower) => {
  emit('toggleFollow', follower)
}

const handleImageError = (userId) => {
  avatarErrors.value[userId] = true
}
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

.followers-list {
  display: flex;
  flex-direction: column;
}

.follower-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.follower-item:hover {
  background: var(--gray-50);
}

.follower-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--gray-200);
  flex-shrink: 0;
}

.follower-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 1.25rem;
  flex-shrink: 0;
}

.follower-info {
  flex: 1;
  min-width: 0;
}

.follower-nickname {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follower-bio {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follow-button {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.follow-button:hover {
  background: var(--primary-color);
  color: white;
}

.follow-button.following {
  background: var(--primary-color);
  color: white;
}

.follow-button.following:hover {
  background: white;
  color: var(--primary-color);
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

  .follower-item {
    padding: 0.75rem 1rem;
  }

  .follower-avatar,
  .follower-avatar-placeholder {
    width: 40px;
    height: 40px;
  }

  .follower-avatar-placeholder {
    font-size: 1rem;
  }

  .follow-button {
    padding: 0.4rem 0.875rem;
    font-size: 0.8125rem;
  }
}
</style>
