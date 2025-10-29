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
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-button" 
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-badge">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 검색 바 (검색 탭일 때만) -->
      <div v-if="activeTab === 'search'" class="search-bar fade-in" style="animation-delay: 0.2s">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="사용자 검색..."
          class="search-input"
          @input="debouncedSearch"
        >
      </div>

      <!-- 로딩 상태 -->
      <SkeletonLoader 
        v-if="isLoading && !data[activeTab].length"
        type="list"
        :count="5"
      />
      
      <!-- 에러 상태 -->
      <ErrorState 
        v-else-if="error"
        :message="error"
        @retry="fetchData"
      />
      
      <!-- 사용자 목록 -->
      <div v-else class="users-list">
        <!-- 빈 상태 -->
        <div v-if="!data[activeTab].length" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>{{ emptyMessages[activeTab] }}</p>
          <p v-if="activeTab === 'friends'" class="empty-subtitle">
            서로 팔로우하는 사용자가 친구로 표시됩니다
          </p>
        </div>
        
        <!-- 사용자 카드 리스트 -->
        <TransitionGroup v-else name="list" tag="div">
          <UserCard 
            v-for="user in data[activeTab]" 
            :key="user.id"
            :user="user"
            @follow="handleFollow"
            @unfollow="handleUnfollow"
            class="fade-in"
          />
        </TransitionGroup>
      </div>
      
      <!-- 추가 로딩 (무한 스크롤) -->
      <div v-if="isLoadingMore" class="loading-more">
        <LoadingState message="더 불러오는 중..." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useApiCache } from '~/composables/useApiCache'
import { useOptimisticList } from '~/composables/useOptimisticUpdate'
import { debounce } from 'lodash-es'
import UserCard from '~/components/UserCard.vue'
import LoadingState from '~/components/LoadingState.vue'
import ErrorState from '~/components/ErrorState.vue'
import SkeletonLoader from '~/components/SkeletonLoader.vue'

interface User {
  id: number
  username: string
  nickname: string
  profile_image?: string
  bio?: string
  is_following?: boolean
  is_friend?: boolean
  followers_count?: number
  following_count?: number
}

const authStore = useAuthStore()
const { fetchWithCache, invalidateCache } = useApiCache<any>()
const { optimisticUpdateItem } = useOptimisticList<User>()

// 상태 관리
const activeTab = ref<'friends' | 'followers' | 'following' | 'search'>('friends')
const searchQuery = ref('')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const error = ref<string | null>(null)

// 데이터
const data = ref({
  friends: [] as User[],
  followers: [] as User[],
  following: [] as User[],
  search: [] as User[]
})

// 탭 설정
const tabs = computed(() => [
  { key: 'friends', label: '친구', count: data.value.friends.length || null },
  { key: 'followers', label: '팔로워', count: data.value.followers.length || null },
  { key: 'following', label: '팔로잉', count: data.value.following.length || null },
  { key: 'search', label: '검색', count: null }
])

// 빈 상태 메시지
const emptyMessages = {
  friends: '아직 친구가 없습니다',
  followers: '팔로워가 없습니다',
  following: '팔로잉하는 사용자가 없습니다',
  search: searchQuery.value ? '검색 결과가 없습니다' : '사용자를 검색해보세요'
}

// API 호출 함수들
const fetchFriends = async () => {
  return fetchWithCache(
    async () => {
      const response = await useApi().get('/api/v1/accounts/friends/')
      if (response.data?.success || response.data?.friends) {
        const friends = response.data.friends || response.data.data?.friends || []
        return friends.map((f: User) => ({ ...f, is_friend: true }))
      }
      return []
    },
    { key: 'friends', ttl: 2 * 60 * 1000 } // 2분 캐싱
  )
}

const fetchFollowers = async () => {
  if (!authStore.user) return []
  
  return fetchWithCache(
    async () => {
      const response = await useApi().get(`/api/v1/accounts/followers/${authStore.user.id}/`)
      if (response.data?.success || response.data?.followers) {
        return response.data.followers || response.data.data?.followers || []
      }
      return []
    },
    { key: `followers-${authStore.user.id}`, ttl: 2 * 60 * 1000 }
  )
}

const fetchFollowing = async () => {
  if (!authStore.user) return []
  
  return fetchWithCache(
    async () => {
      const response = await useApi().get(`/api/v1/accounts/following/${authStore.user.id}/`)
      if (response.data?.success || response.data?.following) {
        return response.data.following || response.data.data?.following || []
      }
      return []
    },
    { key: `following-${authStore.user.id}`, ttl: 2 * 60 * 1000 }
  )
}

const searchUsers = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    data.value.search = []
    return
  }
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await useApi().get('/api/v1/accounts/search/', {
      params: { q: searchQuery.value }
    })
    
    if (response.data?.success || response.data?.users) {
      data.value.search = response.data.users || response.data.data?.users || []
    }
  } catch (err: any) {
    console.error('사용자 검색 실패:', err)
    error.value = '검색 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

// Debounced search
const debouncedSearch = debounce(searchUsers, 500)

// 데이터 로드
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const [friends, followers, following] = await Promise.all([
      fetchFriends(),
      fetchFollowers(),
      fetchFollowing()
    ])
    
    data.value.friends = friends || []
    data.value.followers = followers || []
    data.value.following = following || []
  } catch (err: any) {
    console.error('데이터 로드 실패:', err)
    error.value = '데이터를 불러올 수 없습니다.'
  } finally {
    isLoading.value = false
  }
}

// 탭 전환
const switchTab = (tab: typeof activeTab.value) => {
  activeTab.value = tab
  if (tab === 'search' && !searchQuery.value) {
    data.value.search = []
  }
}

// 팔로우/언팔로우 처리
const handleFollow = async (userId: number) => {
  const currentList = ref(data.value[activeTab.value])
  
  await optimisticUpdateItem(
    currentList,
    userId,
    { is_following: true },
    async () => {
      const response = await useApi().post('/api/v1/accounts/follow/', {
        user_id: userId
      })
      
      if (response.data?.success || response.success) {
        // 캐시 무효화
        invalidateCache(/friends|followers|following/)
        // 데이터 새로고침
        await fetchData()
      } else {
        throw new Error('팔로우 실패')
      }
    }
  )
}

const handleUnfollow = async (userId: number) => {
  const currentList = ref(data.value[activeTab.value])
  
  await optimisticUpdateItem(
    currentList,
    userId,
    { is_following: false },
    async () => {
      const response = await useApi().delete(`/api/v1/accounts/unfollow/${userId}/`)
      
      if (response.data?.success || response.success) {
        // 캐시 무효화
        invalidateCache(/friends|followers|following/)
        // 데이터 새로고침
        await fetchData()
      } else {
        throw new Error('언팔로우 실패')
      }
    }
  )
}

// 초기 로드
onMounted(() => {
  fetchData()
})

// 검색어 변경 감지
watch(searchQuery, (newValue) => {
  if (!newValue) {
    data.value.search = []
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.tab-button.active {
  background: var(--primary-color);
  color: white;
}

.tab-button:not(.active):hover {
  background: #F3F4F6;
}

.tab-badge {
  background: rgba(0, 0, 0, 0.1);
  color: inherit;
  padding: 0.125rem 0.375rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-button.active .tab-badge {
  background: rgba(255, 255, 255, 0.2);
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

.loading-more {
  padding: 1rem;
}

/* Transitions */
.fade-in {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}

/* CSS Variables */
:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
}
</style>