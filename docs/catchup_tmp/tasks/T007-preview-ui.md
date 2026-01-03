# T007: 미리보기 화면

> 상태: `pending`
> 의존: T006
> 커밋: -

## 목표

따라잡기 설정 기반으로 분배된 스케줄 미리보기 화면을 구현합니다.

## UI 설계

```
┌─────────────────────────────────────────┐
│  📊 미리보기                        [X] │
├─────────────────────────────────────────┤
│                                         │
│  이대로 진행하면...                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📚 총 14일치 따라잡기             │   │
│  │ 📖 총 45장                       │   │
│  │ 📈 하루 평균 2.3회 (7.5장)        │   │
│  │ 📅 1월 28일에 원본 플랜과 합류     │   │
│  │ ⏱️ 예상 소요: 6일                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️ 경고                               │
│  ┌─────────────────────────────────┐   │
│  │ 목표일까지 완료하려면 하루 평균    │   │
│  │ 3.5회를 읽어야 합니다             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📅 일자별 계획                         │
│  ┌─────────────────────────────────┐   │
│  │ ▼ 1/15 (수) - 2회, 6장            │   │
│  │   • 창세기 1-2장 (1/1 밀림)       │   │
│  │   • 창세기 3-4장 (1/2 밀림)       │   │
│  ├─────────────────────────────────┤   │
│  │ ▼ 1/16 (목) - 2회, 5장            │   │
│  │   • 창세기 5-6장                 │   │
│  │   • 창세기 7장                   │   │
│  ├─────────────────────────────────┤   │
│  │ ▼ 1/17 (금) - 3회, 8장            │   │
│  │   • ...                         │   │
│  ├─────────────────────────────────┤   │
│  │ ⭐ 1/18 (토) - 4회, 12장 (주말)    │   │
│  │   • ...                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  ◀ 다시설정  │  │   시작하기 🚀   │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

## 작업 내용

### 1. 컴포넌트

`frontend/app/components/catchup/CatchupPreview.vue`:

```vue
<script setup lang="ts">
interface PreviewData {
  valid: boolean
  summary: {
    total_schedules: number
    total_chapters: number
    daily_average_readings: number
    daily_average_chapters: number
    estimated_days: number
    rejoin_date: string
  }
  preview_schedules: PreviewDay[]
  warnings: string[]
}

interface PreviewDay {
  date: string
  is_weekend: boolean
  items: PreviewItem[]
  total_chapters: number
}

const props = defineProps<{
  preview: PreviewData
  settings: CatchupSettings
}>()

const emit = defineEmits(['back', 'confirm'])

// 날짜별로 접기/펼치기
const expandedDates = ref<Set<string>>(new Set())

const toggleDate = (date: string) => {
  if (expandedDates.value.has(date)) {
    expandedDates.value.delete(date)
  } else {
    expandedDates.value.add(date)
  }
}

// 처음 3일은 기본 펼침
onMounted(() => {
  props.preview.preview_schedules.slice(0, 3).forEach(day => {
    expandedDates.value.add(day.date)
  })
})
</script>

<template>
  <div class="catchup-preview">
    <!-- 요약 카드 -->
    <div class="summary-card">
      <div class="stat">
        <span class="icon">📚</span>
        <span>총 {{ preview.summary.total_schedules }}일치 따라잡기</span>
      </div>
      <div class="stat">
        <span class="icon">📖</span>
        <span>총 {{ preview.summary.total_chapters }}장</span>
      </div>
      <div class="stat">
        <span class="icon">📈</span>
        <span>
          하루 평균 {{ preview.summary.daily_average_readings.toFixed(1) }}회
          ({{ preview.summary.daily_average_chapters.toFixed(1) }}장)
        </span>
      </div>
      <div class="stat">
        <span class="icon">📅</span>
        <span>{{ formatDate(preview.summary.rejoin_date) }}에 원본 플랜과 합류</span>
      </div>
      <div class="stat">
        <span class="icon">⏱️</span>
        <span>예상 소요: {{ preview.summary.estimated_days }}일</span>
      </div>
    </div>

    <!-- 경고 -->
    <div v-if="preview.warnings.length" class="warnings">
      <div v-for="warning in preview.warnings" class="warning">
        ⚠️ {{ warning }}
      </div>
    </div>

    <!-- 일자별 계획 -->
    <div class="schedule-list">
      <div
        v-for="day in preview.preview_schedules"
        :key="day.date"
        class="day-group"
        :class="{ weekend: day.is_weekend }"
      >
        <div class="day-header" @click="toggleDate(day.date)">
          <span v-if="day.is_weekend" class="weekend-badge">⭐</span>
          <span class="date">{{ formatDate(day.date) }}</span>
          <span class="count">{{ day.items.length }}회, {{ day.total_chapters }}장</span>
          <span class="toggle">{{ expandedDates.has(day.date) ? '▼' : '▶' }}</span>
        </div>
        <div v-if="expandedDates.has(day.date)" class="day-items">
          <div v-for="item in day.items" class="item">
            • {{ item.book }} {{ item.start_chapter }}-{{ item.end_chapter }}장
            <span class="original-date">({{ formatDate(item.original_date) }} 밀림)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 버튼 -->
    <div class="actions">
      <button @click="emit('back')" class="btn-secondary">◀ 다시설정</button>
      <button @click="emit('confirm')" class="btn-primary">시작하기 🚀</button>
    </div>
  </div>
</template>
```

## 파일 변경

- `frontend/app/components/catchup/CatchupPreview.vue` (신규)
- `frontend/app/components/catchup/CatchupSettingsModal.vue` (수정 - 미리보기 연동)

## 검증 방법

1. 설정 모달에서 미리보기 버튼 클릭
2. 미리보기 화면 표시 확인
3. 요약 정보 정확성 확인
4. 일자별 스케줄 접기/펼치기 동작
5. 주말 표시 확인
6. 경고 메시지 표시 확인
7. 다시설정/시작하기 버튼 동작

## 완료 조건

- [ ] 요약 카드 표시
- [ ] 경고 메시지 표시 (있는 경우)
- [ ] 일자별 스케줄 목록
- [ ] 접기/펼치기 동작
- [ ] 주말 하이라이트
- [ ] 다시설정 버튼 → 설정 화면 복귀
- [ ] 시작하기 버튼 → 세션 생성
