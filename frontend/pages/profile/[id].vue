<template>
  <div class="container">
    <!-- 고정 헤더 -->
    <div class="header fade-in">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>프로필</h1>
      <div style="width: 64px"></div>
    </div>
    
    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <!-- 프로필 카드 -->
      <div class="profile-card fade-in" style="animation-delay: 0.1s">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>프로필 로딩 중...</p>
        </div>
        
        <div v-else-if="profile" class="space-y-6">
          <!-- 프로필 정보 -->
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-4">
              <img 
                :src="profile.user.profile_image || '/default-profile.png'" 
                :alt="profile.user.nickname"
                class="w-20 h-20 rounded-full object-cover"
              >
              <div>
                <h2 class="profile-name">{{ profile.user.nickname }}</h2>
                <p class="profile-meta">가입일: {{ formatDate(profile.joined_date) }}</p>
                <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
              </div>
            </div>
            
            <div class="flex space-x-2">
              <button
                v-if="isOwnProfile"
                @click="navigateTo('/profile/edit')"
                class="action-button secondary"
              >
                프로필 편집
              </button>
              <button
                v-else-if="isAuthenticated"
                @click="toggleFollow"
                :class="[
                  'action-button',
                  profile.is_following ? 'secondary' : 'primary'
                ]"
              >
                {{ profile.is_following ? '언팔로우' : '팔로우' }}
              </button>
            </div>
          </div>
          
          <!-- 통계 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value" style="color: var(--primary-color)">{{ profile.total_completed_days }}</div>
              <div class="stat-label">완료한 일수</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #10B981">{{ profile.current_streak }}</div>
              <div class="stat-label">현재 연속</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #8B5CF6">{{ profile.longest_streak }}</div>
              <div class="stat-label">최장 연속</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #F97316">{{ completionRate.toFixed(1) }}%</div>
              <div class="stat-label">완료율</div>
            </div>
          </div>
          
          <!-- 팔로워/팔로잉 -->
          <div class="follow-stats">
            <button 
              @click="showFollowers = true"
              class="follow-button"
            >
              <span class="follow-count">{{ profile.followers_count }}</span> 팔로워
            </button>
            <button 
              @click="showFollowing = true"
              class="follow-button"
            >
              <span class="follow-count">{{ profile.following_count }}</span> 팔로잉
            </button>
            <div v-if="profile.is_mutual_follow" class="mutual-follow">
              <Icon name="mdi:account-multiple-check" class="w-5 h-5 inline" />
              서로 팔로우 중
            </div>
          </div>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>
      </div>
      
      <!-- 탭 네비게이션 -->
      <div class="tab-container fade-in" style="animation-delay: 0.2s">
        <nav class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'tab-button',
              activeTab === tab.id ? 'active' : ''
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
      
      <!-- 탭 컨텐츠 -->
      <div class="content-card fade-in" style="animation-delay: 0.3s">
        <!-- 달력 탭 -->
        <div v-if="activeTab === 'calendar'">
          <ProfileCalendar 
            v-if="profile"
            :user-id="profile.user.id" 
          />
        </div>
        
        <!-- 업적 탭 -->
        <div v-else-if="activeTab === 'achievements'">
          <ProfileAchievements 
            v-if="profile"
            :user-id="profile.user.id" 
          />
        </div>
        
        <!-- 그룹 탭 -->
        <div v-else-if="activeTab === 'groups'">
          <ProfileGroups 
            v-if="profile"
            :user-id="profile.user.id" 
          />
        </div>
      </div>
    </div>
    
    <!-- 팔로워 모달 -->
    <FollowersModal 
      v-if="showFollowers && profile"
      :user-id="profile.user.id"
      @close="showFollowers = false"
    />
    
    <!-- 팔로잉 모달 -->
    <FollowingModal 
      v-if="showFollowing && profile"
      :user-id="profile.user.id"
      @close="showFollowing = false"
    />
  </div>
</template>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 50px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

.header h1 {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
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

.profile-card,
.tab-container,
.content-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.profile-card {
  padding: 1.5rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loading-state p {
  margin-top: 1rem;
  color: var(--text-secondary);
}

.error-state p {
  color: #DC2626;
}

.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid #E5E7EB;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.profile-meta {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.profile-bio {
  margin-top: 0.75rem;
  color: var(--text-primary);
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.action-button.primary {
  background: var(--primary-color);
  color: white;
}

.action-button.primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.action-button.secondary {
  background: #F3F4F6;
  color: var(--text-primary);
}

.action-button.secondary:hover {
  background: #E5E7EB;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin: 1.5rem 0;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: #F9FAFB;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.follow-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.follow-button {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
}

.follow-button:hover {
  color: var(--primary-color);
}

.follow-count {
  font-weight: 700;
}

.mutual-follow {
  color: #10B981;
  font-size: 0.875rem;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #E5E7EB;
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  color: var(--text-primary);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.content-card {
  padding: 1.5rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}

:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
}
</style>

<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'
import { useSocialStore } from '~/stores/social'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const profileStore = useProfileStore()
const socialStore = useSocialStore()
const authStore = useAuthStore()

const userId = computed(() => parseInt(route.params.id as string))
const profile = computed(() => profileStore.currentProfile)
const isLoading = computed(() => profileStore.isLoading)
const error = computed(() => profileStore.error)
const isOwnProfile = computed(() => profileStore.isOwnProfile)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const completionRate = computed(() => profileStore.completionRate)

const activeTab = ref('calendar')
const showFollowers = ref(false)
const showFollowing = ref(false)

const tabs = [
  { id: 'calendar', label: '달력' },
  { id: 'achievements', label: '업적' },
  { id: 'groups', label: '그룹' }
]

// 프로필 로드
onMounted(() => {
  profileStore.fetchProfile(userId.value)
})

// 팔로우 토글
const toggleFollow = async () => {
  if (!profile.value) return
  
  if (profile.value.is_following) {
    const result = await socialStore.unfollowUser(userId.value)
    if (result.success) {
      profile.value.is_following = false
      profile.value.followers_count--
    }
  } else {
    const result = await socialStore.followUser(userId.value)
    if (result.success) {
      profile.value.is_following = true
      profile.value.followers_count++
    }
  }
}

// 날짜 포맷
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 페이지 떠날 때 정리
onUnmounted(() => {
  profileStore.clearProfile()
})
</script>