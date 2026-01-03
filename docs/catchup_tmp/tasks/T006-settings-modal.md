# T006: 프론트엔드 설정 모달

> 상태: `pending`
> 의존: T001-T005 (백엔드 완료 후)
> 커밋: -

## 목표

따라잡기 설정을 입력받는 모달 컴포넌트를 구현합니다.

## 컴포넌트 구조

```
components/
  catchup/
    CatchupSettingsModal.vue    # 메인 모달
    CatchupRangeSelector.vue    # 범위 선택
    CatchupStrategySelector.vue # 전략 선택
    CatchupLimitSettings.vue    # 읽기량 설정
```

## UI 설계

```
┌─────────────────────────────────────────┐
│  📚 따라잡기 계획 세우기            [X] │
├─────────────────────────────────────────┤
│                                         │
│  📝 이름                                │
│  ┌─────────────────────────────────┐   │
│  │ 나의 1월 도전!                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📅 따라잡을 범위                       │
│  ┌─────────────────────────────────┐   │
│  │ ○ 오늘까지 밀린 것 전부 (14일치)  │   │
│  │ ● 기간 직접 선택                 │   │
│  │   [2025-01-01] ~ [2025-01-14]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🎯 진행 방식                           │
│  ┌───────────────┬───────────────┐     │
│  │   동시 진행   │  ● 순차 복귀  │     │
│  └───────────────┴───────────────┘     │
│  💡 성경을 순서대로 읽으며 따라잡기      │
│                                         │
│  📖 하루 최대 읽기량                    │
│  ┌────┐회  또는  ┌────┐장             │
│  │ 3  │         │    │               │
│  └────┘         └────┘               │
│                                         │
│  ☑ 주말에 더 읽기 (1.5배)              │
│                                         │
│  📆 목표 복귀일                         │
│  💡 추천: 2025-01-25 (하루 3회 기준)    │
│  ┌─────────────────────────────────┐   │
│  │ 2025-01-28                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   미리보기   │  │  계획 시작하기  │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

## 작업 내용

### 1. API 서비스

`frontend/app/services/catchupApi.ts`:

```typescript
interface CatchupSettings {
  name: string
  range_start: string
  range_end: string
  strategy: 'parallel' | 'sequential'
  max_daily_readings?: number
  max_daily_chapters?: number
  weekend_multiplier: number
  target_rejoin_date?: string
}

export const catchupApi = {
  getStatus: (subscriptionId: number) =>
    $fetch(`/api/v1/todos/subscriptions/${subscriptionId}/catchup-status/`),

  preview: (subscriptionId: number, settings: CatchupSettings) =>
    $fetch(`/api/v1/todos/subscriptions/${subscriptionId}/catchup/preview/`, {
      method: 'POST',
      body: settings
    }),

  create: (subscriptionId: number, settings: CatchupSettings) =>
    $fetch(`/api/v1/todos/subscriptions/${subscriptionId}/catchup/`, {
      method: 'POST',
      body: settings
    })
}
```

### 2. 모달 컴포넌트

`frontend/app/components/catchup/CatchupSettingsModal.vue`:

```vue
<script setup lang="ts">
interface Props {
  subscriptionId: number
  overdueStatus: OverdueStatus
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'created'])

const settings = reactive({
  name: '',
  rangeMode: 'all', // 'all' | 'custom'
  range_start: props.overdueStatus.overdue_range.start,
  range_end: props.overdueStatus.overdue_range.end,
  strategy: 'sequential',
  max_daily_readings: 3,
  max_daily_chapters: null,
  useWeekendMultiplier: true,
  weekend_multiplier: 1.5,
  target_rejoin_date: ''
})

// 자동 계산된 추천 복귀일
const suggestedRejoinDate = computed(() => {
  return props.overdueStatus.suggested_settings.estimated_rejoin_date
})

const handlePreview = () => {
  emit('preview', settings)
}

const handleCreate = async () => {
  const result = await catchupApi.create(props.subscriptionId, settings)
  emit('created', result)
}
</script>
```

### 3. Composable

`frontend/app/composables/useCatchup.ts`:

```typescript
export const useCatchup = (subscriptionId: Ref<number>) => {
  const status = ref<OverdueStatus | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStatus = async () => {
    loading.value = true
    try {
      status.value = await catchupApi.getStatus(subscriptionId.value)
    } catch (e) {
      error.value = '현황을 불러올 수 없습니다'
    } finally {
      loading.value = false
    }
  }

  return { status, loading, error, fetchStatus }
}
```

## 파일 변경

- `frontend/app/services/catchupApi.ts` (신규)
- `frontend/app/composables/useCatchup.ts` (신규)
- `frontend/app/components/catchup/CatchupSettingsModal.vue` (신규)
- `frontend/app/components/catchup/CatchupRangeSelector.vue` (신규)
- `frontend/app/components/catchup/CatchupStrategySelector.vue` (신규)
- `frontend/app/components/catchup/CatchupLimitSettings.vue` (신규)

## 검증 방법

1. 브라우저에서 localhost:3000 접속
2. 구독 중인 플랜에서 따라잡기 버튼 클릭
3. 모달 표시 확인
4. 각 설정 입력 동작 확인
5. 미리보기 버튼 클릭 시 T007으로 전환

## 완료 조건

- [ ] 모달 열기/닫기 동작
- [ ] 이름 입력 가능
- [ ] 범위 선택 (전체/직접 선택)
- [ ] 전략 선택 (동시/순차)
- [ ] 읽기량 설정 (횟수/장 수)
- [ ] 주말 배수 설정
- [ ] 목표 복귀일 선택 (추천값 표시)
- [ ] 미리보기 버튼 연결
- [ ] 시작하기 버튼 연결
