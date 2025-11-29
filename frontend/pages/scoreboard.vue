<template>
  <PageLayout title="리더보드">
    <div class="content-wrapper">
      <!-- 내 순위 카드 -->
      <Card v-if="myRanking" variant="gradient" class="my-ranking-card fade-in delay-100">
        <div class="ranking-content">
          <div>
            <p class="ranking-label">내 순위</p>
            <p class="ranking-value">{{ myRanking.rank }}위</p>
            <p class="ranking-sub">상위 {{ myRanking.percentile }}%</p>
          </div>
          <div class="text-right">
            <p class="ranking-label">완료한 일수</p>
            <p class="ranking-value">{{ myRanking.completed_days }}일</p>
            <p class="ranking-sub">연속 {{ myRanking.current_streak }}일</p>
          </div>
        </div>
      </Card>

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
    <Card class="leaderboard-card fade-in delay-300" elevated>
      <!-- 로딩 상태 -->
      <LoadingState v-if="isLoading" message="리더보드를 불러오는 중..." />

      <!-- 데이터 있을 때 -->
      <div v-else-if="currentLeaderboard.length > 0">
        <!-- Top 3 하이라이트 (전체 보기일 때만) -->
        <div v-if="activeView === 'global' && topThree.length > 0" class="top-three">
          <Card
            v-for="(entry, index) in topThree"
            :key="entry.user.id"
            :variant="index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'"
            class="top-card"
          >
            <div class="medal">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
            <img
              :src="entry.user.profile_image || '/default-profile.png'"
              :alt="entry.user.nickname"
              class="top-avatar"
              @error="(e) => e.target.src = '/default-profile.png'"
            >
            <p class="top-name">{{ entry.user.nickname }}</p>
            <p class="top-days">{{ entry.completed_days }}일</p>
            <p class="top-progress">진행률 {{ entry.progress_rate }}%</p>
          </Card>
        </div>

        <!-- 테이블 -->
        <div class="table-wrapper">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>사용자</th>
                <th class="text-center">완료 일수</th>
                <th class="text-center">진행률</th>
                <th class="text-center">현재 연속</th>
                <th class="text-center">최장 연속</th>
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
    </Card>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { useScoreboardStore } from '~/stores/scoreboard'
import { useAuthStore } from '~/stores/auth'
import PageLayout from '~/components/common/PageLayout.vue'
import Card from '~/components/common/Card.vue'
import FilterButtonGroup from '~/components/common/FilterButtonGroup.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import LoadingState from '~/components/LoadingState.vue'
import LeaderboardItem from '~/components/leaderboard/LeaderboardItem.vue'

const scoreboardStore = useScoreboardStore()
const authStore = useAuthStore()

const activeView = ref<'global' | 'friends'>('global')
const currentPeriod = computed(() => scoreboardStore.currentPeriod)
const isLoading = computed(() => scoreboardStore.isLoading)
const myRanking = computed(() => scoreboardStore.myRanking)
const topThree = computed(() => scoreboardStore.topThree)

const currentLeaderboard = computed(() => {
  return activeView.value === 'global'
    ? scoreboardStore.globalLeaderboard
    : scoreboardStore.friendsLeaderboard
})

const periods = [
  { value: 'all', label: '전체' },
  { value: 'month', label: '이번 달' },
  { value: 'week', label: '이번 주' }
]

const viewModes = [
  { value: 'global', label: '전체' },
  { value: 'friends', label: '친구' }
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
  } else if (authStore.isAuthenticated) {
    scoreboardStore.fetchFriendsLeaderboard(currentPeriod.value)
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
}

.my-ranking-card {
  margin-bottom: 1rem;
}

.ranking-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.ranking-label {
  font-size: 0.75rem;
  opacity: 0.9;
  margin: 0;
}

.ranking-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0.25rem 0;
}

.ranking-sub {
  font-size: 0.75rem;
  opacity: 0.9;
  margin: 0;
}

.text-right {
  text-align: right;
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.leaderboard-card {
  overflow: hidden;
}

.top-three {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.top-card {
  position: relative;
  text-align: center;
  padding: 1rem !important;
}

.medal {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1.5rem;
  opacity: 0.5;
}

.top-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.5);
  object-fit: cover;
}

.top-name {
  font-weight: 700;
  color: var(--text-primary);
  margin: 0.25rem 0;
}

.top-days {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0.25rem 0;
}

.top-progress {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table thead {
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}

.leaderboard-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text-center {
  text-align: center;
}

@media (max-width: 640px) {
  .filter-section {
    flex-direction: column;
  }

  .leaderboard-table {
    font-size: 0.875rem;
  }

  .leaderboard-table th {
    padding: 0.5rem;
  }

  .top-three {
    grid-template-columns: 1fr;
  }
}

/* Tablet: iPad Mini and similar */
@media (min-width: 768px) {
  .content-wrapper {
    padding: 1.5rem;
  }

  .my-ranking-card {
    margin-bottom: 1.5rem;
  }

  .ranking-label {
    font-size: 0.875rem;
  }

  .ranking-value {
    font-size: 2rem;
  }

  .ranking-sub {
    font-size: 0.875rem;
  }

  .top-three {
    padding: 2rem;
    gap: 1.5rem;
  }

  .top-avatar {
    width: 5rem;
    height: 5rem;
  }

  .top-name {
    font-size: 1.125rem;
  }

  .top-days {
    font-size: 1.5rem;
  }

  .top-progress {
    font-size: 0.875rem;
  }
}

/* Tablet Large: iPad Pro and larger tablets */
@media (min-width: 1024px) {
  .content-wrapper {
    padding: 2rem;
  }

  .my-ranking-card {
    margin-bottom: 2rem;
  }

  .ranking-label {
    font-size: 1rem;
  }

  .ranking-value {
    font-size: 2.25rem;
  }

  .ranking-sub {
    font-size: 1rem;
  }

  .top-three {
    padding: 2.5rem;
    gap: 2rem;
  }

  .top-avatar {
    width: 6rem;
    height: 6rem;
  }

  .top-name {
    font-size: 1.25rem;
  }

  .top-days {
    font-size: 1.75rem;
  }

  .top-progress {
    font-size: 1rem;
  }
}
</style>
