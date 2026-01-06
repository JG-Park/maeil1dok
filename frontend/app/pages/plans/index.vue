<template>
  <div class="container">
    <!-- 고정 헤더 -->
    <PageHeader title="플랜 관리" />

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <div v-if="isLoading" class="login-prompt fade-in" style="animation-delay: 0.2s">
        <p class="text-lg text-gray-600 mb-4">
          로딩 중...
        </p>
      </div>
      
      <div v-else-if="!authStore.isAuthenticated" class="login-prompt fade-in" style="animation-delay: 0.2s">
        <p class="text-lg text-gray-600 mb-4">
          플랜을 구독하려면 로그인이 필요합니다.
        </p>
        <button @click="$router.push('/login')" class="login-button">로그인하기</button>
      </div>

      <div v-else-if="authStore.isAuthenticated" class="content-section fade-in" style="animation-delay: 0.2s">
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
            <div v-for="sub in subscriptions" :key="sub.id" class="plan-card" :class="{ 'hidden-plan': !sub.is_active }">
              <div class="plan-card-content">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="plan-title">
                      {{ sub.plan_name }}
                      <span v-if="sub.is_default" class="default-badge">기본 플랜</span>
                      <span v-if="!sub.is_active" class="hidden-badge">숨김</span>
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">
                      구독 시작일: {{ formatDate(sub.start_date) }}
                    </p>
                  </div>
                  <div class="flex flex-col gap-2">
                    <button v-if="sub.is_active" @click="goToReadingPlan(sub)" class="action-button today-reading">성경통독표</button>
                    <!-- 숨기기/다시 보기 버튼 -->
                    <button v-if="!sub.is_default" @click="toggleHide(sub)" :class="[
                      'action-button',
                      sub.is_active ? 'hide' : 'resume'
                    ]">
                      {{ sub.is_active ? '숨기기' : '다시 보기' }}
                    </button>
                    <!-- 완전 삭제 버튼 (숨겨진 플랜만) -->
                    <button v-if="!sub.is_default && !sub.is_active" @click="confirmDelete(sub)" class="action-button delete">
                      완전 삭제
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
    <Toast />

    <!-- 정보 모달 -->
    <ConfirmModal
      :show="showModal"
      :title="modalTitle"
      :show-cancel="hasReadingData"
      :confirm-text="hasReadingData ? '읽기 페이지로 이동' : '확인'"
      cancel-text="확인"
      @confirm="hasReadingData ? goToReading() : closeModal()"
      @cancel="closeModal"
    >
      <p>{{ modalMessage }}</p>
    </ConfirmModal>

    <!-- 완전 삭제 확인 모달 -->
    <ConfirmModal
      :show="showUnsubscribeModal"
      title="완전 삭제 확인"
      confirm-text="완전 삭제"
      confirm-variant="danger"
      @confirm="deletePlan"
      @cancel="closeUnsubscribeModal"
    >
      <p class="mb-4 text-red-600 font-bold">정말 삭제하시겠어요?</p>
      <p>지금까지 진행된 읽기 기록이 전부 삭제되며, <strong>복구할 수 없습니다.</strong></p>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from '~/composables/useToast';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';
import Toast from '~/components/Toast.vue';
import PageHeader from '~/components/PageHeader.vue';
import ConfirmModal from '~/components/ConfirmModal.vue';
import { useRouter } from 'vue-router';

// 타입 정의
interface Subscription {
  id: number;
  plan_id: number;
  plan_name: string;
  start_date: string;
  is_active: boolean;
  is_default: boolean;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  subscriber_count: number;
}

interface ReadingData {
  planId: number;
  readingId: number;
}

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const api = useApi();

const subscriptions = ref<Subscription[]>([]);
const availablePlans = ref<Plan[]>([]);
const isLoading = ref(true);

// 모달 관련 상태
const showModal = ref(false);
const modalTitle = ref('');
const modalMessage = ref('');
const hasReadingData = ref(false);
const currentReadingData = ref<ReadingData | null>(null);

// 구독 취소 관련 상태
const showUnsubscribeModal = ref(false);
const currentSubscription = ref<Subscription | null>(null);

// 날짜 포맷팅
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 사용자 플랜 정보 조회
const fetchUserPlans = async (): Promise<void> => {
  if (!authStore.isAuthenticated) return;

  try {
    const response = await api.get('/api/v1/todos/plans/user/');
    const responseData = response.data || response;

    if (responseData.subscriptions) {
      subscriptions.value = responseData.subscriptions;
    } else {
      subscriptions.value = [];
    }

    if (responseData.available_plans) {
      availablePlans.value = responseData.available_plans;
    } else {
      availablePlans.value = [];
    }
  } catch {
    toast.error('플랜 정보를 불러오는데 실패했습니다.');
  }
};

// 플랜 구독
const subscribe = async (plan: Plan): Promise<void> => {
  try {
    await api.post('/api/v1/todos/plan/', {
      plan: plan.id
    });

    toast.success(`${plan.name} 플랜을 구독했습니다.`);

    // 목록 새로고침
    await fetchUserPlans();
  } catch (err: unknown) {
    const error = err as { response?: { data?: { detail?: string } } };
    if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    } else {
      toast.error('플랜 구독에 실패했습니다.');
    }
  }
};

// 숨기기/다시 보기 토글
const toggleHide = async (subscription: Subscription): Promise<void> => {
  try {
    await api.post(`/api/v1/todos/plan/${subscription.id}/toggle-active/`);

    const message = subscription.is_active
      ? `${subscription.plan_name} 플랜을 숨겼습니다.`
      : `${subscription.plan_name} 플랜을 다시 표시합니다.`;
    toast.success(message);

    // 목록 새로고침
    await fetchUserPlans();
  } catch (err: unknown) {
    const error = err as { response?: { data?: { detail?: string } } };
    if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    } else {
      toast.error('처리에 실패했습니다.');
    }
  }
};

// 읽기 페이지로 이동
const goToReading = (): void => {
  if (currentReadingData.value) {
    router.push({
      path: '/reading',
      query: {
        plan_id: String(currentReadingData.value.planId),
        reading_id: String(currentReadingData.value.readingId)
      }
    });
  }
  closeModal();
};

// 모달 닫기
const closeModal = (): void => {
  showModal.value = false;
};

// 완전 삭제 확인 모달 표시
const confirmDelete = (subscription: Subscription): void => {
  currentSubscription.value = subscription;
  showUnsubscribeModal.value = true;
};

// 삭제 모달 닫기
const closeUnsubscribeModal = (): void => {
  showUnsubscribeModal.value = false;
  currentSubscription.value = null;
};

// 완전 삭제 실행
const deletePlan = async (): Promise<void> => {
  if (!currentSubscription.value) return;

  try {
    // 플랜 구독 삭제 API 호출
    await api.delete(`/api/v1/todos/plan/${currentSubscription.value.id}/`);

    toast.success(`${currentSubscription.value.plan_name} 플랜을 완전히 삭제했습니다.`);

    // 목록 새로고침
    await fetchUserPlans();

    // 모달 닫기
    closeUnsubscribeModal();
  } catch (err: unknown) {
    const error = err as { response?: { data?: { detail?: string } } };
    if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    } else {
      toast.error('삭제에 실패했습니다.');
    }
  }
};

// 성경통독 일정 페이지로 이동
const goToReadingPlan = (subscription: Subscription): void => {
  if (!subscription.is_active) {
    toast.error('비활성화된 플랜입니다. 먼저 플랜을 다시 구독해주세요.');
    return;
  }

  router.push({
    path: '/plan',
    query: {
      plan: String(subscription.plan_id)
    }
  });
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  // 인증 상태 확인 및 플랜 정보 로드
  isLoading.value = true;

  try {
    // authStore가 이미 초기화되었는지 확인
    if (!authStore.user && typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        // 토큰이 있으면 사용자 정보 가져오기 시도
        await authStore.fetchUser().catch(() => {
          // 실패하면 토큰이 유효하지 않음
          authStore.logout();
        });
      }
    }

    // 인증된 경우에만 플랜 정보 로드
    if (authStore.isAuthenticated) {
      await fetchUserPlans();
    }
  } catch {
    // 초기화 에러는 무시
  } finally {
    // 항상 로딩 상태를 false로 설정
    isLoading.value = false;
  }
});
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

.hidden-badge {
  font-size: 0.65rem;
  padding: 0.15em 0.75em;
  border-radius: 6px;
  font-weight: 600;
  background: #9CA3AF;
  color: white;
}

.hidden-plan {
  opacity: 0.6;
  border-style: dashed;
  background: #F9FAFB;
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
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 80px;
  text-align: center;
}

.action-button.subscribe {
  background: var(--primary-color);
  color: white;
}

.action-button.hide {
  background: #F3F4F6;
  border: #D1D5DB 1px solid;
  color: #4B5563;
}

.action-button.resume {
  background: var(--primary-color);
  color: white;
}

.action-button.delete {
  background: #FEF2F2;
  border: #FECACA 1px solid;
  color: #DC2626;
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
</style>