<template>
  <div class="bible-page">
    <!-- 탭 네비게이션 -->
    <BibleTabNavigation
      :active-tab="activeTab"
      @change="handleTabChange"
    />

    <!-- 통독모드 표시 -->
    <TongdokModeIndicator
      :is-active="bibleStore.tongdokMode"
      :schedule="bibleStore.currentSchedule"
      :current-chapter="bibleStore.currentChapter"
      @exit="exitTongdokMode"
    />

    <!-- 탭 컨텐츠 -->
    <div class="tab-content">
      <KeepAlive>
        <BibleReader
          v-if="activeTab === 'reading'"
          ref="bibleReaderRef"
          :initial-book="initialBook"
          :initial-chapter="initialChapter"
          :tongdok-mode="bibleStore.tongdokMode"
          :schedule="bibleStore.currentSchedule"
          @position-change="handlePositionChange"
          @chapter-complete="handleChapterComplete"
          @scroll-end="handleScrollEnd"
        />
      </KeepAlive>

      <KeepAlive>
        <div v-if="activeTab === 'plan'" class="plan-tab-content">
          <BibleScheduleContent
            @schedule-select="handleScheduleSelect"
          />
        </div>
      </KeepAlive>
    </div>

    <!-- 완료 토스트 -->
    <Teleport to="body">
      <div v-if="showCompleteToast" class="complete-toast">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        읽기 완료!
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBibleStore } from '~/stores/bible'
import { useAuthStore } from '~/stores/auth'
import { useBibleReader } from '~/composables/useBibleReader'
import BibleTabNavigation from '~/components/bible/BibleTabNavigation.vue'
import TongdokModeIndicator from '~/components/bible/TongdokModeIndicator.vue'
import BibleReader from '~/components/bible/BibleReader.vue'
import BibleScheduleContent from '~/components/BibleScheduleContent.vue'

definePageMeta({
  title: '성경읽기'
})

// Route & Router
const route = useRoute()
const router = useRouter()

// Stores
const bibleStore = useBibleStore()
const authStore = useAuthStore()

// API
const api = useApi()

// Composables
const { loadLastPosition } = useBibleReader()

// Refs
const bibleReaderRef = ref<InstanceType<typeof BibleReader> | null>(null)

// State
const activeTab = ref<'reading' | 'plan'>('reading')
const showCompleteToast = ref(false)

// URL 파라미터에서 초기값
const initialBook = computed(() => route.query.book as string || bibleStore.currentBook)
const initialChapter = computed(() =>
  route.query.chapter ? Number(route.query.chapter) : bibleStore.currentChapter
)

// 초기화
onMounted(async () => {
  // URL에서 탭 확인
  if (route.query.tab === 'plan') {
    activeTab.value = 'plan'
  }

  // 마지막 위치 불러오기
  if (authStore.isAuthenticated) {
    const position = await loadLastPosition()
    if (position && !route.query.book) {
      bibleStore.setCurrentPosition(position.book, position.chapter)
    }
  }

  // URL에서 통독모드 확인
  if (route.query.tongdok === 'true' && route.query.schedule) {
    const scheduleId = Number(route.query.schedule)
    if (scheduleId) {
      await loadScheduleAndActivateTongdok(scheduleId)
    }
  }
})

// 스케줄 로드하여 통독모드 활성화
const loadScheduleAndActivateTongdok = async (scheduleId: number) => {
  try {
    const { data } = await api.get(`/api/v1/todos/schedules/${scheduleId}/`)
    if (data) {
      bibleStore.setTongdokMode(true, {
        id: data.id,
        book: data.book,
        start_chapter: data.start_chapter,
        end_chapter: data.end_chapter,
        is_complete: data.is_complete,
        plan_id: data.plan_id || route.query.plan
      })
    }
  } catch (error) {
    console.error('Failed to load schedule:', error)
  }
}

// Methods
const handleTabChange = (tab: 'reading' | 'plan') => {
  activeTab.value = tab

  // 탭 변경 시 URL 업데이트
  const newQuery = { ...route.query, tab }
  if (tab === 'reading') {
    delete newQuery.tab // 기본값이므로 제거
  }
  router.replace({ query: newQuery })
}

const handleScheduleSelect = (schedule: any) => {
  // 통독모드 활성화
  bibleStore.setTongdokMode(true, {
    id: schedule.id,
    book: schedule.book,
    start_chapter: schedule.start_chapter,
    end_chapter: schedule.end_chapter,
    is_complete: schedule.is_complete,
    plan_id: schedule.plan_id
  })

  // 성경읽기 탭으로 전환
  activeTab.value = 'reading'

  // BibleReader에 위치 전달
  if (bibleReaderRef.value) {
    bibleReaderRef.value.goTo(schedule.book, schedule.start_chapter)
  }

  // URL 업데이트
  router.replace({
    query: {
      book: schedule.book,
      chapter: schedule.start_chapter,
      plan: schedule.plan_id,
      schedule: schedule.id,
      tongdok: 'true',
    }
  })
}

const handlePositionChange = (position: { book: string, chapter: number }) => {
  // Store 동기화
  bibleStore.setCurrentPosition(position.book, position.chapter)

  // URL 업데이트 (기록용)
  const newQuery = { ...route.query }
  newQuery.book = position.book
  newQuery.chapter = String(position.chapter)
  router.replace({ query: newQuery })
}

const handleChapterComplete = async (schedule: any) => {
  if (!authStore.isAuthenticated) return
  if (schedule.is_complete) return // 이미 완료됨

  try {
    // API 호출하여 읽음 처리
    await api.post('/api/v1/todos/reading/', {
      plan_id: schedule.plan_id,
      schedule_ids: [schedule.id],
      action: 'complete'
    })

    // 스케줄 상태 업데이트
    if (bibleStore.currentSchedule) {
      bibleStore.currentSchedule.is_complete = true
    }

    // Toast 표시
    showCompleteToast.value = true
    setTimeout(() => {
      showCompleteToast.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to complete reading:', error)
  }
}

const handleScrollEnd = () => {
  // 스크롤 끝 도달 시 처리 (선택적 자동 완료)
  // 현재는 다음 장 이동 시에만 완료 처리
}

const exitTongdokMode = () => {
  bibleStore.setTongdokMode(false)

  // URL에서 통독 관련 파라미터 제거
  const newQuery = { ...route.query }
  delete newQuery.plan
  delete newQuery.schedule
  delete newQuery.tongdok
  router.replace({ query: newQuery })
}
</script>

<style scoped>
.bible-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-color, #fff);
}

.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.plan-tab-content {
  flex: 1;
  overflow-y: auto;
}

/* 완료 토스트 */
.complete-toast {
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #10B981;
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: toast-in 0.3s ease;
  z-index: 9999;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
