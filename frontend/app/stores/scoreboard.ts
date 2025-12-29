import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

interface LeaderboardEntry {
  rank: number
  user: {
    id: number
    nickname: string
    profile_image?: string
    is_me?: boolean
    role?: string
  }
  completed_days: number
  progress_rate: number
  current_streak: number
  longest_streak: number
  joined_at?: string
}

interface MyRanking {
  rank: number
  total_users: number
  completed_days: number
  current_streak: number
  longest_streak: number
  percentile: number
}

type Period = 'all' | 'week' | 'month'
type FollowType = 'mutual' | 'following'

export const useScoreboardStore = defineStore('scoreboard', {
  state: () => ({
    globalLeaderboard: [] as LeaderboardEntry[],
    friendsLeaderboard: [] as LeaderboardEntry[],
    followingLeaderboard: [] as LeaderboardEntry[],
    groupLeaderboard: [] as LeaderboardEntry[],
    myRanking: null as MyRanking | null,
    currentPeriod: 'all' as Period,
    currentFollowType: 'mutual' as FollowType,
    currentPlanId: null as number | null,
    currentGroupId: null as number | null,
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    topThree: (state) => state.globalLeaderboard.slice(0, 3),
    myPosition: (state) => state.globalLeaderboard.find(entry => entry.user.is_me),

    formattedPeriod: (state) => {
      const periods = {
        all: '전체',
        week: '이번 주',
        month: '이번 달'
      }
      return periods[state.currentPeriod]
    },

    currentLeaderboard: (state) => {
      // 현재 선택된 팔로우 타입에 따라 리더보드 반환
      if (state.currentFollowType === 'following') {
        return state.followingLeaderboard
      }
      return state.friendsLeaderboard
    }
  },

  actions: {
    async fetchGlobalLeaderboard(period: Period = 'all', planId?: number, limit: number = 100) {
      this.isLoading = true
      this.error = null
      this.currentPeriod = period
      this.currentPlanId = planId || null
      
      try {
        const params: any = { period, limit }
        if (planId) params.plan_id = planId
        
        const response = await useApi().get('/api/v1/todos/scoreboard/', { params })

        if (response.data?.success) {
          this.globalLeaderboard = response.data.leaderboard
        }
      } catch (error: any) {
        this.error = error.message || '리더보드를 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchFriendsLeaderboard(period: Period = 'all', planId?: number, type: FollowType = 'mutual') {
      this.isLoading = true
      this.error = null
      this.currentPeriod = period
      this.currentFollowType = type

      try {
        const params: any = { period, type }
        if (planId) params.plan_id = planId

        const response = await useApi().get('/api/v1/todos/scoreboard/friends/', { params })

        if (response.data?.success) {
          // type에 따라 다른 상태에 저장
          if (type === 'following') {
            this.followingLeaderboard = response.data.leaderboard
          } else {
            this.friendsLeaderboard = response.data.leaderboard
          }
        }
      } catch (error: any) {
        this.error = error.message || '친구 리더보드를 불러올 수 없습니다.'
        console.error('친구 리더보드 조회 실패:', error)
      } finally {
        this.isLoading = false
      }
    },

    async fetchGroupLeaderboard(groupId: number, period: Period = 'all') {
      this.isLoading = true
      this.currentPeriod = period
      this.currentGroupId = groupId
      
      try {
        const response = await useApi().get(`/api/v1/todos/scoreboard/group/${groupId}/`, {
          params: { period }
        })

        if (response.data?.success) {
          this.groupLeaderboard = response.data.leaderboard
        }
      } catch (error: any) {
        this.error = error.message || '그룹 리더보드를 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchMyRanking(period: Period = 'all', planId?: number) {
      try {
        const params: any = { period }
        if (planId) params.plan_id = planId
        
        const response = await useApi().get('/api/v1/todos/scoreboard/my-ranking/', { params })

        if (response.data?.success) {
          this.myRanking = response.data.ranking
        }
      } catch (error) {
        console.error('내 순위 조회 실패:', error)
      }
    },

    setPeriod(period: Period) {
      this.currentPeriod = period
    },

    setFollowType(type: FollowType) {
      this.currentFollowType = type
    },

    clearScoreboardData() {
      this.globalLeaderboard = []
      this.friendsLeaderboard = []
      this.followingLeaderboard = []
      this.groupLeaderboard = []
      this.myRanking = null
      this.currentPeriod = 'all'
      this.currentFollowType = 'mutual'
      this.currentPlanId = null
      this.currentGroupId = null
      this.error = null
    }
  }
})