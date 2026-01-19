<template>
  <div class="card-stack">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="reading-card skeleton-card">
      <div class="skeleton-label"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-desc"></div>
      <div class="skeleton-progress"></div>
    </div>

    <!-- 비로그인 상태 -->
    <div v-else-if="cardType === 'login'" class="reading-card main-card login-card" @click="router.push('/login')">
      <div class="card-header">
        <span class="card-label">WELCOME</span>
      </div>
      <h2 class="bible-verse">로그인하고<br>시작하세요</h2>
      <div class="chapter-range">나만의 통독 기록을 관리할 수 있습니다</div>
      <button class="start-btn">
        로그인 / 회원가입
        <ArrowRightIcon size="16" style="margin-left: 4px;" />
      </button>
    </div>

    <!-- 하세나 제안 카드 -->
    <div v-else-if="cardType === 'hasena'" class="reading-card main-card hasena-card" @click="goToHasena">
      <div class="card-header">
        <span class="card-label">TODAY'S SUGGESTION</span>
      </div>
      <h2 class="bible-verse">오늘의 통독을<br>완료했어요! 👏</h2>
      <div class="chapter-range">하세나하시조 영상을 시청해보세요</div>
      
      <button class="start-btn hasena-btn">
        하세나 보러가기
        <ArrowRightIcon size="16" style="margin-left: 4px;" />
      </button>
    </div>

    <!-- 개론 제안 카드 -->
    <div v-else-if="cardType === 'intro'" class="reading-card main-card intro-card" @click="goToIntro">
      <div class="card-header">
        <span class="card-label">THIS WEEK'S INTRO</span>
        <span class="suggestion-badge">
          📖 개론 영상
        </span>
      </div>
      <h2 class="bible-verse">{{ currentIntro?.book || '이번 주' }}<br>개론을 시청해보세요</h2>
      <div class="chapter-range">성경의 배경과 흐름을 이해할 수 있어요</div>
      
      <button class="start-btn intro-btn">
        개론 영상 보기
        <ArrowRightIcon size="16" style="margin-left: 4px;" />
      </button>
    </div>

    <!-- 모두 완료 상태 (칭찬 + 다음 통독 미리보기) -->
    <div v-else-if="cardType === 'allDone'" class="reading-card main-card all-done-card" @click="startRandomReading">
      <div class="card-header">
        <span class="card-label">AMAZING!</span>
        <span class="completed-badge">
          <CheckCircleIcon size="12" />
          모두 완료
        </span>
      </div>
      <h2 class="bible-verse">오늘 할 일을<br>모두 마쳤어요! 🎉</h2>
      <div class="chapter-range">정말 대단해요! 내일도 함께해요</div>
      
      <div class="action-buttons">
        <button v-if="nextSchedule" class="start-btn" @click.stop="startNextReading">
          📖 내일 본문 미리 읽기
        </button>
        <button class="start-btn secondary">
          🎲 랜덤 말씀 뽑기
        </button>
      </div>
    </div>

    <!-- 오늘 완료 상태 (레거시 - 하위 호환용) -->
    <div v-else-if="cardType === 'completed'" class="reading-card main-card completed-card">
      <div class="card-header">
        <span class="card-label">TODAY'S GOAL ACHIEVED</span>
        <span class="completed-badge">
          <CheckCircleIcon size="12" />
          완료됨
        </span>
      </div>
      <h2 class="bible-verse">오늘의 통독을<br>완료했습니다 🎉</h2>
      <div class="chapter-range">내일도 말씀과 함께하세요</div>
      
      <div class="action-buttons">
        <button class="start-btn" @click="startRandomReading">
          🎲 랜덤 말씀 뽑기
        </button>
        <button class="start-btn secondary" @click="startNextReading">
          내일 본문 미리보기
        </button>
      </div>
    </div>

    <!-- 기본 통독 카드 -->
    <div v-else class="reading-card main-card" @click="startReading">
      <div class="card-header">
        <span class="card-label">TODAY'S READING</span>
        <NuxtLink to="/plans" class="manage-link" @click.stop>
          플랜 관리
        </NuxtLink>
      </div>

      <h2 class="bible-verse">{{ todaySchedule?.range || '오늘의 말씀' }}</h2>
      <div class="chapter-range">{{ todaySchedule?.book_name || '로딩 중...' }}</div>
      
      <div class="progress-minimal">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
        <div class="progress-text">{{ progressPercentage }}% 완료</div>
      </div>

      <button class="start-btn">
        통독 시작하기
        <ArrowRightIcon size="16" style="margin-left: 4px;" />
      </button>
    </div>

    <!-- (추후) 뒤에 쌓인 카드들 시각적 효과 -->
    <div class="card-shadow-1"></div>
    <div class="card-shadow-2"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';
import { useSelectedPlanStore } from '~/stores/selectedPlan';
import { useSubscriptionStore } from '~/stores/subscription';
import { useHasenaStore } from '~/stores/hasena';
import { useBibleData } from '~/composables/useBibleData';
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue';
import ArrowRightIcon from '~/components/icons/ArrowRightIcon.vue';

const router = useRouter();
const api = useApi();
const authStore = useAuthStore();
const selectedPlanStore = useSelectedPlanStore();
const subscriptionStore = useSubscriptionStore();
const hasenaStore = useHasenaStore();
const { getBookName } = useBibleData();

const loading = ref(true);
const todaySchedule = ref<any>(null);
const nextSchedule = ref<any>(null);
const progressPercentage = ref(0);
const cardType = ref<'reading' | 'login' | 'completed' | 'hasena' | 'intro' | 'allDone'>('reading');

// 하세나/개론 상태
const hasenaCompleted = ref(false);
const currentIntro = ref<any>(null);
const introCompleted = ref(false);

// 데이터 로드 함수
async function loadData() {
  loading.value = true;
  
  if (!authStore.isAuthenticated) {
    cardType.value = 'login';
    loading.value = false;
    return;
  }

  try {
    // 먼저 구독 정보 로드하여 defaultPlanId 설정
    await subscriptionStore.fetchSubscriptions();
    const defaultSub = subscriptionStore.defaultSubscription;
    if (defaultSub && !selectedPlanStore.effectivePlanId) {
      selectedPlanStore.setDefaultPlanId(defaultSub.plan_id);
    }

    await Promise.all([
      loadTodaySchedule(),
      loadProgress(),
      loadHasenaStatus(),
      loadCurrentIntro(),
      loadNextSchedule()
    ]);
    
    // 우선순위 결정 로직
    determineCardType();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// 카드 타입 결정 로직
function determineCardType() {
  // 1. 오늘 통독이 남아있으면 → 통독 카드
  if (todaySchedule.value && !todaySchedule.value.isCompleted && !todaySchedule.value.noSchedule) {
    cardType.value = 'reading';
    return;
  }
  
  // 2. 오늘 통독 완료 후 → 하세나 안했으면 하세나 제안
  if (!hasenaCompleted.value) {
    cardType.value = 'hasena';
    return;
  }
  
  // 3. 하세나도 완료 → 개론 안봤으면 개론 제안
  if (currentIntro.value && !introCompleted.value) {
    cardType.value = 'intro';
    return;
  }
  
  // 4. 모두 완료 → 칭찬 + 다음 통독 미리보기
  cardType.value = 'allDone';
}

onMounted(() => {
  loadData();
});

// 플랜 변경 감지
watch(() => selectedPlanStore.selectedPlanId, () => {
  loadData();
});

async function loadTodaySchedule() {
  try {
    const planId = selectedPlanStore.effectivePlanId;
    if (!planId) return;

    const response = await api.get(`/api/v1/todos/schedules/today/?plan_id=${planId}`);
    
    if (response.data.success && response.data.schedules && response.data.schedules.length > 0) {
      const firstSchedule = response.data.schedules[0];
      const completedCount = response.data.schedules.filter((s: any) => s.is_completed).length;
      const isAllCompleted = completedCount === response.data.schedules.length;
      
      let range = `${firstSchedule.start_chapter}장`;
      if (firstSchedule.end_chapter && firstSchedule.end_chapter !== firstSchedule.start_chapter) {
        range = `${firstSchedule.start_chapter}-${firstSchedule.end_chapter}장`;
      }

      todaySchedule.value = {
        id: firstSchedule.id,
        book_code: firstSchedule.book_code,
        book_name: getBookName(firstSchedule.book_code),
        range: `${getBookName(firstSchedule.book_code)} ${range}`,
        start_chapter: firstSchedule.start_chapter,
        isCompleted: isAllCompleted,
        noSchedule: false
      };
    } else {
      // 일정이 없을 때
      todaySchedule.value = { isCompleted: true, noSchedule: true };
    }
  } catch (error) {
    console.error('Failed to load schedule', error);
  }
}

// 하세나 상태 로드
async function loadHasenaStatus() {
  try {
    await hasenaStore.fetchStatus();
    hasenaCompleted.value = hasenaStore.isCompleted;
  } catch (error) {
    console.error('Failed to load hasena status', error);
    hasenaCompleted.value = false;
  }
}

// 현재 주의 개론 상태 로드
async function loadCurrentIntro() {
  try {
    const planId = selectedPlanStore.effectivePlanId;
    if (!planId) return;

    const response = await api.get(`/api/v1/todos/user/video/intro/?plan_id=${planId}`);
    
    if (response.data && Array.isArray(response.data)) {
      // 현재 날짜가 start_date와 end_date 사이에 있는 개론 찾기
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const current = response.data.find((intro: any) => {
        const startDate = new Date(intro.start_date);
        const endDate = new Date(intro.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return today >= startDate && today <= endDate;
      });
      
      if (current) {
        currentIntro.value = current;
        introCompleted.value = current.is_completed || false;
      } else {
        currentIntro.value = null;
        introCompleted.value = true; // 해당 주 개론이 없으면 완료로 처리
      }
    }
  } catch (error) {
    console.error('Failed to load intro status', error);
    currentIntro.value = null;
    introCompleted.value = true;
  }
}

// 다음 통독 일정 로드
async function loadNextSchedule() {
  try {
    const planId = selectedPlanStore.effectivePlanId;
    if (!planId) return;

    // 내일 날짜 계산
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const response = await api.get(`/api/v1/todos/schedules/today/?plan_id=${planId}&date=${tomorrowStr}`);
    
    if (response.data.success && response.data.schedules && response.data.schedules.length > 0) {
      const firstSchedule = response.data.schedules[0];
      
      let range = `${firstSchedule.start_chapter}장`;
      if (firstSchedule.end_chapter && firstSchedule.end_chapter !== firstSchedule.start_chapter) {
        range = `${firstSchedule.start_chapter}-${firstSchedule.end_chapter}장`;
      }

      nextSchedule.value = {
        id: firstSchedule.id,
        book_code: firstSchedule.book_code,
        book_name: getBookName(firstSchedule.book_code),
        range: `${getBookName(firstSchedule.book_code)} ${range}`,
        start_chapter: firstSchedule.start_chapter
      };
    }
  } catch (error) {
    console.error('Failed to load next schedule', error);
  }
}

async function loadProgress() {
  try {
    const planId = selectedPlanStore.effectivePlanId;
    if (!planId) return;

    const response = await api.get('/api/v1/todos/stats/progress/', {
      params: { plan_id: planId }
    });

    if (response.data.success) {
      progressPercentage.value = response.data.user_progress || 0;
    }
  } catch (error) {
    console.error('Failed to load progress', error);
  }
}

function startReading() {
  if (!todaySchedule.value) return;
  
  // 완료 상태면 내일 일정으로 이동하거나 목록으로
  if (todaySchedule.value.isCompleted) {
    router.push('/plan'); // 또는 내일 일정 로직
    return;
  }
  
  const { book_code, start_chapter } = todaySchedule.value;
  const planId = selectedPlanStore.effectivePlanId;
  
  router.push({
    path: '/reading',
    query: {
      plan: planId?.toString(),
      book: book_code,
      chapter: start_chapter
    }
  });
}

function startNextReading() {
  if (!nextSchedule.value) {
    router.push('/plan');
    return;
  }
  
  const { book_code, start_chapter } = nextSchedule.value;
  const planId = selectedPlanStore.effectivePlanId;
  
  router.push({
    path: '/reading',
    query: {
      plan: planId?.toString(),
      book: book_code,
      chapter: start_chapter
    }
  });
}

function goToHasena() {
  router.push('/hasena');
}

function goToIntro() {
  if (currentIntro.value) {
    router.push(`/intro?id=${currentIntro.value.id}`);
  } else {
    router.push('/intro');
  }
}

function startRandomReading() {
  // 랜덤 성경 읽기 로직
  const randomBooks = ['gen', 'exo', 'psa', 'mat', 'jhn', 'rom'];
  const randomBook = randomBooks[Math.floor(Math.random() * randomBooks.length)];
  // 랜덤 장도 선택 (각 책의 장 수에 맞게)
  const bookChapters: Record<string, number> = { gen: 50, exo: 40, psa: 150, mat: 28, jhn: 21, rom: 16 };
  const maxChapter = bookChapters[randomBook] || 1;
  const randomChapter = Math.floor(Math.random() * maxChapter) + 1;
  
  navigateTo({
    path: '/bible',
    query: { book: randomBook, chapter: String(randomChapter) }
  });
}
</script>

<style scoped>
.card-stack {
  position: relative;
  margin-bottom: 3rem;
}

.reading-card {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  box-shadow: var(--paper-shadow);
  position: relative;
  z-index: 10;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.reading-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(44, 51, 51, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-label {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 600;
  font-family: var(--font-sans);
}

.completed-badge {
  font-size: 0.75rem;
  color: var(--accent);
  background: var(--accent-light);
  padding: 4px 8px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.manage-link {
  font-size: 0.75rem;
  color: var(--text-sub);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--accent-light);
  transition: all 0.2s;
}

.manage-link:hover {
  color: var(--accent);
  background: var(--accent-light);
  opacity: 0.8;
}

.bible-verse {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-main);
  line-height: 1.2;
}

.chapter-range {
  font-size: 1.125rem;
  color: var(--text-sub);
  margin-bottom: 2rem;
}

.progress-minimal {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-bar-bg {
  flex: 1;
  height: 4px;
  background: #F0F0F0; /* TODO: 다크모드 대응 필요 */
  border-radius: 2px;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-family: var(--font-sans);
  color: var(--accent);
  font-weight: 500;
  min-width: 70px;
  text-align: right;
}

.start-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--text-main);
  font-weight: 500;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--text-main);
  transition: all 0.2s;
  background: none;
  border: none;
  border-bottom: 1px solid currentColor;
  padding: 0 0 4px 0;
  cursor: pointer;
}

.start-btn:hover {
  opacity: 0.7;
}

.start-btn.secondary {
  font-size: 0.9rem;
  color: var(--text-sub);
  border-bottom-color: var(--text-sub);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 하세나 카드 스타일 */
.hasena-card {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.hasena-btn {
  color: #92400E !important;
  border-bottom-color: #92400E !important;
}

/* 개론 카드 스타일 */
.intro-card {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.intro-btn {
  color: #1E40AF !important;
  border-bottom-color: #1E40AF !important;
}

/* 모두 완료 카드 스타일 */
.all-done-card {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.suggestion-badge {
  font-size: 0.75rem;
  color: var(--text-sub);
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 8px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

/* Skeleton Loading */
.skeleton-card {
  pointer-events: none;
}

.skeleton-label {
  width: 100px;
  height: 14px;
  background: #f0f0f0;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.skeleton-title {
  width: 80%;
  height: 40px;
  background: #f0f0f0;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.skeleton-desc {
  width: 60%;
  height: 20px;
  background: #f0f0f0;
  margin-bottom: 2.5rem;
  border-radius: 4px;
}

.skeleton-progress {
  width: 100%;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
}

/* Shadows for Stack Effect */
.card-shadow-1 {
  position: absolute;
  top: 10px;
  left: 20px;
  right: 20px;
  height: 100%;
  background: var(--card-bg);
  border-radius: 24px;
  z-index: 5;
  opacity: 0.5;
  box-shadow: var(--paper-shadow);
}

.card-shadow-2 {
  position: absolute;
  top: 20px;
  left: 40px;
  right: 40px;
  height: 100%;
  background: var(--card-bg);
  border-radius: 24px;
  z-index: 1;
  opacity: 0.3;
  box-shadow: var(--paper-shadow);
}

/* Dark Mode Overrides */
[data-theme="dark"] .reading-card {
  border-color: rgba(255, 255, 255, 0.1);
  background: var(--color-bg-card);
}

[data-theme="dark"] .main-card {
  background: var(--color-bg-card);
}

[data-theme="dark"] .hasena-card {
  background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
  border-color: rgba(245, 158, 11, 0.2);
}

[data-theme="dark"] .hasena-btn {
  color: #fcd34d !important;
  border-bottom-color: #fcd34d !important;
}

[data-theme="dark"] .intro-card {
  background: linear-gradient(135deg, #172554 0%, #1e3a8a 100%);
  border-color: rgba(59, 130, 246, 0.2);
}

[data-theme="dark"] .intro-btn {
  color: #93c5fd !important;
  border-bottom-color: #93c5fd !important;
}

[data-theme="dark"] .all-done-card {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  border-color: rgba(16, 185, 129, 0.2);
}

[data-theme="dark"] .progress-bar-bg {
  background: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .manage-link {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-sub);
}

[data-theme="dark"] .manage-link:hover {
  color: var(--accent);
}

[data-theme="dark"] .suggestion-badge {
  background: rgba(0, 0, 0, 0.4);
  color: #e5e7eb;
}

[data-theme="dark"] .skeleton-label,
[data-theme="dark"] .skeleton-title,
[data-theme="dark"] .skeleton-desc,
[data-theme="dark"] .skeleton-progress {
  background: rgba(255, 255, 255, 0.05);
}
</style>