# Task 5: 탭 UI 및 통독모드 구현

> **상태**: ⬜ 대기
> **의존성**: Task 4 완료 필요
> **예상 파일**: `bible/index.vue`, `BibleTabNavigation.vue`

---

## 목표

[성경읽기] [통독플랜] 탭 UI를 구현하고, 통독모드 기능을 추가한다.

---

## 수정/생성 파일

| 파일 | 작업 |
|------|------|
| `frontend/app/pages/bible/index.vue` | 탭 UI 구현 |
| `frontend/app/components/bible/BibleTabNavigation.vue` | 탭 컴포넌트 |
| `frontend/app/components/bible/TongdokModeIndicator.vue` | 통독모드 표시 |

---

## 통독모드 스펙

### 활성화 조건
- 통독플랜 탭에서 일정 클릭 시 자동 활성화

### 자동 읽음 처리 트리거
1. **다음 장 이동 시**: 일정의 마지막 장을 넘어가면 자동 완료
2. **스크롤 끝 도달 시**: 선택적 (설정 가능)

### URL 파라미터
```
/bible?plan=1&schedule=42&tongdok=true
```

---

## 구현 상세

### BibleTabNavigation.vue

```vue
<!-- frontend/app/components/bible/BibleTabNavigation.vue -->
<template>
  <nav class="bible-tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab-btn', { active: activeTab === tab.id }]"
      @click="$emit('change', tab.id)"
    >
      <i :class="tab.icon"></i>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: 'reading' | 'plan'
}>()

defineEmits<{
  (e: 'change', tab: 'reading' | 'plan'): void
}>()

const tabs = [
  { id: 'reading' as const, label: '성경읽기', icon: 'fa-solid fa-book-bible' },
  { id: 'plan' as const, label: '통독플랜', icon: 'fa-solid fa-calendar-check' },
]
</script>

<style scoped>
.bible-tab-nav {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--bg-hover);
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
  font-weight: 600;
}

.tab-btn i {
  font-size: 1.1rem;
}
</style>
```

### TongdokModeIndicator.vue

```vue
<!-- frontend/app/components/bible/TongdokModeIndicator.vue -->
<template>
  <div v-if="isActive" class="tongdok-indicator">
    <div class="indicator-content">
      <span class="mode-badge">
        <i class="fa-solid fa-bolt"></i>
        통독모드
      </span>

      <span class="schedule-info">
        오늘 일정: {{ bookName }} {{ schedule.start_chapter }}-{{ schedule.end_chapter }}장
      </span>

      <span class="progress-info">
        진행: {{ currentChapter - schedule.start_chapter + 1 }}/{{ totalChapters }}장
      </span>

      <button class="exit-btn" @click="$emit('exit')">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BIBLE_BOOKS } from '~/constants/bible'

const props = defineProps<{
  isActive: boolean
  schedule: {
    book: string
    start_chapter: number
    end_chapter: number
    is_complete: boolean
  } | null
  currentChapter: number
}>()

defineEmits<{
  (e: 'exit'): void
}>()

const bookName = computed(() =>
  BIBLE_BOOKS.find(b => b.code === props.schedule?.book)?.name || ''
)

const totalChapters = computed(() =>
  props.schedule ? props.schedule.end_chapter - props.schedule.start_chapter + 1 : 0
)

const progressPercent = computed(() => {
  if (!props.schedule) return 0
  const current = props.currentChapter - props.schedule.start_chapter + 1
  return Math.min(100, (current / totalChapters.value) * 100)
})
</script>

<style scoped>
.tongdok-indicator {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: white;
  padding: 0.75rem 1rem;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.mode-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.schedule-info {
  flex: 1;
}

.progress-info {
  font-weight: 500;
}

.exit-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.25rem;
  cursor: pointer;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
```

### bible/index.vue (완성)

```vue
<!-- frontend/app/pages/bible/index.vue -->
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
        <BibleScheduleContent
          v-if="activeTab === 'plan'"
          @schedule-select="handleScheduleSelect"
        />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBibleStore } from '~/stores/bible'
import { useAuthStore } from '~/stores/auth'
import { useBibleReader } from '~/composables/useBibleReader'

definePageMeta({
  title: '성경읽기'
})

// Route & Router
const route = useRoute()
const router = useRouter()

// Stores
const bibleStore = useBibleStore()
const authStore = useAuthStore()

// Composables
const { loadLastPosition } = useBibleReader()

// State
const activeTab = ref<'reading' | 'plan'>('reading')

// URL 파라미터에서 초기값
const initialBook = computed(() => route.query.book as string || bibleStore.currentBook)
const initialChapter = computed(() =>
  route.query.chapter ? Number(route.query.chapter) : bibleStore.currentChapter
)

// 통독모드 URL 파라미터 처리
onMounted(async () => {
  // 마지막 위치 불러오기
  if (authStore.isAuthenticated) {
    const position = await loadLastPosition()
    if (position && !route.query.book) {
      bibleStore.setCurrentPosition(position.book, position.chapter)
    }
  }

  // URL에서 통독모드 확인
  if (route.query.tongdok === 'true' && route.query.schedule) {
    // TODO: schedule 정보 조회 후 통독모드 활성화
    bibleStore.setTongdokMode(true)
  }
})

// Methods
const handleTabChange = (tab: 'reading' | 'plan') => {
  activeTab.value = tab

  // 탭 변경 시 URL 업데이트
  router.replace({
    query: {
      ...route.query,
      tab,
    }
  })
}

const handleScheduleSelect = (schedule: any) => {
  // 통독모드 활성화
  bibleStore.setTongdokMode(true, schedule)

  // 성경읽기 탭으로 전환
  activeTab.value = 'reading'

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
  // URL 업데이트 (기록용)
  router.replace({
    query: {
      ...route.query,
      book: position.book,
      chapter: position.chapter,
    }
  })
}

const handleChapterComplete = async (schedule: any) => {
  if (!authStore.isAuthenticated) return

  try {
    // API 호출하여 읽음 처리
    const api = useApi()
    await api.post('/api/v1/todos/reading/', {
      plan_id: schedule.plan_id,
      schedule_ids: [schedule.id],
      action: 'complete'
    })

    // Toast 표시
    // showToast('읽기 완료!')

    // 스케줄 상태 업데이트
    schedule.is_complete = true
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
  const { plan, schedule, tongdok, ...restQuery } = route.query
  router.replace({ query: restQuery })
}
</script>

<style scoped>
.bible-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-color);
}

.tab-content {
  flex: 1;
  overflow: hidden;
}
</style>
```

---

## 테스트 체크리스트

- [ ] 탭 전환 동작 확인
- [ ] 성경읽기 탭 정상 동작
- [ ] 통독플랜 탭 정상 동작
- [ ] 통독모드 활성화/비활성화
- [ ] 일정 클릭 → 성경읽기 전환 + 통독모드 ON
- [ ] 마지막 장 넘어갈 때 자동 완료
- [ ] URL 파라미터 연동
- [ ] 빌드 에러 없음

---

## Chrome DevTools 테스트

```
1. localhost:3000/bible 접속
2. 탭 전환 테스트
3. 통독플랜 탭에서 일정 클릭
4. 통독모드 표시 확인
5. 성경 읽기 후 다음 장 이동
6. 자동 완료 처리 확인
```

---

## 완료 조건

1. 탭 UI가 정상 동작
2. 통독모드가 올바르게 활성화/비활성화
3. 자동 읽음 처리 동작
4. URL 파라미터 연동

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -
