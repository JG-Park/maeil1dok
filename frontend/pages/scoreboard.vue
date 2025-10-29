<template>
  <div class="container">
    <!-- 고정 헤더 -->
    <div class="header fade-in">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>리더보드</h1>
      <div style="width: 64px"></div>
    </div>
    
    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <!-- 내 순위 카드 -->
      <div v-if="myRanking" class="my-ranking-card fade-in" style="animation-delay: 0.1s">
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
      </div>
      
      <!-- 필터 섹션 -->
      <div class="filter-section fade-in" style="animation-delay: 0.2s">
        <!-- 기간 선택 -->
        <div class="filter-group">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="changePeriod(period.value)"
            :class="[
              'filter-button',
              currentPeriod === period.value ? 'active' : ''
            ]"
          >
            {{ period.label }}
          </button>
        </div>
        
        <!-- 보기 모드 -->
        <div class="filter-group">
          <button
            v-for="view in viewModes"
            :key="view.value"
            @click="activeView = view.value"
            :class="[
              'filter-button',
              activeView === view.value ? 'active' : ''
            ]"
          >
            {{ view.label }}
          </button>
        </div>
      </div>
      
      <!-- 리더보드 테이블 -->
      <div class="leaderboard-card fade-in" style="animation-delay: 0.3s">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>리더보드를 불러오는 중...</p>
        </div>
        
        <div v-else-if="currentLeaderboard.length > 0">
          <!-- Top 3 하이라이트 (전체 보기일 때만) -->
          <div v-if="activeView === 'global' && topThree.length > 0" class="top-three">
            <div
              v-for="(entry, index) in topThree"
              :key="entry.user.id"
              :class="[
                'top-card',
                index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'
              ]"
            >
              <div class="medal">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
              <img 
                :src="entry.user.profile_image || '/default-profile.png'"
                :alt="entry.user.nickname"
                class="top-avatar"
              >
              <p class="top-name">{{ entry.user.nickname }}</p>
              <p class="top-days">{{ entry.completed_days }}일</p>
              <p class="top-progress">진행률 {{ entry.progress_rate }}%</p>
            </div>
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
                <tr
                  v-for="entry in currentLeaderboard"
                  :key="entry.user.id"
                  :class="entry.user.is_me ? 'highlight-row' : ''"
                >
                  <td class="rank-cell">
                    <span :class="[
                      'rank-number',
                      entry.rank === 1 ? 'gold' :
                      entry.rank === 2 ? 'silver' :
                      entry.rank === 3 ? 'bronze' : ''
                    ]">
                      {{ entry.rank }}
                    </span>
                  </td>
                  <td class="user-cell">
                    <div class="user-info">
                      <img 
                        :src="entry.user.profile_image || '/default-profile.png'"
                        :alt="entry.user.nickname"
                        class="user-avatar"
                      >
                      <div>
                        <NuxtLink 
                          :to="`/profile/${entry.user.id}`"
                          class="user-name"
                        >
                          {{ entry.user.nickname }}
                        </NuxtLink>
                        <span v-if="entry.user.is_me" class="me-badge">나</span>
                        <p v-if="entry.user.role" class="user-role">{{ entry.user.role }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="days-count">{{ entry.completed_days }}</span>
                  </td>
                  <td class="text-center">
                    <div class="progress-wrapper">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill"
                          :style="`width: ${Math.min(entry.progress_rate, 100)}%`"
                        ></div>
                      </div>
                      <span class="progress-text">{{ entry.progress_rate }}%</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="streak current">{{ entry.current_streak }}일</span>
                  </td>
                  <td class="text-center">
                    <span class="streak longest">{{ entry.longest_streak }}일</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <p>리더보드 데이터가 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScoreboardStore } from '~/stores/scoreboard'
import { useAuthStore } from '~/stores/auth'

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

.my-ranking-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  color: white;
}

.ranking-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  background: #F3F4F6;
  border-radius: 8px;
  padding: 4px;
}

.filter-button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-button:hover {
  color: var(--text-primary);
}

.filter-button.active {
  background: white;
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.leaderboard-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  overflow: hidden;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loading-state p {
  margin-top: 1rem;
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
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.top-three {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #E5E7EB;
}

.top-card {
  position: relative;
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
}

.top-card.gold {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
}

.top-card.silver {
  background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
}

.top-card.bronze {
  background: linear-gradient(135deg, #FED7AA 0%, #FB923C 100%);
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
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
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

.leaderboard-table tbody tr {
  border-bottom: 1px solid #F3F4F6;
  transition: background-color 0.15s;
}

.leaderboard-table tbody tr:hover {
  background: #F9FAFB;
}

.highlight-row {
  background: #EFF6FF !important;
}

.leaderboard-table td {
  padding: 0.75rem 1rem;
}

.rank-cell {
  width: 60px;
}

.rank-number {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.rank-number.gold {
  color: #F59E0B;
  font-size: 1rem;
}

.rank-number.silver {
  color: #6B7280;
  font-size: 1rem;
}

.rank-number.bronze {
  color: #FB923C;
  font-size: 1rem;
}

.user-cell {
  min-width: 200px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.15s;
}

.user-name:hover {
  color: var(--primary-color);
}

.me-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0.125rem 0 0 0;
}

.days-count {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.streak {
  font-weight: 500;
}

.streak.current {
  color: #10B981;
}

.streak.longest {
  color: #8B5CF6;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
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

@media (max-width: 640px) {
  .filter-section {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .leaderboard-table {
    font-size: 0.875rem;
  }
  
  .leaderboard-table th,
  .leaderboard-table td {
    padding: 0.5rem;
  }
  
  .user-avatar {
    width: 2rem;
    height: 2rem;
  }
}
</style>