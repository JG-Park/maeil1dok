<template>
  <div class="container">
    <!-- 고정 영역 -->
    <div class="fixed-area">
      <PageHeader title="그룹">
        <template #action>
          <button
            v-if="isAuthenticated"
            @click="showCreateModal = true"
            class="action-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </template>
      </PageHeader>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <div class="content-wrapper">
        <!-- 검색 및 필터 -->
      <Card class="mb-6 fade-in">
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="그룹 검색..."
              class="input-field"
              @input="debouncedSearch"
            >
          </div>
        </div>

        <FilterButtonGroup
          v-model="activeFilter"
          :options="filters"
          label="필터"
        />
      </Card>

      <!-- 로딩 상태 -->
      <LoadingState v-if="isLoading" message="그룹을 불러오는 중..." />

      <!-- 그룹 목록 -->
      <div v-else-if="currentGroups.length > 0" class="groups-grid fade-in delay-100">
        <GroupCard
          v-for="group in currentGroups"
          :key="group.id"
          :group="group"
          :is-authenticated="isAuthenticated"
          @join="joinGroup"
        />
      </div>

      <!-- 빈 상태 -->
      <EmptyState
        v-else
        :title="searchQuery ? '검색 결과가 없습니다' : '아직 그룹이 없습니다'"
        :description="searchQuery ? '다른 검색어로 시도해보세요.' : '다른 사용자들과 함께 성경을 읽어보세요!'"
        :action-text="isAuthenticated && !searchQuery ? '첫 그룹 만들기' : ''"
        @action="showCreateModal = true"
      >
        <template #icon>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </template>
      </EmptyState>
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
import PageHeader from '~/components/common/PageHeader.vue'
import Card from '~/components/common/Card.vue'
import FilterButtonGroup from '~/components/common/FilterButtonGroup.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import LoadingState from '~/components/LoadingState.vue'
import GroupCard from '~/components/groups/GroupCard.vue'

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

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  height: 100vh;
  height: 100dvh; /* 동적 뷰포트 높이 */
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  position: relative;
  width: 100%;
}

.fixed-area {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

.scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* iOS 안전영역 대응 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .scroll-area {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.content-wrapper {
  padding: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: var(--primary-light);
}

.action-button:active {
  transform: scale(0.95);
}

.groups-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
