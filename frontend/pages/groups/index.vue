<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 헤더 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold text-gray-900">그룹</h1>
          <button
            v-if="isAuthenticated"
            @click="showCreateModal = true"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            그룹 만들기
          </button>
        </div>
        
        <!-- 검색 및 필터 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="그룹 검색..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              @input="debouncedSearch"
            >
          </div>
          
          <div class="flex gap-2">
            <button
              v-for="filter in filters"
              :key="filter.value"
              @click="activeFilter = filter.value"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 그룹 목록 -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">그룹을 불러오는 중...</p>
      </div>
      
      <div v-else-if="currentGroups.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="group in currentGroups"
          :key="group.id"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="p-6">
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ group.name }}
              </h3>
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  group.is_public
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ group.is_public ? '공개' : '비공개' }}
              </span>
            </div>
            
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">
              {{ group.description || '설명이 없습니다.' }}
            </p>
            
            <div class="space-y-2 text-sm text-gray-500 mb-4">
              <div class="flex items-center">
                <Icon name="mdi:book-open-variant" class="w-4 h-4 mr-2" />
                {{ group.plan.name }}
              </div>
              <div class="flex items-center">
                <Icon name="mdi:account-group" class="w-4 h-4 mr-2" />
                {{ group.member_count }}/{{ group.max_members }}명
              </div>
              <div class="flex items-center">
                <Icon name="mdi:account" class="w-4 h-4 mr-2" />
                {{ group.creator.nickname }}
              </div>
            </div>
            
            <div class="flex gap-2">
              <NuxtLink
                :to="`/groups/${group.id}`"
                class="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                상세보기
              </NuxtLink>
              
              <button
                v-if="isAuthenticated && !group.is_member && !group.is_full"
                @click="joinGroup(group.id)"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                가입하기
              </button>
              
              <button
                v-else-if="group.is_member"
                disabled
                class="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg cursor-default"
              >
                가입됨
              </button>
              
              <button
                v-else-if="group.is_full"
                disabled
                class="flex-1 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
              >
                정원 초과
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-white rounded-lg shadow-sm p-12 text-center">
        <Icon name="mdi:account-group-outline" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500">
          {{ searchQuery ? '검색 결과가 없습니다.' : '아직 그룹이 없습니다.' }}
        </p>
        <button
          v-if="isAuthenticated && !searchQuery"
          @click="showCreateModal = true"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          첫 그룹 만들기
        </button>
      </div>
    </div>
    
    <!-- 그룹 생성 모달 -->
    <CreateGroupModal 
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="onGroupCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { useGroupsStore } from '~/stores/groups'
import { useAuthStore } from '~/stores/auth'
import { debounce } from 'lodash-es'

const groupsStore = useGroupsStore()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isLoading = computed(() => groupsStore.isLoading)

const searchQuery = ref('')
const activeFilter = ref<'all' | 'public' | 'mine'>('all')
const showCreateModal = ref(false)

const filters = [
  { value: 'all', label: '모든 그룹' },
  { value: 'public', label: '공개 그룹' },
  { value: 'mine', label: '내 그룹' }
]

const currentGroups = computed(() => {
  if (activeFilter.value === 'mine') {
    return groupsStore.myGroups
  } else if (activeFilter.value === 'public') {
    return groupsStore.publicGroups
  }
  return groupsStore.groups
})

// 초기 데이터 로드
onMounted(() => {
  loadGroups()
})

// 그룹 로드
const loadGroups = () => {
  const filters: any = { search: searchQuery.value }
  
  if (activeFilter.value === 'public') {
    filters.only_public = true
  } else if (activeFilter.value === 'mine') {
    filters.only_mine = true
  }
  
  groupsStore.fetchGroups(filters)
}

// 검색 디바운스
const debouncedSearch = debounce(() => {
  loadGroups()
}, 300)

// 필터 변경 감시
watch(activeFilter, () => {
  loadGroups()
})

// 그룹 가입
const joinGroup = async (groupId: number) => {
  const result = await groupsStore.joinGroup(groupId)
  if (result.success) {
    // 그룹 목록 새로고침
    loadGroups()
  } else {
    alert(result.error || '그룹 가입에 실패했습니다.')
  }
}

// 그룹 생성 완료
const onGroupCreated = (group: any) => {
  showCreateModal.value = false
  navigateTo(`/groups/${group.id}`)
}

// 페이지 떠날 때 정리
onUnmounted(() => {
  groupsStore.clearGroupData()
})
</script>