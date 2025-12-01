<template>
  <PageLayout title="프로필">
    <div class="content-wrapper">
      <!-- 프로필 카드 -->
      <Card class="fade-in delay-100" elevated>
      <LoadingState v-if="isLoading" message="프로필 로딩 중..." />

      <div v-else-if="profile" class="profile-content">
        <!-- 프로필 정보 -->
        <div class="profile-header">
          <div class="profile-user">
            <img
              :src="profile.user.profile_image || '/default-profile.png'"
              :alt="profile.user.nickname"
              class="profile-avatar"
              @error="(e) => e.target.src = '/default-profile.png'"
            >
            <div class="profile-info">
              <h2 class="profile-name">{{ profile.user.nickname }}</h2>
              <p class="profile-meta">가입일: {{ formatDate(profile.joined_date) }}</p>
              <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
            </div>
          </div>

          <div class="profile-actions">
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

        <!-- 통계 그리드 -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value primary">{{ profile.total_completed_days }}</div>
            <div class="stat-label">완료한 일수</div>
          </div>
          <div class="stat-item">
            <div class="stat-value success">{{ profile.current_streak }}</div>
            <div class="stat-label">현재 연속</div>
          </div>
          <div class="stat-item">
            <div class="stat-value purple">{{ profile.longest_streak }}</div>
            <div class="stat-label">최장 연속</div>
          </div>
          <div class="stat-item">
            <div class="stat-value orange">{{ completionRate.toFixed(1) }}%</div>
            <div class="stat-label">완료율</div>
          </div>
        </div>

        <!-- 팔로워/팔로잉 -->
        <div class="follow-stats">
          <button @click="showFollowers = true" class="follow-button">
            <span class="follow-count">{{ profile.followers_count }}</span> 팔로워
          </button>
          <button @click="showFollowing = true" class="follow-button">
            <span class="follow-count">{{ profile.following_count }}</span> 팔로잉
          </button>
          <div v-if="profile.is_mutual_follow" class="mutual-follow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              <polyline points="9 11 12 14 22 4"/>
            </svg>
            서로 팔로우 중
          </div>
        </div>
      </div>

      <ErrorState v-else-if="error" :message="error" />
    </Card>

    <!-- 탭 네비게이션 -->
    <Card class="tab-container fade-in delay-200">
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
    </Card>

    <!-- 탭 컨텐츠 -->
    <Card class="content-card fade-in delay-300">
      <!-- 달력 탭 -->
      <ProfileCalendar
        v-if="activeTab === 'calendar' && profile"
        :calendar-data="calendarData"
        @month-change="handleMonthChange"
      />

      <!-- 업적 탭 -->
      <ProfileAchievements
        v-else-if="activeTab === 'achievements' && profile"
        :achievements-data="achievementsData"
      />

      <!-- 그룹 탭 -->
      <ProfileGroups
        v-else-if="activeTab === 'groups' && profile"
        :groups-data="groupsData"
      />
    </Card>

    <!-- 팔로워 모달 -->
    <FollowersModal
      v-if="showFollowers && profile"
      :is-open="showFollowers"
      :followers-data="followersData"
      @close="showFollowers = false"
      @toggle-follow="handleToggleFollow"
    />

    <!-- 팔로잉 모달 -->
    <FollowingModal
      v-if="showFollowing && profile"
      :is-open="showFollowing"
      :following-data="followingData"
      @close="showFollowing = false"
      @unfollow="handleUnfollow"
    />
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'
import { useSocialStore } from '~/stores/social'
import { useAuthStore } from '~/stores/auth'
import { useGroupsStore } from '~/stores/groups'
import PageLayout from '~/components/common/PageLayout.vue'
import Card from '~/components/common/Card.vue'
import LoadingState from '~/components/LoadingState.vue'
import ErrorState from '~/components/ErrorState.vue'
import ProfileCalendar from '~/components/profile/ProfileCalendar.vue'
import ProfileAchievements from '~/components/profile/ProfileAchievements.vue'
import ProfileGroups from '~/components/profile/ProfileGroups.vue'
import FollowersModal from '~/components/profile/FollowersModal.vue'
import FollowingModal from '~/components/profile/FollowingModal.vue'

const route = useRoute()
const profileStore = useProfileStore()
const socialStore = useSocialStore()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()

const userId = computed(() => parseInt(route.params.id as string))
const profile = computed(() => profileStore.currentProfile)
const isLoading = computed(() => profileStore.isLoading)
const error = computed(() => profileStore.error)
const isOwnProfile = computed(() => profileStore.isOwnProfile)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const completionRate = computed(() => profileStore.completionRate)

// 데이터 computed
const calendarData = computed(() => profileStore.calendarData || [])
const achievementsData = computed(() => profileStore.achievements || [])
const groupsData = computed(() => groupsStore.groups || [])
const followersData = computed(() => socialStore.followers || [])
const followingData = computed(() => socialStore.following || [])

const activeTab = ref('calendar')
const showFollowers = ref(false)
const showFollowing = ref(false)

const tabs = [
  { id: 'calendar', label: '달력' },
  { id: 'achievements', label: '업적' },
  { id: 'groups', label: '그룹' }
]

// 프로필 로드
onMounted(async () => {
  await profileStore.fetchProfile(userId.value)

  // 모든 데이터 병렬 로드
  const now = new Date()
  await Promise.all([
    profileStore.fetchCalendarData(userId.value, now.getFullYear(), now.getMonth() + 1),
    profileStore.fetchAchievements(userId.value),
    groupsStore.fetchGroups({ only_mine: isOwnProfile.value }),
    socialStore.fetchFollowers(userId.value),
    socialStore.fetchFollowing(userId.value)
  ])
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

// 팔로워 모달에서 팔로우 토글
const handleToggleFollow = (follower: any) => {
  // 팔로워 모달에서의 팔로우/언팔로우 처리
}

// 팔로잉 모달에서 언팔로우
const handleUnfollow = (user: any) => {
  // 팔로잉 모달에서의 언팔로우 처리
}

// 달력 월 변경
const handleMonthChange = async (year: number, month: number) => {
  await profileStore.fetchCalendarData(userId.value, year, month)
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

<style scoped>
.content-wrapper {
  padding: 1rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.profile-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--gray-200);
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.profile-meta {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
}

.profile-bio {
  color: var(--text-primary);
  margin: 0;
  line-height: 1.5;
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
  white-space: nowrap;
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
  background: var(--gray-100);
  color: var(--text-primary);
}

.action-button.secondary:hover {
  background: var(--gray-200);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}


.stat-item {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: var(--radius-md);
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-value.primary { color: var(--primary-color); }
.stat-value.success { color: var(--success); }
.stat-value.purple { color: #8B5CF6; }
.stat-value.orange { color: #F97316; }

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.follow-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.follow-button {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: color var(--transition-fast);
  padding: 0;
  font-size: 0.9375rem;
}

.follow-button:hover {
  color: var(--primary-color);
}

.follow-count {
  font-weight: 700;
}

.mutual-follow {
  color: var(--success);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-container {
  padding: 0 !important;
  overflow: hidden;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid var(--gray-200);
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
  transition: all var(--transition-fast);
}

.tab-button:hover {
  color: var(--text-primary);
  background: var(--gray-50);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.content-card {
  min-height: 300px;
  overflow: hidden;
  padding: 0 !important;
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
  }

  .profile-actions {
    width: 100%;
  }

  .action-button {
    flex: 1;
  }

  .profile-avatar {
    width: 64px;
    height: 64px;
  }

  .profile-name {
    font-size: 1rem;
  }
}
</style>
