<template>
  <PageLayout title="프로필">
    <div class="content-wrapper">
      <!-- 로딩 상태 -->
      <LoadingState v-if="isLoading" message="프로필 로딩 중..." />

      <template v-else-if="profile">
        <!-- 프로필 카드 -->
        <div class="profile-card fade-in delay-100">
          <div class="profile-header">
            <div class="profile-user">
              <div class="avatar-wrapper">
                <img
                  v-if="profile.user.profile_image && !avatarError"
                  :src="profile.user.profile_image"
                  :alt="profile.user.nickname"
                  class="profile-avatar"
                  @error="handleAvatarError"
                >
                <div v-else class="profile-avatar-placeholder">
                  <i class="fa-solid fa-user"></i>
                </div>
              </div>
              <div class="profile-info">
                <h2 class="profile-name">{{ profile.user.nickname }}</h2>
                <p class="profile-meta">가입일: {{ formatDate(profile.joined_date) }}</p>
                <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
              </div>
            </div>

            <div class="profile-actions">
              <button
                v-if="isOwnProfile"
                @click="showEditModal = true"
                class="btn-action btn-secondary"
              >
                프로필 편집
              </button>
              <button
                v-else-if="isAuthenticated"
                @click="toggleFollow"
                :class="[
                  'btn-action',
                  profile.is_following ? 'btn-secondary' : 'btn-primary'
                ]"
              >
                {{ profile.is_following ? '언팔로우' : '팔로우' }}
              </button>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                <polyline points="9 11 12 14 22 4"/>
              </svg>
              서로 팔로우 중
            </div>
          </div>

          <!-- 통계 그리드 -->
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">완료한 일수</div>
              <div class="stat-value primary">{{ profile.total_completed_days }}일</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">현재 연속</div>
              <div class="stat-value success">{{ profile.current_streak }}일</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">최장 연속</div>
              <div class="stat-value purple">{{ profile.longest_streak }}일</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">완료율</div>
              <div class="stat-value orange">{{ completionRate.toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <!-- 탭 네비게이션 -->
        <div class="tab-section fade-in delay-200">
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

          <!-- 탭 컨텐츠 -->
          <div class="tab-content">
            <!-- 달력 탭 -->
            <div v-if="activeTab === 'calendar'" class="calendar-tab-content">
              <div v-if="loadingStates.calendar" class="calendar-loading-overlay">
                <div class="loading-spinner"></div>
              </div>
              <ProfileCalendar
                v-if="profile"
                :calendar-data="calendarData"
                :plans="calendarPlans"
                @month-change="handleMonthChange"
                @navigate-to-date="handleNavigateToDate"
              />
            </div>

            <!-- 업적 탭 -->
            <div v-else-if="activeTab === 'achievements'">
              <LoadingState v-if="loadingStates.achievements" message="업적 로딩 중..." />
              <ProfileAchievements
                v-else-if="profile"
                :achievements-data="achievementsData"
              />
            </div>

            <!-- 그룹 탭 -->
            <div v-else-if="activeTab === 'groups'">
              <LoadingState v-if="loadingStates.groups" message="그룹 로딩 중..." />
              <ProfileGroups
                v-else-if="profile"
                :groups-data="groupsData"
              />
            </div>
          </div>
        </div>
      </template>

      <ErrorState v-else-if="error" :message="error" />

      <!-- 팔로워 모달 -->
      <FollowersModal
        v-if="showFollowers && profile"
        :is-open="showFollowers"
        :followers-data="followersData"
        :is-loading="loadingStates.followers"
        @close="showFollowers = false"
        @toggle-follow="handleToggleFollow"
      />

      <!-- 팔로잉 모달 -->
      <FollowingModal
        v-if="showFollowing && profile"
        :is-open="showFollowing"
        :following-data="followingData"
        :is-loading="loadingStates.following"
        @close="showFollowing = false"
        @unfollow="handleUnfollow"
      />

      <!-- 프로필 편집 모달 -->
      <ProfileEditModal
        v-if="showEditModal && profile"
        :profile="profile"
        @close="showEditModal = false"
        @saved="handleProfileSaved"
      />
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useProfilePageData } from '~/composables/useProfilePageData'
import PageLayout from '~/components/common/PageLayout.vue'
import LoadingState from '~/components/LoadingState.vue'
import ErrorState from '~/components/ErrorState.vue'
import ProfileCalendar from '~/components/profile/ProfileCalendar.vue'
import ProfileAchievements from '~/components/profile/ProfileAchievements.vue'
import ProfileGroups from '~/components/profile/ProfileGroups.vue'
import FollowersModal from '~/components/profile/FollowersModal.vue'
import FollowingModal from '~/components/profile/FollowingModal.vue'
import ProfileEditModal from '~/components/profile/ProfileEditModal.vue'

const route = useRoute()
const authStore = useAuthStore()

const userId = computed(() => parseInt(route.params.id as string))

// Composable 사용
const {
  loadingStates,
  errors,
  profile,
  calendarData,
  calendarPlans,
  achievements,
  groups,
  followers,
  following,
  isOwnProfile,
  completionRate,
  loadInitialData,
  loadTabData,
  loadFollowers,
  loadFollowing,
  handleMonthChange,
  toggleFollow,
  handleToggleFollowInModal,
  handleUnfollowInModal,
  cleanup
} = useProfilePageData(userId)

// 로컬 상태
const activeTab = ref('calendar')
const showFollowers = ref(false)
const showFollowing = ref(false)
const showEditModal = ref(false)
const avatarError = ref(false)

const handleAvatarError = () => {
  avatarError.value = true
}

// 로딩/에러 상태
const isLoading = computed(() => loadingStates.profile)
const error = computed(() => errors.value.length > 0 ? errors.value[0] : null)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 데이터 computed (하위 호환성)
const achievementsData = computed(() => achievements.value || [])
const groupsData = computed(() => groups.value || [])
const followersData = computed(() => followers.value || [])
const followingData = computed(() => following.value || [])

const tabs = [
  { id: 'calendar', label: '달력' },
  { id: 'achievements', label: '업적' },
  { id: 'groups', label: '그룹' }
]

// 초기 로드
onMounted(() => {
  loadInitialData()
})

// 탭 변경 시 지연 로드
watch(activeTab, (newTab) => {
  loadTabData(newTab)
})

// 팔로워 모달 열 때 로드
watch(showFollowers, (isOpen) => {
  if (isOpen) loadFollowers()
})

// 팔로잉 모달 열 때 로드
watch(showFollowing, (isOpen) => {
  if (isOpen) loadFollowing()
})

// route 변경 감지 (다른 프로필로 이동 시)
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    cleanup()
    activeTab.value = 'calendar'
    avatarError.value = false
    loadInitialData()
  }
})

// 팔로워 모달에서 팔로우 토글
const handleToggleFollow = (follower: any) => {
  handleToggleFollowInModal(follower)
}

// 팔로잉 모달에서 언팔로우
const handleUnfollow = (user: any) => {
  handleUnfollowInModal(user)
}

// 날짜 포맷
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 프로필 캘린더에서 일정 클릭 시 읽기 페이지로 이동
const handleNavigateToDate = (_schedule: any) => {
  // ScheduleDetailModal에서 이미 라우터 네비게이션을 처리하므로 추가 처리 불필요
}

// 프로필 편집 저장 후 처리
const handleProfileSaved = () => {
  // 프로필 데이터 다시 로드
  loadInitialData()
}

// 페이지 떠날 때 정리
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.content-wrapper {
  padding: 1rem;
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 프로필 카드 */
.profile-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.profile-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.avatar-wrapper {
  position: relative;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #E2E8F0;
  flex-shrink: 0;
}

.profile-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light, #E8F4FD);
  color: var(--primary-color, #3B82F6);
  font-size: 2rem;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 0.25rem 0;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: -0.02em;
}

.profile-meta {
  color: #64748B;
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
}

.profile-bio {
  color: #475569;
  margin: 0;
  line-height: 1.5;
  font-size: 0.9375rem;
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-action {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Pretendard', sans-serif;
}

.btn-primary {
  background: #1E293B;
  color: white;
}

.btn-primary:hover {
  background: #334155;
  transform: translateY(-1px);
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

/* 팔로우 통계 */
.follow-stats {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid #F1F5F9;
  border-bottom: 1px solid #F1F5F9;
  margin-bottom: 1.5rem;
}

.follow-button {
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0;
  font-size: 0.9375rem;
  font-family: 'Pretendard', sans-serif;
}

.follow-button:hover {
  color: #1E293B;
}

.follow-count {
  font-weight: 700;
  color: #1E293B;
  margin-right: 0.125rem;
}

.mutual-follow {
  color: #059669;
  font-size: 0.8125rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
  background: #ECFDF5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* 통계 그리드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'Pretendard', sans-serif;
}

.stat-value.primary { color: #1E293B; }
.stat-value.success { color: #059669; }
.stat-value.purple { color: #7C3AED; }
.stat-value.orange { color: #EA580C; }

.stat-label {
  font-size: 0.75rem;
  color: #94A3B8;
  font-weight: 500;
}

/* 탭 섹션 */
.tab-section {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #E2E8F0;
  background: #F8FAFC;
}

.tab-button {
  flex: 1;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
}

.tab-button:hover {
  color: #1E293B;
  background: #F1F5F9;
}

.tab-button.active {
  color: #1E293B;
  background: white;
  border-bottom-color: #1E293B;
  font-weight: 600;
}

.tab-content {
  min-height: 300px;
  padding: 0;
}

.calendar-tab-content {
  position: relative;
}

.calendar-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E2E8F0;
  border-top-color: #1E293B;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 애니메이션 */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 반응형 */
@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
  }

  .profile-actions {
    width: 100%;
  }

  .btn-action {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .stat-item {
    background: #F8FAFC;
    padding: 0.75rem;
    border-radius: 8px;
  }
}
</style>
