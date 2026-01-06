# TASK-08: 에러 핸들링 표준화

> **Priority**: P2 (Minor)
> **Status**: `[ ]` Pending
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

에러 핸들링 패턴이 파일마다 다릅니다.

### 현재 패턴들

#### 패턴 1: toast만 사용

```typescript
} catch (error) {
  toast.error('북마크 삭제에 실패했습니다');
}
```

#### 패턴 2: console.error + toast

```typescript
} catch (error) {
  console.error('북마크 로드 실패:', error);
  toast.error('북마크를 불러오는데 실패했습니다');
}
```

#### 패턴 3: 무시

```typescript
} catch {
  // Fallback for older browsers
}
```

#### 패턴 4: 조용한 실패

```typescript
} catch (error) {
  // 사용자가 취소한 경우 무시
  if ((err as Error).name !== 'AbortError') {
    await copyToClipboard(shareUrl);
  }
}
```

### 문제점

1. 개발 환경에서 디버깅 어려움
2. 프로덕션에서 에러 추적 불가
3. 사용자에게 일관된 피드백 제공 안 됨
4. 에러 유형별 처리 없음

---

## Goal

일관된 에러 핸들링 패턴 수립 및 적용

---

## Tasks

### 1. 에러 핸들링 유틸리티 생성

- [ ] `composables/useErrorHandler.ts` 생성
- [ ] 에러 유형별 처리 로직 정의
- [ ] 로깅/리포팅 통합

### 2. 표준 패턴 정의

#### API 에러

```typescript
const { handleApiError } = useErrorHandler();

try {
  await api.delete(...);
} catch (error) {
  handleApiError(error, '북마크 삭제');
  // 내부적으로: console.error + toast + (선택) 에러 리포팅
}
```

#### 사용자 액션 에러 (취소 가능)

```typescript
const { handleUserActionError } = useErrorHandler();

try {
  await navigator.share(shareData);
} catch (error) {
  handleUserActionError(error, '공유');
  // AbortError는 무시, 나머지는 폴백 처리
}
```

### 3. 각 파일 수정

- [ ] `pages/bible/index.vue`
- [ ] `pages/bible/bookmarks.vue`
- [ ] `pages/bible/settings.vue`
- [ ] `pages/bible/notes/index.vue`
- [ ] `pages/bible/notes/[id].vue`
- [ ] `components/bible/BibleHome.vue`
- [ ] `components/bible/BibleViewer.vue`

---

## Proposed Error Handler

```typescript
// composables/useErrorHandler.ts

import { useToast } from '~/composables/useToast';

interface ErrorHandlerOptions {
  silent?: boolean;
  showToast?: boolean;
  logToConsole?: boolean;
}

export function useErrorHandler() {
  const toast = useToast();
  const isDev = process.dev;

  /**
   * API 에러 처리
   */
  const handleApiError = (
    error: unknown,
    context: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const { silent = false, showToast = true, logToConsole = isDev } = options;

    if (logToConsole) {
      console.error(`[API Error] ${context}:`, error);
    }

    if (!silent && showToast) {
      const message = getErrorMessage(error) || `${context}에 실패했습니다`;
      toast.error(message);
    }

    // 프로덕션 에러 리포팅 (Sentry 등)
    // if (!isDev) reportError(error, context);
  };

  /**
   * 사용자 액션 에러 처리 (취소 가능한 액션)
   */
  const handleUserActionError = (
    error: unknown,
    context: string,
    fallback?: () => void | Promise<void>
  ) => {
    // 사용자 취소는 무시
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }

    if (isDev) {
      console.warn(`[User Action] ${context}:`, error);
    }

    // 폴백 실행
    if (fallback) {
      fallback();
    }
  };

  /**
   * 에러에서 메시지 추출
   */
  const getErrorMessage = (error: unknown): string | null => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null) {
      const e = error as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
      if (e.response && typeof e.response === 'object') {
        const resp = e.response as Record<string, unknown>;
        if (resp.data && typeof resp.data === 'object') {
          const data = resp.data as Record<string, unknown>;
          if (typeof data.message === 'string') return data.message;
          if (typeof data.detail === 'string') return data.detail;
        }
      }
    }
    return null;
  };

  return {
    handleApiError,
    handleUserActionError,
    getErrorMessage,
  };
}
```

---

## Files Affected

| File | Action |
|------|--------|
| `composables/useErrorHandler.ts` | Create |
| 모든 Bible 관련 파일 | Modify |

---

## Acceptance Criteria

- [ ] 에러 핸들링 유틸리티 생성됨
- [ ] 모든 파일에서 일관된 패턴 사용
- [ ] 개발 환경에서 디버깅 용이
- [ ] 사용자에게 일관된 피드백
- [ ] 기존 기능 정상 동작

---

## Dependencies

- 없음

## Dependent Tasks

- 없음

---

## Completion

- [ ] 코드 변경 완료
- [ ] 테스트 통과
- [ ] 커밋 발행
- [ ] TRACKER.md 상태 업데이트
