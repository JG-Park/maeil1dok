# Task 2-2: 읽기모드 구현

> **Phase**: 2 - 핵심 기능
> **상태**: ⬜ 대기
> **의존성**: Task 2-1 완료 필요

---

## 목표

- 읽기모드 (Plan 없이 자유롭게 성경 읽기)
- 개인 읽기 기록 (`PersonalReadingRecord`) 연동
- "읽음으로 표시" 수동 버튼 구현

---

## 서브태스크

### 2.2.1 읽기모드 UI
- [ ] 읽기모드 인식 (plan 파라미터 없음)
- [ ] "읽음으로 표시" 버튼 추가 (하단 네비게이션)
- [ ] 이미 읽은 장 표시 (체크 아이콘)

### 2.2.2 개인 읽기 기록 API 연동
- [ ] `usePersonalRecord` composable 구현
- [ ] POST `/api/v1/bible/personal-records/` 연동
- [ ] GET `/api/v1/bible/personal-records/by-book/` 연동
- [ ] 읽음 상태 캐싱

### 2.2.3 읽음 표시 로직
- [ ] 버튼 클릭 시 API 호출
- [ ] 성공 시 토스트 메시지
- [ ] 이미 읽은 장 재클릭 시 토글 (읽지 않음으로 변경) 또는 무시
- [ ] 비로그인 사용자 처리 (로그인 유도)

### 2.2.4 읽기 진도 표시
- [ ] 현재 책의 읽은 장 수 / 전체 장 수 표시
- [ ] 진도 바 또는 텍스트로 표시

---

## 구현 상세

### usePersonalRecord.ts

```typescript
// composables/usePersonalRecord.ts
import { ref, computed } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';

export const usePersonalRecord = () => {
  const api = useApi();
  const authStore = useAuthStore();

  const readChapters = ref<Map<string, Set<number>>>(new Map());
  const isLoading = ref(false);

  // 책별 읽은 장 조회
  const fetchReadChapters = async (book: string) => {
    if (!authStore.isAuthenticated) return;

    try {
      const response = await api.get('/api/v1/bible/personal-records/by-book/', {
        params: { book }
      });

      const chapters = new Set<number>(response.data.read_chapters || []);
      readChapters.value.set(book, chapters);
    } catch (error) {
      console.error('읽기 기록 조회 실패:', error);
    }
  };

  // 장 읽음 표시
  const markAsRead = async (book: string, chapter: number) => {
    if (!authStore.isAuthenticated) {
      throw new Error('로그인이 필요합니다');
    }

    try {
      await api.post('/api/v1/bible/personal-records/', { book, chapter });

      // 로컬 캐시 업데이트
      if (!readChapters.value.has(book)) {
        readChapters.value.set(book, new Set());
      }
      readChapters.value.get(book)!.add(chapter);

      return true;
    } catch (error: any) {
      // 중복 저장은 성공으로 처리
      if (error.response?.status === 400) {
        return true;
      }
      throw error;
    }
  };

  // 특정 장 읽음 여부 확인
  const isChapterRead = (book: string, chapter: number) => {
    return readChapters.value.get(book)?.has(chapter) || false;
  };

  // 책별 진도
  const getBookProgress = (book: string, totalChapters: number) => {
    const read = readChapters.value.get(book)?.size || 0;
    return { read, total: totalChapters, percentage: (read / totalChapters) * 100 };
  };

  return {
    readChapters,
    isLoading,
    fetchReadChapters,
    markAsRead,
    isChapterRead,
    getBookProgress
  };
};
```

### 읽음 버튼 UI

```vue
<!-- BibleNavigation.vue 내부 -->
<template>
  <div class="navigation-controls">
    <!-- 기존 이전/다음 버튼 -->
    <button class="nav-btn prev" @click="$emit('prev')" :disabled="!hasPrev">
      <i class="fa-solid fa-chevron-left" />
      이전
    </button>

    <div class="chapter-info">
      {{ bookName }} {{ chapter }}장
    </div>

    <button class="nav-btn next" @click="$emit('next')" :disabled="!hasNext">
      다음
      <i class="fa-solid fa-chevron-right" />
    </button>
  </div>

  <!-- 읽기모드: 읽음 버튼 -->
  <div v-if="!isTongdokMode" class="reading-action">
    <button
      class="mark-read-btn"
      :class="{ 'is-read': isRead }"
      @click="handleMarkRead"
      :disabled="isLoading"
    >
      <i :class="isRead ? 'fa-solid fa-check-circle' : 'fa-regular fa-circle-check'" />
      {{ isRead ? '읽음 완료' : '읽음으로 표시' }}
    </button>

    <!-- 진도 표시 -->
    <div class="progress-info" v-if="progress">
      <span class="progress-text">{{ progress.read }} / {{ progress.total }}장</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress.percentage}%` }" />
      </div>
    </div>
  </div>
</template>
```

### 스타일

```css
.reading-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.mark-read-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mark-read-btn:hover {
  background: var(--color-primary-dark);
}

.mark-read-btn.is-read {
  background: var(--color-success);
}

.mark-read-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 200px;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)
- [ ] `/bible?book=gen&chapter=1` 접속 (읽기모드)
- [ ] "읽음으로 표시" 버튼 표시
- [ ] 버튼 클릭 시 API 호출
- [ ] 성공 시 버튼 상태 변경 ("읽음 완료")
- [ ] 토스트 메시지 표시
- [ ] 페이지 새로고침 후 읽음 상태 유지
- [ ] 다른 장으로 이동 후 돌아왔을 때 상태 유지
- [ ] 진도 표시 (X / Y장)
- [ ] 비로그인 시 로그인 유도 모달

---

## 완료 기준

1. 읽기모드에서 "읽음으로 표시" 버튼 동작
2. API 연동 정상
3. 읽음 상태 시각적 피드백
4. 진도 표시 정상
5. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
