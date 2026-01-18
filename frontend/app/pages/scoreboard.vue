<template>
  <PageLayout title="리더보드">
    <div class="content-wrapper">
      <!-- 내 순위 카드 -->
      <div v-if="myRanking" class="my-ranking-card fade-in delay-100">
        <div class="ranking-content">
          <div class="ranking-info">
            <p class="ranking-label">내 순위</p>
            <div class="ranking-main">
              <span class="ranking-value">{{ myRanking.rank }}</span>
              <span class="ranking-unit">위</span>
            </div>
            <p class="ranking-sub">상위 {{ myRanking.percentile }}%</p>
          </div>
          <div class="ranking-stats">
            <div class="stat-item">
              <p class="stat-label">완료한 일수</p>
              <p class="stat-value">{{ myRanking.completed_days }}일</p>
            </div>
            <div class="stat-item">
              <p class="stat-label">현재 연속</p>
              <p class="stat-value">{{ myRanking.current_streak }}일</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 필터 섹션 -->
      <div class="filter-section fade-in delay-200">
        <FilterButtonGroup
          v-model="scoreboardStore.currentPeriod"
          :options="periods"
          label="기간"
          @update:model-value="changePeriod"
        />

        <FilterButtonGroup
          v-model="activeView"
          :options="viewModes"
          label="보기"
        />
      </div>

      <!-- 리더보드 카드 -->
      <div class="leaderboard-card fade-in delay-300">
        <!-- 로딩 상태 -->
        <LoadingState v-if="isLoading" message="리더보드를 불러오는 중..." />

        <!-- 데이터 있을 때 -->
        <div v-else-if="currentLeaderboard.length > 0">
          <!-- Top 3 하이라이트 (전체 보기일 때만) -->
          <div v-if="activeView === 'global' && topThree.length > 0" class="top-three">
            <div
              v-for="(entry, index) in topThree"
              :key="entry.user.id"
              :class="['top-card', index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : 'rank-3']"
            >
              <div class="medal-icon">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
              <div class="avatar-wrapper">
                <NuxtImg
                  v-if="entry.user.profile_image && !avatarErrors[entry.user.id]"
                  :src="entry.user.profile_image"
                  :alt="entry.user.nickname"
                  class="top-avatar"
                  loading="lazy"
                  @error="() => handleAvatarError(entry.user.id)"
                />
                <div v-else class="top-avatar-placeholder">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="rank-badge">{{ index + 1 }}</div>
              </div>
              <p class="top-name">{{ entry.user.nickname }}</p>
              <div class="top-stats">
                <span class="top-days">{{ entry.completed_days }}일</span>
                <span class="top-rate">{{ entry.progress_rate }}%</span>
              </div>
            </div>
          </div>

          <!-- 테이블 -->
          <div class="table-wrapper">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th class="th-rank">순위</th>
                  <th class="th-user">사용자</th>
                  <th class="text-center">완료</th>
                  <th class="text-center">진행률</th>
                  <th class="text-center mobile-hide">연속</th>
                </tr>
              </thead>
              <tbody>
                <LeaderboardItem
                  v-for="entry in currentLeaderboard"
                  :key="entry.user.id"
                  :rank="entry.rank"
                  :user="entry.user"
                  :completed-days="entry.completed_days"
                  :progress-rate="entry.progress_rate"
                  :current-streak="entry.current_streak"
                  :longest-streak="entry.longest_streak"
                  :is-highlighted="entry.user.is_me"
                />
              </tbody>
            </table>
          </div>
        </div>

        <!-- 빈 상태 -->
        <EmptyState v-else title="리더보드 데이터가 없습니다" />
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { useScoreboardStore } from '~/stores/scoreboard'
import { useAuthStore } from '~/stores/auth'
import PageLayout from '~/components/common/PageLayout.vue'
import FilterButtonGroup from '~/components/common/FilterButtonGroup.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import LoadingState from '~/components/LoadingState.vue'
import LeaderboardItem from '~/components/leaderboard/LeaderboardItem.vue'

const scoreboardStore = useScoreboardStore()
const authStore = useAuthStore()

const activeView = ref<'global' | 'friends' | 'following'>('global')
const currentPeriod = computed(() => scoreboardStore.currentPeriod)
const isLoading = computed(() => scoreboardStore.isLoading)
const myRanking = computed(() => scoreboardStore.myRanking)
const topThree = computed(() => scoreboardStore.topThree)
const avatarErrors = ref<Record<number, boolean>>({})

const handleAvatarError = (userId: number) => {
  avatarErrors.value[userId] = true
}

const currentLeaderboard = computed(() => {
  if (activeView.value === 'global') {
    return scoreboardStore.globalLeaderboard
  } else if (activeView.value === 'following') {
    return scoreboardStore.followingLeaderboard
  } else {
    return scoreboardStore.friendsLeaderboard
  }
})

const periods = [
  { value: 'all', label: '전체' },
  { value: 'month', label: '이번 달' },
  { value: 'week', label: '이번 주' }
]

const viewModes = [
  { value: 'global', label: '전체' },
  { value: 'friends', label: '친구' },
  { value: 'following', label: '팔로잉' }
]

// 초기 데이터 로드
onMounted(() => {
  loadLeaderboard()
  if (authStore.isAuthenticated) {
    scoreboardStore.fetchMyRanking()
  }
})

// 리더보드 로드
const loadLeaderboard = () => {
  if (activeView.value === 'global') {
    scoreboardStore.fetchGlobalLeaderboard(currentPeriod.value)
  } else if (activeView.value === 'following' && authStore.isAuthenticated) {
    scoreboardStore.fetchFriendsLeaderboard(currentPeriod.value, undefined, 'following')
  } else if (activeView.value === 'friends' && authStore.isAuthenticated) {
    scoreboardStore.fetchFriendsLeaderboard(currentPeriod.value, undefined, 'mutual')
  }
}

// 기간 변경
const changePeriod = (period: 'all' | 'week' | 'month') => {
  scoreboardStore.setPeriod(period)
  loadLeaderboard()
  if (authStore.isAuthenticated) {
    scoreboardStore.fetchMyRanking(period)
  }
}

// 보기 모드 변경 감시
watch(activeView, () => {
  loadLeaderboard()
})

// 페이지 떠날 때 정리
onUnmounted(() => {
  scoreboardStore.clearScoreboardData()
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

/* 내 순위 카드 */
.my-ranking-card {
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
  border-radius: 16px;
  padding: 1.5rem;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.ranking-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ranking-info {
  display: flex;
  flex-direction: column;
}

.ranking-label {
  font-size: 0.875rem;
  color: #94A3B8;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.ranking-main {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.ranking-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  font-family: 'Pretendard', sans-serif;
}

.ranking-unit {
  font-size: 1rem;
  font-weight: 500;
  color: #CBD5E1;
}

.ranking-sub {
  font-size: 0.875rem;
  color: #60A5FA;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.ranking-stats {
  display: flex;
  gap: 1.5rem;
  text-align: right;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #94A3B8;
  margin: 0;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  font-family: 'Pretendard', sans-serif;
}

/* 필터 섹션 */
.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

/* 리더보드 카드 */
.leaderboard-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-slate-200);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* Top 3 섹션 */
.top-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-slate-50);
  border-bottom: 1px solid var(--color-slate-200);
}

.top-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-slate-200);
  position: relative;
  transition: transform 0.2s ease;
}

.top-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.rank-1 {
  order: 2;
  border-color: #FEF3C7;
  background: linear-gradient(to bottom, #FFFBEB, var(--color-bg-card));
  transform: scale(1.05);
  z-index: 1;
}

.rank-2 {
  order: 1;
  margin-top: 1rem;
}

.rank-3 {
  order: 3;
  margin-top: 1rem;
}

.medal-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 0.75rem;
}

.top-avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-bg-card);
  box-shadow: var(--shadow-sm);
}

.top-avatar-placeholder {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: 2px solid var(--color-bg-card);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-slate-100);
  color: var(--primary-color, #3B82F6);
  font-size: 1.25rem;
}

.rank-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 1.25rem;
  height: 1.25rem;
  background: #1E293B;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.rank-1 .rank-badge { background: #F59E0B; }
.rank-2 .rank-badge { background: #94A3B8; }
.rank-3 .rank-badge { background: #B45309; }

.top-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-slate-800);
  margin: 0 0 0.5rem 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.top-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.top-days {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-slate-800);
  font-family: 'Pretendard', sans-serif;
}

.top-rate {
  font-size: 0.75rem;
  color: var(--color-slate-500);
  font-weight: 500;
}

/* 테이블 */
.table-wrapper {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-slate-500);
  background: var(--color-slate-50);
  border-bottom: 1px solid var(--color-slate-200);
  white-space: nowrap;
}

.th-rank { width: 60px; text-align: center; }
.th-user { width: auto; }

.text-center { text-align: center; }

/* 애니메이션 */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 반응형 */
@media (max-width: 640px) {
  .filter-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .ranking-stats {
    gap: 1rem;
  }

  .mobile-hide {
    display: none;
  }

  .top-three {
    gap: 0.75rem;
    padding: 1rem;
  }

  .top-avatar {
    width: 3rem;
    height: 3rem;
  }
}
</style>
