<template>
  <div class="container">
    <!-- 고정 영역 -->
    <div class="fixed-area">
      <PageHeader :title="currentGroup?.name || '그룹 정보'" />
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <div class="content-wrapper">
        <!-- 로딩 상태 -->
        <LoadingState v-if="isLoading" message="그룹 정보를 불러오는 중..." />

        <!-- 에러 상태 -->
        <div v-else-if="error" class="error-state">
          <Card>
            <div class="error-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3>그룹을 불러올 수 없습니다</h3>
              <p>{{ error }}</p>
              <button @click="navigateTo('/groups')" class="btn-primary">
                그룹 목록으로 돌아가기
              </button>
            </div>
          </Card>
        </div>

        <!-- 그룹 정보 -->
        <template v-else-if="currentGroup">
          <!-- 그룹 기본 정보 -->
          <Card class="mb-4 fade-in">
            <div class="group-header">
              <div class="group-title-section">
                <h2 class="group-name">{{ currentGroup.name }}</h2>
                <span
                  :class="[
                    'status-badge',
                    currentGroup.is_public ? 'status-public' : 'status-private'
                  ]"
                >
                  {{ currentGroup.is_public ? '공개' : '비공개' }}
                </span>
              </div>

              <p class="group-description">
                {{ currentGroup.description || '설명이 없습니다.' }}
              </p>

              <div class="group-meta">
                <div class="meta-item">
                  <svg class="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>생성자: {{ currentGroup.creator?.nickname || '알 수 없음' }}</span>
                </div>

                <div class="meta-item">
                  <svg class="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>{{ currentGroup.member_count }}/{{ currentGroup.max_members }}명</span>
                </div>

                <div v-if="currentGroup.plans && currentGroup.plans.length > 0" class="meta-item plans-item">
                  <svg class="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  <div class="plans-list">
                    <span v-if="currentGroup.plans.length === 1">{{ currentGroup.plans[0].name }}</span>
                    <div v-else class="multiple-plans">
                      <span class="plan-badge" v-for="plan in currentGroup.plans" :key="plan.id">
                        {{ plan.name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div v-if="isAuthenticated" class="action-buttons">
              <button
                v-if="!currentGroup.is_member && !currentGroup.is_full"
                @click="handleJoinGroup"
                :disabled="isActionLoading"
                class="btn-primary"
              >
                {{ isActionLoading ? '처리 중...' : '그룹 가입하기' }}
              </button>

              <button
                v-else-if="currentGroup.is_member && currentGroup.my_role !== '관리자'"
                @click="handleLeaveGroup"
                :disabled="isActionLoading"
                class="btn-danger"
              >
                {{ isActionLoading ? '처리 중...' : '그룹 탈퇴하기' }}
              </button>

              <div v-else-if="currentGroup.is_member && currentGroup.my_role === '관리자'" class="admin-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>관리자</span>
              </div>

              <div v-else-if="currentGroup.is_full" class="full-badge">
                정원 초과
              </div>
            </div>
          </Card>

          <!-- 플랜 선택 및 일정 캘린더 -->
          <Card v-if="currentGroup.plans && currentGroup.plans.length > 0" class="mb-4 fade-in delay-100">
            <div class="section-header">
              <h3 class="section-title">읽기 계획 일정</h3>
            </div>

            <!-- 플랜 선택 탭 -->
            <div v-if="currentGroup.plans.length > 1" class="plan-tabs">
              <button
                v-for="plan in currentGroup.plans"
                :key="plan.id"
                @click="selectedPlanId = plan.id"
                :class="['plan-tab', { 'active': selectedPlanId === plan.id }]"
              >
                {{ plan.name }}
              </button>
            </div>

            <!-- 단일 플랜일 경우 이름만 표시 -->
            <div v-else class="single-plan-name">
              {{ currentGroup.plans[0].name }}
            </div>

            <!-- 캘린더 -->
            <GroupPlanCalendar
              v-if="selectedPlanId"
              :plan-id="selectedPlanId"
              class="mt-4"
            />
          </Card>

          <!-- 멤버 목록 -->
          <Card class="mb-4 fade-in delay-200">
            <div class="section-header">
              <h3 class="section-title">멤버 목록</h3>
              <span class="member-count-badge">{{ currentGroupMembers.length }}명</span>
            </div>

            <LoadingState v-if="isMembersLoading" message="멤버 목록을 불러오는 중..." />

            <div v-else-if="currentGroupMembers.length > 0" class="members-list">
              <div
                v-for="member in currentGroupMembers"
                :key="member.user.id"
                class="member-item"
              >
                <div class="member-info">
                  <div class="member-avatar">
                    <img
                      v-if="member.user.profile_image"
                      :src="member.user.profile_image"
                      :alt="member.user.nickname"
                      class="avatar-image"
                    >
                    <div v-else class="avatar-placeholder">
                      {{ member.user.nickname?.charAt(0) || '?' }}
                    </div>
                  </div>

                  <div class="member-details">
                    <div class="member-name">{{ member.user.nickname }}</div>
                    <div class="member-joined">
                      {{ formatDate(member.joined_at) }} 가입
                    </div>
                  </div>
                </div>

                <span
                  v-if="member.role === '관리자'"
                  class="role-badge role-admin"
                >
                  관리자
                </span>
                <span
                  v-else
                  class="role-badge role-member"
                >
                  멤버
                </span>
              </div>
            </div>

            <EmptyState
              v-else
              title="멤버가 없습니다"
              description="아직 가입한 멤버가 없습니다."
            >
              <template #icon>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </template>
            </EmptyState>
          </Card>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGroupsStore } from '~/stores/groups'
import { useAuthStore } from '~/stores/auth'
import PageHeader from '~/components/common/PageHeader.vue'
import Card from '~/components/common/Card.vue'
import LoadingState from '~/components/LoadingState.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import GroupPlanCalendar from '~/components/groups/GroupPlanCalendar.vue'

const route = useRoute()
const groupsStore = useGroupsStore()
const authStore = useAuthStore()

const groupId = computed(() => parseInt(route.params.id as string))
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentGroup = computed(() => groupsStore.currentGroup)
const currentGroupMembers = computed(() => groupsStore.currentGroupMembers)

const isLoading = ref(true)
const isMembersLoading = ref(true)
const isActionLoading = ref(false)
const error = ref<string | null>(null)
const selectedPlanId = ref<number | null>(null)

// 그룹 정보 로드
onMounted(async () => {
  await loadGroupData()
})

const loadGroupData = async () => {
  isLoading.value = true
  isMembersLoading.value = true
  error.value = null

  try {
    // 그룹 상세 정보 가져오기
    const result = await groupsStore.fetchGroupDetail(groupId.value)

    if (!result.success) {
      error.value = result.error || '그룹 정보를 불러올 수 없습니다.'
      return
    }

    // 첫 번째 플랜을 기본 선택
    if (currentGroup.value?.plans && currentGroup.value.plans.length > 0) {
      selectedPlanId.value = currentGroup.value.plans[0].id
    }

    // 멤버 목록 가져오기
    await groupsStore.fetchGroupMembers(groupId.value)
  } catch (err: any) {
    error.value = err.message || '그룹 정보를 불러올 수 없습니다.'
  } finally {
    isLoading.value = false
    isMembersLoading.value = false
  }
}

// 그룹 가입
const handleJoinGroup = async () => {
  if (!isAuthenticated.value) {
    alert('로그인이 필요합니다.')
    navigateTo('/login')
    return
  }

  isActionLoading.value = true

  try {
    const result = await groupsStore.joinGroup(groupId.value)

    if (result.success) {
      // 그룹 정보 다시 로드
      await loadGroupData()
    } else {
      alert(result.error || '그룹 가입에 실패했습니다.')
    }
  } catch (err: any) {
    alert(err.message || '그룹 가입에 실패했습니다.')
  } finally {
    isActionLoading.value = false
  }
}

// 그룹 탈퇴
const handleLeaveGroup = async () => {
  if (!confirm('정말로 이 그룹에서 탈퇴하시겠습니까?')) {
    return
  }

  isActionLoading.value = true

  try {
    const result = await groupsStore.leaveGroup(groupId.value)

    if (result.success) {
      // 그룹 목록으로 이동
      navigateTo('/groups')
    } else {
      alert(result.error || '그룹 탈퇴에 실패했습니다.')
    }
  } catch (err: any) {
    alert(err.message || '그룹 탈퇴에 실패했습니다.')
  } finally {
    isActionLoading.value = false
  }
}

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 페이지 떠날 때 정리
onUnmounted(() => {
  // currentGroup과 currentGroupMembers는 유지할 수도 있지만,
  // 메모리 효율을 위해 정리
  groupsStore.currentGroup = null
  groupsStore.currentGroupMembers = []
})
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  height: 100vh;
  height: 100dvh;
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

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .scroll-area {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.content-wrapper {
  padding: 1rem;
}

/* 에러 상태 */
.error-state {
  margin-top: 2rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem 1rem;
}

.error-content svg {
  color: var(--error-color, #EF4444);
}

.error-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.error-content p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 그룹 헤더 */
.group-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.group-name {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.status-public {
  background: #D1FAE5;
  color: #065F46;
}

.status-private {
  background: var(--gray-100);
  color: var(--gray-700);
}

.group-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

.group-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--gray-200);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.plans-item {
  align-items: flex-start;
}

.plans-list {
  flex: 1;
}

.multiple-plans {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.plan-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.btn-primary,
.btn-danger {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--blue-600);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--blue-700);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #EF4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #DC2626;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #FEF3C7;
  color: #92400E;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
}

.admin-badge svg {
  fill: #92400E;
  stroke: none;
}

.full-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  background: var(--gray-100);
  color: var(--gray-500);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
}

/* 플랜 선택 탭 */
.plan-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.plan-tab {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-300);
  background: white;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.plan-tab:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.plan-tab.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.single-plan-name {
  padding: 0.75rem 1rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1rem;
}

/* 섹션 헤더 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.member-count-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

/* 멤버 목록 */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.member-item:hover {
  background: var(--gray-100);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.member-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.member-joined {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.role-admin {
  background: #FEF3C7;
  color: #92400E;
}

.role-member {
  background: var(--gray-100);
  color: var(--gray-700);
}

/* 애니메이션 */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

.delay-100 {
  animation-delay: 0.1s;
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

/* 반응형 */
@media (max-width: 640px) {
  .group-name {
    font-size: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-danger,
  .admin-badge,
  .full-badge {
    width: 100%;
  }
}
</style>
