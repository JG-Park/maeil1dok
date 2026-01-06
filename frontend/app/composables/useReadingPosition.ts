/**
 * Reading Position Composable
 *
 * 마지막 읽기 위치 저장/복원 기능 제공
 * - 서버와 동기화 (로그인 사용자)
 * - localStorage 폴백 (비로그인 사용자)
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

  /**
   * 마지막 읽기 위치 불러오기
   */
  const loadReadingPosition = async (): Promise<ReadingPosition | null> => {
    // 비로그인 시 localStorage에서 조회
    if (!authStore.isAuthenticated) {
      lastReadingPosition.value = loadFromLocalStorage();
      return lastReadingPosition.value;
    }

    try {
      const response = await api.get('/api/v1/todos/bible/reading-position/');
      const position = response.data?.success ? response.data.position : null;
      lastReadingPosition.value = position;
      // localStorage에도 동기화
      if (position) {
        saveToLocalStorage(position);
      }
      return position;
    } catch (error) {
      console.error('읽기 위치 불러오기 실패:', error);
      // 서버 실패 시 localStorage 폴백
      lastReadingPosition.value = loadFromLocalStorage();
      return lastReadingPosition.value;
    }
  };

  /**
   * 마지막 읽기 위치 저장 (debounced)
   */
  const saveReadingPosition = async (
    book: string,
    chapter: number,
    version: string,
    immediate = false
  ): Promise<void> => {
    // 현재 스크롤 위치 계산
    const scrollPosition = typeof window !== 'undefined'
      ? window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) || 0
      : 0;

    // 이전 저장 위치와 차이가 작으면 저장하지 않음 (5% 미만) - 스크롤만
    if (!immediate && Math.abs(scrollPosition - lastSavedScrollPosition.value) < 0.05) return;

    const position: ReadingPosition = {
      book,
      chapter,
      scroll_position: scrollPosition,
      version,
      updated_at: new Date().toISOString()
    };

    // 항상 localStorage에 저장 (즉시)
    saveToLocalStorage(position);
    lastReadingPosition.value = position;
    lastSavedScrollPosition.value = scrollPosition;

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

  /**
   * cleanup - 컴포넌트 unmount 시 호출
   */
  const cleanup = (): void => {
    if (savePositionTimeout) {
      clearTimeout(savePositionTimeout);
      savePositionTimeout = null;
    }
  };

  return {
    // 상태
    lastReadingPosition,
    showResumeModal,
    isSavingPosition,
    lastSavedScrollPosition,

    // 함수
    loadReadingPosition,
    saveReadingPosition,
    restoreScrollPosition,
    checkAndShowResumeModal,
    startFresh,
    cleanup,
  };
};
