/**
 * Reading Position Composable
 *
 * 마지막 읽기 위치 저장/복원 기능 제공
 * - 서버와 동기화 (로그인 사용자)
 * - localStorage 폴백 (비로그인 사용자)
 *
 * 중요: 페이지 초기화 중에는 저장하지 않음 (enableSaving 플래그로 제어)
 */
import { ref, type Ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useApi } from './useApi';

export interface ReadingPosition {
  book: string;
  chapter: number;
  scroll_position: number;
  version: string;
  updated_at?: string;
}

const STORAGE_KEY = 'lastReadingPosition';

export const useReadingPosition = () => {
  const authStore = useAuthStore();
  const api = useApi();

  // 상태
  const lastReadingPosition: Ref<ReadingPosition | null> = ref(null);
  const showResumeModal = ref(false);
  const isSavingPosition = ref(false);
  const lastSavedScrollPosition = ref(0);

  /**
   * 저장 활성화 플래그: 페이지 초기화 완료 후 true로 설정 필수
   * false 상태에서는 saveReadingPosition()이 아무 동작도 하지 않음
   */
  const isSavingEnabled = ref(false);

  const lastSavedPosition = ref<{ book: string; chapter: number; version: string } | null>(null);

  // debounce용 타이머
  let savePositionTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * localStorage에서 위치 로드
   */
  const loadFromLocalStorage = (): ReadingPosition | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  /**
   * localStorage에 위치 저장
   */
  const saveToLocalStorage = (position: ReadingPosition): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch (e) {
      console.warn('Failed to save reading position to localStorage:', e);
    }
  };

  const loadReadingPosition = async (): Promise<ReadingPosition | null> => {
    const localPosition = loadFromLocalStorage();

    if (!authStore.isAuthenticated) {
      lastReadingPosition.value = localPosition;
      return lastReadingPosition.value;
    }

    try {
      const response = await api.get('/api/v1/todos/bible/reading-position/');
      const serverPosition = response.data?.success ? response.data.position : null;

      if (serverPosition) {
        const mergedPosition: ReadingPosition = {
          ...serverPosition,
          version: serverPosition.version || localPosition?.version || 'GAE',
        };
        lastReadingPosition.value = mergedPosition;
        saveToLocalStorage(mergedPosition);
        return mergedPosition;
      }

      lastReadingPosition.value = localPosition;
      return lastReadingPosition.value;
    } catch (error) {
      console.error('읽기 위치 불러오기 실패:', error);
      lastReadingPosition.value = localPosition;
      return lastReadingPosition.value;
    }
  };

  const saveReadingPosition = async (
    book: string,
    chapter: number,
    version: string,
    immediate = false
  ): Promise<void> => {
    if (!isSavingEnabled.value && !immediate) return;

    const scrollPosition = typeof window !== 'undefined'
      ? window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) || 0
      : 0;

    const isSameLocation = lastSavedPosition.value &&
      lastSavedPosition.value.book === book &&
      lastSavedPosition.value.chapter === chapter &&
      lastSavedPosition.value.version === version;

    const scrollDeltaTooSmall = Math.abs(scrollPosition - lastSavedScrollPosition.value) < 0.05;
    if (isSameLocation && !immediate && scrollDeltaTooSmall) {
      return;
    }

    const position: ReadingPosition = {
      book,
      chapter,
      scroll_position: scrollPosition,
      version,
      updated_at: new Date().toISOString()
    };

    saveToLocalStorage(position);
    lastReadingPosition.value = position;
    lastSavedScrollPosition.value = scrollPosition;
    lastSavedPosition.value = { book, chapter, version };

    // 비로그인 시 localStorage만 저장하고 종료
    if (!authStore.isAuthenticated) return;

    // debounce 처리
    if (savePositionTimeout) {
      clearTimeout(savePositionTimeout);
    }

    const doSave = async () => {
      isSavingPosition.value = true;
      try {
        await api.post('/api/v1/todos/bible/reading-position/', {
          book,
          chapter,
          scroll_position: scrollPosition,
          version
        });
      } catch (error) {
        console.error('읽기 위치 저장 실패:', error);
      } finally {
        isSavingPosition.value = false;
      }
    };

    if (immediate) {
      await doSave();
    } else {
      savePositionTimeout = setTimeout(doSave, 1500); // 1.5초 debounce
    }
  };

  /**
   * 저장된 위치로 스크롤 복원
   */
  const restoreScrollPosition = (scrollPosition: number): void => {
    const scrollTarget = scrollPosition * (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  };

  /**
   * 이어서 읽기 모달 표시 여부 결정
   */
  const checkAndShowResumeModal = (currentBook: string, currentChapter: number): boolean => {
    if (!lastReadingPosition.value) return false;

    const { book, chapter } = lastReadingPosition.value;

    // 현재 위치와 저장된 위치가 다르면 모달 표시
    if (book !== currentBook || chapter !== currentChapter) {
      showResumeModal.value = true;
      return true;
    }

    return false;
  };

  /**
   * 새로 시작 (모달 닫기)
   */
  const startFresh = (): void => {
    showResumeModal.value = false;
    lastReadingPosition.value = null;
  };

  const cleanup = (): void => {
    if (savePositionTimeout) {
      clearTimeout(savePositionTimeout);
      savePositionTimeout = null;
    }
    isSavingEnabled.value = false;
    lastSavedPosition.value = null;
  };

  const enableSaving = (): void => {
    isSavingEnabled.value = true;
  };

  const disableSaving = (): void => {
    isSavingEnabled.value = false;
  };

  return {
    lastReadingPosition,
    showResumeModal,
    isSavingPosition,
    lastSavedScrollPosition,
    isSavingEnabled,

    loadReadingPosition,
    saveReadingPosition,
    restoreScrollPosition,
    checkAndShowResumeModal,
    startFresh,
    cleanup,
    enableSaving,
    disableSaving,
  };
};
