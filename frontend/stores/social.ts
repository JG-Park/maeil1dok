import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

interface User {
  id: number
  username: string
  nickname: string
  profile_image?: string
  is_following?: boolean
  total_completed_days?: number
}

interface Friend extends User {
  is_mutual: boolean
}

export const useSocialStore = defineStore('social', {
  state: () => ({
    followers: [] as User[],
    following: [] as User[],
    friends: [] as Friend[],
    searchResults: [] as User[],
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    followersCount: (state) => state.followers.length,
    followingCount: (state) => state.following.length,
    friendsCount: (state) => state.friends.length,
    
    isFollowing: (state) => (userId: number) => {
      return state.following.some(user => user.id === userId)
    },
    
    isFriend: (state) => (userId: number) => {
      return state.friends.some(friend => friend.id === userId)
    }
  },

  actions: {
    async fetchFollowers(userId: number) {
      this.isLoading = true
      this.error = null
      try {
        const response = await useApi().get(`/api/v1/accounts/followers/${userId}/`)
        if (response.data?.success) {
          this.followers = response.data.followers
        } else {
          this.error = response.data?.error || '팔로워를 불러올 수 없습니다.'
        }
      } catch (error: any) {
        console.error('팔로워 조회 실패:', error)
        this.error = error.message || '팔로워를 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchFollowing(userId: number) {
      this.isLoading = true
      this.error = null
      try {
        const response = await useApi().get(`/api/v1/accounts/following/${userId}/`)
        if (response.data?.success) {
          this.following = response.data.following
        } else {
          this.error = response.data?.error || '팔로잉 목록을 불러올 수 없습니다.'
        }
      } catch (error: any) {
        console.error('팔로잉 조회 실패:', error)
        this.error = error.message || '팔로잉 목록을 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchFriends() {
      this.isLoading = true
      this.error = null
      try {
        const response = await useApi().get('/api/v1/accounts/friends/')
        if (response.data?.success) {
          const friendsData = response.data.data?.friends || response.data.friends
          this.friends = friendsData.map((friend: User) => ({
            ...friend,
            is_mutual: true
          }))
        } else {
          this.error = response.data?.error || '친구 목록을 불러올 수 없습니다.'
        }
      } catch (error: any) {
        console.error('친구 목록 조회 실패:', error)
        this.error = error.message || '친구 목록을 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async followUser(userId: number) {
      try {
        const response = await useApi().post('/api/v1/accounts/follow/', {
          user_id: userId
        })

        if (response?.success) {
          // 팔로잉 목록 업데이트
          const authStore = useAuthStore()
          if (authStore.user?.id) {
            await this.fetchFollowing(authStore.user.id)
          }
          return { success: true }
        } else {
          return { success: false, error: response?.error || '팔로우에 실패했습니다.' }
        }
      } catch (error: any) {
        return { success: false, error: error.message || '팔로우에 실패했습니다.' }
      }
    },

    async unfollowUser(userId: number) {
      try {
        const response = await useApi().delete(`/api/v1/accounts/unfollow/${userId}/`)

        if (response?.success) {
          // 팔로잉 목록에서 제거
          this.following = this.following.filter(user => user.id !== userId)
          // 친구 목록에서도 제거 (상호 팔로우가 깨짐)
          this.friends = this.friends.filter(friend => friend.id !== userId)
          return { success: true }
        } else {
          return { success: false, error: response?.error || '언팔로우에 실패했습니다.' }
        }
      } catch (error: any) {
        return { success: false, error: error.message || '언팔로우에 실패했습니다.' }
      }
    },

    async searchUsers(query: string) {
      if (query.length < 2) {
        this.searchResults = []
        return
      }

      this.isLoading = true
      this.error = null
      try {
        const response = await useApi().get('/api/v1/accounts/search/', {
          params: { q: query }
        })

        if (response.data?.success) {
          this.searchResults = response.data.users
        } else {
          this.searchResults = []
        }
      } catch (error: any) {
        console.error('사용자 검색 실패:', error)
        this.searchResults = []
      } finally {
        this.isLoading = false
      }
    },

    clearSearchResults() {
      this.searchResults = []
    },

    clearSocialData() {
      this.followers = []
      this.following = []
      this.friends = []
      this.searchResults = []
      this.error = null
    }
  }
})