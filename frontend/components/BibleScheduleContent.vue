<template>
  <div class="bible-schedule-wrapper">
    <!-- 고정 영역 -->
    <div class="fixed-controls">
      <!-- 상단 줄: 플랜 선택기 + 월 선택기 -->
      <div class="top-row">
        <!-- 플랜 선택기 버튼 -->
        <div class="plan-selector fade-in" style="animation-delay: 0.05s">
          <button class="plan-select-button" @click="showPlanModal = true">
            <span>{{ selectedPlanName }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <!-- 월 선택기 -->
        <div class="month-scroll fade-in" style="animation-delay: 0.1s">
          <button v-for="month in months" :key="month" :class="['month-button', { active: month === selectedMonth }]"
            @click="selectedMonth = month">
            {{ month }}월
          </button>
        </div>
      </div>

      <!-- 하단 줄: 상태 표시기 -->
      <div class="status-indicators fade-in" style="animation-delay: 0.15s">
        <div class="controls">
          <span class="controls-label">빠른 이동</span>
          <span class="controls-divider">|</span>
          <div class="control-buttons">
            <button v-if="props.currentBook && props.currentChapter" class="control-button"
              @click="scrollToCurrentLocation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
              현재위치
            </button>
            <button class="control-button" @click="scrollToToday">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              오늘
            </button>
            <button class="control-button" @click="scrollToLastIncomplete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              마지막 미완료
            </button>
          </div>
        </div>
      </div>

      <!-- 일괄 수정 모드 인디케이터 추가 -->
      <Transition name="slide-fade">
        <div v-if="props.isBulkEditMode" class="bulk-edit-indicator">
          <template v-if="!bulkEditState.showActions">
            <span class="bulk-edit-message">{{ bulkEditState.message }}</span>
          </template>
          <template v-else>
            <span class="bulk-edit-message">{{ bulkEditState.message }}</span>
            <div class="bulk-edit-actions">
              <button class="action-button complete" @click="handleBulkAction('complete')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                읽음
              </button>
              <span class="action-divider">|</span>
              <button class="action-button cancel" @click="handleBulkAction('cancel')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                읽지 않음
              </button>
              <span class="bulk-edit-message">으로 기록</span>
            </div>
          </template>
        </div>
      </Transition>

      <!-- 비로그인 사용자 기본 플랜 안내 메시지 -->
      <Transition name="slide-fade">
        <div v-if="showDefaultPlanMessage && !authStore.isAuthenticated"
          class="bulk-edit-indicator default-plan-indicator">
          <span class="bulk-edit-message">비로그인 사용자는 <strong>{{ defaultPlanName }}</strong>이 기본 선택되요.</span>
        </div>
      </Transition>
    </div>

    <!-- 일정 목록 -->
    <div class="schedule-body fade-in" style="animation-delay: 0.2s" :data-is-modal="props.isModal" ref="scheduleBodyRef">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>일정을 불러오는 중...</span>
      </div>
      <div v-else-if="!isInitialized" class="loading-state">
        <div class="loading-spinner"></div>
        <span>초기화 중...</span>
      </div>
      <div v-else-if="!route.query.plan && !props.useDefaultPlan" class="no-plan-selected">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span>플랜을 선택해주세요</span>
      </div>
      <div v-else-if="filteredGroupedSchedules && Object.keys(filteredGroupedSchedules).length === 0"
        class="no-schedules">
        {{ selectedMonth }}월에 등록된 일정이 없습니다.
      </div>
      <div v-else class="schedule-list">
        <div v-for="(scheduleGroup, date) in filteredGroupedSchedules" :key="date" :data-date="date"
          class="schedule-item" :class="[
            getReadingStatusForGroup(scheduleGroup),
            {
              'current-location': isCurrentLocationInGroup(scheduleGroup),
              'selected-range': isInSelectedRange(scheduleGroup[0] || null)
            }
          ]" @click="handleScheduleClick(scheduleGroup)">
          <!-- 통합 체크박스 (항상 왼쪽에 위치) -->
          <div class="checkbox" @click.stop>
            <input type="checkbox" :checked="getReadingStatusForGroup(scheduleGroup) === 'completed'"
              @click.stop="handleGroupCheckboxClick(scheduleGroup)">
          </div>

          <div class="schedule-info">
            <div class="schedule-date">
              <span v-if="isToday(date)" class="today-badge">오늘</span>
              {{ formatScheduleDate(date) }}
            </div>

            <!-- 다중 구간일 때 개별 클릭 가능하도록 수정 -->
            <template v-if="scheduleGroup.length > 1">
              <div v-for="schedule in scheduleGroup" :key="schedule.id" class="schedule-reading-item"
                :class="{ 'current-location': isCurrentLocation(schedule) }"
                @click.stop="handleIndividualScheduleClick(schedule)">
                <div class="checkbox" @click.stop>
                  <input type="checkbox" :checked="schedule.is_completed" @click.stop="handleCheckboxClick(schedule)">
                </div>
                <div class="schedule-reading">
                  <span v-if="isCurrentLocation(schedule)" class="current-location-badge">현재 위치</span>
                  <span class="bible-text">
                    {{ schedule.book }} {{ schedule.start_chapter === schedule.end_chapter ?
                      schedule.start_chapter : `${schedule.start_chapter}-${schedule.end_chapter}` }}장
                  </span>
                </div>
              </div>
            </template>
            <!-- 단일 구간일 때는 전체 영역 클릭 가능하도록 수정 -->
            <template v-else>
              <div class="schedule-reading" @click.stop="handleIndividualScheduleClick(scheduleGroup[0])">
                <span v-if="isCurrentLocationInGroup(scheduleGroup)" class="current-location-badge">현재 위치</span>
                <span class="bible-text">{{ formatScheduleGroup(scheduleGroup) }}</span>
              </div>
            </template>
          </div>

          <div class="status-text">
            <svg v-if="getReadingStatusForGroup(scheduleGroup) === 'completed'" class="status-icon" width="16"
              height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <svg v-else class="status-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            {{ getStatusTextForGroup(scheduleGroup) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 본문 이동 모달 -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-wrapper" @click.stop>
          <div class="modal">
            <div class="modal-content">
              <h3>본문 페이지로 이동하시겠어요?</h3>
              <p class="reading-info">
                <span class="date">{{ selectedSchedule?.date ? formatScheduleDate(selectedSchedule.date) : '' }}</span>
                <span class="content">{{ selectedSchedule?.book }} {{ selectedSchedule?.start_chapter }}-{{
                  selectedSchedule?.end_chapter }}장</span>
              </p>
              <p class="guide-text">
                <span class="sub-text">혹시 읽음 상태를 변경하려고 하셨나요?<br>왼쪽 체크박스를 직접 클릭하거나,<br>우측 상단 일괄수정 버튼을 누른 후 변경할 수
                  있어요.</span>
              </p>
              <div class="modal-buttons">
                <button class="cancel-button" @click="closeModal">취소</button>
                <button class="confirm-button" @click="confirmGoToSchedule">이동</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 로그인 안내 모달 추가 -->
    <Transition name="fade">
      <div v-if="showLoginModal" class="modal-overlay" @click="closeLoginModal">
        <div class="modal-wrapper" @click.stop>
          <div class="modal">
            <div class="modal-content">
              <h3>로그인이 필요해요</h3>
              <p class="reading-info">
                <span class="content">읽음 표시를 기록하시려면<br>로그인이 필요해요.</span>
              </p>
              <div class="modal-buttons">
                <button class="cancel-button" @click="closeLoginModal">취소</button>
                <button class="confirm-button" @click="goToLogin">로그인</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 플랜 선택 모달 -->
    <Transition name="fade">
      <div v-if="showPlanModal" class="modal-overlay" @click="showPlanModal = false">
        <div class="modal-wrapper" @click.stop>
          <div class="modal">
            <div class="modal-content">
              <h3>플랜 선택</h3>
              <div class="plan-list">
                <button v-for="subscription in subscriptions" :key="subscription.plan_id" class="plan-item" :class="{
                  active: String(subscription.plan_id) === String(route.query.plan)
                }" @click="selectPlan(subscription)">
                  <div class="plan-item-content">
                    <div class="plan-info">
                      <div class="check-icon-wrapper">
                        <svg v-show="String(subscription.plan_id) === String(route.query.plan)" class="check-icon"
                          xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span class="plan-name">{{ subscription.plan_name }}</span>
                    </div>
                    <div class="plan-badges">
                      <span v-if="subscription.is_default" class="default-badge">기본</span>
                    </div>
                  </div>
                </button>
              </div>
              <div class="modal-buttons">
                <button class="cancel-button" @click="showPlanModal = false">취소</button>
                <button class="manage-plan-button" @click="goToPlanManagement">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  플랜 관리
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 최상단 이동 버튼 -->
    <Transition name="fade">
      <button v-show="showScrollTop" class="scroll-top-button" @click="scrollToTop">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 19V5M12 5l-7 7M12 5l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
    </Transition>

    <!-- Toast 컴포넌트 ref 수정 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useScrollToElement } from '~/composables/useScrollToElement'

// 타입 정의
interface Schedule {
  id: number;
  date: string;
  book: string;
  start_chapter: number;
  end_chapter: number;
  is_completed: boolean;
}

interface Subscription {
  plan_id: string;
  plan_name: string;
  is_default?: boolean;
}

interface BulkEditState {
  firstSchedule: Schedule | null;
  secondSchedule: Schedule | null;
  message: string;
  showActions: boolean;
}

interface RangeSelectPayload {
  action: 'complete' | 'cancel';
  startSchedule: Schedule;
  endSchedule: Schedule;
  scheduleIds: number[];
  planId: string | null;
}

// Vue Router & Store
const authStore = useAuthStore()
const api = useApi()
const router = useRouter()
const route = useRoute()

// Props & Emits
const props = defineProps({
  isModal: {
    type: Boolean,
    default: false
  },
  currentBook: {
    type: String,
    default: ''
  },
  currentChapter: {
    type: Number,
    default: 0
  },
  useDefaultPlan: {
    type: Boolean,
    default: false
  },
  isBulkEditMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['schedule-select', 'range-select'])

// UI 상태 변수
const isLoading = ref(true)
const showModal = ref(false)
const showLoginModal = ref(false)
const showPlanModal = ref(false)
const showScrollTop = ref(false)
const showDefaultPlanMessage = ref(false)

// 데이터 상태 변수
const selectedMonth = ref(new Date().getMonth() + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const schedules = ref<Schedule[]>([])
const subscriptions = ref<Subscription[]>([])
const selectedSubscriptionId = ref<string | null>(null)
const selectedSchedule = ref<Schedule | null>(null)
const defaultPlanName = ref('')
const isInitialized = ref(false)

// 일괄 수정 상태 변수
const bulkEditState = ref<BulkEditState>({
  firstSchedule: null,
  secondSchedule: null,
  message: '첫번째 일정을 선택해주세요',
  showActions: false
})

// 스크롤 컨테이너 ref 추가
const scheduleBodyRef = ref<HTMLElement | null>(null)

// Toast & Scroll 컴포저블
const { success, error: showError, warning } = useToast()
const { scrollToElement, setScrollContainer } = useScrollToElement()

// Computed 속성
// 선택된 플랜 이름
const selectedPlanName = computed(() => {
    const planId = route.query.plan as string

  if (planId) {
    const selectedPlan = subscriptions.value.find(sub => String(sub.plan_id) === String(planId))
    if (selectedPlan) {
      return selectedPlan.plan_name
    }
  }

  if (selectedSubscriptionId.value) {
    const selectedPlan = subscriptions.value.find(sub => String(sub.plan_id) === String(selectedSubscriptionId.value))
    if (selectedPlan) {
      return selectedPlan.plan_name
    }
  }

  if (!props.useDefaultPlan) {
    return '플랜 선택'
  }

  if (subscriptions.value.length > 0) {
    return subscriptions.value[0].plan_name
  }

  return '플랜 선택'
})

// 날짜별로 그룹화된 스케줄
const filteredGroupedSchedules = computed(() => {
  if (!isInitialized.value) return null
  if (!schedules.value) return {}

  const monthlySchedules = schedules.value.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    return scheduleDate.getMonth() + 1 === selectedMonth.value
  })

  return groupSchedulesByDate(monthlySchedules)
})

// 스크롤 핸들러
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollY = target.scrollTop
  showScrollTop.value = scrollY > 200
}

// 최상단으로 스크롤
const scrollToTop = () => {
  scrollToElement(document.querySelector('.schedule-item') as HTMLElement, { behavior: 'smooth' })
}

// 날짜 포맷팅
const formatScheduleDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const isMobile = window.innerWidth <= 640

  if (isMobile) {
    return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`
}

// 오늘 날짜 확인
const isToday = (dateString: string) => {
  const today = new Date()
  const scheduleDate = new Date(dateString)

  return today.getFullYear() === scheduleDate.getFullYear() &&
    today.getMonth() === scheduleDate.getMonth() &&
    today.getDate() === scheduleDate.getDate()
}

// 성경책 그룹 포맷팅
const formatScheduleGroup = (scheduleGroup: Schedule[]) => {
  if (!scheduleGroup || scheduleGroup.length === 0) return ''

  if (scheduleGroup.length === 1) {
    const schedule = scheduleGroup[0]
    if (schedule.start_chapter === schedule.end_chapter) {
      return `${schedule.book} ${schedule.start_chapter}장`
    } else {
      return `${schedule.book} ${schedule.start_chapter}-${schedule.end_chapter}장`
    }
  } else {
    const firstBook = scheduleGroup[0]
    const lastBook = scheduleGroup[scheduleGroup.length - 1]
    const startChapterText = `${firstBook.start_chapter}장`
    const endChapterText = firstBook.book === lastBook.book &&
      firstBook.start_chapter === lastBook.end_chapter ?
      '' : `-${lastBook.book} ${lastBook.end_chapter}장`

    return `${firstBook.book} ${startChapterText}${endChapterText}`
  }
}

// 그룹 읽기 상태 확인
const getReadingStatusForGroup = (scheduleGroup: Schedule[]) => {
  if (!scheduleGroup || scheduleGroup.length === 0) return 'upcoming'

  const date = scheduleGroup[0].date
  const today = new Date()
  const scheduleDate = new Date(date)

  today.setHours(0, 0, 0, 0)
  scheduleDate.setHours(0, 0, 0, 0)

  const allCompleted = scheduleGroup.every(schedule => schedule.is_completed === true)

  if (allCompleted) return 'completed'

  if (scheduleDate < today) {
    return 'not_completed'
  }

  if (scheduleDate.getTime() === today.getTime()) {
    return 'current'
  }

  return 'upcoming'
}

// 그룹 상태 텍스트
const getStatusTextForGroup = (scheduleGroup: Schedule[]) => {
  const status = getReadingStatusForGroup(scheduleGroup)

  switch (status) {
    case 'completed':
      return '읽음'
    case 'not_completed':
      return '미완료'
    case 'current':
      return '오늘'
    case 'upcoming':
      return '예정'
    default:
      return ''
  }
}

// 현재 위치가 그룹 내에 있는지 확인
const isCurrentLocationInGroup = (scheduleGroup: Schedule[]) => {
  if (!props.currentBook || !props.currentChapter || !scheduleGroup) return false

  return scheduleGroup.some(schedule =>
    isCurrentLocation(schedule)
  )
}

// 선택된 구간에 있는지 확인
const isInSelectedRange = (scheduleGroup: Schedule | null) => {
  if (!props.isBulkEditMode ||
    !bulkEditState.value.firstSchedule ||
    !scheduleGroup) return false

  const firstDate = new Date(bulkEditState.value.firstSchedule.date)
  const currentDate = new Date(scheduleGroup.date)
  const secondDate = bulkEditState.value.secondSchedule
    ? new Date(bulkEditState.value.secondSchedule.date)
    : null

  if (!secondDate) {
    return firstDate.getTime() === currentDate.getTime()
  }

  const startDate = firstDate < secondDate ? firstDate : secondDate
  const endDate = firstDate < secondDate ? secondDate : firstDate

  return currentDate >= startDate && currentDate <= endDate
}

// API 호출 함수
// 구독 정보 가져오기
const fetchSubscriptions = async () => {
  try {
    const response = await api.get('/api/v1/todos/plan/')

    if (Array.isArray(response.data)) {
      subscriptions.value = response.data as Subscription[]
      handleSubscriptionSelection(response.data)
    } else if (response.data && response.data.plan_id) {
      subscriptions.value = [response.data as Subscription]
      handleSubscriptionSelection([response.data])
    } else {
      subscriptions.value = []
    }
  } catch (err) {
    // Error handled silently
  }
}

// 월별 스케줄 조회
const fetchSchedules = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/api/v1/todos/schedules/month/', {
      params: {
        plan_id: selectedSubscriptionId.value,
        month: selectedMonth.value
      }
    })
    schedules.value = response.data
  } catch (error) {
    // Error handled silently
  } finally {
    isLoading.value = false
  }
}

// 다음 위치 정보 가져오기
const fetchNextPosition = async () => {
  try {
    const { data } = await api.get('/api/v1/todos/next-position/', {
      params: { plan_id: selectedSubscriptionId.value },
    })
    return data
  } catch (error) {
    showError('다음 위치를 불러오는 데 실패했습니다.')
    return null
  }
}

// 현재 위치 정보 가져오기
const fetchCurrentPosition = async () => {
  try {
    const response = await api.get('/api/v1/todos/detail/', {
      params: {
        plan_id: selectedSubscriptionId.value,
        book: props.currentBook,
        chapter: props.currentChapter,
      },
    })
    return response.data
  } catch (error) {
    showError('현재 위치를 불러오는 데 실패했습니다.')
    return null
  }
}

// 읽기 상태 업데이트
const updateReadingStatus = async (scheduleIds: number[], action: 'complete' | 'cancel') => {
  try {
    await api.post('/api/v1/todos/reading/update/', {
      plan_id: selectedSubscriptionId.value,
      schedule_ids: scheduleIds,
      action: action
    })
    return true
  } catch (err) {
    showError('상태 변경에 실패했습니다. 다시 시도해주세요.')
    return false
  }
}

// 이벤트 핸들러
// 그룹 체크박스 클릭
const handleGroupCheckboxClick = async (scheduleGroup: Schedule[]) => {
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true
    return
  }

    const currentStatus = getReadingStatusForGroup(scheduleGroup)
    const isCompleted = currentStatus !== 'completed'
    const action = isCompleted ? 'complete' : 'cancel'
  const scheduleIds = scheduleGroup.map(schedule => schedule.id)

  // 낙관적 업데이트
    scheduleGroup.forEach(schedule => {
      schedule.is_completed = isCompleted
    })

  const successMessage = isCompleted ? '읽음 처리되었습니다.' : '읽지 않음으로 변경되었습니다.'

  const isSuccess = await updateReadingStatus(scheduleIds, action)

  if (isSuccess) {
    success(successMessage)
  } else {
    // 롤백
    scheduleGroup.forEach(schedule => {
      schedule.is_completed = !isCompleted
    })
  }
}

// 개별 체크박스 클릭
const handleCheckboxClick = async (schedule: Schedule) => {
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true
    return
  }

    const isCompleted = !schedule.is_completed
    const action = isCompleted ? 'complete' : 'cancel'

  // 낙관적 업데이트
    schedule.is_completed = isCompleted

  const successMessage = isCompleted ? '읽음 처리되었습니다.' : '읽지 않음으로 변경되었습니다.'

  const isSuccess = await updateReadingStatus([schedule.id], action)

  if (isSuccess) {
    success(successMessage)
  } else {
    // 롤백
    schedule.is_completed = !isCompleted
  }
}

// 개별 일정 클릭
const handleIndividualScheduleClick = (schedule: Schedule) => {
  if (props.isBulkEditMode) {
    handleScheduleClick([schedule])
    return
  }

  if (props.isModal) {
    emit('schedule-select', schedule)
  } else {
    selectedSchedule.value = schedule
    showModal.value = true
  }
}

// 일정 클릭
const handleScheduleClick = (scheduleGroup: Schedule[]) => {
  if (!scheduleGroup || !scheduleGroup.length) return

  if (props.isBulkEditMode) {
    if (!bulkEditState.value.firstSchedule) {
      bulkEditState.value.firstSchedule = scheduleGroup[0]
      bulkEditState.value.message = '마지막 일정을 선택해주세요'
      return
    }

    if (!bulkEditState.value.secondSchedule) {
      bulkEditState.value.secondSchedule = scheduleGroup[0]
      bulkEditState.value.message = '선택한 일정을'
      bulkEditState.value.showActions = true
      return
    }
  } else {
  // 기존 일반 클릭 로직
  if (scheduleGroup.length === 1) {
    if (props.isModal) {
      emit('schedule-select', scheduleGroup[0])
    } else {
      selectedSchedule.value = scheduleGroup[0]
      showModal.value = true
    }
  }
}
}

// 플랜 선택
const selectPlan = (subscription: Subscription) => {
  selectedSubscriptionId.value = subscription.plan_id

  router.push({
    query: { ...route.query, plan: subscription.plan_id }
    })
  showPlanModal.value = false
}

// 일괄 수정 액션
const handleBulkAction = (action: 'complete' | 'cancel') => {
  if (!bulkEditState.value.firstSchedule || !bulkEditState.value.secondSchedule) {
    return
  }

  const startDate = new Date(bulkEditState.value.firstSchedule.date)
  const endDate = new Date(bulkEditState.value.secondSchedule.date)
  const [fromDate, toDate] = startDate <= endDate
    ? [startDate, endDate]
    : [endDate, startDate]

  const groupedSchedules = filteredGroupedSchedules.value
  if (!groupedSchedules) return

  const selectedSchedules: Schedule[] = []

  Object.values(groupedSchedules).forEach(group => {
    group.forEach(schedule => {
      const scheduleDate = new Date(schedule.date)
      if (scheduleDate >= fromDate && scheduleDate <= toDate) {
        selectedSchedules.push(schedule)
      }
    })
  })

  const selectedScheduleIds = selectedSchedules.map(schedule => schedule.id)

  const payload: RangeSelectPayload = {
    action,
    startSchedule: bulkEditState.value.firstSchedule,
    endSchedule: bulkEditState.value.secondSchedule,
    scheduleIds: selectedScheduleIds,
    planId: selectedSubscriptionId.value
  }

  emit('range-select', payload)

  const isCompleted = action === 'complete'
  selectedSchedules.forEach(schedule => {
    schedule.is_completed = isCompleted
  })

  bulkEditState.value = {
    firstSchedule: null,
    secondSchedule: null,
    message: '첫번째 일정을 선택해주세요',
    showActions: false
  }
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = ''
}

// 본문 페이지로 이동
const confirmGoToSchedule = () => {
  if (selectedSchedule.value) {
    const queryParams = new URLSearchParams()

    Object.entries(route.query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        queryParams.append(key, value)
      } else if (Array.isArray(value)) {
        value.forEach(v => {
          if (v !== null) {
            queryParams.append(key, String(v))
          }
        })
      }
    })

    if (selectedSubscriptionId.value) {
      queryParams.set('plan', selectedSubscriptionId.value)
    }

    queryParams.set('from', 'reading-plan')

    if (selectedSchedule.value.book) {
      const bookCode = findBookCode(selectedSchedule.value.book)
      if (bookCode) {
        queryParams.set('book', bookCode)
        queryParams.set('chapter', String(selectedSchedule.value.start_chapter))
      }
    }

    router.push({
      path: '/reading',
      query: Object.fromEntries(queryParams)
    })

    showModal.value = false
  }
}

// 로그인 모달 닫기 & 로그인 페이지로 이동
const closeLoginModal = () => {
  showLoginModal.value = false
  document.body.style.overflow = ''
}

const goToLogin = () => {
  const currentQuery = { ...route.query }
  const queryParams = new URLSearchParams()

  Object.entries(currentQuery).forEach(([key, value]) => {
    if (typeof value === 'string') {
      queryParams.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach(v => queryParams.append(key, v))
    }
  })

  const queryString = queryParams.toString()
  const currentPath = `${route.path}${queryString ? '?' + queryString : ''}`

  router.push({
    path: '/login',
    query: {
      redirect: currentPath
    }
  })

  showLoginModal.value = false
}

// 플랜 관리 페이지로 이동
const goToPlanManagement = () => {
  showPlanModal.value = false
  router.push('/plans')
  }

// 스크롤 함수
// 오늘 날짜로 스크롤
const scrollToToday = async () => {
  const today = new Date()
  const todayMonth = today.getMonth() + 1
  const todayString = today.toISOString().split('T')[0]

  if (selectedMonth.value !== todayMonth) {
    selectedMonth.value = todayMonth
    await fetchSchedules()
  }

  await nextTick()
  const todayElement = document.querySelector(`[data-date="${todayString}"]`)
  scrollToElement(todayElement as HTMLElement)
}

// 마지막 미완료 항목으로 스크롤
const scrollToLastIncomplete = async () => {
  const data = await fetchNextPosition()

  if (data && data.success) {
      if (selectedMonth.value !== data.month) {
        selectedMonth.value = data.month
        await fetchSchedules()
        await nextTick()
      }

      const element = document.querySelector(`[data-date="${data.date}"]`)
      scrollToElement(element as HTMLElement)
    } else {
      warning('다음 읽을 위치를 찾을 수 없습니다.')
    }
}

// 현재 위치로 스크롤
const scrollToCurrentLocation = async () => {
  if (!props.currentBook || !props.currentChapter) return

  const data = await fetchCurrentPosition()

    if (data && data.plan_date) {
      const targetMonth = new Date(data.plan_date).getMonth() + 1
      if (selectedMonth.value !== targetMonth) {
        selectedMonth.value = targetMonth
        await fetchSchedules()
      await nextTick()
      }

      const targetElement = document.querySelector(`[data-date="${data.plan_date}"]`)
      scrollToElement(targetElement as HTMLElement)
    }
}

// 유틸리티 함수
// 스케줄 그룹을 날짜별로 그룹화
const groupSchedulesByDate = (scheduleList: Schedule[]) => {
  if (!scheduleList) return {}

  const grouped: Record<string, Schedule[]> = {}
  scheduleList.forEach(schedule => {
    if (!grouped[schedule.date]) {
      grouped[schedule.date] = []
    }
    grouped[schedule.date].push(schedule)
  })

  // 각 날짜의 스케줄을 성경책 순서대로 정렬
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      const aIndex = getBibleBookOrder(a.book)
      const bIndex = getBibleBookOrder(b.book)
      return aIndex - bIndex
    })
  })

  return grouped
}

// 성경책 순서 인덱스 반환
const getBibleBookOrder = (koreanName: string) => {
  const bibleOrder = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기', 
    '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', 
    '에스더', '욥기', '시편', '잠언', '전도서', '아가', '이사야', '예레미야', '예레미야애가', 
    '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', 
    '하박국', '스바냐', '학개', '스가랴', '말라기',
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전', '로마서', '고린도전서', 
    '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', 
    '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서', 
    '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서', '요한계시록'
  ]
  
  const index = bibleOrder.indexOf(koreanName)
  return index === -1 ? 999 : index // 찾지 못한 경우 맨 뒤로
}

// 현재 위치 확인
const isCurrentLocation = (schedule: Schedule) => {
  if (!props.isModal || !props.currentBook || !props.currentChapter) return false

  const bookCode = findBookCode(schedule.book)
  return bookCode === props.currentBook &&
    props.currentChapter >= schedule.start_chapter &&
    props.currentChapter <= schedule.end_chapter
}

// 한글 성경 이름을 코드로 변환
const findBookCode = (koreanName: string) => {
  const bibleBooks = {
    old: [{ id: 'gen', name: '창세기' }, { id: 'exo', name: '출애굽기' }, { id: 'lev', name: '레위기' }, { id: 'num', name: '민수기' }, { id: 'deu', name: '신명기' }, { id: 'jos', name: '여호수아' }, { id: 'jdg', name: '사사기' }, { id: 'rut', name: '룻기' }, { id: '1sa', name: '사무엘상' }, { id: '2sa', name: '사무엘하' }, { id: '1ki', name: '열왕기상' }, { id: '2ki', name: '열왕기하' }, { id: '1ch', name: '역대상' }, { id: '2ch', name: '역대하' }, { id: 'ezr', name: '에스라' }, { id: 'neh', name: '느헤미야' }, { id: 'est', name: '에스더' }, { id: 'job', name: '욥기' }, { id: 'psa', name: '시편' }, { id: 'pro', name: '잠언' }, { id: 'ecc', name: '전도서' }, { id: 'sng', name: '아가' }, { id: 'isa', name: '이사야' }, { id: 'jer', name: '예레미야' }, { id: 'lam', name: '예레미야애가' }, { id: 'ezk', name: '에스겔' }, { id: 'dan', name: '다니엘' }, { id: 'hos', name: '호세아' }, { id: 'jol', name: '요엘' }, { id: 'amo', name: '아모스' }, { id: 'oba', name: '오바댜' }, { id: 'jon', name: '요나' }, { id: 'mic', name: '미가' }, { id: 'nam', name: '나훔' }, { id: 'hab', name: '하박국' }, { id: 'zep', name: '스바냐' }, { id: 'hag', name: '학개' }, { id: 'zec', name: '스가랴' }, { id: 'mal', name: '말라기' }],
    new: [{ id: 'mat', name: '마태복음' }, { id: 'mrk', name: '마가복음' }, { id: 'luk', name: '누가복음' }, { id: 'jhn', name: '요한복음' }, { id: 'act', name: '사도행전' }, { id: 'rom', name: '로마서' }, { id: '1co', name: '고린도전서' }, { id: '2co', name: '고린도후서' }, { id: 'gal', name: '갈라디아서' }, { id: 'eph', name: '에베소서' }, { id: 'php', name: '빌립보서' }, { id: 'col', name: '골로새서' }, { id: '1th', name: '데살로니가전서' }, { id: '2th', name: '데살로니가후서' }, { id: '1ti', name: '디모데전서' }, { id: '2ti', name: '디모데후서' }, { id: 'tit', name: '디도서' }, { id: 'phm', name: '빌레몬서' }, { id: 'heb', name: '히브리서' }, { id: 'jas', name: '야고보서' }, { id: '1pe', name: '베드로전서' }, { id: '2pe', name: '베드로후서' }, { id: '1jn', name: '요한일서' }, { id: '2jn', name: '요한이서' }, { id: '3jn', name: '요한삼서' }, { id: 'jud', name: '유다서' }, { id: 'rev', name: '요한계시록' }]
  }

  const allBooks = [...bibleBooks.old, ...bibleBooks.new]
  const book = allBooks.find(b => b.name === koreanName)
  return book?.id
}

// 초기화 및 Watch
// 컴포넌트 초기화
const initializeComponent = async () => {
  try {
    await fetchSubscriptions()

    if (selectedSubscriptionId.value) {
      await fetchSchedules()
    }

    isInitialized.value = true
  } catch (err) {
    // Error handled silently
  } finally {
    isLoading.value = false
  }
}

// 플랜 선택 후 처리 로직
const handleSubscriptionSelection = (subscriptionData: Subscription[]) => {
  // URL에 plan 파라미터가 있는지 확인
  if (route.query.plan) {
    const planId = route.query.plan as string

    const planExists = subscriptionData.some(sub => {
      return String(sub.plan_id) === String(planId)
    })

    if (planExists) {
      selectedSubscriptionId.value = planId
    } else if (subscriptionData.length > 0) {
      selectedSubscriptionId.value = subscriptionData[0].plan_id
      updateUrlPlanId(subscriptionData[0].plan_id)
    }
  } else if (subscriptionData.length > 0 && !selectedSubscriptionId.value) {
    if (props.useDefaultPlan || !authStore.isAuthenticated) {
      selectedSubscriptionId.value = subscriptionData[0].plan_id
      updateUrlPlanId(subscriptionData[0].plan_id)

      if (!authStore.isAuthenticated) {
        defaultPlanName.value = subscriptionData[0].plan_name
        showDefaultPlanMessage.value = false

        setTimeout(() => {
          showDefaultPlanMessage.value = true

          setTimeout(() => {
            showDefaultPlanMessage.value = false
          }, 5000)
        }, 500)
      }
    }
  }
}

// URL 파라미터 업데이트
const updateUrlPlanId = (planId: string) => {
  router.push({
    query: { ...route.query, plan: planId }
  })
}

// Lifecycle Hooks
onMounted(() => {
  // 스크롤 컨테이너 설정
  if (scheduleBodyRef.value) {
    setScrollContainer(scheduleBodyRef.value)
  }

  initializeComponent().then(() => {
    // 컴포넌트 초기화가 완료된 후에 scrollToLastIncomplete 호출
    if (props.isModal && props.currentBook && props.currentChapter) {
      setTimeout(async () => {
        await scrollToCurrentLocation()
      }, 800)
    } else {
      // 모달이 아닌 경우, 마지막 미완료 위치로 스크롤
      scrollToLastIncomplete()
    }
  })
})

onBeforeUnmount(() => {
  const scheduleBody = document.querySelector('.schedule-body')
  if (scheduleBody) {
    scheduleBody.removeEventListener('scroll', handleScroll)
  }
})

// Watchers
// 모달이 열릴 때 초기화
watch(() => props.isModal, async (newVal) => {
  if (newVal) {
    isInitialized.value = false
    isLoading.value = true

    await initializeComponent()

    if (props.currentBook && props.currentChapter) {
      setTimeout(async () => {
        await nextTick()
        await nextTick()
        try {
          await scrollToCurrentLocation()
        } catch (err) {
          // Error handled silently
        }
      }, 800)
    }
  }
}, { immediate: true })

// 월 또는 구독 ID 변경 시 스케줄 다시 조회
watch(
  [selectedMonth, selectedSubscriptionId],
  async ([newMonth, newSubscriptionId], [oldMonth, oldSubscriptionId]) => {
    if (newMonth === oldMonth && newSubscriptionId === oldSubscriptionId) {
      return
    }

    if (isInitialized.value) {
      try {
        await fetchSchedules()
      } catch (error) {
        // Error handled silently
      }
    }
  }
)

// 일괄 수정 모드가 비활성화될 때 상태 초기화
watch(() => props.isBulkEditMode, (newValue) => {
  if (!newValue) {
    bulkEditState.value = {
      firstSchedule: null,
      secondSchedule: null,
      message: '첫번째 일정을 선택해주세요',
      showActions: false
    }
  }
})

// URL의 plan 파라미터 변경 감지
watch(() => route.query.plan, async (newPlanId, oldPlanId) => {
  if (newPlanId && newPlanId !== oldPlanId && String(newPlanId) !== String(selectedSubscriptionId.value)) {
    selectedSubscriptionId.value = String(newPlanId)

    if (isInitialized.value) {
      try {
        await fetchSchedules()
      } catch (error) {
        // Error handled silently
      } finally {
        // 플랜 변경 후 스케줄 로딩이 완료되면 마지막 미완료 위치로 스크롤
        scrollToLastIncomplete()
      }
    }
  }
}, { immediate: true })
</script>

<style scoped src="./BibleScheduleContent.style.css"></style>