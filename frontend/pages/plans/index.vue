<template>
  <div class="container">
    <!-- 고정 헤더 -->
    <div class="header fade-in">
      <button class="back-button" @click="$router.push('/')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
      <h1>플랜 관리</h1>
      <div style="width: 64px"></div>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <div v-if="!authStore.isAuthenticated" class="login-prompt fade-in" style="animation-delay: 0.2s">
        <p class="text-lg text-gray-600 mb-4">
          플랜을 구독하려면 로그인이 필요합니다.
        </p>
        <button @click="$router.push('/login')" class="login-button">로그인하기</button>
      </div>

      <div v-else class="content-section fade-in" style="animation-delay: 0.2s">
        <!-- 구독 중인 플랜 -->
        <section class="plan-section">
          <h2 class="section-title">
            <span>구독 중인 플랜</span>
            <span v-if="subscriptions.length" class="count-badge">
              {{ subscriptions.length }}개
            </span>
          </h2>

          <div v-if="!subscriptions.length" class="empty-state">
            <p>아직 구독 중인 플랜이 없습니다.</p>
          </div>

          <div v-else class="plan-grid">
            <div v-for="sub in subscriptions" :key="sub.id" class="plan-card">
              <div class="plan-card-content">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="plan-title">
                      {{ sub.plan_name }}
                      <span v-if="sub.is_default" class="default-badge">기본 플랜</span>
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">
                      구독 시작일: {{ formatDate(sub.start_date) }}
                    </p>
                  </div>
                  <div class="flex flex-col gap-2">
                    <button @click="goToReadingPlan(sub)" class="action-button today-reading">성경통독표</button>
                    <button v-if="!sub.is_default" @click="confirmUnsubscribe(sub)" :class="[
                      'action-button',
                      sub.is_active ? 'cancel' : 'resume'
                    ]">
                      {{ sub.is_active ? '구독 취소' : '다시 구독' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 구독 가능한 플랜 -->
        <section class="plan-section">
          <h2 class="section-title">
            <span>구독 가능한 플랜</span>
            <span v-if="availablePlans.length" class="count-badge">
              {{ availablePlans.length }}개
            </span>
          </h2>

          <div v-if="!availablePlans.length" class="empty-state">
            <p>현재 구독 가능한 플랜이 없습니다.</p>
          </div>

          <div v-else class="plan-grid">
            <div v-for="plan in availablePlans" :key="plan.id" class="plan-card">
              <div class="plan-card-content">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="plan-title">
                      {{ plan.name }}
                      <span v-if="plan.is_default" class="default-badge">기본 플랜</span>
                    </h3>
                    <p class="plan-description">{{ plan.description }}</p>
                    <p class="subscriber-count">
                      구독한 사람: {{ plan.subscriber_count }}명
                    </p>
                  </div>
                  <button @click="subscribe(plan)" class="action-button subscribe">구독하기</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 토스트 -->
    <Toast ref="toast" />

    <!-- 모달 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button @click="closeModal" class="close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <p>{{ modalMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="modal-button">확인</button>
          <button v-if="hasReadingData" @click="goToReading" class="modal-button primary">읽기 페이지로 이동</button>
        </div>
      </div>
    </div>

    <!-- 구독 취소 확인 모달 -->
    <div v-if="showUnsubscribeModal" class="modal-overlay" @click="closeUnsubscribeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>구독 취소 확인</h3>
          <button @click="closeUnsubscribeModal" class="close-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <p class="mb-4 text-red-600 font-bold">정말 구독을 취소하시겠어요?</p>
          <p>지금까지 진행된 내역이 전부 초기화되며, 복구할 수 없습니다.</p>
        </div>
        <div class="modal-footer">
          <button @click="closeUnsubscribeModal" class="modal-button">취소</button>
          <button @click="unsubscribePlan" class="modal-button primary bg-red-600 hover:bg-red-700">구독 취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useToast } from '~/composables/useToast'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import Toast from '~/components/Toast.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const api = useApi()
const toastRef = ref(null)

const subscriptions = ref([])
const availablePlans = ref([])

// 모달 관련 상태
const showModal = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const hasReadingData = ref(false)
const currentReadingData = ref(null)

// 구독 취소 관련 상태
const showUnsubscribeModal = ref(false)
const currentSubscription = ref(null)

// 날짜 포맷팅
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 사용자 플랜 정보 조회
const fetchUserPlans = async () => {
  if (!authStore.isAuthenticated) return

  try {
    const response = await api.get('/api/v1/todos/plans/user/')
    const responseData = response.data || response

    if (responseData.subscriptions) {
      subscriptions.value = responseData.subscriptions
    } else {
      subscriptions.value = []
    }

    if (responseData.available_plans) {
      availablePlans.value = responseData.available_plans
    } else {
      availablePlans.value = []
    }
  } catch (err) {
    console.error('API 오류 상세 정보:', err)
    console.error('API 오류 응답:', err.response)
    toast.error('플랜 정보를 불러오는데 실패했습니다.')
  }
}

// 플랜 구독
const subscribe = async (plan) => {
  try {
    await api.post('/api/v1/todos/plan/', {
      plan: plan.id
    })

    toast.success(`${plan.name} 플랜을 구독했습니다.`)

    // 목록 새로고침
    await fetchUserPlans()
  } catch (err) {
    if (err.response?.data?.detail) {
      toast.error(err.response.data.detail)
    } else {
      toast.error('플랜 구독에 실패했습니다.')
    }
  }
}

// 구독 상태 토글 (취소/재개)
const toggleSubscription = async (subscription) => {
  // 이미 취소된 상태일 때만 다시 구독 처리
  if (subscription.is_active) {
    return
  }

  try {
    const response = await api.post(`/api/v1/todos/plan/${subscription.id}/toggle_active/`)

    toast.success(`${subscription.plan_name} 플랜 구독을 재개했습니다.`)

    // 목록 새로고침
    await fetchUserPlans()
  } catch (err) {
    if (err.response?.data?.detail) {
      toast.error(err.response.data.detail)
    } else {
      toast.error('구독 재개에 실패했습니다.')
    }
  }
}

// 읽기 페이지로 이동
const goToReading = () => {
  if (currentReadingData.value) {
    router.push({
      path: '/reading',
      query: {
        plan_id: currentReadingData.value.planId,
        reading_id: currentReadingData.value.readingId
      }
    })
  }
  closeModal()
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
}

// 구독 취소 확인 모달 표시
const confirmUnsubscribe = (subscription) => {
  // 다시 구독인 경우 바로 API 호출
  if (!subscription.is_active) {
    toggleSubscription(subscription)
    return
  }

  // 구독 취소인 경우 확인 모달 표시
  currentSubscription.value = subscription
  showUnsubscribeModal.value = true
}

// 구독 취소 모달 닫기
const closeUnsubscribeModal = () => {
  showUnsubscribeModal.value = false
  currentSubscription.value = null
}

// 구독 취소 실행
const unsubscribePlan = async () => {
  if (!currentSubscription.value) return

  try {
    // 플랜 구독 취소 API 호출
    await api.post(`/api/v1/todos/plan/${currentSubscription.value.id}/unsubscribe/`)

    toast.success(`${currentSubscription.value.plan_name} 플랜 구독을 취소했습니다.`)

    // 목록 새로고침
    await fetchUserPlans()

    // 모달 닫기
    closeUnsubscribeModal()
  } catch (err) {
    if (err.response?.data?.detail) {
      toast.error(err.response.data.detail)
    } else {
      toast.error('구독 취소에 실패했습니다.')
    }
  }
}

// 성경통독 일정 페이지로 이동
const goToReadingPlan = (subscription) => {
  if (!subscription.is_active) {
    toast.error('비활성화된 플랜입니다. 먼저 플랜을 다시 구독해주세요.')
    return
  }

  router.push({
    path: '/reading-plan',
    query: {
      plan: subscription.plan_id
    }
  })
}

// authStore의 인증 상태 변경 감시
watch(() => authStore.isAuthenticated, async (newValue) => {
  if (newValue) {
    await fetchUserPlans()
  } else {
    subscriptions.value = []
    availablePlans.value = []
  }
})

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await fetchUserPlans()
  }
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

.login-prompt {
  text-align: center;
  padding: 3rem 1rem;
}

.login-button {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.login-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.plan-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-badge {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: #f2f2f2 !important;
  border-radius: 0.5rem;
  color: #64748B;
}

.plan-grid {
  display: grid;
  gap: 1rem;
}

.plan-card,
.empty-state {
  min-height: 80px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.plan-card:hover {
  border-color: #D1D5DB;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.plan-card-content {
  padding: 1rem;
}

/* 플랜 카드 내부 레이아웃 수정 */
.plan-card-content>div {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.plan-card-content>div>div:first-child {
  flex: 1;
}

.plan-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  /* 긴 제목 처리 */
}

.default-badge {
  font-size: 0.65rem;
  padding: 0.15em 0.75em;
  background-color: #F1F5F9;
  border-radius: 6px;
  font-weight: 600;
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #CBD5E1;
}

.plan-description {
  color: var(--text-secondary);
  margin-top: 0.5rem;
  font-size: 0.875rem;
  word-break: break-word;
  /* 긴 설명 텍스트 처리 */
}

.subscriber-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 80px;
  text-align: center;
}

.action-button.subscribe {
  background: var(--primary-color);
  color: white;
}

.action-button.cancel {
  background: #FEF2F2;
  border: #dabbbb 1px solid;
  color: #991B1B;
}

.action-button.resume {
  background: var(--success);
  color: white;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(0);
}

.action-button.today-reading {
  background: var(--primary-light);
  color: var(--primary-color);
  border: var(--primary-color) 1px solid;
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

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  color: var(--text-secondary);
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #F3F4F6;
}

.modal-content {
  padding: 1.5rem 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #E5E7EB;
}

.modal-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #F3F4F6;
  color: var(--text-primary);
  transition: all 0.2s;
}

.modal-button:hover {
  background-color: #E5E7EB;
}

.modal-button.primary {
  background-color: var(--primary-color);
  color: white;
}

.modal-button.primary:hover {
  background-color: var(--primary-dark);
}
</style>