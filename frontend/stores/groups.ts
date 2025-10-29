import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

interface ReadingGroup {
  id: number
  name: string
  description: string
  creator: {
    id: number
    nickname: string
    profile_image?: string
  }
  plan: {
    id: number
    name: string
    description: string
  }
  is_public: boolean
  max_members: number
  member_count: number
  is_full: boolean
  is_member?: boolean
  my_role?: string
  created_at: string
  updated_at: string
}

interface GroupMember {
  user: {
    id: number
    nickname: string
    profile_image?: string
  }
  role: string
  joined_at: string
}

interface GroupInvitation {
  id: number
  group: ReadingGroup
  inviter: {
    id: number
    nickname: string
    profile_image?: string
  }
  message: string
  created_at: string
}

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    groups: [] as ReadingGroup[],
    myGroups: [] as ReadingGroup[],
    currentGroup: null as ReadingGroup | null,
    currentGroupMembers: [] as GroupMember[],
    invitations: [] as GroupInvitation[],
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    publicGroups: (state) => state.groups.filter(g => g.is_public),
    memberGroups: (state) => state.myGroups.filter(g => g.is_member),
    adminGroups: (state) => state.myGroups.filter(g => g.my_role === '관리자'),
    pendingInvitations: (state) => state.invitations.length
  },

  actions: {
    async fetchGroups(filters: {
      search?: string
      plan_id?: number
      only_public?: boolean
      only_mine?: boolean
    } = {}) {
      this.isLoading = true
      this.error = null
      
      try {
        const { data } = await useApi().get('/api/v1/todos/groups/', {
          params: filters
        })
        
        if (data.value?.success) {
          if (filters.only_mine) {
            this.myGroups = data.value.groups
          } else {
            this.groups = data.value.groups
          }
        }
      } catch (error: any) {
        this.error = error.message || '그룹 목록을 불러올 수 없습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchGroupDetail(groupId: number) {
      this.isLoading = true
      
      try {
        const { data } = await useApi().get(`/api/v1/todos/groups/${groupId}/`)
        
        if (data.value?.success) {
          this.currentGroup = data.value.group
          return { success: true }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async fetchGroupMembers(groupId: number) {
      try {
        const { data } = await useApi().get(`/api/v1/todos/groups/${groupId}/members/`)
        
        if (data.value?.success) {
          this.currentGroupMembers = data.value.members
        }
      } catch (error) {
        console.error('그룹 멤버 조회 실패:', error)
      }
    },

    async createGroup(groupData: {
      name: string
      description: string
      plan_id: number
      is_public: boolean
      max_members: number
    }) {
      try {
        const { data } = await useApi().post('/api/v1/todos/groups/create/', groupData)
        
        if (data.value?.success) {
          this.myGroups.push(data.value.group)
          return { success: true, group: data.value.group }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    async joinGroup(groupId: number) {
      try {
        const { data } = await useApi().post(`/api/v1/todos/groups/${groupId}/join/`)
        
        if (data.value?.success) {
          // 그룹 정보 업데이트
          if (this.currentGroup?.id === groupId) {
            this.currentGroup.is_member = true
            this.currentGroup.member_count++
          }
          return { success: true }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    async leaveGroup(groupId: number) {
      try {
        const { data } = await useApi().post(`/api/v1/todos/groups/${groupId}/leave/`)
        
        if (data.value?.success) {
          // 그룹 정보 업데이트
          if (this.currentGroup?.id === groupId) {
            this.currentGroup.is_member = false
            this.currentGroup.member_count--
          }
          // 내 그룹 목록에서 제거
          this.myGroups = this.myGroups.filter(g => g.id !== groupId)
          return { success: true }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    async inviteToGroup(groupId: number, userId: number, message: string = '') {
      try {
        const { data } = await useApi().post(`/api/v1/todos/groups/${groupId}/invite/`, {
          user_id: userId,
          message
        })
        
        if (data.value?.success) {
          return { success: true }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    async fetchInvitations() {
      try {
        const { data } = await useApi().get('/api/v1/todos/invitations/')
        
        if (data.value?.success) {
          this.invitations = data.value.invitations
        }
      } catch (error) {
        console.error('초대 목록 조회 실패:', error)
      }
    },

    async respondToInvitation(invitationId: number, action: 'accept' | 'decline') {
      try {
        const { data } = await useApi().post(`/api/v1/todos/invitations/${invitationId}/respond/`, {
          action
        })
        
        if (data.value?.success) {
          // 초대 목록에서 제거
          this.invitations = this.invitations.filter(inv => inv.id !== invitationId)
          
          if (action === 'accept' && data.value.group) {
            // 내 그룹 목록에 추가
            this.myGroups.push(data.value.group)
          }
          
          return { success: true }
        } else {
          return { success: false, error: data.value?.error }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    clearGroupData() {
      this.groups = []
      this.myGroups = []
      this.currentGroup = null
      this.currentGroupMembers = []
      this.invitations = []
      this.error = null
    }
  }
})