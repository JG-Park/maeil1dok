<template>
  <div class="bible-home">
    <header class="home-header">
      <h1>성경</h1>
      <button class="settings-btn" @click="$router.push('/bible/settings')">
        <SettingsIcon :size="20" />
      </button>
    </header>

    <div class="home-content">
      <!-- 오늘의 통독 카드 (플랜 구독 시) -->
      <section v-if="todaySchedule" class="today-tongdok-section">
        <div class="today-card">
          <div class="today-card-header">
            <span class="today-badge">오늘의 통독</span>
            <span class="today-date">{{ formatTodayDate() }}</span>
          </div>
          <div class="today-card-body">
            <div class="today-schedule">
              <span class="schedule-book">{{ todaySchedule.book_name }}</span>
              <span class="schedule-range">{{ todaySchedule.range }}</span>
            </div>
            <div class="today-progress" v-if="todaySchedule.total > 1">
              <span class="progress-label">{{ todaySchedule.completed }}/{{ todaySchedule.total }} 완료</span>
              <div class="mini-progress-bar">
                <div class="mini-progress-fill" :style="{ width: `${(todaySchedule.completed / todaySchedule.total) * 100}%` }"></div>
              </div>
            </div>
          </div>
          <button
            class="today-start-btn"
            :class="{ 'is-completed': todaySchedule.isCompleted }"
            @click="startTodayTongdok"
          >
            <template v-if="todaySchedule.isCompleted">
              <CheckCircleIcon :size="18" />
              <span>완료됨</span>
            </template>
            <template v-else>
              <PlayIcon :size="18" />
              <span>통독 시작</span>
            </template>
          </button>
        </div>

        <!-- 플랜이 없는 경우 안내 -->
        <div v-if="!hasPlan && isAuthenticated" class="no-plan-hint">
          <InfoIcon :size="16" />
          <span>플랜을 구독하면 매일 통독 일정을 받을 수 있어요</span>
          <NuxtLink to="/plan" class="plan-link">플랜 보기</NuxtLink>
        </div>
      </section>

      <!-- 계속 읽기 -->
      <section v-if="lastPosition" class="continue-section">
        <h2 class="section-title">계속 읽기</h2>
        <button class="continue-card" @click="$emit('continue-reading')">
          <div class="continue-info">
            <span class="book-name">{{ lastPosition.book_name }}</span>
            <span class="chapter">{{ lastPosition.chapter }}{{ getChapterUnit(lastPosition.book) }}</span>
          </div>
          <ArrowRightIcon :size="20" />
        </button>
      </section>

      <!-- 첫 방문자 가이드 (통독도 없고 마지막 위치도 없을 때) -->
      <section v-if="showWelcomeGuide" class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-icon">📖</div>
          <h2>매일일독에 오신 것을 환영합니다!</h2>
          <p>성경을 읽고, 묵상하고, 기록해보세요.</p>
          <div class="welcome-actions">
            <button class="welcome-btn primary" @click="$emit('show-toc')">
              <ListIcon :size="18" />
              성경 목차에서 시작하기
            </button>
            <NuxtLink v-if="isAuthenticated" to="/plan" class="welcome-btn secondary">
              <CalendarIcon :size="18" />
              통독 플랜 구독하기
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 기능 안내 (빠른 접근 개선) -->
      <section class="features-section">
        <h2 class="section-title">내 성경 활동</h2>

        <div class="feature-list">
          <!-- 북마크 -->
          <button class="feature-card" @click="$router.push('/bible/bookmarks')">
            <div class="feature-icon bookmark">
              <BookmarkIcon :size="20" />
            </div>
            <div class="feature-content">
              <div class="feature-header">
                <span class="feature-name">북마크</span>
                <span v-if="bookmarkCount > 0" class="feature-count">{{ bookmarkCount }}</span>
              </div>
              <p class="feature-desc">
                {{ bookmarkCount > 0 ? `저장된 ${bookmarkCount}개의 장` : '자주 찾는 장을 저장하세요' }}
              </p>
            </div>
            <ChevronRightIcon :size="18" class="feature-arrow" />
          </button>

          <!-- 묵상노트 -->
          <button class="feature-card" @click="$router.push('/bible/notes')">
            <div class="feature-icon note">
              <DocumentIcon :size="20" />
            </div>
            <div class="feature-content">
              <div class="feature-header">
                <span class="feature-name">묵상노트</span>
                <span v-if="noteCount > 0" class="feature-count">{{ noteCount }}</span>
              </div>
              <p class="feature-desc">
                {{ noteCount > 0 ? `작성된 ${noteCount}개의 노트` : '말씀을 읽고 묵상을 기록하세요' }}
              </p>
            </div>
            <ChevronRightIcon :size="18" class="feature-arrow" />
          </button>

          <!-- 하이라이트 -->
          <button class="feature-card" @click="$router.push('/bible/highlights')">
            <div class="feature-icon highlight">
              <LayersIcon :size="20" />
            </div>
            <div class="feature-content">
              <div class="feature-header">
                <span class="feature-name">하이라이트</span>
                <span v-if="highlightCount > 0" class="feature-count">{{ highlightCount }}</span>
              </div>
              <p class="feature-desc">
                {{ highlightCount > 0 ? `표시된 ${highlightCount}개의 구절` : '중요한 구절에 색상을 입히세요' }}
              </p>
            </div>
            <ChevronRightIcon :size="18" class="feature-arrow" />
          </button>

          <!-- 읽기 기록 -->
          <button class="feature-card" @click="$router.push('/bible/history')">
            <div class="feature-icon history">
              <HistoryIcon :size="20" />
            </div>
            <div class="feature-content">
              <div class="feature-header">
                <span class="feature-name">읽기 기록</span>
              </div>
              <p class="feature-desc">읽은 장과 날짜를 확인하세요</p>
            </div>
            <ChevronRightIcon :size="18" class="feature-arrow" />
          </button>
        </div>
      </section>

      <!-- 사용 팁 (첫 방문 또는 활동이 적을 때) -->
      <section v-if="showUsageTips" class="tips-section">
        <h2 class="section-title">💡 사용 팁</h2>
        <div class="tips-list">
          <div class="tip-item" v-if="!hasHighlights">
            <div class="tip-icon">✨</div>
            <div class="tip-content">
              <strong>하이라이트 만들기</strong>
              <p>성경 본문에서 텍스트를 <em>드래그</em>하면 하이라이트, 복사, 공유 메뉴가 나타나요</p>
            </div>
          </div>
          <div class="tip-item" v-if="!hasBookmarks">
            <div class="tip-icon">🔖</div>
            <div class="tip-content">
              <strong>북마크 추가하기</strong>
              <p>성경 읽기 화면 상단의 <em>북마크 아이콘</em>을 눌러 현재 장을 저장하세요</p>
            </div>
          </div>
          <div class="tip-item" v-if="!hasNotes">
            <div class="tip-icon">📝</div>
            <div class="tip-content">
              <strong>묵상노트 작성하기</strong>
              <p>읽기 화면의 <em>메뉴(⋮)</em>에서 묵상노트를 작성할 수 있어요</p>
            </div>
          </div>
        </div>
        <button v-if="canDismissTips" class="dismiss-tips-btn" @click="dismissTips">
          다음부터 표시 안함
        </button>
      </section>

      <!-- 최근 읽은 기록 -->
      <section v-if="recentRecords.length > 0" class="recent-section">
        <h2 class="section-title">최근 읽은 성경</h2>
        <ul class="recent-list">
          <li
            v-for="record in recentRecords"
            :key="`${record.book}-${record.chapter}`"
            @click="handleRecordClick(record)"
          >
            <span class="record-location">
              {{ record.book_name }} {{ record.chapter }}{{ getChapterUnit(record.book) }}
            </span>
            <span class="record-date">
              {{ formatDate(record.read_date) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- 성경 전체 보기 -->
      <section class="toc-shortcut">
        <button class="toc-btn" @click="$emit('show-toc')">
          <ListIcon :size="20" />
          성경 전체 목차
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useBibleData } from '~/composables/useBibleData';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useAuthService } from '~/composables/useAuthService';
import { useSelectedPlanStore } from '~/stores/selectedPlan';
import type { BiblePosition, RecentRecord, HomeStatsResponse, RecentRecordRaw } from '~/types/bible';

// Icons
import SettingsIcon from '~/components/icons/SettingsIcon.vue';
import ArrowRightIcon from '~/components/icons/ArrowRightIcon.vue';
import BookmarkIcon from '~/components/icons/BookmarkIcon.vue';
import DocumentIcon from '~/components/icons/DocumentIcon.vue';
import LayersIcon from '~/components/icons/LayersIcon.vue';
import HistoryIcon from '~/components/icons/HistoryIcon.vue';
import ListIcon from '~/components/icons/ListIcon.vue';
import ChevronRightIcon from '~/components/icons/ChevronRightIcon.vue';
import PlayIcon from '~/components/icons/PlayIcon.vue';
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue';
import InfoIcon from '~/components/icons/InfoIcon.vue';
import CalendarIcon from '~/components/icons/CalendarIcon.vue';

const router = useRouter();
const api = useApi();
const { loadReadingPosition } = useReadingPosition();
const { getBookName, getChapterUnit } = useBibleData();
const { handleSilentError } = useErrorHandler();
const auth = useAuthService();
const selectedPlanStore = useSelectedPlanStore();

const emit = defineEmits<{
  (e: 'continue-reading'): void;
  (e: 'select-book', bookId: string, chapter: number): void;
  (e: 'show-toc'): void;
  (e: 'start-tongdok', schedule: TodaySchedule): void;
}>();

interface TodaySchedule {
  id: number;
  book_code: string;
  book_name: string;
  range: string;
  start_chapter: number;
  end_chapter: number;
  total: number;
  completed: number;
  isCompleted: boolean;
  plan_id: number;
}

const lastPosition = ref<BiblePosition | null>(null);
const bookmarkCount = ref(0);
const noteCount = ref(0);
const highlightCount = ref(0);
const recentRecords = ref<RecentRecord[]>([]);
const todaySchedule = ref<TodaySchedule | null>(null);
const hasPlan = ref(false);
const tipsDismissed = ref(false);

const isAuthenticated = computed(() => auth.isAuthenticated.value);

const hasBookmarks = computed(() => bookmarkCount.value > 0);
const hasNotes = computed(() => noteCount.value > 0);
const hasHighlights = computed(() => highlightCount.value > 0);

const showWelcomeGuide = computed(() =>
  !lastPosition.value && !todaySchedule.value && recentRecords.value.length === 0
);

const showUsageTips = computed(() => {
  if (tipsDismissed.value) return false;
  // 활동이 적을 때만 표시 (3개 미만의 활동)
  const totalActivity = bookmarkCount.value + noteCount.value + highlightCount.value;
  return totalActivity < 3 && (!hasBookmarks.value || !hasNotes.value || !hasHighlights.value);
});

const canDismissTips = computed(() => {
  // 최소 하나라도 활동이 있으면 숨기기 가능
  return bookmarkCount.value + noteCount.value + highlightCount.value > 0;
});

onMounted(async () => {
  // localStorage에서 팁 숨김 여부 확인
  if (typeof window !== 'undefined') {
    tipsDismissed.value = localStorage.getItem('bible_tips_dismissed') === 'true';
  }

  // 마지막 읽기 위치 로드
  const lastPos = await loadReadingPosition();
  if (lastPos) {
    lastPosition.value = {
      book: lastPos.book,
      chapter: lastPos.chapter,
      book_name: getBookName(lastPos.book)
    };
  }

  // 인증된 사용자: 오늘의 스케줄 및 통계 로드
  if (isAuthenticated.value) {
    await Promise.all([
      loadHomeStats(),
      loadTodaySchedule()
    ]);
  }
});

async function loadHomeStats() {
  try {
    const statsRes = await api.get('/api/v1/todos/bible/home-stats/');
    const data = statsRes.data as HomeStatsResponse | undefined;
    if (data) {
      bookmarkCount.value = data.bookmarks || 0;
      noteCount.value = data.notes || 0;
      highlightCount.value = data.highlights || 0;
      recentRecords.value = (data.recent_records || []).map((r: RecentRecordRaw) => ({
        ...r,
        book_name: getBookName(r.book)
      }));
    }
  } catch (error) {
    handleSilentError(error, '홈 데이터 로드');
  }
}

async function loadTodaySchedule() {
  const planId = selectedPlanStore.effectivePlanId;
  if (!planId) {
    hasPlan.value = false;
    return;
  }

  hasPlan.value = true;

  try {
    const response = await api.get(`/api/v1/todos/schedules/today/?plan_id=${planId}`);
    if (response.data.success && response.data.schedules && response.data.schedules.length > 0) {
      const schedules = response.data.schedules;
      const firstSchedule = schedules[0];
      const completedCount = schedules.filter((s: any) => s.is_completed).length;

      const unit = getChapterUnit(firstSchedule.book_code);
      let range = `${firstSchedule.start_chapter}${unit}`;
      if (firstSchedule.end_chapter && firstSchedule.end_chapter !== firstSchedule.start_chapter) {
        range = `${firstSchedule.start_chapter}-${firstSchedule.end_chapter}${unit}`;
      }

      todaySchedule.value = {
        id: firstSchedule.id,
        book_code: firstSchedule.book_code,
        book_name: getBookName(firstSchedule.book_code),
        range,
        start_chapter: firstSchedule.start_chapter,
        end_chapter: firstSchedule.end_chapter || firstSchedule.start_chapter,
        total: schedules.length,
        completed: completedCount,
        isCompleted: completedCount === schedules.length,
        plan_id: planId
      };
    }
  } catch (error) {
    handleSilentError(error, '오늘의 통독 로드');
  }
}

function startTodayTongdok() {
  if (!todaySchedule.value) return;

  // 통독 시작 이벤트 emit 또는 직접 네비게이션
  const { book_code, start_chapter, id, plan_id } = todaySchedule.value;
  router.push({
    path: '/bible',
    query: {
      book: book_code,
      chapter: start_chapter.toString(),
      tongdok: 'true',
      schedule: id.toString(),
      plan: plan_id.toString()
    }
  });
}

const handleRecordClick = (record: RecentRecord) => {
  emit('select-book', record.book, record.chapter);
};

const dismissTips = () => {
  tipsDismissed.value = true;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bible_tips_dismissed', 'true');
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

const formatTodayDate = () => {
  const today = new Date();
  return today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
};
</script>

<style scoped>
.bible-home {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--background-color);
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.home-header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
}

.settings-btn {
  padding: 0.5rem;
  color: var(--text-secondary, #6b7280);
  border-radius: 8px;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.home-content {
  padding: 1rem;
  padding-bottom: 2rem;
}

/* 섹션 */
.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.75rem;
}

/* ========== 오늘의 통독 카드 ========== */
.today-tongdok-section {
  margin-bottom: 1.5rem;
}

.today-card {
  background: linear-gradient(135deg, var(--primary-color, #6366f1) 0%, #818cf8 100%);
  border-radius: 16px;
  padding: 1.25rem;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.today-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.today-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.today-date {
  font-size: 0.8125rem;
  opacity: 0.9;
}

.today-card-body {
  margin-bottom: 1rem;
}

.today-schedule {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.schedule-book {
  font-size: 1.25rem;
  font-weight: 700;
}

.schedule-range {
  font-size: 1rem;
  opacity: 0.9;
}

.today-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-label {
  font-size: 0.75rem;
  opacity: 0.9;
  white-space: nowrap;
}

.mini-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: white;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.today-start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: white;
  color: var(--primary-color, #6366f1);
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: all 0.2s;
}

.today-start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.today-start-btn.is-completed {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.no-plan-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary, #f3f4f6);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
}

.plan-link {
  color: var(--primary-color, #6366f1);
  font-weight: 500;
  margin-left: auto;
}

/* ========== 첫 방문자 가이드 ========== */
.welcome-section {
  margin-bottom: 1.5rem;
}

.welcome-card {
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-align: center;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.welcome-card h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.5rem;
}

.welcome-card p {
  font-size: 0.9375rem;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 1.5rem;
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.welcome-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.welcome-btn.primary {
  background: var(--primary-color, #6366f1);
  color: white;
}

.welcome-btn.primary:hover {
  background: var(--primary-dark, #4f46e5);
}

.welcome-btn.secondary {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--text-primary, #1f2937);
  border: 1px solid var(--color-border, #e5e7eb);
}

.welcome-btn.secondary:hover {
  background: var(--color-bg-tertiary, #e5e7eb);
}

/* ========== 기능 카드 (개선) ========== */
.features-section {
  margin-bottom: 1.5rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  transition: all 0.2s;
}

.feature-card:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  border-color: var(--color-border-hover, #d1d5db);
}

.feature-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.feature-icon.bookmark {
  background: #fef3c7;
  color: #d97706;
}

.feature-icon.note {
  background: #dbeafe;
  color: #2563eb;
}

.feature-icon.highlight {
  background: #fce7f3;
  color: #db2777;
}

.feature-icon.history {
  background: #dcfce7;
  color: #16a34a;
}

.feature-content {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
}

.feature-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.feature-count {
  padding: 0.125rem 0.5rem;
  background: var(--primary-light, #eef2ff);
  color: var(--primary-color, #6366f1);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 10px;
}

.feature-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feature-arrow {
  color: var(--text-muted, #9ca3af);
  flex-shrink: 0;
}

/* ========== 사용 팁 ========== */
.tips-section {
  margin-bottom: 1.5rem;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  padding: 1rem;
}

.tips-section .section-title {
  margin-bottom: 0.75rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.tip-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary, #f9fafb);
  border-radius: 10px;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip-content strong {
  display: block;
  font-size: 0.875rem;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.25rem;
}

.tip-content p {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.5;
}

.tip-content em {
  color: var(--primary-color, #6366f1);
  font-style: normal;
  font-weight: 500;
}

.dismiss-tips-btn {
  display: block;
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
  text-align: center;
  transition: color 0.2s;
}

.dismiss-tips-btn:hover {
  color: var(--text-secondary, #6b7280);
}

/* ========== 계속 읽기 ========== */
.continue-section {
  margin-bottom: 1.5rem;
}

.continue-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  color: var(--text-primary, #1f2937);
  border-radius: 12px;
  transition: all 0.2s;
}

.continue-card:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  border-color: var(--primary-color, #6366f1);
}

.continue-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.continue-info .book-name {
  font-weight: 600;
  font-size: 1rem;
}

.continue-info .chapter {
  color: var(--text-secondary, #6b7280);
  font-size: 0.9375rem;
}

/* ========== 최근 읽은 기록 ========== */
.recent-section {
  margin-bottom: 1.5rem;
}

.recent-list {
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  overflow: hidden;
}

.recent-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.recent-list li:not(:last-child) {
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.recent-list li:hover {
  background: var(--color-bg-secondary, #f3f4f6);
}

.record-location {
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
}

.record-date {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
}

/* ========== 목차 바로가기 ========== */
.toc-shortcut {
  margin-top: 1rem;
}

.toc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
  transition: all 0.2s;
}

.toc-btn:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  border-color: var(--primary-color, #6366f1);
}

.toc-btn svg {
  color: var(--primary-color, #6366f1);
}

/* ========== 다크모드 ========== */
:root.dark .home-header {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .today-card {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
}

:root.dark .no-plan-hint {
  background: var(--color-bg-tertiary);
}

:root.dark .welcome-card {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .feature-card {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .feature-card:hover {
  background: var(--color-bg-tertiary);
}

:root.dark .tips-section {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .tip-item {
  background: var(--color-bg-tertiary);
}

:root.dark .continue-card {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .continue-card:hover {
  background: var(--color-bg-tertiary);
}

:root.dark .recent-list {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .recent-list li:not(:last-child) {
  border-color: var(--color-border);
}

:root.dark .recent-list li:hover {
  background: var(--color-bg-tertiary);
}

:root.dark .toc-btn {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .toc-btn:hover {
  background: var(--color-bg-tertiary);
}

/* ========== 모바일 반응형 ========== */
@media (max-width: 400px) {
  .today-card {
    padding: 1rem;
  }

  .schedule-book {
    font-size: 1.125rem;
  }

  .welcome-card {
    padding: 1.5rem 1rem;
  }
}
</style>
