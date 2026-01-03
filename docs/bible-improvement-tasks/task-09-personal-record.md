# Task 9: 개인 읽기 기록

> **상태**: ⬜ 대기
> **의존성**: Task 8 완료 필요
> **예상 파일**: 읽기 기록 컴포넌트

---

## 목표

Plan과 무관하게 개인적으로 읽은 성경 장을 기록하고 통계를 제공한다.

---

## 기능 스펙

### 기록 정보
- 책 (book)
- 장 (chapter)
- 읽은 날짜 (read_date)

### 통계 정보
- 총 읽은 장 수
- 완독한 책 수
- 연속 읽기 일수 (streak)
- 책별 진도율

### 기록 시점
- 성경 장을 읽고 "읽음 표시" 클릭 시 (Plan 없을 때)
- 통독모드 완료 시 자동 기록

---

## 생성 파일

| 파일 | 설명 |
|------|------|
| `frontend/app/components/bible/ReadingRecordStats.vue` | 읽기 통계 |
| `frontend/app/components/bible/ReadingProgressChart.vue` | 진도 차트 |
| `frontend/app/components/bible/MarkAsReadButton.vue` | 읽음 표시 버튼 |

---

## 구현 상세

### ReadingRecordStats.vue

```vue
<template>
  <div class="reading-stats">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
    </div>

    <template v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="stats-summary">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_chapters_read }}</div>
          <div class="stat-label">읽은 장</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ stats.books_completed }}</div>
          <div class="stat-label">완독한 책</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ stats.current_streak }}</div>
          <div class="stat-label">연속 일수</div>
        </div>
      </div>

      <!-- 책별 진도 -->
      <div class="books-progress">
        <h3>책별 진도</h3>

        <div class="progress-list">
          <div
            v-for="book in sortedBooks"
            :key="book.code"
            class="progress-item"
          >
            <div class="book-info">
              <span class="book-name">{{ book.name }}</span>
              <span class="book-count">
                {{ book.read }}/{{ book.total }}장
              </span>
            </div>

            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: book.percent + '%' }"
                :class="{ complete: book.percent === 100 }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <i class="fa-solid fa-chart-line"></i>
      <p>읽기 기록이 없습니다</p>
      <p class="hint">성경을 읽고 "읽음 표시"를 하면 기록됩니다</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReadingRecord } from '~/composables/useReadingRecord'
import { BIBLE_BOOKS, BOOK_CHAPTERS } from '~/constants/bible'

const { getStats, getBookRecords } = useReadingRecord()

const isLoading = ref(true)
const stats = ref<any>(null)
const bookRecords = ref<Record<string, number[]>>({})

onMounted(async () => {
  try {
    stats.value = await getStats()

    // 각 책별 읽은 장 목록 조회
    for (const book of BIBLE_BOOKS) {
      const records = await getBookRecords(book.code)
      bookRecords.value[book.code] = records.map((r: any) => r.chapter)
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    isLoading.value = false
  }
})

const sortedBooks = computed(() => {
  return BIBLE_BOOKS.map(book => {
    const total = BOOK_CHAPTERS[book.code] || 0
    const read = bookRecords.value[book.code]?.length || 0
    const percent = total > 0 ? Math.round((read / total) * 100) : 0

    return {
      code: book.code,
      name: book.name,
      read,
      total,
      percent,
    }
  }).filter(b => b.read > 0 || b.percent > 0)
    .sort((a, b) => b.percent - a.percent)
})
</script>

<style scoped>
.reading-stats {
  padding: 1rem;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty .hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.books-progress h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.progress-item {
  margin-bottom: 0.75rem;
}

.book-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.book-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.book-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.complete {
  background: var(--success);
}
</style>
```

### MarkAsReadButton.vue

```vue
<template>
  <button
    :class="['mark-read-btn', { marked: isMarked }]"
    @click="handleClick"
    :disabled="isLoading"
  >
    <template v-if="isLoading">
      <span class="loading-spinner small"></span>
    </template>
    <template v-else-if="isMarked">
      <i class="fa-solid fa-check-circle"></i>
      읽음
    </template>
    <template v-else>
      <i class="fa-regular fa-circle"></i>
      읽음 표시
    </template>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReadingRecord } from '~/composables/useReadingRecord'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  book: string
  chapter: number
}>()

const emit = defineEmits<{
  (e: 'marked'): void
}>()

const authStore = useAuthStore()
const { addRecord, getBookRecords } = useReadingRecord()

const isLoading = ref(false)
const isMarked = ref(false)

onMounted(async () => {
  if (!authStore.isAuthenticated) return

  try {
    const records = await getBookRecords(props.book)
    isMarked.value = records.some((r: any) => r.chapter === props.chapter)
  } catch (error) {
    console.error('Failed to check read status:', error)
  }
})

const handleClick = async () => {
  if (!authStore.isAuthenticated) {
    // 로그인 필요 안내
    alert('로그인이 필요합니다')
    return
  }

  if (isMarked.value) {
    // 이미 읽은 경우 - 현재는 취소 불가
    return
  }

  isLoading.value = true

  try {
    await addRecord(props.book, props.chapter)
    isMarked.value = true
    emit('marked')
  } catch (error) {
    console.error('Failed to mark as read:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.mark-read-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mark-read-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.mark-read-btn.marked {
  background: var(--success-bg);
  border-color: var(--success);
  color: var(--success);
}

.mark-read-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

---

## 테스트 체크리스트

- [ ] 읽음 표시 버튼 동작
- [ ] 읽기 기록 저장
- [ ] 통계 데이터 표시
- [ ] 책별 진도율 표시
- [ ] 비로그인 시 안내 메시지
- [ ] 통독모드에서 자동 기록
- [ ] 빌드 에러 없음

---

## 완료 조건

1. 개인 읽기 기록이 정상 저장
2. 통계가 올바르게 계산
3. UI가 직관적

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -
