import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

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
      try {
        const { data } = await useApi().get(`/api/v1/accounts/followers/${userId}/`)
        if (data.value?.success) {
          this.followers = data.value.followers
        }
      } catch (error) {
        console.error('팔로워 조회 실패:', error)
        this.error = '팔로워를 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchFollowing(userId: number) {
      this.isLoading = true
      try {
        const { data } = await useApi().get(`/api/v1/accounts/following/${userId}/`)
        if (data.value?.success) {
          this.following = data.value.following
        }
      } catch (error) {
        console.error('팔로잉 조회 실패:', error)
        this.error = '팔로잉 목록을 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchFriends() {
      this.isLoading = true
      try {
        const { data } = await useApi().get('/api/v1/accounts/friends/')
        if (data.value?.success) {
          this.friends = data.value.friends.map((friend: User) => ({
            ...friend,
            is_mutual: true
          }))
        }
      } catch (error) {
        console.error('친구 목록 조회 실패:', error)
        this.error = '친구 목록을 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async followUser(userId: number) {
      try {
        const { data } = await useApi().post('/api/v1/accounts/follow/', {
          user_id: userId
        })
        
        if (data.value?.success) {
          // 팔로잉 목록 업데이트
          await this.fetchFollowing(useAuthStore().user?.id || 0)
          return { success: true }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    async unfollowUser(userId: number) {
      try {
        const { data } = await useApi().delete(`/api/v1/accounts/unfollow/${userId}/`)
        
        if (data.value?.success) {
          // 팔로잉 목록에서 제거
          this.following = this.following.filter(user => user.id !== userId)
          // 친구 목록에서도 제거 (상호 팔로우가 깨짐)
          this.friends = this.friends.filter(friend => friend.id !== userId)
          return { success: true }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    async searchUsers(query: string) {
      if (query.length < 2) {
        this.searchResults = []
        return
      }

      this.isLoading = true
      try {
        const { data } = await useApi().get('/api/v1/accounts/search/', {
          params: { q: query }
        })
        
        if (data.value?.success) {
          this.searchResults = data.value.users
        }
      } catch (error) {
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