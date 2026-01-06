# Task 2-3: 통독모드 구현

> **Phase**: 2 - 핵심 기능
> **상태**: ✅ 완료
> **의존성**: Task 2-2 완료 필요

---

## 목표

- 통독모드 (Plan 기반 성경 읽기)
- `/plan`에서 진입 시 확인 모달
- 마지막 장 이동 시 완료 확인 모달
- 자동 완료 옵션 (설정 저장)

---

## 서브태스크

### 2.3.1 통독모드 진입
- [ ] `/plan` 페이지에서 일정 클릭 시 확인 모달 표시
- [ ] `TongdokEntryModal.vue` 컴포넌트 구현
- [ ] 확인 시 `/bible?plan=x&schedule=y`로 이동

### 2.3.2 통독모드 UI
- [ ] `TongdokIndicator.vue` 컴포넌트 구현
- [ ] 상단에 통독모드 배지 표시 (플랜명, 범위)
- [ ] 통독모드 종료 버튼 (X)

### 2.3.3 통독모드 완료 처리
- [ ] `TongdokCompleteModal.vue` 컴포넌트 구현
- [ ] 마지막 장에서 "다음" 클릭 시 확인 모달
- [ ] "다음부터 자동 완료" 체크박스
- [ ] 조기 완료 버튼 (일정 범위 내에서)

### 2.3.4 자동 완료 설정
- [ ] `useReadingSettings` store에 autoComplete 옵션 추가
- [ ] localStorage 저장
- [ ] 설정 페이지에서 초기화 가능 안내

### 2.3.5 통독 진도 API 연동
- [ ] 기존 `UserBibleProgress` API 연동
- [ ] POST `/api/v1/todos/reading/update/` 호출
- [ ] 성공 시 토스트 + /plan으로 이동 옵션

---

## 구현 상세

### TongdokEntryModal.vue

```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <div class="modal-icon">
          <i class="fa-solid fa-book-open" />
        </div>

        <h2 class="modal-title">{{ planName }}</h2>

        <p class="modal-range">
          {{ bookName }} {{ startChapter }}-{{ endChapter }}장
        </p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="close">취소</button>
          <button class="btn-confirm" @click="confirm">읽기 시작</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps<{
  modelValue: boolean;
  planName: string;
  bookName: string;
  startChapter: number;
  endChapter: number;
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const close = () => emit('update:modelValue', false);
const confirm = () => {
  emit('confirm');
  close();
};
</script>
```

### TongdokIndicator.vue

```vue
<template>
  <div class="tongdok-indicator">
    <div class="tongdok-badge">
      <i class="fa-solid fa-bolt" />
      <span>통독모드</span>
    </div>

    <div class="tongdok-info">
      <span class="plan-name">{{ planName }}</span>
      <span class="range">{{ bookName }} {{ startChapter }}-{{ endChapter }}장</span>
    </div>

    <button class="tongdok-close" @click="$emit('close')" title="통독모드 종료">
      <i class="fa-solid fa-xmark" />
    </button>
  </div>
</template>

<script setup>
defineProps<{
  planName: string;
  bookName: string;
  startChapter: number;
  endChapter: number;
}>();

defineEmits(['close']);
</script>

<style scoped>
.tongdok-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-bottom: 1px solid #fcd34d;
}

.tongdok-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f59e0b;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tongdok-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.plan-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #92400e;
}

.range {
  font-size: 0.875rem;
  font-weight: 600;
  color: #78350f;
}

.tongdok-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #92400e;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.tongdok-close:hover {
  background: rgba(0, 0, 0, 0.1);
}
</style>
```

### TongdokCompleteModal.vue

```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <div class="modal-icon success">
          <i class="fa-solid fa-check" />
        </div>

        <h2 class="modal-title">오늘 분량을 다 읽으셨나요?</h2>

        <p class="modal-range">
          {{ bookName }} {{ startChapter }}-{{ endChapter }}장
        </p>

        <label class="auto-complete-option">
          <input type="checkbox" v-model="autoCompleteChecked" />
          <span>다음부터 자동으로 완료 처리</span>
        </label>

        <p class="auto-complete-hint" v-if="autoCompleteChecked">
          설정 > 읽기 설정에서 변경할 수 있습니다
        </p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="close">취소</button>
          <button class="btn-confirm" @click="confirm">완료 처리</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

defineProps<{
  modelValue: boolean;
  bookName: string;
  startChapter: number;
  endChapter: number;
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const autoCompleteChecked = ref(false);

const close = () => emit('update:modelValue', false);
const confirm = () => {
  emit('confirm', { autoComplete: autoCompleteChecked.value });
  close();
};
</script>
```

### useTongdokMode.ts

```typescript
// composables/useTongdokMode.ts
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useReadingSettingsStore } from '~/stores/readingSettings';

export const useTongdokMode = () => {
  const route = useRoute();
  const router = useRouter();
  const api = useApi();
  const settingsStore = useReadingSettingsStore();

  // 통독모드 여부
  const isTongdokMode = computed(() => !!route.query.plan);
  const planId = computed(() => route.query.plan as string | null);
  const scheduleId = computed(() => route.query.schedule as string | null);

  // 일정 정보
  const scheduleInfo = ref<{
    planName: string;
    bookCode: string;
    bookName: string;
    startChapter: number;
    endChapter: number;
  } | null>(null);

  // 자동 완료 설정
  const autoComplete = computed(() => settingsStore.settings.tongdokAutoComplete || false);

  // 일정 정보 로드
  const loadScheduleInfo = async () => {
    if (!scheduleId.value) return;

    try {
      const response = await api.get(`/api/v1/todos/schedule/${scheduleId.value}/`);
      scheduleInfo.value = {
        planName: response.data.plan_name,
        bookCode: response.data.book_code,
        bookName: response.data.book_kor,
        startChapter: response.data.start_chapter,
        endChapter: response.data.end_chapter
      };
    } catch (error) {
      console.error('일정 정보 로드 실패:', error);
    }
  };

  // 마지막 장 여부
  const isLastChapter = (currentChapter: number) => {
    if (!scheduleInfo.value) return false;
    return currentChapter >= scheduleInfo.value.endChapter;
  };

  // 완료 처리
  const completeReading = async () => {
    if (!planId.value || !scheduleId.value) return;

    try {
      await api.post('/api/v1/todos/reading/update/', {
        plan_id: planId.value,
        schedule_ids: [scheduleId.value],
        action: 'complete'
      });
      return true;
    } catch (error) {
      console.error('읽기 완료 처리 실패:', error);
      return false;
    }
  };

  // 자동 완료 설정 저장
  const setAutoComplete = (value: boolean) => {
    settingsStore.updateSettings({ tongdokAutoComplete: value });
  };

  // 통독모드 종료
  const exitTongdokMode = () => {
    const { plan, schedule, ...rest } = route.query;
    router.replace({ query: rest });
  };

  return {
    isTongdokMode,
    planId,
    scheduleId,
    scheduleInfo,
    autoComplete,
    loadScheduleInfo,
    isLastChapter,
    completeReading,
    setAutoComplete,
    exitTongdokMode
  };
};
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**진입:**
- [ ] `/plan` 접속
- [ ] 일정 클릭 시 확인 모달 표시
- [ ] 모달에 플랜명, 범위 표시
- [ ] "읽기 시작" 클릭 시 `/bible?plan=x&schedule=y`로 이동

**통독모드 UI:**
- [ ] 상단에 통독모드 인디케이터 표시
- [ ] 플랜명, 범위 표시
- [ ] X 버튼 클릭 시 통독모드 종료 (일반 읽기모드로)

**완료 처리:**
- [ ] 마지막 장에서 "다음" 클릭 시 완료 모달 표시
- [ ] "완료 처리" 클릭 시 API 호출
- [ ] 성공 시 토스트 메시지
- [ ] "자동 완료" 체크 시 설정 저장
- [ ] 다음 통독 시 자동 완료 동작 확인

**조기 완료:**
- [ ] 범위 내에서 "완료" 버튼으로 조기 완료 가능

---

## 완료 기준

1. 통독모드 진입 플로우 완성
2. 통독모드 UI 표시
3. 완료 처리 API 연동
4. 자동 완료 설정 저장/동작
5. 빌드 성공

---

## 완료 정보

- **완료일**: 2026-01-06
- **커밋**: (커밋 후 업데이트)
- **비고**: 통독 인디케이터 종료 버튼, 완료 모달, 자동 완료 설정, API 연동 구현 완료
