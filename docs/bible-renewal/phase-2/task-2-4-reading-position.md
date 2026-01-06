# Task 2-4: 마지막 읽기 위치

> **Phase**: 2 - 핵심 기능
> **상태**: ⬜ 대기
> **의존성**: Task 2-1 완료 필요

---

## 목표

- 마지막 읽기 위치 저장/복원
- 다른 기기에서도 이어서 읽기
- `/bible` 진입 시 마지막 위치로 자동 이동 (설정에 따라)

---

## 서브태스크

### 2.4.1 useReadingPosition composable
- [ ] GET `/api/v1/bible/reading-position/` 연동
- [ ] POST `/api/v1/bible/reading-position/` 연동
- [ ] 저장: 책, 장, 스크롤 위치, 역본

### 2.4.2 자동 저장
- [ ] 장 변경 시 자동 저장 (debounce)
- [ ] 역본 변경 시 저장
- [ ] 페이지 이탈 시 저장 (beforeunload)

### 2.4.3 자동 복원
- [ ] `/bible` 진입 시 마지막 위치 확인
- [ ] 설정에 따라 자동 이동 또는 모달 표시
- [ ] "이어서 읽기" / "처음부터" 선택

### 2.4.4 이어서 읽기 모달 (옵션)
- [ ] 마지막 읽던 위치 정보 표시
- [ ] "이어서 읽기" / "처음부터" 버튼

---

## 구현 상세

### useReadingPosition.ts

```typescript
// composables/useReadingPosition.ts
import { ref } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';

interface ReadingPosition {
  book: string;
  chapter: number;
  verse?: number;
  scroll_position: number;
  version: string;
  updated_at: string;
}

export const useReadingPosition = () => {
  const api = useApi();
  const authStore = useAuthStore();

  const lastPosition = ref<ReadingPosition | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);

  // 마지막 위치 조회
  const fetchLastPosition = async (): Promise<ReadingPosition | null> => {
    if (!authStore.isAuthenticated) return null;

    isLoading.value = true;
    try {
      const response = await api.get('/api/v1/bible/reading-position/');
      lastPosition.value = response.data?.position || null;
      return lastPosition.value;
    } catch (error) {
      console.error('읽기 위치 조회 실패:', error);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // 위치 저장 (debounced)
  let saveTimeout: NodeJS.Timeout;
  const savePosition = async (position: Omit<ReadingPosition, 'updated_at'>) => {
    if (!authStore.isAuthenticated) return;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      isSaving.value = true;
      try {
        await api.post('/api/v1/bible/reading-position/', position);
        lastPosition.value = { ...position, updated_at: new Date().toISOString() };
      } catch (error) {
        console.error('읽기 위치 저장 실패:', error);
      } finally {
        isSaving.value = false;
      }
    }, 1000); // 1초 debounce
  };

  // 즉시 저장 (페이지 이탈 시)
  const savePositionImmediately = async (position: Omit<ReadingPosition, 'updated_at'>) => {
    if (!authStore.isAuthenticated) return;

    clearTimeout(saveTimeout);
    try {
      await api.post('/api/v1/bible/reading-position/', position);
    } catch (error) {
      console.error('읽기 위치 저장 실패:', error);
    }
  };

  return {
    lastPosition,
    isLoading,
    isSaving,
    fetchLastPosition,
    savePosition,
    savePositionImmediately
  };
};
```

### /bible/index.vue 연동

```vue
<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useReadingSettingsStore } from '~/stores/readingSettings';
import { useBibleData } from '~/composables/useBibleData';

const route = useRoute();
const router = useRouter();
const settingsStore = useReadingSettingsStore();
const { fetchLastPosition, savePosition, savePositionImmediately } = useReadingPosition();
const { getBookName } = useBibleData();

// 현재 상태
const currentBook = ref('gen');
const currentChapter = ref(1);
const currentVersion = ref('GAE');
const scrollPosition = ref(0);

// 이어서 읽기 모달
const showResumeModal = ref(false);
const resumePosition = ref<ReadingPosition | null>(null);

// 초기화
onMounted(async () => {
  // URL에 책/장이 지정되어 있으면 그걸 사용
  if (route.query.book || route.query.chapter) {
    currentBook.value = (route.query.book as string) || 'gen';
    currentChapter.value = parseInt(route.query.chapter as string) || 1;
    return;
  }

  // 마지막 위치 확인
  const lastPos = await fetchLastPosition();
  if (lastPos) {
    const entryPoint = settingsStore.settings.defaultEntryPoint || 'last-position';

    if (entryPoint === 'last-position') {
      // 자동으로 마지막 위치로 이동
      currentBook.value = lastPos.book;
      currentChapter.value = lastPos.chapter;
      currentVersion.value = lastPos.version;
      scrollPosition.value = lastPos.scroll_position;
    } else if (entryPoint === 'home') {
      // 홈/대시보드 표시 (별도 구현)
    } else {
      // 목차 표시 (별도 구현)
    }
  }
});

// 장 변경 시 위치 저장
watch([currentBook, currentChapter, currentVersion], () => {
  savePosition({
    book: currentBook.value,
    chapter: currentChapter.value,
    version: currentVersion.value,
    scroll_position: scrollPosition.value
  });
});

// 스크롤 변경 시 위치 저장
const handleScroll = (position: number) => {
  scrollPosition.value = position;
  savePosition({
    book: currentBook.value,
    chapter: currentChapter.value,
    version: currentVersion.value,
    scroll_position: position
  });
};

// 페이지 이탈 시 저장
onBeforeUnmount(() => {
  savePositionImmediately({
    book: currentBook.value,
    chapter: currentChapter.value,
    version: currentVersion.value,
    scroll_position: scrollPosition.value
  });
});

// beforeunload 이벤트
if (process.client) {
  window.addEventListener('beforeunload', () => {
    savePositionImmediately({
      book: currentBook.value,
      chapter: currentChapter.value,
      version: currentVersion.value,
      scroll_position: scrollPosition.value
    });
  });
}
</script>
```

### ResumeReadingModal.vue (선택적)

```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <h2 class="modal-title">이어서 읽기</h2>

        <p class="modal-text">
          마지막으로 읽던 곳이 있습니다.
        </p>

        <div class="last-position">
          <i class="fa-solid fa-bookmark" />
          <span>{{ bookName }} {{ chapter }}장</span>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="startFresh">처음부터</button>
          <button class="btn-primary" @click="resume">이어서 읽기</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps<{
  modelValue: boolean;
  bookName: string;
  chapter: number;
}>();

const emit = defineEmits(['update:modelValue', 'resume', 'start-fresh']);

const close = () => emit('update:modelValue', false);
const resume = () => {
  emit('resume');
  close();
};
const startFresh = () => {
  emit('start-fresh');
  close();
};
</script>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**저장:**
- [ ] 창세기 5장으로 이동
- [ ] 잠시 후 다른 페이지로 이동
- [ ] API 로그에서 위치 저장 확인

**복원:**
- [ ] `/bible` 접속
- [ ] 자동으로 마지막 위치 (창세기 5장)로 이동
- [ ] 스크롤 위치도 복원

**설정별 동작:**
- [ ] 설정에서 "기본 진입점" 변경
- [ ] 각 설정에 따른 동작 확인

**멀티 디바이스:**
- [ ] 다른 브라우저/시크릿 모드에서 동일 계정 로그인
- [ ] 마지막 위치 동기화 확인

---

## 완료 기준

1. 위치 자동 저장
2. 위치 자동 복원
3. 설정에 따른 진입점 동작
4. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
