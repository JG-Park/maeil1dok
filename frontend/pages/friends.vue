<template>
  <div class="container">
    <!-- 고정 헤더 -->
    <div class="header fade-in">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>친구</h1>
      <div style="width: 64px"></div>
    </div>
    
    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <!-- 탭 -->
      <div class="tabs fade-in" style="animation-delay: 0.1s">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'friends' }"
          @click="activeTab = 'friends'"
        >
          친구
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'followers' }"
          @click="activeTab = 'followers'"
        >
          팔로워
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'following' }"
          @click="activeTab = 'following'"
        >
          팔로잉
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'search' }"
          @click="activeTab = 'search'"
        >
          검색
        </button>
      </div>

      <!-- 검색 바 (검색 탭일 때만) -->
      <div v-if="activeTab === 'search'" class="search-bar fade-in" style="animation-delay: 0.2s">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="사용자 검색..."
          class="search-input"
          @input="searchUsers"
        >
      </div>

      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>로딩 중...</p>
      </div>
      
      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="() => { error = null; onMounted() }" class="retry-button">
          다시 시도
        </button>
      </div>
      
      <!-- 사용자 목록 -->
      <div v-else class="users-list">
        <!-- 친구 목록 -->
        <div v-if="activeTab === 'friends'">
          <div v-if="friendsList.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>아직 친구가 없습니다</p>
            <p class="empty-subtitle">서로 팔로우하는 사용자가 친구로 표시됩니다</p>
          </div>
          <UserCard 
            v-for="user in friendsList" 
            :key="user.id"
            :user="user"
            @follow="handleFollow"
            @unfollow="handleUnfollow"
            class="fade-in"
          />
        </div>

        <!-- 팔로워 목록 -->
        <div v-else-if="activeTab === 'followers'">
          <div v-if="followersList.length === 0" class="empty-state">
            <p>팔로워가 없습니다</p>
          </div>
          <UserCard 
            v-for="user in followersList" 
            :key="user.id"
            :user="user"
            @follow="handleFollow"
            @unfollow="handleUnfollow"
            class="fade-in"
          />
        </div>

        <!-- 팔로잉 목록 -->
        <div v-else-if="activeTab === 'following'">
          <div v-if="followingList.length === 0" class="empty-state">
            <p>팔로잉하는 사용자가 없습니다</p>
          </div>
          <UserCard 
            v-for="user in followingList" 
            :key="user.id"
            :user="user"
            @follow="handleFollow"
            @unfollow="handleUnfollow"
            class="fade-in"
          />
        </div>

        <!-- 검색 결과 -->
        <div v-else-if="activeTab === 'search'">
          <div v-if="searchResults.length === 0 && searchQuery" class="empty-state">
            <p>검색 결과가 없습니다</p>
          </div>
          <div v-else-if="!searchQuery" class="empty-state">
            <p>사용자를 검색해보세요</p>
          </div>
          <UserCard 
            v-for="user in searchResults" 
            :key="user.id"
            :user="user"
            @follow="handleFollow"
            @unfollow="handleUnfollow"
            class="fade-in"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import UserCard from '~/components/UserCard.vue'

const authStore = useAuthStore()
const activeTab = ref('friends')
const searchQuery = ref('')

const friendsList = ref([])
const followersList = ref([])
const followingList = ref([])
const searchResults = ref([])

const isLoading = ref(false)
const error = ref(null)

// 친구 목록 가져오기
const fetchFriends = async () => {
  try {
    const response = await useApi().get('/api/v1/accounts/friends/')
    if (response.data?.success) {
      friendsList.value = response.data.friends.map(friend => ({
        ...friend,
        is_friend: true,
        is_mutual_follow: true
      }))
    }
  } catch (err) {
    console.error('친구 목록 조회 실패:', err)
    error.value = '친구 목록을 불러올 수 없습니다.'
  }
}

// 팔로워 목록 가져오기
const fetchFollowers = async () => {
  if (!authStore.user) return
  
  try {
    const response = await useApi().get(`/api/v1/accounts/followers/${authStore.user.id}/`)
    if (response.data?.success) {
      followersList.value = response.data.followers
    }
  } catch (error) {
    console.error('팔로워 목록 조회 실패:', error)
  }
}

// 팔로잉 목록 가져오기
const fetchFollowing = async () => {
  if (!authStore.user) return
  
  try {
    const response = await useApi().get(`/api/v1/accounts/following/${authStore.user.id}/`)
    if (response.data?.success) {
      followingList.value = response.data.following
    }
  } catch (error) {
    console.error('팔로잉 목록 조회 실패:', error)
  }
}

// 사용자 검색
const searchUsers = async () => {
  if (!searchQuery.value) {
    searchResults.value = []
    return
  }
  
  try {
    const response = await useApi().get('/api/v1/accounts/search/', {
      params: { q: searchQuery.value }
    })
    if (response.data?.success) {
      searchResults.value = response.data.users
    }
  } catch (error) {
    console.error('사용자 검색 실패:', error)
  }
}

// 팔로우 처리
const handleFollow = async (userId) => {
  try {
    const response = await useApi().post('/api/v1/accounts/follow/', {
      user_id: userId
    })
    if (response.data?.success || response.success) {
      // 목록 새로고침
      await Promise.all([
        fetchFriends(),
        fetchFollowers(),
        fetchFollowing()
      ])
      
      // 검색 결과도 업데이트
      if (searchQuery.value) {
        await searchUsers()
      }
    }
  } catch (error) {
    console.error('팔로우 실패:', error)
  }
}

// 언팔로우 처리
const handleUnfollow = async (userId) => {
  try {
    const response = await useApi().delete(`/api/v1/accounts/unfollow/${userId}/`)
    if (response.data?.success || response.success) {
      // 목록 새로고침
      await Promise.all([
        fetchFriends(),
        fetchFollowers(),
        fetchFollowing()
      ])
      
      // 검색 결과도 업데이트
      if (searchQuery.value) {
        await searchUsers()
      }
    }
  } catch (error) {
    console.error('언팔로우 실패:', error)
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      fetchFriends(),
      fetchFollowers(),
      fetchFollowing()
    ])
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F9FAFB;
  display: flex;
  flex-direction: column;
  max-width: 768px;
  margin: 0 auto;
}

.header {
  background: white;
  border-bottom: 1px solid #E5E7EB;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h1 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.back-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background-color: #F3F4F6;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.tabs {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  padding: 0.25rem;
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.tab-button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button.active {
  background: var(--primary-color);
  color: white;
}

.tab-button:not(.active):hover {
  background: #F3F4F6;
}

.search-bar {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.empty-state svg {
  margin: 0 auto 1rem;
}

.empty-state p {
  margin: 0.5rem 0;
}

.empty-subtitle {
  font-size: 0.875rem;
  color: #9CA3AF;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid #E5E7EB;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* 애니메이션 */
.fade-in {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Tablet: iPad Mini and similar */
@media (min-width: 768px) {
  .content-wrapper {
    padding: 1.5rem;
  }

  .search-container {
    padding: 1.25rem;
  }

  .friends-list {
    padding: 1.25rem;
  }

  .friend-item {
    padding: 1.25rem;
  }

  .friend-avatar {
    width: 3.5rem;
    height: 3.5rem;
  }

  .friend-name {
    font-size: 1.125rem;
  }

  .friend-email {
    font-size: 0.9375rem;
  }

  .action-button {
    font-size: 0.9375rem;
    padding: 0.625rem 1.125rem;
  }
}

/* Tablet Large: iPad Pro and larger tablets */
@media (min-width: 1024px) {
  .content-wrapper {
    padding: 2rem;
  }

  .search-container {
    padding: 1.5rem;
  }

  .friends-list {
    padding: 1.5rem;
  }

  .friend-item {
    padding: 1.5rem;
  }

  .friend-avatar {
    width: 4rem;
    height: 4rem;
  }

  .friend-name {
    font-size: 1.25rem;
  }

  .friend-email {
    font-size: 1rem;
  }

  .action-button {
    font-size: 1rem;
    padding: 0.75rem 1.25rem;
  }
}
</style>