# Task 4-2: 읽기 기록/통계 페이지

> **Phase**: 4 - 설정 및 마무리
> **상태**: ⬜ 대기
> **의존성**: Task 4-1 완료 필요

---

## 목표

- 읽기 기록/통계 페이지 (`/bible/history`) 구현
- 전체 진도, 책별 진도, 연속 읽기 통계
- 캘린더 뷰 (읽은 날짜 표시)

---

## 서브태스크

### 4.2.1 통계 API 연동
- [ ] GET `/api/v1/bible/personal-records/stats/` 연동
- [ ] 전체 진도 (읽은 장 / 전체 장)
- [ ] 책별 진도
- [ ] 연속 읽기 일수 (streak)

### 4.2.2 페이지 레이아웃
- [ ] `/bible/history` 페이지 구현
- [ ] 상단 요약 카드 (전체 진도, streak)
- [ ] 책별 진도 그리드
- [ ] 캘린더 뷰

### 4.2.3 시각화
- [ ] 전체 진도 원형 차트
- [ ] 책별 진도 바 차트
- [ ] 캘린더 히트맵 (읽은 날짜)

### 4.2.4 필터/뷰 옵션
- [ ] 구약/신약 필터
- [ ] 완독한 책만 보기
- [ ] 읽지 않은 책만 보기

---

## 구현 상세

### /bible/history.vue

```vue
<template>
  <div class="history-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <h1>읽기 기록</h1>
    </header>

    <div v-if="isLoading" class="loading">
      <i class="fa-solid fa-spinner fa-spin" />
    </div>

    <div v-else class="history-content">
      <!-- 요약 카드 -->
      <div class="summary-cards">
        <div class="summary-card total">
          <div class="card-icon">
            <i class="fa-solid fa-book-bible" />
          </div>
          <div class="card-content">
            <div class="card-value">
              {{ stats.total_chapters_read }} / {{ totalChapters }}
            </div>
            <div class="card-label">전체 진도</div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${totalProgress}%` }"
              />
            </div>
          </div>
        </div>

        <div class="summary-card streak">
          <div class="card-icon">
            <i class="fa-solid fa-fire" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.current_streak }}일</div>
            <div class="card-label">연속 읽기</div>
          </div>
        </div>

        <div class="summary-card books">
          <div class="card-icon">
            <i class="fa-solid fa-check-double" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.books_completed }} / 66권</div>
            <div class="card-label">완독</div>
          </div>
        </div>
      </div>

      <!-- 캘린더 -->
      <section class="calendar-section">
        <h2 class="section-title">읽기 캘린더</h2>
        <ReadingCalendar :reading-dates="readingDates" />
      </section>

      <!-- 책별 진도 -->
      <section class="books-section">
        <div class="section-header">
          <h2 class="section-title">책별 진도</h2>
          <div class="filter-tabs">
            <button
              :class="{ active: filter === 'all' }"
              @click="filter = 'all'"
            >
              전체
            </button>
            <button
              :class="{ active: filter === 'old' }"
              @click="filter = 'old'"
            >
              구약
            </button>
            <button
              :class="{ active: filter === 'new' }"
              @click="filter = 'new'"
            >
              신약
            </button>
          </div>
        </div>

        <div class="books-grid">
          <div
            v-for="book in filteredBooks"
            :key="book.id"
            class="book-card"
            :class="{ completed: book.read === book.total }"
            @click="goToBook(book.id)"
          >
            <div class="book-name">{{ book.name }}</div>
            <div class="book-progress">
              <div class="progress-text">
                {{ book.read }} / {{ book.total }}
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${(book.read / book.total) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useBibleData } from '~/composables/useBibleData';

const router = useRouter();
const api = useApi();
const { bibleBooks } = useBibleData();

const isLoading = ref(true);
const stats = ref({
  total_chapters_read: 0,
  books_read: 0,
  books_completed: 0,
  current_streak: 0,
  books_progress: {}
});
const readingDates = ref<string[]>([]);
const filter = ref('all');

// 전체 장 수
const totalChapters = computed(() => {
  const all = [...bibleBooks.old, ...bibleBooks.new];
  return all.reduce((sum, book) => sum + book.chapters, 0);
});

// 전체 진도 퍼센트
const totalProgress = computed(() => {
  return (stats.value.total_chapters_read / totalChapters.value) * 100;
});

// 책 목록 with 진도
const booksWithProgress = computed(() => {
  const all = [...bibleBooks.old.map(b => ({ ...b, testament: 'old' })),
               ...bibleBooks.new.map(b => ({ ...b, testament: 'new' }))];

  return all.map(book => ({
    ...book,
    read: stats.value.books_progress[book.id]?.read || 0,
    total: book.chapters
  }));
});

// 필터링된 책
const filteredBooks = computed(() => {
  if (filter.value === 'all') return booksWithProgress.value;
  return booksWithProgress.value.filter(b => b.testament === filter.value);
});

// 통계 로드
const loadStats = async () => {
  try {
    const response = await api.get('/api/v1/bible/personal-records/stats/');
    stats.value = response.data.stats;

    // 읽기 날짜 로드 (캘린더용)
    const datesResponse = await api.get('/api/v1/bible/personal-records/dates/');
    readingDates.value = datesResponse.data.dates || [];
  } catch (error) {
    console.error('통계 로드 실패:', error);
  } finally {
    isLoading.value = false;
  }
};

const goToBook = (bookId: string) => {
  router.push(`/bible?book=${bookId}&chapter=1`);
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.history-page {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.history-content {
  padding: 1rem;
}

/* 요약 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.summary-card.total .card-icon {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.summary-card.streak .card-icon {
  background: #fef3c7;
  color: #f59e0b;
}

.summary-card.books .card-icon {
  background: #d1fae5;
  color: #10b981;
}

.card-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.card-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

/* 진도 바 */
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

/* 섹션 */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

/* 필터 탭 */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
}

.filter-tabs button {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: transparent;
  font-size: 0.75rem;
  cursor: pointer;
}

.filter-tabs button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* 책 그리드 */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.book-card {
  background: var(--color-bg-card);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.book-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.book-card.completed {
  border: 2px solid var(--color-success);
}

.book-name {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}
</style>
```

### ReadingCalendar.vue 컴포넌트

```vue
<template>
  <div class="reading-calendar">
    <!-- 월 네비게이션 -->
    <div class="calendar-header">
      <button @click="prevMonth">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <span class="current-month">
        {{ currentYear }}년 {{ currentMonth + 1 }}월
      </span>
      <button @click="nextMonth">
        <i class="fa-solid fa-chevron-right" />
      </button>
    </div>

    <!-- 요일 헤더 -->
    <div class="calendar-weekdays">
      <span v-for="day in weekdays" :key="day">{{ day }}</span>
    </div>

    <!-- 날짜 그리드 -->
    <div class="calendar-grid">
      <div
        v-for="(date, index) in calendarDays"
        :key="index"
        class="calendar-day"
        :class="{
          'other-month': !date.isCurrentMonth,
          'has-reading': date.hasReading,
          'today': date.isToday
        }"
      >
        <span class="day-number">{{ date.day }}</span>
        <span v-if="date.hasReading" class="reading-dot" />
      </div>
    </div>

    <!-- 범례 -->
    <div class="calendar-legend">
      <span class="legend-item">
        <span class="reading-dot" /> 읽음
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  readingDates: string[];
}>();

const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// 읽은 날짜 Set
const readingDateSet = computed(() => new Set(props.readingDates));

// 캘린더 날짜 계산
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days = [];

  // 이전 달 날짜
  const prevMonthDays = firstDay.getDay();
  const prevMonth = new Date(year, month, 0);
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonth.getDate() - i;
    const date = new Date(year, month - 1, day);
    days.push({
      day,
      isCurrentMonth: false,
      hasReading: readingDateSet.value.has(formatDate(date)),
      isToday: false
    });
  }

  // 현재 달 날짜
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    days.push({
      day,
      isCurrentMonth: true,
      hasReading: readingDateSet.value.has(formatDate(date)),
      isToday
    });
  }

  // 다음 달 날짜 (42일 채우기)
  const remaining = 42 - days.length;
  for (let day = 1; day <= remaining; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      day,
      isCurrentMonth: false,
      hasReading: readingDateSet.value.has(formatDate(date)),
      isToday: false
    });
  }

  return days;
});

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};
</script>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**요약 통계:**
- [ ] `/bible/history` 접속
- [ ] 전체 진도 카드 표시
- [ ] 연속 읽기 일수 표시
- [ ] 완독 권수 표시

**캘린더:**
- [ ] 현재 월 표시
- [ ] 읽은 날짜에 점 표시
- [ ] 월 이동 네비게이션

**책별 진도:**
- [ ] 66권 전체 표시
- [ ] 구약/신약 필터
- [ ] 책 클릭 시 해당 책으로 이동
- [ ] 완독 책 표시

---

## 완료 기준

1. 통계 API 연동 정상
2. 요약 카드 표시
3. 캘린더 뷰 동작
4. 책별 진도 표시
5. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
